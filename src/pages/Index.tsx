import { PlayButtons } from "@/components/PlayButtons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Users, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const Index = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

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

          {/* Multiplayer Section */}
          <div className="max-w-lg mx-auto">
            {user && profile ? (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Dashboard Multiplayer
                  </CardTitle>
                  <CardDescription>
                    Gestisci le tue partite online e trova nuovi avversari
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/dashboard">
                    <Button className="w-full">
                      Vai alla Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-6 w-6" />
                    Accedi per Multiplayer
                  </CardTitle>
                  <CardDescription>
                    Crea un account per giocare online
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/auth">
                    <Button className="w-full">
                      Accedi / Registrati
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
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
