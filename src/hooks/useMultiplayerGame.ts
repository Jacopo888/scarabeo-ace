import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { GameRecord, MoveRecord } from '@/types/multiplayer'
import { GameState, Tile, PlacedTile } from '@/types/game'
import { useToast } from '@/hooks/use-toast'

export const useMultiplayerGame = (gameId: string) => {
  const [game, setGame] = useState<GameRecord | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([])
  const [loading, setLoading] = useState(true)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch initial game data
  useEffect(() => {
    if (gameId && user) {
      fetchGame()
    }
  }, [gameId, user])

  // Set up real-time subscription
  useEffect(() => {
    if (!gameId || !user) return

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          const updatedGame = payload.new as GameRecord
          setGame(updatedGame)
          updateGameState(updatedGame)
          
          // Notify when it's the player's turn
          if (updatedGame.current_player_id === user.id && updatedGame.current_player_id !== game?.current_player_id) {
            toast({
              title: "È il tuo turno!",
              description: "Puoi ora fare la tua mossa"
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          // Refetch game when new move is made
          fetchGame()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, user, game?.current_player_id])

  const fetchGame = async () => {
    if (!gameId || !user) return

    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          player1:profiles!games_player1_id_fkey(username, display_name),
          player2:profiles!games_player2_id_fkey(username, display_name)
        `)
        .eq('id', gameId)
        .single()

      if (error) {
        throw error
      }

      setGame(data as any)
      updateGameState(data)
    } catch (error) {
      console.error('Error fetching game:', error)
      toast({
        title: "Errore",
        description: "Impossibile caricare la partita",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateGameState = (gameData: any) => {
    if (!user) return

    const isPlayer1 = gameData.player1_id === user.id
    const myRack = isPlayer1 ? gameData.player1_rack : gameData.player2_rack
    const opponentRack = isPlayer1 ? gameData.player2_rack : gameData.player1_rack

    const state: GameState = {
      players: [
        {
          id: gameData.player1_id,
          name: 'Giocatore 1',
          score: gameData.player1_score,
          rack: gameData.player1_rack as Tile[]
        },
        {
          id: gameData.player2_id,
          name: 'Giocatore 2', 
          score: gameData.player2_score,
          rack: gameData.player2_rack as Tile[]
        }
      ],
      currentPlayerIndex: gameData.current_player_id === gameData.player1_id ? 0 : 1,
      board: new Map(),
      tileBag: gameData.tile_bag as Tile[],
      gameStatus: 'playing'
    }

    setGameState(state)
    setIsMyTurn(gameData.current_player_id === user.id)
  }

  const placeTile = useCallback((row: number, col: number, tile: Tile) => {
    if (!isMyTurn) return

    const newTile: PlacedTile = {
      ...tile,
      row,
      col
    }

    setPendingTiles(prev => {
      const filtered = prev.filter(t => !(t.row === row && t.col === col))
      return [...filtered, newTile]
    })
  }, [isMyTurn])

  const pickupTile = useCallback((row: number, col: number) => {
    setPendingTiles(prev => prev.filter(t => !(t.row === row && t.col === col)))
  }, [])

  const submitMove = async () => {
    if (!game || !user || !isMyTurn || pendingTiles.length === 0) return

    try {
      setLoading(true)

      // Convert pending tiles to board state - using consistent key format
      const newBoardState = { ...game.board_state }
      pendingTiles.forEach(tile => {
        const key = `${tile.row},${tile.col}` // Consistent with ScrabbleBoard
        newBoardState[key] = { letter: tile.letter, points: tile.points, row: tile.row, col: tile.col }
      })

      // Remove used tiles from rack more carefully to prevent duplicates
      const isPlayer1 = game.player1_id === user.id
      const currentRack = [...(isPlayer1 ? game.player1_rack : game.player2_rack)] as Tile[]
      let newRack = [...currentRack]
      
      // Remove tiles by matching exact properties
      pendingTiles.forEach(placedTile => {
        const tileIndex = newRack.findIndex(rackTile => 
          rackTile.letter === placedTile.letter && 
          rackTile.points === placedTile.points &&
          rackTile.isBlank === placedTile.isBlank
        )
        if (tileIndex !== -1) {
          newRack.splice(tileIndex, 1)
        }
      })

      // Calculate score (simplified)
      const moveScore = pendingTiles.reduce((sum, tile) => sum + tile.points, 0)

      // Determine next player
      const nextPlayerId = game.current_player_id === game.player1_id 
        ? game.player2_id 
        : game.player1_id

      // Update game state
      const gameUpdate: any = {
        board_state: newBoardState,
        current_player_id: nextPlayerId,
        updated_at: new Date().toISOString()
      }

      if (isPlayer1) {
        gameUpdate.player1_rack = newRack
        gameUpdate.player1_score = game.player1_score + moveScore
      } else {
        gameUpdate.player2_rack = newRack
        gameUpdate.player2_score = game.player2_score + moveScore
      }

      // Update game in database
      const { error: gameError } = await supabase
        .from('games')
        .update(gameUpdate)
        .eq('id', game.id)

      if (gameError) throw gameError

      // Record the move
      const { error: moveError } = await supabase
        .from('moves')
        .insert({
          game_id: game.id,
          player_id: user.id,
          move_type: 'place_tiles',
          tiles_placed: pendingTiles as any,
          score_earned: moveScore,
          board_state_after: newBoardState as any,
          rack_after: newRack as any
        })

      if (moveError) throw moveError

      setPendingTiles([])
      toast({
        title: "Mossa inviata!",
        description: `Hai guadagnato ${moveScore} punti`
      })

    } catch (error) {
      console.error('Error submitting move:', error)
      toast({
        title: "Errore",
        description: "Impossibile inviare la mossa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const passTurn = async () => {
    if (!game || !user || !isMyTurn) return

    try {
      setLoading(true)

      const nextPlayerId = game.current_player_id === game.player1_id 
        ? game.player2_id 
        : game.player1_id

      await supabase
        .from('games')
        .update({
          current_player_id: nextPlayerId,
          pass_count: (game.pass_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', game.id)

      await supabase
        .from('moves')
        .insert({
          game_id: game.id,
          player_id: user.id,
          move_type: 'pass',
          score_earned: 0,
          board_state_after: game.board_state,
          rack_after: game.player1_id === user.id ? game.player1_rack : game.player2_rack
        })

      toast({
        title: "Turno passato",
        description: "Hai passato il turno"
      })

    } catch (error) {
      console.error('Error passing turn:', error)
      toast({
        title: "Errore", 
        description: "Impossibile passare il turno",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getOpponentInfo = () => {
    if (!game || !user) return null

    const isPlayer1 = game.player1_id === user.id
    const opponent = isPlayer1 ? (game as any).player2 : (game as any).player1
    
    return {
      name: opponent?.display_name || opponent?.username || 'Avversario',
      score: isPlayer1 ? game.player2_score : game.player1_score
    }
  }

  const getMyScore = () => {
    if (!game || !user) return 0
    return game.player1_id === user.id ? game.player1_score : game.player2_score
  }

  const getCurrentRack = () => {
    if (!game || !user) return []
    return game.player1_id === user.id ? game.player1_rack : game.player2_rack
  }

  return {
    game,
    gameState,
    pendingTiles,
    loading,
    isMyTurn,
    placeTile,
    pickupTile,
    submitMove,
    passTurn,
    getOpponentInfo,
    getMyScore,
    getCurrentRack
  }
}