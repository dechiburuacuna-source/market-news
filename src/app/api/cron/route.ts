import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Triggered daily at 12:00 UTC = 08:00 Chile (CLT, UTC-4)
// During summer (CLST, UTC-3) this fires at 09:00 local — acceptable window
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (process.env.NODE_ENV === 'production' && secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${appUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret || ''}` },
    })
    const data = await response.json()
    console.log('[Cron 08:00 CLT] Ingest completed:', data)
    return NextResponse.json({ triggered: true, timestamp: new Date().toISOString(), chile_time: '08:00 CLT', ...data })
  } catch (err) {
    console.error('[Cron] Failed:', err)
    return NextResponse.json({ triggered: false, error: (err as Error).message }, { status: 500 })
  }
}
