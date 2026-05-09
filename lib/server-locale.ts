import { headers } from 'next/headers'
import { isDynamicServerError } from 'next/dist/client/components/hooks-server-context'
import { normalizeLocale, type Locale } from '@/lib/site-copy'

export function getRequestLocale(): { locale: Locale; lockLocale: boolean; country: string } {
  try {
    const headersList = headers()
    const country = (
      headersList.get('x-vercel-ip-country') ||
      headersList.get('x-country-code') ||
      headersList.get('cf-ipcountry') ||
      ''
    ).toUpperCase()

    if (country === 'AR') {
      return { locale: 'es', lockLocale: true, country }
    }

    return {
      locale: normalizeLocale(headersList.get('accept-language')),
      lockLocale: false,
      country,
    }
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error
    }

    return { locale: 'en', lockLocale: false, country: '' }
  }
}
