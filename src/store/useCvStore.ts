import { get, set } from 'idb-keyval'
import { create } from 'zustand'
import { autoArrange, type AutoOptions } from '../lib/autoLayout'
import { coerceContent, coerceDesign, createDocument } from '../lib/defaults'
import type { CVContent, CVDocument, DesignSettings } from '../lib/types'
import type { ParseResult } from '../lib/types'
import { pushToast } from './toast'

const KEY = 'devistic-docs-v1'

type Snapshot = { id: string; content: CVContent; design: DesignSettings }

type CvState = {
  ready: boolean
  docs: CVDocument[]
  past: Snapshot[]
  future: Snapshot[]
  saveState: 'saved' | 'saving'
  load: () => Promise<void>
  create: (doc?: CVDocument) => string
  duplicate: (id: string) => string | null
  remove: (id: string) => void
  rename: (id: string, name: string) => void
  update: (id: string, recipe: (doc: CVDocument) => void, key?: string) => void
  undo: (id: string) => void
  redo: (id: string) => void
  importParsed: (result: ParseResult, options?: AutoOptions) => { id: string; notes: string[] }
}

let timer = 0
let coalesce = { key: '', at: 0, id: '' }

function queueSave() {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    const docs = useCvStore.getState().docs
    void set(KEY, docs)
      .then(() => useCvStore.setState({ saveState: 'saved' }))
      .catch(() => {
        useCvStore.setState({ saveState: 'saved' })
        pushToast('Could not save on this device. Free some browser storage and try again.', 'warn')
      })
  }, 280)
}

function normalize(doc: CVDocument): CVDocument {
  return {
    ...doc,
    content: coerceContent(doc.content),
    design: coerceDesign(doc.design),
  }
}

export const useCvStore = create<CvState>((setState, getState) => ({
  ready: false,
  docs: [],
  past: [],
  future: [],
  saveState: 'saved',
  load: async () => {
    try {
      const stored = (await get(KEY)) as CVDocument[] | undefined
      setState({ docs: (stored ?? []).map(normalize), ready: true, saveState: 'saved' })
    } catch {
      setState({ ready: true })
      pushToast('Saved CVs could not be read from this browser.', 'warn')
    }
  },
  create: (doc) => {
    const next = doc ?? createDocument()
    setState((state) => ({ docs: [next, ...state.docs], saveState: 'saving' }))
    queueSave()
    return next.id
  },
  duplicate: (id) => {
    const source = getState().docs.find((doc) => doc.id === id)
    if (!source) return null
    const copy = createDocument({
      name: `${source.name} copy`,
      content: structuredClone(source.content),
      design: structuredClone(source.design),
    })
    setState((state) => ({ docs: [copy, ...state.docs], saveState: 'saving' }))
    queueSave()
    return copy.id
  },
  remove: (id) => {
    setState((state) => ({
      docs: state.docs.filter((doc) => doc.id !== id),
      past: state.past.filter((snap) => snap.id !== id),
      future: state.future.filter((snap) => snap.id !== id),
      saveState: 'saving',
    }))
    queueSave()
  },
  rename: (id, name) => {
    setState((state) => ({
      docs: state.docs.map((doc) => (doc.id === id ? { ...doc, name: name.trim() || 'Untitled CV', updatedAt: Date.now() } : doc)),
      saveState: 'saving',
    }))
    queueSave()
  },
  update: (id, recipe, key = 'edit') => {
    setState((state) => {
      const doc = state.docs.find((item) => item.id === id)
      if (!doc) return state
      const now = Date.now()
      const discrete = key === 'discrete' || key !== coalesce.key || id !== coalesce.id || now - coalesce.at > 700
      if (discrete) coalesce = { key, at: now, id }
      else coalesce.at = now
      const next = structuredClone(doc)
      recipe(next)
      next.updatedAt = Date.now()
      return {
        docs: state.docs.map((item) => (item.id === id ? next : item)),
        past: discrete ? [...state.past, { id, content: doc.content, design: doc.design }].slice(-40) : state.past,
        future: discrete ? [] : state.future,
        saveState: 'saving',
      }
    })
    queueSave()
  },
  undo: (id) => {
    setState((state) => {
      const snap = state.past[state.past.length - 1]
      const doc = state.docs.find((item) => item.id === id)
      if (!snap || snap.id !== id || !doc) return state
      const restored = structuredClone(doc)
      restored.content = snap.content
      restored.design = snap.design
      restored.updatedAt = Date.now()
      return {
        docs: state.docs.map((item) => (item.id === id ? restored : item)),
        past: state.past.slice(0, -1),
        future: [{ id, content: doc.content, design: doc.design }, ...state.future].slice(0, 40),
        saveState: 'saving',
      }
    })
    queueSave()
  },
  redo: (id) => {
    setState((state) => {
      const snap = state.future[0]
      const doc = state.docs.find((item) => item.id === id)
      if (!snap || snap.id !== id || !doc) return state
      const restored = structuredClone(doc)
      restored.content = snap.content
      restored.design = snap.design
      restored.updatedAt = Date.now()
      return {
        docs: state.docs.map((item) => (item.id === id ? restored : item)),
        past: [...state.past, { id, content: doc.content, design: doc.design }].slice(-40),
        future: state.future.slice(1),
        saveState: 'saving',
      }
    })
    queueSave()
  },
  importParsed: (result, options) => {
    if (result.format === 'devistic') {
      const doc = createDocument({
        name: result.name || 'Imported CV',
        content: coerceContent(result.content),
        design: coerceDesign(result.design),
      })
      setState((state) => ({ docs: [doc, ...state.docs], saveState: 'saving' }))
      queueSave()
      return { id: doc.id, notes: result.warnings }
    }
    const arranged = autoArrange(coerceContent(result.content), {
      targetPages: options?.targetPages ?? 1,
      preferAts: options?.preferAts ?? !result.content.personal.photo,
      roleHint: options?.roleHint || result.content.personal.headline,
      pageSize: options?.pageSize,
    })
    const doc = createDocument({
      name: result.content.personal.fullName ? `${result.content.personal.fullName}` : 'Imported CV',
      content: arranged.content,
      design: arranged.design,
    })
    setState((state) => ({ docs: [doc, ...state.docs], saveState: 'saving' }))
    queueSave()
    return { id: doc.id, notes: [...result.warnings, ...arranged.notes] }
  },
}))
