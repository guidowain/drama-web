import { NextRequest, NextResponse } from 'next/server'
import { getDramaWords, getProjects } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const exclude = request.nextUrl.searchParams.get('exclude') ?? ''

  const [allWords, projects] = await Promise.all([getDramaWords(), getProjects()])

  const playable = allWords.filter(
    (w) => /^[A-ZÁÉÍÓÚÜÑ]{5}$/.test(w.word) && w.projectId.trim(),
  )

  if (!playable.length) {
    return NextResponse.json({ error: 'No hay palabras disponibles' }, { status: 404 })
  }

  const candidates = playable.length > 1 ? playable.filter((w) => w.id !== exclude) : playable
  const word = candidates[Math.floor(Math.random() * candidates.length)]
  const project = projects.find((p) => p.id === word.projectId)

  return NextResponse.json({
    id: word.id,
    word: word.word,
    projectId: word.projectId,
    projectName: project?.name ?? '',
    projectSlug: project?.slug ?? '',
    projectYear: project?.year ?? null,
    projectTags: project?.tags ?? [],
    coverImage: project?.coverImage ?? '',
  })
}
