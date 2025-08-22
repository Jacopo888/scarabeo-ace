import useSWR from 'swr'
import { fetchRushPuzzle, fetchRushLeaderboard, RushPuzzleResponse, RushLeaderboardEntry } from '@/api/rush'

export function useRushPuzzle() {
  return useSWR<RushPuzzleResponse>('/api/rush/new', fetchRushPuzzle, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })
}

export function useRushLeaderboard(refreshMs = 15000) {
  return useSWR<RushLeaderboardEntry[]>('/api/rush/leaderboard', () => fetchRushLeaderboard(50), {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
  })
}