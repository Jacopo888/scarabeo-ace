import { PlayButtons } from "@/components/PlayButtons"
import { GameStats } from "@/components/GameStats"
import { ScrabbleBoard } from "@/components/ScrabbleBoard"
import { TileRack } from "@/components/TileRack"

const mockTiles = [
  { letter: "A", points: 1 },
  { letter: "E", points: 1 },
  { letter: "R", points: 1 },
  { letter: "T", points: 1 },
  { letter: "O", points: 1 },
  { letter: "N", points: 1 },
  { letter: "S", points: 1 },
]

const Index = () => {
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

          <PlayButtons />

          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Board di Gioco</h2>
            <div className="flex justify-center">
              <ScrabbleBoard />
            </div>
            <div className="mt-6">
              <TileRack tiles={mockTiles} />
            </div>
          </div>
        </div>

        {/* Sidebar destra - Statistiche e info */}
        <div className="space-y-6">
          <GameStats />
          
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Partite Attive</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>vs. GiocatoreXYZ</span>
                <span className="text-primary">Il tuo turno</span>
              </div>
              <div className="flex justify-between">
                <span>vs. Bot Difficile</span>
                <span className="text-muted-foreground">Suo turno</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-3">Ultima Partita</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>vs. Bot Medio</span>
                <span className="text-primary font-medium">Vittoria</span>
              </div>
              <div className="flex justify-between">
                <span>Punteggio:</span>
                <span>342 - 289</span>
              </div>
              <div className="flex justify-between">
                <span>Precisione:</span>
                <span>87%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
