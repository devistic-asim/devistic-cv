import { describe, expect, it } from 'vitest'
import { PRIVACY_NOTICE } from './site'

describe('privacy copy', () => {
  it('states that nothing is tracked or stored on a server', () => {
    expect(PRIVACY_NOTICE).toBe(
      "We don't use cookies for tracking and we don't collect or store your data on any server. Everything stays in your browser on this device.",
    )
  })
})
