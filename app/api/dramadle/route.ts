import { NextRequest, NextResponse } from 'next/server'
import { getDramaWords, getProjects } from '@/lib/api'
import { DRAMADLE_VALID_GUESSES, normalizeDramadleGuess } from '@/lib/dramadle-dictionary'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const exclude = request.nextUrl.searchParams.get('exclude') ?? ''
  const [allWords, projects] = await Promise.all([getDramaWords(), getProjects()])
  const playable = allWords.filter((word) => /^[A-ZÁÉÍÓÚÜÑ]{5}$/.test(word.word) && word.projectId.trim())

  if (!playable.length) {
    return NextResponse.json({ error: 'No hay palabras disponibles' }, { status: 404 })
  }

  const candidates = playable.length > 1 ? playable.filter((word) => word.id !== exclude) : playable
  const word = candidates[Math.floor(Math.random() * candidates.length)]
  const project = projects.find((item) => item.id === word.projectId)
  const validGuesses = Array.from(new Set([
    ...DRAMADLE_VALID_GUESSES,
    ...allWords.map((item) => item.word),
  ].map(normalizeDramadleGuess).filter((item) => item.length === 5)))

  return NextResponse.json({
    id: word.id,
    word: word.word,
    projectId: word.projectId,
    projectName: project?.name ?? '',
    projectSlug: project?.slug ?? '',
    projectYear: project?.year ?? null,
    projectTags: project?.tags ?? [],
    coverImage: project?.coverImage ?? '',
    validGuesses,
  })
}
