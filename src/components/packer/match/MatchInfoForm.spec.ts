import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MatchInfoForm from './MatchInfoForm.vue'
import type { Aoe2CmApi, Aoe2CmDraft } from '@/entities/aoe2cm'
import type { ReplayErrors, ReplayMetadata } from '@/entities/gamemeta'
import { aoe2cmApiKey } from '@/stores/keys'
import mapDraftJson from '@/entities/__tests__/fixtures/map-draft.json'
import civDraftJson from '@/entities/__tests__/fixtures/civ-draft.json'

const drafts: Record<string, Aoe2CmDraft> = {
  zxvoQ: mapDraftJson as unknown as Aoe2CmDraft,
  iFSPX: civDraftJson as unknown as Aoe2CmDraft
}

function fakeApi(): Aoe2CmApi {
  return {
    getDraft: vi.fn(async (draftId: string) => drafts[draftId] ?? null),
    getPresetDrafts: vi.fn(async () => null)
  }
}

function mountForm(api: Aoe2CmApi, props: Record<string, unknown> = {}) {
  return mount(MatchInfoForm, {
    props: {
      expectedGamesCount: 0,
      civPresets: null,
      mapPresets: null,
      drafts: 'both',
      boPa: null,
      player1: 'Player1',
      player2: 'Player2',
      mapDraft: '',
      civDraft: '',
      ...props
    },
    global: { provide: { [aoe2cmApiKey as symbol]: api } }
  })
}

type Wrapper = ReturnType<typeof mountForm>

async function enterDraft(wrapper: Wrapper, field: 'mapDraft' | 'civDraft', value: string) {
  await wrapper.setProps({ [field]: value })
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

function lastMeta(wrapper: Wrapper) {
  const emitted = wrapper.emitted('updateMeta') as [ReplayErrors, ReplayMetadata][]
  return emitted.at(-1)!
}

describe('MatchInfoForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('map draft', () => {
    it('fetches the draft and shows the picked maps', async () => {
      const api = fakeApi()
      const wrapper = mountForm(api)
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')

      expect(api.getDraft).toHaveBeenCalledWith('zxvoQ')
      const [errors, meta] = lastMeta(wrapper)
      expect(errors.maps).toBeNull()
      expect(meta.maps?.pickedMaps).toEqual(['Basmo', 'Nomad', 'Copenhagen'])
      expect(wrapper.text()).toContain('Benanji vs Wean Dinchester')
      expect(wrapper.findAll('img').map((img) => img.attributes('alt'))).toEqual([
        'Basmo',
        'Nomad',
        'Copenhagen'
      ])
    })

    it('accepts a full draft URL', async () => {
      const api = fakeApi()
      const wrapper = mountForm(api)
      await enterDraft(wrapper, 'mapDraft', 'https://aoe2cm.net/draft/zxvoQ')
      expect(api.getDraft).toHaveBeenCalledWith('zxvoQ')
    })

    it('only fetches once while typing', async () => {
      const api = fakeApi()
      const wrapper = mountForm(api)
      await wrapper.setProps({ mapDraft: 'zx' })
      await vi.advanceTimersByTimeAsync(100)
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')
      expect(api.getDraft).toHaveBeenCalledTimes(1)
      expect(api.getDraft).toHaveBeenCalledWith('zxvoQ')
    })

    it('shows an error for an unknown draft', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'mapDraft', 'nope')
      expect(lastMeta(wrapper)[0].maps).toBe('Map draft not found, ID/URL invalid')
      expect(wrapper.text()).toContain('Map draft not found, ID/URL invalid')
    })

    it('shows an error for a civ draft', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'mapDraft', 'iFSPX')
      expect(wrapper.text()).toContain('This does not seem to be a map draft')
      expect(lastMeta(wrapper)[1].maps).toBeNull()
    })

    it('shows an error for a draft not from the allowed presets', async () => {
      const wrapper = mountForm(fakeApi(), { mapPresets: ['abc'] })
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')
      expect(wrapper.text()).toContain(
        'The draft preset (qrZfn) is not a map draft from the required presets [abc]'
      )
    })

    it('clears the draft when the input is emptied', async () => {
      const api = fakeApi()
      const wrapper = mountForm(api)
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')
      await enterDraft(wrapper, 'mapDraft', '')
      expect(api.getDraft).toHaveBeenCalledTimes(1)
      expect(lastMeta(wrapper)).toEqual([
        { maps: null, civs: null },
        { maps: null, civs: null, player1_score: null, player2_score: null }
      ])
    })
  })

  describe('civ draft', () => {
    it('fetches the draft and shows the civs of each player', async () => {
      const api = fakeApi()
      const wrapper = mountForm(api)
      await enterDraft(wrapper, 'civDraft', 'iFSPX')

      expect(api.getDraft).toHaveBeenCalledWith('iFSPX')
      const [errors, meta] = lastMeta(wrapper)
      expect(errors.civs).toBeNull()
      expect(meta.civs?.hostCivs).toEqual([
        'Varangians',
        'Armenians',
        'Italians',
        'Vikings',
        'Burmese'
      ])
      expect(meta.civs?.guestCivs).toEqual(['Bengalis', 'Magyars', 'Japanese', 'Wu', 'Mongols'])
      expect(wrapper.text()).toContain('Varangians')
      expect(wrapper.text()).toContain('Mongols')
    })

    it('shows an error for an unknown draft', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'civDraft', 'nope')
      expect(wrapper.text()).toContain('Civ draft not found, ID/URL invalid')
    })

    it('shows an error for a map draft', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'civDraft', 'zxvoQ')
      expect(wrapper.text()).toContain('This does not seem to be a civ draft')
    })

    it('keeps the map draft when a civ draft is added', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')
      await enterDraft(wrapper, 'civDraft', 'iFSPX')
      const [, meta] = lastMeta(wrapper)
      expect(meta.maps?.draft).toBe('zxvoQ')
      expect(meta.civs?.draft).toBe('iFSPX')
    })
  })

  describe('player names', () => {
    it('fills in the player names from the draft', async () => {
      const wrapper = mountForm(fakeApi())
      await enterDraft(wrapper, 'civDraft', 'iFSPX')
      expect(wrapper.emitted('update:player1')?.at(-1)).toEqual(['Benanji'])
      expect(wrapper.emitted('update:player2')?.at(-1)).toEqual(['Wean Dinchester'])
    })

    it('does not overwrite names that were already entered', async () => {
      const wrapper = mountForm(fakeApi(), { player1: 'Alice', player2: 'Bob' })
      await enterDraft(wrapper, 'mapDraft', 'zxvoQ')
      expect(wrapper.emitted('update:player1')).toBeUndefined()
      expect(wrapper.emitted('update:player2')).toBeUndefined()
    })
  })
})
