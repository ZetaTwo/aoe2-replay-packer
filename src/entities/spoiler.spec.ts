import { describe, it, expect } from 'vitest'
import { paddedRecordName, paddedSize, padRecording, spoilerZipName } from './spoiler'

const TARGET_SIZE = Math.round(1024 * 1024 * 9.75)

describe('paddedRecordName', () => {
  it('adds a suffix before the extension', () => {
    expect(paddedRecordName('Alice_vs_Bob_G1.aoe2record')).toBe('Alice_vs_Bob_G1_padded.aoe2record')
  })

  it('adds the extension when it is missing', () => {
    expect(paddedRecordName('game')).toBe('game_padded.aoe2record')
  })
})

describe('paddedSize', () => {
  it('is zero without recordings', () => {
    expect(paddedSize([])).toBe(0)
  })

  it('is at least the target size', () => {
    expect(paddedSize([new Blob(['small'])])).toBe(TARGET_SIZE)
  })

  it('is the largest recording when it exceeds the target size', () => {
    const large = { size: TARGET_SIZE + 1 } as Blob
    expect(paddedSize([new Blob(['small']), large])).toBe(TARGET_SIZE + 1)
  })
})

describe('padRecording', () => {
  it('pads the recording to the target size plus the padding trailer', () => {
    const padded = padRecording(new Blob(['rec']), 100)
    expect(padded.size).toBe(100 + 4 + 'AOE2_PAD'.length)
  })

  it('keeps a recording larger than the target size', () => {
    const recording = new Blob(['a longer recording'])
    expect(padRecording(recording, 5)).toBe(recording)
  })
})

describe('spoilerZipName', () => {
  it('uses the match name of packer file names', () => {
    expect(spoilerZipName(['Alice_vs_Bob_G1.aoe2record', 'Alice_vs_Bob_G2.aoe2record'])).toBe(
      'Alice_vs_Bob'
    )
  })

  it('falls back to a generic name without a common prefix', () => {
    expect(spoilerZipName(['a.aoe2record', 'b.aoe2record'])).toBe('padded-recordings.zip')
  })
})
