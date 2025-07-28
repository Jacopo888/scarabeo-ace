import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { MatchmakingEntry, GameRecord } from '@/types/multiplayer'
import { useToast } from '@/hooks/use-toast'

export const useMatchmaking = () => {
  const [isInQueue, setIsInQueue] = useState(false)
  const [queueEntry, setQueueEntry] = useState<MatchmakingEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // Check if user is already in queue
  useEffect(() => {
    if (user && profile) {
      checkQueueStatus()
    }
  }, [user, profile])

  // Set up real-time subscription for matchmaking
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('matchmaking-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games',
          filter: `player1_id=eq.${user.id},player2_id=eq.${user.id}`
        },
        (payload) => {
          const game = payload.new as GameRecord
          if (game.player1_id === user.id || game.player2_id === user.id) {
            handleGameFound(game)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const checkQueueStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking queue status:', error)
        return
      }

      if (data) {
        setQueueEntry(data as MatchmakingEntry)
        setIsInQueue(true)
      } else {
        setQueueEntry(null)
        setIsInQueue(false)
      }
    } catch (error) {
      console.error('Error checking queue status:', error)
    }
  }

  const joinQueue = async (preferredDuration: '1h' | '6h' | '24h' | '48h') => {
    if (!user || !profile) return

    setLoading(true)

    try {
      // Clean up expired entries first
      await supabase.rpc('cleanup_expired_queue_entries')

      // Try to find an existing match
      const { data: potentialMatches, error: searchError } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('preferred_duration', preferredDuration)
        .neq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (searchError) {
        throw searchError
      }

      if (potentialMatches && potentialMatches.length > 0) {
        // Found a match! Create a game
        const opponent = potentialMatches[0]
        await createGame(user.id, opponent.user_id, preferredDuration)

        // Remove both players from queue
        await supabase
          .from('matchmaking_queue')
          .delete()
          .in('user_id', [user.id, opponent.user_id])

        toast({
          title: "Partita trovata!",
          description: "È stata creata una nuova partita. Buona fortuna!"
        })
      } else {
        // No match found, join the queue
        const { error } = await supabase
          .from('matchmaking_queue')
          .upsert({
            user_id: user.id,
            skill_level: profile.skill_level,
            preferred_duration: preferredDuration
          })

        if (error) {
          throw error
        }

        setIsInQueue(true)
        await checkQueueStatus()

        toast({
          title: "In coda per matchmaking",
          description: "Stiamo cercando un avversario per te..."
        })
      }
    } catch (error) {
      console.error('Error joining queue:', error)
      toast({
        title: "Errore",
        description: "Impossibile entrare in coda per il matchmaking",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const leaveQueue = async () => {
    if (!user) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setIsInQueue(false)
      setQueueEntry(null)

      toast({
        title: "Uscito dalla coda",
        description: "Hai lasciato la coda del matchmaking"
      })
    } catch (error) {
      console.error('Error leaving queue:', error)
      toast({
        title: "Errore",
        description: "Impossibile uscire dalla coda",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createGame = async (player1Id: string, player2Id: string, duration: string) => {
    // Initialize game with empty board and full tile bag
    const initialBoard = {}
    const initialTileBag = [...Array(100)].map(() => ({ letter: 'A', points: 1 })) // Simplified for demo
    const initialRack = [...Array(7)].map(() => ({ letter: 'A', points: 1 })) // Simplified for demo

    const { error } = await supabase
      .from('games')
      .insert({
        player1_id: player1Id,
        player2_id: player2Id,
        current_player_id: player1Id,
        status: 'active',
        board_state: initialBoard,
        tile_bag: initialTileBag,
        player1_rack: initialRack,
        player2_rack: initialRack,
        turn_duration: duration
      })

    if (error) {
      throw error
    }
  }

  const handleGameFound = (game: GameRecord) => {
    // Remove from queue if found
    setIsInQueue(false)
    setQueueEntry(null)

    toast({
      title: "Partita trovata!",
      description: "È stata creata una nuova partita. Vai alla dashboard per giocare!"
    })
  }

  return {
    isInQueue,
    queueEntry,
    loading,
    joinQueue,
    leaveQueue,
    checkQueueStatus
  }
}