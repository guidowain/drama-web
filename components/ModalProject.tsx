'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Proyecto, ContentBlock } from '@/lib/types'

type Props = {
  project: Proyecto | null
  onClose: () => void
}

export default function ModalProject({ project, onClose }: Props) {
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

  const contentVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.16, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    },
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
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-0 md:p-6"
            onClick={onClose}
          >
            <div
              className="relative bg-black w-full h-full overflow-y-auto md:h-auto md:w-[86vw] md:max-w-[980px] md:max-h-[90vh] md:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
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
                className="relative gradient-bg px-6 pt-12 pb-8 md:rounded-t-3xl md:px-10"
              >
                <div className="flex flex-wrap gap-2 mb-4">
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
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase text-black leading-none">
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

              {/* Contact bottom */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="border-t border-white/10 px-6 md:px-10 py-8"
              >
                <p className="text-white/40 text-sm text-center">
                  ¿Te gustaría un proyecto similar?{' '}
                  <a href="mailto:los@drama.com.ar" onClick={onClose} className="text-brand-pink hover:underline">
                    Escribinos
                  </a>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full object-contain rounded-xl"
        style={{ width, maxWidth: '140%' }}
      />
    </div>
  )
}

function clampScale(value?: number) {
  if (!Number.isFinite(value)) return 100
  return Math.min(140, Math.max(40, Math.round(Number(value))))
}
