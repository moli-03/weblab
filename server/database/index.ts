import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "../../utils/env";

const dbUrl = `postgres://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

const pool = new Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
