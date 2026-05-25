<script setup lang="ts">
import CivIcon from '@/components/common/CivIcon.vue'
import PlayerColor from '@/components/common/PlayerColor.vue'
import type { Team } from '@/entities/game'

const { team } = defineProps<{
  team: Team
  position: 'left' | 'right'
}>()
</script>

<template>
  <div :class="$style.team">
    <div
      v-for="player in team.players"
      :key="player.profile"
      :class="[$style.row, position === 'right' ? $style.reversed : null]"
    >
      <div :class="$style.name">
        <a
          :href="`https://aoe2insights.com/user/relic/${player.profile}`"
          :class="$style.link"
          target="_blank"
          >{{ player.name }}</a
        >
      </div>
      <CivIcon :civ="player.civ.toLowerCase()" :class="$style.civ" />
      <PlayerColor :color="player.color ?? 0" :class="$style.color" />
    </div>
  </div>
</template>

<style module>
.team {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  border-radius: var(--radius-lg);
}
/* Row is right-packed by default. Adding .reversed flips the visual order
   while keeping flex-end packing, which moves the items to the left edge —
   the layout we want for right-positioned teams. */
.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  justify-content: flex-end;
}
.reversed {
  flex-direction: row-reverse;
}
.name {
  flex-grow: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}
.link {
  color: var(--color-accent-text);
}
.civ {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
}
.color {
  width: 2.25rem;
  height: 2.25rem;
}
</style>
