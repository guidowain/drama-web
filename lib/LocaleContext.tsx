'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getFixedSiteCopy, normalizeLocale, type Locale } from '@/lib/site-copy'

type LocaleContextValue = {
  locale: Locale
  copy: ReturnType<typeof getFixedSiteCopy>
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'es',
  copy: getFixedSiteCopy('es'),
  setLocale: () => {},
})

export function LocaleProvider({
  children,
  initialLocale,
  lockLocale = false,
}: {
  children: React.ReactNode
  initialLocale: Locale
  lockLocale?: boolean
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    const cookieLocale = getCookieLocale()
    if (cookieLocale) {
      setLocale(cookieLocale)
      return
    }

    if (lockLocale) return

    const browserLocale = normalizeLocale(navigator.languages?.[0] ?? navigator.language)
    setLocale(browserLocale)
  }, [lockLocale])

  function handleSetLocale(nextLocale: Locale) {
    document.cookie = `drama-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`
    setLocale(nextLocale)
  }

  const value = useMemo(() => ({
    locale,
    copy: getFixedSiteCopy(locale),
    setLocale: handleSetLocale,
  }), [locale])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useSiteCopy() {
  return useContext(LocaleContext).copy
}

export function useLocale() {
  return useContext(LocaleContext).locale
}

export function useLocaleControls() {
  const { locale, setLocale } = useContext(LocaleContext)
  return { locale, setLocale }
}

function getCookieLocale(): Locale | null {
  const match = document.cookie.match(/(?:^|; )drama-locale=(es|en|pt)(?:;|$)/)
  return match?.[1] as Locale | undefined ?? null
}
