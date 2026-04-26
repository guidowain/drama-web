import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, saveSiteSettings } from '@/lib/api'
import type { Logo, SiteSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

function mergeLogos(current: Logo[], incoming: unknown): Logo[] {
  if (!Array.isArray(incoming)) return current

  return incoming.map((item, index) => {
    const currentLogo = current[index]
    const nextLogo = item && typeof item === 'object' ? (item as Partial<Logo>) : {}

    return {
      src: nextLogo.src ?? currentLogo?.src ?? '',
      alt: nextLogo.alt ?? currentLogo?.alt ?? '',
      scale: typeof nextLogo.scale === 'number' ? nextLogo.scale : currentLogo?.scale ?? 1,
    }
  })
}

function mergeSiteSettings(current: SiteSettings, incoming: unknown): SiteSettings {
  const next = incoming && typeof incoming === 'object' ? (incoming as Partial<SiteSettings>) : {}

  return {
    ...current,
    ...next,
    home: {
      ...current.home,
      ...next.home,
      services: {
        design: {
          ...current.home.services.design,
          ...next.home?.services?.design,
          items: next.home?.services?.design?.items ?? current.home.services.design.items,
        },
        communication: {
          ...current.home.services.communication,
          ...next.home?.services?.communication,
          items: next.home?.services?.communication?.items ?? current.home.services.communication.items,
        },
      },
      logos: mergeLogos(current.home.logos, next.home?.logos),
      contact: {
        ...current.home.contact,
        ...next.home?.contact,
      },
    },
    about: {
      ...current.about,
      ...next.about,
    },
    settings: {
      instagram: next.settings?.instagram ?? current.settings.instagram,
      whatsapp: next.settings?.whatsapp ?? current.settings.whatsapp,
      mail: next.settings?.mail ?? current.settings.mail,
    },
  }
}

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const current = await getSiteSettings()
  const merged = mergeSiteSettings(current, body)

  await saveSiteSettings(merged)
  return NextResponse.json({ ok: true })
}
