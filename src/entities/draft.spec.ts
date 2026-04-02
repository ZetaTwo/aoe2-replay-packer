import { describe, it, expect } from 'vitest'
import { extractDraftId, extractDraftUrl, getDraftTypeLabel } from './draft'
import type { draft } from './draft'

describe('extractDraftId', () => {
  it('extracts the draft ID from a full URL', () => {
    expect(extractDraftId('https://aoe2cm.net/draft/abc123')).toBe('abc123')
  })

  it('returns the input as-is when it is not a URL', () => {
    expect(extractDraftId('abc123')).toBe('abc123')
  })

  it('returns empty string for undefined', () => {
    expect(extractDraftId(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(extractDraftId('')).toBe('')
  })
})

describe('extractDraftUrl', () => {
  it('returns normalized URL from a full URL', () => {
    expect(extractDraftUrl('https://aoe2cm.net/draft/abc123')).toBe(
      'https://aoe2cm.net/draft/abc123'
    )
  })

  it('constructs URL from a bare draft ID', () => {
    expect(extractDraftUrl('abc123')).toBe('https://aoe2cm.net/draft/abc123')
  })

  it('returns empty string for undefined', () => {
    expect(extractDraftUrl(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(extractDraftUrl('')).toBe('')
  })
})

describe('getDraftTypeLabel', () => {
  const mockDraft = (presetId: string): draft => ({
    draftId: 'draft1',
    presetId,
    ts: 0,
    title: 'Test',
    nameHost: 'Host',
    nameGuest: 'Guest'
  })

  it('returns "Maps:" for a map preset', () => {
    expect(getDraftTypeLabel(mockDraft('map-preset'), ['map-preset'], [])).toBe('Maps:')
  })

  it('returns "Civs:" for a civ preset', () => {
    expect(getDraftTypeLabel(mockDraft('civ-preset'), [], ['civ-preset'])).toBe('Civs:')
  })

  it('returns empty string for unknown preset', () => {
    expect(getDraftTypeLabel(mockDraft('unknown'), ['other'], ['another'])).toBe('')
  })

  it('prefers map label when preset appears in both lists', () => {
    expect(getDraftTypeLabel(mockDraft('preset'), ['preset'], ['preset'])).toBe('Maps:')
  })
})
