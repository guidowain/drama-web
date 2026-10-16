import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAnalyticsSummary } from '@/lib/google-analytics'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const summary = await getAnalyticsSummary()
  return NextResponse.json(summary)
}
