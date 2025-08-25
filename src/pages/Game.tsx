import { GameProvider, useGameContext } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { GameFlow } from "@/components/GameFlow"
import { ScrabbleBoard } from "@/components/ScrabbleBoard"
import { TileRack } from "@/components/TileRack"
import { TileActions } from "@/components/TileActions"
import { DictionaryLoader } from "@/components/DictionaryLoader"
import { AnalysisPanel } from "@/components/AnalysisPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trophy, BarChart3 } from "lucide-react"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Link } from "react-router-dom"

const GameContent = () => {
  const {
    gameState,
    pendingTiles,
    placeTile,
    pickupTile,
    confirmMove,
    cancelMove,
    resetGame,
    currentPlayer,
    reshuffleTiles,
    passTurn,
    exchangeTiles,
    isBotTurn
  } = useGameContext()

  const isMobile = useIsMobile()
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)

  const selectedTile = selectedTileIndex !== null 
    ? { 
        ...currentPlayer.rack[selectedTileIndex], 
        id: `tile-${selectedTileIndex}`, 
        value: currentPlayer.rack[selectedTileIndex].points 
      } 
    : null

  const handleTileSelect = (index: number) => {
    if (!isMobile) return
    setSelectedTileIndex(prev => (prev === index ? null : index))
  }

  const clearSelectedTile = () => setSelectedTileIndex(null)

  // Generate mock game data for analysis (in real app, this would come from game history)
  const generateAnalysisData = () => {
    const moves: Array<{row: number, col: number, word: string, score: number, direction: 'H' | 'V', rackBefore: string}> = []
    
    // Convert board state to moves (simplified for demo)
    const boardEntries = Array.from(gameState.board.entries())
    if (boardEntries.length > 0) {
      // Mock some moves based on current board state
      moves.push({
        row: 7,
        col: 7,
        word: "HELLO",
        score: 10,
        direction: 'H',
        rackBefore: "HELLOWR"
      })
    }
    
    return { moves, lexicon: 'NWL' as const }
  }

  if (gameState.gameStatus === 'finished') {
    const winner = gameState.players.reduce((prev, current) => (prev.score > current.score) ? prev : current)
    
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Game Results</h1>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Game Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      {winner.name} Wins!
                    </h2>
                    <p className="text-muted-foreground">
                      Final Score: {winner.score} points
                    </p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {gameState.players.map(player => (
                      <div key={player.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-2xl font-bold">{player.score}</span>
                        </div>
                        {player.id === winner.id && (
                          <div className="mt-2">
                            <Trophy className="h-4 w-4 text-yellow-500 inline mr-1" />
                            <span className="text-sm text-yellow-600">Winner</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button onClick={resetGame}>
                      Play Again
                    </Button>
                    <Link to="/">
                      <Button variant="outline">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisPanel game={generateAnalysisData()} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Scrabble Game</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-lg relative">
            <div className="flex justify-center">
              <ScrabbleBoard
                disabled={isBotTurn || currentPlayer.isBot}
                selectedTile={selectedTile}
                onUseSelectedTile={clearSelectedTile}
              />
              <div className="absolute bottom-2 right-2 bg-secondary rounded p-2 text-sm shadow">
                {gameState.players.map(p => (
                  <div key={p.id} className="flex justify-between gap-4">
                    <span>{p.name}</span>
                    <span className="font-medium">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
            {!currentPlayer.isBot && (
              <div className="mt-6 space-y-4">
                <TileRack
                  selectedTiles={selectedTileIndex !== null ? [selectedTileIndex] : []}
                  onTileSelect={handleTileSelect}
                />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={confirmMove}
                    disabled={isBotTurn || pendingTiles.length === 0}
                  >
                    Confirm Move
                  </Button>
                  <Button
                    onClick={cancelMove}
                    variant="outline"
                    disabled={isBotTurn || pendingTiles.length === 0}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={passTurn}
                    variant="outline"
                    disabled={isBotTurn}
                  >
                    Pass Turn
                  </Button>
                  <Button
                    onClick={exchangeTiles}
                    variant="outline"
                    disabled={isBotTurn || gameState.tileBag.length < currentPlayer.rack.length}
                  >
                    Swap Tiles
                  </Button>
                  <Button
                    onClick={reshuffleTiles}
                    variant="outline"
                    disabled={isBotTurn}
                  >
                    Reshuffle Tiles
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

const Game = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}

export default Game