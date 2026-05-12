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
  const [gameState, dispatch] = useReducer(gameReducer, undefined, initialState)

  const startRound = useCallback((excludeId?: string) => {
    setLoadError(false)
    setCountdown('3')
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
      dispatch({ type: 'RESET' })
      return
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
      handleKey(event.key)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, gameState.status, handleKey])

  const isFinished = gameState.status === 'won' || gameState.status === 'lost'
  const keyboardStates = gameData ? getKeyboardStates(gameState.guesses, gameData.word) : {}
  const rows = buildRows(gameState, gameData?.word ?? '')

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden overscroll-contain bg-black text-black"
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

          <div className="relative z-10 flex min-h-[100dvh] items-start justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.25rem))] md:items-center md:px-8 md:py-[clamp(2rem,7vh,5rem)] lg:px-10 lg:py-[clamp(2rem,8vh,6rem)]">
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
              <div className="w-full max-w-6xl">
                <div className="mb-2 flex h-4 items-center justify-between gap-4 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/50 md:mb-4 md:text-[0.68rem] lg:mb-[clamp(0.75rem,2vh,1.5rem)] lg:text-xs">
                  <span>{copy.dramadle.title}</span>
                  <span>{gameState.guesses.length}/{MAX_ATTEMPTS}</span>
                </div>

                <div className="grid items-start gap-4 md:grid-cols-[minmax(260px,34vw)_minmax(0,1fr)] md:items-center md:gap-6 lg:grid-cols-[minmax(320px,42vh)_minmax(0,1fr)] lg:gap-[clamp(1.5rem,4vw,3rem)]">
                  <div className="flex justify-center">
                    <div className="grid w-[min(88vw,23rem)] grid-rows-6 gap-1.5 md:w-[min(34vw,25rem)] lg:w-[min(420px,42vh)] lg:gap-2">
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
                        <ResultPanel
                          key="result"
                          gameData={gameData}
                          won={gameState.status === 'won'}
                          onPlayAgain={() => startRound(gameData.id)}
                          onClose={onClose}
                        />
                      ) : (
                        <motion.div
                          key="keyboard"
                          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-1.5 rounded-lg border-2 border-black/20 bg-white/18 p-2.5 md:p-4 lg:gap-2 lg:p-5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.24 }}
                        >
                          {KEYBOARD_ROWS.map((row) => (
                            <div key={row.join('')} className="flex w-full justify-center gap-1 lg:gap-1.5">
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
        'flex h-11 min-w-0 items-center justify-center rounded-md border-2 text-[0.66rem] font-black uppercase leading-none tracking-normal transition-colors focus:outline-none focus-visible:outline-none md:h-12 md:text-xs lg:h-[3.55rem] lg:text-sm',
        isWide ? 'min-w-[3.4rem] flex-[1.35] px-1.5' : 'flex-1 px-0.5',
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

  return (
    <motion.div
      className="mx-auto overflow-hidden rounded-lg border-2 border-black/20 bg-white/18 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(14px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {gameData.coverImage && (
        <div className="relative aspect-square w-full bg-black">
          <Image src={gameData.coverImage} alt="" fill className="object-contain" unoptimized />
          <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white">
            {won ? copy.dramadle.win : `${copy.dramadle.theWordWas} ${gameData.word}`}
          </div>
        </div>
      )}

      <div className="p-4 md:p-5">
        <p className="text-sm font-black uppercase leading-snug tracking-[0.08em] text-black md:text-base">
          {gameData.projectName}
          {gameData.projectYear ? (
            <span className="ml-2 text-black/55">{gameData.projectYear}</span>
          ) : null}
        </p>

        {gameData.projectTags.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">
              {gameData.projectName} hicimos
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {gameData.projectTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border-2 border-black px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.12em] text-black"
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-full border-2 border-black bg-black px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85"
          >
            {copy.dramadle.playAgain}
          </button>
          {gameData.projectSlug && (
            <Link
              href={`/proyectos?slug=${gameData.projectSlug}`}
              onClick={onClose}
              className="rounded-full border-2 border-black bg-white/20 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/45"
            >
              {copy.dramadle.viewProject}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
