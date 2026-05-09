'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getFixedSiteCopy, normalizeLocale, type Locale } from '@/lib/site-copy'

type LocaleContextValue = {
  locale: Locale
  copy: ReturnType<typeof getFixedSiteCopy>
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'es',
  copy: getFixedSiteCopy('es'),
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
    if (lockLocale) return

    const browserLocale = normalizeLocale(navigator.languages?.[0] ?? navigator.language)
    setLocale(browserLocale)
  }, [lockLocale])

  const value = useMemo(() => ({
    locale,
    copy: getFixedSiteCopy(locale),
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
