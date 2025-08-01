import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/schema.ts',
  dialect: 'postgresql',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
