import type { Metadata } from 'next'
import './globals.css'
import { MenuProvider } from '@/lib/MenuContext'
import Header from '@/components/Header'
import Menu from '@/components/Menu'
import TabTitle from '@/components/TabTitle'
import { getSiteSettings } from '@/lib/api'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Drama - Agencia',
  description: 'La historia debajo del escenario.',
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

  try {
    const headersList = headers()
    const pathname = headersList.get('x-pathname') ?? ''
    isAdmin = pathname.startsWith('/admin')
  } catch {
    isAdmin = false
  }

  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null
  try {
    settings = await getSiteSettings()
  } catch {
    settings = null
  }

  return (
    <html lang="es">
      <body>
        {isAdmin ? (
          children
        ) : (
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
            {children}
          </MenuProvider>
        )}
      </body>
    </html>
  )
}
