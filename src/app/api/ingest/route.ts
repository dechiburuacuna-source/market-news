import { NextResponse } from 'next/server'
import { runIngest } from '@/lib/runIngest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function handle(req: Request) {
  const { searchParams } = new URL(req.url)
  const fullRefresh = searchParams.get('fullRefresh') !== 'false'

  const diagnostics = {
    gemini_configured: !!process.env.GEMINI_API_KEY,
    openai_configured: !!process.env.OPENAI_API_KEY,
    supabase_configured: !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)),
  }

  const result = await runIngest({ fullRefresh })
  return NextResponse.json({
    success: result.errors.filter(e => e.startsWith('Fatal')).length === 0,
    diagnostics,
    ...result,
  })
}

export async function POST(req: Request) { return handle(req) }
export async function GET(req: Request)  { return handle(req) }
