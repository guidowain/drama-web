import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAnalyticsSummary } from '@/lib/google-analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const summary = await getAnalyticsSummary()
  return NextResponse.json(summary)
}
