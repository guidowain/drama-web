'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSiteCopy } from '@/lib/LocaleContext'

const MAX_ATTEMPTS = 6
const WORD_LENGTH = 5

type LetterState = 'correct' | 'present' | 'absent' | 'typed' | 'empty'
type GameStatus = 'countdown' | 'playing' | 'won' | 'lost'
type CountdownValue = '3' | '2' | '1' | 'DRAMADLE' | null

type GameData = {
  id: string
  word: string
  projectName: string
  projectSlug: string
  projectYear: number | null
  projectTags: string[]
  coverImage: string
  validGuesses: string[]
}

type GameState = {
  guesses: string[][]
  current: string[]
  status: GameStatus
  invalid: boolean
}

type Action =
  | { type: 'KEY'; key: string }
  | { type: 'BACKSPACE' }
  | { type: 'ENTER'; word: string }
  | { type: 'START' }
  | { type: 'FLASH_INVALID' }
  | { type: 'CLEAR_INVALID' }
  | { type: 'RESET' }

type Props = {
  active: boolean
  onClose: () => void
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

function normalizeGuess(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, '')
}

function getLetterStates(guess: string[], word: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent')
  const wordChars = word.split('')
  const remaining = [...wordChars]

  guess.forEach((letter, index) => {
    if (letter === wordChars[index]) {
      result[index] = 'correct'
      remaining[index] = ''
    }
  })

  guess.forEach((letter, index) => {
    if (result[index] === 'correct') return
    const matchIndex = remaining.indexOf(letter)

    if (matchIndex !== -1) {
      result[index] = 'present'
      remaining[matchIndex] = ''
    }
  })

  return result
}

function getKeyboardStates(guesses: string[][], word: string): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}

  guesses.forEach((guess) => {
    const letterStates = getLetterStates(guess, word)

    guess.forEach((letter, index) => {
      const current = states[letter]
      const next = letterStates[index]

      if (current === 'correct') return
      if (next === 'correct' || (!current && next === 'present') || !current) states[letter] = next
    })
  })

  return states
}

function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === 'START') return { ...state, status: 'playing', invalid: false }

  if (action.type === 'KEY') {
    if (state.status !== 'playing' || state.current.length >= WORD_LENGTH) return state
    return { ...state, current: [...state.current, action.key] }
  }

  if (action.type === 'BACKSPACE') {
    if (state.status !== 'playing') return state
    return { ...state, current: state.current.slice(0, -1) }
  }

  if (action.type === 'ENTER') {
    if (state.status !== 'playing') return state
    if (state.current.length < WORD_LENGTH) return { ...state, invalid: true }

    const guess = state.current
    const won = guess.join('') === action.word
    const guesses = [...state.guesses, guess]
    const lost = !won && guesses.length >= MAX_ATTEMPTS

    return {
      guesses,
      current: [],
      status: won ? 'won' : lost ? 'lost' : 'playing',
      invalid: false,
    }
  }

  if (action.type === 'FLASH_INVALID') return { ...state, invalid: true }
  if (action.type === 'CLEAR_INVALID') return { ...state, invalid: false }
  if (action.type === 'RESET') return { guesses: [], current: [], status: 'countdown', invalid: false }

  return state
}

function initialState(): GameState {
  return { guesses: [], current: [], status: 'countdown', invalid: false }
}

export default function FunModeDramadleOverlay({ active, onClose }: Props) {
  const copy = useSiteCopy()
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [countdown, setCountdown] = useState<CountdownValue>(null)
  const [showWinMessage, setShowWinMessage] = useState(false)
  const [showResultPanel, setShowResultPanel] = useState(false)
  const [gameState, dispatch] = useReducer(gameReducer, undefined, initialState)

  const startRound = useCallback((excludeId?: string) => {
    setLoadError(false)
    setCountdown('3')
    setShowWinMessage(false)
    setShowResultPanel(false)
    setGameData(null)
    dispatch({ type: 'RESET' })

    fetch(excludeId ? `/api/dramadle?exclude=${excludeId}` : '/api/dramadle')
      .then((response) => {
        if (!response.ok) throw new Error('No data')
        return response.json()
      })
      .then((data: GameData) => setGameData(data))
      .catch(() => setLoadError(true))
  }, [])

  useEffect(() => {
    if (!active) {
      setGameData(null)
      setLoadError(false)
      setCountdown(null)
      setShowWinMessage(false)
      setShowResultPanel(false)
      dispatch({ type: 'RESET' })
      return
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    startRound()
  }, [active, startRound])

  useEffect(() => {
    if (!active || !countdown) return

    if (countdown === 'DRAMADLE') {
      const timer = window.setTimeout(() => {
        setCountdown(null)
        dispatch({ type: 'START' })
      }, 960)
      return () => window.clearTimeout(timer)
    }

    const next: Record<string, CountdownValue> = { '3': '2', '2': '1', '1': 'DRAMADLE' }
    const timer = window.setTimeout(() => setCountdown(next[countdown] ?? null), 780)
    return () => window.clearTimeout(timer)
  }, [active, countdown])

  useEffect(() => {
    if (!gameState.invalid) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_INVALID' }), 450)
    return () => window.clearTimeout(timer)
  }, [gameState.invalid])

  useEffect(() => {
    if (gameState.status === 'won') {
      setShowResultPanel(false)
      setShowWinMessage(true)

      const hideTimer = window.setTimeout(() => setShowWinMessage(false), 980)
      const revealTimer = window.setTimeout(() => setShowResultPanel(true), 1180)

      return () => {
        window.clearTimeout(hideTimer)
        window.clearTimeout(revealTimer)
      }
    }

    if (gameState.status === 'lost') {
      setShowResultPanel(false)
      setShowWinMessage(true)

      const nextRoundTimer = window.setTimeout(() => {
        startRound(gameData?.id)
      }, 1350)

      return () => window.clearTimeout(nextRoundTimer)
    }

    setShowWinMessage(false)
    setShowResultPanel(false)
  }, [gameData?.id, gameState.status, startRound])

  const handleKey = useCallback((key: string) => {
    if (!gameData) return

    if (key === '⌫' || key === 'Backspace') {
      dispatch({ type: 'BACKSPACE' })
      return
    }

    if (key === 'ENTER' || key === 'Enter') {
      const guess = normalizeGuess(gameState.current.join(''))
      const validGuesses = new Set((gameData.validGuesses ?? []).map(normalizeGuess))

      if (guess.length < WORD_LENGTH || !validGuesses.has(guess)) {
        dispatch({ type: 'FLASH_INVALID' })
        return
      }

      dispatch({ type: 'ENTER', word: gameData.word })
      return
    }

    const upper = normalizeGuess(key)
    if (/^[A-ZÁÉÍÓÚÜÑ]$/.test(upper)) dispatch({ type: 'KEY', key: upper })
  }, [gameData, gameState.current])

  useEffect(() => {
    if (!active || gameState.status !== 'playing') return

    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (
        event.key === 'Enter' ||
        event.key === 'Backspace' ||
        /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]$/.test(event.key)
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
      handleKey(event.key)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, gameState.status, handleKey])

  const isFinished = gameState.status === 'won' || gameState.status === 'lost'
  const canShowResultPanel = isFinished && showResultPanel
  const keyboardStates = gameData ? getKeyboardStates(gameState.guesses, gameData.word) : {}
  const rows = buildRows(gameState, gameData?.word ?? '')

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden overscroll-contain bg-black text-black"
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
            className="absolute right-5 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-full border border-black bg-black px-4 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white shadow-[0_0_22px_rgba(0,0,0,0.18)] transition-colors md:right-8 md:top-[clamp(1.25rem,6vh,5rem)] lg:right-10 lg:top-[clamp(1.5rem,7vh,6rem)]"
          >
            {copy.common.funMode}
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
                style={{ fontSize: countdown === copy.dramadle.title ? 'clamp(3.2rem, 12vw, 9rem)' : 'clamp(6rem, 20vw, 14rem)' }}
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-[max(4rem,calc(env(safe-area-inset-top)+3rem))] md:px-7 md:py-[clamp(1.5rem,5vh,3rem)] lg:px-9">
            {loadError && !countdown && (
              <div className="text-center">
                <h2 className="text-5xl font-black uppercase leading-none md:text-6xl lg:text-7xl">{copy.dramadle.loadError}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full border-2 border-black bg-black px-8 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
                >
                  {copy.trivia.viewProjects}
                </button>
              </div>
            )}

            {!loadError && !countdown && gameData && (
              <div className="w-full max-w-[88rem]">
                <div className="mb-2 flex h-4 items-center justify-between gap-4 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/50 md:mb-3 md:text-[0.68rem] lg:text-xs">
                  <span>{copy.dramadle.title}</span>
                </div>

                <div className={[
                  'grid items-center gap-4 md:gap-6 lg:gap-[clamp(1.25rem,3vw,2.5rem)]',
                  isFinished
                    ? 'md:grid-cols-[minmax(240px,28vw)_minmax(0,1fr)] lg:grid-cols-[minmax(260px,30vw)_minmax(0,1fr)]'
                    : 'md:grid-cols-[minmax(240px,30vw)_minmax(0,1fr)] lg:grid-cols-[minmax(280px,34vh)_minmax(0,1fr)]',
                ].join(' ')}>
                  <div className={isFinished ? 'hidden md:flex md:justify-center' : 'flex justify-center'}>
                    <div className={[
                      'grid grid-rows-6 gap-1.5',
                      isFinished
                        ? 'w-[min(82vw,18rem)] md:w-[min(28vw,18rem)] lg:w-[min(30vw,20rem)]'
                        : 'w-[min(84vw,45dvh,20rem)] md:w-[min(30vw,20rem)] lg:w-[min(360px,36vh)]',
                    ].join(' ')}>
                      {rows.map((row, rowIndex) => (
                        <motion.div
                          key={rowIndex}
                          className="grid grid-cols-5 gap-1.5 lg:gap-2"
                          animate={row.shake ? { x: [0, -7, 7, -7, 7, 0] } : {}}
                          transition={{ duration: 0.35 }}
                        >
                          {row.letters.map((letter, colIndex) => (
                            <DramaCell
                              key={colIndex}
                              letter={letter}
                              state={row.states[colIndex]}
                              delay={rowIndex < gameState.guesses.length ? colIndex * 0.08 : 0}
                              revealed={rowIndex < gameState.guesses.length}
                            />
                          ))}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full">
                    <AnimatePresence mode="wait">
                      {isFinished ? (
                        canShowResultPanel ? (
                          <ResultPanel
                            key="result"
                            gameData={gameData}
                            won={gameState.status === 'won'}
                            onPlayAgain={() => startRound(gameData.id)}
                            onClose={onClose}
                          />
                        ) : showWinMessage ? (
                          <WinMessagePanel
                            key="status-message"
                            label={gameState.status === 'lost' ? 'OTRA PALABRA' : copy.dramadle.win}
                          />
                        ) : (
                          <div key="pending-result" className="h-[min(52dvh,24rem)] md:h-[min(72dvh,34rem)]" />
                        )
                      ) : (
                        <motion.div
                          key="keyboard"
                          className="mx-auto flex w-full max-w-[min(96vw,42rem)] flex-col items-center gap-[clamp(0.35rem,1.3vw,0.5rem)] rounded-lg border-2 border-black/20 bg-white/18 p-[clamp(0.6rem,2.2vw,1rem)] lg:gap-2 lg:p-5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.24 }}
                        >
                          {KEYBOARD_ROWS.map((row) => (
                            <div key={row.join('')} className="flex w-full justify-center gap-[clamp(0.25rem,1vw,0.4rem)] lg:gap-1.5">
                              {row.map((key) => (
                                <KeyboardKey
                                  key={key}
                                  label={key}
                                  state={keyboardStates[key]}
                                  onClick={() => handleKey(key)}
                                />
                              ))}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function WinMessagePanel({ label }: { label: string }) {
  return (
    <motion.div
      className="mx-auto flex aspect-square w-full max-w-[min(86vw,19rem)] items-center justify-center text-center font-black uppercase leading-none tracking-normal text-black md:max-w-[min(34rem,44vw)]"
      initial={{ opacity: 0, scale: 0.72, filter: 'blur(18px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.16, filter: 'blur(10px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ fontSize: 'clamp(2.5rem, 8vw, 7.5rem)' }}
    >
      {label}
    </motion.div>
  )
}

function buildRows(gameState: GameState, word: string): Array<{ letters: string[]; states: LetterState[]; shake: boolean }> {
  const rows = []

  for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
    if (index < gameState.guesses.length) {
      const guess = gameState.guesses[index]
      rows.push({ letters: guess, states: getLetterStates(guess, word), shake: false })
    } else if (index === gameState.guesses.length && gameState.status === 'playing') {
      const letters = [...gameState.current]
      while (letters.length < WORD_LENGTH) letters.push('')
      rows.push({
        letters,
        states: letters.map((letter) => (letter ? 'typed' : 'empty')) as LetterState[],
        shake: gameState.invalid,
      })
    } else {
      rows.push({
        letters: Array(WORD_LENGTH).fill(''),
        states: Array(WORD_LENGTH).fill('empty') as LetterState[],
        shake: false,
      })
    }
  }

  return rows
}

function KeyboardKey({ label, state, onClick }: { label: string; state?: LetterState; onClick: () => void }) {
  const isWide = label === 'ENTER' || label === '⌫'
  const stateClass =
    state === 'correct'
      ? 'border-[#159447] bg-[#159447] text-white'
      : state === 'present'
        ? 'border-[#D8A316] bg-[#FCC028] text-black'
        : state === 'absent'
          ? 'border-[#777] bg-[#777] text-white/85'
          : 'border-black/30 bg-white/24 text-black md:hover:border-black md:hover:bg-white/50'

  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.blur()
        onClick()
      }}
      className={[
        'flex h-[clamp(2.55rem,11vw,3rem)] min-w-0 items-center justify-center rounded-md border-2 text-[clamp(0.7rem,3.2vw,0.95rem)] font-black uppercase leading-none tracking-normal transition-colors focus:outline-none focus-visible:outline-none md:h-11 md:text-xs lg:h-12 lg:text-sm',
        isWide ? 'min-w-[clamp(3.8rem,16vw,5.4rem)] flex-[1.35] px-1.5' : 'flex-1 px-0.5',
        stateClass,
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function DramaCell({ letter, state, delay, revealed }: { letter: string; state: LetterState; delay: number; revealed: boolean }) {
  const stateClass =
    state === 'correct'
      ? 'border-[#159447] bg-[#159447] text-white'
      : state === 'present'
        ? 'border-[#D8A316] bg-[#FCC028] text-black'
        : state === 'absent'
          ? 'border-[#777] bg-[#777] text-white/85'
          : state === 'typed'
            ? 'border-black bg-white/32 text-black shadow-[0_12px_30px_rgba(0,0,0,0.13)]'
            : 'border-black/24 bg-white/14 text-black'

  return (
    <motion.div
      className={`aspect-square min-h-0 rounded-lg border-2 ${stateClass} flex items-center justify-center text-[clamp(1.55rem,8.5vw,2.25rem)] font-black uppercase leading-none md:text-[clamp(1.8rem,4.5vw,2.7rem)] lg:text-[clamp(2.3rem,6vh,3.55rem)]`}
      animate={revealed ? { rotateX: [0, 90, 0] } : {}}
      transition={revealed ? { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } : {}}
    >
      {letter}
    </motion.div>
  )
}

function ResultPanel({
  gameData,
  won,
  onPlayAgain,
  onClose,
}: {
  gameData: GameData
  won: boolean
  onPlayAgain: () => void
  onClose: () => void
}) {
  const copy = useSiteCopy()
  const servicesLabel = gameData.projectTags.join(', ').toUpperCase()

  return (
    <motion.div
      className="mx-auto flex max-h-[calc(100dvh-7rem)] w-full max-w-[min(86vw,19rem)] flex-col overflow-hidden rounded-lg border-2 border-black/20 bg-white/18 shadow-[0_20px_50px_rgba(0,0,0,0.18)] md:max-w-[min(34rem,44vw)]"
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(14px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {gameData.coverImage && (
        <div className="relative aspect-square w-full shrink-0 bg-black">
          <Image src={gameData.coverImage} alt="" fill className="object-contain" unoptimized />
          {!won && (
            <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-white">
              {copy.dramadle.theWordWas} {gameData.word}
            </div>
          )}
        </div>
      )}

      <div className="min-h-0 p-3 md:p-4">
        {gameData.projectTags.length > 0 && (
          <div>
            <p className="text-sm font-black uppercase leading-snug tracking-[0.08em] text-black md:text-base">
              En {gameData.projectName} hicimos:
            </p>
            <p className="mt-1 text-sm font-black uppercase leading-snug tracking-[0.08em] text-black md:text-base">
              {servicesLabel}
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-full border-2 border-black bg-black px-5 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85"
          >
            {copy.dramadle.playAgain}
          </button>
          {gameData.projectSlug && (
            <Link
              href={`/proyectos?slug=${gameData.projectSlug}`}
              onClick={onClose}
              className="rounded-full border-2 border-black bg-white/20 px-5 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/45"
            >
              {copy.dramadle.viewProject}
            </Link>
          )}
          {!gameData.projectSlug && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-black bg-white/20 px-5 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/45"
            >
              {copy.trivia.viewProjects}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
