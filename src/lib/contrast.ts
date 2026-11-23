function channel(c: number) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split('')
      .map((ch) => ch + ch)
      .join('')}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`
  return null
}

export function luminance(hex: string): number {
  const n = normalizeHex(hex)
  if (!n) return 0
  const value = parseInt(n.slice(1), 16)
  const r = channel((value >> 16) & 255)
  const g = channel((value >> 8) & 255)
  const b = channel(value & 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Decorative accent may be any brand color. Use this when the accent is a line or fill that must stay visible. */
export function visibleAccent(accent: string, background: string): string {
  if (contrast(accent, background) >= 3) return accent
  if (contrast('#3bc1e6', background) >= 3) return '#3bc1e6'
  return contrast('#1e293b', background) >= 3 ? '#1e293b' : '#f5f9fc'
}

export function accentOrNavy(accent: string, background = '#ffffff'): string {
  return contrast(accent, background) >= 3 ? accent : '#1e293b'
}
