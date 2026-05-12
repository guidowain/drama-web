import { NextRequest, NextResponse } from 'next/server'
import { getDramaWords, saveDramaWords } from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { DramaWord } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeWord(item: Partial<DramaWord>): DramaWord {
  return {
    id: item.id || generateId(),
    word: (item.word || '').toUpperCase().trim(),
    projectId: item.projectId || '',
  }
}

function validateWord(entry: DramaWord) {
  return (
    /^[A-ZÁÉÍÓÚÜÑ]{5}$/.test(entry.word) &&
    entry.projectId.trim()
  )
}

export async function GET() {
  const words = await getDramaWords()
  return NextResponse.json(words)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const incoming = Array.isArray(body) ? body : []
  const normalized = incoming.map((item) => normalizeWord(item))
  const invalid = normalized.some((entry) => !validateWord(entry))

  if (invalid) {
    return NextResponse.json(
      { error: 'Cada palabra necesita exactamente 5 letras y una obra asociada.' },
      { status: 400 },
    )
  }

  await saveDramaWords(normalized)
  return NextResponse.json(normalized)
}
