import { createContext, useContext, ReactNode } from 'react'
import { useGame } from '@/hooks/useGame'
import { GameState, Player, Tile, PlacedTile } from '@/types/game'

interface GameContextType {
  gameState: GameState
  pendingTiles: PlacedTile[]
  placeTile: (row: number, col: number, tile: Tile) => void
  pickupTile: (row: number, col: number) => void
  resetGame: () => void
  confirmMove: () => void
  cancelMove: () => void
  reshuffleTiles: () => void
  exchangeTiles: () => void
  passTurn: () => void
  makeBotMove: () => Promise<void>
  isBotTurn: boolean
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

  const {
    gameState,
    pendingTiles,
    placeTile,
    pickupTile,
    confirmMove,
    cancelMove,
    resetGame,
    reshuffleTiles,
    exchangeTiles,
    passTurn,
    makeBotMove,
    isBotTurn,
    currentPlayer,
    isCurrentPlayerTurn
  } = gameLogic

  return (
    <GameContext.Provider
      value={{
        gameState,
        pendingTiles,
        placeTile,
        pickupTile,
        confirmMove,
        cancelMove,
        resetGame,
        reshuffleTiles,
        exchangeTiles,
        passTurn,
        makeBotMove,
        isBotTurn,
        currentPlayer,
        isCurrentPlayerTurn
      }}
    >
      {children}
    </GameContext.Provider>
  )
}