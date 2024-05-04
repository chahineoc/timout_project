import type { Config } from "drizzle-kit";

export const DATABASE_FILE = "db/sqlite.db";

export default {
  out: "./db/migrations",
  schema: "./db/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: DATABASE_FILE,
  },
} satisfies Config;
