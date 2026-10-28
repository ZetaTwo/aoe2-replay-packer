<script setup lang="ts">
import { Game, zipFilename } from '@/entities/game'
import ZipPreviewEntry from './ZipPreviewEntry.vue'

const props = defineProps<{
  games: Game[]
  player1: string
  player2: string
}>()
</script>

<template>
  <h2 :class="$style.title">Preview</h2>
  <div :class="$style.tree">
    {{ zipFilename(player1, player2) }}<br />
    <span>├──metadata.json</span><br />
    <template v-for="(game, gameIdx) in props.games" :key="game.id">
      <template v-if="game.isDummy()">
        <ZipPreviewEntry
          :game="game"
          :player1="player1"
          :player2="player2"
          :game-idx="gameIdx"
          :replay-idx="0"
          :last="gameIdx == props.games.length - 1"
        /><br />
      </template>
      <template v-for="(replay, replayIdx) in game.replays" v-else :key="replay.id">
        <ZipPreviewEntry
          :game="game"
          :player1="player1"
          :player2="player2"
          :game-idx="gameIdx"
          :replay-idx="replayIdx"
          :last="gameIdx == props.games.length - 1 && replayIdx == game.replays.length - 1"
        /><br />
      </template>
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
