'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Matter from 'matter-js'

type Props = {
  active: boolean
  media: string[]
  onClose: () => void
}

type BlockItem = {
  id: string
  src: string
  width: number
  height: number
  x: number
  y: number
}

type CountdownValue = '3' | '2' | '1' | 'DRAMANOID' | null

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function loadImage(src: string) {
  return new Promise<{ src: string; ratio: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ src, ratio: image.naturalWidth / Math.max(image.naturalHeight, 1) })
    image.onerror = reject
    image.src = src
  })
}

function getBlockSize(ratio: number, viewportWidth: number) {
  const isMobile = viewportWidth < 768
  const maxWidth = isMobile ? 112 : 156
  const maxHeight = isMobile ? 76 : 104
  const baseWidth = isMobile ? 78 + Math.random() * 30 : 108 + Math.random() * 40
  let width = Math.min(baseWidth, maxWidth)
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return {
    width: Math.max(width, isMobile ? 54 : 72),
    height: Math.max(height, isMobile ? 38 : 48),
  }
}

function layoutBlocks(loaded: Array<{ src: string; ratio: number }>) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const isMobile = viewportWidth < 768
  const columns = isMobile ? 4 : 7
  const rowGap = isMobile ? 18 : 28
  const availableWidth = viewportWidth - (isMobile ? 28 : 128)
  const columnWidth = availableWidth / columns
  const startX = (viewportWidth - availableWidth) / 2 + columnWidth / 2
  const startY = isMobile ? 118 : 112
  const paddleSafeY = viewportHeight - (isMobile ? 178 : 230)
  const sized = loaded.map((item, index) => ({
    ...item,
    index,
    ...getBlockSize(item.ratio, viewportWidth),
  }))
  const rows: Array<typeof sized> = []

  sized.forEach((item, index) => {
    const row = Math.floor(index / columns)
    if (!rows[row]) rows[row] = []
    rows[row].push(item)
  })

  const rowHeights = rows.map((row) => Math.max(...row.map((item) => item.height)))
  const naturalHeight = rowHeights.reduce((total, height) => total + height, 0) + rowGap * Math.max(rows.length - 1, 0)
  const availableHeight = Math.max(paddleSafeY - startY, isMobile ? 220 : 320)
  const scale = Math.min(1, availableHeight / naturalHeight)
  const shouldScale = scale < 1

  return sized.map((item, index) => {
    const width = shouldScale ? item.width * scale : item.width
    const height = shouldScale ? item.height * scale : item.height
    const row = Math.floor(index / columns)
    const isOddRow = row % 2 === 1
    const column = isOddRow ? columns - 1 - (index % columns) : index % columns
    const previousRowsHeight = rowHeights
      .slice(0, row)
      .reduce((total, rowHeight) => total + (shouldScale ? rowHeight * scale : rowHeight) + rowGap, 0)
    const currentRowHeight = shouldScale ? rowHeights[row] * scale : rowHeights[row]
    const jitterX = (Math.random() - 0.5) * Math.min(18, columnWidth * 0.1)
    const jitterY = (Math.random() - 0.5) * Math.min(10, rowGap * 0.35)

    return {
      id: `${item.src}-${item.index}`,
      src: item.src,
      width,
      height,
      x: startX + column * columnWidth + jitterX,
      y: startY + previousRowsHeight + currentRowHeight / 2 + jitterY,
    }
  })
}

export default function FunModeGravityOverlay({ active, media, onClose }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const paddleRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const targetPaddleXRef = useRef(0)
  const keyDirectionRef = useRef(0)
  const remainingBlocksRef = useRef(0)
  const [blocks, setBlocks] = useState<BlockItem[]>([])
  const [countdown, setCountdown] = useState<CountdownValue>(null)
  const [hasGameStarted, setHasGameStarted] = useState(false)
  const [isHardMode, setIsHardMode] = useState(false)
  const [showWinMessage, setShowWinMessage] = useState(false)

  useEffect(() => {
    if (!active) {
      setBlocks([])
      setCountdown(null)
      setHasGameStarted(false)
      setIsHardMode(false)
      setShowWinMessage(false)
      return
    }

    let cancelled = false
    const count = window.innerWidth < 768 ? 18 : 21

    Promise.allSettled(shuffle(media).slice(0, count).map(loadImage))
      .then((results) => {
        if (cancelled) return

        const loaded = results
          .filter((result): result is PromiseFulfilledResult<{ src: string; ratio: number }> => result.status === 'fulfilled')
          .map((result) => result.value)

        const nextBlocks = layoutBlocks(loaded)
        setBlocks(nextBlocks)
        setIsHardMode(false)
        setShowWinMessage(false)
        remainingBlocksRef.current = nextBlocks.length
      })

    return () => {
      cancelled = true
    }
  }, [active, media])

  useEffect(() => {
    if (!active || blocks.length === 0) return

    setCountdown('3')
    setHasGameStarted(false)
    const timers = [
      window.setTimeout(() => setCountdown('2'), 800),
      window.setTimeout(() => setCountdown('1'), 1600),
      window.setTimeout(() => setCountdown('DRAMANOID'), 2400),
      window.setTimeout(() => {
        setCountdown(null)
        setHasGameStarted(true)
      }, 3250),
    ]

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [active, blocks])

  useEffect(() => {
    if (!active || blocks.length === 0 || !sceneRef.current) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width < 768
    const engine = Matter.Engine.create()
    const runner = Matter.Runner.create()
    const destroyedIds = new Set<string>()
    const blockBodies = new Map<string, Matter.Body>()
    const paddleWidth = isMobile ? 96 : 148
    const paddleHeight = 16
    const paddleY = height - (isMobile ? 72 : 82)
    const ballRadius = isMobile ? 9 : 11

    engine.gravity.y = 0
    targetPaddleXRef.current = width / 2

    const leftWall = Matter.Bodies.rectangle(-24, height / 2, 48, height * 2, { isStatic: true })
    const rightWall = Matter.Bodies.rectangle(width + 24, height / 2, 48, height * 2, { isStatic: true })
    const topWall = Matter.Bodies.rectangle(width / 2, -24, width + 96, 48, { isStatic: true })
    const paddle = Matter.Bodies.rectangle(width / 2, paddleY, paddleWidth, paddleHeight, {
      isStatic: true,
      label: 'paddle',
      restitution: 1,
    })
    const ball = Matter.Bodies.circle(width / 2, paddleY - 44, ballRadius, {
      label: 'ball',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      inertia: Infinity,
    })

    Matter.Body.setVelocity(ball, { x: 0, y: 0 })

    const blockMatterBodies = blocks.map((block) => {
      const body = Matter.Bodies.rectangle(block.x, block.y, block.width, block.height, {
        isStatic: true,
        label: `block:${block.id}`,
        restitution: 1,
      })

      blockBodies.set(block.id, body)
      return body
    })

    Matter.Composite.add(engine.world, [leftWall, rightWall, topWall, paddle, ball, ...blockMatterBodies])

    const setPaddleTarget = (clientX: number) => {
      targetPaddleXRef.current = Math.min(Math.max(clientX, paddleWidth / 2 + 12), width - paddleWidth / 2 - 12)
    }

    const handlePointerMove = (event: PointerEvent) => setPaddleTarget(event.clientX)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      keyDirectionRef.current = event.key === 'ArrowLeft' ? -1 : 1
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      keyDirectionRef.current = 0
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    const resetBall = () => {
      targetPaddleXRef.current = width / 2
      Matter.Body.setPosition(paddle, { x: targetPaddleXRef.current, y: paddleY })
      Matter.Body.setPosition(ball, { x: width / 2, y: paddleY - 44 })
      Matter.Body.setVelocity(ball, {
        x: (Math.random() > 0.5 ? 1 : -1) * (isMobile ? 4.2 : 5.2),
        y: isMobile ? -6.4 : -7.2,
      })
    }

    const correctBallAngle = () => {
      const velocity = ball.velocity
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
      if (speed <= 0) return

      const minAxisVelocity = isMobile ? 2.2 : 2.8
      const nextVelocity = { x: velocity.x, y: velocity.y }
      let shouldCorrect = false

      if (Math.abs(nextVelocity.y) < minAxisVelocity) {
        nextVelocity.y = (nextVelocity.y >= 0 ? 1 : -1) * minAxisVelocity
        shouldCorrect = true
      }

      if (Math.abs(nextVelocity.x) < minAxisVelocity * 0.55) {
        nextVelocity.x = (Math.random() > 0.5 ? 1 : -1) * minAxisVelocity * 0.75
        shouldCorrect = true
      }

      if (!shouldCorrect) return

      const correctedSpeed = Math.sqrt(nextVelocity.x ** 2 + nextVelocity.y ** 2)
      Matter.Body.setVelocity(ball, {
        x: (nextVelocity.x / correctedSpeed) * speed,
        y: (nextVelocity.y / correctedSpeed) * speed,
      })
    }

    const launchTimer = window.setTimeout(() => {
      if (ballRef.current) ballRef.current.style.opacity = '1'
      if (paddleRef.current) paddleRef.current.style.opacity = '1'
      resetBall()
    }, 3250)

    const syncDomToPhysics = () => {
      if (keyDirectionRef.current !== 0) {
        targetPaddleXRef.current = Math.min(
          Math.max(targetPaddleXRef.current + keyDirectionRef.current * (isMobile ? 9 : 13), paddleWidth / 2 + 12),
          width - paddleWidth / 2 - 12,
        )
      }

      Matter.Body.setPosition(paddle, { x: targetPaddleXRef.current, y: paddleY })

      const velocity = ball.velocity
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
      const targetSpeed = remainingBlocksRef.current <= 6 && remainingBlocksRef.current > 0 ? (isMobile ? 8.5 : 10.2) : (isMobile ? 7.4 : 8.8)
      if (speed > 0 && Math.abs(speed - targetSpeed) > 0.08) {
        Matter.Body.setVelocity(ball, {
          x: (velocity.x / speed) * targetSpeed,
          y: (velocity.y / speed) * targetSpeed,
        })
      }
      correctBallAngle()

      if (ball.position.y > height + 80) resetBall()

      if (paddleRef.current) {
        paddleRef.current.style.transform = `translate3d(${paddle.position.x - paddleWidth / 2}px, ${paddle.position.y - paddleHeight / 2}px, 0)`
      }

      if (ballRef.current) {
        ballRef.current.style.transform = `translate3d(${ball.position.x - ballRadius}px, ${ball.position.y - ballRadius}px, 0)`
      }

      blocks.forEach((block) => {
        if (destroyedIds.has(block.id)) return

        const body = blockBodies.get(block.id)
        const element = blockRefs.current[block.id]
        if (!body || !element) return

        element.style.transform = `translate3d(${body.position.x - block.width / 2}px, ${body.position.y - block.height / 2}px, 0) rotate(${body.angle}rad)`
      })

    }

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const blockBody = [pair.bodyA, pair.bodyB].find((body) => body.label.startsWith('block:'))
        if (!blockBody) return

        const id = blockBody.label.replace('block:', '')
        if (destroyedIds.has(id)) return

        destroyedIds.add(id)
        Matter.Composite.remove(engine.world, blockBody)

        const block = blocks.find((item) => item.id === id)
        if (!block) return

        const element = blockRefs.current[id]
        if (element) element.style.display = 'none'

        const nextRemainingBlocks = blocks.length - destroyedIds.size
        remainingBlocksRef.current = nextRemainingBlocks
        if (nextRemainingBlocks === 6) setIsHardMode(true)

        if (destroyedIds.size === blocks.length) {
          setIsHardMode(false)
          setShowWinMessage(true)
          if (ballRef.current) ballRef.current.style.opacity = '0'
          if (paddleRef.current) paddleRef.current.style.opacity = '0'
          window.setTimeout(onClose, 1400)
        }
      })
    })

    Matter.Events.on(engine, 'afterUpdate', syncDomToPhysics)
    Matter.Runner.run(runner, engine)
    syncDomToPhysics()

    const handleResize = () => onClose()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(launchTimer)
      keyDirectionRef.current = 0
      Matter.Events.off(engine, 'afterUpdate', syncDomToPhysics)
      Matter.Runner.stop(runner)
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [active, blocks, onClose])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          ref={sceneRef}
          className="fixed inset-0 z-[80] overflow-hidden bg-white"
          initial={{ opacity: 0, filter: 'blur(18px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#F504FF_0%,#FE796D_38%,#FCC028_68%,#F504FF_100%)] bg-[length:240%_240%]"
            animate={{
              opacity: isHardMode ? 0 : 1,
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              opacity: { duration: 0.65 },
              backgroundPosition: { duration: 3.6, repeat: Infinity, ease: 'linear' },
            }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 bg-black"
            animate={{ opacity: isHardMode ? 1 : 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_86%_24%,rgba(0,0,0,0.12),transparent_30%)]" />

          <button
            type="button"
            aria-pressed="true"
            onClick={onClose}
            className={`absolute right-5 top-20 z-30 rounded-full border px-4 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] shadow-[0_0_22px_rgba(0,0,0,0.18)] transition-colors md:right-10 md:top-24 ${isHardMode ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}
          >
            FUN MODE
          </button>

          <AnimatePresence mode="wait">
            {countdown && (
              <motion.div
                key={countdown}
                className={`pointer-events-none absolute inset-0 z-40 flex items-center justify-center text-center font-black uppercase leading-none tracking-normal ${isHardMode ? 'text-white' : 'text-black'}`}
                initial={{ opacity: 0, scale: 0.6, filter: 'blur(16px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.28, filter: 'blur(10px)' }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: countdown === 'DRAMANOID' ? 'clamp(3rem, 11vw, 9rem)' : 'clamp(6rem, 18vw, 14rem)' }}
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showWinMessage && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center text-center font-black uppercase leading-none text-black"
                initial={{ opacity: 0, scale: 0.72, filter: 'blur(18px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: 'clamp(3.5rem, 12vw, 10rem)' }}
              >
                ¡GANASTE!
              </motion.div>
            )}
          </AnimatePresence>

          {hasGameStarted && blocks.map((block) => {
            return (
              <motion.div
                key={block.id}
                ref={(element) => {
                  blockRefs.current[block.id] = element
                }}
                className="pointer-events-none absolute left-0 top-0 z-20 overflow-hidden rounded-md bg-white p-1.5 shadow-[0_16px_38px_rgba(0,0,0,0.2)] will-change-transform"
                style={{
                  width: block.width,
                  height: block.height,
                  transform: `translate3d(${block.x - block.width / 2}px, ${block.y - block.height / 2}px, 0)`,
                }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt=""
                  className="h-full w-full rounded-[3px] object-contain"
                  draggable={false}
                />
              </motion.div>
            )
          })}

          <div
            ref={ballRef}
            className={`absolute left-0 top-0 z-40 h-[18px] w-[18px] rounded-full shadow-[0_0_22px_rgba(245,4,255,0.42)] transition-colors will-change-transform md:h-[22px] md:w-[22px] ${isHardMode ? 'bg-[linear-gradient(135deg,#F504FF,#FE796D_45%,#FCC028)]' : 'bg-white'}`}
            style={{
              opacity: 0,
              transform: 'translate3d(calc(50vw - 9px), calc(100vh - 126px), 0)',
            }}
          />

          <div
            ref={paddleRef}
            className={`absolute left-0 top-0 z-40 h-4 w-24 rounded-full shadow-[0_0_28px_rgba(0,0,0,0.18)] transition-colors will-change-transform md:w-[148px] ${isHardMode ? 'bg-white' : 'bg-black'}`}
            style={{
              opacity: 0,
              transform: 'translate3d(calc(50vw - 48px), calc(100vh - 80px), 0)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
