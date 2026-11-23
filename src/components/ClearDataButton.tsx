import { useState } from 'react'
import { TIPS } from '../lib/tips'
import { useCvStore } from '../store/useCvStore'
import { Button, Modal } from './ui'

export function ClearDataButton({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false)
  const clearLocal = useCvStore((state) => state.clearLocal)

  return (
    <>
      <Button type="button" size={size} variant="ghost" onClick={() => setOpen(true)}>
        Clear my local data
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Clear my local data?"
        description={TIPS.clearData}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              clearLocal()
              window.location.assign(import.meta.env.BASE_URL)
            }}
          >
            Clear everything
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Keep it
          </Button>
        </div>
      </Modal>
    </>
  )
}
