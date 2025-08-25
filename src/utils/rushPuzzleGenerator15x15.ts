// Local fallback puzzle generator for 15x15 Rush mode
import { Tile, PlacedTile, TILE_DISTRIBUTION } from '@/types/game'
import { RushPuzzle, RushMove } from '@/types/rush'
import { ScrabbleBot } from '@/ai/ScrabbleBot'
import { validateMoveLogic } from '@/utils/moveValidation'
import { findNewWordsFormed } from '@/utils/newWordFinder'
import { calculateNewMoveScore } from '@/utils/newScoring'

const BASIC_WORDS = ['GAME', 'PLAY', 'WORD', 'QUIZ', 'STAR', 'TEAM', 'CODE', 'DATA', 'TEST']

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateConnectedBoard(tileBag: Tile[]): Map<string, PlacedTile> {
  const board = new Map<string, PlacedTile>()

  // Start with a word at center (horizontally)
  const centerWords = ['GAME', 'PLAY', 'WORD', 'QUIZ', 'STAR', 'TEAM']
  const word = centerWords[Math.floor(Math.random() * centerWords.length)]
  const startCol = 7 - Math.floor(word.length / 2)
  
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]
    const tileIndex = tileBag.findIndex(t => t.letter === letter)
    if (tileIndex >= 0) {
      const tile = tileBag.splice(tileIndex, 1)[0]
      board.set(`7,${startCol + i}`, {
        ...tile,
        letter,
        row: 7,
        col: startCol + i
      })
    }
  }

  // Add crossing words that connect properly
  const crossWords = [
    { word: 'CAT', row: 5, col: 7, direction: 'vertical' },
    { word: 'DOG', row: 8, col: 7, direction: 'vertical' },
    { word: 'TOP', row: 7, col: 4, direction: 'horizontal' },
    { word: 'SUN', row: 6, col: 8, direction: 'vertical' },
    { word: 'RUN', row: 7, col: 10, direction: 'horizontal' }
  ]
  
  // Place 2-3 crossing words that actually connect
  const selectedCrossWords = shuffleArray(crossWords).slice(0, Math.random() > 0.5 ? 3 : 2)
  
  for (const cross of selectedCrossWords) {
    let canPlace = true
    const newPositions: Array<{row: number, col: number, letter: string}> = []
    
    for (let i = 0; i < cross.word.length; i++) {
      const row = cross.direction === 'vertical' ? cross.row + i : cross.row
      const col = cross.direction === 'horizontal' ? cross.col + i : cross.col
      
      if (row < 0 || row >= 15 || col < 0 || col >= 15) {
        canPlace = false
        break
      }
      
      const existing = board.get(`${row},${col}`)
      if (existing) {
        // Must match for crossing
        if (existing.letter !== cross.word[i]) {
          canPlace = false
          break
        }
      } else {
        newPositions.push({ row, col, letter: cross.word[i] })
      }
    }
    
    // Ensure at least one connection
    const hasConnection = cross.word.split('').some((letter, i) => {
      const row = cross.direction === 'vertical' ? cross.row + i : cross.row
      const col = cross.direction === 'horizontal' ? cross.col + i : cross.col
      return board.has(`${row},${col}`)
    })
    
    if (canPlace && hasConnection) {
      for (const pos of newPositions) {
        const tileIndex = tileBag.findIndex(t => t.letter === pos.letter)
        if (tileIndex >= 0) {
          const tile = tileBag.splice(tileIndex, 1)[0]
          board.set(`${pos.row},${pos.col}`, {
            ...tile,
            letter: pos.letter,
            row: pos.row,
            col: pos.col
          })
        }
      }
    }
  }

  // Simulate additional moves to make it look mid-game
  return simulateAdditionalMoves(board, tileBag)
}

function simulateAdditionalMoves(board: Map<string, PlacedTile>, tileBag: Tile[]): Map<string, PlacedTile> {
  const bot = new ScrabbleBot((word) => true, true) // Accept all words for simulation
  
  for (let moveCount = 0; moveCount < 2; moveCount++) {
    const currentRack = tileBag.splice(0, 7)
    if (currentRack.length < 3) break
    
    const gameState = {
      board,
      players: [],
      currentPlayerIndex: 0,
      tileBag: [],
      gameStatus: 'playing' as const
    }
    
    const moves = bot.generateAllPossibleMoves(gameState, currentRack)
    const validMoves = moves.filter(move => move.score >= 15 && move.tiles.length >= 2)
    
    if (validMoves.length > 0) {
      const selectedMove = validMoves[Math.floor(Math.random() * Math.min(3, validMoves.length))]
      
      // Place the move on the board
      for (const tile of selectedMove.tiles) {
        board.set(`${tile.row},${tile.col}`, tile)
      }
      
      // Remove used tiles from rack
      for (const usedTile of selectedMove.tiles) {
        const rackIndex = currentRack.findIndex(t => t.letter === usedTile.letter && t.points === usedTile.points)
        if (rackIndex >= 0) {
          currentRack.splice(rackIndex, 1)
        }
      }
    }
    
    // Return unused tiles to bag
    tileBag.unshift(...currentRack)
  }
  
  return board
}

function generateTopMovesWithBot(
  board: Map<string, PlacedTile>, 
  rack: Tile[], 
  isValidWord: (word: string) => boolean,
  isDictionaryLoaded: boolean
): RushMove[] {
  const bot = new ScrabbleBot(isValidWord, isDictionaryLoaded)
  
  if (!isDictionaryLoaded) {
    // Fallback moves if dictionary not loaded with proper hint data
    const fallbackTiles = Array.from(board.values()).slice(0, 2)
    const startTile = fallbackTiles[0] ?? { row: 7, col: 7 }
    return [{
      tiles: fallbackTiles,
      words: ['WORD'],
      score: 50,
      startCell: { row: startTile.row, col: startTile.col },
      mainWordLength: 4,
      lettersUsed: rack.slice(0, 2).map(t => t.letter).sort()
    }]
  }
  
  const gameState = {
    board,
    players: [],
    currentPlayerIndex: 0,
    tileBag: [],
    gameStatus: 'playing' as const
  }
  
  const allMoves = bot.generateAllPossibleMoves(gameState, rack)
  
  // Filter for high-scoring moves and take top 5
  return allMoves
    .filter(move => move.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(move => {
      // Calculate hints for this move
      const isHorizontal = move.tiles.every(t => t.row === move.tiles[0].row)
      const startTile = isHorizontal
        ? move.tiles.reduce((min, t) => (t.col < min.col ? t : min), move.tiles[0])
        : move.tiles.reduce((min, t) => (t.row < min.row ? t : min), move.tiles[0])
      const startCell = { row: startTile.row, col: startTile.col }
      const mainWordLength = move.words.length > 0 ? Math.max(...move.words.map(w => w.length)) : undefined
      const lettersUsed = move.tiles.map(tile => tile.letter).sort()

      return {
        tiles: move.tiles,
        words: move.words,
        score: move.score,
        startCell,
        mainWordLength,
        lettersUsed
      }
    })
}

export function generateLocal15x15RushPuzzle(
  isValidWord: (word: string) => boolean,
  isDictionaryLoaded: boolean
): RushPuzzle {
  let attempts = 0
  const maxAttempts = 5
  
  while (attempts < maxAttempts) {
    const tileBag = shuffleArray([...TILE_DISTRIBUTION])
    const board = generateConnectedBoard(tileBag)
    const rack = tileBag.splice(0, 7)
    
    const topMoves = generateTopMovesWithBot(board, rack, isValidWord, isDictionaryLoaded)

    if (topMoves.length >= 3 && topMoves[0].score >= 30) {
      return {
        id: `local-15x15-${Date.now()}`,
        board: Array.from(board.values()),
        rack: shuffleArray(rack),
        topMoves
      }
    }
    
    attempts++
  }
  
  // Fallback
  const tileBag = shuffleArray([...TILE_DISTRIBUTION])
  const board = generateConnectedBoard(tileBag)
  const rack = tileBag.splice(0, 7)
  
  // Generate fallback moves with proper hint data
  const fallbackTiles = Array.from(board.values()).slice(0, 2)
  const startTile = fallbackTiles[0] ?? { row: 7, col: 7 }
  const fallbackMoves = [{
    tiles: fallbackTiles,
    words: ['WORD'],
    score: 50,
    startCell: { row: startTile.row, col: startTile.col },
    mainWordLength: 4,
    lettersUsed: rack.slice(0, 2).map(t => t.letter).sort()
  }]
  
  return {
    id: `local-fallback-${Date.now()}`,
    board: Array.from(board.values()),
    rack: shuffleArray(rack),
    topMoves: fallbackMoves
  }
}