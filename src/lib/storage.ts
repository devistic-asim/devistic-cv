import { coerceContent, coerceDesign } from './defaults'
import type { CVDocument } from './types'

export const DOCS_KEY = 'devistic-docs-v1'

export function readDocuments(storage: Storage): CVDocument[] {
  try {
    const raw = storage.getItem(DOCS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => {
      const doc = item as CVDocument
      return {
        ...doc,
        content: coerceContent(doc.content),
        design: coerceDesign(doc.design),
      }
    })
  } catch {
    return []
  }
}

export function writeDocuments(storage: Storage, docs: CVDocument[]) {
  storage.setItem(DOCS_KEY, JSON.stringify(docs))
}

export function devisticKeys(storage: Storage) {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith('devistic')) keys.push(key)
  }
  return keys
}

export function clearDevisticStorage(local: Storage, session: Storage) {
  devisticKeys(local).forEach((key) => local.removeItem(key))
  devisticKeys(session).forEach((key) => session.removeItem(key))
}
