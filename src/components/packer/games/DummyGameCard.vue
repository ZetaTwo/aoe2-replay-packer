<script setup lang="ts">
import GameActions from './GameActions.vue'
import type { Game } from '@/entities/game'

const props = defineProps<{
  index: number
  numGames: number
  game: Game
}>()
</script>
<template>
  <div>
    <GameActions :class="$style.actions" :game-index="props.index" :show-clear="false" />
    <h3 :class="$style.title">Game {{ props.index + 1 }}</h3>
    <h4 :class="$style.subtitle">Placeholder game</h4>
    <p :class="$style.muted">
      This is a placeholder for a game not played, e.g. because of an admin win, or because the set
      already has a winner from the previous games.
    </p>
    <p :class="$style.muted">
      <strong
        >The replay packer will automatically generate a savegame to avoid spoilers for
        casters.</strong
      >
    </p>
  </div>
</template>

<style module>
.actions {
  position: absolute;
  right: 0;
  top: var(--space-1);
}
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
}
.subtitle {
  text-align: center;
  font-size: var(--font-size-lg);
}
.muted {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
