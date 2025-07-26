import { createContext, useContext, ReactNode } from 'react'
import { useGame } from '@/hooks/useGame'
import { GameState, Player, Tile } from '@/types/game'

interface GameContextType {
  gameState: GameState
  placeTile: (row: number, col: number, tile: Tile) => void
  endTurn: () => void
  resetGame: () => void
  currentPlayer: Player
  isCurrentPlayerTurn: (playerId: string) => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const gameLogic = useGame()
  
  return (
    <GameContext.Provider value={gameLogic}>
      {children}
    </GameContext.Provider>
  )
}