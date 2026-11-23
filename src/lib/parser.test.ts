import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { richToText } from './richtext'
import { parseResumeJson, parseResumeText } from './parser'

const sampleText = readFileSync(new URL('../../public/examples/sample-resume.txt', import.meta.url), 'utf8')
const sampleJson = JSON.parse(readFileSync(new URL('../../public/examples/sample-json-resume.json', import.meta.url), 'utf8'))

describe('parseResumeText', () => {
  const result = parseResumeText(sampleText)

  it('detects the person and contact line', () => {
    expect(result.content.personal.fullName).toBe('Jordan Hale')
    expect(result.content.personal.headline).toBe('Product Engineer')
    expect(result.content.personal.email).toBe('jordan.hale@example.com')
    expect(result.content.personal.phone).toContain('+49')
    expect(result.content.personal.location).toBe('Berlin, Germany')
    expect(result.content.personal.website).toContain('jordan.example.com')
  })

  it('splits known sections and entries', () => {
    expect(richToText(result.content.summary)).toMatch(/billing/)
    expect(result.content.experience).toHaveLength(2)
    expect(result.content.experience[0].role).toBe('Senior Product Engineer')
    expect(result.content.experience[0].company).toBe('Northwind')
    expect(result.content.experience[0].current).toBe(true)
    expect(result.content.experience[0].location).toBe('Berlin')
    expect(richToText(result.content.experience[0].bullets[0])).toMatch(/18%/)
    expect(result.content.experience[1].company).toBe('Lumen Lab')
    expect(result.content.education[0].degree).toMatch(/BSc/)
    expect(result.content.education[0].school).toMatch(/Berlin/)
    expect(result.content.skills.map((skill) => skill.name)).toContain('TypeScript')
    expect(result.content.projects[0].name).toBe('Harbor UI')
    expect(result.content.certifications[0].issuer).toBe('Amazon')
    expect(result.content.languages.map((language) => language.name)).toEqual(['English', 'German'])
    expect(result.content.languages[0].level).toBe('Native')
  })

  it('maps a work-history heading onto experience', () => {
    const parsed = parseResumeText('ADA LOVELACE\nAnalyst\n\nWORK HISTORY\nAnalyst, Analytical Engines\n1843 - 1844\n- Wrote notes on the engine\n')
    expect(parsed.content.sectionTitles.experience).toMatch(/work history/i)
    expect(parsed.content.experience[0].company).toMatch(/Analytical/)
  })
})

describe('parseResumeJson', () => {
  it('reads JSON Resume', () => {
    const result = parseResumeJson(sampleJson)
    expect(result.format).toBe('json-resume')
    expect(result.content.personal.fullName).toBe('Jordan Hale')
    expect(result.content.personal.location).toContain('Berlin')
    expect(result.content.experience[0].role).toBe('Senior Product Engineer')
    expect(result.content.skills.map((skill) => skill.name)).toEqual(['TypeScript', 'React'])
    expect(result.content.skills[0].level).toBe(4)
    expect(result.content.links[0].label).toBe('GitHub')
  })

  it('reads a LinkedIn-style export', () => {
    const result = parseResumeJson({
      profile: { firstName: 'Jordan', lastName: 'Hale', headline: 'Product Engineer', geoLocationName: 'Berlin, Germany' },
      positions: [{ title: 'Senior Product Engineer', companyName: 'Northwind', startDate: '2021-01', description: 'Led billing.' }],
      skills: ['TypeScript', 'React'],
    })
    expect(result.format).toBe('linkedin')
    expect(result.content.personal.fullName).toBe('Jordan Hale')
    expect(result.content.experience[0].company).toBe('Northwind')
    expect(result.content.skills).toHaveLength(2)
  })

  it('returns a devistic document untouched', () => {
    const result = parseResumeJson({
      format: 'devistic-cv',
      version: 1,
      document: { name: 'Mine', content: { personal: { fullName: 'Kept' } }, design: { template: 'atlas' } },
    })
    expect(result.format).toBe('devistic')
    expect(result.name).toBe('Mine')
    expect(result.design?.template).toBe('atlas')
  })
})
