import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Button, Hint, TextArea, TextField, Toggle } from '../components/ui'
import { ImportButton } from '../editor/fields'
import { autoArrange } from '../lib/autoLayout'
import { blankEducation, blankExperience, createDocument, emptyContent } from '../lib/defaults'
import { plainToRich } from '../lib/richtext'
import { TIPS } from '../lib/tips'
import { pushToast } from '../store/toast'
import { useCvStore } from '../store/useCvStore'

type Job = { role: string; company: string; start: string; end: string; current: boolean; bullet: string }
type School = { school: string; degree: string; start: string; end: string }

const STEPS = ['Aim', 'Contact', 'Summary', 'Experience', 'Study and skills']

export function Wizard() {
  const navigate = useNavigate()
  const create = useCvStore((state) => state.create)
  const importParsed = useCvStore((state) => state.importParsed)
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [pages, setPages] = useState<1 | 2>(1)
  const [ats, setAts] = useState(true)
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [jobs, setJobs] = useState<Job[]>([{ role: '', company: '', start: '', end: '', current: true, bullet: '' }])
  const [schools, setSchools] = useState<School[]>([{ school: '', degree: '', start: '', end: '' }])
  const [skills, setSkills] = useState('')

  function finish() {
    const content = emptyContent()
    content.personal = { ...content.personal, fullName: name, headline: headline || role, email, phone, location }
    content.summary = plainToRich(summary)
    content.experience = jobs.filter((job) => job.role || job.company).map((job) => {
      const item = blankExperience()
      item.role = job.role
      item.company = job.company
      item.start = job.start
      item.end = job.end
      item.current = job.current
      item.bullets = job.bullet.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => plainToRich(line))
      return item
    })
    content.education = schools.filter((school) => school.school || school.degree).map((school) => {
      const item = blankEducation()
      item.school = school.school
      item.degree = school.degree
      item.start = school.start
      item.end = school.end
      return item
    })
    content.skills = skills.split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => ({ id: blankExperience().id, name: skill, level: 0, group: '' }))
    const arranged = autoArrange(content, { targetPages: pages, preferAts: ats, roleHint: role || headline })
    const doc = createDocument({
      name: name || 'Untitled CV',
      content: arranged.content,
      design: arranged.design,
    })
    create(doc)
    navigate(`/editor/${doc.id}`, { state: { notes: arranged.notes } })
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
          <ol className="flex gap-2">
            <li><Link to="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/documents">Documents</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-text">Auto-build</li>
          </ol>
        </nav>
        <h1 className="font-serif text-4xl">Auto-build</h1>
        <p className="mt-2 text-muted">Answer a short form. Rules choose the template, the section order, the date style, and how tightly the type sits on the page.</p>
        <ol className="mt-4 flex flex-wrap gap-2" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button type="button" className={`rounded-full border px-3 py-1 text-xs font-semibold ${index === step ? 'border-primary bg-primary text-primary-fg' : 'border-line'}`} onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined}>
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 rounded-lg border border-line bg-surface p-4">
          {step === 0 && (
            <>
              <TextField label="Target role" value={role} onChange={(event) => setRole(event.target.value)} hint="Used only to choose a template and section order." placeholder="Product engineer" />
              <label className="text-sm font-semibold">
                Pages to aim for
                <select className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-2 font-normal" value={pages} onChange={(event) => setPages(Number(event.target.value) as 1 | 2)}>
                  <option value={1}>One page</option>
                  <option value={2}>Two pages</option>
                </select>
              </label>
              <Toggle label="Prefer a single-column, portal-friendly template" checked={ats} onCheckedChange={setAts} />
              <Hint>{TIPS.import}</Hint>
              <ImportButton
                onParsed={(result) => {
                  const imported = importParsed(result, { targetPages: pages, preferAts: ats, roleHint: role })
                  pushToast('File read. Review every section.')
                  navigate(`/editor/${imported.id}`, { state: { notes: imported.notes } })
                }}
              >
                Upload a PDF, DOCX, or JSON instead
              </ImportButton>
            </>
          )}
          {step === 1 && (
            <>
              <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} hint={TIPS.fullName} />
              <TextField label="Headline" value={headline} onChange={(event) => setHeadline(event.target.value)} hint={TIPS.headline} />
              <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} hint={TIPS.email} />
              <TextField label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <TextField label="Location" value={location} onChange={(event) => setLocation(event.target.value)} />
            </>
          )}
          {step === 2 && (
            <TextArea label="Summary" value={summary} onChange={(event) => setSummary(event.target.value)} hint={TIPS.summary} />
          )}
          {step === 3 && (
            <div className="grid gap-4">
              <Hint>{TIPS.bullets}</Hint>
              {jobs.map((job, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-line p-3">
                  <TextField label="Role" value={job.role} onChange={(event) => updateJob(index, { role: event.target.value })} />
                  <TextField label="Company" value={job.company} onChange={(event) => updateJob(index, { company: event.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField label="Start" value={job.start} onChange={(event) => updateJob(index, { start: event.target.value })} placeholder="2022-04" />
                    <TextField label="End" value={job.end} onChange={(event) => updateJob(index, { end: event.target.value })} disabled={job.current} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={job.current} onChange={(event) => updateJob(index, { current: event.target.checked, end: '' })} />
                    Current role
                  </label>
                  <TextArea label="Bullets, one per line" value={job.bullet} onChange={(event) => updateJob(index, { bullet: event.target.value })} />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setJobs([...jobs, { role: '', company: '', start: '', end: '', current: false, bullet: '' }])}>Add another role</Button>
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-3">
              {schools.map((school, index) => (
                <div key={index} className="grid gap-2">
                  <TextField label="School" value={school.school} onChange={(event) => updateSchool(index, { school: event.target.value })} />
                  <TextField label="Degree" value={school.degree} onChange={(event) => updateSchool(index, { degree: event.target.value })} />
                </div>
              ))}
              <TextField label="Skills, separated by commas" value={skills} onChange={(event) => setSkills(event.target.value)} hint={TIPS.skills} />
            </div>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((value) => value + 1)}>Continue</Button>
            ) : (
              <Button type="button" onClick={finish}>Build the CV</Button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )

  function updateJob(index: number, patch: Partial<Job>) {
    setJobs((current) => current.map((job, jobIndex) => (jobIndex === index ? { ...job, ...patch } : job)))
  }

  function updateSchool(index: number, patch: Partial<School>) {
    setSchools((current) => current.map((school, schoolIndex) => (schoolIndex === index ? { ...school, ...patch } : school)))
  }
}
