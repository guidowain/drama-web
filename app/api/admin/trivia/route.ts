import { NextRequest, NextResponse } from 'next/server'
import { getTriviaQuestions, saveTriviaQuestions } from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { TriviaQuestion } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeQuestion(item: Partial<TriviaQuestion>): TriviaQuestion {
  const options = Array.isArray(item.options) ? item.options : []

  return {
    id: item.id || generateId(),
    image: item.image || '',
    question: item.question || '',
    options: options.slice(0, 4).map((option) => ({
      id: option?.id || generateId(),
      text: option?.text || '',
      isCorrect: Boolean(option?.isCorrect),
    })),
  }
}

function validateQuestion(question: TriviaQuestion) {
  const filledOptions = question.options.filter((option) => option.text.trim())

  return (
    question.image.trim() &&
    question.question.trim() &&
    filledOptions.length >= 2 &&
    filledOptions.some((option) => option.isCorrect)
  )
}

export async function GET() {
  const questions = await getTriviaQuestions()
  return NextResponse.json(questions)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const incoming = Array.isArray(body) ? body : []
  const normalized = incoming.map((item) => normalizeQuestion(item))
  const invalid = normalized.some((question) => !validateQuestion(question))

  if (invalid) {
    return NextResponse.json(
      { error: 'Cada pregunta necesita imagen, pregunta, mínimo 2 opciones y una respuesta correcta.' },
      { status: 400 },
    )
  }

  await saveTriviaQuestions(normalized)
  return NextResponse.json(normalized)
}
