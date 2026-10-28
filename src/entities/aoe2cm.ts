import type { MapDraft, CivDraft } from './gamemeta'
import { civNames } from './civs'

export const AOE2CM_URL = 'https://aoe2cm.net'

export type Aoe2CmEvent = {
  actionType: string
  chosenOptionId: string
  executingPlayer: 'HOST' | 'GUEST' | 'NONE'
  isRandomlyChosen: boolean
  offset: number
  player: 'HOST' | 'GUEST' | 'NONE'
}

type Aoe2CmCategory = string

export type Aoe2CmDraftOption = {
  category: Aoe2CmCategory
  i18nPrefix: string
  id: string
  imageUrls: {
    animated_left: string
    animated_right: string
    emblem: string
    unit: string
  }
  name: string
}

export type Aoe2CmPreset = Aoe2CmPresetSinglePool | Aoe2CmPresetMultiPools

type Aoe2CmPresetBase = {
  name: string
  presetId: string
  turns: Aoe2CmTurn[]
  categoryLimits: {
    pick: Record<Aoe2CmCategory, number>
    ban: Record<Aoe2CmCategory, number>
  }
}

type Aoe2CmPresetSinglePool = Aoe2CmPresetBase & (Aoe2CmPresetEncodedCiv | Aoe2CmPresetDraftOptions)
type Aoe2CmPresetMultiPools = Aoe2CmPresetBase & Aoe2CmPools

type Aoe2CmPresetEncodedCiv = {
  encodedCivilisations: string
}

type Aoe2CmPresetDraftOptions = {
  draftOptions: Aoe2CmDraftOption[]
}

type Aoe2CmPools = {
  pools: Array<
    {
      id: string
      name: string
    } & (Aoe2CmPresetEncodedCiv | Aoe2CmPresetDraftOptions)
  >
}

type Aoe2CmTurn = {
  id: string
  player: string
  action: 'BAN' | 'PICK' | 'SNIPE' | 'STEAL' | 'REVEAL_ALL' | 'PAUSE' // What did I forget?
  exclusivity: 'GLOBAL' | string // TODO: Be more precise
  hidden: boolean
  executingPlayer: 'NONE' | 'HOST' | 'GUEST'
  parallel: boolean
  categories: Aoe2CmCategory[]
  poolId?: string
}

export type Aoe2CmDraft = {
  nameHost: string
  nameGuest: string
  preset: Aoe2CmPreset
  events: Aoe2CmEvent[]
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

// Older API responses have the pool contents directly on the preset
export function getPresetPool(preset: Aoe2CmPreset) {
  if ('pools' in preset) {
    return preset.pools[0]
  }
  return preset
}

function chosenOptions(events: Aoe2CmEvent[], actionType: string, player?: Aoe2CmEvent['player']) {
  return new Set(
    events
      .filter((event) => event.actionType == actionType)
      .filter((event) => player === undefined || event.player == player)
      .map((event) => event.chosenOptionId)
  )
}

export function parseMapDraft(
  draftId: string,
  draft: Aoe2CmDraft,
  mapPresets: string[] | null
): ParseResult<MapDraft> {
  const pool = getPresetPool(draft.preset)
  if ('encodedCivilisations' in pool) {
    return { ok: false, error: 'This does not seem to be a map draft' }
  }
  if (mapPresets && !mapPresets.includes(draft.preset.presetId)) {
    const validPresetsString = mapPresets.join(', ')
    return {
      ok: false,
      error: `The draft preset (${draft.preset.presetId}) is not a map draft from the required presets [${validPresetsString}]`
    }
  }

  const availableMaps = pool.draftOptions.reduce(
    (map, draftMap) => {
      map[draftMap.id] = { name: draftMap.name, image: draftMap.imageUrls.emblem }
      return map
    },
    {} as Record<string, { name: string; image: string }>
  )

  const pickedMaps = chosenOptions(draft.events, 'pick')
  const snipedMaps = chosenOptions(draft.events, 'snipe')

  return {
    ok: true,
    value: {
      draft: draftId,
      preset: draft.preset.presetId,
      host: draft.nameHost,
      guest: draft.nameGuest,
      availableMaps: availableMaps,
      pickedMaps: Array.from(pickedMaps.difference(snipedMaps))
    }
  }
}

export function parseCivDraft(
  draftId: string,
  draft: Aoe2CmDraft,
  civPresets: string[] | null
): ParseResult<CivDraft> {
  const civNamesSet = new Set(Object.values(civNames))
  const pool = getPresetPool(draft.preset)
  if (
    !('encodedCivilisations' in pool) &&
    pool.draftOptions.every(({ id }) => !civNamesSet.has(id))
  ) {
    return { ok: false, error: 'This does not seem to be a civ draft' }
  }

  if (civPresets && !civPresets.includes(draft.preset.presetId)) {
    const validPresetsString = civPresets.join(', ')
    return {
      ok: false,
      error: `The draft preset (${draft.preset.presetId}) is not a civ draft from the required presets [${validPresetsString}]`
    }
  }

  const pickedCivsHost = chosenOptions(draft.events, 'pick', 'HOST')
  const snipedCivsHost = chosenOptions(draft.events, 'snipe', 'HOST')
  const pickedCivsGuest = chosenOptions(draft.events, 'pick', 'GUEST')
  const snipedCivsGuest = chosenOptions(draft.events, 'snipe', 'GUEST')

  return {
    ok: true,
    value: {
      draft: draftId,
      preset: draft.preset.presetId,
      host: draft.nameHost,
      guest: draft.nameGuest,
      hostCivs: Array.from(pickedCivsHost.difference(snipedCivsGuest)),
      guestCivs: Array.from(pickedCivsGuest.difference(snipedCivsHost))
    }
  }
}

enum DraftType {
  Unknown,
  Map,
  Civ
}

export type Aoe2CmRecentDraft = {
  draftId: string
  presetId: string
  ts: number
  title: string
  nameHost: string
  nameGuest: string
}

export type Aoe2CmPresetDraft = {
  draftId: string
  ts: number
  host: string
  guest: string
}

function getDraftType(draft: Aoe2CmRecentDraft, mapPresets: string[], civPresets: string[]) {
  if (mapPresets.includes(draft.presetId)) {
    return DraftType.Map
  } else if (civPresets.includes(draft.presetId)) {
    return DraftType.Civ
  } else {
    return DraftType.Unknown
  }
}

export function getDraftTypeLabel(
  draft: Aoe2CmRecentDraft,
  mapPresets: string[],
  civPresets: string[]
) {
  const draftType = getDraftType(draft, mapPresets, civPresets)
  if (draftType == DraftType.Civ) {
    return 'Civs:'
  } else if (draftType == DraftType.Map) {
    return 'Maps:'
  } else {
    return ''
  }
}

export const extractDraftId = (url?: string) => {
  if (!url) {
    return ''
  }
  try {
    const parsed_url = new URL(url)
    return parsed_url.pathname.split('/').at(2) ?? ''
  } catch {
    return url
  }
}

export const extractDraftUrl = (url?: string) => {
  if (!url) {
    return ''
  }
  const draftId = extractDraftId(url)
  if (!draftId) {
    return ''
  }
  return `${AOE2CM_URL}/draft/${draftId}`
}

export function getRecentDrafts(
  presetDrafts: { presetId: string; drafts: Aoe2CmPresetDraft[] }[],
  minTs: number,
  maxItems: number
): Aoe2CmRecentDraft[] {
  return presetDrafts
    .flatMap(({ presetId, drafts }) =>
      drafts
        .filter((draft) => draft.ts >= minTs)
        .map((draft) => ({
          draftId: draft.draftId,
          presetId: presetId,
          ts: draft.ts,
          // The preset-specific endpoint does not return a title so we make up a sensible one
          title: `${draft.host} vs ${draft.guest}`,
          nameHost: draft.host,
          nameGuest: draft.guest
        }))
    )
    .sort((a, b) => b.ts - a.ts)
    .slice(0, maxItems)
}

export function mapImageUrl(imageUri: string | null) {
  if (!imageUri) {
    return `${AOE2CM_URL}/TODO.png` // TODO: get URL to question mark map icon
  }
  if (URL.canParse(imageUri)) {
    return imageUri
  } else {
    return `${AOE2CM_URL}/${imageUri}`
  }
}

export interface Aoe2CmApi {
  getDraft(draftId: string): Promise<Aoe2CmDraft | null>
  getPresetDrafts(presetId: string): Promise<Aoe2CmPresetDraft[] | null>
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  if (!response.ok) {
    return null
  }
  return (await response.json()) as T
}

export const fetchAoe2CmApi: Aoe2CmApi = {
  getDraft: (draftId) => fetchJson(`${AOE2CM_URL}/api/draft/${draftId}`),
  getPresetDrafts: (presetId) => fetchJson(`${AOE2CM_URL}/api/preset/${presetId}/drafts`)
}
