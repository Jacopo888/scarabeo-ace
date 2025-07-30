import express from 'express';
import { db } from './db';
import { players } from './schema';

const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/players', async (_req, res) => {
  const allPlayers = await db.select().from(players);
  res.json(allPlayers);
});

app.listen(port, () => {
  console.log(`rating-api listening on port ${port}`);
});
