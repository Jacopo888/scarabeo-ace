import { GameProvider, useGameContext } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { GameFlow } from "@/components/GameFlow"
import { ScrabbleBoard } from "@/components/ScrabbleBoard"
import { TileRack } from "@/components/TileRack"
import { TileActions } from "@/components/TileActions"
import { DictionaryLoader } from "@/components/DictionaryLoader"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

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

  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)

  const handleEmptySquareClick = (row: number, col: number) => {
    if (selectedTileIndex === null) return
    const tile = currentPlayer.rack[selectedTileIndex]
    if (!tile) return
    placeTile(row, col, tile)
    setSelectedTileIndex(null)
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
                placedTiles={gameState.board}
                pendingTiles={pendingTiles}
                onTilePlaced={(row, col, tile) => placeTile(row, col, tile)}
                onTilePickup={(row, col) => pickupTile(row, col)}
                onEmptySquareClick={handleEmptySquareClick}
                disabled={isBotTurn || currentPlayer.isBot}
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
                  tiles={currentPlayer.rack}
                  selectedTiles={selectedTileIndex !== null ? [selectedTileIndex] : []}
                  onTileSelect={(idx) =>
                    setSelectedTileIndex(prev => (prev === idx ? null : idx))
                  }
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