'use client'

import { useEffect } from 'react'

const DEFAULT_MESSAGE = 'Tenés cambios sin guardar. Si salís ahora se pierden. ¿Salir igual?'

/**
 * Avisa antes de perder cambios sin guardar, en los dos caminos posibles:
 *
 * 1. Cerrar/recargar la pestaña o cambiar la URL a mano -> `beforeunload` (diálogo del navegador,
 *    no se puede personalizar el texto: los navegadores lo ignoran a propósito).
 * 2. Navegación interna del admin (sidebar, "Volver", etc.) -> se intercepta el click en el <a>
 *    antes de que Next haga el push. Va en fase de captura para adelantarse al router.
 */
export function useUnsavedChanges(isDirty: boolean, message: string = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!isDirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return

    function handleClick(event: MouseEvent) {
      // Respetamos click derecho, click del medio y las combinaciones que abren en otra pestaña.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      // Si va al mismo lugar donde ya estamos, no hay nada que perder.
      if (href === window.location.pathname) return

      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty, message])
}
