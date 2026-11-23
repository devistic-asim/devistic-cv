import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Badge, Button } from '../components/ui'
import { sampleDocument } from '../lib/sample'
import type { TemplateId } from '../lib/types'
import { ResumePages } from '../preview/ResumePages'
import { TEMPLATES } from '../preview/templates'
import { useCvStore } from '../store/useCvStore'

export function Landing() {
  const navigate = useNavigate()
  const create = useCvStore((state) => state.create)
  const [template, setTemplate] = useState<TemplateId>('harbor')
  const base = useMemo(() => sampleDocument(), [])
  const preview = useMemo(() => ({ ...base, design: { ...base.design, template } }), [base, template])

  function start(kind: 'blank' | 'sample' | 'auto') {
    if (kind === 'auto') {
      navigate('/wizard')
      return
    }
    const doc = kind === 'sample' ? sampleDocument(template) : undefined
    if (doc) doc.design.template = template
    const id = create(doc)
    navigate(`/editor/${id}`)
  }

  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Devistic CV</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-text sm:text-5xl">A clear CV, kept on this device.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Write it section by section, or let a set of rules order the page, tighten the type, and give the headings their usual names. Nothing is uploaded. Nothing is written by a model.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => start('blank')}>Start a blank CV</Button>
            <Button type="button" variant="secondary" onClick={() => start('auto')}>Auto-build</Button>
            <Button type="button" variant="ghost" onClick={() => start('sample')}>Open the sample</Button>
          </div>
          <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ['On this device', 'Autosave uses browser storage. Close the tab and the CV is still here.'],
              ['Rules, not a model', 'Dates, order, duplicates, and page fit follow checks you can read.'],
              ['Printable text', 'The one-click PDF matches the page. Print keeps real text for older systems.'],
            ].map(([title, body]) => (
              <li key={title} className="rounded-md border border-line bg-surface p-3">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-preview p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{TEMPLATES.find((item) => item.id === template)?.name} · sample</p>
          <div className="mx-auto h-[540px] max-w-[420px] overflow-hidden">
            <div style={{ transform: 'scale(0.46)', transformOrigin: 'top center' }}>
              <ResumePages doc={preview} />
            </div>
          </div>
        </div>
      </section>

      <section id="method" className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
          {[
            ['01', 'Write', 'Personal details, summary, roles, study, skills, projects, certificates, languages, links, and any section you name.'],
            ['02', 'Arrange', 'Drag sections and entries. Or run auto-build: it picks a template, merges duplicates, and scales type toward one or two pages.'],
            ['03', 'Export', 'PDF and PNG match the sheet. JSON round-trips the document. Print is the text version for applicant systems.'],
          ].map(([index, title, body]) => (
            <article key={title}>
              <p className="text-xs font-semibold text-[var(--accent-ink)]">{index}</p>
              <h2 className="mt-1 font-serif text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl">Eight templates, one reading order when it matters</h2>
            <p className="mt-2 max-w-2xl text-muted">Atlas, Harbor, Ledger, and Parchment stay in a single column. Meridian, Nimbus, Forge, and Quartz use a second column for a person reading the page.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => start('sample')}>Use this template</Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={template === item.id}
              onClick={() => setTemplate(item.id)}
              className={`rounded-md border p-3 text-left ${template === item.id ? 'border-primary bg-surface' : 'border-line bg-surface hover:bg-sunken'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{item.name}</span>
                <Badge tone={item.ats === 'High' ? 'good' : 'highlight'}>{item.columns === 1 ? '1 column' : '2 columns'}</Badge>
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted">{item.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl">A checklist with the reason attached</h2>
            <p className="mt-3 text-muted">Each note names the rule: a missing email, a bullet past 28 words, a role with no number, a photo on a portal-friendly layout. You decide what to change.</p>
            <p className="mt-3 text-muted">Example lines sit in a library by role. They are starters with brackets, not finished claims.</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-sm font-semibold">From the sample</p>
            <ul className="mt-3 grid gap-2 text-sm">
              <li className="rounded-md bg-sunken px-3 py-2">Summary length is in range.</li>
              <li className="rounded-md border border-[#1E293B] bg-highlight px-3 py-2 text-[var(--highlight-ink)]">Two-column templates can confuse older applicant systems.</li>
              <li className="rounded-md bg-sunken px-3 py-2">Bullets include a metric.</li>
            </ul>
            <Link className="mt-4 inline-block text-sm font-semibold underline-offset-2 hover:underline" to="/documents">Go to your documents</Link>
          </div>
        </div>
      </section>
    </Shell>
  )
}
