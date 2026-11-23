import { canonicalDate } from './dates'
import {
  blankCertification,
  blankCustomItem,
  blankCustomSection,
  blankEducation,
  blankExperience,
  blankLanguage,
  blankLink,
  blankProject,
  blankSkill,
  coerceDesign,
  emptyContent,
  STANDARD_TITLES,
} from './defaults'
import { uid } from './id'
import { escapeHtml, plainToRich } from './richtext'
import type { CVContent, CVDocument, DesignSettings, ParseResult, SectionKey } from './types'

const SECTION_RULES: { key: SectionKey; re: RegExp }[] = [
  { key: 'summary', re: /^(professional\s+)?(summary|profile|about(\s+me)?|objective|career\s+summary|personal\s+statement)$/i },
  { key: 'experience', re: /^(work\s+experience|professional\s+experience|experience|employment|work\s+history|career\s+history|relevant\s+experience)$/i },
  { key: 'education', re: /^(education|academic\s+background|academics|education\s+and\s+training)$/i },
  { key: 'skills', re: /^(skills|technical\s+skills|core\s+skills|core\s+competencies|competencies|expertise|technologies)$/i },
  { key: 'projects', re: /^(projects|selected\s+projects|personal\s+projects|key\s+projects)$/i },
  { key: 'certifications', re: /^(certifications?|certificates?|licenses?(?:\s+and\s+certifications)?|professional\s+development)$/i },
  { key: 'languages', re: /^(languages|language\s+skills)$/i },
  { key: 'links', re: /^(links|profiles|online\s+presence|web\s+presence)$/i },
]

const DATE_RANGE =
  /(?<start>(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}(?:[-/.]\d{1,2})?|\d{1,2}[-/.]\d{4})\s*(?:–|—|-|to)\s*(?<end>present|current|now|ongoing|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}(?:[-/.]\d{1,2})?|\d{1,2}[-/.]\d{4})/i

const JOB_WORD =
  /\b(engineer|designer|developer|manager|director|student|intern|consultant|analyst|lead|writer|researcher|specialist|officer|coordinator|scientist|architect|producer|editor)\b/i

export function parseResumeText(text: string): ParseResult {
  const warnings: string[] = []
  const normalized = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/[ \u00a0]+$/gm, '')
  const lines = normalized.split('\n')
  const contacts = extractContacts(normalized)
  const headingIndexes = lines
    .map((line, index) => ({ index, heading: matchHeading(line, index) }))
    .filter((item) => item.heading)

  const firstDictionary = headingIndexes.find((item) => item.heading?.kind === 'known')
  const preambleEnd = firstDictionary?.index ?? lines.length
  const content = emptyContent()
  content.personal = {
    ...content.personal,
    ...parsePreamble(lines.slice(0, preambleEnd), contacts),
  }
  content.links = contacts.profiles.map((url) => ({
    id: uid(),
    label: labelForUrl(url),
    url,
  }))

  if (!content.personal.fullName) warnings.push('No name detected. Add it in Personal details.')
  if (!content.personal.email) warnings.push('No email detected.')

  const sections = sliceSections(lines, headingIndexes.filter((item) => item.index >= preambleEnd))
  const order: CVContent['sectionOrder'] = []
  for (const section of sections) {
    if (section.key === 'custom') {
      const id = uid()
      content.custom.push({
        id,
        title: toTitle(section.title),
        items: [{ id: uid(), title: '', subtitle: '', meta: '', body: linesToRich(section.lines) }],
      })
      order.push(`custom:${id}`)
      continue
    }
    content.sectionTitles[section.key] = section.title
    order.push(section.key)
    fillSection(content, section.key, section.lines)
  }
  if (order.length) content.sectionOrder = order

  if (!content.experience.length && !content.education.length) {
    warnings.push('No experience or education entries detected. Review the import before you export.')
  }
  if (normalized.trim().length < 40) warnings.push('Very little text was found. A scanned PDF cannot be read here.')

  return { format: 'text', content, warnings }
}

export function parseResumeJson(data: unknown): ParseResult {
  if (!data || typeof data !== 'object') {
    return { format: 'unknown', content: emptyContent(), warnings: ['That file was not a JSON object.'] }
  }
  const record = data as Record<string, unknown>
  if (isDevistic(record)) {
    const document = record.document as CVDocument
    return {
      format: 'devistic',
      content: document.content,
      design: document.design,
      name: document.name,
      warnings: [],
    }
  }
  if (isJsonResume(record)) return parseJsonResume(record)
  if (isLinkedIn(record)) return parseLinkedIn(record)
  return {
    format: 'unknown',
    content: emptyContent(),
    warnings: ['JSON was not a Devistic file, JSON Resume, or a LinkedIn-style export.'],
  }
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase()
  try {
    if (name.endsWith('.json') || file.type.includes('json')) {
      const parsed = JSON.parse(await file.text()) as unknown
      return parseResumeJson(parsed)
    }
    if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      return parseResumeText(result.value || '')
    }
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      const text = await extractPdfText(await file.arrayBuffer())
      return parseResumeText(text)
    }
    return parseResumeText(await file.text())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown read error'
    return { format: 'unknown', content: emptyContent(), warnings: [`Could not read ${file.name}. ${message}`] }
  }
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const rows = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const y = Math.round(item.transform[5])
      const bucket = rows.get(y) ?? []
      bucket.push(item.str)
      rows.set(y, bucket)
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    pages.push(lines.join('\n'))
  }
  return pages.join('\n\n')
}

type Heading = { kind: 'known'; key: SectionKey } | { kind: 'custom' }

function matchHeading(line: string, index: number): Heading | null {
  const normalized = line
    .trim()
    .replace(/[:|–—-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized || normalized.length > 48) return null
  for (const rule of SECTION_RULES) {
    if (rule.re.test(normalized)) return { kind: 'known', key: rule.key }
  }
  const letters = normalized.replace(/[^A-Za-z]/g, '')
  const words = normalized.split(' ').length
  const caps = letters.length >= 4 && normalized === normalized.toUpperCase() && words <= 4
  if (caps && index > 2) return { kind: 'custom' }
  return null
}

function sliceSections(lines: string[], headings: { index: number; heading: Heading | null }[]) {
  const sections: { key: SectionKey | 'custom'; title: string; lines: string[] }[] = []
  headings.forEach((heading, position) => {
    if (!heading.heading) return
    const start = heading.index + 1
    const end = headings[position + 1]?.index ?? lines.length
    const title = lines[heading.index].trim().replace(/[:|–—-]+$/g, '').trim()
    const key = heading.heading.kind === 'known' ? heading.heading.key : 'custom'
    sections.push({ key, title, lines: lines.slice(start, end) })
  })
  return sections
}

function parsePreamble(lines: string[], contacts: Contacts) {
  const useful = lines.map((line) => line.trim()).filter(Boolean).filter((line) => !isContactLine(line))
  let fullName = ''
  let headline = ''
  let location = ''
  if (useful[0] && looksLikeName(useful[0])) {
    fullName = toTitle(useful[0])
    const next = useful[1] ?? ''
    if (next && next.length < 90 && !looksLikeName(next)) {
      if (looksLikeLocation(next) && !JOB_WORD.test(next)) location = next
      else headline = next
    }
    const loc = useful.find((line, index) => index > 0 && looksLikeLocation(line) && line !== headline)
    if (loc) location = loc
  }
  return {
    fullName,
    headline,
    location,
    email: contacts.email,
    phone: contacts.phone,
    website: contacts.website,
    photo: '',
  }
}

function looksLikeName(line: string) {
  if (JOB_WORD.test(line) || line.length > 48 || /\d|@|https?:/i.test(line)) return false
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  return words.every((word) => /^[A-Za-z][A-Za-z'’. -]{1,}$/.test(word))
}

function looksLikeLocation(line: string) {
  return line.length < 60 && /,/.test(line) && !/@|https?:/i.test(line)
}

function isContactLine(line: string) {
  return /@|https?:|www\.|\+\d/.test(line) || (line.includes('|') && /\d{3,}/.test(line))
}

type Contacts = { email: string; phone: string; website: string; profiles: string[] }

function extractContacts(text: string): Contacts {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
  let phone = ''
  const phoneRe = /(\+\d{1,3}[\s().-]*)?(?:\(?\d{2,4}\)?[\s().-]*)?\d{3,4}[\s().-]*\d{3,4}/g
  for (const match of text.matchAll(phoneRe)) {
    const digits = match[0].replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 15) {
      phone = match[0].trim()
      break
    }
  }
  const urls = new Set<string>()
  const urlRe = /(?<!@)\b((?:https?:\/\/|www\.)[^\s<>|]+|(?:[a-z0-9-]+\.)+(?:com|io|dev|me|org|net|co)(?:\/[^\s<>|]*)?)/gi
  for (const match of text.matchAll(urlRe)) {
    let url = match[1].replace(/[),.;]+$/g, '')
    if (email && url.includes(email)) continue
    if (!/^https?:/i.test(url)) url = `https://${url.replace(/^www\./i, 'www.')}`
    urls.add(url)
  }
  const list = [...urls]
  const website = list[0] ?? ''
  return { email, phone, website, profiles: list.slice(1, 6) }
}

function fillSection(content: CVContent, key: SectionKey, lines: string[]) {
  if (key === 'summary') content.summary = linesToRich(lines.filter((line) => line.trim()))
  if (key === 'experience') content.experience = parseExperience(lines)
  if (key === 'education') content.education = parseEducation(lines)
  if (key === 'skills') content.skills = parseSkills(lines)
  if (key === 'projects') content.projects = parseProjects(lines)
  if (key === 'certifications') content.certifications = parseCertifications(lines)
  if (key === 'languages') content.languages = parseLanguages(lines)
  if (key === 'links') {
    const parsed = parseLinks(lines)
    if (parsed.length) content.links = [...content.links, ...parsed]
  }
}

function parseExperience(lines: string[]) {
  return splitEntries(lines).map((entry) => {
    const item = blankExperience()
    item.bullets = []
    const dateIndex = entry.findIndex((line) => DATE_RANGE.test(line))
    const dateLine = dateIndex >= 0 ? entry[dateIndex] : ''
    const extracted = extractRange(dateLine)
    item.start = extracted.start
    item.end = extracted.end
    item.current = extracted.current
    const titleLine = (dateIndex > 0 ? entry[dateIndex - 1] : dateIndex === 0 ? stripRange(dateLine) : entry[0] ?? '').trim()
    const split = splitRole(titleLine)
    item.role = split.role
    item.company = split.company
    if (!item.location) item.location = extracted.rest
    if (!item.company && extracted.rest && !looksLikeLocation(extracted.rest)) item.company = extracted.rest
    const prose: string[] = []
    for (const line of entry) {
      if (!line.trim() || line === dateLine || line.trim() === titleLine) continue
      if (isBullet(line)) item.bullets.push(plainToRich(stripBullet(line)))
      else if (!DATE_RANGE.test(line)) prose.push(line.trim())
    }
    if (prose.length) item.summary = plainToRich(prose.join('\n'))
    return item
  }).filter((item) => item.role || item.company || item.bullets.length)
}

function parseEducation(lines: string[]) {
  return splitEntries(lines).map((entry) => {
    const item = blankEducation()
    const dateIndex = entry.findIndex((line) => DATE_RANGE.test(line))
    const extracted = extractRange(dateIndex >= 0 ? entry[dateIndex] : '')
    item.start = extracted.start
    item.end = extracted.end
    const title = (dateIndex > 0 ? entry[dateIndex - 1] : entry.find((line) => line.trim() && !DATE_RANGE.test(line)) ?? '').trim()
    const parts = title.split(/\s*[|•·]\s*|,\s*/)
    if (parts.length >= 2 && /bachelor|master|bsc|ba\b|msc|ma\b|phd|mba|diploma|degree|certificate/i.test(parts[0])) {
      item.degree = parts[0]
      item.school = parts.slice(1).join(', ')
    } else if (parts.length >= 2) {
      item.school = parts[0]
      item.degree = parts.slice(1).join(', ')
    } else {
      item.school = title
    }
    const field = entry.find((line) => line.trim() && line.trim() !== title && !DATE_RANGE.test(line) && !isBullet(line))
    if (field && !item.field) item.field = field.trim()
    return item
  }).filter((item) => item.school || item.degree)
}

function parseSkills(lines: string[]) {
  const text = lines.join('\n')
  const tokens = text
    .split(/\n|,|;|\||•|·/)
    .map((token) => token.replace(/^[-*]\s*/, '').trim())
    .filter((token) => token && token.length < 42 && !DATE_RANGE.test(token))
  return tokens.map((token) => {
    const skill = blankSkill()
    const levelMatch = token.match(/^(.*?)(?:\s+[—–-]\s+|\s*\()([^)]+)\)?$/)
    if (levelMatch) {
      skill.name = levelMatch[1].trim()
      skill.level = levelFromWord(levelMatch[2])
    } else skill.name = token
    return skill
  }).filter((skill) => skill.name)
}

function parseProjects(lines: string[]) {
  const blocks = splitBlocks(lines)
  return blocks.map((block) => {
    const item = blankProject()
    const [first, ...rest] = block
    const url = first.match(/https?:\/\/\S+/)?.[0] ?? rest.join(' ').match(/https?:\/\/\S+/)?.[0] ?? ''
    item.url = url.replace(/[),.;]+$/g, '')
    const title = first.replace(url, '').replace(/\s+[—–-]\s+.*$/, '').trim()
    item.name = title || 'Project'
    const description = [first.replace(title, '').replace(url, ''), ...rest]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[—–|-]+\s*/, '')
    item.description = description ? `<p>${escapeHtml(description)}</p>` : ''
    return item
  }).filter((item) => item.name)
}

function parseCertifications(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isHeadingNoise(line))
    .map((line) => {
      const item = blankCertification()
      const parts = line.split(/\s*,\s*|\s+[—–-]\s+/)
      item.name = parts[0] ?? line
      item.issuer = parts[1] ?? ''
      item.date = parts[2] ? canonicalDate(parts[2]) : ''
      return item
    })
}

function parseLanguages(lines: string[]) {
  return lines
    .flatMap((line) => line.split(/,|•|·/))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const item = blankLanguage()
      const match = part.match(/^(.+?)(?:\s*[—–:-]\s*|\s+\(|\s+)([A-Za-z0-9+].*?)\)?$/)
      if (match && match[2].length < 24) {
        item.name = match[1].trim()
        item.level = match[2].trim()
      } else item.name = part
      return item
    })
    .filter((item) => item.name && !DATE_RANGE.test(item.name))
}

function parseLinks(lines: string[]) {
  return lines.flatMap((line) => {
    const url = line.match(/https?:\/\/\S+|www\.\S+/i)?.[0]
    if (!url) return []
    const link = blankLink()
    link.url = url.startsWith('http') ? url : `https://${url}`
    link.label = line.replace(url, '').replace(/[|:—–-]+/g, ' ').trim() || labelForUrl(link.url)
    return [link]
  })
}

function splitEntries(lines: string[]): string[][] {
  const cleaned = trimEmptyEdges(lines)
  const dateIndexes = cleaned
    .map((line, index) => (DATE_RANGE.test(line) ? index : -1))
    .filter((index) => index >= 0)
  if (dateIndexes.length === 0) {
    const blocks = splitBlocks(cleaned)
    return blocks.length ? blocks : [cleaned]
  }
  const starts = dateIndexes.map((index) => {
    let start = index
    if (start > 0 && cleaned[start - 1].trim() && !isBullet(cleaned[start - 1]) && !DATE_RANGE.test(cleaned[start - 1])) start -= 1
    return start
  })
  const unique = [...new Set(starts)].sort((a, b) => a - b)
  return unique.map((start, position) => {
    const end = unique[position + 1] ?? cleaned.length
    return cleaned.slice(start, end)
  })
}

function splitBlocks(lines: string[]): string[][] {
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) blocks.push(current)
      current = []
    } else current.push(line.trim())
  }
  if (current.length) blocks.push(current)
  return blocks
}

function extractRange(line: string) {
  const match = line.match(DATE_RANGE)
  if (!match?.groups) return { start: '', end: '', current: false, rest: '' }
  const current = /present|current|now|ongoing/i.test(match.groups.end)
  const rest = `${line.slice(0, match.index)} ${line.slice((match.index ?? 0) + match[0].length)}`
    .replace(/[|·•,—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    start: canonicalDate(match.groups.start),
    end: current ? '' : canonicalDate(match.groups.end),
    current,
    rest,
  }
}

function stripRange(line: string) {
  return line
    .replace(DATE_RANGE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[|·•,—–-]+|[|·•,—–-]+$/g, '')
    .trim()
}

function splitRole(line: string) {
  const cleaned = stripRange(line)
  const parts = cleaned.split(/\s*(?:—|–|\||•|·)\s*|\s+-\s+|,\s+|\s+at\s+/i).map((part) => part.trim()).filter(Boolean)
  const role = parts[0] ?? ''
  const company = parts.slice(1).join(', ')
  return { role, company }
}

function levelFromWord(word: string): number {
  const value = word.toLowerCase()
  if (/expert|master|native/.test(value)) return 5
  if (/advanced|proficient|strong|fluent/.test(value)) return 4
  if (/intermediate|competent/.test(value)) return 3
  if (/working|familiar|conversational/.test(value)) return 2
  if (/beginner|basic|novice/.test(value)) return 1
  return 0
}

function isBullet(line: string) {
  return /^\s*(?:[-*•●▪]|\d+[.)])\s+/.test(line)
}

function stripBullet(line: string) {
  return line.replace(/^\s*(?:[-*•●▪]|\d+[.)])\s+/, '').trim()
}

function linesToRich(lines: string[]) {
  const bullets = lines.filter(isBullet)
  const prose = lines.map((line) => line.trim()).filter((line) => line && !isBullet(line))
  const parts: string[] = []
  if (prose.length) parts.push(`<p>${escapeHtml(prose.join(' '))}</p>`)
  if (bullets.length) parts.push(`<ul>${bullets.map((line) => `<li>${escapeHtml(stripBullet(line))}</li>`).join('')}</ul>`)
  return parts.join('')
}

function trimEmptyEdges(lines: string[]) {
  const copy = [...lines]
  while (copy.length && !copy[0].trim()) copy.shift()
  while (copy.length && !copy[copy.length - 1].trim()) copy.pop()
  return copy
}

function isHeadingNoise(line: string) {
  return line.length < 2
}

function toTitle(value: string) {
  if (value !== value.toUpperCase()) return value.trim()
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function labelForUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('github')) return 'GitHub'
    if (host.includes('linkedin')) return 'LinkedIn'
    return host
  } catch {
    return 'Link'
  }
}

function isDevistic(data: Record<string, unknown>) {
  return data.format === 'devistic-cv' && typeof data.document === 'object' && data.document !== null
}

function isJsonResume(data: Record<string, unknown>) {
  return typeof data.basics === 'object' && data.basics !== null && (Array.isArray(data.work) || Array.isArray(data.education) || Array.isArray(data.skills))
}

function isLinkedIn(data: Record<string, unknown>) {
  const profile = (data.profile ?? data) as Record<string, unknown>
  return typeof profile.firstName === 'string' || Array.isArray(data.positions) || Array.isArray(data.experience)
}

function parseJsonResume(data: Record<string, unknown>): ParseResult {
  const content = emptyContent()
  const basics = data.basics as Record<string, unknown>
  const location = basics.location as Record<string, unknown> | undefined
  content.personal.fullName = String(basics.name ?? '')
  content.personal.headline = String(basics.label ?? '')
  content.personal.email = String(basics.email ?? '')
  content.personal.phone = String(basics.phone ?? '')
  content.personal.website = String(basics.url ?? '')
  content.personal.location = [location?.city, location?.region, location?.countryCode ?? location?.country].filter(Boolean).join(', ')
  content.summary = plainToRich(String(basics.summary ?? ''))
  const profiles = Array.isArray(basics.profiles) ? basics.profiles : []
  content.links = profiles.map((profile) => {
    const item = profile as Record<string, unknown>
    const link = blankLink()
    link.label = String(item.network ?? item.label ?? 'Link')
    link.url = String(item.url ?? '')
    return link
  }).filter((link) => link.url)

  content.experience = (asArray(data.work)).map((job) => {
    const item = blankExperience()
    item.role = String(job.position ?? job.title ?? '')
    item.company = String(job.name ?? job.company ?? '')
    item.location = String(job.location ?? '')
    item.start = canonicalDate(String(job.startDate ?? ''))
    item.end = canonicalDate(String(job.endDate ?? ''))
    item.current = !job.endDate
    item.summary = plainToRich(String(job.summary ?? ''))
    item.bullets = asStrings(job.highlights).map((line) => plainToRich(line))
    return item
  })

  content.education = asArray(data.education).map((school) => {
    const item = blankEducation()
    item.school = String(school.institution ?? '')
    item.degree = String(school.studyType ?? school.degree ?? '')
    item.field = String(school.area ?? '')
    item.start = canonicalDate(String(school.startDate ?? ''))
    item.end = canonicalDate(String(school.endDate ?? ''))
    item.details = plainToRich(String(school.summary ?? asStrings(school.courses).join(', ')))
    return item
  })

  content.skills = asArray(data.skills).flatMap((skill) => {
    const keywords = asStrings(skill.keywords)
    const level = levelFromWord(String(skill.level ?? ''))
    const names = keywords.length ? keywords : [String(skill.name ?? '')]
    return names.filter(Boolean).map((name) => {
      const item = blankSkill()
      item.name = name
      item.level = level
      item.group = keywords.length ? String(skill.name ?? '') : ''
      return item
    })
  })

  content.projects = asArray(data.projects).map((project) => {
    const item = blankProject()
    item.name = String(project.name ?? '')
    item.url = String(project.url ?? '')
    item.role = asStrings(project.roles)[0] ?? ''
    item.description = plainToRich(
      [project.summary ?? project.description, ...asStrings(project.highlights)].filter(Boolean).join('\n'),
    )
    item.start = canonicalDate(String(project.startDate ?? ''))
    item.end = canonicalDate(String(project.endDate ?? ''))
    return item
  })

  content.certifications = asArray(data.certificates).map((certificate) => {
    const item = blankCertification()
    item.name = String(certificate.name ?? '')
    item.issuer = String(certificate.issuer ?? '')
    item.date = canonicalDate(String(certificate.date ?? ''))
    item.url = String(certificate.url ?? '')
    return item
  })

  content.languages = asArray(data.languages).map((language) => {
    const item = blankLanguage()
    item.name = String(language.language ?? language.name ?? '')
    item.level = String(language.fluency ?? language.level ?? '')
    return item
  })

  content.sectionTitles = { ...STANDARD_TITLES }
  addJsonResumeCustom(content, 'Volunteer', asArray(data.volunteer).map((item) => ({
    title: String(item.position ?? ''),
    subtitle: String(item.organization ?? ''),
    meta: [item.startDate, item.endDate].filter(Boolean).join(' – '),
    body: String(item.summary ?? ''),
  })))
  addJsonResumeCustom(content, 'Awards', asArray(data.awards).map((item) => ({
    title: String(item.title ?? ''),
    subtitle: String(item.awarder ?? ''),
    meta: String(item.date ?? ''),
    body: String(item.summary ?? ''),
  })))
  addJsonResumeCustom(content, 'Publications', asArray(data.publications).map((item) => ({
    title: String(item.name ?? ''),
    subtitle: String(item.publisher ?? ''),
    meta: String(item.releaseDate ?? ''),
    body: String(item.summary ?? ''),
  })))

  const devistic = readDevisticMeta(data.meta)
  return {
    format: 'json-resume',
    content,
    design: devistic.design,
    name: devistic.name,
    warnings: content.personal.fullName ? [] : ['JSON Resume had no basics.name.'],
  }
}

function addJsonResumeCustom(
  content: CVContent,
  title: string,
  items: { title: string; subtitle: string; meta: string; body: string }[],
) {
  const filled = items.filter((item) => item.title || item.subtitle || item.body)
  if (!filled.length) return
  const section = blankCustomSection(title)
  section.items = filled.map((item) => {
    const entry = blankCustomItem()
    entry.title = item.title
    entry.subtitle = item.subtitle
    entry.meta = item.meta
    entry.body = plainToRich(item.body)
    return entry
  })
  content.custom.push(section)
  content.sectionOrder.push(`custom:${section.id}`)
}

function readDevisticMeta(meta: unknown): { name?: string; design?: DesignSettings } {
  if (!meta || typeof meta !== 'object') return {}
  const devistic = (meta as Record<string, unknown>).devistic
  if (!devistic || typeof devistic !== 'object') return {}
  const record = devistic as Record<string, unknown>
  return {
    name: typeof record.name === 'string' ? record.name : undefined,
    design: record.design && typeof record.design === 'object' ? coerceDesign(record.design as DesignSettings) : undefined,
  }
}

function parseLinkedIn(data: Record<string, unknown>): ParseResult {
  const content = emptyContent()
  const profile = ((data.profile as Record<string, unknown> | undefined) ?? data) as Record<string, unknown>
  const first = String(profile.firstName ?? '')
  const last = String(profile.lastName ?? '')
  content.personal.fullName = [first, last].filter(Boolean).join(' ') || String(profile.fullName ?? '')
  content.personal.headline = String(profile.headline ?? '')
  content.personal.email = String(profile.email ?? data.emailAddress ?? '')
  content.personal.location = String(profile.geoLocationName ?? profile.location ?? '')
  content.summary = plainToRich(String(profile.summary ?? profile.about ?? ''))
  const positions = asArray(data.positions ?? data.experience)
  content.experience = positions.map((job) => {
    const item = blankExperience()
    item.role = String(job.title ?? job.role ?? '')
    item.company = String(job.companyName ?? job.company ?? '')
    item.location = String(job.location ?? job.locationName ?? '')
    item.start = canonicalDate(String(job.startDate ?? job.start ?? ''))
    item.end = canonicalDate(String(job.endDate ?? job.end ?? ''))
    item.current = !job.endDate && !job.end
    item.summary = plainToRich(String(job.description ?? job.summary ?? ''))
    return item
  })
  content.education = asArray(data.education ?? data.educations).map((school) => {
    const item = blankEducation()
    item.school = String(school.schoolName ?? school.school ?? school.institution ?? '')
    item.degree = String(school.degreeName ?? school.degree ?? '')
    item.field = String(school.fieldOfStudy ?? school.field ?? '')
    item.start = canonicalDate(String(school.startDate ?? ''))
    item.end = canonicalDate(String(school.endDate ?? ''))
    return item
  })
  const skills = data.skills
  if (Array.isArray(skills)) {
    content.skills = skills.map((skill) => {
      const item = blankSkill()
      item.name = typeof skill === 'string' ? skill : String((skill as Record<string, unknown>).name ?? '')
      return item
    }).filter((skill) => skill.name)
  }
  return {
    format: 'linkedin',
    content,
    warnings: ['LinkedIn-style JSON was mapped with a fixed set of fields. Review dates and descriptions.'],
  }
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : []
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
}

export function devisticPayload(document: CVDocument) {
  return { format: 'devistic-cv' as const, version: 1 as const, document }
}
