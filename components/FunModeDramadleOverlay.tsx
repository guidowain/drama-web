'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useSiteCopy } from '@/lib/LocaleContext'

const MAX_ATTEMPTS = 6
const WORD_LENGTH = 5

type LetterState = 'correct' | 'present' | 'absent' | 'typed' | 'empty'

type GameStatus = 'countdown' | 'playing' | 'won' | 'lost'

type GameData = {
  id: string
  word: string
  projectName: string
  projectSlug: string
  projectYear: number | null
  projectTags: string[]
  coverImage: string
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
  | { type: 'FLASH_INVALID' }
  | { type: 'CLEAR_INVALID' }
  | { type: 'RESET' }

function getLetterStates(guess: string[], word: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent')
  const wordChars = word.split('')
  const remaining = [...wordChars]

  guess.forEach((letter, i) => {
    if (letter === wordChars[i]) {
      result[i] = 'correct'
      remaining[i] = ''
    }
  })

  guess.forEach((letter, i) => {
    if (result[i] === 'correct') return
    const j = remaining.indexOf(letter)

    if (j !== -1) {
      result[i] = 'present'
      remaining[j] = ''
    }
  })

  return result
}

function getKeyboardStates(guesses: string[][], word: string): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}

  guesses.forEach((guess) => {
    const letterStates = getLetterStates(guess, word)

    guess.forEach((letter, i) => {
      const current = states[letter]
      const next = letterStates[i]

      if (current === 'correct') return
      if (next === 'correct' || (!current && next === 'present') || !current) {
        states[letter] = next
      }
    })
  })

  return states
}

function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === 'KEY') {
    if (state.status !== 'playing') return state
    if (state.current.length >= WORD_LENGTH) return state
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
    const newGuesses = [...state.guesses, guess]
    const lost = !won && newGuesses.length >= MAX_ATTEMPTS

    return {
      ...state,
      guesses: newGuesses,
      current: [],
      status: won ? 'won' : lost ? 'lost' : 'playing',
      invalid: false,
    }
  }

  if (action.type === 'FLASH_INVALID') {
    return { ...state, invalid: true }
  }

  if (action.type === 'CLEAR_INVALID') {
    return { ...state, invalid: false }
  }

  if (action.type === 'RESET') {
    return { guesses: [], current: [], status: 'countdown', invalid: false }
  }

  return state
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

type CountdownValue = '3' | '2' | '1' | 'DRAMADLE' | null

type Props = {
  active: boolean
  onClose: () => void
}

export default function FunModeDramadleOverlay({ active, onClose }: Props) {
  const copy = useSiteCopy()
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [countdown, setCountdown] = useState<CountdownValue>(null)
  const [gameState, dispatch] = useReducer(gameReducer, {
    guesses: [],
    current: [],
    status: 'countdown',
    invalid: false,
  })

  function startRound(excludeId?: string) {
    setLoadError(false)
    setCountdown('3')
    dispatch({ type: 'RESET' })

    const url = excludeId ? `/api/dramadle?exclude=${excludeId}` : '/api/dramadle'

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('no data')
        return r.json()
      })
      .then((data) => setGameData(data))
      .catch(() => setLoadError(true))
  }

  useEffect(() => {
    if (!active) {
      setGameData(null)
      setLoadError(false)
      setCountdown(null)
      dispatch({ type: 'RESET' })
      return
    }

    startRound()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    if (!active || !countdown) return

    if (countdown === 'DRAMADLE') {
      const t = window.setTimeout(() => setCountdown(null), 900)
      return () => window.clearTimeout(t)
    }

    const next: Record<string, CountdownValue> = { '3': '2', '2': '1', '1': 'DRAMADLE' }
    const t = window.setTimeout(() => setCountdown(next[countdown] ?? null), 700)
    return () => window.clearTimeout(t)
  }, [active, countdown])

  useEffect(() => {
    if (!active || countdown !== null) return
    dispatch({ type: 'ENTER', word: '' })
  }, [active, countdown])

  useEffect(() => {
    if (gameState.invalid) {
      const t = window.setTimeout(() => dispatch({ type: 'CLEAR_INVALID' }), 500)
      return () => window.clearTimeout(t)
    }
  }, [gameState.invalid])

  const handleKey = useCallback((key: string) => {
    if (!gameData) return

    if (key === '⌫' || key === 'Backspace') {
      dispatch({ type: 'BACKSPACE' })
      return
    }

    if (key === 'ENTER' || key === 'Enter') {
      dispatch({ type: 'ENTER', word: gameData.word })
      return
    }

    const upper = key.toUpperCase()

    if (/^[A-ZÁÉÍÓÚÜÑ]$/.test(upper)) {
      dispatch({ type: 'KEY', key: upper })
    }
  }, [gameData])

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
  const keyboardStates = gameData
    ? getKeyboardStates(gameState.guesses, gameData.word)
    : {}

  function buildRows(): Array<{ letters: string[]; states: LetterState[]; shake: boolean }> {
    const rows = []

    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      if (i < gameState.guesses.length) {
        const guess = gameState.guesses[i]
        rows.push({
          letters: guess,
          states: gameData ? getLetterStates(guess, gameData.word) : Array(WORD_LENGTH).fill('absent' as LetterState),
          shake: false,
        })
      } else if (i === gameState.guesses.length && gameState.status === 'playing') {
        const letters = [...gameState.current]
        while (letters.length < WORD_LENGTH) letters.push('')
        rows.push({
          letters,
          states: letters.map((l) => (l ? 'typed' : 'empty')) as LetterState[],
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

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm"
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 text-white/40 hover:text-white transition-colors text-2xl font-black leading-none"
            aria-label={copy.common.close}
          >
            ×
          </button>

          {/* Countdown */}
          <AnimatePresence>
            {countdown && (
              <motion.div
                key={countdown}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <span className="text-white font-black text-7xl md:text-9xl tracking-tight">
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Load error */}
          {loadError && (
            <div className="text-white/50 font-black text-lg uppercase tracking-widest text-center px-6">
              {copy.dramadle.loadError}
            </div>
          )}

          {!loadError && !countdown && (
            <div className="flex flex-col items-center gap-5 w-full max-w-sm px-4">
              {/* Title */}
              <h2 className="text-white font-black text-xl uppercase tracking-[0.2em]">
                {copy.dramadle.title}
              </h2>

              {/* Board */}
              <div className="flex flex-col gap-1.5">
                {buildRows().map((row, rowIndex) => (
                  <motion.div
                    key={rowIndex}
                    className="flex gap-1.5"
                    animate={row.shake ? { x: [0, -6, 6, -6, 6, 0] } : {}}
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

              {/* Result reveal */}
              <AnimatePresence>
                {isFinished && gameData && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                  >
                    {/* Cover image */}
                    {gameData.coverImage && (
                      <div className="relative w-full aspect-video">
                        <Image
                          src={gameData.coverImage}
                          alt={gameData.projectName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Win/lose badge */}
                        <div className="absolute top-3 left-3">
                          {gameState.status === 'won' ? (
                            <span className="gradient-bg text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                              {copy.dramadle.win}
                            </span>
                          ) : (
                            <span className="bg-white/15 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                              {copy.dramadle.theWordWas}{' '}
                              <span className="tracking-[0.2em]">{gameData.word}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Project info */}
                    <div className="px-4 pt-3 pb-1 space-y-1.5">
                      <p className="text-white/50 text-xs leading-snug">
                        {copy.dramadle.wordBelongsTo}{' '}
                        <span className="text-white font-black tracking-[0.1em]">{gameData.word}</span>{' '}
                        {copy.dramadle.belongsTo}{' '}
                        <span className="text-white font-black">&ldquo;{gameData.projectName}&rdquo;</span>
                        {gameData.projectYear && (
                          <>
                            {' '}{copy.dramadle.premieredIn}{' '}
                            <span className="text-white font-black">{gameData.projectYear}</span>
                          </>
                        )}
                        .
                      </p>

                      {gameData.projectTags.length > 0 && (
                        <p className="text-white/50 text-xs leading-snug">
                          <span className="text-white font-black uppercase tracking-widest">Drama</span>{' '}
                          {copy.dramadle.dramaHandled}{' '}
                          <span className="text-white font-black">
                            {gameData.projectTags.join(', ')}
                          </span>
                          .
                        </p>
                      )}
                    </div>

                    <div className="p-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startRound(gameData.id)}
                        className="flex-1 rounded-xl gradient-bg py-2.5 text-xs font-black uppercase tracking-widest text-black hover:opacity-90 transition-opacity"
                      >
                        {copy.dramadle.playAgain}
                      </button>
                      <a
                        href={`/proyectos?slug=${gameData.projectSlug}`}
                        className="flex-1 rounded-xl border border-white/15 py-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white hover:border-white/30 transition-colors text-center"
                      >
                        {copy.dramadle.viewProject}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard */}
              {!isFinished && (
                <div className="flex flex-col items-center gap-1.5 w-full">
                  {KEYBOARD_ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((key) => {
                        const state = keyboardStates[key]
                        const isWide = key === 'ENTER' || key === '⌫'

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleKey(key)}
                            className={[
                              'h-12 rounded-lg font-black text-xs uppercase transition-colors select-none',
                              isWide ? 'px-2 min-w-[52px]' : 'w-8',
                              state === 'correct'
                                ? 'bg-green-500 text-white'
                                : state === 'present'
                                  ? 'bg-yellow-400 text-black'
                                  : state === 'absent'
                                    ? 'bg-zinc-700 text-white/40'
                                    : 'bg-zinc-600 text-white hover:bg-zinc-500',
                            ].join(' ')}
                          >
                            {key}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type DramaCellProps = {
  letter: string
  state: LetterState
  delay: number
  revealed: boolean
}

function DramaCell({ letter, state, delay, revealed }: DramaCellProps) {
  const bg =
    state === 'correct'
      ? 'bg-green-500 border-green-500 text-white'
      : state === 'present'
        ? 'bg-yellow-400 border-yellow-400 text-black'
        : state === 'absent'
          ? 'bg-zinc-700 border-zinc-700 text-white/60'
          : state === 'typed'
            ? 'bg-transparent border-white/50 text-white'
            : 'bg-transparent border-white/15 text-white'

  return (
    <motion.div
      className={`w-12 h-12 md:w-13 md:h-13 flex items-center justify-center border-2 rounded-lg font-black text-xl ${bg}`}
      animate={revealed ? { rotateX: [0, 90, 0] } : {}}
      transition={revealed ? { duration: 0.4, delay } : {}}
    >
      {letter}
    </motion.div>
  )
}
