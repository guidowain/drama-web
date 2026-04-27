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
      <circle cx="13.5" cy="6.5" r=".5" fill="url(#designIconGradient)" stroke="none" />
      <circle cx="17.5" cy="10.5" r=".5" fill="url(#designIconGradient)" stroke="none" />
      <circle cx="8.5" cy="7.5" r=".5" fill="url(#designIconGradient)" stroke="none" />
      <circle cx="6.5" cy="12.5" r=".5" fill="url(#designIconGradient)" stroke="none" />
      <path d="M12 22C6.5 22 2 17.97 2 13c0-5.03 4.5-9 10-9s10 3.97 10 9c0 1.66-1.34 3-3 3h-1.77c-.85 0-1.23 1.06-.58 1.6.67.56 1.05 1.36 1.05 2.23 0 1.2-.98 2.17-2.18 2.17H12Z" />
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
