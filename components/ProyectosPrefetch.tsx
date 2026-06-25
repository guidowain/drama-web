'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchProjects } from '@/lib/projects-client'

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

export default function ProyectosPrefetch() {
  const router = useRouter()

  useEffect(() => {
    const idleWindow = window as IdleWindow
    let idleId: number | null = null
    let timeoutId: number | null = null

    const prefetch = () => {
      router.prefetch('/proyectos')
      fetchProjects()
        .catch(() => {})
    }

    const schedulePrefetch = () => {
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(prefetch, { timeout: 1500 })
        return
      }

      timeoutId = window.setTimeout(prefetch, 400)
    }

    if (document.readyState === 'complete') {
      schedulePrefetch()
    } else {
      window.addEventListener('load', schedulePrefetch, { once: true })
    }

    return () => {
      window.removeEventListener('load', schedulePrefetch)
      if (idleId != null && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [router])

  return null
}
