import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { parse_rec_summary } from 'aoe2rec-js'
import { useGamesStore } from './games'
import { makeRecording } from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))

const parseMock = vi.mocked(parse_rec_summary)

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
})
