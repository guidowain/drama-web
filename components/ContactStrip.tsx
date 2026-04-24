type Props = {
  instagram: string
  whatsapp: string
  mail: string
}

export default function ContactStrip({ instagram, whatsapp, mail }: Props) {
  return (
    <section
      className="w-full py-14 md:py-20 px-6 md:px-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 md:gap-0"
      style={{
        background: 'linear-gradient(135deg, #F504FF 0%, #FE8B97 28%, #FE796D 50%, #FCC028 75%, #FED791 100%)',
      }}
    >
      {/* Left */}
      <p className="text-black font-black uppercase leading-[1.05] text-4xl md:text-6xl lg:text-7xl">
        ESCRIBINOS,<br />NO HAY DRAMA
      </p>

      {/* Right — contact icons */}
      <nav aria-label="Contacto" className="flex items-center gap-8 md:gap-10">
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-black opacity-70 hover:opacity-100 transition-opacity hover:scale-110 transform duration-200"
        >
          <IconInstagram />
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="text-black opacity-70 hover:opacity-100 transition-opacity hover:scale-110 transform duration-200"
        >
          <IconWhatsApp />
        </a>
        <a
          href={`mailto:${mail}`}
          aria-label="Email"
          className="text-black opacity-70 hover:opacity-100 transition-opacity hover:scale-110 transform duration-200"
        >
          <IconMail />
        </a>
      </nav>
    </section>
  )
}

function IconInstagram() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.118 1.528 5.845L.057 23.882a.5.5 0 00.613.613l6.143-1.47A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.524-5.202-1.435l-.372-.222-3.853.922.936-3.762-.243-.386A9.963 9.963 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}
