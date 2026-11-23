import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GITHUB_PROFILE, GITHUB_REPO } from '../lib/site'
import { BrandLockup } from './BrandLockup'
import { ClearDataButton } from './ClearDataButton'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-full bg-bg text-text">
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <BrandLockup />
          <nav className="hidden items-center gap-3 sm:flex" aria-label="Primary">
            <Link className="text-sm font-semibold text-muted hover:text-text" to={{ pathname: '/', hash: '#templates' }}>Templates</Link>
            <Link className="text-sm font-semibold text-muted hover:text-text" to={{ pathname: '/', hash: '#method' }}>How it works</Link>
            <Link className="text-sm font-semibold text-muted hover:text-text" to="/documents">Documents</Link>
            <ThemeToggle />
            <Button asChild>
              <Link to="/documents">Open the editor</Link>
            </Button>
          </nav>
          <button type="button" className="rounded-md border border-line p-2 sm:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen((value) => !value)}>
            <Menu size={18} />
          </button>
        </div>
        {open && (
          <nav className="grid gap-2 border-t border-line px-4 py-3 sm:hidden" aria-label="Mobile">
            <Link to={{ pathname: '/', hash: '#templates' }} onClick={() => setOpen(false)}>Templates</Link>
            <Link to={{ pathname: '/', hash: '#method' }} onClick={() => setOpen(false)}>How it works</Link>
            <Link to="/documents" onClick={() => setOpen(false)}>Documents</Link>
            <ThemeToggle />
          </nav>
        )}
      </header>
      <main id="content">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm">
          <a className="font-semibold text-text underline-offset-2 hover:underline" href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
            github.com/devistic-asim
          </a>
          <div className="flex flex-wrap items-center gap-3">
            <a className="font-semibold text-text underline-offset-2 hover:underline" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              Star or contribute
            </a>
            <ClearDataButton />
          </div>
        </div>
      </footer>
    </div>
  )
}
