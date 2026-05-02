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
  return '¡QUEDASTE EN LA OBRA!'
}

function getShareText(score: number, total: number) {
  return `DRAMA TRIVIA - ${score}/${total} - jugá vos también en drama.com.ar`
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function createResultFile(score: number, total: number) {
  const canvas = document.createElement('canvas')
  const width = 1080
  const height = 1920
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  await document.fonts?.load('900 120px Enriq')
  await document.fonts?.load('900 72px Enriq')
  const logo = await loadCanvasImage('/logos/Logo%20ByN.png')

  canvas.width = width
  canvas.height = height

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#F504FF')
  gradient.addColorStop(0.42, '#FE796D')
  gradient.addColorStop(0.72, '#FCC028')
  gradient.addColorStop(1, '#F504FF')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const logoWidth = 416
  const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth)
  ctx.drawImage(logo, (width - logoWidth) / 2, 370, logoWidth, logoHeight)

  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 118px Enriq, Archivo, Arial, sans-serif'
  ctx.fillText('TRIVIA', width / 2, 650)

  ctx.font = '900 260px Enriq, Archivo, Arial, sans-serif'
  ctx.fillText(`${score}/${total}`, width / 2, 990)

  ctx.font = '900 48px Enriq, Archivo, Arial, sans-serif'
  ctx.fillText('JUGÁ VOS TAMBIÉN EN', width / 2, 1600)
  ctx.font = '900 70px Enriq, Archivo, Arial, sans-serif'
  ctx.fillText('DRAMA.COM.AR', width / 2, 1682)

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

  const startRound = useCallback((skipIntro = false) => {
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

        if (skipIntro) {
          setHasStarted(true)
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

    if (isCorrect) setScore((value) => value + 1)
    setSelectedOptionId(null)
    setAnswerState(null)
    setCurrentIndex((value) => value + 1)
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
          className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-black text-black lg:overflow-hidden"
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
            className="absolute right-5 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-full border border-black bg-black px-4 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white shadow-[0_0_22px_rgba(0,0,0,0.18)] transition-colors md:right-8 md:top-20 lg:right-10 lg:top-24"
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

          <div
            className={[
              'relative z-10 flex min-h-[100dvh] justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:items-center md:px-8 md:py-20 lg:px-10 lg:py-24',
              isFinished
                ? 'items-center pt-[max(1.25rem,env(safe-area-inset-top))]'
                : 'items-start pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.25rem))]',
            ].join(' ')}
          >
            {error && !countdown && (
              <div className="text-center">
                <h2 className="text-5xl font-black uppercase leading-none md:text-6xl lg:text-7xl">{error}</h2>
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
              <div className="w-full max-w-6xl">
                <div className="mb-2 flex h-4 items-center justify-between gap-4 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/50 md:mb-4 md:text-[0.68rem] lg:mb-6 lg:text-xs">
                  <span>DRAMA TRIVIA</span>
                  <span>{currentIndex + 1}/{questions.length}</span>
                </div>

                <div className="grid items-start gap-3 md:grid-cols-[minmax(180px,30vw)_minmax(0,1fr)] md:items-center md:gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12">
                  <div className="relative mx-auto aspect-square w-[min(46vw,10.5rem)] shrink-0 overflow-hidden rounded-lg border-[7px] border-white bg-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] md:w-[min(30vw,14rem)] md:border-[8px] md:shadow-[0_18px_42px_rgba(0,0,0,0.2)] lg:w-[360px] lg:border-[10px] lg:shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                    <Image
                      src={currentQuestion.image}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                      priority
                    />
                  </div>

                  <div className="w-full">
                    <div className="mb-3 flex h-[8.4rem] items-center overflow-hidden rounded-lg border-2 border-black/20 bg-white/18 px-4 py-4 md:mb-4 md:h-[clamp(8.8rem,16vh,10rem)] md:px-5 md:py-4 lg:mb-6 lg:h-[13.5rem] lg:px-7 lg:py-6">
                      <h2 className="text-[clamp(1.3rem,5.35vw,1.66rem)] font-black uppercase leading-[1.12] text-black md:text-[clamp(1.45rem,3vw,2rem)] md:leading-[1.08] lg:text-[2.78rem] lg:leading-[1.1]">
                        {currentQuestion.question}
                      </h2>
                    </div>

                    <div className="grid auto-rows-[3rem] gap-2.5 md:auto-rows-[clamp(3.1rem,6.4vh,3.75rem)] md:gap-2.5 lg:auto-rows-[4.35rem] lg:gap-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptionId === option.id
                        const shouldRevealCorrect = answerState && option.isCorrect

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={(event) => {
                              event.currentTarget.blur()
                              answerQuestion(option.id)
                            }}
                            disabled={Boolean(answerState)}
                            className={[
                              'flex h-full min-h-0 items-center rounded-lg border-2 px-4 py-1 text-left text-[clamp(0.95rem,4vw,1.15rem)] font-black uppercase leading-tight tracking-normal transition-all focus:outline-none focus-visible:outline-none md:px-4 md:py-2 md:text-[clamp(1.02rem,2.35vw,1.28rem)] lg:px-5 lg:text-[1.7rem]',
                              shouldRevealCorrect
                                ? 'border-black bg-black text-white'
                                : isSelected && answerState === 'incorrect'
                                  ? 'border-black bg-white text-black opacity-45'
                                  : 'border-black/30 bg-white/24 text-black md:hover:border-black md:hover:bg-white/50',
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
                      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5 text-center text-[clamp(2.7rem,12vw,5rem)] font-black uppercase leading-none md:text-7xl lg:text-8xl"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span
                        className={[
                          'rounded-full bg-white px-8 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] md:px-11 md:py-5 lg:px-14 lg:py-7',
                          answerState === 'correct' ? 'text-[#00A650]' : 'text-[#E02424]',
                        ].join(' ')}
                      >
                        {answerState === 'correct' ? 'CORRECTA' : 'INCORRECTA'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!loading && !error && isFinished && (
              <motion.div
                className="w-full max-w-4xl text-center"
                initial={{ opacity: 0, scale: 0.88, filter: 'blur(18px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/50">Resultado</p>
                <h2 className="text-7xl font-black uppercase leading-none md:text-8xl lg:text-9xl">
                  {score}/{questions.length}
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-4xl font-black uppercase leading-none md:text-6xl lg:text-7xl">
                  {resultLabel}
                </p>

                <div className="mt-12 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={shareResults}
                    disabled={sharing}
                    className="rounded-full border-2 border-black bg-black px-8 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 disabled:opacity-50 md:hidden"
                  >
                    {sharing ? 'Compartiendo...' : 'COMPARTIR RESULTADOS'}
                  </button>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => startRound(true)}
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
