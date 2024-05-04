import Database from "better-sqlite3";
import { DATABASE_FILE } from "./drizzle.config";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlite = new Database(DATABASE_FILE);

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: "./db/migrations" });
