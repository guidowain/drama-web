'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
}

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.985,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay,
    },
  }),
}

export default function AboutReveal({ children, delay = 0, className }: Props) {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches
  ))

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const syncMedia = () => setIsDesktop(media.matches)

    syncMedia()
    media.addEventListener('change', syncMedia)

    return () => media.removeEventListener('change', syncMedia)
  }, [])

  if (!isDesktop) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      custom={delay}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.22, margin: '0px 0px -8% 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
