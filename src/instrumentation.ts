/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * On Vercel, every new deployment creates a fresh process, so this triggers
 * a full news refresh automatically after each deploy.
 *
 * We fire an HTTP call to /api/ingest rather than importing runIngest directly
 * so the ingest runs in its own Lambda (maxDuration: 300s) instead of being
 * killed when this short-lived startup Lambda terminates.
 */

let _ingestStarted = false

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.OPENAI_API_KEY || !process.env.GEMINI_API_KEY) return
  if (_ingestStarted) return
  _ingestStarted = true

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const secret = process.env.CRON_SECRET

  if (!appUrl || !secret) {
    console.warn('[Deploy] NEXT_PUBLIC_APP_URL or CRON_SECRET not set — skipping post-deploy ingest')
    return
  }

  console.log('[Deploy] Triggering post-deploy full-refresh ingest...')
  fetch(`${appUrl}/api/ingest?fullRefresh=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  })
    .then(r => console.log(`[Deploy] Ingest triggered — status ${r.status}`))
    .catch(err => console.error('[Deploy] Ingest trigger error:', (err as Error).message))
}
