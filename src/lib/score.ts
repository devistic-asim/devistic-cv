import { dateSortValue, parseLooseDate } from './dates'
import { STANDARD_TITLES } from './defaults'
import { ACTION_VERBS } from './tips'
import { richToText, wordCount } from './richtext'
import type { CVDocument, ExperienceItem } from './types'

export type Severity = 'error' | 'warn' | 'info' | 'pass'

export type Check = {
  id: string
  severity: Severity
  title: string
  detail: string
  section?: string
  earned: number
  max: number
}

const VERB_SET = new Set(ACTION_VERBS)
const TWO_COLUMN = new Set(['meridian', 'nimbus', 'forge', 'quartz'])

export function scoreCv(doc: CVDocument): { score: number; checks: Check[] } {
  const { content, design } = doc
  const checks: Check[] = []
  const personal = content.personal

  checks.push(
    personal.fullName.trim()
      ? pass('name', 'Name is present', 'The header has a name a reader can scan.', 'personal', 8)
      : fail('name', 'Add your name', 'The CV needs a name in personal details.', 'personal', 8),
  )

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())
  checks.push(
    emailOk
      ? pass('email', 'Email looks usable', personal.email.trim(), 'personal', 8)
      : fail('email', 'Add a valid email', 'Include one address with an @ and a domain.', 'personal', 8),
  )

  checks.push(
    personal.phone.trim()
      ? pass('phone', 'Phone is present', personal.phone.trim(), 'personal', 4)
      : warn('phone', 'Phone is missing', 'Add a phone number unless you have a reason to leave it off.', 'personal', 4),
  )

  checks.push(
    personal.location.trim()
      ? pass('location', 'Location is present', personal.location.trim(), 'personal', 3)
      : info('location', 'Location is blank', 'City and country help a reader place you. They are optional.', 'personal', 3),
  )

  checks.push(
    personal.headline.trim()
      ? pass('headline', 'Headline is present', personal.headline.trim(), 'personal', 4)
      : warn('headline', 'Add a headline', 'A short role line under your name gives the page a point.', 'personal', 4),
  )

  const summaryWords = wordCount(richToText(content.summary))
  if (!summaryWords) {
    checks.push(fail('summary', 'Summary is empty', 'Write 40–80 words on what you do and one proof.', 'summary', 10))
  } else if (summaryWords < 25) {
    checks.push(warn('summary', 'Summary is short', `${summaryWords} words. Add who you help and one concrete result.`, 'summary', 10))
  } else if (summaryWords > 100) {
    checks.push(warn('summary', 'Summary is long', `${summaryWords} words. Trim toward 40–80 so the roles start higher on the page.`, 'summary', 10))
  } else if (summaryWords >= 40 && summaryWords <= 80) {
    checks.push(pass('summary', 'Summary length is in range', `${summaryWords} words.`, 'summary', 10))
  } else {
    checks.push({
      id: 'summary',
      severity: 'pass',
      title: 'Summary is readable',
      detail: `${summaryWords} words. 40–80 is the tightest range.`,
      section: 'summary',
      earned: 8,
      max: 10,
    })
  }

  const jobs = content.experience.filter((job) => job.role.trim() || job.company.trim())
  const schools = content.education.filter((item) => item.school.trim() || item.degree.trim())
  if (!jobs.length && !schools.length) {
    checks.push(fail('experience', 'Add experience or education', 'A CV needs at least one role or one school.', 'experience', 10))
  } else if (!jobs.length) {
    checks.push(info('experience', 'No work experience yet', 'Education is carrying the page. Add projects if you have them.', 'experience', 6))
  } else {
    checks.push(pass('experience', `${jobs.length} role${jobs.length === 1 ? '' : 's'} listed`, 'Newest work should sit first.', 'experience', 10))
  }

  checks.push(bulletQuality(jobs))
  checks.push(metricCheck(jobs))
  checks.push(verbCheck(jobs))

  checks.push(
    schools.length
      ? pass('education', 'Education is listed', schools.map((s) => s.school || s.degree).filter(Boolean).join(', '), 'education', 6)
      : warn('education', 'Education is missing', 'Add a school even if the degree is in progress or informal.', 'education', 6),
  )

  const skills = content.skills.filter((skill) => skill.name.trim())
  if (skills.length >= 5) checks.push(pass('skills', `${skills.length} skills listed`, 'Enough to scan, not a dump of every tool.', 'skills', 6))
  else if (skills.length > 0) checks.push(warn('skills', 'Skills list is thin', `${skills.length} listed. Five relevant skills is a useful floor.`, 'skills', 6))
  else checks.push(warn('skills', 'No skills yet', 'Add the tools and practices you want to be hired for.', 'skills', 6))

  const dupes = duplicateSkills(skills.map((skill) => skill.name))
  checks.push(
    dupes.length
      ? warn('skill-dupes', 'Duplicate skills', `Repeated: ${dupes.join(', ')}. Auto-arrange can merge them.`, 'skills', 3)
      : pass('skill-dupes', 'Skills are unique', 'No repeated names.', 'skills', 3),
  )

  checks.push(dateCheck(doc))

  const oddTitles = Object.entries(content.sectionTitles).filter(([key, title]) => {
    const standard = STANDARD_TITLES[key as keyof typeof STANDARD_TITLES]
    return standard && title && title.trim().toLowerCase() !== standard.toLowerCase()
  })
  checks.push(
    oddTitles.length
      ? info(
          'titles',
          'Custom section names',
          oddTitles.map(([, title]) => title).join(', ') + '. Standard names parse more reliably.',
          'summary',
          2,
        )
      : pass('titles', 'Section names are standard', 'Summary, Experience, Education, and the rest use familiar headings.', 'summary', 2),
  )

  if (design.showPhoto && personal.photo) {
    checks.push(
      info(
        'photo',
        'Photo is on the page',
        TWO_COLUMN.has(design.template)
          ? 'Fine for a person reading the PDF. Turn it off for portals that reject photos.'
          : 'A photo on a single-column CV is still optional. Many portals prefer none.',
        'personal',
        2,
      ),
    )
  } else {
    checks.push(pass('photo', 'No photo on the page', 'A strong default when you do not know who reads the file first.', 'personal', 2))
  }

  if (TWO_COLUMN.has(design.template)) {
    checks.push(
      warn(
        'columns',
        'Two-column template',
        `${templateName(design.template)} looks modern and can confuse older applicant tracking systems. Atlas or Harbor keep a single reading order.`,
        'design',
        4,
      ),
    )
  } else {
    checks.push(pass('columns', 'Single-column template', `${templateName(design.template)} keeps one reading order.`, 'design', 4))
  }

  if (!personal.website.trim() && content.links.filter((link) => link.url.trim()).length === 0) {
    checks.push(info('links', 'No public link', 'Add a portfolio, writing sample, or code profile if the role expects one.', 'links', 2))
  } else {
    checks.push(pass('links', 'A link is available', 'Readers can leave the PDF and see the work.', 'links', 2))
  }

  const earned = checks.reduce((sum, check) => sum + check.earned, 0)
  const max = checks.reduce((sum, check) => sum + check.max, 0)
  const score = max === 0 ? 0 : Math.round((earned / max) * 100)
  return { score, checks }
}

function bulletQuality(jobs: ExperienceItem[]): Check {
  const bullets = jobs.flatMap((job) => job.bullets.map(richToText).filter(Boolean))
  if (!jobs.length) return info('bullets', 'No bullets to review', 'Add roles before tuning the lines.', 'experience', 4)
  if (!bullets.length) return warn('bullets', 'Roles have no bullets', 'Add two or three lines under each role.', 'experience', 8)
  const long = bullets.filter((bullet) => wordCount(bullet) > 28)
  const thinJobs = jobs.filter((job) => job.bullets.map(richToText).filter(Boolean).length < 2)
  if (long.length) {
    return warn('bullets', `${long.length} bullet${long.length === 1 ? '' : 's'} run long`, 'Keep each line under about 25 words and one achievement.', 'experience', 8)
  }
  if (thinJobs.length) {
    return warn('bullets', 'Some roles have a single line', 'Two or three bullets give a role enough weight.', 'experience', 8)
  }
  return pass('bullets', 'Bullets are a readable length', `${bullets.length} lines, none over 28 words.`, 'experience', 8)
}

function metricCheck(jobs: ExperienceItem[]): Check {
  const bullets = jobs.flatMap((job) => job.bullets.map(richToText).filter(Boolean))
  const withNumber = bullets.filter((bullet) => /\d/.test(bullet))
  if (!bullets.length) return info('metrics', 'No bullets to measure', 'Add a number when you have one: people, time, money, or percent.', 'experience', 4)
  if (withNumber.length === 0) {
    return warn('metrics', 'No numbers in the bullets', 'Add a metric where it is true: time saved, revenue, users, or error rate.', 'experience', 8)
  }
  if (withNumber.length < 2) {
    return info('metrics', 'Only one bullet has a number', 'A second metric makes the pattern look deliberate.', 'experience', 6)
  }
  return pass('metrics', 'Bullets include metrics', `${withNumber.length} lines contain a number.`, 'experience', 8)
}

function verbCheck(jobs: ExperienceItem[]): Check {
  const bullets = jobs.flatMap((job) => job.bullets.map(richToText).filter(Boolean))
  if (!bullets.length) return info('verbs', 'No bullets to check', 'Start each line with a verb such as Led, Built, or Reduced.', 'experience', 4)
  const weak = bullets.filter((bullet) => {
    const first = bullet.replace(/^[^A-Za-z]+/, '').split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    if (!first) return true
    if (['responsible', 'tasked', 'helped', 'worked', 'duties', 'various'].includes(first)) return true
    return !VERB_SET.has(first)
  })
  if (weak.length === 0) return pass('verbs', 'Bullets start with action verbs', 'The lines lead with a verb.', 'experience', 6)
  return warn('verbs', `${weak.length} bullet${weak.length === 1 ? '' : 's'} start softly`, 'Open with Led, Built, Shipped, Reduced, Designed, or a verb from the example list.', 'experience', 6)
}

function dateCheck(doc: CVDocument): Check {
  const values = [
    ...doc.content.experience.flatMap((item) => [item.start, item.current ? '' : item.end]),
    ...doc.content.education.flatMap((item) => [item.start, item.end]),
  ].filter(Boolean)
  if (!values.length) return info('dates', 'No dates yet', 'Add a start month or year on each role.', 'experience', 2)
  const bad = values.filter((value) => !parseLooseDate(value).iso && !/^\d{4}$/.test(value.trim()))
  if (bad.length) return warn('dates', 'Some dates did not parse', `Check: ${bad.slice(0, 3).join(', ')}. Use YYYY-MM or a month name.`, 'experience', 4)
  const jobs = doc.content.experience.filter((job) => job.start || job.current)
  const sorted = [...jobs].sort((a, b) => dateSortValue(b.end || b.start, b.current) - dateSortValue(a.end || a.start, a.current))
  const inOrder = jobs.every((job, index) => job.id === sorted[index]?.id)
  if (!inOrder) return info('dates', 'Roles are not in date order', 'Auto-arrange will put the newest role first.', 'experience', 3)
  return pass('dates', 'Dates are consistent', `Displayed as ${doc.design.dateFormat}.`, 'experience', 4)
}

function duplicateSkills(names: string[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const name of names) {
    const key = name.trim().toLowerCase()
    if (!key) continue
    if (seen.has(key)) dupes.add(name.trim())
    seen.add(key)
  }
  return [...dupes]
}

function templateName(id: string) {
  return id.slice(0, 1).toUpperCase() + id.slice(1)
}

function pass(id: string, title: string, detail: string, section: string, max: number): Check {
  return { id, severity: 'pass', title, detail, section, earned: max, max }
}

function fail(id: string, title: string, detail: string, section: string, max: number): Check {
  return { id, severity: 'error', title, detail, section, earned: 0, max }
}

function warn(id: string, title: string, detail: string, section: string, max: number): Check {
  return { id, severity: 'warn', title, detail, section, earned: Math.round(max * 0.35), max }
}

function info(id: string, title: string, detail: string, section: string, max: number): Check {
  return { id, severity: 'info', title, detail, section, earned: Math.round(max * 0.7), max }
}
