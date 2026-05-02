'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { TriviaQuestion } from '@/lib/types'

type Props = {
  active: boolean
  onClose: () => void
}

type CountdownValue = '3' | '2' | '1' | 'DRAMA TRIVIA' | null
type AnswerState = 'correct' | 'incorrect' | null

function getResultLabel(score: number) {
  if (score < 5) return 'TE FALTA ENSAYO'
  if (score < 8) return 'NOSOTROS TE LLAMAMOS'
  return 'QUEDASTE EN LA OBRA!'
}

function getShareText(score: number, total: number) {
  return `DRAMA TRIVIA - ${score}/${total} - ${getResultLabel(score)}`
}

function renderQuestionText(text: string) {
  return Array.from(text).map((character, index) => {
    if (character !== '¿') return character

    return (
      <span
        key={`inverted-question-${index}`}
        className="inline-block origin-center rotate-180"
        aria-hidden="true"
      >
        ?
      </span>
    )
  })
}

async function createResultFile(score: number, total: number) {
  const canvas = document.createElement('canvas')
  const width = 1080
  const height = 1920
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  canvas.width = width
  canvas.height = height

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#F504FF')
  gradient.addColorStop(0.42, '#FE796D')
  gradient.addColorStop(0.72, '#FCC028')
  gradient.addColorStop(1, '#F504FF')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.arc(820, 250, 360, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 104px Arial, sans-serif'
  ctx.fillText('DRAMA', width / 2, 520)
  ctx.fillText('TRIVIA', width / 2, 640)

  ctx.font = '900 220px Arial, sans-serif'
  ctx.fillText(`${score}/${total}`, width / 2, 950)

  const label = getResultLabel(score)
  ctx.font = '900 76px Arial, sans-serif'
  const words = label.split(' ')
  const lines = words.length > 3
    ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
    : [label]

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, 1210 + index * 92)
  })

  ctx.font = '900 34px Arial, sans-serif'
  ctx.fillText('drama.com.ar', width / 2, 1700)

  return await new Promise<File | null>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
        return
      }

      resolve(new File([blob], 'drama-trivia.png', { type: 'image/png' }))
    }, 'image/png')
  })
}

export default function FunModeTriviaOverlay({ active, onClose }: Props) {
  const countdownTimersRef = useRef<number[]>([])
  const [questions, setQuestions] = useState<TriviaQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState<CountdownValue>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isFinished = hasStarted && questions.length > 0 && currentIndex >= questions.length
  const resultLabel = useMemo(() => getResultLabel(score), [score])

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    countdownTimersRef.current = []
  }, [])

  const startRound = useCallback(() => {
    clearCountdownTimers()
    setLoading(true)
    setError('')
    setCountdown(null)
    setHasStarted(false)
    setCurrentIndex(0)
    setScore(0)
    setAnswerState(null)
    setSelectedOptionId(null)
    setSharing(false)

    fetch('/api/trivia')
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar la trivia')
        return response.json()
      })
      .then((data) => {
        const nextQuestions = Array.isArray(data) ? data : []
        setQuestions(nextQuestions)

        if (nextQuestions.length < 2) {
          setError('TRIVIA EN ENSAYO')
          return
        }

        setCountdown('3')
        countdownTimersRef.current = [
          window.setTimeout(() => setCountdown('2'), 780),
          window.setTimeout(() => setCountdown('1'), 1560),
          window.setTimeout(() => setCountdown('DRAMA TRIVIA'), 2340),
          window.setTimeout(() => {
            setCountdown(null)
            setHasStarted(true)
          }, 3300),
        ]
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la trivia')
      })
      .finally(() => setLoading(false))
  }, [clearCountdownTimers])

  useEffect(() => {
    if (!active) {
      clearCountdownTimers()
      setQuestions([])
      setLoading(false)
      setError('')
      setCountdown(null)
      setHasStarted(false)
      setCurrentIndex(0)
      setScore(0)
      setAnswerState(null)
      setSelectedOptionId(null)
      return
    }

    startRound()
  }, [active, clearCountdownTimers, startRound])

  const answerQuestion = (optionId: string) => {
    if (!currentQuestion || answerState) return

    const selectedOption = currentQuestion.options.find((option) => option.id === optionId)
    const isCorrect = Boolean(selectedOption?.isCorrect)

    setSelectedOptionId(optionId)
    setAnswerState(isCorrect ? 'correct' : 'incorrect')
    if (isCorrect) setScore((value) => value + 1)

    window.setTimeout(() => {
      setAnswerState(null)
      setSelectedOptionId(null)
      setCurrentIndex((value) => value + 1)
    }, 950)
  }

  const shareResults = async () => {
    if (questions.length === 0) return

    setSharing(true)
    const text = getShareText(score, questions.length)

    try {
      const file = await createResultFile(score, questions.length)
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean
      }

      if (file && navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await navigator.share({
          title: 'DRAMA TRIVIA',
          text,
          files: [file],
        })
      } else if (navigator.share) {
        await navigator.share({
          title: 'DRAMA TRIVIA',
          text,
        })
      } else if (file) {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-black text-black md:overflow-hidden"
          initial={{ opacity: 0, filter: 'blur(18px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#F504FF_0%,#FE796D_38%,#FCC028_68%,#F504FF_100%)] bg-[length:240%_240%]"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.42),transparent_32%),radial-gradient(circle_at_85%_24%,rgba(0,0,0,0.14),transparent_32%)]" />

          <button
            type="button"
            aria-pressed="true"
            onClick={onClose}
            className="absolute right-5 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-full border border-black bg-black px-4 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white shadow-[0_0_22px_rgba(0,0,0,0.18)] transition-colors md:right-10 md:top-24"
          >
            FUN MODE
          </button>

          <AnimatePresence mode="wait">
            {countdown && (
              <motion.div
                key={countdown}
                className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-5 text-center font-black uppercase leading-none tracking-normal text-black"
                initial={{ opacity: 0, scale: 0.6, filter: 'blur(16px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.28, filter: 'blur(10px)' }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: countdown === 'DRAMA TRIVIA' ? 'clamp(3.2rem, 12vw, 9rem)' : 'clamp(6rem, 20vw, 14rem)' }}
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex min-h-[100dvh] items-start justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] md:items-center md:px-10 md:py-24">
            {loading && !countdown && (
              <p className="text-center text-3xl font-black uppercase text-black/65">Cargando...</p>
            )}

            {error && !countdown && (
              <div className="text-center">
                <h2 className="text-5xl font-black uppercase leading-none md:text-7xl">{error}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full border-2 border-black bg-black px-8 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
                >
                  VER PROYECTOS
                </button>
              </div>
            )}

            {!loading && !error && hasStarted && currentQuestion && !isFinished && (
              <motion.div
                key={currentQuestion.id}
                className="w-full max-w-5xl"
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-3 flex items-center justify-between gap-4 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/50 md:mb-5 md:text-xs">
                  <span>DRAMA TRIVIA</span>
                  <span>{currentIndex + 1}/{questions.length}</span>
                </div>

                <div className="grid items-start gap-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-center md:gap-10">
                  <div className="relative mx-auto aspect-square w-full max-w-[min(52vw,210px)] overflow-hidden rounded-lg border-[7px] border-white bg-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] md:max-w-none md:border-[10px] md:shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                    <Image
                      src={currentQuestion.image}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                      priority
                    />
                  </div>

                  <div>
                    <h2 className="mb-4 text-[clamp(2.15rem,9.4vw,3rem)] font-black uppercase leading-[0.92] text-black md:mb-6 md:text-6xl md:leading-none">
                      {renderQuestionText(currentQuestion.question)}
                    </h2>
                    <div className="grid gap-2.5 md:gap-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptionId === option.id
                        const shouldRevealCorrect = answerState && option.isCorrect

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => answerQuestion(option.id)}
                            disabled={Boolean(answerState)}
                            className={[
                              'min-h-11 rounded-lg border-2 px-4 py-2.5 text-left text-[clamp(1rem,4.4vw,1.25rem)] font-black uppercase leading-tight tracking-normal transition-all md:min-h-16 md:px-5 md:py-3 md:text-2xl',
                              shouldRevealCorrect
                                ? 'border-black bg-black text-white'
                                : isSelected && answerState === 'incorrect'
                                  ? 'border-black bg-white text-black opacity-45'
                                  : 'border-black/30 bg-white/24 text-black hover:border-black hover:bg-white/50',
                            ].join(' ')}
                          >
                            {option.text}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {answerState && (
                    <motion.div
                      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5 text-center text-[clamp(2.7rem,12vw,5rem)] font-black uppercase leading-none md:text-8xl"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span
                        className={[
                          'rounded-full bg-white px-8 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] md:px-14 md:py-7',
                          answerState === 'correct' ? 'text-[#00A650]' : 'text-[#E02424]',
                        ].join(' ')}
                      >
                        {answerState === 'correct' ? 'CORRECTA' : 'INCORRECTA'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {!loading && !error && isFinished && (
              <motion.div
                className="w-full max-w-4xl text-center"
                initial={{ opacity: 0, scale: 0.88, filter: 'blur(18px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/50">Resultado</p>
                <h2 className="text-7xl font-black uppercase leading-none md:text-9xl">
                  {score}/{questions.length}
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-4xl font-black uppercase leading-none md:text-7xl">
                  {resultLabel}
                </p>

                <div className="mt-12 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={shareResults}
                    disabled={sharing}
                    className="rounded-full border-2 border-black bg-black px-8 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 disabled:opacity-50 md:px-10"
                  >
                    {sharing ? 'Compartiendo...' : 'COMPARTIR RESULTADOS'}
                  </button>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={startRound}
                      className="rounded-full border-2 border-black bg-white/20 px-7 py-3 text-xs font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/45"
                    >
                      VOLVER A JUGAR
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border-2 border-black bg-white/20 px-7 py-3 text-xs font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/45"
                    >
                      VER PROYECTOS
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
