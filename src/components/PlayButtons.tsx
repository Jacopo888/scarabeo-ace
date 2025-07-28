import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Bot, Trophy, Clock } from "lucide-react"
import { useState } from "react"
import { DifficultyModal, Difficulty } from "@/components/DifficultyModal"
import { useNavigate } from "react-router-dom"
import { useBotContext } from "@/contexts/BotContext"
import { useAuth } from "@/contexts/AuthContext"

export const PlayButtons = () => {
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const navigate = useNavigate()
  const { setDifficulty } = useBotContext()
  const { user } = useAuth()
  
  const handleBotPlay = () => {
    setShowDifficultyModal(true)
  }
  
  const handleDifficultySelect = (difficulty: Difficulty) => {
    setDifficulty(difficulty)
    navigate('/game')
  }
  
  const handleQuickMatch = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    navigate('/game')
  }
  
  return (
    <>
      <DifficultyModal 
        open={showDifficultyModal}
        onOpenChange={setShowDifficultyModal}
        onSelectDifficulty={handleDifficultySelect}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Gioca Online</CardTitle>
              <CardDescription>
                Sfida giocatori da tutto il mondo in partite a turni asincroni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleQuickMatch}>
                Trova Partita
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Gioca contro Computer</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleBotPlay}>
                Scegli Difficoltà
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Tornei</CardTitle>
              <CardDescription>
                Partecipa ai tornei settimanali e mensili
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Partite Rapide</CardTitle>
              <CardDescription>
                Gioca partite veloci da 10 minuti
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </>
  )
}