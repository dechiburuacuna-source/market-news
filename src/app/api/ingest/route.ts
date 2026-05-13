import { NextResponse } from 'next/server'
import { runIngest } from '@/lib/runIngest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: false, errors: ['OPENAI_API_KEY not set'] })
  }

  const { searchParams } = new URL(req.url)
  const fullRefresh = searchParams.get('fullRefresh') === 'true'

  const result = await runIngest({ fullRefresh })
  return NextResponse.json({ success: result.errors.filter(e => e.startsWith('Fatal')).length === 0, ...result })
}
