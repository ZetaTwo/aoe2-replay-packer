<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { saveAs } from 'file-saver'
import type { Tournament } from 'virtual:tournaments-data'

import MatchInfoForm from './match/MatchInfoForm.vue'
import MatchSetPicker from './match/MatchSetPicker.vue'
import TournamentSetPicker from './match/TournamentSetPicker.vue'
import RecentDrafts from './match/RecentDrafts.vue'
import ReplayDropzone from './games/ReplayDropzone.vue'
import GameList from './games/GameList.vue'
import ZipPreview from './output/ZipPreview.vue'
import DiscordMessage from './output/DiscordMessage.vue'
import ToggleButton from '@/components/common/ToggleButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useGamesStore } from '@/stores/games'
import type { ReplayMetadata, ReplayErrors } from '@/entities/gamemeta'
import { MatchSetType } from '@/entities/matchset'

import { zipFilename } from '@/entities/game'
import { getRandomInt } from '@/lib/maths'
import { generateZip } from '@/lib/zip'
import {
  autofillName,
  computeScores,
  discordMessage as discordMessageText,
  downloadDisabledReason,
  draftMissingWarning,
  gamesWithOtherPlayers,
  guessSetLength,
  missingReplaysWarning,
  playerNamesFromReplays,
  presetSetDefinition,
  scoreWarning,
  tournamentSetDefinitions,
  zipFiles
} from '@/entities/packer'

const props = defineProps<{
  civPresets: string[] | null
  mapPresets: string[] | null
  tournament?: Tournament
}>()

const drafts = computed((): 'both' | 'map' | 'civ' | 'none' => {
  return props.tournament?.drafts ?? 'both'
})

const gamesStore = useGamesStore()

const player1 = ref('Player1')
const player2 = ref('Player2')
const boPa = ref<MatchSetType | null>(null)
const expectedGamesCount = ref<number>(0)
const mapDraft: Ref<string> = ref('')
const civDraft: Ref<string> = ref('')
const meta: Ref<ReplayMetadata> = ref({
  maps: null,
  civs: null,
  player1_score: null,
  player2_score: null
})
const metaErrors: Ref<ReplayErrors> = ref({ maps: null, civs: null })
const showResults = ref(true)

// Names filled in from the replays, which a draft may still replace
const replayNames = ref<[string, string] | null>(null)

watch(
  () => playerNamesFromReplays(gamesStore.games),
  (names) => {
    if (!names || meta.value.maps?.host || meta.value.civs?.host) {
      return
    }
    player1.value = autofillName(player1.value, ['Player1', replayNames.value?.[0]], names[0])
    player2.value = autofillName(player2.value, ['Player2', replayNames.value?.[1]], names[1])
    replayNames.value = names
  }
)

const setTypeRestrictions = computed(() =>
  props.tournament ? tournamentSetDefinitions(props.tournament) : undefined
)

const downloadWarningReplayMissing = computed(() =>
  missingReplaysWarning(gamesStore.games, boPa.value)
)

const scores = computed(() => computeScores(gamesStore.games, player1.value, player2.value))
const leftScore = computed(() => scores.value.left)
const rightScore = computed(() => scores.value.right)

watch([leftScore, rightScore], ([newLeftScore, newRightScore], [oldLeftScore, oldRightScore]) => {
  if (newLeftScore == oldLeftScore && newRightScore == oldRightScore) {
    return
  }

  if (newLeftScore == 0 && newRightScore == 0) {
    meta.value.player1_score = null
    meta.value.player2_score = null
    return
  }

  meta.value.player1_score = newLeftScore
  meta.value.player2_score = newRightScore
})

const downloadWarningScore = computed(() =>
  scoreWarning(scores.value, gamesStore.games.length, boPa.value)
)

const gamesWithDifferentPlayers = computed(() => gamesWithOtherPlayers(gamesStore.games))

const downloadWarningCivDraftMissing = computed(() =>
  draftMissingWarning(props.civPresets, civDraft.value)
)

const downloadWarningMapDraftMissing = computed(() =>
  draftMissingWarning(props.mapPresets, mapDraft.value)
)

const downloadDisabledMessage = computed(() =>
  downloadDisabledReason(metaErrors.value, boPa.value, expectedGamesCount.value, gamesStore.games)
)

const downloadEnabled = computed(() => downloadDisabledMessage.value == null)

function setExpectedGamesCount(count: number) {
  gamesStore.setGamesNumber(count)
  expectedGamesCount.value = count
}

async function downloadZip() {
  const files = zipFiles(gamesStore.games, player1.value, player2.value, meta.value, () =>
    getRandomInt(1e5, 5e5)
  )
  if (!files) {
    console.error('Could not find any valid replay files')
    return
  }
  saveAs(await generateZip(files), zipFilename(player1.value, player2.value))
}

const discordMessage = computed(() =>
  discordMessageText({
    player1: player1.value,
    player2: player2.value,
    scores: scores.value,
    showResults: showResults.value,
    boPa: boPa.value,
    gamesCount: expectedGamesCount.value,
    mapDraft: mapDraft.value,
    civDraft: civDraft.value
  })
)

function updateMeta(newErrors: ReplayErrors, newMeta: ReplayMetadata) {
  if (!props.tournament && newMeta?.maps?.pickedMaps?.length) {
    setExpectedGamesCount(guessSetLength(newMeta.maps.pickedMaps.length))
  }

  meta.value = newMeta
  metaErrors.value = newErrors

  const host = newMeta.maps?.host ?? newMeta.civs?.host
  const guest = newMeta.maps?.guest ?? newMeta.civs?.guest
  if (host && guest && replayNames.value) {
    player1.value = autofillName(player1.value, [replayNames.value[0]], host)
    player2.value = autofillName(player2.value, [replayNames.value[1]], guest)
  }

  const preset = meta.value.maps?.preset ?? meta.value.civs?.preset
  if (!props.tournament || !preset) {
    return
  }

  const setDefinition = presetSetDefinition(props.tournament, preset)
  if (!setDefinition) {
    console.error('Preset is not in the tournament set, but it should')
    return
  }

  setExpectedGamesCount(setDefinition.length)
  boPa.value = setDefinition.type
}
</script>

<template>
  <Suspense>
    <RecentDrafts
      v-if="mapPresets || civPresets"
      v-model:map-draft="mapDraft"
      v-model:civ-draft="civDraft"
      :civ-presets="civPresets"
      :map-presets="mapPresets"
    />
    <template #fallback>
      <div :class="$style.fallback">Loading Drafts...</div>
    </template>
  </Suspense>
  <MatchInfoForm
    v-model:player1="player1"
    v-model:player2="player2"
    v-model:map-draft="mapDraft"
    v-model:civ-draft="civDraft"
    :expected-games-count="expectedGamesCount"
    :civ-presets="civPresets"
    :map-presets="mapPresets"
    :drafts="drafts"
    :bo-pa="boPa"
    @update-meta="updateMeta"
  >
    <MatchSetPicker
      v-if="!setTypeRestrictions"
      :games-count="expectedGamesCount"
      @set-games="setExpectedGamesCount"
      @set-bo-pa="(newBoPa) => (boPa = newBoPa)"
    />
    <TournamentSetPicker
      v-else
      :set-types="setTypeRestrictions"
      :type="boPa"
      :length="expectedGamesCount"
      @set-games="setExpectedGamesCount"
      @set-bo-pa="(newBoPa) => (boPa = newBoPa)"
    />
  </MatchInfoForm>

  <GameList :show-results="showResults">
    <ToggleButton
      v-model="showResults"
      :class="$style.alignStart"
      label="Show results (spoilers)"
    />
    <ReplayDropzone />
  </GameList>

  <BaseCard align="center" spacing="top">
    <ZipPreview :games="gamesStore.games" :player1="player1" :player2="player2" />
    <BaseButton
      variant="primary"
      size="lg"
      :class="$style.downloadButton"
      :disabled="!downloadEnabled"
      @click="downloadZip"
    >
      Download
    </BaseButton>
    <BaseAlert v-if="!downloadEnabled" tone="error">{{ downloadDisabledMessage }}</BaseAlert>
    <BaseAlert v-if="downloadWarningReplayMissing">
      WARNING: You have selected "play all" but not provided all replays.
    </BaseAlert>
    <BaseAlert v-if="downloadWarningCivDraftMissing">
      WARNING: You have not provided a civilization draft link.
    </BaseAlert>
    <BaseAlert v-if="downloadWarningMapDraftMissing">
      WARNING: You have not provided a map draft link.
    </BaseAlert>
    <BaseAlert v-if="gamesWithDifferentPlayers.length > 0">
      WARNING: Not all games have the same players. Check game{{
        gamesWithDifferentPlayers.length > 1 ? 's' : ''
      }}
      {{ gamesWithDifferentPlayers.join(', ') }}.
    </BaseAlert>
    <BaseAlert v-if="downloadWarningScore">
      WARNING: The score does not make sense for a best-of set.
    </BaseAlert>
  </BaseCard>

  <DiscordMessage :discord-message="discordMessage" />
</template>

<style module>
.fallback {
  text-align: center;
  padding: var(--space-4);
  border: 2px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  height: 20rem;
}

.alignStart {
  align-self: flex-start;
}

.downloadButton {
  margin-top: var(--space-3);
}
</style>
