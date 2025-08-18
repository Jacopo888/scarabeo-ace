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

function generateInitialBoard(tileBag: Tile[]): Map<string, PlacedTile> {
  const board = new Map<string, PlacedTile>()

  // Start with a word at center
  const word = BASIC_WORDS[Math.floor(Math.random() * BASIC_WORDS.length)]
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

  // Add one crossing word
  const crossWords = ['CAT', 'DOG', 'TOP', 'RUN', 'SUN']
  const crossWord = crossWords[Math.floor(Math.random() * crossWords.length)]
  
  // Place vertically crossing the center word
  const crossCol = 7
  const crossStartRow = 9
  
  for (let i = 0; i < crossWord.length; i++) {
    const row = crossStartRow + i
    if (row >= 15) break
    
    const letter = crossWord[i]
    if (!board.has(`${row},${crossCol}`)) {
      const tileIndex = tileBag.findIndex(t => t.letter === letter)
      if (tileIndex >= 0) {
        const tile = tileBag.splice(tileIndex, 1)[0]
        board.set(`${row},${crossCol}`, {
          ...tile,
          letter,
          row,
          col: crossCol
        })
      }
    }
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
    // Fallback moves if dictionary not loaded
    return [{
      tiles: Array.from(board.values()).slice(0, 2),
      words: ['WORD'],
      score: 50
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
    .map(move => ({
      tiles: move.tiles,
      words: move.words,
      score: move.score
    }))
}

export function generateLocal15x15RushPuzzle(
  isValidWord: (word: string) => boolean,
  isDictionaryLoaded: boolean
): RushPuzzle {
  let attempts = 0
  const maxAttempts = 5
  
  while (attempts < maxAttempts) {
    const tileBag = shuffleArray([...TILE_DISTRIBUTION])
    const board = generateInitialBoard(tileBag)
    const rack = tileBag.splice(0, 7)
    
    const topMoves = generateTopMovesWithBot(board, rack, isValidWord, isDictionaryLoaded)
    
    if (topMoves.length >= 3 && topMoves[0].score >= 45) {
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
  const board = generateInitialBoard(tileBag)
  const rack = tileBag.splice(0, 7)
  
  return {
    id: `local-fallback-${Date.now()}`,
    board: Array.from(board.values()),
    rack: shuffleArray(rack),
    topMoves: [{
      tiles: Array.from(board.values()).slice(0, 2),
      words: ['WORD'],
      score: 50
    }]
  }
}