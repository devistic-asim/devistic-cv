import { Copy, FilePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Button, Modal } from '../components/ui'
import { ImportButton } from '../editor/fields'
import { downloadJson, downloadJsonResume } from '../lib/export'
import { sampleDocument } from '../lib/sample'
import { TIPS } from '../lib/tips'
import { templateMeta } from '../preview/templates'
import { pushToast } from '../store/toast'
import { useCvStore } from '../store/useCvStore'

export function Dashboard() {
  const docs = useCvStore((state) => state.docs)
  const ready = useCvStore((state) => state.ready)
  const create = useCvStore((state) => state.create)
  const duplicate = useCvStore((state) => state.duplicate)
  const remove = useCvStore((state) => state.remove)
  const importParsed = useCvStore((state) => state.importParsed)
  const navigate = useNavigate()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
          <ol className="flex gap-2">
            <li><Link className="hover:underline" to="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-text">Documents</li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl">Documents</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">{TIPS.import}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => navigate(`/editor/${create()}`)}>
              <FilePlus size={16} /> Blank CV
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/wizard')}>Auto-build</Button>
            <ImportButton
              onParsed={(result) => {
                const imported = importParsed(result)
                pushToast(result.warnings[0] || 'Imported. Review the sections.')
                navigate(`/editor/${imported.id}`, { state: { notes: imported.notes } })
              }}
            >
              Import
            </ImportButton>
          </div>
        </div>
        {!ready && <p className="mt-8 text-sm text-muted">Reading saved CVs…</p>}
        {ready && docs.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-surface px-6 py-12">
            <h2 className="font-serif text-2xl">No CVs yet</h2>
            <p className="mt-2 max-w-lg text-sm text-muted">Start blank, answer the short auto-build, import a PDF or DOCX, or open the Jordan Hale sample to see a finished page.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => navigate(`/editor/${create()}`)}>Start blank</Button>
              <Button type="button" variant="secondary" onClick={() => navigate(`/editor/${create(sampleDocument())}`)}>Open the sample</Button>
            </div>
          </div>
        )}
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {docs.map((doc) => (
            <li key={doc.id} className="rounded-lg border border-line bg-surface p-4">
              <Link to={`/editor/${doc.id}`} className="block">
                <h2 className="font-semibold">{doc.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {doc.content.personal.headline || 'No headline yet'} · {templateMeta(doc.design.template).name} · {doc.design.pageSize === 'a4' ? 'A4' : 'Letter'}
                </p>
                <p className="mt-1 text-xs text-muted">{formatEdited(doc.updatedAt)}</p>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/editor/${doc.id}`)}>Edit</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => {
                  const copy = duplicate(doc.id)
                  if (copy) pushToast('Duplicated.')
                }}>
                  <Copy size={14} /> Duplicate
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => downloadJson(doc)}>JSON</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => downloadJsonResume(doc)}>JSON Resume</Button>
                <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(doc.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Modal open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)} title="Delete this CV?" description="This removes it from this browser. Export JSON first if you want a copy.">
        <div className="flex gap-2">
          <Button type="button" variant="danger" onClick={() => {
            if (pendingDelete) remove(pendingDelete)
            setPendingDelete(null)
          }}>Delete</Button>
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Keep it</Button>
        </div>
      </Modal>
    </Shell>
  )
}

function formatEdited(timestamp: number) {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 15) return 'Edited just now'
  if (seconds < 60) return `Edited ${seconds} seconds ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Edited ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 36) return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`
  return `Edited ${new Date(timestamp).toLocaleDateString()}`
}
