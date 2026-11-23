import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-bg text-text">
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="Devistic CV home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-3 sm:flex" aria-label="Primary">
            <a className="text-sm font-semibold text-muted hover:text-text" href="/#templates">Templates</a>
            <a className="text-sm font-semibold text-muted hover:text-text" href="/#method">How it works</a>
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
            <a href="/#templates" onClick={() => setOpen(false)}>Templates</a>
            <a href="/#method" onClick={() => setOpen(false)}>How it works</a>
            <Link to="/documents" onClick={() => setOpen(false)}>Documents</Link>
            <ThemeToggle />
          </nav>
        )}
      </header>
      <main id="content">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
          <Logo />
          <p>Your CV stays in this browser. No account. No model.</p>
        </div>
      </footer>
    </div>
  )
}
