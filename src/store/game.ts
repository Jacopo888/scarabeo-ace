import { create } from 'zustand'

export interface GameTile {
  id: string
  letter: string
  value: number
}

export interface GameStoreState {
  board: (GameTile | null)[][]
  rack: GameTile[]
  drawTiles: (tiles: GameTile[]) => void
  placeTile: (tile: GameTile, row: number, col: number) => void
}

const createEmptyBoard = () => Array.from({ length: 15 }, () => Array<GameTile | null>(15).fill(null))

export const useGameStore = create<GameStoreState>((set, get) => ({
  board: createEmptyBoard(),
  rack: [],
  drawTiles: tiles => set(state => ({ rack: [...state.rack, ...tiles] })),
  placeTile: (tile, row, col) => set(state => {
    const newRack = state.rack.filter(t => t.id !== tile.id)
    const newBoard = state.board.map(r => [...r])
    newBoard[row][col] = tile
    return { rack: newRack, board: newBoard }
  })
}))

export const resetGameStore = () => {
  useGameStore.setState({ board: createEmptyBoard(), rack: [] })
}
