export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'links'

export type SectionId = SectionKey | `custom:${string}`

export type RichText = string

export type PersonalInfo = {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  website: string
  photo: string
}

export type ExperienceItem = {
  id: string
  role: string
  company: string
  location: string
  start: string
  end: string
  current: boolean
  summary: RichText
  bullets: RichText[]
}

export type EducationItem = {
  id: string
  school: string
  degree: string
  field: string
  location: string
  start: string
  end: string
  details: RichText
}

export type SkillItem = {
  id: string
  name: string
  level: number
  group: string
}

export type ProjectItem = {
  id: string
  name: string
  url: string
  role: string
  start: string
  end: string
  description: RichText
}

export type CertificationItem = {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export type LanguageItem = {
  id: string
  name: string
  level: string
}

export type LinkItem = {
  id: string
  label: string
  url: string
}

export type CustomItem = {
  id: string
  title: string
  subtitle: string
  meta: string
  body: RichText
}

export type CustomSection = {
  id: string
  title: string
  items: CustomItem[]
}

export type CVContent = {
  personal: PersonalInfo
  summary: RichText
  sectionOrder: SectionId[]
  sectionTitles: Partial<Record<string, string>>
  hiddenSections: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: SkillItem[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
  links: LinkItem[]
  custom: CustomSection[]
}

export type TemplateId =
  | 'atlas'
  | 'harbor'
  | 'ledger'
  | 'parchment'
  | 'meridian'
  | 'nimbus'
  | 'forge'
  | 'quartz'

export type FontId = 'source-sans' | 'ibm-plex' | 'outfit' | 'source-serif' | 'libre'

export type DateFormat = 'MMM yyyy' | 'MMMM yyyy' | 'MM/yyyy' | 'yyyy-MM'

export type PhotoShape = 'round' | 'rounded' | 'square'

export type DesignSettings = {
  template: TemplateId
  accent: string
  font: FontId
  fontSize: number
  lineHeight: number
  spacing: number
  margin: number
  photoShape: PhotoShape
  showPhoto: boolean
  showSkillLevels: boolean
  dateFormat: DateFormat
  pageSize: 'a4' | 'letter'
  sidebar: 'left' | 'right'
}

export type CVDocument = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  content: CVContent
  design: DesignSettings
}

export type ParseFormat = 'text' | 'json-resume' | 'linkedin' | 'devistic' | 'unknown'

export type ParseResult = {
  format: ParseFormat
  content: CVContent
  design?: DesignSettings
  name?: string
  warnings: string[]
}
