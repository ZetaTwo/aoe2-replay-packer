<script setup lang="ts">
import { computed } from 'vue'
import { Game, zipFilename } from '@/entities/game'
import { replayEntries } from '@/entities/packer'
import ZipPreviewEntry from './ZipPreviewEntry.vue'

const props = defineProps<{
  games: Game[]
  player1: string
  player2: string
}>()

const entries = computed(() => replayEntries(props.games, props.player1, props.player2))
</script>

<template>
  <h2 :class="$style.title">Preview</h2>
  <div :class="$style.tree">
    {{ zipFilename(player1, player2) }}<br />
    <span>├──metadata.json</span><br />
    <template v-for="(entry, entryIdx) in entries" :key="entry.filename">
      <ZipPreviewEntry
        :filename="entry.filename"
        :placeholder="entry.kind == 'placeholder'"
        :last="entryIdx == entries.length - 1"
      /><br />
    </template>
  </div>
</template>

<style module>
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
}
.tree {
  text-align: left;
}
</style>
