import { describe, expect, it } from 'vitest'
import { createDocument } from './defaults'
import { clearDevisticStorage, readDocuments, writeDocuments } from './storage'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

describe('local document storage', () => {
  it('round-trips CVs through a storage object', () => {
    const storage = new MemoryStorage()
    const doc = createDocument({ name: 'Ada' })
    doc.content.personal.fullName = 'Ada Lovelace'
    writeDocuments(storage, [doc])
    const loaded = readDocuments(storage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('Ada')
    expect(loaded[0].content.personal.fullName).toBe('Ada Lovelace')
    expect(loaded[0].design.template).toBe('harbor')
  })

  it('clears only Devistic keys from local and session storage', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    local.setItem('devistic-docs-v1', '[]')
    local.setItem('devistic-theme', 'dark')
    local.setItem('other-app', 'keep')
    session.setItem('devistic-job:1', 'typescript')
    clearDevisticStorage(local, session)
    expect(local.getItem('devistic-docs-v1')).toBeNull()
    expect(local.getItem('devistic-theme')).toBeNull()
    expect(local.getItem('other-app')).toBe('keep')
    expect(session.getItem('devistic-job:1')).toBeNull()
  })
})
