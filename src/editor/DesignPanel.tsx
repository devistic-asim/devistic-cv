import { Badge, Hint, Toggle } from '../components/ui'
import { ACCENT_PRESETS, FONT_OPTIONS } from '../lib/defaults'
import { TIPS } from '../lib/tips'
import type { CVDocument, DateFormat, PhotoShape, TemplateId } from '../lib/types'
import { TEMPLATES } from '../preview/templates'

const DATES: DateFormat[] = ['MMM yyyy', 'MMMM yyyy', 'MM/yyyy', 'yyyy-MM']

export function DesignPanel({
  doc,
  update,
}: {
  doc: CVDocument
  update: (recipe: (doc: CVDocument) => void, key?: string) => void
}) {
  const design = doc.design
  const set = <K extends keyof typeof design>(key: K, value: (typeof design)[K]) =>
    update((draft) => void (draft.design[key] = value), 'discrete')
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="font-serif text-xl">Design</h2>
        <Hint>{TIPS.template}</Hint>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TEMPLATES.map((template) => {
          const active = design.template === template.id
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={active}
              onClick={() => set('template', template.id as TemplateId)}
              className={`rounded-md border p-3 text-left ${active ? 'border-primary bg-surface' : 'border-line bg-surface hover:bg-sunken'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{template.name}</span>
                <Badge tone={template.ats === 'High' ? 'good' : 'highlight'}>{template.ats === 'High' ? 'ATS-safe' : 'Two column'}</Badge>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">{template.description}</span>
            </button>
          )
        })}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Accent</legend>
        <Hint>{TIPS.accent}</Hint>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-label={preset.label}
              aria-pressed={design.accent.toLowerCase() === preset.value}
              className={`h-8 w-8 rounded-full border-2 ${design.accent.toLowerCase() === preset.value ? 'border-text' : 'border-line'}`}
              style={{ background: preset.value }}
              onClick={() => set('accent', preset.value)}
            />
          ))}
          <label className="text-xs font-semibold text-muted">
            Custom
            <input aria-label="Custom accent" className="mt-1 block h-8 w-14 bg-transparent" type="color" value={toColor(design.accent)} onChange={(event) => set('accent', event.target.value)} />
          </label>
        </div>
      </fieldset>
      <label className="text-sm font-semibold">
        Font
        <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={design.font} onChange={(event) => set('font', event.target.value as typeof design.font)}>
          {FONT_OPTIONS.map((font) => (
            <option key={font.id} value={font.id}>{font.label}</option>
          ))}
        </select>
      </label>
      <Slider label="Font size" min={0.86} max={1.12} step={0.02} value={design.fontSize} onChange={(value) => set('fontSize', value)} />
      <Slider label="Line height" min={1.2} max={1.55} step={0.02} value={design.lineHeight} onChange={(value) => set('lineHeight', value)} />
      <Slider label="Spacing" hint={TIPS.spacing} min={0.78} max={1.2} step={0.02} value={design.spacing} onChange={(value) => set('spacing', value)} />
      <Slider label="Margins (mm)" min={10} max={18} step={1} value={design.margin} onChange={(value) => set('margin', value)} />
      <label className="text-sm font-semibold">
        Date format
        <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={design.dateFormat} onChange={(event) => set('dateFormat', event.target.value as DateFormat)}>
          {DATES.map((format) => <option key={format}>{format}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Page size
        <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={design.pageSize} onChange={(event) => set('pageSize', event.target.value as 'a4' | 'letter')}>
          <option value="a4">A4</option>
          <option value="letter">US Letter</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Photo frame
        <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={design.photoShape} onChange={(event) => set('photoShape', event.target.value as PhotoShape)}>
          <option value="round">Round</option>
          <option value="rounded">Rounded square</option>
          <option value="square">Square</option>
        </select>
      </label>
      <Toggle label="Show photo" checked={design.showPhoto} onCheckedChange={(checked) => set('showPhoto', checked)} />
      <Toggle label="Show skill levels" checked={design.showSkillLevels} onCheckedChange={(checked) => set('showSkillLevels', checked)} />
      <label className="text-sm font-semibold">
        Sidebar side
        <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={design.sidebar} onChange={(event) => set('sidebar', event.target.value as 'left' | 'right')}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  )
}

function Slider({ label, hint, min, max, step, value, onChange }: { label: string; hint?: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  const id = label.replace(/\s+/g, '-').toLowerCase()
  return (
    <label className="text-sm font-semibold" htmlFor={id}>
      <span className="flex justify-between"><span>{label}</span><span className="font-normal text-muted">{value}</span></span>
      <input id={id} className="mt-1 w-full accent-[var(--primary)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <span id={`${id}-hint`} className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

function toColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#20b683'
}
