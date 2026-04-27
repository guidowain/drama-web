import { getSiteSettings } from '@/lib/api'
import Ticker from '@/components/Ticker'
import LogosTicker from '@/components/LogosTicker'
import HeroGradientPlaque from '@/components/HeroGradientPlaque'
import CTAProyectos from '@/components/CTAProyectos'
import ContactStrip from '@/components/ContactStrip'
import ServicesGrid from '@/components/ServicesGrid'

export default async function HomePage() {
  const settings = await getSiteSettings()
  const { home } = settings

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
          <Ticker text="COMUNICACIÓN Y DISEÑO PARA ENTRETENIMIENTO" speed={55} bg="#000" color="#fff" />
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
        instagram={home.contact.instagram}
        whatsapp={home.contact.whatsapp}
        mail={home.contact.mail}
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
      <path d="M18.5 3.5 9 13" />
      <path d="m16.5 5.5 2 2" />
      <path d="m8.5 13.5 2 2" />
      <path d="M7.8 14.4c-2.3.4-3.8 2.1-3.8 4.8 1.9 0 4.1-.4 5.1-2 .5-.9.1-2.1-1.3-2.8Z" />
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
