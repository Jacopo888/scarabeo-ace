import { Tile, PlacedTile } from './game'

export interface RushMove {
  tiles: PlacedTile[]
  words: string[]
  score: number
  anchorCell?: { row: number, col: number }
  mainWordLength?: number
  lettersUsed?: string[]
}

export interface RushPuzzle {
  id: string
  board: PlacedTile[]  // Only occupied cells
  rack: Tile[]
  topMoves: RushMove[]
}

export interface RushGameState {
  puzzle: RushPuzzle | null
  foundMoves: Set<string>
  pendingTiles: PlacedTile[]
  remainingRack: Tile[]
  isGameOver: boolean
  totalScore: number
  hints: {
    currentMoveIndex: number
    anchorRevealed: boolean
    lengthRevealed: boolean
    lettersRevealed: boolean
  }
}