import { useSyncExternalStore } from 'react'
import { uid } from '../lib/id'

export type Toast = { id: string; message: string; tone: 'info' | 'warn' }

let toasts: Toast[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function pushToast(message: string, tone: Toast['tone'] = 'info') {
  const id = uid()
  toasts = [...toasts, { id, message, tone }].slice(-4)
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id)
    emit()
  }, 3400)
}

export function useToasts() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => toasts,
  )
}
