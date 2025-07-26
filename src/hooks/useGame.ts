import { useState, useCallback } from 'react'
import { GameState, Player, Tile, PlacedTile, TILE_DISTRIBUTION } from '@/types/game'
import { validateMove } from '@/utils/gameRules'
import { findWordsOnBoard } from '@/utils/wordFinder'
import { calculateMoveScore } from '@/utils/scoring'
import { useToast } from '@/hooks/use-toast'

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const drawTiles = (bag: Tile[], count: number): { drawn: Tile[], remaining: Tile[] } => {
  const drawn = bag.slice(0, count)
  const remaining = bag.slice(count)
  return { drawn, remaining }
}

export const useGame = () => {
  const { toast } = useToast()
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([])
  const [gameState, setGameState] = useState<GameState>(() => {
    const shuffledBag = shuffleArray(TILE_DISTRIBUTION)
    const player1Tiles = drawTiles(shuffledBag, 7)
    const player2Tiles = drawTiles(player1Tiles.remaining, 7)
    
    return {
      board: new Map(),
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          score: 0,
          rack: player1Tiles.drawn
        },
        {
          id: 'player2', 
          name: 'Player 2',
          score: 0,
          rack: player2Tiles.drawn
        }
      ],
      currentPlayerIndex: 0,
      tileBag: player2Tiles.remaining,
      gameStatus: 'playing'
    }
  })

  const placeTile = useCallback((row: number, col: number, tile: Tile) => {
    const key = `${row},${col}`
    
    setGameState(prev => {
      if (prev.board.has(key)) return prev // Square already occupied
      
      // Remove tile from current player's rack
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const tileIndex = currentPlayer.rack.findIndex(t => 
        t.letter === tile.letter && t.points === tile.points && t.isBlank === tile.isBlank
      )
      
      if (tileIndex === -1) return prev // Tile not found in rack
      
      const newRack = [...currentPlayer.rack]
      newRack.splice(tileIndex, 1)
      
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        rack: newRack
      }
      
      // Add to pending tiles instead of board
      const newTile: PlacedTile = { ...tile, row, col }
      setPendingTiles(current => [...current, newTile])
      
      return {
        ...prev,
        players: newPlayers
      }
    })
  }, [])

  const confirmMove = useCallback(() => {
    if (pendingTiles.length === 0) {
      toast({
        title: "Error",
        description: "No tiles to confirm",
        variant: "destructive"
      })
      return
    }

    setGameState(prev => {
      // Validate the move
      const validation = validateMove(prev.board, pendingTiles)
      
      if (!validation.isValid) {
        toast({
          title: "Invalid move",
          description: validation.errors.join(', '),
          variant: "destructive"
        })
        return prev
      }

      // Calculate score
      const words = findWordsOnBoard(prev.board, pendingTiles)
      const score = calculateMoveScore(words, pendingTiles)
      
      // Add tiles to board
      const newBoard = new Map(prev.board)
      pendingTiles.forEach(tile => {
        const key = `${tile.row},${tile.col}`
        newBoard.set(key, tile)
      })
      
      // Update player score
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        score: currentPlayer.score + score
      }
      
      // Clear pending tiles
      setPendingTiles([])
      
      toast({
        title: "Move confirmed!",
        description: `+${score} points for words: ${words.map(w => w.word).join(', ')}`,
      })
      
      return {
        ...prev,
        board: newBoard,
        players: newPlayers,
        lastMove: pendingTiles
      }
    })
  }, [pendingTiles, toast])

  const cancelMove = useCallback(() => {
    if (pendingTiles.length === 0) return
    
    setGameState(prev => {
      // Return tiles to current player's rack
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        rack: [...currentPlayer.rack, ...pendingTiles]
      }
      
      setPendingTiles([])
      
      return {
        ...prev,
        players: newPlayers
      }
    })
  }, [pendingTiles])

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const tilesNeeded = 7 - currentPlayer.rack.length
      
      if (tilesNeeded > 0 && prev.tileBag.length > 0) {
        const { drawn, remaining } = drawTiles(prev.tileBag, Math.min(tilesNeeded, prev.tileBag.length))
        
        const newPlayers = [...prev.players]
        newPlayers[prev.currentPlayerIndex] = {
          ...currentPlayer,
          rack: [...currentPlayer.rack, ...drawn]
        }
        
        return {
          ...prev,
          players: newPlayers,
          tileBag: remaining,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
        }
      }
      
      return {
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
      }
    })
  }, [])

  const resetGame = useCallback(() => {
    const shuffledBag = shuffleArray(TILE_DISTRIBUTION)
    const player1Tiles = drawTiles(shuffledBag, 7)
    const player2Tiles = drawTiles(player1Tiles.remaining, 7)
    
    setGameState({
      board: new Map(),
      players: [
        {
          id: 'player1',
          name: 'Player 1', 
          score: 0,
          rack: player1Tiles.drawn
        },
        {
          id: 'player2',
          name: 'Player 2',
          score: 0, 
          rack: player2Tiles.drawn
        }
      ],
      currentPlayerIndex: 0,
      tileBag: player2Tiles.remaining,
      gameStatus: 'playing'
    })
  }, [])

  return {
    gameState,
    pendingTiles,
    placeTile,
    confirmMove,
    cancelMove,
    endTurn,
    resetGame,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    isCurrentPlayerTurn: (playerId: string) => gameState.players[gameState.currentPlayerIndex].id === playerId
  }
}