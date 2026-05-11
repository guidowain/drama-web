export type Locale = 'es' | 'en' | 'pt'

type SiteCopy = {
  metadata: {
    title: string
    description: string
  }
  home: {
    seoTitle: string
    wheelText: string
  }
  tab: {
    awayTitles: string[]
  }
  about: {
    teamImageFallback: string
  }
  nav: {
    home: string
    projects: string
    about: string
    join: string
    homeAria: string
    openMenu: string
  }
  common: {
    projects: string
    funMode: string
    contact: string
    close: string
  }
  trivia: {
    title: string
    shareTextSuffix: string
    fallbackError: string
    loadError: string
    viewProjects: string
    result: string
    correct: string
    incorrect: string
    sharing: string
    shareResults: string
    playAgain: string
  }
  dramanoid: {
    title: string
    win: string
  }
  contact: {
    headline: string[]
  }
  contactForm: {
    firstName: string
    lastName: string
    email: string
    message: string
    sent: string
    send: string
    whatsappIntro: string
  }
  sumate: {
    metadataTitle: string
    metadataDescription: string
    eyebrow: string
    title: string
    intro: string
  }
}

const es: SiteCopy = {
  metadata: {
    title: 'Drama - Agencia',
    description: 'La historia debajo del escenario.',
  },
  home: {
    seoTitle: 'Agencia de diseño y comunicación para entretenimiento en Buenos Aires',
    wheelText: 'DISEÑO Y COMUNICACIÓN PARA ENTRETENIMIENTO',
  },
  tab: {
    awayTitles: ['¡Volvé a Drama!', '¡Te extrañamos!'],
  },
  about: {
    teamImageFallback: 'Imagen del equipo',
  },
  nav: {
    home: 'HOME',
    projects: 'PROYECTOS',
    about: 'NOSOTROS',
    join: 'SUMATE',
    homeAria: 'Drama - Inicio',
    openMenu: 'Abrir menú',
  },
  common: {
    projects: 'PROYECTOS',
    funMode: 'FUN MODE',
    contact: 'Contacto',
    close: 'Cerrar',
  },
  trivia: {
    title: 'DRAMA TRIVIA',
    shareTextSuffix: 'jugá vos también en drama.com.ar',
    fallbackError: 'TRIVIA EN ENSAYO',
    loadError: 'No se pudo cargar la trivia',
    viewProjects: 'VER PROYECTOS',
    result: 'Resultado',
    correct: 'CORRECTA',
    incorrect: 'INCORRECTA',
    sharing: 'Compartiendo...',
    shareResults: 'COMPARTIR RESULTADOS',
    playAgain: 'VOLVER A JUGAR',
  },
  dramanoid: {
    title: 'DRAMANOID',
    win: '¡GANASTE!',
  },
  contact: {
    headline: ['ESCRIBINOS,', 'NO HAY DRAMA.'],
  },
  contactForm: {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    message: 'Mensaje',
    sent: 'Enviado',
    send: 'Enviar',
    whatsappIntro: 'Hola Drama! Soy',
  },
  sumate: {
    metadataTitle: 'Sumate - Drama',
    metadataDescription: 'Sumate a la red de talentos de Drama.',
    eyebrow: 'Queremos conocerte',
    title: 'Sumate',
    intro: 'Si trabajás en diseño, comunicación, contenido, producción o estrategia para entretenimiento, completá el formulario y dejanos tus links.',
  },
}

const en: SiteCopy = {
  metadata: {
    title: 'Drama - Agency',
    description: 'The story beneath the stage.',
  },
  home: {
    seoTitle: 'Design and communications agency for entertainment in Buenos Aires',
    wheelText: 'DESIGN AND COMMUNICATIONS FOR ENTERTAINMENT',
  },
  tab: {
    awayTitles: ['Come back to Drama!', 'We miss you!'],
  },
  about: {
    teamImageFallback: 'Team image',
  },
  nav: {
    home: 'HOME',
    projects: 'PROJECTS',
    about: 'ABOUT US',
    join: 'JOIN US',
    homeAria: 'Drama - Home',
    openMenu: 'Open menu',
  },
  common: {
    projects: 'PROJECTS',
    funMode: 'FUN MODE',
    contact: 'Contact',
    close: 'Close',
  },
  trivia: {
    title: 'DRAMA TRIVIA',
    shareTextSuffix: 'play it too at drama.com.ar',
    fallbackError: 'TRIVIA IN REHEARSAL',
    loadError: 'We could not load the trivia',
    viewProjects: 'VIEW PROJECTS',
    result: 'Result',
    correct: 'CORRECT',
    incorrect: 'INCORRECT',
    sharing: 'Sharing...',
    shareResults: 'SHARE RESULTS',
    playAgain: 'PLAY AGAIN',
  },
  dramanoid: {
    title: 'DRAMANOID',
    win: 'YOU WON!',
  },
  contact: {
    headline: ['CONTACT US,', 'NO DRAMA.'],
  },
  contactForm: {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    message: 'Message',
    sent: 'Sent',
    send: 'Send',
    whatsappIntro: 'Hi Drama! I am',
  },
  sumate: {
    metadataTitle: 'Join Us - Drama',
    metadataDescription: 'Join Drama’s talent network.',
    eyebrow: 'We want to meet you',
    title: 'Join us',
    intro: 'If you work in design, communications, content, production, or strategy for entertainment, fill out the form and send us your links.',
  },
}

const pt: SiteCopy = es

export const siteCopies = {
  es,
  en,
  pt,
} as const

export const fixedSiteCopy = siteCopies.es

export function normalizeLocale(language?: string | null): Locale {
  const normalized = language?.toLowerCase() ?? ''
  if (normalized.startsWith('pt')) return 'pt'
  if (normalized.startsWith('es')) return 'es'
  return 'en'
}

export function getFixedSiteCopy(locale: Locale = 'es') {
  return siteCopies[locale]
}
