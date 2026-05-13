export const DRAMADLE_DRAMA_REVEAL = {
  id: 'dramadle-drama',
  name: 'DRAMA',
  slug: '',
  year: null,
  tags: [],
  coverImage: 'https://res.cloudinary.com/dsqre3rmd/image/upload/v1778639662/Logo_con_fondo_bzjd6l.webp',
} as const

export function isDramadleDramaReveal(projectId: string) {
  return projectId === DRAMADLE_DRAMA_REVEAL.id
}
