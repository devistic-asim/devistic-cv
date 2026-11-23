import { richToText } from './richtext'
import { GITHUB_REPO } from './site'
import type { CVContent, CVDocument, CustomItem, SkillItem } from './types'

const LEVEL_WORDS = ['', 'Beginner', 'Working', 'Intermediate', 'Advanced', 'Expert']

export function toJsonResume(doc: CVDocument) {
  const { content } = doc
  const photo = content.personal.photo
  return {
    $schema: 'https://jsonresume.org/schema',
    basics: {
      name: content.personal.fullName,
      label: content.personal.headline,
      image: photo.startsWith('http') ? photo : undefined,
      email: content.personal.email,
      phone: content.personal.phone,
      url: content.personal.website,
      summary: richToText(content.summary),
      location: splitLocation(content.personal.location),
      profiles: content.links
        .filter((link) => link.url.trim())
        .map((link) => ({ network: link.label || 'Link', url: link.url })),
    },
    work: content.experience
      .filter((item) => item.role || item.company)
      .map((item) => ({
        name: item.company,
        position: item.role,
        location: item.location || undefined,
        startDate: item.start || undefined,
        endDate: item.current ? undefined : item.end || undefined,
        summary: richToText(item.summary),
        highlights: item.bullets.map((bullet) => richToText(bullet)).filter(Boolean),
      })),
    volunteer: customEntries(content, /volunteer/i).map((item) => ({
      organization: item.subtitle,
      position: item.title,
      startDate: item.meta || undefined,
      summary: richToText(item.body),
    })),
    education: content.education
      .filter((item) => item.school || item.degree || item.field)
      .map((item) => ({
        institution: item.school,
        area: item.field,
        studyType: item.degree,
        location: item.location || undefined,
        startDate: item.start || undefined,
        endDate: item.end || undefined,
        summary: richToText(item.details),
      })),
    awards: customEntries(content, /award/i).map((item) => ({
      title: item.title,
      awarder: item.subtitle,
      date: item.meta || undefined,
      summary: richToText(item.body),
    })),
    certificates: content.certifications
      .filter((item) => item.name)
      .map((item) => ({
        name: item.name,
        issuer: item.issuer,
        date: item.date || undefined,
        url: item.url || undefined,
      })),
    publications: customEntries(content, /publication|paper|talk/i).map((item) => ({
      name: item.title,
      publisher: item.subtitle || undefined,
      releaseDate: item.meta || undefined,
      summary: richToText(item.body),
    })),
    skills: skillsToJson(content.skills),
    languages: content.languages
      .filter((item) => item.name)
      .map((item) => ({ language: item.name, fluency: item.level })),
    projects: content.projects
      .filter((item) => item.name)
      .map((item) => {
        const summary = richToText(item.description)
        return {
          name: item.name,
          summary,
          description: summary,
          url: item.url || undefined,
          roles: item.role ? [item.role] : [],
          startDate: item.start || undefined,
          endDate: item.end || undefined,
        }
      }),
    meta: {
      canonical: GITHUB_REPO,
      version: '1.0.0',
      lastModified: new Date(doc.updatedAt).toISOString(),
      devistic: {
        name: doc.name,
        design: doc.design,
      },
    },
  }
}

function skillsToJson(skills: SkillItem[]) {
  const groups = new Map<string, { level: number; keywords: string[] }>()
  const loose: { name: string; level?: string; keywords: string[] }[] = []
  for (const skill of skills) {
    const name = skill.name.trim()
    if (!name) continue
    const group = skill.group.trim()
    if (group) {
      const bucket = groups.get(group) ?? { level: 0, keywords: [] }
      bucket.keywords.push(name)
      bucket.level = Math.max(bucket.level, skill.level)
      groups.set(group, bucket)
    } else {
      loose.push({
        name,
        level: LEVEL_WORDS[skill.level] || undefined,
        keywords: [],
      })
    }
  }
  return [
    ...[...groups.entries()].map(([name, bucket]) => ({
      name,
      level: LEVEL_WORDS[bucket.level] || undefined,
      keywords: bucket.keywords,
    })),
    ...loose,
  ]
}

function customEntries(content: CVContent, pattern: RegExp): CustomItem[] {
  return content.custom
    .filter((section) => pattern.test(section.title))
    .flatMap((section) => section.items.filter((item) => item.title || item.subtitle || item.body))
}

function splitLocation(value: string) {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return undefined
  if (parts.length === 1) return { city: parts[0] }
  const last = parts[parts.length - 1]
  const city = parts[0]
  const region = parts.length > 2 ? parts.slice(1, -1).join(', ') : undefined
  if (/^[A-Za-z]{2}$/.test(last)) {
    return { city, ...(region ? { region } : {}), countryCode: last.toUpperCase() }
  }
  return { city, ...(region ? { region } : {}), country: last }
}
