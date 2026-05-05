import type { BudgetDraft } from './types'

const DRAFT_PREFIX = 'drama:draft:'
const GENERATED_PREFIX = 'drama:generated:'

function readByPrefix(prefix: string) {
  if (typeof window === 'undefined') return []

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      try {
        return JSON.parse(window.localStorage.getItem(key) || '') as BudgetDraft
      } catch {
        return null
      }
    })
    .filter((item): item is BudgetDraft => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const budgetStorage = {
  drafts: () => readByPrefix(DRAFT_PREFIX),
  generated: () => readByPrefix(GENERATED_PREFIX),
  saveDraft: (draft: BudgetDraft) => {
    window.localStorage.setItem(`${DRAFT_PREFIX}${draft.id}`, JSON.stringify({ ...draft, status: 'draft' }))
  },
  saveGenerated: (draft: BudgetDraft) => {
    window.localStorage.setItem(`${GENERATED_PREFIX}${draft.id}`, JSON.stringify({ ...draft, status: 'generated' }))
  },
  removeDraft: (id: string) => window.localStorage.removeItem(`${DRAFT_PREFIX}${id}`),
  removeGenerated: (id: string) => window.localStorage.removeItem(`${GENERATED_PREFIX}${id}`),
}

export function makeId(prefix = 'budget') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function sanitizePdfFilename(value: string) {
  return value.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()
}
