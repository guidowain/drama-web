'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Proyecto, ContentBlock } from '@/lib/types'
import PlayableMedia from './PlayableMedia'

type ModalRect = {
  top: number
  left: number
  width: number
  height: number
  borderRadius?: number
}

type Props = {
  project: Proyecto | null
  originRect?: ModalRect | null
  contact: {
    instagram: string
    whatsapp: string
    mail: string
  }
  onClose: () => void
}

export default function ModalProject({ project, originRect, contact, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchStartedAtTopRef = useRef(false)
  const touchCloseReadyRef = useRef(false)
  const [modalFrame, setModalFrame] = useState<ModalRect | null>(() => getModalFrame())

  useEffect(() => {
    if (!project) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [project, onClose])

  useEffect(() => {
    if (!project) return

    const syncFrame = () => setModalFrame(getModalFrame())

    syncFrame()
    window.addEventListener('resize', syncFrame)
    window.addEventListener('orientationchange', syncFrame)
    window.visualViewport?.addEventListener('resize', syncFrame)

    return () => {
      window.removeEventListener('resize', syncFrame)
      window.removeEventListener('orientationchange', syncFrame)
      window.visualViewport?.removeEventListener('resize', syncFrame)
    }
  }, [project])

  const contentVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.16, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    },
  }
  const initialFrame = originRect && modalFrame
    ? {
        opacity: 0.98,
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        borderRadius: 16,
      }
    : modalFrame
      ? {
          opacity: 0,
          top: modalFrame.top + 18,
          left: modalFrame.left,
          width: modalFrame.width,
          height: modalFrame.height,
          borderRadius: modalFrame.borderRadius,
        }
      : { opacity: 0 }
  const animateFrame = modalFrame
    ? {
        opacity: 1,
        top: modalFrame.top,
        left: modalFrame.left,
        width: modalFrame.width,
        height: modalFrame.height,
        borderRadius: modalFrame.borderRadius,
      }
    : { opacity: 1 }
  const modalStyle = modalFrame
    ? ({ '--modal-media-max-height': `${Math.max(220, modalFrame.height - 150)}px` } as CSSProperties)
    : undefined
  const exitFrame = originRect && modalFrame
    ? {
        opacity: 0,
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        borderRadius: 16,
      }
    : { opacity: 0 }

  const isMobileViewport = () => (
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
  )

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return

    touchStartYRef.current = event.touches[0]?.clientY ?? null
    touchStartedAtTopRef.current = (scrollRef.current?.scrollTop ?? 0) <= 0
    touchCloseReadyRef.current = false
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartedAtTopRef.current || touchStartYRef.current == null) return

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current
    const deltaY = currentY - touchStartYRef.current

    if ((scrollRef.current?.scrollTop ?? 0) <= 0 && deltaY > 24) {
      event.preventDefault()
    }

    touchCloseReadyRef.current = deltaY > 110
  }

  const handleTouchEnd = () => {
    if (touchCloseReadyRef.current) onClose()

    touchStartYRef.current = null
    touchStartedAtTopRef.current = false
    touchCloseReadyRef.current = false
  }

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/70"
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[201] flex items-center justify-center p-0 md:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={initialFrame}
              animate={animateFrame}
              exit={exitFrame}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              style={modalStyle}
              className="fixed flex flex-col overflow-hidden bg-black shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Header */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="relative gradient-bg px-6 pt-9 pb-6 md:rounded-t-3xl md:px-10 md:pt-10 md:pb-7"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/20 text-black"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase text-black leading-none">
                    {project.name}
                  </h1>
                  <span className="text-black/60 font-bold text-xl shrink-0">{project.year}</span>
                </div>
              </motion.div>

              {/* Content blocks */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="px-6 md:px-10 py-8 md:py-10 space-y-10"
              >
                {project.contentBlocks
                  .sort((a, b) => a.order - b.order)
                  .map((block) => (
                    <ContentBlockRenderer key={block.id} block={block} />
                  ))}
              </motion.div>
              </div>

              <nav
                aria-label="Contacto"
                className="gradient-bg flex shrink-0 items-center justify-center gap-9 px-6 py-4 text-black md:gap-10"
              >
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="opacity-75 transition-opacity hover:opacity-100"
                >
                  <IconInstagram />
                </a>
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="opacity-75 transition-opacity hover:opacity-100"
                >
                  <IconWhatsApp />
                </a>
                <a
                  href={`mailto:${contact.mail}`}
                  aria-label="Mail"
                  className="opacity-75 transition-opacity hover:opacity-100"
                >
                  <IconMail />
                </a>
              </nav>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function IconInstagram() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.118 1.528 5.845L.057 23.882a.5.5 0 00.613.613l6.143-1.47A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.524-5.202-1.435l-.372-.222-3.853.922.936-3.762-.243-.386A9.963 9.963 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}

function getModalFrame(): ModalRect | null {
  if (typeof window === 'undefined') return null

  const isMobile = window.innerWidth < 768
  if (isMobile) {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
    }
  }

  const width = Math.min(window.innerWidth * 0.86, 980)
  const height = Math.min(window.innerHeight * 0.9, 820)

  return {
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
    width,
    height,
    borderRadius: 24,
  }
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'text') {
    return (
      <div className="max-w-2xl">
        {block.title && (
          <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-3">
            {block.title}
          </h2>
        )}
        {block.text && (
          <p className="text-white/70 leading-relaxed">{block.text}</p>
        )}
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div className="w-full">
        {block.image && (
          <ScaledImage
            src={block.image}
            alt={block.imageAlt || ''}
            scale={block.imageScale}
          />
        )}
        {block.title && (
          <p className="text-white/40 text-sm mt-2 text-center">{block.title}</p>
        )}
      </div>
    )
  }

  if (block.type === 'imageImage') {
    return (
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          {block.image && (
            <ScaledImage
              src={block.image}
              alt={block.imageAlt || ''}
              scale={block.imageScale}
            />
          )}
        </div>
        <div>
          {block.image2 && (
            <ScaledImage
              src={block.image2}
              alt={block.image2Alt || ''}
              scale={block.image2Scale}
            />
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'imageText') {
    const isRight = block.imageSide === 'right'
    return (
      <div className={`grid md:grid-cols-2 gap-8 items-center ${isRight ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <div>
          {block.image && (
            <ScaledImage
              src={block.image}
              alt={block.imageAlt || ''}
              scale={block.imageScale}
            />
          )}
        </div>
        <div>
          {block.title && (
            <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-3">
              {block.title}
            </h2>
          )}
          {block.text && (
            <p className="text-white/70 leading-relaxed">{block.text}</p>
          )}
        </div>
      </div>
    )
  }

  return null
}

function ScaledImage({ src, alt, scale }: { src: string; alt: string; scale?: number }) {
  const width = `${clampScale(scale)}%`

  return (
    <div className="w-full flex justify-center">
      <PlayableMedia
        src={src}
        alt={alt}
        className="w-full object-contain rounded-xl"
        videoClassName="w-full object-contain rounded-xl pointer-events-none"
        style={{ maxHeight: 'var(--modal-media-max-height)', height: 'auto' }}
        width={width}
      />
    </div>
  )
}

function clampScale(value?: number) {
  if (!Number.isFinite(value)) return 100
  return Math.min(140, Math.max(40, Math.round(Number(value))))
}
