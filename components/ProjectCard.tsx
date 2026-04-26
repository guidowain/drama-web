'use client'

import { motion } from 'framer-motion'
import type { Proyecto } from '@/lib/types'

type Props = {
  project: Proyecto
  onClick: (project: Proyecto) => void
}

export default function ProjectCard({ project, onClick }: Props) {
  const hasManyTags = project.tags.length >= 5
  const tagClassName = hasManyTags
    ? 'text-[0.52rem] md:text-[0.56rem] px-2 py-[1px] tracking-[0.03em]'
    : 'text-[0.58rem] md:text-[0.62rem] px-2.5 py-[1px] tracking-[0.04em]'

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(project)}
      className="h-full cursor-pointer rounded-2xl bg-white shadow-md transition-shadow hover:shadow-[0_0_28px_rgba(0,0,0,0.12)]"
    >
      <div className="flex h-full flex-col rounded-2xl bg-white p-3">
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
        <div className="mt-2 grid min-h-[3.15rem] grid-cols-[1fr_auto] items-start gap-2 px-1 pb-1 md:min-h-[3.35rem]">
          <div className="flex flex-wrap content-start gap-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-block rounded-full border-[0.5px] border-black/20 font-semibold uppercase text-black ${tagClassName}`}
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium text-black/35">{project.year}</span>
        </div>
      </div>
    </motion.article>
  )
}
