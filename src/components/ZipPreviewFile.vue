<script setup lang="ts">
import { Game, computeReplayFilename } from '../entities/game'

const props = defineProps<{
  player1: string
  player2: string
  game: Game
  gameIdx: number
  replayIdx: number
  last: boolean
}>()
</script>

<template>
  <span>
    <span v-if="last">└──</span>
    <span v-else>├──</span>
    <span>{{
      computeReplayFilename(
        props.player1,
        props.player2,
        props.game,
        props.gameIdx,
        props.replayIdx
      )
    }}</span>
    <span
      v-if="game.isDummy()"
      class="ml-5 bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2 py-0.5 rounded-sm dark:bg-gray-700 dark:text-blue-400 border border-blue-400"
      >dummy file</span
    >
  </span>
</template>
