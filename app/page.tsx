import { getSiteSettings } from '@/lib/api'
import Ticker from '@/components/Ticker'
import LogosTicker from '@/components/LogosTicker'
import HeroGradientPlaque from '@/components/HeroGradientPlaque'
import CTAProyectos from '@/components/CTAProyectos'
import ContactStrip from '@/components/ContactStrip'

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
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <ServiceCard
            name={home.services.design.name}
            items={home.services.design.items}
            icon={<IconDesign />}
          />
          <ServiceCard
            name={home.services.communication.name}
            items={home.services.communication.items}
            icon={<IconComm />}
          />
        </div>
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

function ServiceCard({
  name,
  items,
  icon,
}: {
  name: string
  items: string[]
  icon: React.ReactNode
}) {
  return (
    <div className="flip-card h-72 md:h-80 rounded-2xl">
      <div className="flip-card-inner rounded-2xl">
        {/* Front */}
        <div className="flip-card-front glass-card rounded-2xl flex flex-col items-center justify-center gap-4 p-6 overflow-hidden">
          <div className="text-white opacity-80">{icon}</div>
          <h3
            className="text-white font-black uppercase tracking-tight text-center leading-none w-full"
            style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)' }}
          >
            {name}
          </h3>
        </div>

        {/* Back */}
        <div className="flip-card-back glass-card rounded-2xl flex flex-col justify-center gap-2 p-6">
          <h3 className="text-white font-black text-lg uppercase mb-1 leading-tight">{name}</h3>
          <ul className="columns-2 gap-x-4 space-y-1">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-white/80 text-xs break-inside-avoid leading-snug">
                <span className="w-1 h-1 rounded-full gradient-bg shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function IconDesign() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconComm() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
