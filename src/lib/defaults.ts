import { uid } from './id'
import type {
  CVContent,
  CVDocument,
  CertificationItem,
  CustomItem,
  CustomSection,
  DesignSettings,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LinkItem,
  ProjectItem,
  SectionId,
  SectionKey,
  SkillItem,
} from './types'

export const SECTION_KEYS: SectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'links',
]

export const STANDARD_TITLES: Record<SectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  links: 'Links',
}

export const DEFAULT_ORDER: SectionId[] = [...SECTION_KEYS]

export function emptyContent(): CVContent {
  return {
    personal: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      photo: '',
    },
    summary: '',
    sectionOrder: [...DEFAULT_ORDER],
    sectionTitles: {},
    hiddenSections: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    links: [],
    custom: [],
  }
}

export function defaultDesign(): DesignSettings {
  return {
    template: 'harbor',
    accent: '#20b683',
    font: 'source-sans',
    fontSize: 1,
    lineHeight: 1.35,
    spacing: 1,
    margin: 14,
    photoShape: 'round',
    showPhoto: false,
    showSkillLevels: true,
    dateFormat: 'MMM yyyy',
    pageSize: 'a4',
    sidebar: 'left',
  }
}

export function coerceContent(input: Partial<CVContent> | undefined): CVContent {
  const base = emptyContent()
  if (!input) return base
  return {
    ...base,
    ...input,
    personal: { ...base.personal, ...input.personal },
    sectionOrder: input.sectionOrder?.length ? input.sectionOrder : base.sectionOrder,
    sectionTitles: input.sectionTitles ?? {},
    hiddenSections: input.hiddenSections ?? [],
    experience: input.experience ?? [],
    education: input.education ?? [],
    skills: input.skills ?? [],
    projects: input.projects ?? [],
    certifications: input.certifications ?? [],
    languages: input.languages ?? [],
    links: input.links ?? [],
    custom: input.custom ?? [],
  }
}

export function coerceDesign(input: Partial<DesignSettings> | undefined): DesignSettings {
  return { ...defaultDesign(), ...input }
}

export function createDocument(partial?: { name?: string; content?: CVContent; design?: DesignSettings }): CVDocument {
  const now = Date.now()
  return {
    id: uid(),
    name: partial?.name?.trim() || 'Untitled CV',
    createdAt: now,
    updatedAt: now,
    content: partial?.content ?? emptyContent(),
    design: partial?.design ?? defaultDesign(),
  }
}

export function blankExperience(): ExperienceItem {
  return { id: uid(), role: '', company: '', location: '', start: '', end: '', current: false, summary: '', bullets: [''] }
}

export function blankEducation(): EducationItem {
  return { id: uid(), school: '', degree: '', field: '', location: '', start: '', end: '', details: '' }
}

export function blankSkill(): SkillItem {
  return { id: uid(), name: '', level: 0, group: '' }
}

export function blankProject(): ProjectItem {
  return { id: uid(), name: '', url: '', role: '', start: '', end: '', description: '' }
}

export function blankCertification(): CertificationItem {
  return { id: uid(), name: '', issuer: '', date: '', url: '' }
}

export function blankLanguage(): LanguageItem {
  return { id: uid(), name: '', level: '' }
}

export function blankLink(): LinkItem {
  return { id: uid(), label: '', url: '' }
}

export function blankCustomItem(): CustomItem {
  return { id: uid(), title: '', subtitle: '', meta: '', body: '' }
}

export function blankCustomSection(title = 'Additional'): CustomSection {
  return { id: uid(), title, items: [blankCustomItem()] }
}

export const LEVEL_LABELS = ['', 'Familiar', 'Working', 'Intermediate', 'Advanced', 'Expert']

export const LANGUAGE_LEVELS = ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic']

export const FONT_OPTIONS = [
  { id: 'source-sans', label: 'Source Sans', stack: '"Source Sans 3", "Segoe UI", sans-serif' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', stack: '"IBM Plex Sans", "Segoe UI", sans-serif' },
  { id: 'outfit', label: 'Outfit', stack: '"Outfit", "Avenir Next", sans-serif' },
  { id: 'source-serif', label: 'Source Serif', stack: '"Source Serif 4", Georgia, serif' },
  { id: 'libre', label: 'Libre Baskerville', stack: '"Libre Baskerville", Georgia, serif' },
] as const

export function fontStack(id: string): string {
  return FONT_OPTIONS.find((font) => font.id === id)?.stack ?? FONT_OPTIONS[0].stack
}

export const ACCENT_PRESETS = [
  { id: 'green', label: 'Green', value: '#20b683' },
  { id: 'navy', label: 'Navy', value: '#1e293b' },
  { id: 'cyan', label: 'Cyan', value: '#3bc1e6' },
  { id: 'slate', label: 'Slate', value: '#637285' },
]

export function sectionLabel(content: CVContent, id: string): string {
  if (id.startsWith('custom:')) {
    const custom = content.custom.find((section) => section.id === id.slice(7))
    return custom?.title || 'Custom section'
  }
  return content.sectionTitles[id] || STANDARD_TITLES[id as SectionKey] || 'Section'
}
