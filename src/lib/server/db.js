import { SQL } from "bun";

// Initialize Bun's native universal SQL driver
export const sql = new SQL({
  url: process.env.DATABASE_URL,
  ssl: true // Neon requires SSL
});

// Create the sessions tracking table if it doesn't exist yet
await sql`
  CREATE TABLE IF NOT EXISTS telegram_sessions (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
  )
`;
