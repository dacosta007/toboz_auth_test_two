import { SQL } from "bun";
import { building } from '$app/environment';


let sql;
// During the build, we don't want to connect to the database
// because it may not be available. So we just export a dummy object. 
if (!building) {
  // Initialize Bun's native universal SQL driver
  sql = new SQL({
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
}

export { sql };