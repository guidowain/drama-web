'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ProjectCard from '@/components/ProjectCard'
import ModalProject from '@/components/ModalProject'
import ContactStrip from '@/components/ContactStrip'
import Ticker from '@/components/Ticker'
import type { Proyecto } from '@/lib/types'

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
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/admin/proyectos')
      .then((r) => r.json())
      .then((data: Proyecto[]) => {
        const published = data.filter((p) => p.published)
        setProjects(published)
        const slug = searchParams.get('slug')
        if (slug) {
          const found = published.find((p) => p.slug === slug)
          if (found) setSelected(found)
        }
      })
  }, [searchParams])

  const handleCardOpen = useCallback((project: Proyecto, originRect: DOMRect) => {
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
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={handleCardOpen} />
              ))}
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

      <ModalProject project={selected} originRect={modalOrigin} onClose={handleClose} />
    </>
  )
}
