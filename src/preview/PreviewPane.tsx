import { Minus, Plus, Scaling } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { CVDocument } from '../lib/types'
import { pageMetrics } from './templates'
import { ResumePages } from './ResumePages'

export function PreviewPane({
  doc,
  pages,
  onPages,
  onTighten,
}: {
  doc: CVDocument
  pages: number
  onPages: (count: number) => void
  onTighten?: () => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.55)
  const [zoom, setZoom] = useState(1)
  const [height, setHeight] = useState(1123)
  const metrics = pageMetrics(doc.design.pageSize, doc.design.margin)
  const scale = Math.max(0.3, Math.min(1.4, fit * zoom))

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => setFit(Math.min(1, (host.clientWidth - 36) / metrics.pxW))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [metrics.pxW])

  useLayoutEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const measure = () => setHeight(inner.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [doc, scale, pages])

  return (
    <div ref={hostRef} className="preview-host h-full overflow-auto bg-preview" data-cv-export>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface/95 px-3 py-2 text-xs text-muted backdrop-blur">
        <span>
          {pages} page{pages === 1 ? '' : 's'} · {doc.design.pageSize === 'a4' ? 'A4' : 'US Letter'}
        </span>
        <div className="flex items-center gap-1">
          {pages > 1 && onTighten && (
            <Button type="button" size="sm" variant="secondary" onClick={onTighten}>
              Fit to one page
            </Button>
          )}
          <Button type="button" size="icon" variant="ghost" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}>
            <Minus size={16} />
          </Button>
          <button type="button" className="inline-flex h-8 items-center gap-1 rounded px-2 font-semibold text-text" onClick={() => setZoom(1)}>
            <Scaling size={14} aria-hidden />
            {Math.round(scale * 100)}%
          </button>
          <Button type="button" size="icon" variant="ghost" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.5, Number((value + 0.1).toFixed(2))))}>
            <Plus size={16} />
          </Button>
        </div>
      </div>
      <div className="px-4 py-6">
        <div className="preview-sizer mx-auto" style={{ width: metrics.pxW * scale, height: height * scale }}>
          <div ref={innerRef} className="preview-scale" data-preview-scale style={{ width: metrics.pxW, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ResumePages doc={doc} onPages={onPages} />
          </div>
        </div>
      </div>
    </div>
  )
}
