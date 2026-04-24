'use client'

import { motion } from 'framer-motion'
import type { Proyecto } from '@/lib/types'

type Props = {
  project: Proyecto
  onClick: (project: Proyecto) => void
}

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(project)}
      className="cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#F504FF_0%,#FE8B97_28%,#FE796D_50%,#FCC028_75%,#FED791_100%)] p-px shadow-md transition-shadow hover:shadow-[0_0_28px_rgba(245,4,255,0.15)]"
    >
      <div className="rounded-[calc(1rem-1px)] bg-black p-3">
        {/* Cover image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950">
          {project.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverImage}
              alt={project.coverImageAlt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-bg opacity-30" />
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-1 pb-1 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="border border-transparent bg-[linear-gradient(#000,#000)_padding-box,var(--gradient)_border-box] text-white text-[0.6rem] md:text-[0.65rem] font-semibold uppercase tracking-[0.04em] px-2.5 py-[2px] rounded-full inline-block"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-white/40 text-xs font-medium shrink-0">{project.year}</span>
        </div>
      </div>
    </motion.article>
  )
}
