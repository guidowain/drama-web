import { NextRequest, NextResponse } from 'next/server'

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

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not set' }, { status: 500 })
    }

    const ext = file.name.split('.').pop()
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const res = await fetch(`https://blob.vercel-storage.com/${safeName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-content-type': file.type,
        'x-add-random-suffix': '0',
      },
      body: file.stream(),
      // @ts-expect-error - needed for streaming in Node.js
      duplex: 'half',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Blob API error: ${res.status} ${text}` }, { status: 500 })
    }

    const data = await res.json() as { url: string }
    return NextResponse.json({ url: data.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
