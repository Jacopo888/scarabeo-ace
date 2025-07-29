# Multiplayer Game End Rules

A multiplayer game ends when `canEndGame` returns `true`. The helper checks if the tile bag is empty and one of the players has no tiles left. When this happens, each player's final score is reduced by the sum of the points from the tiles remaining in their rack. The player with the higher score after these deductions is stored as the `winner_id`.

When the game is marked as `completed` the application:

1. Calls `canEndGame` with both player racks and the current tile bag.
2. If the game can finish, `calculateEndGamePenalty` is run for each rack.
3. The penalty values are subtracted from `player1_score` and `player2_score`.
4. The updated scores and winner are saved to the `games` table before the final move is recorded.
