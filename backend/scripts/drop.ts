import { DATABASE_FILE } from "../db/drizzle.config";
import { existsSync, unlinkSync } from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), DATABASE_FILE);

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log(`db ${DATABASE_FILE} dropped`);
} else {
  console.log(`db ${DATABASE_FILE} not found. Nothing to drop.`);
}
