import type { Metadata } from 'next'
import './globals.css'
import { MenuProvider } from '@/lib/MenuContext'
import { LocaleProvider } from '@/lib/LocaleContext'
import Header from '@/components/Header'
import Menu from '@/components/Menu'
import TabTitle from '@/components/TabTitle'
import InvertedPunctuation from '@/components/InvertedPunctuation'
import Analytics from '@/components/Analytics'
import { getSiteSettings } from '@/lib/api'
import { fixedSiteCopy } from '@/lib/site-copy'
import { getRequestLocale } from '@/lib/server-locale'
import { headers } from 'next/headers'
import { isDynamicServerError } from 'next/dist/client/components/hooks-server-context'

const SITE_URL = 'https://drama.com.ar'
const OG_IMAGE = `${SITE_URL}/brand/drama-gradient-header.png`

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Drama',
  url: SITE_URL,
  logo: `${SITE_URL}/logos/Logo%20oficial.png`,
  description: 'Agencia de diseño y comunicación especializada en entretenimiento en Buenos Aires, Argentina.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Buenos Aires',
    addressCountry: 'AR',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'los@drama.com.ar',
  },
  sameAs: ['https://instagram.com/drama.com.ar'],
}

export const metadata: Metadata = {
  title: fixedSiteCopy.metadata.title,
  description: fixedSiteCopy.metadata.description,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: 'Drama',
    title: fixedSiteCopy.metadata.title,
    description: fixedSiteCopy.metadata.description,
    images: [{ url: OG_IMAGE, alt: 'Drama — Agencia de Diseño y Comunicación para Entretenimiento' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: fixedSiteCopy.metadata.title,
    description: fixedSiteCopy.metadata.description,
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      {
        url: '/favicon/favicon.webp',
        type: 'image/webp',
      },
    ],
    apple: [
      {
        url: '/favicon/apple-touch-icon.png',
        type: 'image/png',
      },
    ],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let isAdmin = false
  const requestLocale = getRequestLocale()
  const { locale, lockLocale } = requestLocale

  try {
    const headersList = headers()
    const pathname = headersList.get('x-pathname') ?? ''
    isAdmin = pathname.startsWith('/admin')
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error
    }

    isAdmin = false
  }

  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null
  try {
    settings = await getSiteSettings()
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error
    }

    settings = null
  }

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {isAdmin ? (
          children
        ) : (
          <LocaleProvider initialLocale={locale} lockLocale={lockLocale}>
            <MenuProvider>
              <Header settings={settings?.settings ?? {
                instagram: '',
                whatsapp: '',
                mail: '',
              }} />
              <Menu settings={settings?.settings ?? {
                instagram: '',
                whatsapp: '',
                mail: '',
              }} />
              <TabTitle />
              <InvertedPunctuation />
              {children}
              <Analytics />
            </MenuProvider>
          </LocaleProvider>
        )}
      </body>
    </html>
  )
}
