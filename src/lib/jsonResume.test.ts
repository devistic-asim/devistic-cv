import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDocument } from './defaults'
import { toJsonResume } from './jsonResume'
import { parseResumeJson } from './parser'

const sampleJson = JSON.parse(readFileSync(new URL('../../public/examples/sample-json-resume.json', import.meta.url), 'utf8'))

describe('toJsonResume', () => {
  it('exports JSON Resume and imports it back', () => {
    const parsed = parseResumeJson(sampleJson)
    const doc = createDocument({
      name: 'Jordan Hale',
      content: parsed.content,
    })
    doc.design.template = 'ledger'
    doc.content.custom = [
      {
        id: 'vol',
        title: 'Volunteer',
        items: [{ id: 'v1', title: 'Mentor', subtitle: 'Code Club', meta: '2020', body: '<p>Taught weekly.</p>' }],
      },
    ]
    const exported = toJsonResume(doc)
    expect(exported.$schema).toContain('jsonresume.org')
    expect(exported.basics.name).toBe('Jordan Hale')
    expect(exported.basics.location?.city).toBe('Berlin')
    expect(exported.work[0].highlights?.[0]).toMatch(/18%/)
    expect(exported.work[0].endDate).toBeUndefined()
    expect(exported.skills[0].keywords).toEqual(['TypeScript', 'React'])
    expect(exported.volunteer[0].organization).toBe('Code Club')
    expect(exported.basics.image).toBeUndefined()
    expect(exported.meta.devistic.design.template).toBe('ledger')

    const again = parseResumeJson(exported)
    expect(again.format).toBe('json-resume')
    expect(again.name).toBe('Jordan Hale')
    expect(again.design?.template).toBe('ledger')
    expect(again.content.personal.fullName).toBe('Jordan Hale')
    expect(again.content.experience[0].role).toBe('Senior Product Engineer')
    expect(again.content.experience[0].current).toBe(true)
    expect(again.content.skills.map((skill) => skill.name)).toEqual(['TypeScript', 'React'])
    expect(again.content.custom.some((section) => section.title === 'Volunteer')).toBe(true)
  })
})
