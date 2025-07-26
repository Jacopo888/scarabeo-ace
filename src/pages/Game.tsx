import { GameProvider, useGameContext } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { GameFlow } from "@/components/GameFlow"
import { ScrabbleBoard } from "@/components/ScrabbleBoard"
import { TileRack } from "@/components/TileRack"
import { GameStats } from "@/components/GameStats"
import { TileActions } from "@/components/TileActions"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { BotProvider } from "@/contexts/BotContext"

const GameContent = () => {
  const { 
    gameState, 
    pendingTiles, 
    placeTile, 
    pickupTile,
    confirmMove, 
    cancelMove, 
    endTurn, 
    resetGame, 
    currentPlayer,
    reshuffleTiles,
    collectAllTiles,
    passTurn,
    isBotTurn
  } = useGameContext()

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main game area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium">
              Turn: {currentPlayer.name} (Score: {currentPlayer.score})
              {isBotTurn && currentPlayer.isBot && (
                <span className="ml-2 text-sm text-muted-foreground animate-pulse">
                  🤖 Bot is thinking...
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Tiles remaining: {gameState.tileBag.length} | 
              Game mode: {gameState.gameMode === 'bot' ? 'vs Bot' : 'Multiplayer'}
            </p>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {pendingTiles.length > 0 && (
              <>
                <Button 
                  onClick={confirmMove} 
                  variant="default"
                  disabled={isBotTurn}
                >
                  Confirm Move ({pendingTiles.length} tiles)
                </Button>
                <Button 
                  onClick={cancelMove} 
                  variant="outline"
                  disabled={isBotTurn}
                >
                  Cancel Move
                </Button>
                <Button 
                  onClick={collectAllTiles} 
                  variant="outline"
                  disabled={isBotTurn}
                >
                  Collect All
                </Button>
              </>
            )}
            <Button 
              onClick={passTurn} 
              variant="outline" 
              disabled={pendingTiles.length > 0 || isBotTurn || currentPlayer.isBot}
            >
              Pass Turn
            </Button>
            <Button 
              onClick={endTurn} 
              variant="outline" 
              disabled={pendingTiles.length > 0 || isBotTurn || currentPlayer.isBot}
            >
              End Turn
            </Button>
            <Button onClick={resetGame} variant="outline">
              New Game
            </Button>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="flex justify-center">
              <ScrabbleBoard 
                placedTiles={gameState.board}
                pendingTiles={pendingTiles}
                onTilePlaced={(row, col, tile) => placeTile(row, col, tile)}
                onTilePickup={(row, col) => pickupTile(row, col)}
              />
            </div>
            {!currentPlayer.isBot && (
              <div className="mt-6 space-y-4">
                <TileRack tiles={currentPlayer.rack} />
                <TileActions 
                  onReshuffle={reshuffleTiles}
                  onCollectAll={collectAllTiles}
                  hasPendingTiles={pendingTiles.length > 0}
                  disabled={isBotTurn}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GameStats />
          
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Players</h3>
            <div className="space-y-2 text-sm">
              {gameState.players.map((player, index) => (
                <div 
                  key={player.id}
                  className={`p-2 rounded ${
                    index === gameState.currentPlayerIndex 
                      ? 'bg-primary/10 border border-primary' 
                      : 'bg-secondary'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{player.name}</span>
                    <span className={index === gameState.currentPlayerIndex ? 'text-primary' : 'text-muted-foreground'}>
                      {index === gameState.currentPlayerIndex ? 'Active turn' : 'Waiting'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Score: {player.score} | Tiles: {player.rack.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Game Status</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{gameState.gameStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiles in bag:</span>
                <span>{gameState.tileBag.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiles played:</span>
                <span>{gameState.board.size}</span>
              </div>
            </div>
          </div>

          <GameFlow />
        </div>
      </div>
    </div>
  )
}

const Game = () => {
  return (
    <BotProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </BotProvider>
  )
}

export default Game