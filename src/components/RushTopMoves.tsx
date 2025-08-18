import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Eye, EyeOff } from 'lucide-react'
import { RushMove } from '@/types/rush'
import { cn } from '@/lib/utils'

interface RushTopMovesProps {
  topMoves: RushMove[]
  foundMoves: Set<string>
}

function getMoveKey(move: RushMove): string {
  // Create canonical key by sorting tiles by position
  const sortedTiles = [...move.tiles].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
  return sortedTiles.map(t => `${t.row},${t.col},${t.letter}`).join('|')
}

export const RushTopMoves = ({ topMoves, foundMoves }: RushTopMovesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top 5 Moves
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topMoves.map((move, index) => {
            const moveKey = getMoveKey(move)
            const isFound = foundMoves.has(moveKey)
            
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  isFound 
                    ? "bg-success/10 border-success/20" 
                    : "bg-muted/50 border-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={isFound ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  {isFound ? (
                    <Eye className="h-4 w-4 text-success" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    {isFound ? (
                      <div className="font-medium">
                        {move.words.join(', ')}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        ???
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {isFound ? (
                    <span className="font-bold text-success">
                      {move.score} pts
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      — pts
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Found:</span>
            <span className="font-medium">
              {foundMoves.size} / {topMoves.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}