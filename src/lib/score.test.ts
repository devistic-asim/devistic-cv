import { describe, expect, it } from 'vitest'
import { createDocument, emptyContent } from './defaults'
import { scoreCv } from './score'

describe('scoreCv', () => {
  it('flags a blank CV', () => {
    const result = scoreCv(createDocument())
    const byId = Object.fromEntries(result.checks.map((check) => [check.id, check]))
    expect(byId.name.severity).toBe('error')
    expect(byId.email.severity).toBe('error')
    expect(byId.summary.severity).toBe('error')
    expect(result.score).toBeLessThan(50)
  })

  it('rewards metrics, verbs, and contact details', () => {
    const content = emptyContent()
    content.personal = {
      fullName: 'Jordan Hale',
      headline: 'Product Engineer',
      email: 'jordan.hale@example.com',
      phone: '+49 151 23456789',
      location: 'Berlin, Germany',
      website: 'https://jordan.example.com',
      photo: '',
    }
    content.summary =
      '<p>Engineer who ships billing and design-system work for product teams. Ten years of turning fuzzy operational problems into a smaller, faster path that other squads can reuse.</p>'
    content.experience = [
      {
        id: '1',
        role: 'Senior Product Engineer',
        company: 'Northwind',
        location: 'Berlin',
        start: '2021-01',
        end: '',
        current: true,
        summary: '',
        bullets: [
          '<p>Led the redesign of billing and reduced failed payments by 18%.</p>',
          '<p>Built a design system used by 14 squads.</p>',
        ],
      },
    ]
    content.education = [{ id: 'e', school: 'TU Berlin', degree: 'BSc', field: 'Computer Science', location: '', start: '2014', end: '2018', details: '' }]
    content.skills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Accessibility'].map((name, index) => ({
      id: String(index),
      name,
      level: 0,
      group: '',
    }))
    const result = scoreCv(createDocument({ content }))
    const byId = Object.fromEntries(result.checks.map((check) => [check.id, check]))
    expect(byId.metrics.severity).toBe('pass')
    expect(byId.verbs.severity).toBe('pass')
    expect(byId.email.severity).toBe('pass')
    expect(byId.columns.severity).toBe('pass')
    expect(result.score).toBeGreaterThan(80)
  })

  it('warns on a long bullet without a number', () => {
    const content = emptyContent()
    content.personal.fullName = 'Jordan Hale'
    content.personal.email = 'jordan.hale@example.com'
    content.summary = '<p>Engineer who ships billing and design-system work for product teams across several markets and keeps the operational details honest.</p>'
    content.experience = [
      {
        id: '1',
        role: 'Engineer',
        company: 'Northwind',
        location: '',
        start: '2020-01',
        end: '2021-01',
        current: false,
        summary: '',
        bullets: ['<p>Responsible for helping the team with various tasks around the platform whenever someone needed an extra pair of hands on the project.</p>'],
      },
    ]
    const result = scoreCv(createDocument({ content }))
    const byId = Object.fromEntries(result.checks.map((check) => [check.id, check]))
    expect(byId.metrics.severity).toBe('warn')
    expect(byId.verbs.severity).toBe('warn')
    expect(byId.bullets.severity).toBe('warn')
  })
})
