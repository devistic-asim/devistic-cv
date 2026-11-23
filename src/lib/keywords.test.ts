import { describe, expect, it } from 'vitest'
import { createDocument } from './defaults'
import { documentText, matchKeywords } from './keywords'

describe('matchKeywords', () => {
  it('marks words from a job post that already appear in the CV', () => {
    const doc = createDocument()
    doc.content.personal.headline = 'Product engineer'
    doc.content.summary = '<p>Ships TypeScript and React design systems.</p>'
    doc.content.experience = [
      {
        id: '1',
        role: 'Senior Product Engineer',
        company: 'Northwind',
        location: 'Berlin',
        start: '2021-01',
        end: '',
        current: true,
        summary: '',
        bullets: ['<p>Reduced failed payments by 18%.</p>'],
      },
    ]
    const job = 'We need a TypeScript engineer who has shipped React design systems and reduced failed payments. Kubernetes experience is a plus.'
    const matches = matchKeywords(job, documentText(doc))
    const byWord = Object.fromEntries(matches.map((item) => [item.keyword, item.found]))
    expect(byWord.typescript).toBe(true)
    expect(byWord.react).toBe(true)
    expect(byWord.payments).toBe(true)
    expect(byWord.kubernetes).toBe(false)
    expect(byWord.the).toBeUndefined()
  })
})
