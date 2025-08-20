import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  rating: integer('rating').default(1000).notNull(),
});

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  player1Id: integer('player1_id').references(() => players.id).notNull(),
  player2Id: integer('player2_id').references(() => players.id),
  winnerId: integer('winner_id').references(() => players.id),
});

export const rushPuzzles = pgTable('rush_puzzles', {
  id: text('id').primaryKey(),
  board: jsonb('board').notNull(),
  rack: jsonb('rack').notNull(),
  bestScore: integer('best_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
