import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { toJsonResume } from './jsonResume'
import { devisticPayload } from './parser'
import type { CVDocument } from './types'

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'devistic-cv'
}

export async function downloadPdf(doc: CVDocument) {
  const images = await captureSheets()
  const pdf = new jsPDF({
    unit: 'mm',
    format: doc.design.pageSize === 'a4' ? 'a4' : 'letter',
    compress: true,
  })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  images.forEach((image, index) => {
    if (index > 0) pdf.addPage()
    pdf.addImage(image, 'PNG', 0, 0, width, height)
  })
  pdf.save(`${slug(doc.name)}.pdf`)
}

export async function downloadPng(doc: CVDocument) {
  const images = await captureSheets()
  const loaded = await Promise.all(images.map(loadImage))
  const width = Math.max(...loaded.map((image) => image.width))
  const gap = images.length > 1 ? 32 : 0
  const height = loaded.reduce((sum, image) => sum + image.height, 0) + gap * (loaded.length - 1)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  let y = 0
  for (const image of loaded) {
    ctx.drawImage(image, 0, y)
    y += image.height + gap
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  downloadBlob(`${slug(doc.name)}.png`, blob)
}

export function downloadJson(doc: CVDocument) {
  const blob = new Blob([JSON.stringify(devisticPayload(doc), null, 2)], { type: 'application/json' })
  downloadBlob(`${slug(doc.name)}.json`, blob)
}

export function downloadJsonResume(doc: CVDocument) {
  const blob = new Blob([JSON.stringify(toJsonResume(doc), null, 2)], { type: 'application/json' })
  downloadBlob(`${slug(doc.name)}-json-resume.json`, blob)
}

export function printResume() {
  window.print()
}

async function captureSheets() {
  const scale = document.querySelector<HTMLElement>('[data-preview-scale]')
  const previous = scale?.style.transform ?? ''
  if (scale) scale.style.transform = 'none'
  await nextFrame()
  const sheets = [...document.querySelectorAll<HTMLElement>('.cv-sheet')]
  const images: string[] = []
  for (const sheet of sheets) {
    images.push(
      await toPng(sheet, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      }),
    )
  }
  if (scale) scale.style.transform = previous
  if (!images.length) throw new Error('The preview has no pages to export.')
  return images
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not prepare the page image.'))
    image.src = src
  })
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
