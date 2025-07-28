import { GameState, Tile, PlacedTile } from '@/types/game'
import { validateMoveLogic } from '@/utils/moveValidation'
import { findNewWordsFormed } from '@/utils/newWordFinder'
import { calculateNewMoveScore } from '@/utils/newScoring'
import { Difficulty } from '@/components/DifficultyModal'

export interface BotMove {
  tiles: PlacedTile[]
  score: number
  words: string[]
  qualityScore: number
  strategicScore: number
  totalScore: number
}

interface MoveCandidate {
  tiles: PlacedTile[]
  usedTileIndices: number[]
}

export class ScrabbleBot {
  private isValidWordFn: (word: string) => boolean
  private isDictionaryLoaded: boolean

  constructor(isValidWordFn: (word: string) => boolean, isDictionaryLoaded: boolean) {
    this.isValidWordFn = isValidWordFn
    this.isDictionaryLoaded = isDictionaryLoaded
  }

  updateDictionary(isValidWordFn: (word: string) => boolean, isDictionaryLoaded: boolean) {
    this.isValidWordFn = isValidWordFn
    this.isDictionaryLoaded = isDictionaryLoaded
  }

  generateAllPossibleMoves(gameState: GameState, playerRack: Tile[]): BotMove[] {
    if (!this.isDictionaryLoaded) return []

    const moves: BotMove[] = []
    const board = gameState.board
    
    // If board is empty, start from center
    if (board.size === 0) {
      const centerMoves = this.generateCenterMoves(playerRack)
      moves.push(...centerMoves)
    } else {
      // Generate moves adjacent to existing tiles
      const adjacentMoves = this.generateAdjacentMoves(board, playerRack)
      moves.push(...adjacentMoves)
    }
    
    // Filter valid moves and calculate composite scores
    return moves
      .filter(move => {
        // First check move logic (placement rules)
        const validation = validateMoveLogic(board, move.tiles)
        if (!validation.isValid) return false
        
        // Then check if words are valid in dictionary
        const newWords = findNewWordsFormed(board, move.tiles)
        return newWords.length > 0 && newWords.every(w => this.isValidWordFn(w.word))
      })
      .map(move => this.calculateCompositeScore(move, playerRack))
  }

  selectBestMove(moves: BotMove[], difficulty: Difficulty): BotMove | null {
    if (moves.length === 0) return null

    // Sort moves by total composite score
    const sortedMoves = [...moves].sort((a, b) => b.totalScore - a.totalScore)
    
    // Apply Top-K + Soft-Max selection
    const k = this.getTopK(sortedMoves.length, difficulty)
    const topKMoves = sortedMoves.slice(0, k)
    
    return this.softMaxSelection(topKMoves, difficulty)
  }

  private generateCenterMoves(rack: Tile[]): BotMove[] {
    const moves: BotMove[] = []
    const centerRow = 7
    const centerCol = 7
    
    // Generate all possible tile combinations
    const candidates = this.generateTileCombinations(rack, centerRow, centerCol, true)
    
    for (const candidate of candidates) {
      const words = findNewWordsFormed(new Map(), candidate.tiles)
      if (words.length > 0 && words.every(w => this.isValidWordFn(w.word))) {
        const score = calculateNewMoveScore(words, candidate.tiles)
        moves.push({
          tiles: candidate.tiles,
          score,
          words: words.map(w => w.word),
          qualityScore: 0,
          strategicScore: 0,
          totalScore: 0
        })
      }
    }
    
    return moves
  }

  private generateAdjacentMoves(board: Map<string, PlacedTile>, rack: Tile[]): BotMove[] {
    const moves: BotMove[] = []
    const adjacentPositions = this.findAdjacentPositions(board)
    
    for (const [row, col] of adjacentPositions) {
      const candidates = this.generateTileCombinations(rack, row, col, false)
      
      for (const candidate of candidates) {
        // Check that tiles don't overlap with existing board tiles
        const hasOverlap = candidate.tiles.some(tile => {
          const key = `${tile.row},${tile.col}`
          return board.has(key)
        })
        
        if (!hasOverlap) {
          const words = findNewWordsFormed(board, candidate.tiles)
          if (words.length > 0 && words.every(w => this.isValidWordFn(w.word))) {
            const score = calculateNewMoveScore(words, candidate.tiles)
            moves.push({
              tiles: candidate.tiles,
              score,
              words: words.map(w => w.word),
              qualityScore: 0,
              strategicScore: 0,
              totalScore: 0
            })
          }
        }
      }
    }
    
    return moves
  }

  private generateTileCombinations(rack: Tile[], startRow: number, startCol: number, mustCoverCenter: boolean): MoveCandidate[] {
    const candidates: MoveCandidate[] = []
    const centerRow = 7, centerCol = 7
    
    // Try horizontal words
    for (let length = 1; length <= Math.min(rack.length, 7); length++) {
      for (let startOffset = 0; startOffset <= length - 1; startOffset++) {
        const actualStartCol = startCol - startOffset
        if (actualStartCol < 0 || actualStartCol + length > 15) continue
        
        // Generate permutations of rack tiles for this length
        const permutations = this.generatePermutations(rack, length)
        for (const perm of permutations) {
          const tiles = perm.tiles.map((tile, i) => ({
            ...tile,
            row: startRow,
            col: actualStartCol + i
          }))
          
          const coversCenterCheck = !mustCoverCenter || tiles.some(t => t.row === centerRow && t.col === centerCol)
          if (coversCenterCheck) {
            candidates.push({ tiles, usedTileIndices: perm.indices })
          }
        }
      }
    }
    
    // Try vertical words
    for (let length = 1; length <= Math.min(rack.length, 7); length++) {
      for (let startOffset = 0; startOffset <= length - 1; startOffset++) {
        const actualStartRow = startRow - startOffset
        if (actualStartRow < 0 || actualStartRow + length > 15) continue
        
        const permutations = this.generatePermutations(rack, length)
        for (const perm of permutations) {
          const tiles = perm.tiles.map((tile, i) => ({
            ...tile,
            row: actualStartRow + i,
            col: startCol
          }))
          
          const coversCenterCheck = !mustCoverCenter || tiles.some(t => t.row === centerRow && t.col === centerCol)
          if (coversCenterCheck) {
            candidates.push({ tiles, usedTileIndices: perm.indices })
          }
        }
      }
    }
    
    return candidates
  }

  private generatePermutations(rack: Tile[], length: number): Array<{ tiles: Tile[], indices: number[] }> {
    const results: Array<{ tiles: Tile[], indices: number[] }> = []
    
    const backtrack = (currentTiles: Tile[], currentIndices: number[], usedIndices: Set<number>) => {
      if (currentTiles.length === length) {
        results.push({ tiles: [...currentTiles], indices: [...currentIndices] })
        return
      }
      
      for (let i = 0; i < rack.length; i++) {
        if (!usedIndices.has(i)) {
          usedIndices.add(i)
          currentTiles.push(rack[i])
          currentIndices.push(i)
          backtrack(currentTiles, currentIndices, usedIndices)
          currentTiles.pop()
          currentIndices.pop()
          usedIndices.delete(i)
        }
      }
    }
    
    backtrack([], [], new Set())
    return results.slice(0, 100) // Limit to prevent performance issues
  }

  private findAdjacentPositions(board: Map<string, PlacedTile>): Array<[number, number]> {
    const adjacentPositions = new Set<string>()
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const

    for (const [key] of board) {
      const [row, col] = key.split(',').map(Number)
      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc
        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
          const newKey = `${newRow},${newCol}`
          if (!board.has(newKey)) {
            adjacentPositions.add(newKey)
          }
        }
      }
    }
    
    return Array.from(adjacentPositions).map(key => {
      const [row, col] = key.split(',').map(Number)
      return [row, col] as [number, number]
    })
  }

  private calculateCompositeScore(move: BotMove, playerRack: Tile[]): BotMove {
    // Base score from the move
    const baseScore = move.score
    
    // Quality score: evaluate remaining tiles after this move
    const remainingTiles = this.getRemainingTiles(playerRack, move.tiles)
    const qualityScore = this.calculateTileQuality(remainingTiles)
    
    // Strategic score: bonuses for using high-value tiles, creating opportunities
    const strategicScore = this.calculateStrategicScore(move)
    
    // Weighted composite score
    const totalScore = baseScore * 0.7 + qualityScore * 0.2 + strategicScore * 0.1
    
    return {
      ...move,
      qualityScore,
      strategicScore,
      totalScore
    }
  }

  private getRemainingTiles(rack: Tile[], usedTiles: PlacedTile[]): Tile[] {
    const rackCopy = [...rack]
    const usedLetters = usedTiles.map(t => t.letter)
    
    for (const letter of usedLetters) {
      const index = rackCopy.findIndex(t => t.letter === letter)
      if (index !== -1) {
        rackCopy.splice(index, 1)
      }
    }
    
    return rackCopy
  }

  private calculateTileQuality(tiles: Tile[]): number {
    // Higher score for tiles that are easier to use (common letters, balanced points)
    let quality = 0
    const commonLetters = ['A', 'E', 'I', 'O', 'U', 'N', 'R', 'T', 'L', 'S']
    
    for (const tile of tiles) {
      if (commonLetters.includes(tile.letter)) {
        quality += 3
      } else if (tile.points <= 3) {
        quality += 2
      } else if (tile.points <= 6) {
        quality += 1
      }
      // High point tiles get no bonus as they're harder to use
    }
    
    return quality
  }

  private calculateStrategicScore(move: BotMove): number {
    let strategic = 0
    
    // Bonus for using all 7 tiles (bingo)
    if (move.tiles.length === 7) {
      strategic += 50
    }
    
    // Bonus for longer words
    for (const word of move.words) {
      if (word.length >= 6) strategic += word.length * 2
      else if (word.length >= 4) strategic += word.length
    }
    
    // Bonus for using high-value tiles
    for (const tile of move.tiles) {
      if (tile.points >= 8) strategic += tile.points
    }
    
    return strategic
  }

  private getTopK(totalMoves: number, difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return Math.min(Math.max(Math.floor(totalMoves * 0.6), 3), totalMoves)
      case 'medium': return Math.min(Math.max(Math.floor(totalMoves * 0.3), 2), totalMoves)
      case 'hard': return Math.min(Math.max(Math.floor(totalMoves * 0.1), 1), totalMoves)
      default: return 1
    }
  }

  private softMaxSelection(moves: BotMove[], difficulty: Difficulty): BotMove {
    if (moves.length === 1) return moves[0]
    
    const temperature = this.getTemperature(difficulty)
    const scores = moves.map(m => m.totalScore)
    const maxScore = Math.max(...scores)
    
    // Apply temperature and calculate probabilities
    const expScores = scores.map(score => Math.exp((score - maxScore) / temperature))
    const sumExpScores = expScores.reduce((sum, exp) => sum + exp, 0)
    const probabilities = expScores.map(exp => exp / sumExpScores)
    
    // Weighted random selection
    const random = Math.random()
    let cumulativeProbability = 0
    
    for (let i = 0; i < moves.length; i++) {
      cumulativeProbability += probabilities[i]
      if (random <= cumulativeProbability) {
        return moves[i]
      }
    }
    
    return moves[0] // Fallback
  }

  private getTemperature(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return 50    // High temperature = more randomness
      case 'medium': return 20  // Medium temperature
      case 'hard': return 5     // Low temperature = more deterministic
      default: return 20
    }
  }
}