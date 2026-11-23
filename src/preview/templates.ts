import type { SectionKey, TemplateId } from '../lib/types'

export type TemplateMeta = {
  id: TemplateId
  name: string
  description: string
  ats: 'High' | 'Medium'
  columns: 1 | 2
  tone: 'plain' | 'rule' | 'timeline' | 'serif' | 'navy-side' | 'paper-side' | 'band' | 'split'
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Single column, quiet rules, no ornaments. The safest file to upload to a portal.',
    ats: 'High',
    columns: 1,
    tone: 'plain',
  },
  {
    id: 'harbor',
    name: 'Harbor',
    description: 'Single column with a short accent rule. Optional photo stays out of the reading order.',
    ats: 'High',
    columns: 1,
    tone: 'rule',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Dates sit in a gutter so a reader can scan years without losing the story.',
    ats: 'High',
    columns: 1,
    tone: 'timeline',
  },
  {
    id: 'parchment',
    name: 'Parchment',
    description: 'Centered name and serif headings. Still one column when the file is parsed.',
    ats: 'High',
    columns: 1,
    tone: 'serif',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    description: 'Navy sidebar for contact and skills. The roles stay in a wide main column.',
    ats: 'Medium',
    columns: 2,
    tone: 'navy-side',
  },
  {
    id: 'nimbus',
    name: 'Nimbus',
    description: 'Light sidebar, photo in the header, and more air between sections.',
    ats: 'Medium',
    columns: 2,
    tone: 'paper-side',
  },
  {
    id: 'forge',
    name: 'Forge',
    description: 'A navy header band, then skills beside the roles.',
    ats: 'Medium',
    columns: 2,
    tone: 'band',
  },
  {
    id: 'quartz',
    name: 'Quartz',
    description: 'Compact header. Education and skills sit in a right-hand column.',
    ats: 'Medium',
    columns: 2,
    tone: 'split',
  },
]

export function templateMeta(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[1]
}

const SIDE: Partial<Record<TemplateId, SectionKey[]>> = {
  meridian: ['skills', 'languages', 'certifications', 'links'],
  nimbus: ['skills', 'languages', 'certifications', 'links'],
  forge: ['skills', 'languages', 'certifications', 'links'],
  quartz: ['education', 'skills', 'languages', 'certifications', 'links'],
}

export function sideKeys(id: TemplateId): SectionKey[] {
  return SIDE[id] ?? []
}

export function pageMetrics(pageSize: 'a4' | 'letter', marginMm: number) {
  const spec =
    pageSize === 'a4'
      ? { wmm: 210, hmm: 297, pxW: 794, pxH: 1123 }
      : { wmm: 215.9, hmm: 279.4, pxW: 816, pxH: 1056 }
  const pad = (marginMm / 25.4) * 96
  const sideOuter = spec.pxW * 0.34
  const sidePad = Math.max(16, pad * 0.72)
  return {
    ...spec,
    pad,
    sidePad,
    sideOuter,
    singleInner: spec.pxW - pad * 2,
    sideInner: sideOuter - sidePad * 2,
    mainInner: spec.pxW - sideOuter - pad * 2,
  }
}
