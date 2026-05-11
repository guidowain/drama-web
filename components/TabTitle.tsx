'use client'

import { useEffect } from 'react'
import { useSiteCopy } from '@/lib/LocaleContext'

export default function TabTitle() {
  const copy = useSiteCopy()

  useEffect(() => {
    let intervalId: number | null = null
    let index = 0

    function clearTitleInterval() {
      if (intervalId == null) return
      window.clearInterval(intervalId)
      intervalId = null
    }

    function setActiveTitle() {
      clearTitleInterval()
      document.title = copy.metadata.title
    }

    function startAwayTitle() {
      clearTitleInterval()
      document.title = copy.tab.awayTitles[0]

      intervalId = window.setInterval(() => {
        index = (index + 1) % copy.tab.awayTitles.length
        document.title = copy.tab.awayTitles[index]
      }, 1400)
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        startAwayTitle()
        return
      }

      index = 0
      setActiveTitle()
    }

    setActiveTitle()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTitleInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [copy.metadata.title, copy.tab.awayTitles])

  return null
}
