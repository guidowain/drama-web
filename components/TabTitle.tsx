'use client'

import { useEffect } from 'react'

const ACTIVE_TITLE = 'Drama - Agencia'
const AWAY_TITLES = ['¡Volvé a Drama!', '¡Te extrañamos!']

export default function TabTitle() {
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
      document.title = ACTIVE_TITLE
    }

    function startAwayTitle() {
      clearTitleInterval()
      document.title = AWAY_TITLES[0]

      intervalId = window.setInterval(() => {
        index = (index + 1) % AWAY_TITLES.length
        document.title = AWAY_TITLES[index]
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
  }, [])

  return null
}
