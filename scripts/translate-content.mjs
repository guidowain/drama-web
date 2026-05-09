import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE_LOCALE = 'es'
const TARGET_LOCALES = new Set(['en'])
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

const targetLocale = process.argv[2]
const force = process.argv.includes('--force')

if (!TARGET_LOCALES.has(targetLocale)) {
  console.error('Uso: npm run translate:en')
  process.exit(1)
}

const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
const outputDir = path.join(ROOT, 'data', 'i18n', targetLocale)

const sitePath = path.join(ROOT, 'data', 'site.json')
const projectsPath = path.join(ROOT, 'data', 'projects.json')
const outputSitePath = path.join(outputDir, 'site.json')
const outputProjectsPath = path.join(outputDir, 'projects.json')

const site = JSON.parse(await fs.readFile(sitePath, 'utf8'))
const projects = JSON.parse(await fs.readFile(projectsPath, 'utf8'))
const existingSite = await readJsonIfExists(outputSitePath)
const existingProjects = await readJsonIfExists(outputProjectsPath)

const jobs = []

const translatedSite = await translateSite(site, existingSite)
const translatedProjects = await translateProjects(projects, existingProjects)

if (!apiKey) {
  console.log([
    'No se encontró GOOGLE_TRANSLATE_API_KEY.',
    `Textos pendientes para ${targetLocale}: ${jobs.length}`,
    '',
    'Cuando tengas habilitada Cloud Translation API, corré:',
    'GOOGLE_TRANSLATE_API_KEY=... npm run translate:en',
  ].join('\n'))
  process.exit(0)
}

await runTranslationJobs(jobs)
await fs.mkdir(outputDir, { recursive: true })
await fs.writeFile(outputSitePath, `${JSON.stringify(translatedSite, null, 2)}\n`)
await fs.writeFile(outputProjectsPath, `${JSON.stringify(translatedProjects, null, 2)}\n`)

console.log(`Traducciones guardadas en data/i18n/${targetLocale}/`)
console.log(`Textos traducidos: ${jobs.length}`)

async function translateSite(source, existing) {
  return {
    ...source,
    home: {
      ...source.home,
      heroLine1: queueTranslation(source.home.heroLine1, existing?.home?.heroLine1),
      heroLine2: queueTranslation(source.home.heroLine2, existing?.home?.heroLine2),
      services: {
        design: translateService(source.home.services.design, existing?.home?.services?.design),
        communication: translateService(source.home.services.communication, existing?.home?.services?.communication),
      },
      wheelText: queueTranslation(source.home.wheelText, existing?.home?.wheelText),
    },
    about: {
      ...source.about,
      title: queueTranslation(source.about.title, existing?.about?.title),
      imageAlt: queueTranslation(source.about.imageAlt, existing?.about?.imageAlt),
      quienesSomosTitle: queueTranslation(source.about.quienesSomosTitle, existing?.about?.quienesSomosTitle),
      quienesSomos: queueTranslation(source.about.quienesSomos, existing?.about?.quienesSomos),
      comoTrabajamosTitle: queueTranslation(source.about.comoTrabajamosTitle, existing?.about?.comoTrabajamosTitle),
      comoTrabajamos: queueTranslation(source.about.comoTrabajamos, existing?.about?.comoTrabajamos),
      queDiferenciaTitle: queueTranslation(source.about.queDiferenciaTitle, existing?.about?.queDiferenciaTitle),
      queDiferencia: queueTranslation(source.about.queDiferencia, existing?.about?.queDiferencia),
      faqs: source.about.faqs.map((faq, index) => ({
        question: queueTranslation(faq.question, existing?.about?.faqs?.[index]?.question),
        answer: queueTranslation(faq.answer, existing?.about?.faqs?.[index]?.answer),
      })),
    },
  }
}

function translateService(source, existing) {
  return {
    ...source,
    name: queueTranslation(source.name, existing?.name),
    description: queueTranslation(source.description, existing?.description),
    items: source.items.map((item, index) => queueTranslation(item, existing?.items?.[index])),
  }
}

async function translateProjects(sourceProjects, existingProjects = []) {
  return sourceProjects.map((project, projectIndex) => {
    const existing = existingProjects?.[projectIndex]

    return {
      ...project,
      tags: project.tags.map((tag, index) => queueTranslation(tag, existing?.tags?.[index])),
      coverImageAlt: queueTranslation(project.coverImageAlt, existing?.coverImageAlt),
      seoTitle: queueTranslation(project.seoTitle, existing?.seoTitle),
      seoDescription: queueTranslation(project.seoDescription, existing?.seoDescription),
      excerpt: queueTranslation(project.excerpt, existing?.excerpt),
      contentBlocks: project.contentBlocks.map((block, blockIndex) => {
        const existingBlock = existing?.contentBlocks?.[blockIndex]

        return {
          ...block,
          title: queueTranslation(block.title, existingBlock?.title),
          text: queueTranslation(block.text, existingBlock?.text),
          imageAlt: queueTranslation(block.imageAlt, existingBlock?.imageAlt),
          image2Alt: queueTranslation(block.image2Alt, existingBlock?.image2Alt),
        }
      }),
    }
  })
}

function queueTranslation(source, existing) {
  if (typeof source !== 'string') return source
  if (!source.trim()) return source
  if (!force && typeof existing === 'string' && existing.trim()) return existing

  const job = { source, translated: source }
  jobs.push(job)

  return {
    toJSON() {
      return job.translated
    },
  }
}

async function runTranslationJobs(translationJobs) {
  const batchSize = 80

  for (let index = 0; index < translationJobs.length; index += batchSize) {
    const batch = translationJobs.slice(index, index + batchSize)
    const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: batch.map((job) => job.source),
        source: SOURCE_LOCALE,
        target: targetLocale,
        format: 'text',
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.data?.translations) {
      throw new Error(data?.error?.message || 'Google Cloud Translation no aceptó la traducción.')
    }

    data.data.translations.forEach((item, offset) => {
      batch[offset].translated = decodeHtmlEntities(item.translatedText)
    })
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
