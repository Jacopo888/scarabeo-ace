import { useState, useEffect } from 'react'
import { postAnalysis, AnalysisResponse, AnalysisRequest } from '@/api/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle, XCircle, TrendingUp, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GameMove {
  row: number
  col: number
  word: string
  score: number
  direction: 'H' | 'V'
  rackBefore: string
}

interface AnalysisPanelProps {
  game: {
    moves: GameMove[]
    lexicon?: 'NWL' | 'CSW' | 'ITA'
  }
}

export function AnalysisPanel({ game }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)

        const payload: AnalysisRequest = {
          moves: game.moves.map(move => ({
            row: move.row,
            col: move.col,
            dir: move.direction,
            word: move.word,
            score: move.score,
            rackBefore: move.rackBefore
          })),
          boardSize: 15,
          lexicon: game.lexicon || 'NWL'
        }

        const result = await postAnalysis(payload)
        setAnalysis(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
        setError(errorMessage)
        toast({
          title: 'Analysis Error',
          description: errorMessage,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    if (game.moves.length > 0) {
      runAnalysis()
    }
  }, [game, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analysis Unavailable</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No analysis data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Missed Best Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Missed Best Moves
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.missed.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">Great job! No major missed opportunities found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.missed.map((miss, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Turn {miss.turn}: {miss.betterWord}</div>
                    <div className="text-sm text-muted-foreground">
                      Position: {String.fromCharCode(65 + miss.coords[1])}{miss.coords[0] + 1} ({miss.dir === 'H' ? 'Horizontal' : 'Vertical'})
                    </div>
                  </div>
                  <Badge variant="secondary">+{miss.scoreGain} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Score Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="turn" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="cumMy" stroke="hsl(var(--primary))" strokeWidth={2} name="You" />
                <Line type="monotone" dataKey="cumOpp" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Opponent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bingo Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Bingo Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.bingoChances.map((bingo, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant={bingo.found ? "default" : "secondary"} className="cursor-help">
                      Turn {bingo.turn} {bingo.found ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {bingo.found ? (
                      <div>
                        <div className="font-medium">{bingo.bestBingo}</div>
                        <div className="text-sm">{bingo.score} points</div>
                      </div>
                    ) : (
                      <div>No bingo opportunity found</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rack Advice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Rack Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.rackAdvice.map((advice, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Turn {advice.turn}</span>
                  <Badge variant="outline">{advice.keep}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{advice.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}