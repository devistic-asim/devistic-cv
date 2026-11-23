import { ArrowLeft, Download, Keyboard, Printer, Redo2, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button, Menu, MenuItem, Modal } from '../components/ui'
import { CheckPanel } from '../editor/CheckPanel'
import { DesignPanel } from '../editor/DesignPanel'
import { ImportButton } from '../editor/fields'
import { WritePanel } from '../editor/WritePanel'
import { fitDesign } from '../lib/autoLayout'
import type { CVDocument } from '../lib/types'
import { downloadJson, downloadJsonResume, downloadPdf, downloadPng, printResume } from '../lib/export'
import { scoreCv } from '../lib/score'
import { TIPS } from '../lib/tips'
import { PreviewPane } from '../preview/PreviewPane'
import { pushToast } from '../store/toast'
import { useCvStore } from '../store/useCvStore'

type Mode = 'write' | 'design' | 'check'

const TOUR = [
  {
    title: 'This stays on your device',
    body: 'Devistic CV does not ask you to sign in. The document is saved in this browser, and nothing is sent to a model.',
  },
  {
    title: 'Write section by section',
    body: 'Personal details stay pinned. Drag the other sections, open one, and use the formatting bar for bold, italic, lists, and links.',
  },
  {
    title: 'The page is the preview',
    body: 'The sheet on the right is the page you will export. Switch templates, type size, and spacing in Design and it updates immediately.',
  },
  {
    title: 'The checklist is a set of rules',
    body: 'Check looks for a name, an email, long bullets, missing numbers, and two-column risk. It does not rewrite your sentences.',
  },
  {
    title: 'Export when it reads well',
    body: 'Download a pixel-matched PDF or PNG, print a text PDF for older applicant systems, or keep a Devistic JSON copy and a JSON Resume file.',
  },
]

export function EditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const doc = useCvStore((state) => state.docs.find((item) => item.id === id))
  const ready = useCvStore((state) => state.ready)
  const saveState = useCvStore((state) => state.saveState)
  const update = useCvStore((state) => state.update)
  const undo = useCvStore((state) => state.undo)
  const redo = useCvStore((state) => state.redo)
  const rename = useCvStore((state) => state.rename)
  const importParsed = useCvStore((state) => state.importParsed)
  const past = useCvStore((state) => state.past)
  const future = useCvStore((state) => state.future)
  const [mode, setMode] = useState<Mode>('write')
  const [section, setSection] = useState('outline')
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const [pages, setPages] = useState(1)
  const [help, setHelp] = useState(false)
  const [tourStep, setTourStep] = useState<number | null>(() => {
    try {
      return localStorage.getItem('devistic-tour-v1') ? null : 0
    } catch {
      return 0
    }
  })
  const [notes, setNotes] = useState<string[]>(() => {
    const state = location.state as { notes?: string[] } | null
    return state?.notes ?? []
  })

  useEffect(() => {
    if (ready && !doc) navigate('/documents', { replace: true })
  }, [ready, doc, navigate])

  useEffect(() => {
    const onJump = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setMode('write')
      setSection(detail === 'personal' ? 'personal' : detail)
      setPane('edit')
    }
    window.addEventListener('devistic-section', onJump)
    return () => window.removeEventListener('devistic-section', onJump)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      const target = event.target as HTMLElement | null
      const typing = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'))
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo(id)
        else undo(id)
      } else if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo(id)
      } else if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        pushToast('Saved on this device.')
      } else if (meta && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        printResume()
      } else if (!typing && event.key === '?') {
        setHelp(true)
      } else if (!typing && !meta && event.key === '1') setMode('write')
      else if (!typing && !meta && event.key === '2') setMode('design')
      else if (!typing && !meta && event.key === '3') setMode('check')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, redo, undo])

  const score = useMemo(() => (doc ? scoreCv(doc).score : 0), [doc])
  if (!doc) return <p className="p-8 text-sm text-muted">Opening your CV…</p>

  const apply = (recipe: (draft: CVDocument) => void, key?: string) => update(id, recipe, key)
  const issues = scoreCv(doc).checks.filter((check) => check.severity === 'error' || check.severity === 'warn').length

  return (
    <div className="print-root flex h-full min-h-0 flex-col overflow-hidden bg-bg text-text">
      <a className="skip-link no-print" href="#editor-panel">Skip to editor</a>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-bg">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-muted hover:text-text" aria-label="Back to documents">
            <ArrowLeft size={16} aria-hidden />
            <span className="hidden sm:inline">Documents</span>
          </Link>
          <BrandLockup nameTo="/" />
          <div className="min-w-0 flex-1">
            <input
              aria-label="CV name"
              className="w-full max-w-xs bg-transparent text-sm font-semibold"
              value={doc.name}
              onChange={(event) => rename(id, event.target.value)}
            />
            <p className="text-xs text-muted">{saveState === 'saving' ? 'Saving on this device…' : 'Saved on this device'}</p>
          </div>
          <div className="inline-flex rounded-md border border-line bg-surface p-0.5" role="tablist" aria-label="Editor mode" data-tour="write">
            {(['write', 'design', 'check'] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                className={`rounded px-3 py-1.5 text-sm font-semibold capitalize ${mode === item ? 'bg-primary text-primary-fg' : 'text-muted'}`}
                onClick={() => setMode(item)}
              >
                {item}
                {item === 'check' && issues > 0 ? ` (${issues})` : ''}
              </button>
            ))}
          </div>
          <Button type="button" size="icon" variant="ghost" aria-label="Undo" disabled={past.at(-1)?.id !== id} onClick={() => undo(id)}>
            <Undo2 size={16} />
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Redo" disabled={future[0]?.id !== id} onClick={() => redo(id)}>
            <Redo2 size={16} />
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Keyboard shortcuts" onClick={() => setHelp(true)}>
            <Keyboard size={16} />
          </Button>
          <ThemeToggle compact />
          <Menu
            label="Export"
            trigger={
              <Button type="button">
                <Download size={16} /> Export
              </Button>
            }
          >
            <MenuItem onSelect={() => void downloadPdf(doc).catch((error: Error) => pushToast(error.message, 'warn'))}>Download PDF</MenuItem>
            <MenuItem onSelect={() => void downloadPng(doc).catch((error: Error) => pushToast(error.message, 'warn'))}>Download PNG</MenuItem>
            <MenuItem onSelect={() => downloadJson(doc)}>Download Devistic JSON</MenuItem>
            <MenuItem onSelect={() => downloadJsonResume(doc)}>Download JSON Resume</MenuItem>
            <MenuItem onSelect={() => printResume()}>
              <span className="inline-flex items-center gap-2"><Printer size={14} /> Print text PDF</span>
            </MenuItem>
            <p className="px-2 py-2 text-xs leading-relaxed text-muted">{TIPS.jsonResume}</p>
          </Menu>
        </div>
        <nav aria-label="Breadcrumb" className="px-4 pb-2 text-xs text-muted">
          <ol className="flex gap-2">
            <li><Link className="underline-offset-2 hover:underline" to="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link className="underline-offset-2 hover:underline" to="/documents">Documents</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-text">{doc.name}</li>
          </ol>
        </nav>
        <div className="flex gap-2 px-3 pb-2 lg:hidden">
          <Button type="button" size="sm" variant={pane === 'edit' ? 'primary' : 'secondary'} onClick={() => setPane('edit')}>Edit</Button>
          <Button type="button" size="sm" variant={pane === 'preview' ? 'primary' : 'secondary'} onClick={() => setPane('preview')}>Preview · {score}</Button>
        </div>
      </header>
      {notes.length > 0 && (
        <div className="no-print border-b border-line bg-highlight px-4 py-2 text-sm text-[var(--highlight-ink)]">
          <p className="font-semibold">Review the import before you export.</p>
          <ul className="mt-1 list-disc pl-4">
            {notes.slice(0, 4).map((note) => <li key={note}>{note}</li>)}
          </ul>
          <button type="button" className="mt-1 text-xs font-semibold underline" onClick={() => setNotes([])}>Dismiss</button>
        </div>
      )}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,460px)_1fr]">
        <section id="editor-panel" className={`${pane === 'preview' ? 'hidden' : 'block'} no-print overflow-auto border-line px-4 py-4 lg:block lg:border-r`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Score {score}</p>
            <ImportButton
              onParsed={(result) => {
                const imported = importParsed(result)
                navigate(`/editor/${imported.id}`, { state: { notes: imported.notes } })
                pushToast('Imported into a new CV. Review each section.')
              }}
            >
              Import file
            </ImportButton>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted">{TIPS.import}</p>
          {mode === 'write' && <WritePanel doc={doc} section={section} onSection={setSection} update={apply} />}
          {mode === 'design' && <DesignPanel doc={doc} update={apply} />}
          {mode === 'check' && (
            <CheckPanel
              doc={doc}
              onJump={(next) => {
                if (next === 'design') setMode('design')
                else {
                  setMode('write')
                  setSection(next || 'outline')
                }
              }}
            />
          )}
        </section>
        <section className={`${pane === 'edit' ? 'hidden' : 'block'} min-h-[70vh] lg:block`} data-tour="preview">
          <PreviewPane
            doc={doc}
            pages={pages}
            onPages={setPages}
            onTighten={() => {
              const fitted = fitDesign(doc.content, doc.design, 1)
              apply((draft) => {
                if (pages > 1 && draft.design.fontSize <= fitted.design.fontSize) {
                  draft.design.fontSize = Math.max(0.86, draft.design.fontSize - 0.03)
                  draft.design.spacing = Math.max(0.78, draft.design.spacing - 0.04)
                  draft.design.margin = Math.max(10, draft.design.margin - 1)
                } else draft.design = fitted.design
              }, 'discrete')
              pushToast(fitted.note)
            }}
          />
        </section>
      </div>
      <p className="no-print border-t border-line px-4 py-2 text-xs text-muted">Shortcuts: Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+S saved, Ctrl+P print, 1 2 3 switch modes, ? help.</p>
      {tourStep !== null && (
        <div className="no-print fixed bottom-4 left-4 z-40 w-[min(100%-2rem,24rem)] rounded-lg border border-line bg-elevated p-4 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold text-muted">Tour {tourStep + 1} of {TOUR.length}</p>
          <h2 className="font-serif text-lg">{TOUR[tourStep].title}</h2>
          <p className="mt-1 text-sm text-muted">{TOUR[tourStep].body}</p>
          <div className="mt-3 flex justify-between">
            <button
              type="button"
              className="text-sm font-semibold text-muted"
              onClick={() => {
                localStorage.setItem('devistic-tour-v1', 'done')
                setTourStep(null)
              }}
            >
              Skip
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (tourStep === TOUR.length - 1) {
                  localStorage.setItem('devistic-tour-v1', 'done')
                  setTourStep(null)
                } else setTourStep(tourStep + 1)
              }}
            >
              {tourStep === TOUR.length - 1 ? 'Start writing' : 'Next'}
            </Button>
          </div>
        </div>
      )}
      <Modal open={help} onOpenChange={setHelp} title="Keyboard shortcuts">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-semibold">Keys</th>
              <th className="py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Ctrl/Cmd Z', 'Undo'],
              ['Ctrl/Cmd Shift Z', 'Redo'],
              ['Ctrl/Cmd Y', 'Redo'],
              ['Ctrl/Cmd S', 'Confirm the autosave'],
              ['Ctrl/Cmd P', 'Print a text PDF'],
              ['1, 2, 3', 'Write, Design, Check'],
              ['?', 'Open this list'],
            ].map(([keys, action]) => (
              <tr key={keys} className="border-b border-divider">
                <td className="py-2 font-semibold">{keys}</td>
                <td className="py-2 text-muted">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  )
}
