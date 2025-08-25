// Determine API base URL - prefer VITE_RATING_API_URL, fallback to proxy in dev
const API_BASE = import.meta.env.VITE_RATING_API_URL || (import.meta.env.MODE === 'development' ? '/api' : '')

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

// Safe JSON parsing to avoid crashes on HTML responses
async function safeJsonParse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server returned ${contentType}, expected JSON`)
  }
  
  try {
    return await response.json()
  } catch (error) {
    throw new Error('Invalid JSON response from server')
  }
}

// Fetch with timeout to prevent hanging
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - server not responding')
    }
    throw error
  }
}

export async function fetchRushPuzzle(): Promise<RushPuzzleResponse> {
  // If no API base URL, fail fast to trigger local fallback
  if (!API_BASE) {
    throw new Error('Rating API not configured - using local fallback')
  }
  
  const response = await fetchWithTimeout(`${API_BASE}/rush/new`)
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.status} ${response.statusText}`)
  }
  return safeJsonParse<RushPuzzleResponse>(response)
}

export async function submitRushScore(data: RushScoreRequest): Promise<void> {
  if (!API_BASE) {
    throw new Error('Rating API not configured - scores cannot be saved')
  }
  
  const response = await fetchWithTimeout(`${API_BASE}/rush/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to submit score: ${response.status} - ${errorText}`)
  }
}

export async function fetchRushLeaderboard(limit = 50): Promise<RushLeaderboardEntry[]> {
  if (!API_BASE) {
    throw new Error('Rating API not configured - leaderboard unavailable')
  }
  
  const response = await fetchWithTimeout(`${API_BASE}/rush/leaderboard?limit=${limit}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`)
  }
  return safeJsonParse<RushLeaderboardEntry[]>(response)
}