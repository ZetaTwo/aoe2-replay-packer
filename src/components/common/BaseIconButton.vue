<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <button type="button" :class="$style.btn" :title="title">
    <slot />
  </button>
</template>

<style module>
.btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: 0;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
}
.btn:hover {
  background-color: var(--color-bg-hover);
}
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
