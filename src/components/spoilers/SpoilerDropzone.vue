<script setup lang="ts">
import { useSpoilerStore } from '@/stores/spoiler'
import BaseDropzone from '@/components/common/BaseDropzone.vue'

const spoilerStore = useSpoilerStore()

function onFiles(files: File[]) {
  spoilerStore.clearRecordings()
  for (const file of files) {
    if (file.name.endsWith('.aoe2record')) {
      spoilerStore.addRecording(file)
    } else {
      spoilerStore.expandArchive(file)
    }
  }
}
</script>

<template>
  <BaseDropzone
    description="One or multiple aoe2record savegames or a zip file containing them"
    @files="onFiles"
  />
</template>
