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
  isBot?: boolean
}

export interface GameState {
  board: Map<string, PlacedTile>
  players: Player[]
  currentPlayerIndex: number
  tileBag: Tile[]
  gameStatus: 'waiting' | 'playing' | 'finished'
  lastMove?: PlacedTile[]
  gameMode?: 'human' | 'bot'
  passCount?: number
}

// Standard Scrabble tile distribution
export const TILE_DISTRIBUTION: Tile[] = [
  // A-Z with English Scrabble distribution
  ...Array(9).fill({ letter: 'A', points: 1 }),
  ...Array(2).fill({ letter: 'B', points: 3 }),
  ...Array(2).fill({ letter: 'C', points: 3 }),
  ...Array(4).fill({ letter: 'D', points: 2 }),
  ...Array(12).fill({ letter: 'E', points: 1 }),
  ...Array(2).fill({ letter: 'F', points: 4 }),
  ...Array(3).fill({ letter: 'G', points: 2 }),
  ...Array(2).fill({ letter: 'H', points: 4 }),
  ...Array(9).fill({ letter: 'I', points: 1 }),
  { letter: 'J', points: 8 },
  { letter: 'K', points: 5 },
  ...Array(4).fill({ letter: 'L', points: 1 }),
  ...Array(2).fill({ letter: 'M', points: 3 }),
  ...Array(6).fill({ letter: 'N', points: 1 }),
  ...Array(8).fill({ letter: 'O', points: 1 }),
  ...Array(2).fill({ letter: 'P', points: 3 }),
  { letter: 'Q', points: 10 },
  ...Array(6).fill({ letter: 'R', points: 1 }),
  ...Array(4).fill({ letter: 'S', points: 1 }),
  ...Array(6).fill({ letter: 'T', points: 1 }),
  ...Array(4).fill({ letter: 'U', points: 1 }),
  ...Array(2).fill({ letter: 'V', points: 4 }),
  ...Array(2).fill({ letter: 'W', points: 4 }),
  { letter: 'X', points: 8 },
  ...Array(2).fill({ letter: 'Y', points: 4 }),
  { letter: 'Z', points: 10 },
  ...Array(2).fill({ letter: '', points: 0, isBlank: true }) // Blank tiles
]