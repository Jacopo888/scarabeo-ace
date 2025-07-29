import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { GameRecord, MoveRecord } from '@/types/multiplayer'
import { GameState, Tile, PlacedTile } from '@/types/game'
import { useToast } from '@/hooks/use-toast'
import { validateMoveLogic } from '@/utils/moveValidation'
import { findNewWordsFormed } from '@/utils/newWordFinder'
import { calculateNewMoveScore } from '@/utils/newScoring'
import { useDictionary } from '@/contexts/DictionaryContext'

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const drawTiles = (bag: Tile[], count: number): { drawn: Tile[]; remaining: Tile[] } => {
  const drawn = bag.slice(0, count)
  const remaining = bag.slice(count)
  return { drawn, remaining }
}

export const useMultiplayerGame = (gameId: string) => {
  const [game, setGame] = useState<GameRecord | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([])
  const [loading, setLoading] = useState(true)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isValidWord } = useDictionary()

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

    const boardEntries = Object.entries(gameData.board_state || {}).map(
      ([key, val]) => [
        key,
        {
          ...val,
          isBlank:
            'isBlank' in (val as any)
              ? (val as any).isBlank
              : (val as any).letter === '' && (val as any).points === 0,
        } as PlacedTile,
      ] as [string, PlacedTile]
    )
    const boardMap = new Map<string, PlacedTile>(boardEntries)

    const normalizeRack = (rack: any[]): Tile[] =>
      rack.map((t: any) => ({
        letter: t.letter ?? '',
        points: t.points ?? 0,
        isBlank: t.isBlank ?? (t.letter === '' && t.points === 0),
      }))

    const state: GameState = {
      players: [
        {
          id: gameData.player1_id,
          name: 'Giocatore 1',
          score: gameData.player1_score,
          rack: normalizeRack(gameData.player1_rack || []),
        },
        {
          id: gameData.player2_id,
          name: 'Giocatore 2',
          score: gameData.player2_score,
          rack: normalizeRack(gameData.player2_rack || []),
        },
      ],
      currentPlayerIndex: gameData.current_player_id === gameData.player1_id ? 0 : 1,
      board: boardMap,
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

      // Prepare board map for validation and scoring
      const boardMap = new Map<string, PlacedTile>(
        Object.entries(game.board_state || {}) as [string, PlacedTile][]
      )

      const validation = validateMoveLogic(boardMap, pendingTiles)
      if (!validation.isValid) {
        toast({
          title: 'Mossa non valida',
          description: validation.errors.join(', '),
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const newWords = findNewWordsFormed(boardMap, pendingTiles)
      const invalid = newWords.filter(w => !isValidWord(w.word))
      if (invalid.length > 0) {
        toast({
          title: 'Parole non valide',
          description: invalid.map(w => w.word).join(', '),
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const moveScore = calculateNewMoveScore(newWords, pendingTiles)

      // Apply tiles to board map
      pendingTiles.forEach(tile => {
        const key = `${tile.row},${tile.col}`
        boardMap.set(key, tile)
      })

      const newBoardState = Object.fromEntries(boardMap)

      // Remove used tiles from rack more carefully to prevent duplicates
      const isPlayer1 = game.player1_id === user.id
      const currentRack = [...(isPlayer1 ? game.player1_rack : game.player2_rack)] as Tile[]
      let newRack = [...currentRack]

    pendingTiles.forEach(placedTile => {
      let tileIndex: number
      if (placedTile.isBlank) {
        tileIndex = newRack.findIndex(rackTile => rackTile.isBlank)
      } else {
        tileIndex = newRack.findIndex(
          rackTile =>
            rackTile.letter === placedTile.letter &&
            rackTile.points === placedTile.points &&
            rackTile.isBlank === placedTile.isBlank
        )
      }
      if (tileIndex !== -1) {
        newRack.splice(tileIndex, 1)
      }
    })

      // Draw new tiles to refill rack
      const tilesNeeded = 7 - newRack.length
      const { drawn, remaining } =
        tilesNeeded > 0 && game.tile_bag.length > 0
          ? drawTiles(game.tile_bag, Math.min(tilesNeeded, game.tile_bag.length))
          : { drawn: [], remaining: game.tile_bag }
      newRack = [...newRack, ...drawn]

      // Determine next player
      const nextPlayerId = game.current_player_id === game.player1_id 
        ? game.player2_id 
        : game.player1_id

      // Update game state
      const gameUpdate: any = {
        board_state: newBoardState,
        tile_bag: remaining,
        current_player_id: nextPlayerId,
        updated_at: new Date().toISOString(),
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
          words_formed: newWords.map(w => w.word) as any,
          score_earned: moveScore,
          board_state_after: newBoardState as any,
          rack_after: newRack as any,
        })

      if (moveError) throw moveError

      console.log('Move submitted successfully:', {
        pendingTiles: pendingTiles.length,
        newBoardState: Object.keys(newBoardState).length,
        newRackSize: newRack.length,
        moveScore
      })

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

  const exchangeTiles = async (indexes: number[]) => {
    if (!game || !user || !isMyTurn || indexes.length === 0) return

    if (game.tile_bag.length < indexes.length) {
      toast({
        title: 'Errore',
        description: 'Non ci sono abbastanza tessere nel sacchetto',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)

      const isPlayer1 = game.player1_id === user.id
      const rack = isPlayer1 ? [...game.player1_rack] : [...game.player2_rack]
      const tilesToReturn: Tile[] = []

      const sorted = [...indexes].sort((a, b) => b - a)
      sorted.forEach(i => {
        const t = rack[i]
        if (t) {
          tilesToReturn.push(t)
          rack.splice(i, 1)
        }
      })

      const bagWithReturned = shuffleArray([...game.tile_bag, ...tilesToReturn])
      const { drawn, remaining } = drawTiles(bagWithReturned, indexes.length)
      const newRack = [...rack, ...drawn]

      const nextPlayerId = game.current_player_id === game.player1_id
        ? game.player2_id
        : game.player1_id

      const gameUpdate: any = {
        tile_bag: remaining,
        current_player_id: nextPlayerId,
        updated_at: new Date().toISOString()
      }

      if (isPlayer1) {
        gameUpdate.player1_rack = newRack
      } else {
        gameUpdate.player2_rack = newRack
      }

      const { error: gameError } = await supabase
        .from('games')
        .update(gameUpdate)
        .eq('id', game.id)

      if (gameError) throw gameError

      const { error: moveError } = await supabase
        .from('moves')
        .insert({
          game_id: game.id,
          player_id: user.id,
          move_type: 'exchange_tiles',
          tiles_exchanged: tilesToReturn as any,
          score_earned: 0,
          board_state_after: game.board_state as any,
          rack_after: newRack as any
        })

      if (moveError) throw moveError

      toast({
        title: 'Tessere scambiate',
        description: `Hai scambiato ${indexes.length} tessere`
      })
    } catch (error) {
      console.error('Error exchanging tiles:', error)
      toast({
        title: 'Errore',
        description: 'Impossibile scambiare le tessere',
        variant: 'destructive'
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
    const baseRack = game.player1_id === user.id ? game.player1_rack : game.player2_rack

    // Remove tiles that are currently pending placement
    const rackCopy = [...baseRack]
    pendingTiles.forEach(tile => {
      let index: number
      if (tile.isBlank) {
        index = rackCopy.findIndex(r => r.isBlank)
      } else {
        index = rackCopy.findIndex(
          r => r.letter === tile.letter && r.points === tile.points && r.isBlank === tile.isBlank
        )
      }
      if (index !== -1) rackCopy.splice(index, 1)
    })

    return rackCopy
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
    exchangeTiles,
    passTurn,
    getOpponentInfo,
    getMyScore,
    getCurrentRack
  }
}