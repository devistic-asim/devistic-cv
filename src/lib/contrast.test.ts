import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast } from './contrast'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

function block(selector: string) {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`Missing ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const vars: Record<string, string> = {}
  for (const match of css.slice(open, close).matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[match[1]] = match[2].toLowerCase()
  }
  return vars
}

const light = block(':root')
const dark = { ...light, ...block('[data-theme="dark"]') }

describe('design tokens', () => {
  it('keeps the official palette in the stylesheet', () => {
    const source = css.toLowerCase()
    for (const hex of ['#1e293b', '#637285', '#f5f9fc', '#20b683', '#3bc1e6', '#ffeb5b', '#0b1220']) {
      expect(source).toContain(hex)
    }
    expect(light['--primary-foreground']).toBe('#0b1220')
    expect(light['--highlight-ink']).toBe('#1e293b')
    expect(dark['--bg']).toBe('#0b1220')
    expect(dark['--text']).toBe('#f5f9fc')
  })

  it('meets WCAG contrast for text, controls, and borders', () => {
    const pairs: [Record<string, string>, [string, string, number][]][] = [
      [
        light,
        [
          ['--text', '--bg', 4.5],
          ['--text', '--surface', 4.5],
          ['--text-secondary', '--bg', 4.5],
          ['--text-secondary', '--surface', 4.5],
          ['--primary-foreground', '--primary', 4.5],
          ['--primary-foreground', '--primary-hover', 4.5],
          ['--highlight-ink', '--highlight', 4.5],
          ['--accent-ink', '--surface', 4.5],
          ['--danger', '--surface', 4.5],
          ['--focus', '--surface', 3],
          ['--border', '--surface', 3],
          ['--border', '--bg', 3],
        ],
      ],
      [
        dark,
        [
          ['--text', '--bg', 4.5],
          ['--text', '--surface', 4.5],
          ['--text', '--surface-elevated', 4.5],
          ['--text-secondary', '--bg', 4.5],
          ['--text-secondary', '--surface', 4.5],
          ['--text-secondary', '--surface-elevated', 4.5],
          ['--primary-foreground', '--primary', 4.5],
          ['--accent-ink', '--bg', 4.5],
          ['--accent-ink', '--surface', 4.5],
          ['--danger', '--surface', 4.5],
          ['--focus', '--surface', 3],
          ['--border', '--surface', 3],
          ['--border', '--surface-elevated', 3],
          ['--border', '--bg', 3],
        ],
      ],
    ]

    for (const [theme, checks] of pairs) {
      for (const [fg, bg, min] of checks) {
        const ratio = contrast(theme[fg], theme[bg])
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min)
      }
    }
  })
})
