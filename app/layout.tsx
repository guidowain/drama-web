import type { Metadata } from 'next'
import './globals.css'
import { MenuProvider } from '@/lib/MenuContext'
import Header from '@/components/Header'
import Menu from '@/components/Menu'
import { getSiteSettings } from '@/lib/api'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Drama — Comunicación y Diseño para Entretenimiento',
  description: 'La historia debajo del escenario.',
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

  let settings = { settings: null }
  try {
    settings = await getSiteSettings()
  } catch {
    settings = { settings: null }
  }

  return (
    <html lang="es">
      <body>
        {isAdmin ? (
          children
        ) : (
          <MenuProvider>
            <Header settings={settings?.settings} />
            <Menu settings={settings?.settings} />
            {children}
          </MenuProvider>
        )}
      </body>
    </html>
  )
}
