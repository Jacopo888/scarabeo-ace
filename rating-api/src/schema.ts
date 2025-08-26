import { pgTable, serial, text, integer, timestamp, jsonb, index, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
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

export const puzzlePuzzles = pgTable('puzzle_puzzles', {
  id: uuid('id').primaryKey().defaultRandom(),
  board: jsonb('board').notNull(),
  rack: jsonb('rack').notNull(),
  bestScore: integer('best_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const puzzleScores = pgTable(
  'puzzle_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    puzzleId: uuid('puzzle_id')
      .references(() => puzzlePuzzles.id, { onDelete: 'cascade' })
      .notNull(),
    score: integer('score').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    puzzleIdx: index('puzzle_scores_puzzle_id_idx').on(table.puzzleId),
    userIdx: index('puzzle_scores_user_id_idx').on(table.userId),
    scoreIdx: index('puzzle_scores_score_idx').on(desc(table.score)),
  }),
);

export const dailyPuzzles = pgTable('daily_puzzles', {
  id: uuid('id').primaryKey().defaultRandom(),
  yyyymmdd: integer('yyyymmdd').notNull().unique(),
  board: jsonb('board').notNull(),
  rack: jsonb('rack').notNull(),
  bestScore: integer('best_score').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dailyScores = pgTable(
  'daily_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    yyyymmdd: integer('yyyymmdd').notNull(),
    score: integer('score').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userDayUnique: uniqueIndex('daily_scores_user_day_idx').on(table.userId, table.yyyymmdd),
    dayIdx: index('daily_scores_day_idx').on(table.yyyymmdd),
    scoreIdx: index('daily_scores_score_idx').on(desc(table.score)),
  }),
);
