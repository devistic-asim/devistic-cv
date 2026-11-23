import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bold, GripVertical, Italic, Link2, List, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button, Modal } from '../components/ui'
import { parseResumeFile } from '../lib/parser'
import { PHRASE_GROUPS } from '../lib/phrases'
import { sanitizeRich } from '../lib/richtext'
import type { ParseResult, PhotoShape } from '../lib/types'

export function RichField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const saved = useRef<Range | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('https://')
  const fieldId = label.replace(/\s+/g, '-').toLowerCase()

  useEffect(() => {
    const node = ref.current
    if (!node || document.activeElement === node) return
    if (node.innerHTML !== value) node.innerHTML = value || ''
  }, [value])

  function emit() {
    onChange(sanitizeRich(ref.current?.innerHTML ?? ''))
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  return (
    <div className="text-sm">
      <span className="mb-1 block font-semibold text-text" id={`${fieldId}-label`}>
        {label}
      </span>
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="flex gap-1 border-b border-divider p-1" role="toolbar" aria-label={`${label} formatting`}>
          <ToolbarButton label="Bold" onClick={() => exec('bold')}>
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => exec('italic')}>
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton label="Bulleted list" onClick={() => exec('insertUnorderedList')}>
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            onClick={() => {
              const selection = window.getSelection()
              if (selection && selection.rangeCount) saved.current = selection.getRangeAt(0).cloneRange()
              setLinkOpen(true)
            }}
          >
            <Link2 size={14} />
          </ToolbarButton>
        </div>
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          contentEditable
          data-placeholder={placeholder}
          className="min-h-20 px-3 py-2 text-text outline-none"
          onInput={emit}
          onBlur={emit}
          suppressContentEditableWarning
        />
      </div>
      {hint && (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      <Modal open={linkOpen} onOpenChange={setLinkOpen} title="Add a link" description="Use a full address, including https://">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
            ref.current?.focus()
            const selection = window.getSelection()
            selection?.removeAllRanges()
            if (saved.current) selection?.addRange(saved.current)
            document.execCommand('createLink', false, href)
            emit()
            setLinkOpen(false)
          }}
        >
          <label className="text-sm font-semibold">
            Address
            <input className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2" value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
          <Button type="submit">Insert link</Button>
        </form>
      </Modal>
    </div>
  )
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded text-text hover:bg-sunken"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function PhraseButton({ onInsert, role }: { onInsert: (phrase: string) => void; role?: string }) {
  const [open, setOpen] = useState(false)
  const initial = role && /design/i.test(role) ? 'design' : 'engineering'
  const [group, setGroup] = useState(initial)
  const current = PHRASE_GROUPS.find((item) => item.id === group) ?? PHRASE_GROUPS[0]
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Insert an example line
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Example lines" description="These are starters. Replace the brackets with your own numbers." wide>
        <div className="mb-3 flex flex-wrap gap-2">
          {PHRASE_GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === current.id}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.id === current.id ? 'border-primary bg-primary text-primary-fg' : 'border-line text-text'}`}
              onClick={() => setGroup(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ul className="grid gap-2">
          {current.phrases.map((phrase) => (
            <li key={phrase}>
              <button
                type="button"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-left text-sm hover:bg-sunken"
                onClick={() => {
                  onInsert(phrase)
                  setOpen(false)
                }}
              >
                {phrase}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}

export function PhotoField({
  photo,
  onChange,
}: {
  photo: string
  onChange: (photo: string, shape: PhotoShape) => void
}) {
  const [source, setSource] = useState('')
  const [open, setOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [shape, setShape] = useState<PhotoShape>('round')
  const [area, setArea] = useState<Area | null>(null)

  return (
    <div className="text-sm">
      <span className="mb-1 block font-semibold">Profile photo</span>
      <div className="flex items-center gap-3">
        {photo ? (
          <img src={photo} alt="Current profile photo" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-line text-xs text-muted">None</div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-line bg-surface px-3 text-sm font-semibold">
            Upload
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  setSource(String(reader.result))
                  setOpen(true)
                }
                reader.readAsDataURL(file)
                event.target.value = ''
              }}
            />
          </label>
          {photo && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('', shape)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">A photo is optional. Crop it square, then choose a round or square frame in Design.</p>
      <Modal open={open} onOpenChange={setOpen} title="Crop photo" description="Drag to frame the face. The page shape is set with the template.">
        <div className="relative h-72 overflow-hidden rounded-md bg-[#0B1220]">
          {source && (
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={shape === 'round' ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Zoom
          <input className="mt-1 w-full" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        <div className="mt-3 flex gap-2" role="group" aria-label="Crop frame">
          {(['round', 'rounded', 'square'] as PhotoShape[]).map((option) => (
            <button key={option} type="button" aria-pressed={shape === option} className={`rounded-md border px-3 py-1 text-sm font-semibold capitalize ${shape === option ? 'border-primary bg-primary text-primary-fg' : 'border-line'}`} onClick={() => setShape(option)}>
              {option}
            </button>
          ))}
        </div>
        <Button
          className="mt-4"
          type="button"
          onClick={async () => {
            if (!area || !source) return
            onChange(await cropToDataUrl(source, area), shape)
            setOpen(false)
          }}
        >
          Use this crop
        </Button>
      </Modal>
    </div>
  )
}

async function cropToDataUrl(src: string, area: Area) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const size = 640
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that image.'))
    image.src = src
  })
}

export function ImportButton({
  children,
  onParsed,
  variant = 'secondary',
}: {
  children: ReactNode
  onParsed: (result: ParseResult) => void
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button type="button" variant={variant} onClick={() => ref.current?.click()}>
        <Upload size={16} aria-hidden />
        {children}
      </Button>
      <input
        ref={ref}
        className="sr-only"
        type="file"
        accept=".pdf,.docx,.json,.txt,application/pdf,application/json,text/plain"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          onParsed(await parseResumeFile(file))
        }}
      />
    </>
  )
}

export function SortableStack({
  ids,
  onReorder,
  render,
}: {
  ids: string[]
  onReorder: (ids: string[]) => void
  render: (id: string, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(ids, oldIndex, newIndex))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {ids.map((id) => (
            <SortableRow key={id} id={id} render={render} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ id, render }: { id: string; render: (id: string, handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const handle = (
    <button type="button" className="cursor-grab rounded p-1 text-muted hover:bg-sunken hover:text-text" aria-label="Drag to reorder" {...attributes} {...listeners}>
      <GripVertical size={16} />
    </button>
  )
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      {render(id, handle)}
    </div>
  )
}
