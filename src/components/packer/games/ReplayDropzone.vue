<script setup lang="ts">
import { useGamesStore } from '@/stores/games'
import BaseDropzone from '@/components/common/BaseDropzone.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'

const gamesStore = useGamesStore()

function onFiles(files: File[]) {
  gamesStore.clearSkippedDuplicates()
  for (const file of files) {
    if (file.name.endsWith('.aoe2record')) {
      gamesStore.addRec(file)
    } else {
      gamesStore.expandArchive(file)
    }
  }
}
</script>

<template>
  <BaseDropzone @files="onFiles" />
  <BaseAlert v-if="gamesStore.skippedDuplicates.length > 0">
    WARNING: Skipped files that were already added:
    {{ gamesStore.skippedDuplicates.join(', ') }}
  </BaseAlert>
</template>
