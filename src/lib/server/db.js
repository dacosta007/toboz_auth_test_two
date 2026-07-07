import { building } from '$app/environment';

let sql = null;

// Only evaluate when the application is running live
if (!building) {
  try {
    // 1. Check if the native Bun global object exists
    if (typeof Bun !== 'undefined') {
      // 2. Safely import the native module dynamically without Node seeing it
      const { SQL } = await import('bun');
      
      sql = new SQL({
        url: process.env.DATABASE_URL,
        // ssl: true
        ssl: { rejectUnauthorized: false }
      });
    } else {
      console.warn("⚠️ Bun runtime not detected (Likely running in an isolated build tool).");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Bun SQL driver:", error);
  }
}

export { sql };
