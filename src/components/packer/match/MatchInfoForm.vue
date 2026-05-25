<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Aoe2CmEvent, Aoe2CmDraftOption } from '@/entities/aoe2cm'
import type { ReplayMetadata, ReplayErrors } from '@/entities/gamemeta'
import { MatchSetType } from '@/entities/matchset'
import debounce from 'lodash.debounce'
import CivIcon from '@/components/common/CivIcon.vue'
import { extractDraftId } from '@/entities/draft'
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
  <div :class="$style.panel">
    <h2 :class="$style.title">Match Info</h2>
    <div v-if="boPa != null && expectedGamesCount > 0">
      <template v-if="boPa == MatchSetType.BestOf">Best of</template>
      <template v-else>Play all</template>
      {{ expectedGamesCount }}
    </div>
    <input
      v-model="player1"
      placeholder="Player 1 Name"
      aria-label="Player 1 name"
      :class="$style.input"
      type="text"
    /><span :class="$style.vs">vs</span>
    <input
      v-model="player2"
      placeholder="Player 2 Name"
      aria-label="Player 2 name"
      :class="$style.input"
      type="text"
    />
    <template v-if="drafts != 'none'">
      <h3 :class="$style.draftsTitle">
        Drafts<template v-if="!mapPresets && !civPresets"> (optional)</template>
      </h3>
      <p :class="$style.center">Input aoe2cm.net civ/map draft ID/URL.</p>
      <div :class="$style.draftGrid">
        <div v-if="drafts == 'both' || drafts == 'map'" :class="$style.draftCell">
          <label :class="$style.fieldLabel" for="maps"> Map draft</label>
          <input
            id="maps"
            v-model="mapsDraftURI"
            :class="[$style.input, $style.inputSpacer]"
            type="text"
            placeholder="e.g. XZedf"
          />
          <p v-if="errors.maps" :class="$style.error">{{ errors.maps }}</p>
          <div v-if="meta.maps" :class="$style.draftPicks">
            <p :class="$style.center">{{ meta.maps.host }} vs {{ meta.maps.guest }}</p>
            <ul :class="$style.mapList">
              <li v-for="(map, mapIdx) in meta.maps.pickedMaps" :key="mapIdx" :class="$style.mapItem">
                <div :class="$style.mapImageWrap">
                  <img
                    :class="$style.mapImage"
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
        <div v-if="drafts == 'both' || drafts == 'civ'" :class="$style.draftCell">
          <label :class="$style.fieldLabel" for="civs"> Civ draft</label>
          <input
            id="civs"
            v-model="civDraftURI"
            :class="[$style.input, $style.inputSpacer]"
            type="text"
            placeholder="e.g. vbvIP"
          />
          <p v-if="errors.civs" :class="$style.error">{{ errors.civs }}</p>
          <div v-if="meta.civs" :class="$style.draftPicks">
            <p>{{ meta.civs.host }} vs {{ meta.civs.guest }}</p>
            <ul :class="$style.civList">
              <li v-for="(civ, civIdx) in meta.civs.hostCivs" :key="civIdx" :class="$style.civItem">
                <CivIcon :civ="civ.toLowerCase()" />
                {{ civ }}
              </li>
            </ul>
            <p :class="$style.civVs">vs</p>
            <ul :class="$style.civList">
              <li v-for="(civ, civIdx) in meta.civs.guestCivs" :key="civIdx" :class="$style.civItem">
                <CivIcon :civ="civ.toLowerCase()" />
                {{ civ }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
    <slot />
  </div>
</template>

<style module>
.panel {
  text-align: center;
  padding: var(--space-4);
  border: 2px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
}
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-2);
}
.input {
  padding: var(--space-2);
  border: 1px solid var(--color-border-section);
  background-color: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}
.input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.inputSpacer {
  margin-left: var(--space-2);
}
.vs {
  margin: 0 2.5rem;
}
.draftsTitle {
  text-align: center;
  font-size: var(--font-size-xl);
  margin-top: var(--space-4);
}
.center {
  text-align: center;
}
.draftGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.draftCell {
  margin-bottom: var(--space-6);
}
.fieldLabel {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  margin-bottom: var(--space-2);
}
.error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  font-style: italic;
}
.draftPicks {
  text-align: left;
  padding: var(--space-4) var(--space-8) 0;
}
.mapList {
  text-align: center;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
}
.mapItem {
  margin: 0 var(--space-2);
}
.mapImageWrap {
  aspect-ratio: 1 / 1;
  height: 9rem;
}
.mapImage {
  width: 100%;
  height: 100%;
}
.civList {
  padding-left: var(--space-8);
  list-style: none;
  margin: 0;
}
.civItem {
  text-transform: capitalize;
  margin-top: var(--space-2);
}
.civVs {
  padding-left: 5rem;
}
</style>
