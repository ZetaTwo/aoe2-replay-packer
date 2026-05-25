<script setup lang="ts">
import DummyGameCard from './DummyGameCard.vue'
import GameCard from './GameCard.vue'
import { useGamesStore } from '@/stores/games'
import type { GameOutcome } from '@/entities/game'

const gamesStore = useGamesStore()

const { showResults = true } = defineProps<{
  showResults?: boolean
}>()
</script>
<template>
  <div :class="$style.list">
    <slot />
    <p v-if="!gamesStore.hasGames" :class="$style.empty">No games selected yet.</p>
    <component
      :is="game.isDummy() ? DummyGameCard : GameCard"
      v-for="(game, index) in gamesStore.games"
      v-else
      :key="game.id"
      :class="$style.item"
      :game="game"
      :index="index"
      :num-games="gamesStore.realGamesCount"
      :show-results="showResults"
      @set-outcome="(outcome: GameOutcome) => (game.outcome = outcome)"
      @move="(direction: 'up' | 'down') => gamesStore.moveGame(index, direction == 'up' ? -1 : 1)"
    >
    </component>
  </div>
</template>

<style module>
.list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 2px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
}
.empty {
  color: var(--color-text-muted);
}
.item {
  position: relative;
  width: 100%;
  padding: var(--space-6);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
</style>
