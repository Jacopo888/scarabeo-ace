const API_BASE = (() => {
  const url = import.meta.env.VITE_RATING_API_URL
  if (import.meta.env.MODE === 'development') {
    return '/api'
  }
  // Only use external URL if it's valid and not localhost in production
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url
  }
  return '' // Disable API calls if no valid production URL
})()

export interface AnalysisMove {
  row: number
  col: number
  dir: 'H' | 'V'
  word: string
  score: number
  rackBefore: string
}

export interface AnalysisRequest {
  moves: AnalysisMove[]
  boardSize: number
  lexicon: 'NWL' | 'CSW' | 'ITA'
}

export interface MissedOpportunity {
  turn: number
  betterWord: string
  scoreGain: number
  coords: [number, number]
  dir: 'H' | 'V'
}

export interface BingoChance {
  turn: number
  found: boolean
  bestBingo?: string
  score?: number
}

export interface TimelineEntry {
  turn: number
  my: number
  opp: number
  cumMy: number
  cumOpp: number
}

export interface RackAdvice {
  turn: number
  keep: string
  note: string
}

export interface AnalysisResponse {
  missed: MissedOpportunity[]
  bingoChances: BingoChance[]
  timeline: TimelineEntry[]
  rackAdvice: RackAdvice[]
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
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
    throw error
  }
}

export async function postAnalysis(payload: AnalysisRequest): Promise<AnalysisResponse> {
  if (!API_BASE) {
    throw new Error('Game analysis is not available in this environment')
  }

  const response = await fetchWithTimeout(`${API_BASE}/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}