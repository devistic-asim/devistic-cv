import { canonicalDate, dateSortValue } from './dates'
import { defaultDesign, STANDARD_TITLES } from './defaults'
import { richToText, wordCount } from './richtext'
import type { CVContent, DesignSettings, SectionId, SectionKey, TemplateId } from './types'

export type AutoOptions = {
  targetPages?: 1 | 2
  preferAts?: boolean
  roleHint?: string
  pageSize?: 'a4' | 'letter'
}

const TWO_COLUMN = new Set<TemplateId>(['meridian', 'nimbus', 'forge', 'quartz'])

const TITLE_SYNONYM: Record<SectionKey, RegExp> = {
  summary: /summary|profile|about|objective|statement/i,
  experience: /experience|employment|history/i,
  education: /education|academic/i,
  skills: /skill|competenc|expertise|technolog/i,
  projects: /project/i,
  certifications: /certif|licen[cs]e|development/i,
  languages: /language/i,
  links: /link|profile|presence/i,
}

const FIT_STEPS: Pick<DesignSettings, 'fontSize' | 'spacing' | 'margin' | 'lineHeight'>[] = [
  { fontSize: 1.06, spacing: 1.12, margin: 16, lineHeight: 1.42 },
  { fontSize: 1, spacing: 1, margin: 14, lineHeight: 1.35 },
  { fontSize: 0.96, spacing: 0.94, margin: 13, lineHeight: 1.32 },
  { fontSize: 0.92, spacing: 0.88, margin: 12, lineHeight: 1.28 },
  { fontSize: 0.88, spacing: 0.82, margin: 11, lineHeight: 1.25 },
]

export function packBlocks(heights: number[], pageInner: number, firstInner = pageInner): number[][] {
  if (!heights.length) return [[]]
  const pages: number[][] = []
  let current: number[] = []
  let used = 0
  let limit = firstInner
  heights.forEach((height, index) => {
    const block = Math.max(height, 1)
    if (current.length > 0 && used + block > limit + 0.5) {
      pages.push(current)
      current = []
      used = 0
      limit = pageInner
    }
    current.push(index)
    used += block
  })
  if (current.length) pages.push(current)
  return pages
}

export function contentUnits(content: CVContent): number {
  let units = 5
  if (!hidden(content, 'summary')) {
    const words = wordCount(richToText(content.summary))
    if (words) units += Math.max(2, words / 16)
  }
  if (!hidden(content, 'experience')) {
    for (const job of content.experience) {
      if (!job.role && !job.company) continue
      units += 2.2
      units += job.bullets.map(richToText).filter(Boolean).length * 1.15
      units += wordCount(richToText(job.summary)) / 28
    }
  }
  if (!hidden(content, 'education')) units += content.education.filter((item) => item.school || item.degree).length * 2
  if (!hidden(content, 'skills')) {
    const count = content.skills.filter((skill) => skill.name.trim()).length
    if (count) units += Math.ceil(count / 3) * 0.9
  }
  if (!hidden(content, 'projects')) units += content.projects.filter((item) => item.name.trim()).length * 2.4
  if (!hidden(content, 'certifications')) units += content.certifications.filter((item) => item.name.trim()).length * 1.1
  if (!hidden(content, 'languages')) units += content.languages.filter((item) => item.name.trim()).length * 0.45
  if (!hidden(content, 'links')) units += content.links.filter((item) => item.url.trim()).length * 0.35
  for (const section of content.custom) {
    if (hidden(content, `custom:${section.id}`)) continue
    units += 1.5 + section.items.length * 1.6
  }
  return units
}

export function pageCapacity(design: DesignSettings): number {
  const base = design.pageSize === 'letter' ? 40 : 46
  const columns = TWO_COLUMN.has(design.template) ? 1.15 : 1
  const margin = design.margin <= 12 ? 1.08 : design.margin >= 16 ? 0.92 : 1
  return base * (1 / design.fontSize) * (1 / design.spacing) * margin * columns * (1.35 / design.lineHeight)
}

export function fitDesign(content: CVContent, design: DesignSettings, targetPages: 1 | 2): { design: DesignSettings; note: string } {
  const units = contentUnits(content)
  const standardCapacity = pageCapacity({ ...design, ...FIT_STEPS[1] }) * targetPages
  const start = units < standardCapacity * 0.62 ? 0 : 1
  const chosen =
    FIT_STEPS.slice(start).find((step) => units <= pageCapacity({ ...design, ...step }) * targetPages) ??
    FIT_STEPS[FIT_STEPS.length - 1]
  const next = { ...design, ...chosen }
  const fits = units <= pageCapacity(next) * targetPages
  if (!fits && targetPages === 1) {
    return { design: next, note: 'Content still prefers two pages. Cut a bullet or allow a second page.' }
  }
  if (!fits) return { design: next, note: 'This is dense even across two pages. Shorten older roles.' }
  if (chosen === FIT_STEPS[0]) return { design: next, note: 'Content is short, so spacing is a little more open.' }
  if (chosen.fontSize < 1) return { design: next, note: `Type and spacing were tightened to aim for ${targetPages} page${targetPages === 1 ? '' : 's'}.` }
  return { design: next, note: `Layout targets ${targetPages} page${targetPages === 1 ? '' : 's'} at the standard size.` }
}

export function pickTemplate(content: CVContent, options: AutoOptions = {}): TemplateId {
  const role = `${options.roleHint ?? ''} ${content.personal.headline}`.toLowerCase()
  const creative = /design|brand|market|writer|content|photograph/.test(role)
  const formal = /law|legal|research|account|financ|analyst|professor|academic/.test(role)
  if (options.preferAts || !content.personal.photo) return formal ? 'parchment' : 'harbor'
  if (creative) return 'nimbus'
  if (formal) return 'quartz'
  return 'meridian'
}

export function isEarlyCareer(content: CVContent, roleHint = ''): boolean {
  const text = `${roleHint} ${content.personal.headline}`.toLowerCase()
  return /student|intern|graduate|junior/.test(text) && content.experience.length <= 2
}

export function recommendedOrder(content: CVContent, roleHint = ''): SectionId[] {
  const preferred: SectionKey[] = isEarlyCareer(content, roleHint)
    ? ['summary', 'education', 'projects', 'experience', 'skills', 'certifications', 'languages', 'links']
    : ['summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'languages', 'links']
  const ordered: SectionId[] = []
  for (const key of preferred) {
    if (content.sectionOrder.includes(key) || sectionHasContent(content, key)) ordered.push(key)
  }
  for (const key of content.sectionOrder) {
    if (!ordered.includes(key)) ordered.push(key)
  }
  for (const section of content.custom) {
    const id = `custom:${section.id}` as const
    if (!ordered.includes(id)) ordered.push(id)
  }
  return ordered
}

export function autoArrange(content: CVContent, options: AutoOptions = {}): { content: CVContent; design: DesignSettings; notes: string[] } {
  const next = structuredClone(content)
  const notes: string[] = []
  const targetPages = options.targetPages ?? 1

  dedupeSkills(next, notes)
  dedupeLinks(next, notes)
  dedupeExperience(next, notes)
  dedupeEducation(next, notes)
  normalizeDates(next)
  next.experience = [...next.experience].sort(
    (a, b) => dateSortValue(b.end || b.start, b.current) - dateSortValue(a.end || a.start, a.current),
  )
  standardizeTitles(next, notes)
  next.sectionOrder = recommendedOrder(next, options.roleHint ?? '')

  const design = defaultDesign()
  design.pageSize = options.pageSize ?? 'a4'
  design.dateFormat = 'MMM yyyy'
  design.template = pickTemplate(next, options)
  applyTemplateDefaults(design)
  design.showPhoto = Boolean(next.personal.photo) && !options.preferAts
  if (options.preferAts && next.personal.photo) {
    notes.push('Photo hidden because you asked for an ATS-first layout. You can turn it back on in Design.')
  }
  if (isEarlyCareer(next, options.roleHint ?? '')) {
    notes.push('Education is placed before experience because the headline reads as early-career.')
  }
  notes.push('Dates display as Mon YYYY. Change the format in Design if you prefer another style.')

  const fitted = fitDesign(next, design, targetPages)
  notes.push(fitted.note)
  notes.push(`Template set to ${label(fitted.design.template)}.`)
  return { content: next, design: fitted.design, notes }
}

function dedupeSkills(content: CVContent, notes: string[]) {
  const map = new Map<string, (typeof content.skills)[number]>()
  for (const skill of content.skills) {
    const key = skill.name.trim().toLowerCase()
    if (!key) continue
    const existing = map.get(key)
    if (!existing) map.set(key, { ...skill, name: skill.name.trim() })
    else if (skill.level > existing.level) existing.level = skill.level
  }
  if (map.size !== content.skills.filter((skill) => skill.name.trim()).length) {
    notes.push('Merged duplicate skills, keeping the higher level.')
  }
  content.skills = [...map.values()]
}

function dedupeLinks(content: CVContent, notes: string[]) {
  const seen = new Set<string>()
  const links = content.links.filter((link) => {
    const key = link.url.trim().replace(/\/+$/, '').toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (links.length !== content.links.length) notes.push('Removed duplicate links.')
  content.links = links
}

function dedupeExperience(content: CVContent, notes: string[]) {
  const seen = new Set<string>()
  const items = content.experience.filter((item) => {
    const key = `${item.role.trim().toLowerCase()}|${item.company.trim().toLowerCase()}|${canonicalDate(item.start)}`
    if (!item.role.trim() && !item.company.trim()) return false
    if (seen.has(key)) return false
    seen.add(key)
    item.bullets = item.bullets.map((bullet) => bullet.trim()).filter((bullet) => richToText(bullet))
    return true
  })
  if (items.length !== content.experience.filter((item) => item.role || item.company).length) notes.push('Removed duplicate roles.')
  content.experience = items
}

function dedupeEducation(content: CVContent, notes: string[]) {
  const seen = new Set<string>()
  const items = content.education.filter((item) => {
    const key = `${item.school.trim().toLowerCase()}|${item.degree.trim().toLowerCase()}`
    if (!item.school.trim() && !item.degree.trim()) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (items.length !== content.education.filter((item) => item.school || item.degree).length) notes.push('Removed duplicate education entries.')
  content.education = items
}

function normalizeDates(content: CVContent) {
  for (const item of content.experience) {
    item.start = canonicalDate(item.start)
    item.end = item.current ? '' : canonicalDate(item.end)
  }
  for (const item of content.education) {
    item.start = canonicalDate(item.start)
    item.end = canonicalDate(item.end)
  }
  for (const item of content.projects) {
    item.start = canonicalDate(item.start)
    item.end = canonicalDate(item.end)
  }
  for (const item of content.certifications) item.date = canonicalDate(item.date)
}

function standardizeTitles(content: CVContent, notes: string[]) {
  for (const key of Object.keys(STANDARD_TITLES) as SectionKey[]) {
    const current = content.sectionTitles[key]?.trim()
    if (!current) {
      content.sectionTitles[key] = STANDARD_TITLES[key]
      continue
    }
    const standard = STANDARD_TITLES[key]
    if (current.toLowerCase() === standard.toLowerCase()) {
      content.sectionTitles[key] = standard
      continue
    }
    if (TITLE_SYNONYM[key].test(current)) {
      notes.push(`Renamed “${current}” to “${standard}”.`)
      content.sectionTitles[key] = standard
    }
  }
}

function applyTemplateDefaults(design: DesignSettings) {
  const defaults: Record<TemplateId, Partial<DesignSettings>> = {
    atlas: { font: 'source-sans', accent: '#1e293b', sidebar: 'left' },
    harbor: { font: 'source-sans', accent: '#20b683', sidebar: 'left' },
    ledger: { font: 'source-sans', accent: '#1e293b', sidebar: 'left' },
    parchment: { font: 'source-serif', accent: '#1e293b', photoShape: 'round' },
    meridian: { font: 'source-sans', accent: '#20b683', sidebar: 'left', photoShape: 'round' },
    nimbus: { font: 'outfit', accent: '#0e7490', sidebar: 'right', photoShape: 'rounded' },
    forge: { font: 'outfit', accent: '#20b683', sidebar: 'left', photoShape: 'round' },
    quartz: { font: 'ibm-plex', accent: '#1e293b', sidebar: 'right', photoShape: 'square' },
  }
  Object.assign(design, defaults[design.template])
}

function sectionHasContent(content: CVContent, key: SectionKey): boolean {
  if (key === 'summary') return Boolean(richToText(content.summary))
  if (key === 'experience') return content.experience.some((item) => item.role || item.company)
  if (key === 'education') return content.education.some((item) => item.school || item.degree)
  if (key === 'skills') return content.skills.some((item) => item.name.trim())
  if (key === 'projects') return content.projects.some((item) => item.name.trim())
  if (key === 'certifications') return content.certifications.some((item) => item.name.trim())
  if (key === 'languages') return content.languages.some((item) => item.name.trim())
  return content.links.some((item) => item.url.trim())
}

function hidden(content: CVContent, key: string) {
  return content.hiddenSections.includes(key)
}

function label(template: TemplateId) {
  return template.slice(0, 1).toUpperCase() + template.slice(1)
}
