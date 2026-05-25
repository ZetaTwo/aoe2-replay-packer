<script setup lang="ts">
const props = defineProps<{
  color: number
}>()
</script>
<template>
  <div :class="[$style.swatch, $style[`color${props.color}`]]">
    <span>{{ props.color }}</span>
  </div>
</template>

<style module>
/* Swatch backgrounds are fixed AoE2 brand colors that don't flip with the
   theme, so the number on top stays dark in both light and dark mode. */
.swatch {
  display: grid;
  align-content: center;
  text-align: center;
  font-weight: 700;
  color: #111827;
  border: 2px solid var(--color-border-section);
}
.color1 {
  background-color: var(--player-color-1);
}
.color2 {
  background-color: var(--player-color-2);
}
.color3 {
  background-color: var(--player-color-3);
}
.color4 {
  background-color: var(--player-color-4);
}
.color5 {
  background-color: var(--player-color-5);
}
.color6 {
  background-color: var(--player-color-6);
}
.color7 {
  background-color: var(--player-color-7);
}
.color8 {
  background-color: var(--player-color-8);
}
</style>
