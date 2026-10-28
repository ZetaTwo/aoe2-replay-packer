import { describe, it, expect } from 'vitest'
import { sha256 } from './hash'

describe('sha256', () => {
  it('returns the hex digest of the contents', async () => {
    const contents = new TextEncoder().encode('abc').buffer as ArrayBuffer
    expect(await sha256(contents)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
})
