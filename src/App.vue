<script setup lang="ts">
import PackerInstructions from '@/components/packer/PackerInstructions.vue'
import PackerForm from '@/components/packer/PackerForm.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import tournamentsData from 'virtual:tournaments-data'
import type { Tournament } from 'virtual:tournaments-data'

const getPresets = (
  params: URLSearchParams,
  tournament?: Tournament
): [string[] | null, string[] | null] => {
  const civDraftPresets = params.get('civpresets')?.split(',') || []
  const mapDraftPresets = params.get('mappresets')?.split(',') || []
  if (tournament) {
    civDraftPresets.push(...Object.values(tournament.civs).flat())
    mapDraftPresets.push(...Object.values(tournament.maps).flat())
  }
  return [
    civDraftPresets.length > 0 ? civDraftPresets : null,
    mapDraftPresets.length > 0 ? mapDraftPresets : null
  ]
}

const getTournament = (params: URLSearchParams): Tournament | undefined => {
  const tournamentId = params.get('tournament')
  if (!tournamentId) {
    return
  }
  return tournamentsData[tournamentId]
}

const getTournamentTitle = (tournament?: Tournament) => {
  if (!tournament) {
    return null
  }
  return tournament.name
}

const urlParams = new URLSearchParams(window.location.search)
const tournament: Tournament | undefined = getTournament(urlParams)
const [civDraftPresets, mapDraftPresets] = getPresets(urlParams, tournament)
const tournamentTitle = getTournamentTitle(tournament)
</script>

<template>
  <div class="container">
    <main :class="$style.main">
      <PackerInstructions :tournament-title="tournamentTitle" />
      <PackerForm
        :civ-presets="civDraftPresets"
        :map-presets="mapDraftPresets"
        :tournament="tournament"
      />
    </main>
    <AppFooter />
  </div>
</template>

<style module>
.main {
  margin-top: var(--space-10);
}
</style>
