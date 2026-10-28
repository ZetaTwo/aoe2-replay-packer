<script setup lang="ts">
import PackerInstructions from '@/components/packer/PackerInstructions.vue'
import PackerForm from '@/components/packer/PackerForm.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import tournamentsData from 'virtual:tournaments-data'
import { getPresets, getTournament } from '@/entities/tournament'

const urlParams = new URLSearchParams(window.location.search)
const tournament = getTournament(urlParams, tournamentsData)
const [civDraftPresets, mapDraftPresets] = getPresets(urlParams, tournament)
const tournamentTitle = tournament?.name ?? null
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
