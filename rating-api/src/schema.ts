import { pgTable, serial, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { desc } from 'drizzle-orm';

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
  id: serial('id').primaryKey(),
  board: jsonb('board').notNull(),
  rack: jsonb('rack').notNull(),
  bestScore: integer('best_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rushScores = pgTable(
  'rush_scores',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => players.id).notNull(),
    puzzleId: integer('puzzle_id')
      .references(() => rushPuzzles.id, { onDelete: 'cascade' })
      .notNull(),
    score: integer('score').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    puzzleIdx: index('rush_scores_puzzle_id_idx').on(table.puzzleId),
    userIdx: index('rush_scores_user_id_idx').on(table.userId),
    scoreIdx: index('rush_scores_score_idx').on(desc(table.score)),
  }),
);
