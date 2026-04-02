<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Aoe2CmEvent, Aoe2CmDraftOption } from '../entities/aoe2cm'
import type { ReplayMetadata, ReplayErrors } from '../entities/gamemeta'
import { MatchSetType } from '@/entities/matchset'
import debounce from 'lodash.debounce'
import CivIcon from './CivIcon.vue'
import { extractDraftId } from '../entities/draft'
import { civNames } from '@/entities/civs'

const props = defineProps<{
  expectedGamesCount: number
  civPresets: string[] | null
  mapPresets: string[] | null
  drafts: 'both' | 'map' | 'civ' | 'none'
  boPa: MatchSetType | null
}>()

const player1 = defineModel<string>('player1')
const player2 = defineModel<string>('player2')
const mapsDraftURI = defineModel<string>('mapDraft')
const civDraftURI = defineModel<string>('civDraft')
const emit = defineEmits<{
  updateMeta: [ReplayErrors, ReplayMetadata]
}>()

const meta: Ref<ReplayMetadata> = ref({
  maps: null,
  civs: null,
  player1_score: null,
  player2_score: null
})

const errors: Ref<ReplayErrors> = ref({
  maps: null,
  civs: null
})

function mapImageUrl(imageUri: string | null) {
  if (!imageUri) {
    return 'https://aoe2cm.net/TODO.png' // TODO: get URL to question mark map icon
  }
  if (URL.canParse(imageUri)) {
    return imageUri
  } else {
    return `https://aoe2cm.net/${imageUri}`
  }
}

const debouncedFetchMaps = debounce(async () => {
  meta.value.maps = null
  errors.value.maps = null
  const draftId = extractDraftId(mapsDraftURI.value)

  if (draftId.length <= 0) {
    emit('updateMeta', errors.value, meta.value)
    return
  }

  const response = await fetch(`https://aoe2cm.net/api/draft/${draftId}`)
  if (!response.ok) {
    errors.value.maps = `Map draft not found, ID/URL invalid`
    emit('updateMeta', errors.value, meta.value)
    return
  }
  const json = await response.json()
  if ('encodedCivilisations' in json.preset) {
    errors.value.maps = 'This does not seem to be a map draft'
    emit('updateMeta', errors.value, meta.value)
    return
  }
  if (props.mapPresets && !props.mapPresets.includes(json.preset.presetId)) {
    const validPresetsString = props.mapPresets.join(', ')
    errors.value.maps = `The draft preset (${json.preset.presetId}) is not a map draft from the required presets [${validPresetsString}]`
    emit('updateMeta', errors.value, meta.value)
    return
  }

  const availableMaps = (Object.values(json.preset.draftOptions) as [Aoe2CmDraftOption]).reduce(
    (map, draftMap) => {
      map[draftMap.id] = { name: draftMap.name, image: draftMap.imageUrls.emblem }
      return map
    },
    {} as Record<string, { name: string; image: string }>
  )

  const picks = json.events.filter((event: Aoe2CmEvent) => event.actionType == 'pick')
  const snipes = json.events.filter((event: Aoe2CmEvent) => event.actionType == 'snipe')

  const pickedMaps: [string] = picks.map((event: Aoe2CmEvent) => event.chosenOptionId)
  const snipedMaps: [string] = snipes.map((event: Aoe2CmEvent) => event.chosenOptionId)

  const resultMaps = Array.from(new Set(pickedMaps).difference(new Set(snipedMaps)))

  meta.value = {
    maps: {
      draft: draftId,
      preset: json.preset.presetId,
      host: json.nameHost,
      guest: json.nameGuest,
      availableMaps: availableMaps,
      pickedMaps: resultMaps
    },
    civs: meta.value.civs,
    player1_score: meta.value.player1_score,
    player2_score: meta.value.player2_score
  }
  emit('updateMeta', errors.value, meta.value)
}, 300)

const debouncedFetchCivs = debounce(async () => {
  meta.value.civs = null
  errors.value.civs = null

  const draftId = extractDraftId(civDraftURI.value)
  if (draftId.length <= 0) {
    emit('updateMeta', errors.value, meta.value)
    return
  }

  const response = await fetch(`https://aoe2cm.net/api/draft/${draftId}`)
  if (!response.ok) {
    errors.value.civs = `Civ draft not found, ID/URL invalid`
    emit('updateMeta', errors.value, meta.value)
    return
  }

  const json = await response.json()
  const civNamesSet = new Set(Object.values(civNames))
  if (
    !('encodedCivilisations' in json.preset) &&
    json.preset.draftOptions.every(({ id }: { id: string }) => !civNamesSet.has(id))
  ) {
    errors.value.civs = 'This does not seem to be a civ draft'
    emit('updateMeta', errors.value, meta.value)
    return
  }

  if (props.civPresets && !props.civPresets.includes(json.preset.presetId)) {
    const validPresetsString = props.civPresets.join(', ')
    errors.value.civs = `The draft preset (${json.preset.presetId}) is not a civ draft from the required presets [${validPresetsString}]`
    emit('updateMeta', errors.value, meta.value)
    return
  }

  const picks = json.events.filter((event: Aoe2CmEvent) => event.actionType == 'pick')
  const snipes = json.events.filter((event: Aoe2CmEvent) => event.actionType == 'snipe')
  const pickedCivsHost: [string] = picks
    .filter((event: Aoe2CmEvent) => event.player == 'HOST')
    .map((event: Aoe2CmEvent) => event.chosenOptionId)

  const snipedCivsHost: [string] = snipes
    .filter((event: Aoe2CmEvent) => event.player == 'HOST')
    .map((event: Aoe2CmEvent) => event.chosenOptionId)

  const pickedCivsGuest: [string] = picks
    .filter((event: Aoe2CmEvent) => event.player == 'GUEST')
    .map((event: Aoe2CmEvent) => event.chosenOptionId)

  const snipedCivsGuest: [string] = snipes
    .filter((event: Aoe2CmEvent) => event.player == 'GUEST')
    .map((event: Aoe2CmEvent) => event.chosenOptionId)

  const resultCivsHost = Array.from(new Set(pickedCivsHost).difference(new Set(snipedCivsGuest)))
  const resultCivsGuest = Array.from(new Set(pickedCivsGuest).difference(new Set(snipedCivsHost)))

  meta.value = {
    maps: meta.value.maps,
    civs: {
      draft: draftId,
      preset: json.preset.presetId,
      host: json.nameHost,
      guest: json.nameGuest,
      hostCivs: resultCivsHost,
      guestCivs: resultCivsGuest
    },
    player1_score: meta.value.player1_score,
    player2_score: meta.value.player2_score
  }
  emit('updateMeta', errors.value, meta.value)
}, 300)

watch(mapsDraftURI, debouncedFetchMaps)
watch(civDraftURI, debouncedFetchCivs)
watch(meta, () => {
  if (meta.value.maps?.host) {
    if (player1.value == 'Player1') {
      player1.value = meta.value.maps.host
    }
    if (player2.value == 'Player2') {
      player2.value = meta.value.maps.guest
    }
  } else if (meta.value.civs?.host) {
    if (player1.value == 'Player1') {
      player1.value = meta.value.civs.host
    }
    if (player2.value == 'Player2') {
      player2.value = meta.value.civs.guest
    }
  }
})
</script>

<template>
  <div class="text-center p-4 border-2 rounded-lg mt-4">
    <h2 class="text-center text-2xl mb-2">Game Info</h2>
    <div v-if="boPa != null && expectedGamesCount > 0">
      <template v-if="boPa == MatchSetType.BestOf">Best of</template>
      <template v-else>Play all</template>
      {{ expectedGamesCount }}
    </div>
    <input
      v-model="player1"
      placeholder="Player 1 Name"
      class="border-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-sm"
      type="text"
    /><span class="mx-10">vs</span>
    <input
      v-model="player2"
      placeholder="Player 2 Name"
      class="border-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-sm"
      type="text"
    />
    <template v-if="drafts != 'none'">
      <h3 class="text-center text-xl mt-4">
        Drafts<template v-if="!mapPresets && !civPresets"> (optional)</template>
      </h3>
      <p class="text-center">Input aoe2cm.net civ/map draft ID/URL.</p>
      <div class="grid grid-cols-2">
        <div v-if="drafts == 'both' || drafts == 'map'" class="mb-6">
          <label class="text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" for="maps">
            Map draft</label
          >
          <input
            id="maps"
            v-model="mapsDraftURI"
            class="border-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-sm ml-2"
            type="text"
            placeholder="e.g. XZedf"
          />
          <p v-if="errors.maps" class="text-red-500 dark:text-red-500 text-xs italic">
            {{ errors.maps }}
          </p>
          <div v-if="meta.maps" class="text-left px-8 pt-4">
            <p class="text-center">{{ meta.maps.host }} vs {{ meta.maps.guest }}</p>
            <ul class="text-center flex w-full flex-wrap justify-center">
              <li v-for="(map, mapIdx) in meta.maps.pickedMaps" :key="mapIdx" class="mx-2">
                <div class="aspect-square h-36">
                  <img
                    class="mx-auto w-full h-full"
                    :src="mapImageUrl(meta.maps.availableMaps[map]?.image ?? null)"
                    :alt="meta.maps.availableMaps[map]?.name ?? 'Unknown map'"
                  />
                </div>
                <div>
                  {{ meta.maps.availableMaps[map]?.name ?? 'Unknown map' }}
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="drafts == 'both' || drafts == 'civ'" class="mb-6">
          <label class="text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" for="civs">
            Civ draft</label
          >
          <input
            id="civs"
            v-model="civDraftURI"
            class="border-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-sm ml-2"
            type="text"
            placeholder="e.g. vbvIP"
          />
          <p v-if="errors.civs" class="text-red-500 dark:text-red-500 text-xs italic">
            {{ errors.civs }}
          </p>
          <div v-if="meta.civs" class="text-left px-8 pt-4">
            <p>{{ meta.civs.host }} vs {{ meta.civs.guest }}</p>
            <ul class="pl-8">
              <li v-for="(civ, civIdx) in meta.civs.hostCivs" :key="civIdx" class="capitalize mt-2">
                <CivIcon :civ="civ.toLowerCase()" />
                {{ civ }}
              </li>
            </ul>
            <p class="pl-20">vs</p>
            <ul class="pl-8">
              <li
                v-for="(civ, civIdx) in meta.civs.guestCivs"
                :key="civIdx"
                class="capitalize mt-2"
              >
                <CivIcon :civ="civ.toLowerCase()" />
                {{ civ }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
