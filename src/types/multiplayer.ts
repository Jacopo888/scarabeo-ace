export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  games_played: number
  games_won: number
  total_score: number
  skill_level: number
  preferred_game_duration: '1h' | '6h' | '24h' | '48h'
  created_at: string
  updated_at: string
}

export interface GameRecord {
  id: string
  player1_id: string
  player2_id: string
  current_player_id: string
  status: 'waiting' | 'active' | 'completed' | 'abandoned'
  winner_id?: string
  board_state: any
  tile_bag: any[]
  player1_rack: any[]
  player2_rack: any[]
  player1_score: number
  player2_score: number
  turn_deadline?: string
  turn_duration: '1h' | '6h' | '24h' | '48h'
  pass_count: number
  created_at: string
  updated_at: string
}

export interface MoveRecord {
  id: string
  game_id: string
  player_id: string
  move_type: 'place_tiles' | 'exchange_tiles' | 'pass'
  tiles_placed: any[]
  tiles_exchanged: any[]
  words_formed: any[]
  score_earned: number
  board_state_after: any
  rack_after: any[]
  created_at: string
}

export interface MatchmakingEntry {
  id: string
  user_id: string
  skill_level: number
  preferred_duration: '1h' | '6h' | '24h' | '48h'
  created_at: string
}