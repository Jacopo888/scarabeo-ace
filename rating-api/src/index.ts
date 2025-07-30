import express from 'express'
import { db } from './db'
import { players, games } from './schema'
import { eq, desc } from 'drizzle-orm'
import { createClient } from 'redis'
import { calculateElo, Mode } from './elo'

const app = express()
const port = process.env.PORT || 3000
app.use(express.json())

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
redis.connect().catch((err) => console.error('Redis connect error', err))

app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/rating', async (_req, res) => {
  const cached = await redis.get('leaderboard')
  if (cached) {
    return res.json(JSON.parse(cached))
  }
  const board = await db.select().from(players).orderBy(desc(players.rating))
  await redis.set('leaderboard', JSON.stringify(board), { EX: 60 })
  res.json(board)
})

app.get('/rating/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
  const [player] = await db.select().from(players).where(eq(players.id, id))
  if (!player) return res.status(404).json({ error: 'Player not found' })
  res.json({ id: player.id, rating: player.rating })
})

app.post('/rating/report', async (req, res) => {
  const { player1Id, player2Id, winnerId, mode } = req.body as {
    player1Id: number
    player2Id: number
    winnerId: number
    mode: Mode
  }
  if (!player1Id || !player2Id || !winnerId || !mode) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  if (!['blitz', 'rapid', 'async'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' })
  }
  const [p1] = await db.select().from(players).where(eq(players.id, player1Id))
  const [p2] = await db.select().from(players).where(eq(players.id, player2Id))
  if (!p1 || !p2) return res.status(404).json({ error: 'Player not found' })

  const winner = winnerId === player1Id ? 'A' : winnerId === player2Id ? 'B' : 'draw'
  const { newRatingA, newRatingB } = calculateElo(p1.rating, p2.rating, winner, mode)

  await db.transaction(async (tx) => {
    await tx.update(players).set({ rating: newRatingA }).where(eq(players.id, player1Id))
    await tx.update(players).set({ rating: newRatingB }).where(eq(players.id, player2Id))
    await tx.insert(games).values({ player1Id, player2Id, winnerId })
  })

  await redis.del('leaderboard')
  res.json({ player1Id, rating1: newRatingA, player2Id, rating2: newRatingB })
})

app.get('/players', async (_req, res) => {
  const allPlayers = await db.select().from(players);
  res.json(allPlayers);
});

app.listen(port, () => {
  console.log(`rating-api listening on port ${port}`);
});

export default app
