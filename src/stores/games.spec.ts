import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { parse_rec_summary, type SavegameSummary } from 'aoe2rec-js'
import { extractRecordings } from '@/lib/archive'
import { useGamesStore } from './games'
import {
  ALICE,
  BOB,
  CAROL,
  DAVE,
  makeMatch,
  makeRecording,
  mockParsing,
  recFile
} from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))
vi.mock('@/lib/archive', () => ({ extractRecordings: vi.fn() }))

const parseMock = vi.mocked(parse_rec_summary)
const extractMock = vi.mocked(extractRecordings)

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
      mockParsing(parseMock, 'unparseable')
      const store = useGamesStore()
      await store.addRec(recFile('broken.aoe2record', 1700000000000))
      expect(store.games[0]?.isUnparseable()).toBe(true)
      expect(store.games[0]?.date).toEqual(new Date(1700000000000))
    })
  })

  describe('expandArchive', () => {
    it('adds every recording in the archive', async () => {
      extractMock.mockResolvedValue([recFile('a.aoe2record'), recFile('b.aoe2record')])
      mockParsing(parseMock, makeMatch(ALICE, BOB), makeMatch(CAROL, DAVE))
      const store = useGamesStore()
      await store.expandArchive(new File(['zip'], 'replays.zip'))
      expect(store.realGamesCount).toBe(2)
    })
  })

  describe('games', () => {
    // Recordings of distinct matches, in chronological order
    const matchAB = (timestamp = 1000) => makeMatch(ALICE, BOB, { timestamp })
    const matchCD = (timestamp = 2000) => makeMatch(CAROL, DAVE, { timestamp })

    // Adds files rec0, rec1, ... parsing to the given results
    async function addRecordings(...results: (SavegameSummary | 'unparseable')[]) {
      mockParsing(parseMock, ...results)
      const store = useGamesStore()
      for (const idx of results.keys()) {
        await store.addRec(recFile(`rec${idx}.aoe2record`))
      }
      return store
    }

    const replayNames = (store: ReturnType<typeof useGamesStore>) =>
      store.games.map((game) => game.replays.map((replay) => replay.file.name))

    it('starts with three placeholder games', () => {
      const store = useGamesStore()
      expect(store.games).toHaveLength(3)
      expect(store.games.every((game) => game.isDummy())).toBe(true)
    })

    it('fills placeholder games with new games', async () => {
      const store = await addRecordings(matchAB())
      expect(replayNames(store)).toEqual([['rec0.aoe2record'], [], []])
    })

    it('adds games beyond the placeholders', async () => {
      const store = await addRecordings(
        matchAB(1),
        matchCD(2),
        makeMatch(ALICE, CAROL, { timestamp: 3 }),
        makeMatch(BOB, DAVE, { timestamp: 4 })
      )
      expect(store.games).toHaveLength(4)
      expect(store.realGamesCount).toBe(4)
    })

    it('orders games by date', async () => {
      const store = await addRecordings(matchCD(2000), matchAB(1000))
      expect(replayNames(store)).toEqual([['rec1.aoe2record'], ['rec0.aoe2record'], []])
    })

    it('keeps an unparseable recording in a game of its own', async () => {
      const store = await addRecordings(matchAB(1000), 'unparseable', matchAB(1500), matchCD(2000))
      expect(replayNames(store)).toEqual([
        ['rec0.aoe2record', 'rec2.aoe2record'],
        ['rec3.aoe2record'],
        ['rec1.aoe2record']
      ])
      expect(store.games[2]?.isUnparseable()).toBe(true)
    })

    it('groups a recording of the same match into its game', async () => {
      const store = await addRecordings(matchAB(1000), matchCD(2000), matchAB(1500))
      expect(replayNames(store)).toEqual([
        ['rec0.aoe2record', 'rec2.aoe2record'],
        ['rec1.aoe2record'],
        []
      ])
    })

    it('clears a game, leaving a placeholder at the end', async () => {
      const store = await addRecordings(matchAB(), matchCD())
      store.clearGame(0)
      expect(replayNames(store)).toEqual([['rec1.aoe2record'], [], []])
    })

    it('removes a game', async () => {
      const store = await addRecordings(matchAB(), matchCD())
      store.removeGame(0)
      expect(replayNames(store)).toEqual([['rec1.aoe2record'], []])
    })

    it('sets the number of games, adding or dropping placeholders', async () => {
      const store = await addRecordings(matchAB())
      store.setGamesNumber(5)
      expect(store.games).toHaveLength(5)
      store.setGamesNumber(2)
      expect(replayNames(store)).toEqual([['rec0.aoe2record'], []])
    })

    it('moves a game up or down', async () => {
      const store = await addRecordings(matchAB(), matchCD())
      store.moveGame(1, -1)
      expect(replayNames(store).slice(0, 2)).toEqual([['rec1.aoe2record'], ['rec0.aoe2record']])
    })

    it('ignores moving a game out of the list', async () => {
      const store = await addRecordings(matchAB())
      store.moveGame(0, -1)
      store.moveGame(2, 1)
      expect(replayNames(store)).toEqual([['rec0.aoe2record'], [], []])
    })

    it('moves a replay into another game', async () => {
      const store = await addRecordings(matchAB(1000), matchAB(1500), matchCD(2000))
      const replayId = store.games[0]!.replays[1]!.id
      store.moveReplay(replayId, 0, 1)
      expect(replayNames(store)).toEqual([
        ['rec0.aoe2record'],
        ['rec1.aoe2record', 'rec2.aoe2record'],
        []
      ])
    })

    it('moves a replay into a new game', async () => {
      const store = await addRecordings(matchAB(1000), matchAB(1500))
      const replayId = store.games[0]!.replays[1]!.id
      store.moveReplay(replayId, 0, -1)
      expect(replayNames(store)).toEqual([['rec0.aoe2record'], ['rec1.aoe2record'], []])
    })

    it('turns a game emptied by a move into a placeholder at the end', async () => {
      const store = await addRecordings(matchAB(1000), matchCD(2000))
      const replayId = store.games[0]!.replays[0]!.id
      store.moveReplay(replayId, 0, 1)
      // Replays within a game stay in chronological order
      expect(replayNames(store)).toEqual([['rec0.aoe2record', 'rec1.aoe2record'], [], []])
    })
  })
})
