export interface Tile {
  letter: string
  points: number
  isBlank?: boolean
}

export interface PlacedTile extends Tile {
  row: number
  col: number
}

export interface Player {
  id: string
  name: string
  score: number
  rack: Tile[]
}

export interface GameState {
  board: Map<string, PlacedTile>
  players: Player[]
  currentPlayerIndex: number
  tileBag: Tile[]
  gameStatus: 'waiting' | 'playing' | 'finished'
  lastMove?: PlacedTile[]
}

// Standard Scrabble tile distribution
export const TILE_DISTRIBUTION: Tile[] = [
  // A-Z with Italian Scrabble distribution
  ...Array(12).fill({ letter: 'A', points: 1 }),
  ...Array(3).fill({ letter: 'B', points: 2 }),
  ...Array(4).fill({ letter: 'C', points: 2 }),
  ...Array(3).fill({ letter: 'D', points: 2 }),
  ...Array(11).fill({ letter: 'E', points: 1 }),
  ...Array(2).fill({ letter: 'F', points: 4 }),
  ...Array(2).fill({ letter: 'G', points: 2 }),
  ...Array(2).fill({ letter: 'H', points: 4 }),
  ...Array(12).fill({ letter: 'I', points: 1 }),
  { letter: 'J', points: 8 },
  { letter: 'K', points: 5 },
  ...Array(5).fill({ letter: 'L', points: 1 }),
  ...Array(5).fill({ letter: 'M', points: 3 }),
  ...Array(5).fill({ letter: 'N', points: 1 }),
  ...Array(11).fill({ letter: 'O', points: 1 }),
  ...Array(3).fill({ letter: 'P', points: 3 }),
  { letter: 'Q', points: 10 },
  ...Array(6).fill({ letter: 'R', points: 1 }),
  ...Array(4).fill({ letter: 'S', points: 1 }),
  ...Array(6).fill({ letter: 'T', points: 1 }),
  ...Array(4).fill({ letter: 'U', points: 4 }),
  ...Array(2).fill({ letter: 'V', points: 4 }),
  { letter: 'W', points: 4 },
  { letter: 'X', points: 8 },
  { letter: 'Y', points: 4 },
  { letter: 'Z', points: 10 },
  ...Array(2).fill({ letter: '', points: 0, isBlank: true }) // Blank tiles
]