/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * On Vercel, every new deployment creates a fresh process, so this triggers
 * a news ingest automatically after each deploy.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

// Process-level flag: prevents duplicate ingest if multiple requests hit
// the same Lambda instance before the first ingest completes.
let _ingestStarted = false

export async function register() {
  // Only run in Node.js (not edge runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Only run if API keys are present
  if (!process.env.OPENAI_API_KEY || !process.env.GEMINI_API_KEY) return
  if (_ingestStarted) return
  _ingestStarted = true

  // Fire-and-forget: don't block server startup.
  // Dynamic import avoids loading heavy modules during build time.
  import('@/lib/runIngest')
    .then(({ runIngest }) => {
      console.log('[Deploy] Post-deploy ingest starting...')
      return runIngest()
    })
    .then(result => {
      console.log(`[Deploy] Post-deploy ingest done — ${result.processed} new articles stored`)
    })
    .catch(err => {
      console.error('[Deploy] Post-deploy ingest error:', (err as Error).message)
    })
}
