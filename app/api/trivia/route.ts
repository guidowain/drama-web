import { NextResponse } from 'next/server'
import { getTriviaQuestions } from '@/lib/api'
import { selectTriviaGameQuestions } from '@/lib/trivia'

export const dynamic = 'force-dynamic'

export async function GET() {
  const questions = await getTriviaQuestions({ cached: true })
  const gameQuestions = selectTriviaGameQuestions(questions, 10)

  return NextResponse.json(gameQuestions)
}
