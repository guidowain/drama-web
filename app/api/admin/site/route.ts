import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, saveSiteSettings } from '@/lib/api'

export async function GET() {
  const settings = getSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  saveSiteSettings(body)
  return NextResponse.json({ ok: true })
}
