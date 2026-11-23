import sampleText from '../../public/examples/sample-resume.txt?raw'
import { autoArrange } from './autoLayout'
import { createDocument } from './defaults'
import { parseResumeText } from './parser'
import type { CVDocument, TemplateId } from './types'

export function initialsPhoto(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 480
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 480, 480)
  ctx.fillStyle = '#f5f9fc'
  ctx.font = '600 180px "Source Sans 3", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  ctx.fillText(initials || 'CV', 250, 250)
  return canvas.toDataURL('image/png')
}

export function sampleDocument(template?: TemplateId): CVDocument {
  const parsed = parseResumeText(sampleText)
  parsed.content.personal.photo = initialsPhoto(parsed.content.personal.fullName || 'Jordan Hale')
  const arranged = autoArrange(parsed.content, {
    targetPages: 1,
    preferAts: false,
    roleHint: parsed.content.personal.headline,
  })
  if (template) arranged.design.template = template
  return createDocument({
    name: 'Jordan Hale — sample',
    content: arranged.content,
    design: arranged.design,
  })
}
