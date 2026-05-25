<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import JSZip from 'jszip'
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
import { MatchSetDefinition, MatchSetType } from '@/entities/matchset'

import { zipFilename, computeReplayFilename, Player } from '@/entities/game'
import { extractDraftUrl } from '@/entities/draft'
import { getRandomInt } from '@/lib/maths'

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

const setTypeRestrictions = computed((): MatchSetDefinition[] | undefined => {
  if (!props.tournament) {
    return
  }
  return [
    ...new Set([...Object.keys(props.tournament.maps), ...Object.keys(props.tournament.civs)])
  ].map(MatchSetDefinition.parse)
})

const downloadWarningReplayMissing = computed(() => {
  if (boPa.value == MatchSetType.BestOf) {
    return false
  }

  for (const game of gamesStore.games) {
    for (const replay of game.replays) {
      if (!replay.file) {
        return true
      }
    }
  }

  return false
})

const winCount = computed(() => {
  return gamesStore.games.reduce(
    (count, game) => {
      const outcome = game.outcome
      if (outcome) {
        const winnerProfile = outcome.firstPlayer?.profile
        if (winnerProfile) {
          count.players[winnerProfile] = (count.players[winnerProfile] ?? 0) + 1
        } else if (outcome.side == 'left') {
          count.left += 1
        } else if (outcome.side == 'right') {
          count.right += 1
        }
      }
      return count
    },
    { left: 0, right: 0, players: {} } as {
      left: number
      right: number
      players: Record<Player['profile'], number>
    }
  )
})

const playerSides = computed(() => {
  if ((gamesStore.games[0]?.teams?.length ?? 0) < 2) {
    return null
  }

  const playerNameIsSimilarTo = (draftPlayer: Ref<string>) => (player: Player) =>
    player.name.toLowerCase().includes(draftPlayer.value.toLowerCase()) ||
    draftPlayer.value.toLowerCase().includes(player.name.toLowerCase())

  for (const game of gamesStore.games) {
    if (game.isUnparseable() || game.isDummy()) {
      continue
    }

    const team1 = game.teams[0]
    const team2 = game.teams[1]

    if (!team1 || !team2) {
      continue
    }

    const profile1 = team1.asGameWinner('left').firstPlayer?.profile
    const profile2 = team2.asGameWinner('right').firstPlayer?.profile

    const team1players = team1.players
    const team2players = team2.players

    if (team1players.find(playerNameIsSimilarTo(player1))) {
      return { left: profile1, right: profile2 }
    }

    if (team1players.find(playerNameIsSimilarTo(player2))) {
      return { left: profile2, right: profile1 }
    }

    if (team2players.find(playerNameIsSimilarTo(player2))) {
      return { left: profile1, right: profile2 }
    }

    if (team2players.find(playerNameIsSimilarTo(player1))) {
      return { left: profile2, right: profile1 }
    }
  }

  for (const game of gamesStore.games) {
    if (game.isUnparseable() || game.isDummy()) {
      continue
    }

    const team1 = game.teams[0]
    const team2 = game.teams[game.teams.length - 1]
    if (!team1 || !team2) {
      continue
    }

    return {
      left: team1.asGameWinner('left').firstPlayer?.profile,
      right: team2.asGameWinner('left').firstPlayer?.profile
    }
  }

  return null
})

const leftScore = computed(() => {
  return (winCount.value.players[playerSides?.value?.left ?? ''] ?? 0) + winCount.value.left
})

const rightScore = computed(() => {
  return (winCount.value.players[playerSides?.value?.right ?? ''] ?? 0) + winCount.value.right
})

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

const downloadWarningScore = computed(() => {
  if (boPa.value == MatchSetType.PlayAll) {
    return false
  }

  if (2 * leftScore.value > gamesStore.games.length + 1) {
    return true
  }
  if (2 * rightScore.value > gamesStore.games.length + 1) {
    return true
  }

  return false
})

const downloadWarningCivDraftMissing = computed(() => {
  if (!props.civPresets || props.civPresets.length == 0) {
    return false
  }

  if (civDraft.value.length > 0) {
    return false
  }

  return true
})

const downloadWarningMapDraftMissing = computed(() => {
  if (!props.mapPresets || props.mapPresets.length == 0) {
    return false
  }

  if (mapDraft.value.length > 0) {
    return false
  }

  return true
})

const downloadDisabledMessage = computed(() => {
  if (metaErrors.value.civs || metaErrors.value.maps) {
    return 'The draft links have some issues'
  }

  // Force civ draft entry if preset is specified
  /*if (props.civPresets && !meta.value.civs) {
    return false
  }*/

  // Force map draft entry if preset is specified
  /*if (props.mapPresets && !meta.value.maps) {
    return false
  }*/

  // If Best of/Play all and number of games was not selected
  if (boPa.value == null || expectedGamesCount.value == 0) {
    return 'You must choose the type of set (e.g. Best of 5)'
  }

  for (const game of gamesStore.games) {
    for (const replay of game.replays) {
      if (replay.file) {
        return null
      }
    }
  }

  return 'Replays are missing'
})

const downloadEnabled = computed(() => downloadDisabledMessage.value == null)

function setExpectedGamesCount(count: number) {
  gamesStore.setGamesNumber(count)
  expectedGamesCount.value = count
}

function getFirstReplayFile(): File | null {
  for (const game of gamesStore.games) {
    for (const replay of game.replays) {
      if (replay.file) {
        return replay.file
      }
    }
  }
  return null
}

function downloadZip() {
  const zip = new JSZip()
  const zipComment = 'Generated by https://replaypacker.zeta-two.com'

  const dummyBase = getFirstReplayFile()
  if (!dummyBase) {
    console.error('Could not find any valid replay files')
    return
  }

  for (const [gameIdx, game] of gamesStore.games.entries()) {
    if (game.isDummy()) {
      const replay_filename = computeReplayFilename(player1.value, player2.value, game, gameIdx, 0)
      const suffixLen = getRandomInt(1e5, 5e5)
      const suffixArray = new Uint8Array(suffixLen).fill(0xaa)

      const dummyFile = new Blob([dummyBase, suffixArray, new Uint32Array([suffixLen]), 'DUMMYREC'])
      zip.file(replay_filename, dummyFile)
    } else {
      for (const [replayIdx, replay] of game.replays.entries()) {
        const replay_filename = computeReplayFilename(
          player1.value,
          player2.value,
          game,
          gameIdx,
          replayIdx
        )
        zip.file(replay_filename, replay.file)
      }
    }
  }
  const metaFile = new Blob([JSON.stringify(meta.value)], { type: 'application/json' })
  zip.file('metadata.json', metaFile)

  zip
    .generateAsync({
      type: 'blob',
      comment: zipComment,
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    })
    .then(function (blob) {
      saveAs(blob, zipFilename(player1.value, player2.value))
    })
}

const discordMessage = computed(() => {
  const boPaLabel = boPa.value?.toString() ?? 'Best of' // TODO: should there be a default value?
  const scorePreview = showResults.value ? `|| ${leftScore.value} - ${rightScore.value} ||` : 'vs'
  return `${player1.value} ${scorePreview} ${player2.value}
${boPaLabel} ${expectedGamesCount.value}
Map draft: <${extractDraftUrl(mapDraft.value)}>
Civ draft: <${extractDraftUrl(civDraft.value)}>`
})

function updateMeta(newErrors: ReplayErrors, newMeta: ReplayMetadata) {
  // Guess set length based on map draft
  if (!props.tournament && newMeta?.maps?.pickedMaps?.length) {
    const numOfMaps = newMeta.maps.pickedMaps.length
    if (numOfMaps % 2 == 0) {
      setExpectedGamesCount(numOfMaps + 1)
    } else {
      setExpectedGamesCount(numOfMaps)
    }
  }

  meta.value = newMeta
  metaErrors.value = newErrors

  const preset = meta.value.maps?.preset ?? meta.value.civs?.preset
  if (!props.tournament || !preset) {
    return
  }

  const presetToSetType: Record<string, MatchSetDefinition> = Object.fromEntries(
    [...Object.entries(props.tournament.maps), ...Object.entries(props.tournament.civs)].flatMap(
      ([setType, presets]) => presets.map((preset) => [preset, MatchSetDefinition.parse(setType)])
    )
  )

  const setDefinition = presetToSetType[preset]
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
v-if="mapPresets || civPresets" v-model:map-draft="mapDraft" v-model:civ-draft="civDraft"
      :civ-presets="civPresets" :map-presets="mapPresets" />
    <template #fallback>
      <div :class="$style.fallback">Loading Drafts...</div>
    </template>
  </Suspense>
  <MatchInfoForm
v-model:player1="player1" v-model:player2="player2" v-model:map-draft="mapDraft"
    v-model:civ-draft="civDraft" :expected-games-count="expectedGamesCount" :civ-presets="civPresets"
    :map-presets="mapPresets" :drafts="drafts" :bo-pa="boPa" @update-meta="updateMeta">
    <MatchSetPicker
v-if="!setTypeRestrictions" :games-count="expectedGamesCount" @set-games="setExpectedGamesCount"
      @set-bo-pa="(newBoPa) => (boPa = newBoPa)" />
    <TournamentSetPicker
v-else :set-types="setTypeRestrictions" :type="boPa" :length="expectedGamesCount"
      @set-games="setExpectedGamesCount" @set-bo-pa="(newBoPa) => (boPa = newBoPa)" />
  </MatchInfoForm>

  <GameList :show-results="showResults">
    <ToggleButton v-model="showResults" :class="$style.alignStart" label="Show results (spoilers)" />
    <ReplayDropzone />
  </GameList>

  <BaseCard align="center" spacing="top">
    <ZipPreview :games="gamesStore.games" :player1="player1" :player2="player2" :meta="meta" />
    <BaseButton
variant="primary" size="lg" :class="$style.downloadButton" :disabled="!downloadEnabled"
      @click="downloadZip">
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
