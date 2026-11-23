import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { packBlocks } from '../lib/autoLayout'
import { visibleAccent } from '../lib/contrast'
import { fontStack, LEVEL_LABELS, sectionLabel } from '../lib/defaults'
import { formatRange, prettyDate } from '../lib/dates'
import { richToText, sanitizeRich } from '../lib/richtext'
import type { CVContent, CVDocument, DesignSettings, PhotoShape, SectionKey, SkillItem } from '../lib/types'
import { pageMetrics, sideKeys, templateMeta } from './templates'

type Spec = { id: string; section: string; width: 'main' | 'side' | 'header'; render: () => ReactNode }

export function ResumePages({ doc, onPages }: { doc: CVDocument; onPages?: (count: number) => void }) {
  const design = doc.design
  const metrics = pageMetrics(design.pageSize, design.margin)
  const meta = templateMeta(design.template)
  const twoCol = meta.columns === 2
  const specs = useMemo(() => buildSpecs(doc), [doc])
  const header = specs.filter((spec) => spec.width === 'header')
  const main = specs.filter((spec) => spec.width === 'main')
  const side = specs.filter((spec) => spec.width === 'side')
  const refs = useRef(new Map<string, HTMLDivElement>())
  const [packed, setPacked] = useState<{ main: number[][]; side: number[][]; headerH: number }>({
    main: [main.map((_, index) => index)],
    side: [side.map((_, index) => index)],
    headerH: 0,
  })

  useLayoutEffect(() => {
    const headerH = header.reduce((sum, spec) => sum + (refs.current.get(spec.id)?.offsetHeight ?? 0), 0)
    const mainHeights = main.map((spec) => refs.current.get(spec.id)?.offsetHeight ?? 0)
    const sideHeights = side.map((spec) => refs.current.get(spec.id)?.offsetHeight ?? 0)
    const columnH = metrics.pxH - (twoCol ? metrics.pad * 2 : metrics.pad * 2)
    const firstH = headerH > 0 ? Math.max(120, metrics.pxH - headerH - metrics.pad * 2) : columnH
    const next = {
      main: packBlocks(mainHeights, columnH, firstH),
      side: packBlocks(sideHeights, columnH, firstH),
      headerH,
    }
    setPacked((current) => (samePack(current, next) ? current : next))
    const count = Math.max(next.main.length, next.side.length, 1)
    onPages?.(count)
  }, [doc, header, main, side, metrics.pad, metrics.pxH, twoCol, onPages])

  const count = Math.max(packed.main.length, packed.side.length, 1)
  const style = paperStyle(design)
  const sideOnLeft = design.sidebar === 'left'
  const navy = meta.tone === 'navy-side'

  return (
    <div className="flex flex-col items-center gap-6" onClick={onSectionClick}>
      <div className="no-print pointer-events-none fixed top-0 -left-[12000px] opacity-0" aria-hidden>
        <Measure width={metrics.pxW} style={style} specs={header} refs={refs} />
        <Measure width={twoCol ? metrics.mainInner : metrics.singleInner} style={style} specs={main} refs={refs} />
        <Measure width={metrics.sideInner} style={style} specs={side} refs={refs} />
      </div>
      {Array.from({ length: count }, (_, page) => (
        <article
          key={page}
          className="cv-sheet"
          aria-label={`Page ${page + 1}`}
          style={{
            ...style,
            width: `${metrics.wmm}mm`,
            height: `${metrics.hmm}mm`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {page === 0 && header.map((spec) => <div key={spec.id}>{spec.render()}</div>)}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: !twoCol ? '1fr' : sideOnLeft ? `${metrics.sideOuter}px 1fr` : `1fr ${metrics.sideOuter}px`,
            }}
          >
            {twoCol && sideOnLeft && (
              <SideColumn navy={navy} pad={metrics.sidePad} ids={packed.side[page] ?? []} specs={side} />
            )}
            <div style={{ padding: metrics.pad, minWidth: 0 }}>
              {(packed.main[page] ?? []).map((index) => {
                const spec = main[index]
                if (!spec) return null
                return <Block key={spec.id} spec={spec} gap={8 * design.spacing} />
              })}
            </div>
            {twoCol && !sideOnLeft && (
              <SideColumn navy={navy} pad={metrics.sidePad} ids={packed.side[page] ?? []} specs={side} />
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function SideColumn({ navy, pad, ids, specs }: { navy: boolean; pad: number; ids: number[]; specs: Spec[] }) {
  return (
    <aside
      style={{
        background: navy ? '#1e293b' : '#f4f7fa',
        color: navy ? '#f5f9fc' : '#1e293b',
        padding: pad,
        minWidth: 0,
      }}
    >
      {ids.map((index) => {
        const spec = specs[index]
        if (!spec) return null
        return <Block key={spec.id} spec={spec} gap={8} />
      })}
    </aside>
  )
}

function Block({ spec, gap }: { spec: Spec; gap: number }) {
  return (
    <div data-cv-section={spec.section} style={{ paddingBottom: gap }}>
      {spec.render()}
    </div>
  )
}

function Measure({
  width,
  style,
  specs,
  refs,
}: {
  width: number
  style: CSSProperties
  specs: Spec[]
  refs: { current: Map<string, HTMLDivElement> }
}) {
  return (
    <div style={{ ...style, width }}>
      {specs.map((spec) => (
        <div
          key={spec.id}
          ref={(node) => {
            if (node) refs.current.set(spec.id, node)
            else refs.current.delete(spec.id)
          }}
        >
          {spec.render()}
        </div>
      ))}
    </div>
  )
}

function samePack(
  a: { main: number[][]; side: number[][]; headerH: number },
  b: { main: number[][]; side: number[][]; headerH: number },
) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function onSectionClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-cv-section]')
  if (!target) return
  const section = target.getAttribute('data-cv-section')
  if (!section) return
  window.dispatchEvent(new CustomEvent('devistic-section', { detail: section }))
}

function paperStyle(design: DesignSettings): CSSProperties {
  return {
    fontFamily: fontStack(design.font),
    fontSize: `${14.2 * design.fontSize}px`,
    lineHeight: design.lineHeight,
    color: '#1e293b',
  }
}

function buildSpecs(doc: CVDocument): Spec[] {
  const { content, design } = doc
  const meta = templateMeta(design.template)
  const accent = design.accent || '#20b683'
  const gap = 8 * design.spacing
  const side = new Set(sideKeys(design.template))
  const specs: Spec[] = []
  const push = (id: string, section: string, width: Spec['width'], render: () => ReactNode) => {
    specs.push({ id, section, width, render })
  }

  const pad = (design.margin / 25.4) * 96
  const identity = () => <Identity doc={doc} />
  if (meta.tone === 'band') push('header', 'personal', 'header', identity)
  else if (meta.tone === 'navy-side') push('identity', 'personal', 'side', identity)
  else if (meta.columns === 2 && (meta.tone === 'paper-side' || meta.tone === 'split')) {
    push('header', 'personal', 'header', () => <div style={{ padding: `${pad}px ${pad}px 0` }}>{identity()}</div>)
  } else push('identity', 'personal', 'main', identity)

  for (const sectionId of content.sectionOrder) {
    if (content.hiddenSections.includes(sectionId)) continue
    if (sectionId.startsWith('custom:')) {
      const custom = content.custom.find((section) => section.id === sectionId.slice(7))
      if (!custom || custom.items.every((item) => !item.title && !richToText(item.body))) continue
      custom.items.forEach((item, index) => {
        if (!item.title && !richToText(item.body)) return
        push(`custom-${item.id}`, sectionId, 'main', () => (
          <section>
            {index === 0 && <Heading title={custom.title || 'Additional'} design={design} tone="paper" />}
            <EntryTitle title={item.title} meta={item.meta} sub={item.subtitle} />
            <Rich html={item.body} />
          </section>
        ))
      })
      continue
    }
    const key = sectionId as SectionKey
    const onSide = side.has(key)
    const width: Spec['width'] = onSide ? 'side' : 'main'
    const tone = onSide && meta.tone === 'navy-side' ? 'navy' : 'paper'
    if (!hasContent(content, key)) continue
    const title = sectionLabel(content, key)

    if (key === 'summary') {
      push('summary', key, width, () => (
        <section>
          <Heading title={title} design={design} tone={tone} />
          <Rich html={content.summary} />
        </section>
      ))
    }
    if (key === 'experience') {
      content.experience.forEach((job, index) => {
        if (!job.role && !job.company) return
        push(`exp-${job.id}`, key, width, () => (
          <section>
            {index === 0 && <Heading title={title} design={design} tone={tone} />}
            {meta.tone === 'timeline' && !onSide ? (
              <TimelineJob job={job} design={design} accent={accent} />
            ) : (
              <Job job={job} design={design} tone={tone} />
            )}
          </section>
        ))
      })
    }
    if (key === 'education') {
      content.education.forEach((item, index) => {
        if (!item.school && !item.degree) return
        push(`edu-${item.id}`, key, width, () => (
          <section>
            {index === 0 && <Heading title={title} design={design} tone={tone} />}
            <EntryTitle
              tone={tone}
              title={item.degree || item.school}
              sub={[item.degree ? item.school : '', item.field].filter(Boolean).join(' · ')}
              meta={formatRange(item.start, item.end, false, design.dateFormat)}
            />
            {item.location && <Meta tone={tone}>{item.location}</Meta>}
            <Rich html={item.details} />
          </section>
        ))
      })
    }
    if (key === 'skills') {
      push('skills', key, width, () => (
        <section>
          <Heading title={title} design={design} tone={tone} />
          <Skills skills={content.skills} design={design} tone={tone} />
        </section>
      ))
    }
    if (key === 'projects') {
      content.projects.forEach((project, index) => {
        if (!project.name) return
        push(`proj-${project.id}`, key, width, () => (
          <section>
            {index === 0 && <Heading title={title} design={design} tone={tone} />}
            <EntryTitle
              tone={tone}
              title={project.name}
              sub={project.role}
              meta={formatRange(project.start, project.end, false, design.dateFormat)}
            />
            {project.url && (
              <a href={project.url} style={{ color: 'inherit', fontSize: '0.86em' }}>
                {prettyUrl(project.url)}
              </a>
            )}
            <Rich html={project.description} />
          </section>
        ))
      })
    }
    if (key === 'certifications') {
      push('certs', key, width, () => (
        <section>
          <Heading title={title} design={design} tone={tone} />
          {content.certifications.filter((item) => item.name).map((item) => (
            <EntryTitle
              key={item.id}
              tone={tone}
              title={item.name}
              sub={item.issuer}
              meta={item.date ? prettyDate(item.date, design.dateFormat) : ''}
            />
          ))}
        </section>
      ))
    }
    if (key === 'languages') {
      push('languages', key, width, () => (
        <section>
          <Heading title={title} design={design} tone={tone} />
          {content.languages.filter((item) => item.name).map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.92em' }}>
              <span>{item.name}</span>
              <Meta tone={tone}>{item.level}</Meta>
            </div>
          ))}
        </section>
      ))
    }
    if (key === 'links') {
      const used = new Set([
        normalizeUrl(content.personal.website),
        ...content.projects.map((project) => normalizeUrl(project.url)),
      ])
      const links = content.links.filter((link) => link.url && !used.has(normalizeUrl(link.url)))
      if (!links.length) continue
      push('links', key, width, () => (
        <section>
          <Heading title={title} design={design} tone={tone} />
          {links.map((link) => (
            <div key={link.id} style={{ fontSize: '0.9em' }}>
              <a href={link.url} style={{ color: 'inherit' }}>
                {link.label || prettyUrl(link.url)}
              </a>
            </div>
          ))}
        </section>
      ))
    }
    void gap
  }
  return specs
}

function hasContent(content: CVContent, key: SectionKey) {
  if (key === 'summary') return Boolean(richToText(content.summary))
  if (key === 'experience') return content.experience.some((item) => item.role || item.company)
  if (key === 'education') return content.education.some((item) => item.school || item.degree)
  if (key === 'skills') return content.skills.some((item) => item.name.trim())
  if (key === 'projects') return content.projects.some((item) => item.name.trim())
  if (key === 'certifications') return content.certifications.some((item) => item.name.trim())
  if (key === 'languages') return content.languages.some((item) => item.name.trim())
  return content.links.some((item) => item.url.trim())
}

function Identity({ doc }: { doc: CVDocument }) {
  const meta = templateMeta(doc.design.template)
  const personal = doc.content.personal
  const showPhoto = doc.design.showPhoto && Boolean(personal.photo)
  const accent = visibleAccent(doc.design.accent || '#20b683', meta.tone === 'band' || meta.tone === 'navy-side' ? '#1e293b' : '#ffffff')
  const name = personal.fullName.trim() || 'Your name'
  const muted = meta.tone === 'band' || meta.tone === 'navy-side' ? '#c5d0dc' : '#637285'
  const align = meta.tone === 'serif' ? 'center' : 'left'

  if (meta.tone === 'band') {
    return (
      <header style={{ background: '#1e293b', color: '#f5f9fc', padding: '28px 36px 22px', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85em', letterSpacing: '-0.03em', fontWeight: 700 }}>{name}</h1>
          {personal.headline && <p style={{ margin: '4px 0 0', color: muted }}>{personal.headline}</p>}
          <Contact personal={personal} links={doc.content.links} color={muted} />
        </div>
        {showPhoto && <Photo src={personal.photo} shape={doc.design.photoShape} size={86} />}
      </header>
    )
  }

  if (meta.tone === 'navy-side') {
    return (
      <header>
        {showPhoto && (
          <div style={{ marginBottom: 10 }}>
            <Photo src={personal.photo} shape={doc.design.photoShape} size={96} />
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: '1.35em', letterSpacing: '-0.03em', fontWeight: 700, color: '#f5f9fc' }}>{name}</h1>
        {personal.headline && <p style={{ margin: '4px 0 0', color: muted }}>{personal.headline}</p>}
        <Contact personal={personal} links={doc.content.links} color={muted} stacked />
      </header>
    )
  }

  return (
    <header style={{ textAlign: align }}>
      {showPhoto && meta.tone === 'serif' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Photo src={personal.photo} shape={doc.design.photoShape} size={78} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}>
        <div style={{ flex: 1, textAlign: align }}>
          <h1 style={{ margin: 0, fontSize: meta.tone === 'serif' ? '1.7em' : '1.8em', letterSpacing: '-0.03em', fontWeight: 700, fontFamily: meta.tone === 'serif' ? 'inherit' : undefined }}>
            {name}
          </h1>
          {personal.headline && <p style={{ margin: '3px 0 0', color: muted }}>{personal.headline}</p>}
        </div>
        {showPhoto && meta.tone !== 'serif' && <Photo src={personal.photo} shape={doc.design.photoShape} size={84} />}
      </div>
      {meta.tone === 'rule' && <div style={{ height: 3, width: 42, background: accent, margin: '8px 0 4px' }} />}
      {meta.tone === 'serif' && <div style={{ height: 1, background: '#d5dee7', margin: '8px auto', width: 72 }} />}
      <Contact personal={personal} links={doc.content.links} color={muted} align={align} />
    </header>
  )
}

function Contact({
  personal,
  color,
  stacked,
  align = 'left',
}: {
  personal: CVContent['personal']
  links: CVContent['links']
  color: string
  stacked?: boolean
  align?: 'left' | 'center'
}) {
  const parts = [
    personal.email && { label: personal.email, href: `mailto:${personal.email}` },
    personal.phone && { label: personal.phone, href: `tel:${personal.phone.replace(/\s/g, '')}` },
    personal.location && { label: personal.location },
    personal.website && { label: prettyUrl(personal.website), href: personal.website },
  ].filter(Boolean) as { label: string; href?: string }[]
  if (!parts.length) return null
  if (stacked) {
    return (
      <div style={{ marginTop: 10, color, fontSize: '0.86em', display: 'grid', gap: 3 }}>
        {parts.map((part) => (
          <div key={part.label}>{part.href ? <a href={part.href} style={{ color: 'inherit' }}>{part.label}</a> : part.label}</div>
        ))}
      </div>
    )
  }
  return (
    <p style={{ margin: '6px 0 0', color, fontSize: '0.86em', textAlign: align }}>
      {parts.map((part, index) => (
        <span key={part.label}>
          {index > 0 && <span aria-hidden> · </span>}
          {part.href ? <a href={part.href} style={{ color: 'inherit' }}>{part.label}</a> : part.label}
        </span>
      ))}
    </p>
  )
}

function Photo({ src, shape, size }: { src: string; shape: PhotoShape; size: number }) {
  const radius = shape === 'round' ? '50%' : shape === 'rounded' ? '10px' : '2px'
  return <img src={src} alt="Profile photo" style={{ width: size, height: size, objectFit: 'cover', borderRadius: radius, flex: 'none' }} />
}

function Heading({ title, design, tone }: { title: string; design: DesignSettings; tone: 'paper' | 'navy' }) {
  const accent = visibleAccent(design.accent || '#20b683', tone === 'navy' ? '#1e293b' : '#ffffff')
  const meta = templateMeta(design.template)
  if (tone === 'navy') {
    return (
      <h2 style={{ margin: '0.85em 0 0.35em', fontSize: '0.74em', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#f5f9fc', borderBottom: `2px solid ${accent}`, paddingBottom: 3 }}>
        {title}
      </h2>
    )
  }
  if (meta.tone === 'serif') {
    return (
      <h2 style={{ margin: '0.9em 0 0.4em', textAlign: 'center', fontSize: '0.76em', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <i style={{ width: 22, height: 1, background: accent, display: 'inline-block' }} />
          {title}
          <i style={{ width: 22, height: 1, background: accent, display: 'inline-block' }} />
        </span>
      </h2>
    )
  }
  if (meta.tone === 'rule' || meta.tone === 'paper-side' || meta.tone === 'band') {
    return (
      <h2 style={{ margin: '0.85em 0 0.35em', fontSize: '0.76em', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderLeft: `3px solid ${accent}`, paddingLeft: 8 }}>
        {title}
      </h2>
    )
  }
  return (
    <h2 style={{ margin: '0.85em 0 0.35em', fontSize: '0.76em', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderBottom: '1px solid #d5dee7', paddingBottom: 3 }}>
      {title}
    </h2>
  )
}

function Job({
  job,
  design,
  tone,
}: {
  job: CVContent['experience'][number]
  design: DesignSettings
  tone: 'paper' | 'navy'
}) {
  return (
    <div>
            <EntryTitle tone={tone} title={job.role || 'Role'} sub={[job.company, job.location].filter(Boolean).join(' · ')} meta={formatRange(job.start, job.end, job.current, design.dateFormat)} />
      <Rich html={job.summary} />
      <BulletList bullets={job.bullets} tone={tone} />
    </div>
  )
}

function TimelineJob({ job, design, accent }: { job: CVContent['experience'][number]; design: DesignSettings; accent: string }) {
  const rule = visibleAccent(accent, '#ffffff')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 10 }}>
      <div style={{ color: '#637285', fontSize: '0.82em' }}>{formatRange(job.start, job.end, job.current, design.dateFormat)}</div>
      <div style={{ borderLeft: `2px solid ${rule}`, paddingLeft: 10 }}>
        <strong>{job.role || 'Role'}</strong>
        <Meta tone="paper">{[job.company, job.location].filter(Boolean).join(' · ')}</Meta>
        <Rich html={job.summary} />
        <BulletList bullets={job.bullets} tone="paper" />
      </div>
    </div>
  )
}

function EntryTitle({ title, sub, meta, tone = 'paper' }: { title: string; sub?: string; meta?: string; tone?: 'paper' | 'navy' }) {
  if (!title && !sub && !meta) return null
  const muted = tone === 'navy' ? '#c5d0dc' : '#637285'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <div>
        {title && <div style={{ fontWeight: 700 }}>{title}</div>}
        {sub && <div style={{ color: muted, fontSize: '0.9em' }}>{sub}</div>}
      </div>
      {meta && <div style={{ color: muted, fontSize: '0.82em', whiteSpace: 'nowrap' }}>{meta}</div>}
    </div>
  )
}

function Skills({ skills, design, tone }: { skills: SkillItem[]; design: DesignSettings; tone: 'paper' | 'navy' }) {
  const filled = skills.filter((skill) => skill.name.trim())
  const groups = new Map<string, SkillItem[]>()
  for (const skill of filled) {
    const key = skill.group.trim()
    groups.set(key, [...(groups.get(key) ?? []), skill])
  }
  const dot = tone === 'navy' ? '#f5f9fc' : '#1e293b'
  return (
    <div>
      {[...groups.entries()].map(([group, items]) => (
        <div key={group || 'all'}>
          {group && <div style={{ fontSize: '0.78em', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>{group}</div>}
          {design.showSkillLevels && items.some((item) => item.level > 0) ? (
            items.map((skill) => (
              <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.9em', margin: '2px 0' }}>
                <span>
                  {skill.name}
                  {skill.level > 0 ? ` · ${LEVEL_LABELS[skill.level]}` : ''}
                </span>
                {skill.level > 0 && (
                  <span aria-hidden style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <i
                        key={index}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          display: 'inline-block',
                          background: index < skill.level ? dot : 'transparent',
                          border: `1px solid ${dot}`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p style={{ margin: 0 }}>{items.map((skill) => skill.name).join(', ')}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function BulletList({ bullets, tone }: { bullets: string[]; tone: 'paper' | 'navy' }) {
  const items = bullets.map(richToText).map((text, index) => ({ text, html: bullets[index] })).filter((item) => item.text)
  if (!items.length) return null
  return (
    <ul style={{ color: tone === 'navy' ? '#f5f9fc' : 'inherit' }}>
      {items.map((item) => (
        <li key={item.text}>
          <Rich html={item.html} />
        </li>
      ))}
    </ul>
  )
}

function Rich({ html }: { html: string }) {
  const safe = sanitizeRich(html)
  if (!richToText(safe)) return null
  return <div className="cv-rich" dangerouslySetInnerHTML={{ __html: safe }} />
}

function Meta({ children, tone }: { children: ReactNode; tone: 'paper' | 'navy' }) {
  if (!children) return null
  return <div style={{ color: tone === 'navy' ? '#c5d0dc' : '#637285', fontSize: '0.86em' }}>{children}</div>
}

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '').toLowerCase()
}
