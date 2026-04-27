'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Proyecto } from '@/lib/types'
import { hasProjectDetailMedia } from '@/lib/media'
import PlayableMedia from './PlayableMedia'

type Props = {
  project: Proyecto
  index: number
  onClick: (project: Proyecto, originRect: DOMRect) => void
}

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.985,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: index < 2 ? 0.12 + index * 0.1 : 0,
    },
  }),
}

export default function ProjectCard({ project, index, onClick }: Props) {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches
  ))
  const isClickable = hasProjectDetailMedia(project)
  const hasManyTags = project.tags.length >= 5
  const tagClassName = hasManyTags
    ? 'text-[0.5rem] md:text-[0.54rem] px-2 py-[1px] tracking-[0.025em]'
    : 'text-[0.58rem] md:text-[0.62rem] px-2.5 py-[1px] tracking-[0.04em]'

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const syncMedia = () => setIsDesktop(media.matches)

    syncMedia()
    media.addEventListener('change', syncMedia)

    return () => media.removeEventListener('change', syncMedia)
  }, [])

  return (
    <motion.article
      custom={index}
      variants={revealVariants}
      initial={isDesktop ? 'hidden' : false}
      animate={isDesktop && index < 2 ? 'visible' : undefined}
      whileInView={isDesktop && index >= 2 ? 'visible' : undefined}
      viewport={{ once: true, amount: 0.22, margin: '0px 0px -8% 0px' }}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={(event) => {
        if (!isClickable) return
        onClick(project, event.currentTarget.getBoundingClientRect())
      }}
      className={[
        'h-full rounded-2xl bg-white shadow-md transition-shadow',
        isClickable ? 'cursor-pointer hover:shadow-[0_0_28px_rgba(0,0,0,0.12)]' : 'cursor-default',
      ].join(' ')}
    >
      <div className="flex h-full flex-col rounded-2xl bg-white p-3">
        {/* Cover image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-950">
          {project.coverImage ? (
            <PlayableMedia
              src={project.coverImage}
              alt={project.coverImageAlt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-bg opacity-30" />
          )}
        </div>

        {/* Info */}
        <div className="mt-3 grid h-11 grid-cols-[1fr_auto] items-center gap-2 px-1 pb-0.5">
          <div className="flex max-h-[2.35rem] flex-wrap content-center items-center gap-1 overflow-hidden">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-block rounded-full border-[0.5px] border-black/20 font-semibold uppercase text-black ${tagClassName}`}
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="shrink-0 self-center text-xs font-medium text-black/35">{project.year}</span>
        </div>
      </div>
    </motion.article>
  )
}
