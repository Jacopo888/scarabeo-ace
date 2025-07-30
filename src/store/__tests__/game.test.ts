import { describe, expect, it, beforeEach } from 'vitest'
import { useGameStore, resetGameStore, GameTile } from '../game'

beforeEach(() => {
  resetGameStore()
})

describe('game store', () => {
  it('adds tiles to rack when drawing', () => {
    const tile: GameTile = { id: '1', letter: 'A', value: 1 }
    const prevLength = useGameStore.getState().rack.length
    useGameStore.getState().drawTiles([tile])
    expect(useGameStore.getState().rack).toHaveLength(prevLength + 1)
  })

  it('places tile on board and removes from rack', () => {
    const tile: GameTile = { id: '1', letter: 'A', value: 1 }
    useGameStore.getState().drawTiles([tile])
    expect(useGameStore.getState().board[0][0]).toBeNull()
    useGameStore.getState().placeTile(tile, 0, 0)
    const state = useGameStore.getState()
    expect(state.board[0][0]).toEqual(tile)
    expect(state.rack).toHaveLength(0)
  })
})
