'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import type { TriviaOption, TriviaQuestion } from '@/lib/types'

type ProjectOption = {
  id: string
  name: string
  coverImage: string
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createOption(isCorrect = false): TriviaOption {
  return {
    id: createId('option'),
    text: '',
    isCorrect,
  }
}

function createQuestion(): TriviaQuestion {
  return {
    id: createId('trivia'),
    projectId: '',
    image: '',
    question: '',
    options: [createOption(true), createOption(false), createOption(false), createOption(false)],
  }
}

function ensureFourOptions(options: TriviaOption[]) {
  const normalized = [...options]

  while (normalized.length < 4) {
    normalized.push(createOption(false))
  }

  return normalized.slice(0, 4)
}

function normalizeForAdmin(question: TriviaQuestion): TriviaQuestion {
  return {
    ...question,
    projectId: question.projectId || '',
    options: ensureFourOptions(question.options || []),
  }
}

function normalizeBeforeSave(questions: TriviaQuestion[]) {
  return questions.map((question) => {
    const options = question.options
      .map((option) => ({
        ...option,
        text: option.text.trim(),
      }))

    return {
      ...question,
      projectId: question.projectId || '',
      image: question.image.trim(),
      question: question.question.trim(),
      options,
    }
  })
}

function validateQuestions(questions: TriviaQuestion[]) {
  for (let index = 0; index < questions.length; index += 1) {
    const number = index + 1
    const question = questions[index]
    const filledOptions = question.options.filter((option) => option.text.trim())
    const correctOption = question.options.find((option) => option.isCorrect)

    if (!question.image.trim()) return `La pregunta ${number} necesita una imagen.`
    if (!question.question.trim()) return `La pregunta ${number} necesita el texto de la pregunta.`
    if (filledOptions.length < 2) return `La pregunta ${number} necesita al menos dos opciones.`
    if (!correctOption?.text.trim()) return `La pregunta ${number} necesita una respuesta correcta con texto.`
  }

  return ''
}

export default function AdminTriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const questionCount = questions.length
  const canSave = useMemo(() => !saving && !loading, [loading, saving])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/trivia').then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar la trivia')
        return response.json()
      }),
      fetch('/api/admin/proyectos').then((response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los proyectos')
        return response.json()
      }),
    ])
      .then(([triviaData, projectsData]) => {
        setQuestions(Array.isArray(triviaData) ? triviaData.map(normalizeForAdmin) : [])
        setProjects(
          Array.isArray(projectsData)
            ? projectsData
                .filter((project) => project?.id && project?.name && project?.coverImage)
                .map((project) => ({
                  id: project.id,
                  name: project.name,
                  coverImage: project.coverImage,
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
            : []
        )
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la trivia')
      })
      .finally(() => setLoading(false))
  }, [])

  function updateQuestion(questionId: string, changes: Partial<TriviaQuestion>) {
    setQuestions((current) =>
      current.map((question) => (
        question.id === questionId ? { ...question, ...changes } : question
      ))
    )
  }

  function updateOption(questionId: string, optionId: string, changes: Partial<TriviaOption>) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question

        return {
          ...question,
          options: question.options.map((option) => (
            option.id === optionId ? { ...option, ...changes } : option
          )),
        }
      })
    )
  }

  function setCorrectOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question

        return {
          ...question,
          options: question.options.map((option) => ({
            ...option,
            isCorrect: option.id === optionId,
          })),
        }
      })
    )
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()])
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) => current.filter((question) => question.id !== questionId))
  }

  function selectProject(questionId: string, projectId: string) {
    const selectedProject = projects.find((project) => project.id === projectId)

    updateQuestion(questionId, {
      projectId,
      image: selectedProject?.coverImage || '',
    })
  }

  async function handleSave() {
    setError('')
    const validationError = validateQuestions(questions)

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/trivia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeBeforeSave(questions)),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo guardar la trivia')
      }

      const savedQuestions = await response.json()
      setQuestions(Array.isArray(savedQuestions) ? savedQuestions.map(normalizeForAdmin) : [])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la trivia')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-white/30">Cargando...</div>

  return (
    <div className="p-8 md:p-10 max-w-5xl">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-white font-black text-3xl uppercase">Trivia</h1>
          <p className="text-white/30 text-sm mt-1">
            Cargá todas las preguntas que quieras. Después el juego va a elegir 10 al azar.
          </p>
        </div>

        <TriviaActions
          canSave={canSave}
          saving={saving}
          saved={saved}
          onAddQuestion={addQuestion}
          onSave={handleSave}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      {questionCount === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-8 text-center">
          <p className="text-white/40 text-sm mb-5">Todavía no hay preguntas cargadas.</p>
          <button
            type="button"
            onClick={addQuestion}
            className="bg-white text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <section
              key={question.id}
              className="relative rounded-2xl border border-white/5 bg-zinc-900 p-5 pr-12 md:p-6 md:pr-14"
            >
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="danger-x absolute right-4 top-4"
                aria-label={`Eliminar pregunta ${index + 1}`}
                title="Eliminar"
              >
                ×
              </button>
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-white/70 text-xs font-black uppercase tracking-[0.22em]">
                  Pregunta {index + 1}
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <div>
                  <Field label="Obra">
                    <select
                      value={question.projectId || ''}
                      onChange={(event) => selectProject(question.id, event.target.value)}
                      className="admin-input mb-4"
                    >
                      <option value="">Elegir proyecto...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">
                    Imagen cuadrada
                  </label>
                  <TriviaImagePreview image={question.image} />
                </div>

                <div className="space-y-5">
                  <Field label="Pregunta">
                    <textarea
                      value={question.question}
                      onChange={(event) => updateQuestion(question.id, { question: event.target.value })}
                      className="admin-input min-h-[92px] resize-y"
                      placeholder="Escribí la pregunta..."
                    />
                  </Field>

                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <label className="text-white/40 text-xs uppercase tracking-wider">
                        Opciones
                      </label>
                      <span className="text-white/20 text-xs uppercase tracking-widest">
                        Las vacías no cuentan
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ensureFourOptions(question.options).map((option, optionIndex) => (
                        <div key={option.id} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(question.id, option.id)}
                            aria-label={`Marcar opción ${optionIndex + 1} como correcta`}
                            className={[
                              'h-10 w-10 shrink-0 rounded-full border text-xs font-black transition-colors',
                              option.isCorrect
                                ? 'border-green-300 bg-green-300 text-black'
                                : 'border-white/10 bg-black/20 text-white/25 hover:border-white/30 hover:text-white/60',
                            ].join(' ')}
                          >
                            ✓
                          </button>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(event) => updateOption(question.id, option.id, { text: event.target.value })}
                            className="admin-input"
                            placeholder={`Opción ${optionIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}

          <div className="flex justify-end border-t border-white/5 pt-6">
            <TriviaActions
              canSave={canSave}
              saving={saving}
              saved={saved}
              onAddQuestion={addQuestion}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TriviaActions({
  canSave,
  saving,
  saved,
  onAddQuestion,
  onSave,
}: {
  canSave: boolean
  saving: boolean
  saved: boolean
  onAddQuestion: () => void
  onSave: () => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onAddQuestion}
        className="bg-white text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
      >
        Agregar pregunta
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
      </button>
    </div>
  )
}

function TriviaImagePreview({ image }: { image: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20">
      {image ? (
        <Image
          src={image}
          alt="Portada seleccionada para la trivia"
          fill
          className="object-contain"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-medium text-white/25">
          Elegí una obra para cargar su portada
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  )
}
