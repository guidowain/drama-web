import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(safeName, file, { access: 'public' })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
