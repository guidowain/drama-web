'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ProjectCard from '@/components/ProjectCard'
import ModalProject from '@/components/ModalProject'
import ContactStrip from '@/components/ContactStrip'
import Ticker from '@/components/Ticker'
import type { Proyecto } from '@/lib/types'
import { hasProjectDetailMedia } from '@/lib/media'

type ModalOriginRect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>

const CONTACT = {
  instagram: 'https://instagram.com/drama.com.ar',
  whatsapp: 'https://wa.me/5491163357223',
  mail: 'los@drama.com.ar',
}

export default function ProyectosPage() {
  return (
    <Suspense>
      <ProyectosContent />
    </Suspense>
  )
}

function ProyectosContent() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [selected, setSelected] = useState<Proyecto | null>(null)
  const [modalOrigin, setModalOrigin] = useState<ModalOriginRect | null>(null)
  const [showAboutCta, setShowAboutCta] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const timer = window.setTimeout(() => setShowAboutCta(true), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetch('/api/admin/proyectos')
      .then((r) => r.json())
      .then((data: Proyecto[]) => {
        const published = data.filter((p) => p.published)
        setProjects(published)
        const slug = searchParams.get('slug')
        if (slug) {
          const found = published.find((p) => p.slug === slug)
          if (found && hasProjectDetailMedia(found)) {
            setSelected(found)
          } else {
            setSelected(null)
            setModalOrigin(null)
          }
        } else {
          setSelected(null)
          setModalOrigin(null)
        }
      })
  }, [searchParams])

  const handleCardOpen = useCallback((project: Proyecto, originRect: DOMRect) => {
    if (!hasProjectDetailMedia(project)) return

    setModalOrigin({
      top: originRect.top,
      left: originRect.left,
      width: originRect.width,
      height: originRect.height,
    })
    setSelected(project)
    router.push(`/proyectos?slug=${project.slug}`, { scroll: false })
  }, [router])

  const handleClose = useCallback(() => {
    setSelected(null)
    setModalOrigin(null)
    router.push('/proyectos', { scroll: false })
  }, [router])

  return (
    <>
      <main className="min-h-screen gradient-bg pt-16 md:pt-[72px]">
        {/* Page header */}
        <div className="px-5 md:px-10 pt-10 md:pt-14 pb-6">
          <div className="mx-auto w-full max-w-6xl" data-page="proyectos">
            <h1 className="text-black font-black uppercase text-5xl md:text-7xl leading-none">
              PROYECTOS
            </h1>
          </div>
        </div>

        {/* Grid — all cards, no pagination */}
        <div className="px-5 md:px-10 pb-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onClick={handleCardOpen}
                />
              ))}
            </div>
            <div className={`mt-12 flex justify-center transition-all duration-700 md:mt-16 ${showAboutCta ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
              <Link
                href="/sobre-nosotros"
                aria-hidden={!showAboutCta}
                tabIndex={showAboutCta ? undefined : -1}
                className="inline-flex rounded-full border-2 border-black bg-white px-10 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black transition-colors duration-300 hover:bg-black hover:text-white"
              >
                SOBRE NOSOTROS
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Ticker text="DISEÑO Y COMUNICACIÓN PARA ENTRETENIMIENTO" bg="#000" speed={55} />

      <ContactStrip
        instagram={CONTACT.instagram}
        whatsapp={CONTACT.whatsapp}
        mail={CONTACT.mail}
      />

      <ModalProject
        project={selected}
        originRect={modalOrigin}
        contact={CONTACT}
        onClose={handleClose}
      />
    </>
  )
}
