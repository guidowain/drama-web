import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    return NextResponse.json({
      ok: true,
      name: file?.name ?? 'no file',
      size: file?.size ?? 0,
      token: process.env.BLOB_READ_WRITE_TOKEN ? 'present' : 'missing',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
