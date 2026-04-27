import { getSiteSettings } from '@/lib/api'
import Ticker from '@/components/Ticker'
import ContactStrip from '@/components/ContactStrip'

export default async function SobreNosotrosPage() {
  const settings = await getSiteSettings()
  const { about, settings: siteSettings } = settings

  return (
    <main className="min-h-screen pt-16 md:pt-[72px]" style={{ background: 'linear-gradient(135deg, #FF3E9E 0%, #FFA24A 60%, #FF3E9E 100%)' }}>
      {/* Main content */}
      <div className="px-5 md:px-10 py-12 md:py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left — image */}
          <div className="order-1 md:order-1">
            {about.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={about.image}
                alt={about.imageAlt}
                className="w-full rounded-2xl object-contain"
              />
            ) : (
              <div className="aspect-square rounded-2xl bg-black/20 flex items-center justify-center">
                <span className="text-black/40 text-sm">Imagen del equipo</span>
              </div>
            )}
          </div>

          {/* Right — content */}
          <div className="order-2 md:order-2 flex flex-col gap-6">
            <h1 className="text-black font-black uppercase text-5xl md:text-6xl lg:text-7xl leading-none">
              SOMOS<br />DRAMA
            </h1>

            {/* Black content box */}
            <div className="bg-black rounded-2xl p-6 md:p-8 space-y-6">
              <ContentBlock
                title="QUIÉNES SOMOS"
                text={about.quienesSomos}
              />
              <ContentBlock
                title="CÓMO TRABAJAMOS"
                text={about.comoTrabajamos}
              />
              <ContentBlock
                title="QUÉ NOS DIFERENCIA"
                text={about.queDiferencia}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Ticker */}
      <Ticker text="COMUNICACIÓN Y DISEÑO PARA ENTRETENIMIENTO" bg="#000" />

      {/* Contacto */}
      <ContactStrip
        instagram={siteSettings.instagram}
        whatsapp={siteSettings.whatsapp}
        mail={siteSettings.mail}
      />
    </main>
  )
}

function ContentBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1.5">{title}</h2>
      <p className="text-white text-sm md:text-base leading-relaxed">{text}</p>
    </div>
  )
}
