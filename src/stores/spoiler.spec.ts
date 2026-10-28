import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { extractRecordings } from '@/lib/archive'
import { useSpoilerStore } from './spoiler'

vi.mock('@/lib/archive', () => ({ extractRecordings: vi.fn() }))

const extractMock = vi.mocked(extractRecordings)

function recFile(name: string) {
  return new File(['rec'], name)
}

describe('spoiler store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    extractMock.mockReset()
  })

  it('adds and clears recordings', async () => {
    const store = useSpoilerStore()
    await store.addRecording(recFile('a.aoe2record'))
    expect(store.recordings.map((file) => file.name)).toEqual(['a.aoe2record'])
    await store.clearRecordings()
    expect(store.recordings).toEqual([])
  })

  it('adds the recordings of an archive', async () => {
    extractMock.mockResolvedValue([recFile('a.aoe2record'), recFile('b.aoe2record')])
    const store = useSpoilerStore()
    const archive = new File(['zip'], 'replays.zip')
    await store.expandArchive(archive)
    expect(extractMock).toHaveBeenCalledWith(archive)
    expect(store.recordings.map((file) => file.name)).toEqual(['a.aoe2record', 'b.aoe2record'])
  })
})
