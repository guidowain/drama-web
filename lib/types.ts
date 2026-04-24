export interface ContentBlock {
  id: string
  type: 'image' | 'imageText' | 'text'
  title?: string
  text?: string
  image?: string
  imageAlt?: string
  imageSide?: 'left' | 'right' | 'auto'
  order: number
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
    contact: {
      mail: string
      whatsapp: string
      instagram: string
    }
  }
  about: {
    image: string
    imageAlt: string
    quienesSomos: string
    comoTrabajamos: string
    queDiferencia: string
  }
  settings: {
    instagram: string
    whatsapp: string
    mail: string
    logoMain: string
    logoMenu: string
    favicon: string
  }
}
