import type { ContentBlock, ContentBlockTranslation, LocaleCode, Proyecto, SiteSettings } from '@/lib/types'

function translatedText(value: string | undefined, fallback: string) {
  return value?.trim() ? value : fallback
}

export function localizeSiteSettings(settings: SiteSettings, locale: LocaleCode): SiteSettings {
  if (locale === 'es') return settings

  const translation = settings.translations?.[locale]
  if (!translation) return settings

  return {
    ...settings,
    home: {
      ...settings.home,
      heroLine1: translatedText(translation.home?.heroLine1, settings.home.heroLine1),
      heroLine2: translatedText(translation.home?.heroLine2, settings.home.heroLine2),
      wheelText: translatedText(translation.home?.wheelText, settings.home.wheelText ?? ''),
      services: {
        design: {
          ...settings.home.services.design,
          name: translatedText(translation.home?.services?.design?.name, settings.home.services.design.name),
          description: translatedText(translation.home?.services?.design?.description, settings.home.services.design.description),
          items: localizeStringList(settings.home.services.design.items, translation.home?.services?.design?.items),
        },
        communication: {
          ...settings.home.services.communication,
          name: translatedText(translation.home?.services?.communication?.name, settings.home.services.communication.name),
          description: translatedText(translation.home?.services?.communication?.description, settings.home.services.communication.description),
          items: localizeStringList(settings.home.services.communication.items, translation.home?.services?.communication?.items),
        },
      },
    },
    about: {
      ...settings.about,
      title: translatedText(translation.about?.title, settings.about.title),
      imageAlt: translatedText(translation.about?.imageAlt, settings.about.imageAlt),
      quienesSomosTitle: translatedText(translation.about?.quienesSomosTitle, settings.about.quienesSomosTitle),
      quienesSomos: translatedText(translation.about?.quienesSomos, settings.about.quienesSomos),
      comoTrabajamosTitle: translatedText(translation.about?.comoTrabajamosTitle, settings.about.comoTrabajamosTitle),
      comoTrabajamos: translatedText(translation.about?.comoTrabajamos, settings.about.comoTrabajamos),
      queDiferenciaTitle: translatedText(translation.about?.queDiferenciaTitle, settings.about.queDiferenciaTitle),
      queDiferencia: translatedText(translation.about?.queDiferencia, settings.about.queDiferencia),
      faqs: settings.about.faqs.map((faq, index) => ({
        question: translatedText(translation.about?.faqs?.[index]?.question, faq.question),
        answer: translatedText(translation.about?.faqs?.[index]?.answer, faq.answer),
      })),
    },
  }
}

export function localizeProject(project: Proyecto, locale: LocaleCode): Proyecto {
  if (locale === 'es') return project

  const translation = project.translations?.[locale]
  if (!translation) return project

  return {
    ...project,
    name: translatedText(translation.name, project.name),
    tags: localizeStringList(project.tags, translation.tags),
    coverImageAlt: translatedText(translation.coverImageAlt, project.coverImageAlt),
    seoTitle: translatedText(translation.seoTitle, project.seoTitle),
    seoDescription: translatedText(translation.seoDescription, project.seoDescription),
    excerpt: translatedText(translation.excerpt, project.excerpt),
    contentBlocks: project.contentBlocks.map((block, index) => localizeContentBlock(block, translation.contentBlocks?.[index])),
  }
}

export function localizeProjects(projects: Proyecto[], locale: LocaleCode): Proyecto[] {
  return projects.map((project) => localizeProject(project, locale))
}

function localizeContentBlock(block: ContentBlock, translation?: ContentBlockTranslation): ContentBlock {
  if (!translation) return block

  return {
    ...block,
    title: translatedText(translation.title, block.title ?? ''),
    text: translatedText(translation.text, block.text ?? ''),
    imageAlt: translatedText(translation.imageAlt, block.imageAlt ?? ''),
    image2Alt: translatedText(translation.image2Alt, block.image2Alt ?? ''),
  }
}

function localizeStringList(source: string[], translation?: string[]) {
  if (!translation?.length) return source

  return source.map((item, index) => translatedText(translation[index], item))
}
