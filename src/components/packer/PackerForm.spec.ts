import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PackerForm from './PackerForm.vue'
import { useGamesStore } from '@/stores/games'
import { aoe2cmApiKey } from '@/stores/keys'
import type { Aoe2CmApi, Aoe2CmDraft } from '@/entities/aoe2cm'
import mapDraftJson from '@/entities/__tests__/fixtures/map-draft.json'
import {
  ALICE,
  BOB,
  CAROL,
  DAVE,
  makeGame,
  makeRecording,
  playedGame
} from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))

// The map draft fixture is hosted by Benanji against Wean Dinchester
const api: Aoe2CmApi = {
  getDraft: async () => mapDraftJson as unknown as Aoe2CmDraft,
  getPresetDrafts: async () => null
}

function mountForm() {
  return mount(PackerForm, {
    props: { civPresets: null, mapPresets: null },
    global: { stubs: { teleport: true }, provide: { [aoe2cmApiKey as symbol]: api } }
  })
}

type Wrapper = ReturnType<typeof mountForm>

function playerNames(wrapper: Wrapper) {
  return ['Player 1 name', 'Player 2 name'].map(
    (label) => wrapper.find<HTMLInputElement>(`input[aria-label="${label}"]`).element.value
  )
}

async function enterDraft(wrapper: Wrapper) {
  await wrapper.find('#maps').setValue('zxvoQ')
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

describe('PackerForm player names', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fills in the names from the replays', async () => {
    const wrapper = mountForm()
    useGamesStore().games = [playedGame(ALICE, BOB)]
    await flushPromises()
    expect(playerNames(wrapper)).toEqual(['Alice', 'Bob'])
  })

  it('follows the replays while the names are not edited', async () => {
    const wrapper = mountForm()
    const store = useGamesStore()
    store.games = [playedGame(ALICE, BOB)]
    await flushPromises()
    store.games = [playedGame(CAROL, DAVE)]
    await flushPromises()
    expect(playerNames(wrapper)).toEqual(['Carol', 'Dave'])
  })

  it('keeps names the user entered', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[aria-label="Player 1 name"]').setValue('Team One')
    useGamesStore().games = [playedGame(ALICE, BOB)]
    await flushPromises()
    expect(playerNames(wrapper)).toEqual(['Team One', 'Bob'])
  })

  it('does not fill in names from team games', async () => {
    const wrapper = mountForm()
    useGamesStore().games = [
      makeGame(
        makeRecording({
          teams: [
            [ALICE, BOB],
            [CAROL, DAVE]
          ]
        })
      )
    ]
    await flushPromises()
    expect(playerNames(wrapper)).toEqual(['Player1', 'Player2'])
  })

  it('replaces names from the replays with the names from a draft', async () => {
    const wrapper = mountForm()
    useGamesStore().games = [playedGame(ALICE, BOB)]
    await flushPromises()
    await enterDraft(wrapper)
    expect(playerNames(wrapper)).toEqual(['Benanji', 'Wean Dinchester'])
  })

  it('keeps the names from a draft when replays are added', async () => {
    const wrapper = mountForm()
    await enterDraft(wrapper)
    useGamesStore().games = [playedGame(ALICE, BOB)]
    await flushPromises()
    expect(playerNames(wrapper)).toEqual(['Benanji', 'Wean Dinchester'])
  })

  it('keeps names the user entered when a draft is added', async () => {
    const wrapper = mountForm()
    useGamesStore().games = [playedGame(ALICE, BOB)]
    await flushPromises()
    await wrapper.find('input[aria-label="Player 2 name"]').setValue('Team Two')
    await enterDraft(wrapper)
    expect(playerNames(wrapper)).toEqual(['Benanji', 'Team Two'])
  })
})
