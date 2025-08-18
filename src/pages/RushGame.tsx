import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Timer, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCountdown } from '@/hooks/useCountdown'
import { useDictionary } from '@/contexts/DictionaryContext'
import { useToast } from '@/hooks/use-toast'

interface Letter {
  letter: string
  points: number
}

interface RushPuzzle {
  id: string
  board: (string | null)[][]
  rack: Letter[]
  bestScore: number
}

const LETTER_VALUES: Record<string, number> = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
  'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
  'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
}

const RushGame = () => {
  const [puzzle, setPuzzle] = useState<RushPuzzle | null>(null)
  const [currentWord, setCurrentWord] = useState('')
  const [validWords, setValidWords] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const { timeLeft, isRunning, start, formatTime } = useCountdown()
  const { isValidWord } = useDictionary()
  const { toast } = useToast()

  useEffect(() => {
    fetchNewPuzzle()
  }, [])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      endGame()
    }
  }, [timeLeft, isRunning])

  const fetchNewPuzzle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:3000/api/rush/new')
      if (!response.ok) throw new Error('Failed to fetch puzzle')
      
      const newPuzzle = await response.json()
      setPuzzle(newPuzzle)
      setValidWords(new Set())
      setTotalScore(0)
      setIsGameOver(false)
      setCurrentWord('')
      start(90) // 90 seconds
    } catch (error) {
      console.error('Error fetching puzzle:', error)
      toast({
        title: "Error",
        description: "Failed to load new puzzle. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWordScore = (word: string): number => {
    return word.split('').reduce((sum, letter) => sum + (LETTER_VALUES[letter] || 0), 0)
  }

  const canFormWord = (word: string): boolean => {
    if (!puzzle) return false
    
    const available = [...puzzle.rack]
    const boardLetters: string[] = []
    
    // Get letters from board
    puzzle.board.forEach(row => {
      row.forEach(cell => {
        if (cell) boardLetters.push(cell)
      })
    })
    
    const allAvailable = [...available.map(t => t.letter), ...boardLetters]
    const needed = word.split('')
    
    for (const letter of needed) {
      const index = allAvailable.findIndex(l => l === letter)
      if (index === -1) return false
      allAvailable.splice(index, 1)
    }
    
    return true
  }

  const submitWord = async () => {
    if (!puzzle || currentWord.length < 2) return
    
    const word = currentWord.toUpperCase()
    
    // Check if already used
    if (validWords.has(word)) {
      toast({
        title: "Already Used",
        description: "You've already found this word!",
        variant: "destructive"
      })
      return
    }
    
    // Check if can be formed
    if (!canFormWord(word)) {
      toast({
        title: "Invalid Word",
        description: "Cannot form this word with available letters",
        variant: "destructive"
      })
      return
    }
    
    // Check dictionary
    if (await isValidWord(word)) {
      const score = calculateWordScore(word)
      setValidWords(prev => new Set([...prev, word]))
      setTotalScore(prev => prev + score)
      setCurrentWord('')
      
      toast({
        title: "Great Word!",
        description: `"${word}" is worth ${score} points!`,
      })
    } else {
      toast({
        title: "Invalid Word",
        description: "Word not found in dictionary",
        variant: "destructive"
      })
    }
  }

  const endGame = async () => {
    if (!puzzle || isGameOver) return
    
    setIsGameOver(true)
    
    try {
      await fetch('http://localhost:3000/rush/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, totalScore })
      })
    } catch (error) {
      console.error('Error submitting score:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGameOver) {
      submitWord()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-lg">Loading new puzzle...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <p className="text-lg mb-4">Failed to load puzzle</p>
          <Button onClick={fetchNewPuzzle}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          Rush Mode
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Game Area */}
        <div className="space-y-6">
          {/* Timer and Score */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{totalScore}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Board */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Board Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
                {puzzle.board.map((row, i) =>
                  row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square border-2 rounded-lg flex items-center justify-center text-lg font-bold bg-muted"
                    >
                      {cell || ''}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Tiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap justify-center">
                {puzzle.rack.map((tile, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center text-sm font-bold bg-card"
                  >
                    <span>{tile.letter}</span>
                    <span className="text-xs text-muted-foreground">{tile.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Input and Words */}
        <div className="space-y-6">
          {/* Word Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Words</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a word..."
                  disabled={isGameOver}
                  className="flex-1"
                />
                <Button 
                  onClick={submitWord} 
                  disabled={isGameOver || currentWord.length < 2}
                >
                  Submit
                </Button>
              </div>
              {isGameOver && (
                <Button onClick={fetchNewPuzzle} className="w-full">
                  New Puzzle
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Found Words */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Found Words ({validWords.size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {Array.from(validWords).map((word) => (
                  <Badge key={word} variant="secondary" className="text-sm">
                    {word} ({calculateWordScore(word)}pts)
                  </Badge>
                ))}
              </div>
              {validWords.size === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No words found yet. Start typing!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Game Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Puzzle Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Target Score:</span>
                <span className="font-semibold">{puzzle.bestScore}pts</span>
              </div>
              <div className="flex justify-between">
                <span>Your Score:</span>
                <span className="font-semibold">{totalScore}pts</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span className="font-semibold">
                  {Math.round((totalScore / puzzle.bestScore) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RushGame