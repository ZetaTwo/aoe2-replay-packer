<script setup lang="ts">
import { Game, computeReplayFilename } from '@/entities/game'

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
    <span v-if="game.isDummy()" :class="$style.badge">dummy file</span>
  </span>
</template>

<style module>
.badge {
  margin-left: var(--space-4);
  margin-right: var(--space-2);
  padding: 0.125rem var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-subtle);
  color: var(--color-accent-text);
  border: 1px solid var(--color-accent-text);
}
</style>
