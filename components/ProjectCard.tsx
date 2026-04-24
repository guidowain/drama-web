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
      className="cursor-pointer bg-white rounded-2xl p-3 shadow-md hover:shadow-xl transition-shadow"
    >
      {/* Cover image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
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
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-gradient">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-black/40 text-xs font-medium shrink-0">{project.year}</span>
      </div>
    </motion.article>
  )
}
