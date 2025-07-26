import { PlacedTile } from '@/types/game'
import { findWordsOnBoard } from './wordFinder'
import { validateWords } from './dictionary'

export interface MoveValidation {
  isValid: boolean
  errors: string[]
  words: string[]
  score: number
}

export const validateMove = (
  board: Map<string, PlacedTile>,
  newTiles: PlacedTile[]
): MoveValidation => {
  const errors: string[] = []
  
  if (newTiles.length === 0) {
    return {
      isValid: false,
      errors: ['Devi piazzare almeno una tessera'],
      words: [],
      score: 0
    }
  }
  
  // Check if tiles are placed in a single row or column
  if (!aretilesInLine(newTiles)) {
    errors.push('Le tessere devono essere piazzate in una singola riga o colonna')
  }
  
  // Check if tiles are adjacent to existing tiles (except first move)
  if (board.size > 0 && !areNewTilesAdjacent(board, newTiles)) {
    errors.push('Le nuove tessere devono essere adiacenti a tessere già piazzate')
  }
  
  // Check if first move covers center square
  if (board.size === 0 && !coversCenter(newTiles)) {
    errors.push('La prima mossa deve coprire la casella centrale')
  }
  
  // Find all words formed by this move
  const allWords = findWordsOnBoard(board, newTiles)
  const wordStrings = allWords.map(w => w.word)
  
  // Validate all words in dictionary
  const { invalid } = validateWords(wordStrings)
  if (invalid.length > 0) {
    errors.push(`Parole non valide: ${invalid.join(', ')}`)
  }
  
  // Check if at least one word is formed
  if (allWords.length === 0) {
    errors.push('Devi formare almeno una parola')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    words: wordStrings,
    score: 0 // Will be calculated separately
  }
}

const aretilesInLine = (tiles: PlacedTile[]): boolean => {
  if (tiles.length <= 1) return true
  
  // Check if all tiles are in the same row
  const sameRow = tiles.every(tile => tile.row === tiles[0].row)
  if (sameRow) {
    // Check if tiles are consecutive
    const cols = tiles.map(t => t.col).sort((a, b) => a - b)
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] - cols[i - 1] > 1) {
        // Check if there's an existing tile filling the gap
        // This would need access to the board state
      }
    }
    return true
  }
  
  // Check if all tiles are in the same column
  const sameCol = tiles.every(tile => tile.col === tiles[0].col)
  if (sameCol) {
    // Check if tiles are consecutive
    const rows = tiles.map(t => t.row).sort((a, b) => a - b)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] - rows[i - 1] > 1) {
        // Check if there's an existing tile filling the gap
        // This would need access to the board state
      }
    }
    return true
  }
  
  return false
}

const areNewTilesAdjacent = (
  board: Map<string, PlacedTile>,
  newTiles: PlacedTile[]
): boolean => {
  return newTiles.some(tile => {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
    ]
    
    return directions.some(([dRow, dCol]) => {
      const adjacentKey = `${tile.row + dRow},${tile.col + dCol}`
      return board.has(adjacentKey)
    })
  })
}

const coversCenter = (tiles: PlacedTile[]): boolean => {
  return tiles.some(tile => tile.row === 7 && tile.col === 7)
}

export const canEndGame = (
  players: Array<{ rack: PlacedTile[] }>,
  tileBag: PlacedTile[]
): boolean => {
  // Game ends when:
  // 1. A player uses all their tiles and the bag is empty
  // 2. All players pass twice in a row
  // 3. No more valid moves possible
  
  return tileBag.length === 0 && players.some(player => player.rack.length === 0)
}

export const calculateEndGamePenalty = (rack: PlacedTile[]): number => {
  return rack.reduce((total, tile) => total + tile.points, 0)
}