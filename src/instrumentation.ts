/**
 * Runs once when the server process starts (each Vercel cold start / deploy).
 * No-op: news search is now triggered manually via the "Search News" button in the UI.
 */
export async function register() {
  // Manual refresh only — no automatic ingest on startup.
}
