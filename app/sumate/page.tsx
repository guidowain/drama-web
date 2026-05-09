import type { Metadata } from 'next'
import SumateForm from '@/components/SumateForm'
import { getSiteSettings } from '@/lib/api'
import { fixedSiteCopy, getFixedSiteCopy } from '@/lib/site-copy'
import { getRequestLocale } from '@/lib/server-locale'

export const metadata: Metadata = {
  title: fixedSiteCopy.sumate.metadataTitle,
  description: fixedSiteCopy.sumate.metadataDescription,
}

export default async function SumatePage() {
  const settings = await getSiteSettings()
  const { locale } = getRequestLocale()
  const copy = getFixedSiteCopy(locale)

  return (
    <main className="min-h-screen bg-black pt-16 text-white md:pt-[72px]">
      <section className="gradient-bg px-5 py-12 text-black md:px-10 md:py-16">
        <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-black/55">
              {copy.sumate.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-none md:text-7xl">
              {copy.sumate.title}
            </h1>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-snug text-black/70 md:justify-self-end md:text-xl">
            {copy.sumate.intro}
          </p>
        </div>
      </section>

      <section className="px-5 py-10 md:px-10 md:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <SumateForm instagramUrl={settings.settings.instagram} />
        </div>
      </section>
    </main>
  )
}
