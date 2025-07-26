import { PlayButtons } from "@/components/PlayButtons"
import { GameStats } from "@/components/GameStats"
import { ScrabbleBoard } from "@/components/ScrabbleBoard"
import { TileRack } from "@/components/TileRack"
import { GameProvider, useGameContext } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"

const GameContent = () => {
  const { gameState, pendingTiles, placeTile, confirmMove, cancelMove, endTurn, resetGame, currentPlayer } = useGameContext()

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale - Board e controlli di gioco */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Benvenuto in Scarabeo Online</h1>
            <p className="text-muted-foreground">
              Il miglior sito per giocare a Scrabble online con motore di analisi avanzato
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <PlayButtons />
            {pendingTiles.length > 0 && (
              <>
                <Button onClick={confirmMove} variant="default">
                  Conferma Mossa ({pendingTiles.length} tessere)
                </Button>
                <Button onClick={cancelMove} variant="outline">
                  Annulla
                </Button>
              </>
            )}
            <Button onClick={endTurn} variant="outline" disabled={pendingTiles.length > 0}>
              Termina Turno
            </Button>
            <Button onClick={resetGame} variant="outline">
              Nuova Partita
            </Button>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium">
              Turno di: {currentPlayer.name} (Punteggio: {currentPlayer.score})
            </p>
            <p className="text-sm text-muted-foreground">
              Tessere rimanenti: {gameState.tileBag.length}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Board di Gioco</h2>
            <div className="flex justify-center">
              <ScrabbleBoard 
                placedTiles={gameState.board}
                pendingTiles={pendingTiles}
                onTilePlaced={(row, col, tile) => placeTile(row, col, tile)}
              />
            </div>
            <div className="mt-6">
              <TileRack tiles={currentPlayer.rack} />
            </div>
          </div>
        </div>

        {/* Sidebar destra - Statistiche e info */}
        <div className="space-y-6">
          <GameStats />
          
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Giocatori</h3>
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
                      {index === gameState.currentPlayerIndex ? 'Turno attivo' : 'In attesa'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Punteggio: {player.score} | Tessere: {player.rack.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Stato Partita</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{gameState.gameStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Tessere nella borsa:</span>
                <span>{gameState.tileBag.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tessere giocate:</span>
                <span>{gameState.board.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
