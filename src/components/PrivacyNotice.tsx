import { useState } from 'react'
import { PRIVACY_NOTICE } from '../lib/site'
import { ClearDataButton } from './ClearDataButton'
import { Button } from './ui'

const KEY = 'devistic-privacy-ack'

export function PrivacyNotice() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== '1'
    } catch {
      return true
    }
  })
  if (!visible) return null
  return (
    <section className="no-print border-b border-line bg-surface px-4 py-3" aria-label="Privacy">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm leading-relaxed text-text">{PRIVACY_NOTICE}</p>
        <div className="flex flex-wrap gap-2">
          <ClearDataButton />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              try {
                localStorage.setItem(KEY, '1')
              } catch {
                /* private mode */
              }
              setVisible(false)
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    </section>
  )
}
