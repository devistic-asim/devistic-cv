import { richToText } from './richtext'
import type { CVDocument } from './types'

const STOP = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'this', 'that', 'from', 'have', 'has', 'will',
  'are', 'was', 'were', 'been', 'who', 'what', 'when', 'where', 'which', 'into', 'over', 'than',
  'then', 'they', 'them', 'their', 'about', 'after', 'before', 'such', 'using', 'use', 'used',
  'able', 'well', 'including', 'across', 'within', 'per', 'via', 'job', 'role', 'team', 'work',
  'working', 'experience', 'skills', 'skill', 'requirements', 'required', 'preferred', 'plus',
  'must', 'should', 'can', 'may', 'not', 'but', 'all', 'any', 'new', 'one', 'two', 'also', 'its',
  'his', 'her', 'she', 'him', 'out', 'more', 'most', 'other', 'some', 'just', 'like', 'make',
  'looking', 'join', 'apply', 'application', 'candidate', 'candidates', 'company', 'opportunity',
  'responsibilities', 'qualifications', 'including', 'including', 'etc', 'and', 'or',
])

export type KeywordMatch = { keyword: string; found: boolean }

export function documentText(doc: CVDocument): string {
  const content = doc.content
  const bits = [
    content.personal.fullName,
    content.personal.headline,
    content.personal.location,
    richToText(content.summary),
    ...content.experience.flatMap((item) => [
      item.role,
      item.company,
      item.location,
      richToText(item.summary),
      ...item.bullets.map((bullet) => richToText(bullet)),
    ]),
    ...content.education.flatMap((item) => [item.school, item.degree, item.field, richToText(item.details)]),
    ...content.skills.flatMap((item) => [item.name, item.group]),
    ...content.projects.flatMap((item) => [item.name, item.role, richToText(item.description)]),
    ...content.certifications.flatMap((item) => [item.name, item.issuer]),
    ...content.languages.flatMap((item) => [item.name, item.level]),
    ...content.links.map((item) => item.label),
    ...content.custom.flatMap((section) => [
      section.title,
      ...section.items.flatMap((item) => [item.title, item.subtitle, richToText(item.body)]),
    ]),
  ]
  return bits.filter(Boolean).join('\n')
}

export function matchKeywords(jobText: string, resumeText: string, limit = 24): KeywordMatch[] {
  const counts = new Map<string, number>()
  for (const word of tokenize(jobText)) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  const resume = new Set(tokenize(resumeText))
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([keyword]) => ({ keyword, found: resume.has(keyword) }))
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length >= 3 && !STOP.has(word) && !/^\d+$/.test(word))
}
