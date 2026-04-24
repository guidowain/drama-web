import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, saveSiteSettings } from '@/lib/api'

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  await saveSiteSettings(body)
  return NextResponse.json({ ok: true })
}
