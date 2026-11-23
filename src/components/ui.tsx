import * as Dialog from '@radix-ui/react-dialog'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import * as Switch from '@radix-ui/react-switch'
import { Slot } from '@radix-ui/react-slot'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { type ButtonHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { useToasts } from '../store/toast'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-[var(--primary-hover)]',
        secondary: 'border border-line bg-surface text-text hover:bg-sunken',
        ghost: 'bg-transparent text-text hover:bg-sunken',
        danger: 'border border-danger bg-transparent text-danger hover:bg-[var(--danger-soft)]',
      },
      size: {
        sm: 'h-8 px-2.5',
        md: 'h-10 px-3.5',
        lg: 'h-11 px-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonStyles({ variant, size }), className)} {...props} />
}

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const fieldId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase()
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  return (
    <label className="block text-sm" htmlFor={fieldId}>
      <span className="mb-1 block font-semibold text-text">{label}</span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'w-full rounded-md border bg-surface px-3 py-2 text-text placeholder:text-muted',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {hint && (
        <span id={hintId} className="mt-1 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="mt-1 block text-xs font-semibold text-danger">
          {error}
        </span>
      )}
    </label>
  )
}

export function TextArea({
  label,
  hint,
  id,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const fieldId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <label className="block text-sm" htmlFor={fieldId}>
      <span className="mb-1 block font-semibold text-text">{label}</span>
      <textarea
        id={fieldId}
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className={cn('min-h-24 w-full rounded-md border border-line bg-surface px-3 py-2 text-text placeholder:text-muted', className)}
        {...props}
      />
      {hint && (
        <span id={`${fieldId}-hint`} className="mt-1 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      )}
    </label>
  )
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0B1220]/70" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[min(88vh,820px)] w-[min(100%-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-line bg-elevated p-5 text-text shadow-[var(--shadow)]',
            wide && 'w-[min(100%-1.5rem,52rem)]',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-xl text-text">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted hover:bg-sunken hover:text-text" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Menu({
  trigger,
  children,
  label,
}: {
  trigger: ReactNode
  children: ReactNode
  label: string
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          aria-label={label}
          className="z-50 min-w-52 rounded-md border border-line bg-elevated p-1 text-sm text-text shadow-[var(--shadow)]"
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

export function MenuItem({
  children,
  onSelect,
  disabled,
}: {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
}) {
  return (
    <Dropdown.Item
      disabled={disabled}
      onSelect={onSelect}
      className="cursor-pointer rounded px-2 py-2 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-muted data-[highlighted]:bg-sunken"
    >
      {children}
    </Dropdown.Item>
  )
}

export function Tip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} className="z-50 max-w-xs rounded-md border border-line bg-elevated px-2.5 py-2 text-xs leading-relaxed text-text shadow-[var(--shadow)]">
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export const TabRoot = Tabs.Root
export const TabList = ({ children, label }: { children: ReactNode; label: string }) => (
  <Tabs.List aria-label={label} className="inline-flex rounded-md border border-line bg-surface p-1">
    {children}
  </Tabs.List>
)
export function TabTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="rounded px-3 py-1.5 text-sm font-semibold text-muted data-[state=active]:bg-primary data-[state=active]:text-primary-fg"
    >
      {children}
    </Tabs.Trigger>
  )
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-text">{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="relative h-6 w-11 rounded-full border border-line bg-sunken data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-fg" />
      </Switch.Root>
    </label>
  )
}

export function Toaster() {
  const toasts = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-[var(--shadow)]',
            toast.tone === 'warn' ? 'border-danger bg-elevated text-text' : 'border-line bg-elevated text-text',
          )}
        >
          <span className={cn('mr-2 inline-block h-2 w-2 rounded-full', toast.tone === 'warn' ? 'bg-danger' : 'bg-primary')} aria-hidden />
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'highlight' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        tone === 'neutral' && 'border-line bg-surface text-text',
        tone === 'good' && 'border-primary bg-primary text-primary-fg',
        tone === 'warn' && 'border-danger bg-[var(--danger-soft)] text-danger',
        tone === 'highlight' && 'border-[#1E293B] bg-highlight text-[var(--highlight-ink)]',
      )}
    >
      {children}
    </span>
  )
}
