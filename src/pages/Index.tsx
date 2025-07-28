import { PlayButtons } from "@/components/PlayButtons"

const Index = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Scrabble Online</h1>
            <p className="text-lg text-muted-foreground">
              The best place to play Scrabble online with advanced analysis
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <PlayButtons />
          </div>
          
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-semibold">Game Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium mb-2">Smart Bot Opponents</h3>
                <p className="text-muted-foreground">Choose from Easy, Medium, or Hard difficulty levels</p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium mb-2">Advanced Word Dictionary</h3>
                <p className="text-muted-foreground">Uses the comprehensive ENABLE word list</p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium mb-2">Interactive Tile Management</h3>
                <p className="text-muted-foreground">Drag, drop, reshuffle, and reposition tiles easily</p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium mb-2">Real-time Scoring</h3>
                <p className="text-muted-foreground">See your score calculated instantly with multipliers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Index;
