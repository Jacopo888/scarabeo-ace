import { useState, useCallback } from 'react'
import { Difficulty } from '@/components/DifficultyModal'
import { GameState, Tile, PlacedTile } from '@/types/game'
import { validateMove } from '@/utils/gameRules'
import { findWordsOnBoard } from '@/utils/wordFinder'
import { calculateMoveScore } from '@/utils/scoring'
import { checkWords } from '@/utils/dictionary'

interface BotMove {
  tiles: PlacedTile[]
  score: number
  words: string[]
}

export const useBot = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [isBotThinking, setIsBotThinking] = useState(false)

  const generateAllPossibleMoves = useCallback((
    gameState: GameState,
    playerRack: Tile[]
  ): BotMove[] => {
    const moves: BotMove[] = []
    const board = gameState.board
    
    // If board is empty, start from center
    if (board.size === 0) {
      const centerMoves = generateCenterMoves(playerRack)
      moves.push(...centerMoves)
    } else {
      // Generate moves adjacent to existing tiles
      const adjacentMoves = generateAdjacentMoves(board, playerRack)
      moves.push(...adjacentMoves)
    }
    
    return moves.filter(move => {
      const validation = validateMove(board, move.tiles)
      if (!validation.isValid) return false
      
      const words = findWordsOnBoard(board, move.tiles)
      return checkWords(words.map(w => w.word))
    })
  }, [])

  const generateCenterMoves = useCallback((rack: Tile[]): BotMove[] => {
    const moves: BotMove[] = []
    const centerRow = 7
    const centerCol = 7
    
    // Try horizontal words through center
    for (let length = 2; length <= Math.min(rack.length, 7); length++) {
      for (let startCol = Math.max(0, centerCol - length + 1); startCol <= centerCol; startCol++) {
        if (startCol + length > 15) continue
        
        const tiles = rack.slice(0, length).map((tile, i) => ({
          ...tile,
          row: centerRow,
          col: startCol + i
        }))
        
        if (tiles.some(t => t.row === centerRow && t.col === centerCol)) {
          const words = findWordsOnBoard(new Map(), tiles)
          if (words.length > 0 && checkWords(words.map(w => w.word))) {
            const score = calculateMoveScore(words, tiles)
            moves.push({ tiles, score, words: words.map(w => w.word) })
          }
        }
      }
    }
    
    // Try vertical words through center
    for (let length = 2; length <= Math.min(rack.length, 7); length++) {
      for (let startRow = Math.max(0, centerRow - length + 1); startRow <= centerRow; startRow++) {
        if (startRow + length > 15) continue
        
        const tiles = rack.slice(0, length).map((tile, i) => ({
          ...tile,
          row: startRow + i,
          col: centerCol
        }))
        
        if (tiles.some(t => t.row === centerRow && t.col === centerCol)) {
          const words = findWordsOnBoard(new Map(), tiles)
          if (words.length > 0 && checkWords(words.map(w => w.word))) {
            const score = calculateMoveScore(words, tiles)
            moves.push({ tiles, score, words: words.map(w => w.word) })
          }
        }
      }
    }
    
    return moves
  }, [])

  const generateAdjacentMoves = useCallback((
    board: Map<string, PlacedTile>,
    rack: Tile[]
  ): BotMove[] => {
    const moves: BotMove[] = []
    const adjacentPositions = new Set<string>()

    // Find all orthogonally adjacent positions to existing tiles
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1]   // right
    ] as const

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
    
    // Try placing words at adjacent positions
    for (const posKey of adjacentPositions) {
      const [row, col] = posKey.split(',').map(Number)
      
      // Try horizontal words starting at this position
      for (let length = 1; length <= Math.min(rack.length, 15 - col); length++) {
        const tiles = rack.slice(0, length).map((tile, i) => ({
          ...tile,
          row,
          col: col + i
        }))
        
        const words = findWordsOnBoard(board, tiles)
        if (words.length > 0 && checkWords(words.map(w => w.word))) {
          const score = calculateMoveScore(words, tiles)
          moves.push({ tiles, score, words: words.map(w => w.word) })
        }
      }
      
      // Try vertical words starting at this position
      for (let length = 1; length <= Math.min(rack.length, 15 - row); length++) {
        const tiles = rack.slice(0, length).map((tile, i) => ({
          ...tile,
          row: row + i,
          col
        }))
        
        const words = findWordsOnBoard(board, tiles)
        if (words.length > 0 && checkWords(words.map(w => w.word))) {
          const score = calculateMoveScore(words, tiles)
          moves.push({ tiles, score, words: words.map(w => w.word) })
        }
      }
    }
    
    return moves
  }, [])

  const selectBestMove = useCallback((moves: BotMove[], difficulty: Difficulty): BotMove | null => {
    if (moves.length === 0) return null
    
    // Sort moves by score
    const sortedMoves = [...moves].sort((a, b) => b.score - a.score)
    
    switch (difficulty) {
      case 'easy':
        // Choose from bottom 50% of moves, or a random move
        const easyMoves = sortedMoves.slice(Math.floor(sortedMoves.length * 0.5))
        return easyMoves[Math.floor(Math.random() * easyMoves.length)] || sortedMoves[0]
      
      case 'medium':
        // Choose from top 75% of moves
        const mediumMoves = sortedMoves.slice(0, Math.ceil(sortedMoves.length * 0.75))
        return mediumMoves[Math.floor(Math.random() * mediumMoves.length)]
      
      case 'hard':
        // Always choose the best move
        return sortedMoves[0]
      
      default:
        return sortedMoves[0]
    }
  }, [])

  const makeBotMove = useCallback(async (): Promise<void> => {
    setIsBotThinking(true)
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    setIsBotThinking(false)
  }, [])

  return {
    difficulty,
    setDifficulty,
    makeBotMove,
    isBotThinking,
    generateAllPossibleMoves,
    selectBestMove
  }
}