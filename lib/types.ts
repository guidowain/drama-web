export interface ContentBlock {
  id: string
  type: 'image' | 'imageImage' | 'imageText' | 'text'
  alignment?: 'left' | 'center' | 'right'
  title?: string
  text?: string
  image?: string
  imageAlt?: string
  imageScale?: number
  imageShowMuteButton?: boolean
  image2?: string
  image2Alt?: string
  image2Scale?: number
  image2ShowMuteButton?: boolean
  imageSide?: 'left' | 'right' | 'auto'
  order: number
}

export type LocaleCode = 'es' | 'en' | 'pt'
export type TranslationLocale = Exclude<LocaleCode, 'es'>

export interface ContentBlockTranslation {
  title?: string
  text?: string
  imageAlt?: string
  image2Alt?: string
}

export interface Proyecto {
  id: string
  name: string
  slug: string
  year: number
  featured: boolean
  published: boolean
  tags: string[]
  coverImage: string
  coverImageAlt: string
  seoTitle: string
  seoDescription: string
  excerpt: string
  contentBlocks: ContentBlock[]
  translations?: Partial<Record<TranslationLocale, ProyectoTranslation>>
}

export interface ProyectoTranslation {
  name?: string
  tags?: string[]
  coverImageAlt?: string
  seoTitle?: string
  seoDescription?: string
  excerpt?: string
  contentBlocks?: ContentBlockTranslation[]
}

export interface DramaWord {
  id: string
  word: string
  projectId: string
}

export interface TriviaOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface TriviaQuestion {
  id: string
  projectId?: string
  image: string
  question: string
  options: TriviaOption[]
}

export interface ServiceInfo {
  name: string
  description: string
  items: string[]
}

export interface Logo {
  src: string
  alt: string
  scale?: number
}

export interface ContactSettings {
  instagram: string
  whatsapp: string
  mail: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface SiteSettings {
  home: {
    heroVideo: string
    heroLine1: string
    heroLine2: string
    services: {
      design: ServiceInfo
      communication: ServiceInfo
    }
    logos: Logo[]
    wheelText?: string
  }
  about: {
    title: string
    image: string
    imageAlt: string
    quienesSomosTitle: string
    quienesSomos: string
    comoTrabajamosTitle: string
    comoTrabajamos: string
    queDiferenciaTitle: string
    queDiferencia: string
    faqs: FaqItem[]
  }
  settings: ContactSettings
  translations?: Partial<Record<TranslationLocale, SiteSettingsTranslation>>
}

export interface SiteSettingsTranslation {
  home?: {
    heroLine1?: string
    heroLine2?: string
    services?: {
      design?: Partial<ServiceInfo>
      communication?: Partial<ServiceInfo>
    }
    wheelText?: string
  }
  about?: {
    title?: string
    imageAlt?: string
    quienesSomosTitle?: string
    quienesSomos?: string
    comoTrabajamosTitle?: string
    comoTrabajamos?: string
    queDiferenciaTitle?: string
    queDiferencia?: string
    faqs?: Partial<FaqItem>[]
  }
}
