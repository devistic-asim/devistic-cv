import type { DateFormat } from './types'

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export type ParsedDate = { iso: string; precision: 'month' | 'year' | 'unknown' }

export function parseLooseDate(input: string): ParsedDate {
  const raw = input.trim().replace(/,/g, ' ').replace(/\s+/g, ' ')
  if (!raw || /^(present|current|now|ongoing)$/i.test(raw)) return { iso: '', precision: 'unknown' }

  let match = raw.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/)
  if (match) {
    const month = Number(match[2])
    if (month >= 1 && month <= 12) return { iso: `${match[1]}-${pad(month)}`, precision: 'month' }
  }

  match = raw.match(/^(\d{4})$/)
  if (match) return { iso: match[1], precision: 'year' }

  match = raw.match(/^(\d{1,2})[-/.](\d{4})$/)
  if (match) {
    const month = Number(match[1])
    if (month >= 1 && month <= 12) return { iso: `${match[2]}-${pad(month)}`, precision: 'month' }
  }

  match = raw.match(/^([A-Za-z]+)\.?\s+(\d{4})$/)
  if (match) {
    const month = MONTHS[match[1].toLowerCase()]
    if (month) return { iso: `${match[2]}-${pad(month)}`, precision: 'month' }
  }

  return { iso: '', precision: 'unknown' }
}

export function formatIso(iso: string, format: DateFormat): string {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(iso)
  if (!match) return iso
  const year = match[1]
  const month = match[2] ? Number(match[2]) : 0
  if (!month) return year
  const mm = pad(month)
  if (format === 'yyyy-MM') return `${year}-${mm}`
  if (format === 'MM/yyyy') return `${mm}/${year}`
  if (format === 'MMMM yyyy') return `${FULL[month - 1]} ${year}`
  return `${SHORT[month - 1]} ${year}`
}

export function prettyDate(value: string, format: DateFormat): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const parsed = parseLooseDate(trimmed)
  if (!parsed.iso) return trimmed
  return formatIso(parsed.iso, format)
}

export function formatRange(start: string, end: string, current: boolean, format: DateFormat): string {
  const left = prettyDate(start, format)
  const right = current ? 'Present' : prettyDate(end, format)
  if (left && right) return `${left} – ${right}`
  return left || right
}

export function canonicalDate(value: string): string {
  const parsed = parseLooseDate(value)
  return parsed.iso || value.trim()
}

export function dateSortValue(value: string, current = false): number {
  if (current) return 999999
  const parsed = parseLooseDate(value)
  if (!parsed.iso) return -1
  if (parsed.precision === 'year') return Number(parsed.iso) * 100
  return Number(parsed.iso.replace('-', ''))
}

function pad(month: number) {
  return String(month).padStart(2, '0')
}
