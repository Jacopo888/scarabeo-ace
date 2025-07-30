import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore, resetGameStore } from '../game'

describe('game store', () => {
  beforeEach(() => {
    resetGameStore()
  })

  it('adds points to player', () => {
    useGameStore.getState().addPoints('me', 20)
    expect(useGameStore.getState().scores.me).toBe(20)
  })

  it('switches turn between players', () => {
    expect(useGameStore.getState().turn).toBe('me')
    useGameStore.getState().switchTurn()
    expect(useGameStore.getState().turn).toBe('opp')
    useGameStore.getState().switchTurn()
    expect(useGameStore.getState().turn).toBe('me')
  })
})

