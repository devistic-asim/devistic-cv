import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/cn'
import { useTheme, type ThemeChoice } from '../store/theme'

const OPTIONS: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [choice, setChoice] = useTheme()
  return (
    <fieldset className="inline-flex rounded-md border border-line bg-surface p-0.5" aria-label="Color theme">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = choice === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => setChoice(option.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-semibold',
              active ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text',
            )}
          >
            <Icon size={14} aria-hidden />
            {compact ? <span className="sr-only">{option.label}</span> : option.label}
          </button>
        )
      })}
    </fieldset>
  )
}
