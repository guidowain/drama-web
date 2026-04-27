import { getSiteSettings } from '@/lib/api'
import Ticker from '@/components/Ticker'
import LogosTicker from '@/components/LogosTicker'
import HeroGradientPlaque from '@/components/HeroGradientPlaque'
import CTAProyectos from '@/components/CTAProyectos'
import ContactStrip from '@/components/ContactStrip'
import ServicesGrid from '@/components/ServicesGrid'

export default async function HomePage() {
  const settings = await getSiteSettings()
  const { home, settings: contact } = settings

  return (
    <main className="pt-16 md:pt-[72px]">
      {/* ── HERO ── */}
      <section className="relative bg-black">
        {/* SEO H1 — in DOM for indexing, invisible visually */}
        <h1 className="sr-only-seo">
          Agencia de diseño y comunicación para entretenimiento en Buenos Aires
        </h1>

        {/* Video */}
        <div className="hero-video-wrap w-full overflow-hidden">
          <video
            src={home.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Gradient plaque: texto + ticker adentro */}
        <HeroGradientPlaque lines={[home.heroLine1, home.heroLine2]}>
          <Ticker text="DISEÑO Y COMUNICACIÓN PARA ENTRETENIMIENTO" speed={55} bg="#000" color="#fff" />
        </HeroGradientPlaque>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-black py-12 md:py-20 px-5 md:px-8">
        <ServicesGrid
          services={[
            {
              name: home.services.design.name,
              items: home.services.design.items,
              icon: <IconDesign />,
            },
            {
              name: home.services.communication.name,
              items: home.services.communication.items,
              icon: <IconComm />,
            },
          ]}
        />
      </section>

      {/* ── LOGOS TICKER ── */}
      <LogosTicker logos={home.logos} />

      {/* ── CTA PROYECTOS ── */}
      <section className="bg-black py-12 md:py-16 px-5">
        <CTAProyectos />
      </section>

      {/* ── CONTACTO ── */}
      <ContactStrip
        instagram={contact.instagram}
        whatsapp={contact.whatsapp}
        mail={contact.mail}
      />
    </main>
  )
}

function IconDesign() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#designIconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="designIconGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F504FF" />
          <stop offset="0.45" stopColor="#FE796D" />
          <stop offset="1" stopColor="#FCC028" />
        </linearGradient>
      </defs>
      <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.01 0 1.66-1.34 3-3 3 0 0 1.33 1 4 1 2.49 0 4-1.5 4-4.01 0-1.66-1.34-3-3-3Z" />
    </svg>
  )
}

function IconComm() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#commIconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="commIconGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F504FF" />
          <stop offset="0.45" stopColor="#FE796D" />
          <stop offset="1" stopColor="#FCC028" />
        </linearGradient>
      </defs>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}
