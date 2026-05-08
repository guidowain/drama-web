'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ProjectCard from '@/components/ProjectCard'
import ModalProject from '@/components/ModalProject'
import ContactStrip from '@/components/ContactStrip'
import Ticker from '@/components/Ticker'
import FunModeGravityOverlay from '@/components/FunModeGravityOverlay'
import FunModeTriviaOverlay from '@/components/FunModeTriviaOverlay'
import type { ContactSettings, Proyecto, SiteSettings } from '@/lib/types'
import { hasProjectDetailMedia, isVideoUrl } from '@/lib/media'
import { fetchProjects } from '@/lib/projects-client'
import { trackEvent } from '@/lib/analytics'

type ModalOriginRect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>
type FunModeType = 'dramanoid' | 'trivia'

const EMPTY_CONTACT: ContactSettings = {
  instagram: '',
  whatsapp: '',
  mail: '',
}

function collectProjectMedia(projects: Proyecto[]) {
  const media = new Set<string>()

  projects.forEach((project) => {
    if (project.coverImage && !isVideoUrl(project.coverImage)) media.add(project.coverImage)

    project.contentBlocks.forEach((block) => {
      if (block.image && !isVideoUrl(block.image)) media.add(block.image)
      if (block.image2 && !isVideoUrl(block.image2)) media.add(block.image2)
    })
  })

  return Array.from(media)
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
  const [contact, setContact] = useState<ContactSettings>(EMPTY_CONTACT)
  const [selected, setSelected] = useState<Proyecto | null>(null)
  const [modalOrigin, setModalOrigin] = useState<ModalOriginRect | null>(null)
  const [showAboutCta, setShowAboutCta] = useState(false)
  const [funMode, setFunMode] = useState<FunModeType | null>(null)
  const [canUseDramanoid, setCanUseDramanoid] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const lastTrackedProjectSlugRef = useRef<string | null>(null)
  const funMediaPool = useMemo(() => collectProjectMedia(projects), [projects])

  useEffect(() => {
    const timer = window.setTimeout(() => setShowAboutCta(true), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const syncMedia = () => {
      setCanUseDramanoid(media.matches)
      if (!media.matches) {
        setFunMode((current) => (current === 'dramanoid' ? null : current))
      }
    }

    syncMedia()
    media.addEventListener('change', syncMedia)

    return () => media.removeEventListener('change', syncMedia)
  }, [])

  useEffect(() => {
    fetchProjects()
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

  useEffect(() => {
    fetch('/api/admin/site')
      .then((r) => r.json())
      .then((data: SiteSettings) => setContact(data.settings))
  }, [])

  useEffect(() => {
    if (!selected) {
      lastTrackedProjectSlugRef.current = null
      return
    }

    if (lastTrackedProjectSlugRef.current === selected.slug) {
      return
    }

    lastTrackedProjectSlugRef.current = selected.slug
    trackEvent('project_modal_open', {
      project_name: selected.name,
    })
  }, [selected])

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

  const handleFunModeOpen = useCallback(() => {
    if (funMode) {
      setFunMode(null)
      return
    }

    if (!canUseDramanoid) {
      trackEvent('fan_mode_open')
      setFunMode('trivia')
      return
    }

    if (funMediaPool.length === 0) {
      trackEvent('fan_mode_open')
      setFunMode('trivia')
      return
    }

    const lastMode = window.sessionStorage.getItem('drama-fun-mode-last')
    const nextMode: FunModeType = lastMode === 'dramanoid'
      ? 'trivia'
      : lastMode === 'trivia'
        ? 'dramanoid'
        : Math.random() > 0.5
          ? 'dramanoid'
          : 'trivia'

    window.sessionStorage.setItem('drama-fun-mode-last', nextMode)
    trackEvent('fan_mode_open')
    setFunMode(nextMode)
  }, [canUseDramanoid, funMediaPool.length, funMode])

  const handleFunModeClose = useCallback(() => {
    setFunMode(null)
  }, [])

  return (
    <>
      <main className={`min-h-screen overflow-x-hidden gradient-bg pt-16 transition-all duration-500 md:pt-[72px] ${funMode ? 'scale-[0.985] blur-[7px] opacity-45' : ''}`}>
        {/* Page header */}
        <div className="px-5 md:px-10 pt-10 md:pt-14 pb-6">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-4 gap-y-3 md:flex-nowrap" data-page="proyectos">
            <h1 className="text-black font-black uppercase text-5xl md:text-7xl leading-none">
              PROYECTOS
            </h1>
            <button
              type="button"
              aria-pressed={Boolean(funMode)}
              onClick={handleFunModeOpen}
              className={[
                'ml-auto mb-1 shrink-0 rounded-full border px-4 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] transition-all duration-300 md:mb-2',
                funMode
                  ? 'border-black bg-black text-white shadow-[0_0_22px_rgba(0,0,0,0.18)]'
                  : 'border-black/25 bg-white/20 text-black/55 hover:border-black/50 hover:bg-white/40 hover:text-black',
              ].join(' ')}
            >
              FUN MODE
            </button>
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

      <div className="flex min-h-screen flex-col">
        <Ticker text="DISEÑO Y COMUNICACIÓN PARA ENTRETENIMIENTO" bg="#000" speed={55} />

        <ContactStrip
          instagram={contact.instagram}
          whatsapp={contact.whatsapp}
          mail={contact.mail}
        />
      </div>

      <ModalProject
        project={selected}
        originRect={modalOrigin}
        contact={contact}
        onClose={handleClose}
      />

      <FunModeGravityOverlay
        active={canUseDramanoid && funMode === 'dramanoid'}
        media={funMediaPool}
        onClose={handleFunModeClose}
      />

      <FunModeTriviaOverlay
        active={funMode === 'trivia'}
        onClose={handleFunModeClose}
      />
    </>
  )
}
