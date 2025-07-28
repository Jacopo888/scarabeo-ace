import { useState, useCallback, useEffect } from 'react'
import { GameState, Player, Tile, PlacedTile, TILE_DISTRIBUTION } from '@/types/game'
import { validateMoveLogic } from '@/utils/moveValidation'
import { findNewWordsFormed } from '@/utils/newWordFinder'
import { calculateNewMoveScore } from '@/utils/newScoring'
import { useToast } from '@/hooks/use-toast'
import { useBotContext } from '@/contexts/BotContext'
import { useDictionary } from '@/contexts/DictionaryContext'

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
  const { difficulty, makeBotMove: botMakeBotMove } = useBotContext()
  const { isValidWord } = useDictionary()
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([])
  const [isBotTurn, setIsBotTurn] = useState(false)
  const [gameState, setGameState] = useState<GameState>(() => {
    const shuffledBag = shuffleArray(TILE_DISTRIBUTION)
    const player1Tiles = drawTiles(shuffledBag, 7)
    const player2Tiles = drawTiles(player1Tiles.remaining, 7)

    const gameMode = difficulty ? 'bot' : 'human'
    const startingPlayerIndex = Math.floor(Math.random() * 2)

    return {
      board: new Map(),
      players: [
        {
          id: 'player1',
          name: 'You',
          score: 0,
          rack: player1Tiles.drawn,
          isBot: false
        },
        {
          id: 'player2', 
          name: difficulty ? `Bot (${difficulty})` : 'Player 2',
          score: 0,
          rack: player2Tiles.drawn,
          isBot: !!difficulty
        }
      ],
      currentPlayerIndex: startingPlayerIndex,
      tileBag: player2Tiles.remaining,
      gameStatus: 'playing',
      gameMode,
      passCount: 0
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

  const pickupTile = useCallback((row: number, col: number) => {
    const key = `${row},${col}`
    
    // Check if tile is in pending tiles (can only pick up tiles from current turn)
    const tileIndex = pendingTiles.findIndex(t => t.row === row && t.col === col)
    if (tileIndex === -1) return // Tile not found in pending tiles
    
    const tile = pendingTiles[tileIndex]
    
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        rack: [...currentPlayer.rack, tile]
      }
      
      return {
        ...prev,
        players: newPlayers
      }
    })
    
    // Remove from pending tiles
    setPendingTiles(current => current.filter((_, i) => i !== tileIndex))
  }, [pendingTiles])

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
      // Validate the move using new logic
      const validation = validateMoveLogic(prev.board, pendingTiles)
      
      if (!validation.isValid) {
        toast({
          title: "Invalid move",
          description: validation.errors.join(', '),
          variant: "destructive"
        })
        return prev
      }

      // Find only the new words formed by this move
      const newWords = findNewWordsFormed(prev.board, pendingTiles)
      
      // Validate all new words in dictionary
      const invalidWords = newWords.filter(word => !isValidWord(word.word))
      if (invalidWords.length > 0) {
        toast({
          title: "Invalid words",
          description: `Invalid words: ${invalidWords.map(w => w.word).join(', ')}`,
          variant: "destructive"
        })
        return prev
      }

      // Calculate score only for new words
      const score = calculateNewMoveScore(newWords, pendingTiles)
      
      // Add tiles to board
      const newBoard = new Map(prev.board)
      pendingTiles.forEach(tile => {
        const key = `${tile.row},${tile.col}`
        newBoard.set(key, tile)
      })
      
      // Update player score and rack
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const tilesNeeded = 7 - currentPlayer.rack.length
      
      // Draw new tiles
      const { drawn, remaining } = tilesNeeded > 0 && prev.tileBag.length > 0
        ? drawTiles(prev.tileBag, Math.min(tilesNeeded, prev.tileBag.length))
        : { drawn: [], remaining: prev.tileBag }
      
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        score: currentPlayer.score + score,
        rack: [...currentPlayer.rack, ...drawn]
      }
      
      // Clear pending tiles
      setPendingTiles([])
      
      toast({
        title: "Move confirmed!",
        description: `+${score} points for words: ${newWords.map(w => w.word).join(', ')}`,
      })
      
      // Automatically end turn after successful move
      return {
        ...prev,
        board: newBoard,
        players: newPlayers,
        tileBag: remaining,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        passCount: 0, // Reset pass count after a successful move
        lastMove: pendingTiles
      }
    })
  }, [pendingTiles, toast, isValidWord])

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

  const reshuffleTiles = useCallback(() => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const shuffledRack = shuffleArray([...currentPlayer.rack])
      
      const newPlayers = [...prev.players]
      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        rack: shuffledRack
      }
      
      return {
        ...prev,
        players: newPlayers
      }
    })
  }, [])

  const collectAllTiles = useCallback(() => {
    if (pendingTiles.length === 0) return
    
    setGameState(prev => {
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

  const passTurn = useCallback(() => {
    setGameState(prev => {
      const newPassCount = (prev.passCount || 0) + 1
      
      // End game if both players pass consecutively
      if (newPassCount >= 2) {
        return {
          ...prev,
          gameStatus: 'finished'
        }
      }
      
      return {
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        passCount: newPassCount
      }
    })
  }, [])

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
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          passCount: 0 // Reset pass count when a player makes a move
        }
      }
      
      return {
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        passCount: 0
      }
    })
  }, [])

  const resetGame = useCallback(() => {
    const shuffledBag = shuffleArray(TILE_DISTRIBUTION)
    const player1Tiles = drawTiles(shuffledBag, 7)
    const player2Tiles = drawTiles(player1Tiles.remaining, 7)

    const gameMode = difficulty ? 'bot' : 'human'
    const startingPlayerIndex = Math.floor(Math.random() * 2)

    setGameState({
      board: new Map(),
      players: [
        {
          id: 'player1',
          name: 'You',
          score: 0,
          rack: player1Tiles.drawn,
          isBot: false
        },
        {
          id: 'player2',
          name: difficulty ? `Bot (${difficulty})` : 'Player 2',
          score: 0,
          rack: player2Tiles.drawn,
          isBot: !!difficulty
        }
      ],
      currentPlayerIndex: startingPlayerIndex,
      tileBag: player2Tiles.remaining,
      gameStatus: 'playing',
      gameMode,
      passCount: 0
    })
    setPendingTiles([])
  }, [difficulty])

  // Bot move logic
  const makeBotMove = useCallback(async () => {
    if (!difficulty || !botMakeBotMove) return
    
    setIsBotTurn(true)
    
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      if (!currentPlayer.isBot) return prev
      
      // Start async bot move generation
      botMakeBotMove(prev, currentPlayer.rack).then(bestMove => {
        if (!bestMove || bestMove.tiles.length === 0) {
          // Bot passes if no valid moves
          setIsBotTurn(false)
          setGameState(prevState => ({
            ...prevState,
            currentPlayerIndex: (prevState.currentPlayerIndex + 1) % prevState.players.length,
            passCount: (prevState.passCount || 0) + 1
          }))
          return
        }
        
        setGameState(prevState => {
          // Place bot's tiles
          const newBoard = new Map(prevState.board)
          bestMove.tiles.forEach(tile => {
            const key = `${tile.row},${tile.col}`
            newBoard.set(key, tile)
          })
          
          // Update bot's rack (remove used tiles)
          const currentPlayer = prevState.players[prevState.currentPlayerIndex]
          const newRack = [...currentPlayer.rack]
          bestMove.tiles.forEach(usedTile => {
            const tileIndex = newRack.findIndex(t => 
              t.letter === usedTile.letter && t.points === usedTile.points
            )
            if (tileIndex !== -1) {
              newRack.splice(tileIndex, 1)
            }
          })
          
          // Draw new tiles for bot
          const tilesNeeded = 7 - newRack.length
          const { drawn, remaining } = tilesNeeded > 0 && prevState.tileBag.length > 0
            ? drawTiles(prevState.tileBag, Math.min(tilesNeeded, prevState.tileBag.length))
            : { drawn: [], remaining: prevState.tileBag }
          
          const newPlayers = [...prevState.players]
          newPlayers[prevState.currentPlayerIndex] = {
            ...currentPlayer,
            score: currentPlayer.score + bestMove.score,
            rack: [...newRack, ...drawn]
          }
          
          toast({
            title: "Bot played!",
            description: `Bot scored ${bestMove.score} points with: ${bestMove.words.join(', ')}`,
          })
          
          setIsBotTurn(false)
          
          return {
            ...prevState,
            board: newBoard,
            players: newPlayers,
            tileBag: remaining,
            currentPlayerIndex: (prevState.currentPlayerIndex + 1) % prevState.players.length,
            passCount: 0,
            lastMove: bestMove.tiles
          }
        })
      }).catch(error => {
        console.error('Bot move error:', error)
        setIsBotTurn(false)
        // Bot passes on error
        setGameState(prevState => ({
          ...prevState,
          currentPlayerIndex: (prevState.currentPlayerIndex + 1) % prevState.players.length,
          passCount: (prevState.passCount || 0) + 1
        }))
      })
      
      return prev // Return current state while bot is thinking
    })
  }, [difficulty, botMakeBotMove, toast])

  // Effect to handle bot turns
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    console.log('Bot turn check:', {
      currentPlayer: currentPlayer?.name,
      isBot: currentPlayer?.isBot,
      gameStatus: gameState.gameStatus,
      isBotTurn,
      difficulty
    })
    
    if (currentPlayer?.isBot && gameState.gameStatus === 'playing' && !isBotTurn) {
      console.log('Bot should make move now!')
      makeBotMove()
    }
  }, [gameState.currentPlayerIndex, gameState.gameStatus, makeBotMove, isBotTurn, difficulty])

  // Effect to reset game when difficulty changes
  useEffect(() => {
    if (difficulty) {
      resetGame()
    }
  }, [difficulty, resetGame])

  return {
    gameState,
    pendingTiles,
    placeTile,
    pickupTile,
    confirmMove,
    cancelMove,
    endTurn,
    resetGame,
    reshuffleTiles,
    collectAllTiles,
    passTurn,
    makeBotMove,
    isBotTurn,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    isCurrentPlayerTurn: (playerId: string) => gameState.players[gameState.currentPlayerIndex].id === playerId
  }
}