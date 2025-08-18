import { TILE_DISTRIBUTION } from '../../../src/types/game'

interface Letter {
  letter: string
  points: number
}

interface RushPuzzle {
  id: string
  board: (string | null)[][]
  rack: Letter[]
  bestScore: number
}

// TWL06-inspired common words for puzzle generation
const COMMON_HIGH_SCORING_WORDS = [
  { word: 'QUIZ', score: 62, tiles: ['Q', 'U', 'I', 'Z'] },
  { word: 'FIZZ', score: 45, tiles: ['F', 'I', 'Z', 'Z'] },
  { word: 'BUZZ', score: 44, tiles: ['B', 'U', 'Z', 'Z'] },
  { word: 'JAZZ', score: 49, tiles: ['J', 'A', 'Z', 'Z'] },
  { word: 'FOXY', score: 42, tiles: ['F', 'O', 'X', 'Y'] },
  { word: 'COZY', score: 47, tiles: ['C', 'O', 'Z', 'Y'] },
  { word: 'WAXY', score: 47, tiles: ['W', 'A', 'X', 'Y'] }
]

function calculateWordScore(word: string): number {
  const letterValues: Record<string, number> = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
  }
  
  return word.split('').reduce((sum, letter) => sum + (letterValues[letter] || 0), 0)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateRandomRack(): Letter[] {
  const availableTiles = [...TILE_DISTRIBUTION]
  const rack: Letter[] = []
  
  for (let i = 0; i < 7; i++) {
    if (availableTiles.length === 0) break
    const randomIndex = Math.floor(Math.random() * availableTiles.length)
    const tile = availableTiles.splice(randomIndex, 1)[0]
    rack.push({ letter: tile.letter, points: tile.points })
  }
  
  return rack
}

function tryPlaceHighScoringWord(board: (string | null)[][], rack: Letter[]): { placed: boolean, score: number } {
  // Try to place one of the high-scoring words
  for (const wordData of COMMON_HIGH_SCORING_WORDS) {
    const canPlace = wordData.tiles.every(letter => 
      rack.some(tile => tile.letter === letter)
    )
    
    if (canPlace && wordData.word.length <= 5) {
      // Place word horizontally in middle row
      const startCol = Math.floor((5 - wordData.word.length) / 2)
      for (let i = 0; i < wordData.word.length; i++) {
        board[2][startCol + i] = wordData.word[i]
      }
      return { placed: true, score: wordData.score }
    }
  }
  
  return { placed: false, score: 0 }
}

export function generateRushPuzzle(): RushPuzzle {
  const id = `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const board: (string | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null))
  
  let rack = generateRandomRack()
  let bestScore = 0
  let attempts = 0
  const maxAttempts = 50
  
  // Try to generate a puzzle with a high-scoring word
  while (bestScore < 40 && attempts < maxAttempts) {
    // Reset board
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        board[i][j] = null
      }
    }
    
    rack = generateRandomRack()
    const result = tryPlaceHighScoringWord(board, rack)
    
    if (result.placed) {
      bestScore = result.score
      break
    }
    
    // If we can't place a high-scoring word, try to find best possible score
    bestScore = Math.max(bestScore, findBestPossibleScore(rack))
    attempts++
  }
  
  // Fallback: ensure minimum score
  if (bestScore < 40) {
    bestScore = 40
  }
  
  return {
    id,
    board,
    rack: shuffleArray(rack),
    bestScore
  }
}

function findBestPossibleScore(rack: Letter[]): number {
  // Simple heuristic: sum of highest value tiles
  const sorted = rack.sort((a, b) => b.points - a.points)
  return sorted.slice(0, 4).reduce((sum, tile) => sum + tile.points, 0)
}