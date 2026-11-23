import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { autoArrange, contentUnits, fitDesign, packBlocks, pickTemplate, recommendedOrder } from './autoLayout'
import { emptyContent } from './defaults'
import { parseResumeText } from './parser'
import type { CVContent } from './types'

const sampleText = readFileSync(new URL('../../public/examples/sample-resume.txt', import.meta.url), 'utf8')

describe('packBlocks', () => {
  it('moves a block onto the next page when it does not fit', () => {
    expect(packBlocks([10, 10, 10], 25)).toEqual([[0, 1], [2]])
  })

  it('keeps an oversized block on its own page', () => {
    expect(packBlocks([40, 10], 25)).toEqual([[0], [1]])
  })
})

describe('autoArrange', () => {
  const parsed = parseResumeText(sampleText)
  const arranged = autoArrange(parsed.content, { targetPages: 1, preferAts: true })

  it('standardizes names, drops duplicate skills, and sorts nothing out of order', () => {
    expect(arranged.content.sectionTitles.experience).toBe('Experience')
    expect(arranged.content.skills.filter((skill) => skill.name.toLowerCase() === 'react')).toHaveLength(1)
    expect(arranged.content.experience[0].company).toBe('Northwind')
    expect(arranged.content.experience[0].start).toBe('2021-01')
    expect(arranged.design.dateFormat).toBe('MMM yyyy')
    expect(arranged.design.showPhoto).toBe(false)
    expect(arranged.design.template).toBe('harbor')
    expect(arranged.notes.some((note) => note.includes('React') || note.toLowerCase().includes('duplicate'))).toBe(true)
  })

  it('renames a synonym heading and puts education first for a junior', () => {
    const content = parseResumeText('JUNIOR DEV\nJunior engineer\n\nWORK HISTORY\nJunior engineer, Lab\n2024 - Present\n- Built a tool used by 3 people\n\nEDUCATION\nBSc Physics, State College\n2020 - 2024\n').content
    const result = autoArrange(content, { roleHint: 'Junior engineer', preferAts: true })
    expect(result.notes.some((note) => /work history/i.test(note) && /Experience/.test(note))).toBe(true)
    expect(result.content.sectionOrder.indexOf('education')).toBeLessThan(result.content.sectionOrder.indexOf('experience'))
  })

  it('picks a photo template when a portrait is present and ATS is not requested', () => {
    const content = structuredClone(parsed.content) as CVContent
    content.personal.photo = 'data:image/svg+xml,abc'
    expect(pickTemplate(content, { preferAts: false })).toBe('meridian')
    expect(pickTemplate({ ...content, personal: { ...content.personal, headline: 'Brand designer' } }, {})).toBe('nimbus')
    expect(pickTemplate({ ...content, personal: { ...content.personal, photo: '', headline: 'Legal researcher' } }, {})).toBe('parchment')
  })

  it('tightens type when the content cannot sit on one page', () => {
    const content = emptyContent()
    content.personal.fullName = 'Ada Example'
    content.personal.headline = 'Engineer'
    content.summary = `<p>${'word '.repeat(80)}</p>`
    content.sectionOrder = ['summary', 'experience']
    content.experience = Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      role: 'Engineer',
      company: `Company ${index}`,
      location: 'Remote',
      start: `201${index}-01`,
      end: index === 0 ? '' : `201${index}-12`,
      current: index === 0,
      summary: '',
      bullets: Array.from({ length: 6 }, () => '<p>Built a service that reduced latency by 20% for the checkout team.</p>'),
    }))
    const fitted = fitDesign(content, arranged.design, 1)
    expect(fitted.design.fontSize).toBeLessThan(1)
    expect(fitted.note.toLowerCase()).toMatch(/two pages|tightened/)
    expect(contentUnits(content)).toBeGreaterThan(70)
  })

  it('opens spacing when there is very little to say', () => {
    const content = emptyContent()
    content.personal.fullName = 'Ada Example'
    content.summary = '<p>Engineer who writes short, useful notes for operators.</p>'
    content.sectionOrder = ['summary']
    const fitted = fitDesign(content, arranged.design, 1)
    expect(fitted.design.fontSize).toBeGreaterThan(1)
    expect(recommendedOrder(content)[0]).toBe('summary')
  })
})
