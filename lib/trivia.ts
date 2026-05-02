import type { TriviaQuestion } from './types'

function shuffle<T>(items: T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]

    shuffled[index] = shuffled[targetIndex]
    shuffled[targetIndex] = current
  }

  return shuffled
}

function getQuestionGroupKey(question: TriviaQuestion) {
  const projectId = question.projectId?.trim()

  if (projectId) return `project:${projectId}`

  return `manual:${question.id}`
}

export function getPlayableTriviaQuestion(question: TriviaQuestion): TriviaQuestion | null {
  const options = question.options
    .filter((option) => option.text.trim())
    .map((option) => ({
      ...option,
      text: option.text.trim(),
    }))
  const hasCorrectOption = options.some((option) => option.isCorrect)

  if (!question.image.trim()) return null
  if (!question.question.trim()) return null
  if (options.length < 2) return null
  if (!hasCorrectOption) return null

  return {
    ...question,
    image: question.image.trim(),
    question: question.question.trim(),
    options,
  }
}

export function selectTriviaGameQuestions(questions: TriviaQuestion[], limit = 10) {
  const groupedQuestions = new Map<string, TriviaQuestion[]>()

  questions.forEach((question) => {
    const playableQuestion = getPlayableTriviaQuestion(question)

    if (!playableQuestion) return

    const groupKey = getQuestionGroupKey(playableQuestion)
    const group = groupedQuestions.get(groupKey) || []

    groupedQuestions.set(groupKey, [...group, playableQuestion])
  })

  const oneQuestionPerGroup = Array.from(groupedQuestions.values()).map((group) => shuffle(group)[0])

  return shuffle(oneQuestionPerGroup).slice(0, limit)
}
