const API_BASE = '/api'

export interface RushPuzzleResponse {
  puzzleId: string
  board: any[]
  rack: any[]
  bestScore: number
}

export interface RushScoreRequest {
  puzzleId: string
  userId: string
  score: number
}

export interface RushLeaderboardEntry {
  id: string
  user_id: string
  puzzle_id: string
  score: number
  created_at: string
}

export async function fetchRushPuzzle(): Promise<RushPuzzleResponse> {
  const response = await fetch(`${API_BASE}/rush/new`)
  if (!response.ok) {
    throw new Error('Failed to fetch puzzle')
  }
  return response.json()
}

export async function submitRushScore(data: RushScoreRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/rush/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to submit score')
  }
}

export async function fetchRushLeaderboard(limit = 50): Promise<RushLeaderboardEntry[]> {
  const response = await fetch(`${API_BASE}/rush/leaderboard?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard')
  }
  return response.json()
}