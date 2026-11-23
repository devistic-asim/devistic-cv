import { Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Hint, TextField } from '../components/ui'
import {
  LANGUAGE_LEVELS,
  LEVEL_LABELS,
  STANDARD_TITLES,
  blankCertification,
  blankCustomItem,
  blankCustomSection,
  blankEducation,
  blankExperience,
  blankLanguage,
  blankLink,
  blankProject,
  blankSkill,
  sectionLabel,
} from '../lib/defaults'
import { plainToRich, richToText, wordCount } from '../lib/richtext'
import { TIPS } from '../lib/tips'
import type { CVDocument, SectionId } from '../lib/types'
import { PhraseButton, PhotoField, RichField, SortableStack } from './fields'

export function WritePanel({
  doc,
  section,
  onSection,
  update,
}: {
  doc: CVDocument
  section: string
  onSection: (id: string) => void
  update: (recipe: (doc: CVDocument) => void, key?: string) => void
}) {
  if (section === 'outline') return <Outline doc={doc} onSection={onSection} update={update} />
  return (
    <div className="grid gap-4">
      <button type="button" className="w-fit text-sm font-semibold text-muted underline-offset-2 hover:text-text hover:underline" onClick={() => onSection('outline')}>
        All sections
      </button>
      {section === 'personal' && <PersonalForm doc={doc} update={update} />}
      {section === 'summary' && <SummaryForm doc={doc} update={update} />}
      {section === 'experience' && <ExperienceForm doc={doc} update={update} />}
      {section === 'education' && <EducationForm doc={doc} update={update} />}
      {section === 'skills' && <SkillsForm doc={doc} update={update} />}
      {section === 'projects' && <ProjectsForm doc={doc} update={update} />}
      {section === 'certifications' && <CertForm doc={doc} update={update} />}
      {section === 'languages' && <LanguageForm doc={doc} update={update} />}
      {section === 'links' && <LinksForm doc={doc} update={update} />}
      {section.startsWith('custom:') && <CustomForm doc={doc} id={section.slice(7)} update={update} onSection={onSection} />}
    </div>
  )
}

function Outline({
  doc,
  onSection,
  update,
}: {
  doc: CVDocument
  onSection: (id: string) => void
  update: (recipe: (doc: CVDocument) => void, key?: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('Awards')
  return (
    <div className="grid gap-3" data-tour="sections">
      <div>
        <h2 className="font-serif text-xl">Sections</h2>
        <Hint>Drag to reorder. Empty sections stay off the page until you fill them.</Hint>
      </div>
      <button type="button" onClick={() => onSection('personal')} className="rounded-md border border-line bg-surface px-3 py-3 text-left hover:bg-sunken">
        <span className="block font-semibold">Personal details</span>
        <span className="text-xs text-muted">{doc.content.personal.fullName || 'Name, contact, photo'}</span>
      </button>
      <SortableStack
        ids={doc.content.sectionOrder}
        onReorder={(ids) => update((draft) => void (draft.content.sectionOrder = ids as SectionId[]), 'discrete')}
        render={(id, handle) => {
          const hidden = doc.content.hiddenSections.includes(id)
          return (
            <div className="flex items-center gap-1 rounded-md border border-line bg-surface px-1 py-1">
              {handle}
              <button type="button" className="min-w-0 flex-1 px-1 py-1 text-left" onClick={() => onSection(id)}>
                <span className="block truncate font-semibold">{sectionLabel(doc.content, id)}</span>
                <span className="text-xs text-muted">{hidden ? 'Hidden on the page' : 'Shown on the page'}</span>
              </button>
              <button
                type="button"
                aria-label={hidden ? 'Show section' : 'Hide section'}
                className="rounded p-2 text-muted hover:bg-sunken hover:text-text"
                onClick={() =>
                  update((draft) => {
                    draft.content.hiddenSections = hidden
                      ? draft.content.hiddenSections.filter((item) => item !== id)
                      : [...draft.content.hiddenSections, id]
                  }, 'discrete')
                }
              >
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )
        }}
      />
      {adding ? (
        <form
          className="grid gap-2 rounded-md border border-line p-3"
          onSubmit={(event) => {
            event.preventDefault()
            update((draft) => {
              const section = blankCustomSection(title.trim() || 'Additional')
              draft.content.custom.push(section)
              draft.content.sectionOrder.push(`custom:${section.id}`)
            }, 'discrete')
            setAdding(false)
            setTitle('Awards')
          }}
        >
          <TextField label="Section title" value={title} onChange={(event) => setTitle(event.target.value)} hint={TIPS.custom} />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add section</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
          <Plus size={16} /> Custom section
        </Button>
      )}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STANDARD_TITLES) as (keyof typeof STANDARD_TITLES)[]).filter((key) => !doc.content.sectionOrder.includes(key)).map((key) => (
          <Button key={key} type="button" size="sm" variant="ghost" onClick={() => update((draft) => void draft.content.sectionOrder.push(key), 'discrete')}>
            Add {STANDARD_TITLES[key]}
          </Button>
        ))}
      </div>
    </div>
  )
}

function PersonalForm({ doc, update }: FormProps) {
  const personal = doc.content.personal
  const emailError = personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email) ? 'Email needs an @ and a domain.' : undefined
  const set = (key: keyof typeof personal, value: string) =>
    update((draft) => void (draft.content.personal[key] = value), `personal-${key}`)
  return (
    <div className="grid gap-3">
      <h2 className="font-serif text-xl">Personal details</h2>
      <TextField label="Full name" value={personal.fullName} onChange={(event) => set('fullName', event.target.value)} hint={TIPS.fullName} />
      <TextField label="Headline" value={personal.headline} onChange={(event) => set('headline', event.target.value)} hint={TIPS.headline} placeholder="Product engineer, billing systems" />
      <TextField label="Email" type="email" value={personal.email} onChange={(event) => set('email', event.target.value)} hint={TIPS.email} error={emailError} />
      <TextField label="Phone" value={personal.phone} onChange={(event) => set('phone', event.target.value)} hint={TIPS.phone} />
      <TextField label="Location" value={personal.location} onChange={(event) => set('location', event.target.value)} hint={TIPS.location} />
      <TextField label="Website" value={personal.website} onChange={(event) => set('website', event.target.value)} hint={TIPS.website} placeholder="https://" />
      <PhotoField photo={personal.photo} onChange={(photo, shape) => update((draft) => {
        draft.content.personal.photo = photo
        draft.design.photoShape = shape
        draft.design.showPhoto = Boolean(photo)
      }, 'discrete')} />
    </div>
  )
}

function SummaryForm({ doc, update }: FormProps) {
  const words = wordCount(richToText(doc.content.summary))
  return (
    <div className="grid gap-3">
      <h2 className="font-serif text-xl">Summary</h2>
      <RichField label="Summary" value={doc.content.summary} onChange={(value) => update((draft) => void (draft.content.summary = value), 'summary')} hint={TIPS.summary} placeholder="What you do, who it is for, and one proof." />
      <p className="text-xs text-muted">{words} words · 40–80 is a useful range</p>
    </div>
  )
}

function ExperienceForm({ doc, update }: FormProps) {
  const items = doc.content.experience
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl">Experience</h2>
        <Button type="button" size="sm" onClick={() => update((draft) => void draft.content.experience.unshift(blankExperience()), 'discrete')}>
          <Plus size={16} /> Role
        </Button>
      </div>
      <Hint>{TIPS.experience}</Hint>
      {items.length === 0 && <Empty text="No roles yet. Add the most recent one first." />}
      <SortableStack
        ids={items.map((item) => item.id)}
        onReorder={(ids) => update((draft) => {
          draft.content.experience = ids.map((id) => draft.content.experience.find((item) => item.id === id)!).filter(Boolean)
        }, 'discrete')}
        render={(id, handle) => {
          const item = items.find((entry) => entry.id === id)!
          const patch = (recipe: (entry: typeof item) => void, key: string) =>
            update((draft) => {
              const target = draft.content.experience.find((entry) => entry.id === id)
              if (target) recipe(target)
            }, key)
          return (
            <article className="grid gap-2 rounded-md border border-line bg-surface p-3">
              <div className="flex items-center justify-between">
                {handle}
                <div className="flex gap-1">
                  <IconButton label="Duplicate role" onClick={() => update((draft) => {
                    const index = draft.content.experience.findIndex((entry) => entry.id === id)
                    const copy = { ...structuredClone(draft.content.experience[index]), id: blankExperience().id }
                    draft.content.experience.splice(index + 1, 0, copy)
                  }, 'discrete')}><Copy size={15} /></IconButton>
                  <IconButton label="Delete role" onClick={() => update((draft) => {
                    draft.content.experience = draft.content.experience.filter((entry) => entry.id !== id)
                  }, 'discrete')}><Trash2 size={15} /></IconButton>
                </div>
              </div>
              <TextField label="Role" value={item.role} onChange={(event) => patch((entry) => void (entry.role = event.target.value), `role-${id}`)} />
              <TextField label="Company" value={item.company} onChange={(event) => patch((entry) => void (entry.company = event.target.value), `company-${id}`)} />
              <TextField label="Location" value={item.location} onChange={(event) => patch((entry) => void (entry.location = event.target.value), `loc-${id}`)} />
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Start" placeholder="2022-04" value={item.start} onChange={(event) => patch((entry) => void (entry.start = event.target.value), `start-${id}`)} hint={TIPS.dates} />
                <TextField label="End" placeholder="2024-08" value={item.end} disabled={item.current} onChange={(event) => patch((entry) => void (entry.end = event.target.value), `end-${id}`)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={item.current} onChange={(event) => patch((entry) => {
                  entry.current = event.target.checked
                  if (entry.current) entry.end = ''
                }, 'discrete')} />
                I currently work here
              </label>
              <RichField label="Notes" value={item.summary} onChange={(value) => patch((entry) => void (entry.summary = value), `sum-${id}`)} placeholder="Optional context before the bullets." />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Bullets</span>
                <PhraseButton role={item.role} onInsert={(phrase) => patch((entry) => void entry.bullets.push(plainToRich(phrase)), 'discrete')} />
              </div>
              <Hint>{TIPS.bullets}</Hint>
              {item.bullets.map((bullet, index) => (
                <div key={`${id}-b-${index}`} className="grid gap-1">
                  <RichField label={`Bullet ${index + 1}`} value={bullet} onChange={(value) => patch((entry) => void (entry.bullets[index] = value), `b-${id}-${index}`)} />
                  <button type="button" className="w-fit text-xs font-semibold text-danger" onClick={() => patch((entry) => void entry.bullets.splice(index, 1), 'discrete')}>
                    Remove bullet
                  </button>
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={() => patch((entry) => void entry.bullets.push(''), 'discrete')}>
                <Plus size={14} /> Bullet
              </Button>
            </article>
          )
        }}
      />
    </div>
  )
}

function EducationForm({ doc, update }: FormProps) {
  return (
    <ItemList
      title="Education"
      hint={TIPS.education}
      empty="No schools yet."
      ids={doc.content.education.map((item) => item.id)}
      onAdd={() => update((draft) => void draft.content.education.push(blankEducation()), 'discrete')}
      onReorder={(ids) => update((draft) => {
        draft.content.education = ids.map((id) => draft.content.education.find((item) => item.id === id)!).filter(Boolean)
      }, 'discrete')}
      render={(id) => {
        const item = doc.content.education.find((entry) => entry.id === id)!
        const patch = (key: keyof typeof item, value: string) => update((draft) => {
          const target = draft.content.education.find((entry) => entry.id === id)
          if (target) (target[key] as string) = value
        }, `${key}-${id}`)
        return (
          <div className="grid gap-2">
            <TextField label="School" value={item.school} onChange={(event) => patch('school', event.target.value)} />
            <TextField label="Degree" value={item.degree} onChange={(event) => patch('degree', event.target.value)} />
            <TextField label="Field" value={item.field} onChange={(event) => patch('field', event.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Start" value={item.start} onChange={(event) => patch('start', event.target.value)} />
              <TextField label="End" value={item.end} onChange={(event) => patch('end', event.target.value)} />
            </div>
            <RichField label="Details" value={item.details} onChange={(value) => patch('details', value)} />
            <Delete label="Delete education" onClick={() => update((draft) => {
              draft.content.education = draft.content.education.filter((entry) => entry.id !== id)
            }, 'discrete')} />
          </div>
        )
      }}
    />
  )
}

function SkillsForm({ doc, update }: FormProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Skills</h2>
        <Button type="button" size="sm" onClick={() => update((draft) => void draft.content.skills.push(blankSkill()), 'discrete')}><Plus size={16} /> Skill</Button>
      </div>
      <Hint>{TIPS.skills}</Hint>
      {doc.content.skills.length === 0 && <Empty text="Name the tools you could use next week." />}
      <SortableStack
        ids={doc.content.skills.map((skill) => skill.id)}
        onReorder={(ids) => update((draft) => {
          draft.content.skills = ids.map((id) => draft.content.skills.find((skill) => skill.id === id)!).filter(Boolean)
        }, 'discrete')}
        render={(id, handle) => {
          const skill = doc.content.skills.find((item) => item.id === id)!
          return (
            <div className="flex items-start gap-2 rounded-md border border-line bg-surface p-2">
              {handle}
              <div className="grid flex-1 gap-2">
                <TextField label="Skill" value={skill.name} onChange={(event) => update((draft) => {
                  const target = draft.content.skills.find((item) => item.id === id)
                  if (target) target.name = event.target.value
                }, `skill-${id}`)} />
                <label className="text-sm">
                  <span className="mb-1 block font-semibold">Level</span>
                  <select
                    className="w-full rounded-md border border-line bg-surface px-2 py-2"
                    value={skill.level}
                    aria-describedby="skill-level-hint"
                    onChange={(event) => update((draft) => {
                      const target = draft.content.skills.find((item) => item.id === id)
                      if (target) target.level = Number(event.target.value)
                    }, 'discrete')}
                  >
                    {LEVEL_LABELS.map((label, index) => (
                      <option key={label || 'none'} value={index}>{label || 'No level shown'}</option>
                    ))}
                  </select>
                  <span id="skill-level-hint" className="mt-1 block text-xs text-muted">{TIPS.skillLevel}</span>
                </label>
              </div>
              <IconButton label="Delete skill" onClick={() => update((draft) => {
                draft.content.skills = draft.content.skills.filter((item) => item.id !== id)
              }, 'discrete')}><Trash2 size={15} /></IconButton>
            </div>
          )
        }}
      />
    </div>
  )
}

function ProjectsForm({ doc, update }: FormProps) {
  return (
    <ItemList
      title="Projects"
      hint={TIPS.projects}
      empty="No projects yet."
      ids={doc.content.projects.map((item) => item.id)}
      onAdd={() => update((draft) => void draft.content.projects.push(blankProject()), 'discrete')}
      onReorder={(ids) => update((draft) => {
        draft.content.projects = ids.map((id) => draft.content.projects.find((item) => item.id === id)!).filter(Boolean)
      }, 'discrete')}
      render={(id) => {
        const item = doc.content.projects.find((entry) => entry.id === id)!
        const patch = (key: 'name' | 'url' | 'role' | 'start' | 'end' | 'description', value: string) => update((draft) => {
          const target = draft.content.projects.find((entry) => entry.id === id)
          if (target) target[key] = value
        }, `${key}-${id}`)
        return (
          <div className="grid gap-2">
            <TextField label="Name" value={item.name} onChange={(event) => patch('name', event.target.value)} />
            <TextField label="URL" value={item.url} onChange={(event) => patch('url', event.target.value)} />
            <TextField label="Your role" value={item.role} onChange={(event) => patch('role', event.target.value)} />
            <RichField label="Description" value={item.description} onChange={(value) => patch('description', value)} />
            <Delete label="Delete project" onClick={() => update((draft) => {
              draft.content.projects = draft.content.projects.filter((entry) => entry.id !== id)
            }, 'discrete')} />
          </div>
        )
      }}
    />
  )
}

function CertForm({ doc, update }: FormProps) {
  return (
    <ItemList
      title="Certifications"
      hint={TIPS.certifications}
      empty="No certificates yet."
      ids={doc.content.certifications.map((item) => item.id)}
      onAdd={() => update((draft) => void draft.content.certifications.push(blankCertification()), 'discrete')}
      onReorder={(ids) => update((draft) => {
        draft.content.certifications = ids.map((id) => draft.content.certifications.find((item) => item.id === id)!).filter(Boolean)
      }, 'discrete')}
      render={(id) => {
        const item = doc.content.certifications.find((entry) => entry.id === id)!
        const patch = (key: 'name' | 'issuer' | 'date' | 'url', value: string) => update((draft) => {
          const target = draft.content.certifications.find((entry) => entry.id === id)
          if (target) target[key] = value
        }, `${key}-${id}`)
        return (
          <div className="grid gap-2">
            <TextField label="Name" value={item.name} onChange={(event) => patch('name', event.target.value)} />
            <TextField label="Issuer" value={item.issuer} onChange={(event) => patch('issuer', event.target.value)} />
            <TextField label="Date" value={item.date} onChange={(event) => patch('date', event.target.value)} />
            <Delete label="Delete certificate" onClick={() => update((draft) => {
              draft.content.certifications = draft.content.certifications.filter((entry) => entry.id !== id)
            }, 'discrete')} />
          </div>
        )
      }}
    />
  )
}

function LanguageForm({ doc, update }: FormProps) {
  return (
    <ItemList
      title="Languages"
      hint={TIPS.languages}
      empty="No languages yet."
      ids={doc.content.languages.map((item) => item.id)}
      onAdd={() => update((draft) => void draft.content.languages.push(blankLanguage()), 'discrete')}
      onReorder={(ids) => update((draft) => {
        draft.content.languages = ids.map((id) => draft.content.languages.find((item) => item.id === id)!).filter(Boolean)
      }, 'discrete')}
      render={(id) => {
        const item = doc.content.languages.find((entry) => entry.id === id)!
        return (
          <div className="grid gap-2">
            <TextField label="Language" value={item.name} onChange={(event) => update((draft) => {
              const target = draft.content.languages.find((entry) => entry.id === id)
              if (target) target.name = event.target.value
            }, `lang-${id}`)} />
            <label className="text-sm font-semibold">
              Level
              <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={item.level} onChange={(event) => update((draft) => {
                const target = draft.content.languages.find((entry) => entry.id === id)
                if (target) target.level = event.target.value
              }, 'discrete')}>
                <option value="">Choose a level</option>
                {LANGUAGE_LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <Delete label="Delete language" onClick={() => update((draft) => {
              draft.content.languages = draft.content.languages.filter((entry) => entry.id !== id)
            }, 'discrete')} />
          </div>
        )
      }}
    />
  )
}

function LinksForm({ doc, update }: FormProps) {
  return (
    <ItemList
      title="Links"
      hint={TIPS.links}
      empty="No extra links yet. Your website lives in personal details."
      ids={doc.content.links.map((item) => item.id)}
      onAdd={() => update((draft) => void draft.content.links.push(blankLink()), 'discrete')}
      onReorder={(ids) => update((draft) => {
        draft.content.links = ids.map((id) => draft.content.links.find((item) => item.id === id)!).filter(Boolean)
      }, 'discrete')}
      render={(id) => {
        const item = doc.content.links.find((entry) => entry.id === id)!
        return (
          <div className="grid gap-2">
            <TextField label="Label" value={item.label} onChange={(event) => update((draft) => {
              const target = draft.content.links.find((entry) => entry.id === id)
              if (target) target.label = event.target.value
            }, `label-${id}`)} />
            <TextField label="URL" value={item.url} onChange={(event) => update((draft) => {
              const target = draft.content.links.find((entry) => entry.id === id)
              if (target) target.url = event.target.value
            }, `url-${id}`)} />
            <Delete label="Delete link" onClick={() => update((draft) => {
              draft.content.links = draft.content.links.filter((entry) => entry.id !== id)
            }, 'discrete')} />
          </div>
        )
      }}
    />
  )
}

function CustomForm({ doc, id, update, onSection }: FormProps & { id: string; onSection: (id: string) => void }) {
  const section = doc.content.custom.find((item) => item.id === id)
  if (!section) return <Empty text="That section was removed." />
  return (
    <div className="grid gap-3">
      <TextField label="Section title" value={section.title} onChange={(event) => update((draft) => {
        const target = draft.content.custom.find((item) => item.id === id)
        if (target) target.title = event.target.value
      }, `custom-title-${id}`)} hint={TIPS.custom} />
      {section.items.map((item) => (
        <div key={item.id} className="grid gap-2 rounded-md border border-line p-3">
          <TextField label="Title" value={item.title} onChange={(event) => update((draft) => {
            const target = draft.content.custom.find((entry) => entry.id === id)?.items.find((entry) => entry.id === item.id)
            if (target) target.title = event.target.value
          }, `ct-${item.id}`)} />
          <TextField label="Subtitle" value={item.subtitle} onChange={(event) => update((draft) => {
            const target = draft.content.custom.find((entry) => entry.id === id)?.items.find((entry) => entry.id === item.id)
            if (target) target.subtitle = event.target.value
          }, `cs-${item.id}`)} />
          <TextField label="Meta" value={item.meta} onChange={(event) => update((draft) => {
            const target = draft.content.custom.find((entry) => entry.id === id)?.items.find((entry) => entry.id === item.id)
            if (target) target.meta = event.target.value
          }, `cm-${item.id}`)} placeholder="2024 · City" />
          <RichField label="Body" value={item.body} onChange={(value) => update((draft) => {
            const target = draft.content.custom.find((entry) => entry.id === id)?.items.find((entry) => entry.id === item.id)
            if (target) target.body = value
          }, `cb-${item.id}`)} />
          <Delete label="Delete item" onClick={() => update((draft) => {
            const target = draft.content.custom.find((entry) => entry.id === id)
            if (target) target.items = target.items.filter((entry) => entry.id !== item.id)
          }, 'discrete')} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => update((draft) => {
          draft.content.custom.find((entry) => entry.id === id)?.items.push(blankCustomItem())
        }, 'discrete')}>Add item</Button>
        <Button type="button" size="sm" variant="danger" onClick={() => {
          update((draft) => {
            draft.content.custom = draft.content.custom.filter((entry) => entry.id !== id)
            draft.content.sectionOrder = draft.content.sectionOrder.filter((entry) => entry !== `custom:${id}`)
          }, 'discrete')
          onSection('outline')
        }}>Delete section</Button>
      </div>
    </div>
  )
}

function ItemList({
  title,
  hint,
  empty,
  ids,
  onAdd,
  onReorder,
  render,
}: {
  title: string
  hint: string
  empty: string
  ids: string[]
  onAdd: () => void
  onReorder: (ids: string[]) => void
  render: (id: string) => ReactNode
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">{title}</h2>
        <Button type="button" size="sm" onClick={onAdd}><Plus size={16} /> Add</Button>
      </div>
      <Hint>{hint}</Hint>
      {ids.length === 0 && <Empty text={empty} />}
      <SortableStack
        ids={ids}
        onReorder={onReorder}
        render={(id, handle) => (
          <div className="rounded-md border border-line bg-surface p-3">
            <div className="mb-2">{handle}</div>
            {render(id)}
          </div>
        )}
      />
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-line px-3 py-6 text-sm text-muted">{text}</p>
}

function Delete({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="w-fit text-xs font-semibold text-danger" onClick={onClick}>
      {label}
    </button>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} className="rounded p-2 text-muted hover:bg-sunken hover:text-text" onClick={onClick}>
      {children}
    </button>
  )
}

type FormProps = {
  doc: CVDocument
  update: (recipe: (doc: CVDocument) => void, key?: string) => void
}
