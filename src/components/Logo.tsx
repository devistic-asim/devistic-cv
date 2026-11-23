import { cn } from '../lib/cn'

export function LogoMark({ size = 28, title = 'Devistic' }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title}>
      <rect width="32" height="32" rx="8" fill="#1E293B" />
      <rect x="8" y="6.5" width="16" height="19" rx="1.5" fill="#F5F9FC" />
      <rect x="8" y="6.5" width="3.2" height="19" fill="#20B683" />
      <rect x="13.2" y="11.5" width="8" height="1.6" rx="0.4" fill="#1E293B" />
      <rect x="13.2" y="15.2" width="6.6" height="1.6" rx="0.4" fill="#637285" />
      <rect x="13.2" y="18.9" width="4.8" height="1.6" rx="0.4" fill="#3BC1E6" />
    </svg>
  )
}

export function Logo({ className, word = true }: { className?: string; word?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {word && (
        <span className="text-[1.05rem] font-semibold tracking-tight text-text">
          Devistic <span className="font-medium text-muted">CV</span>
        </span>
      )}
    </span>
  )
}
