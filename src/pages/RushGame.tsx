import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Timer, Trophy, Zap, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCountdown } from '@/hooks/useCountdown'
import { useDictionary } from '@/contexts/DictionaryContext'
import { useToast } from '@/hooks/use-toast'
import { ScrabbleBoard } from '@/components/ScrabbleBoard'
import { TileRack } from '@/components/TileRack'
import { RushTopMoves } from '@/components/RushTopMoves'
import { generateLocal15x15RushPuzzle } from '@/utils/rushPuzzleGenerator15x15'
import { validateMoveLogic } from '@/utils/moveValidation'
import { findNewWordsFormed } from '@/utils/newWordFinder'
import { calculateNewMoveScore } from '@/utils/newScoring'
import { useIsMobile } from '@/hooks/use-mobile'
import { Tile, PlacedTile } from '@/types/game'
import { RushPuzzle, RushMove, RushGameState } from '@/types/rush'
import { cn } from '@/lib/utils'

function getMoveKey(move: RushMove): string {
  const sortedTiles = [...move.tiles].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
  return sortedTiles.map(t => `${t.row},${t.col},${t.letter}`).join('|')
}

function createMovesFromTiles(tiles: PlacedTile[]): RushMove {
  const sortedTiles = [...tiles].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
  return {
    tiles: sortedTiles,
    words: [], // Will be filled during validation
    score: 0   // Will be calculated during validation
  }
}

const RushGame = () => {
  const [gameState, setGameState] = useState<RushGameState>({
    puzzle: null,
    foundMoves: new Set(),
    pendingTiles: [],
    remainingRack: [],
    isGameOver: false,
    totalScore: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLocalGame, setIsLocalGame] = useState(false)
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [initialBoard, setInitialBoard] = useState<Map<string, PlacedTile>>(new Map())
  
  const { timeLeft, isRunning, start, formatTime } = useCountdown()
  const { isValidWord, isLoaded: isDictionaryLoaded } = useDictionary()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const API_BASE = import.meta.env.VITE_RATING_API_URL || ''

  useEffect(() => {
    fetchNewPuzzle()
  }, [])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      endGame()
    }
  }, [timeLeft, isRunning])

  const fetchNewPuzzle = async () => {
    try {
      setIsLoading(true)
      setIsLocalGame(false)
      
      if (API_BASE) {
        try {
          const response = await fetch(`${API_BASE}/api/rush/new`)
          if (!response.ok) throw new Error('Failed to fetch puzzle')
          
          const puzzle: RushPuzzle = await response.json()
          initializePuzzle(puzzle)
          return
        } catch (apiError) {
          console.warn('API not available, falling back to local puzzle:', apiError)
        }
      }
      
      // Fallback to local puzzle generation
      if (!isDictionaryLoaded) {
        toast({
          title: "Loading Dictionary",
          description: "Please wait for the dictionary to load...",
          variant: "default"
        })
        return
      }
      
      const localPuzzle = generateLocal15x15RushPuzzle(isValidWord, isDictionaryLoaded)
      initializePuzzle(localPuzzle)
      setIsLocalGame(true)
      
      toast({
        title: "Playing Offline",
        description: "Using local puzzle generation. Scores won't be saved.",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Error generating puzzle:', error)
      toast({
        title: "Error",
        description: "Failed to generate puzzle. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializePuzzle = (puzzle: RushPuzzle) => {
    // Convert board array to Map for efficient lookups
    const boardMap = new Map<string, PlacedTile>()
    puzzle.board.forEach(tile => {
      boardMap.set(`${tile.row},${tile.col}`, tile)
    })
    
    setInitialBoard(boardMap)
    setGameState({
      puzzle,
      foundMoves: new Set(),
      pendingTiles: [],
      remainingRack: [...puzzle.rack],
      isGameOver: false,
      totalScore: 0
    })
    start(90) // 90 seconds
  }

  const handleTileSelect = (index: number) => {
    if (gameState.isGameOver) return
    setSelectedTileIndex(selectedTileIndex === index ? null : index)
  }

  const handleTileDragStart = (index: number, tile: Tile) => {
    // Drag start handled by TileRack component
  }

  const handlePlaceTile = (row: number, col: number, tile: Tile) => {
    if (gameState.isGameOver) return
    
    // Find the tile in remaining rack
    const tileIndex = gameState.remainingRack.findIndex(t => 
      t.letter === tile.letter && t.points === tile.points
    )
    
    if (tileIndex === -1) return
    
    // Remove tile from rack and add to pending
    const newRack = [...gameState.remainingRack]
    newRack.splice(tileIndex, 1)
    
    const newPendingTile: PlacedTile = {
      ...tile,
      row,
      col
    }
    
    setGameState(prev => ({
      ...prev,
      remainingRack: newRack,
      pendingTiles: [...prev.pendingTiles, newPendingTile]
    }))
    
    setSelectedTileIndex(null)
  }

  const handlePickupTile = (row: number, col: number) => {
    if (gameState.isGameOver) return
    
    // Find pending tile at this position
    const tileIndex = gameState.pendingTiles.findIndex(t => t.row === row && t.col === col)
    if (tileIndex === -1) return
    
    const pickedTile = gameState.pendingTiles[tileIndex]
    const newPendingTiles = [...gameState.pendingTiles]
    newPendingTiles.splice(tileIndex, 1)
    
    // Return tile to rack
    const { row: _, col: __, ...rackTile } = pickedTile
    
    setGameState(prev => ({
      ...prev,
      remainingRack: [...prev.remainingRack, rackTile],
      pendingTiles: newPendingTiles
    }))
  }

  const submitMove = async () => {
    if (!gameState.puzzle || gameState.pendingTiles.length === 0) return
    
    // Validate move
    const validation = validateMoveLogic(initialBoard, gameState.pendingTiles)
    if (!validation.isValid) {
      toast({
        title: "Invalid Move",
        description: validation.errors[0],
        variant: "destructive"
      })
      return
    }
    
    // Find words formed
    const newWords = findNewWordsFormed(initialBoard, gameState.pendingTiles)
    if (newWords.length === 0) {
      toast({
        title: "No Words Found",
        description: "Your move must form at least one word",
        variant: "destructive"
      })
      return
    }
    
    // Validate words in dictionary
    const invalidWords = newWords.filter(w => !isValidWord(w.word))
    if (invalidWords.length > 0) {
      toast({
        title: "Invalid Words",
        description: `"${invalidWords[0].word}" is not in the dictionary`,
        variant: "destructive"
      })
      return
    }
    
    // Calculate score
    const score = calculateNewMoveScore(newWords, gameState.pendingTiles)
    
    // Create move key and check if it matches any top move
    const userMove = createMovesFromTiles(gameState.pendingTiles)
    userMove.words = newWords.map(w => w.word)
    userMove.score = score
    const userMoveKey = getMoveKey(userMove)
    
    // Check if this move is in the top 5
    const matchingMove = gameState.puzzle.topMoves.find(move => {
      const topMoveKey = getMoveKey(move)
      return topMoveKey === userMoveKey
    })
    
    if (matchingMove && !gameState.foundMoves.has(userMoveKey)) {
      // Correct move found!
      setGameState(prev => ({
        ...prev,
        foundMoves: new Set([...prev.foundMoves, userMoveKey]),
        totalScore: prev.totalScore + matchingMove.score,
        pendingTiles: [],
        remainingRack: [...gameState.puzzle!.rack] // Reset rack
      }))
      
      toast({
        title: "Great Move!",
        description: `Found "${matchingMove.words.join(', ')}" for ${matchingMove.score} points!`,
        variant: "default"
      })
      
      // Check if all moves found
      if (gameState.foundMoves.size + 1 >= gameState.puzzle.topMoves.length) {
        setTimeout(() => endGame(), 1000)
      }
    } else {
      toast({
        title: "Not a Top Move",
        description: `"${newWords.map(w => w.word).join(', ')}" (${score} pts) is not one of the top 5 moves`,
        variant: "destructive"
      })
    }
  }

  const cancelMove = () => {
    if (gameState.isGameOver || !gameState.puzzle) return
    
    setGameState(prev => ({
      ...prev,
      pendingTiles: [],
      remainingRack: [...gameState.puzzle!.rack]
    }))
    setSelectedTileIndex(null)
  }

  const endGame = async () => {
    if (!gameState.puzzle || gameState.isGameOver) return
    
    setGameState(prev => ({ ...prev, isGameOver: true }))
    
    if (API_BASE && !isLocalGame) {
      try {
        await fetch(`${API_BASE}/rush/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            puzzleId: gameState.puzzle.id, 
            totalScore: gameState.totalScore 
          })
        })
      } catch (error) {
        console.error('Error submitting score:', error)
      }
    } else {
      console.log('Local game - score not submitted:', gameState.totalScore)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-lg">Loading new puzzle...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!gameState.puzzle) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <p className="text-lg mb-4">Failed to load puzzle</p>
          <Button onClick={fetchNewPuzzle}>Try Again</Button>
        </div>
      </div>
    )
  }

  const selectedTile = selectedTileIndex !== null ? gameState.remainingRack[selectedTileIndex] : null

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          Rush Mode
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer and Score */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{gameState.totalScore}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Board */}
          <div className="flex justify-center">
            <ScrabbleBoard
              disabled={gameState.isGameOver}
              selectedTile={selectedTile}
              onUseSelectedTile={() => setSelectedTileIndex(null)}
              boardMap={initialBoard}
              pendingTiles={gameState.pendingTiles}
              onPlaceTile={handlePlaceTile}
              onPickupTile={handlePickupTile}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={submitMove}
              disabled={gameState.isGameOver || gameState.pendingTiles.length === 0}
              size="lg"
            >
              <Check className="h-4 w-4 mr-2" />
              Submit Move
            </Button>
            <Button 
              variant="outline"
              onClick={cancelMove}
              disabled={gameState.isGameOver || gameState.pendingTiles.length === 0}
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Rack */}
          <TileRack
            tiles={gameState.remainingRack}
            selectedTiles={selectedTileIndex !== null ? [selectedTileIndex] : []}
            onTileSelect={handleTileSelect}
            onTileDragStart={handleTileDragStart}
          />

          {/* Game Over */}
          {gameState.isGameOver && (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Game Over!</h3>
                <p className="text-lg mb-4">
                  You found {gameState.foundMoves.size} out of {gameState.puzzle.topMoves.length} top moves
                </p>
                <p className="text-xl font-semibold mb-4">
                  Final Score: {gameState.totalScore} points
                </p>
                <Button onClick={fetchNewPuzzle} size="lg">
                  New Puzzle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RushTopMoves 
            topMoves={gameState.puzzle.topMoves}
            foundMoves={gameState.foundMoves}
          />
        </div>
      </div>
    </div>
  )
}

export default RushGame