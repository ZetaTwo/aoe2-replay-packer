import { describe, it, expect } from 'vitest'
import { getPresetPool, parseCivDraft, parseMapDraft } from './aoe2cm'
import type { Aoe2CmDraft, Aoe2CmEvent } from './aoe2cm'
import mapDraftJson from './__tests__/fixtures/map-draft.json'
import mapDraftLegacyJson from './__tests__/fixtures/map-draft-legacy.json'
import civDraftJson from './__tests__/fixtures/civ-draft.json'
import civDraftLegacyJson from './__tests__/fixtures/civ-draft-legacy.json'

// Current API responses wrap options in preset.pools, legacy ones have them directly on preset
const formats = [
  {
    format: 'pools',
    mapDraft: {
      json: mapDraftJson as unknown as Aoe2CmDraft,
      id: 'zxvoQ',
      preset: 'qrZfn',
      host: 'Benanji',
      guest: 'Wean Dinchester',
      optionCount: 12,
      option: {
        id: 'Badlands',
        image:
          'https://ljdejjmgsxsvxpepdafe.supabase.co/storage/v1/object/public/maps/ca/S10/A2G_S10_Badlands.png'
      },
      pickedMaps: ['Basmo', 'Nomad', 'Copenhagen']
    },
    civDraft: {
      json: civDraftJson as unknown as Aoe2CmDraft,
      id: 'iFSPX',
      preset: 'LfBAe',
      host: 'Benanji',
      guest: 'Wean Dinchester',
      encodedCivilisations: '7e3e3fffffffefff',
      hostCivs: ['Varangians', 'Armenians', 'Italians', 'Vikings', 'Burmese'],
      guestCivs: ['Bengalis', 'Magyars', 'Japanese', 'Wu', 'Mongols']
    }
  },
  {
    format: 'legacy',
    mapDraft: {
      json: mapDraftLegacyJson as unknown as Aoe2CmDraft,
      id: 'EJEVc',
      preset: 'OrFMd',
      host: 'Snowshawnskate',
      guest: 'Antymon',
      optionCount: 11,
      option: { id: 'Castra', image: 'https://i.ibb.co/0Vs097gG/TCC3-Castra.png' },
      pickedMaps: ['Festa_da_Pólvora', 'Castra', 'Drumlin']
    },
    civDraft: {
      json: civDraftLegacyJson as unknown as Aoe2CmDraft,
      id: 'wnbeA',
      preset: 'uYssw',
      host: 'Snowshawnskate',
      guest: 'Antymon',
      encodedCivilisations: 'e3e3fffffffefff',
      // Japanese and Wei were sniped by the opponent
      hostCivs: ['Portuguese', 'Magyars', 'Berbers', 'Armenians'],
      guestCivs: ['Ethiopians', 'Shu', 'Lithuanians', 'Dravidians']
    }
  }
]

function withEvents(draft: Aoe2CmDraft, events: Partial<Aoe2CmEvent>[]): Aoe2CmDraft {
  return { ...draft, events: [...draft.events, ...(events as Aoe2CmEvent[])] }
}

describe.each(formats)('$format format', ({ mapDraft, civDraft }) => {
  describe('getPresetPool', () => {
    it('returns the map options of a map draft', () => {
      const pool = getPresetPool(mapDraft.json.preset)
      expect('draftOptions' in pool && pool.draftOptions).toHaveLength(mapDraft.optionCount)
    })

    it('returns the encoded civilisations of a civ draft', () => {
      const pool = getPresetPool(civDraft.json.preset)
      expect('encodedCivilisations' in pool && pool.encodedCivilisations).toBe(
        civDraft.encodedCivilisations
      )
    })
  })

  describe('parseMapDraft', () => {
    it('parses a map draft', () => {
      const result = parseMapDraft(mapDraft.id, mapDraft.json, null)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value).toMatchObject({
        draft: mapDraft.id,
        preset: mapDraft.preset,
        host: mapDraft.host,
        guest: mapDraft.guest,
        pickedMaps: mapDraft.pickedMaps
      })
      expect(Object.keys(result.value.availableMaps)).toHaveLength(mapDraft.optionCount)
      expect(result.value.availableMaps[mapDraft.option.id]).toEqual({
        name: mapDraft.option.id,
        image: mapDraft.option.image
      })
    })

    it('excludes sniped maps', () => {
      const [sniped, ...rest] = mapDraft.pickedMaps
      const draft = withEvents(mapDraft.json, [
        { player: 'GUEST', actionType: 'snipe', chosenOptionId: sniped }
      ])
      const result = parseMapDraft(mapDraft.id, draft, null)
      expect(result.ok && result.value.pickedMaps).toEqual(rest)
    })

    it('accepts a draft from the allowed presets', () => {
      expect(parseMapDraft(mapDraft.id, mapDraft.json, ['other', mapDraft.preset]).ok).toBe(true)
    })

    it('rejects a draft not from the allowed presets', () => {
      expect(parseMapDraft(mapDraft.id, mapDraft.json, ['abc', 'def'])).toEqual({
        ok: false,
        error: `The draft preset (${mapDraft.preset}) is not a map draft from the required presets [abc, def]`
      })
    })

    it('rejects a civ draft', () => {
      expect(parseMapDraft(civDraft.id, civDraft.json, null)).toEqual({
        ok: false,
        error: 'This does not seem to be a map draft'
      })
    })
  })

  describe('parseCivDraft', () => {
    it('parses a civ draft', () => {
      expect(parseCivDraft(civDraft.id, civDraft.json, null)).toEqual({
        ok: true,
        value: {
          draft: civDraft.id,
          preset: civDraft.preset,
          host: civDraft.host,
          guest: civDraft.guest,
          hostCivs: civDraft.hostCivs,
          guestCivs: civDraft.guestCivs
        }
      })
    })

    it("excludes civs sniped by the opponent but not the player's own snipes", () => {
      const [hostSniped, ...hostRest] = civDraft.hostCivs
      const [guestSniped, ...guestRest] = civDraft.guestCivs
      const draft = withEvents(civDraft.json, [
        { player: 'GUEST', actionType: 'snipe', chosenOptionId: hostSniped },
        { player: 'HOST', actionType: 'snipe', chosenOptionId: guestSniped },
        { player: 'GUEST', actionType: 'snipe', chosenOptionId: guestRest[0] }
      ])
      const result = parseCivDraft(civDraft.id, draft, null)
      expect(result.ok && result.value.hostCivs).toEqual(hostRest)
      expect(result.ok && result.value.guestCivs).toEqual(guestRest)
    })

    it('accepts a draft from the allowed presets', () => {
      expect(parseCivDraft(civDraft.id, civDraft.json, [civDraft.preset]).ok).toBe(true)
    })

    it('rejects a draft not from the allowed presets', () => {
      expect(parseCivDraft(civDraft.id, civDraft.json, ['abc'])).toEqual({
        ok: false,
        error: `The draft preset (${civDraft.preset}) is not a civ draft from the required presets [abc]`
      })
    })

    it('rejects a map draft', () => {
      expect(parseCivDraft(mapDraft.id, mapDraft.json, null)).toEqual({
        ok: false,
        error: 'This does not seem to be a civ draft'
      })
    })
  })
})

describe('parseCivDraft with civs as draft options', () => {
  const civOptions = ['Britons', 'Franks', 'Goths'].map((id) => ({ id, name: id }))

  it('accepts a pools format draft', () => {
    const draft = {
      ...civDraftJson,
      preset: { ...civDraftJson.preset, pools: [{ id: 'default', draftOptions: civOptions }] }
    } as unknown as Aoe2CmDraft
    expect(parseCivDraft('iFSPX', draft, null).ok).toBe(true)
  })

  it('accepts a legacy format draft', () => {
    const preset: Record<string, unknown> = {
      ...civDraftLegacyJson.preset,
      draftOptions: civOptions
    }
    delete preset.encodedCivilisations
    const draft = { ...civDraftLegacyJson, preset } as unknown as Aoe2CmDraft
    expect(parseCivDraft('wnbeA', draft, null).ok).toBe(true)
  })
})
