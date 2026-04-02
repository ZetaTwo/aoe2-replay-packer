<script setup lang="ts">
import { Game, zipFilename } from '../entities/game'
import type { ReplayMetadata } from '../entities/gamemeta'
import ZipPreviewFile from './ZipPreviewFile.vue'

const props = defineProps<{
  games: Game[]
  player1: string
  player2: string
  meta: ReplayMetadata
}>()
</script>

<template>
  <h2 class="text-center text-2xl">Preview</h2>
  <div class="text-left">
    {{ zipFilename(player1, player2) }}<br />
    <template v-if="meta.civs || meta.maps"><span>├──metadata.json</span><br /></template>
    <template v-for="(game, gameIdx) in props.games" :key="game.id">
      <template v-if="game.isDummy()">
        <ZipPreviewFile
          :game="game"
          :player1="player1"
          :player2="player2"
          :game-idx="gameIdx"
          :replay-idx="0"
          :last="gameIdx == props.games.length - 1"
        /><br />
      </template>
      <template v-for="(replay, replayIdx) in game.replays" v-else :key="replay.id">
        <ZipPreviewFile
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
