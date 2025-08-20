CREATE TABLE "rush_puzzles" (
  "id" text PRIMARY KEY NOT NULL,
  "board" jsonb NOT NULL,
  "rack" jsonb NOT NULL,
  "best_score" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
