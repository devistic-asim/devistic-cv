const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'A', 'BR', 'P'])

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function richToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function wordCount(text: string): number {
  const words = text.trim().match(/[A-Za-z0-9][A-Za-z0-9'’+/-]*/g)
  return words?.length ?? 0
}

export function plainToRich(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeRich(trimmed)
  const lines = trimmed.split(/\n+/)
  const bullets = lines.filter((line) => /^[-*•]\s+/.test(line.trim()))
  const prose = lines.filter((line) => line.trim() && !/^[-*•]\s+/.test(line.trim()))
  const parts: string[] = []
  if (prose.length) parts.push(`<p>${escapeHtml(prose.join(' '))}</p>`)
  if (bullets.length) {
    parts.push(`<ul>${bullets.map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, '').trim())}</li>`).join('')}</ul>`)
  }
  return parts.join('')
}

export function sanitizeRich(html: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return sanitizeRichRegex(html)
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  clean(root)
  return root.innerHTML.trim()
}

function clean(node: Element) {
  const children = [...node.childNodes]
  for (const child of children) {
    if (child.nodeType === 3) continue
    if (child.nodeType !== 1) {
      child.remove()
      continue
    }
    const el = child as Element
    if (!ALLOWED.has(el.tagName)) {
      el.replaceWith(...el.childNodes)
      continue
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') ?? ''
      const safe = /^(https?:|mailto:)/i.test(href) ? href : ''
      ;[...el.attributes].forEach((attr) => el.removeAttribute(attr.name))
      if (safe) el.setAttribute('href', safe)
      else el.removeAttribute('href')
    } else {
      ;[...el.attributes].forEach((attr) => el.removeAttribute(attr.name))
    }
    clean(el)
  }
}

function sanitizeRichRegex(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}
