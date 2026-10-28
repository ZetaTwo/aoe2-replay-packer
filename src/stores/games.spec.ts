import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { parse_rec_summary } from 'aoe2rec-js'
import { extractRecordings } from '@/lib/archive'
import { useGamesStore } from './games'
import { makeRecording } from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))
vi.mock('@/lib/archive', () => ({ extractRecordings: vi.fn() }))

const parseMock = vi.mocked(parse_rec_summary)

const ALICE = { name: 'Alice', profile: 1 }
const BOB = { name: 'Bob', profile: 2 }
const CAROL = { name: 'Carol', profile: 3 }
const DAVE = { name: 'Dave', profile: 4 }
const extractMock = vi.mocked(extractRecordings)

function recFile(name = 'game.aoe2record') {
  return new File(['rec'], name)
}

describe('games store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    parseMock.mockReset()
    parseMock.mockReturnValue(makeRecording())
  })

  describe('hasGames', () => {
    it('is false initially', () => {
      expect(useGamesStore().hasGames).toBe(false)
    })

    it('is true after adding a recording', async () => {
      const store = useGamesStore()
      await store.addRec(recFile())
      expect(store.hasGames).toBe(true)
    })

    it('is false again after clearing the only game', async () => {
      const store = useGamesStore()
      await store.addRec(recFile())
      store.clearGame(0)
      expect(store.hasGames).toBe(false)
    })
  })

  describe('addRec', () => {
    it('parses the contents of the file', async () => {
      await useGamesStore().addRec(new File(['recording bytes'], 'game.aoe2record'))
      const buffer = parseMock.mock.calls[0]![0] as ArrayBuffer
      expect(new TextDecoder().decode(buffer)).toBe('recording bytes')
    })

    it('dates an unparseable recording by its file modification time', async () => {
      parseMock.mockImplementation(() => {
        throw new Error('unsupported version')
      })
      const store = useGamesStore()
      await store.addRec(new File(['rec'], 'broken.aoe2record', { lastModified: 1700000000000 }))
      expect(store.games[0]?.isUnparseable()).toBe(true)
      expect(store.games[0]?.date).toEqual(new Date(1700000000000))
    })
  })

  describe('expandArchive', () => {
    it('adds every recording in the archive', async () => {
      extractMock.mockResolvedValue([recFile('a.aoe2record'), recFile('b.aoe2record')])
      parseMock
        .mockReturnValueOnce(makeRecording({ teams: [[ALICE], [BOB]] }))
        .mockReturnValueOnce(makeRecording({ teams: [[CAROL], [DAVE]] }))
      const store = useGamesStore()
      await store.expandArchive(new File(['zip'], 'replays.zip'))
      expect(store.realGamesCount).toBe(2)
    })
  })
})
