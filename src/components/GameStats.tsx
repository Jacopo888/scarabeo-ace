import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const GameStats = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Le tue Statistiche</CardTitle>
          <CardDescription>Panoramica delle tue performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">1247</div>
              <div className="text-sm text-muted-foreground">Rating ELO</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">68%</div>
              <div className="text-sm text-muted-foreground">Vittorie</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">234</div>
              <div className="text-sm text-muted-foreground">Partite</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">89</div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Livello attuale</span>
              <Badge variant="secondary">Esperto</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Prossimo obiettivo</span>
              <span className="text-sm text-primary">1300 ELO</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}