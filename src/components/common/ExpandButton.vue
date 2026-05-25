<script setup lang="ts">
const expanded = defineModel<boolean>()

const { openText = 'Expand', closeText = 'Hide' } = defineProps<{
  openText?: string
  closeText?: string
}>()
</script>
<template>
  <button :class="$style.btn" @click="expanded = !expanded">
    <svg
      v-if="expanded"
      :class="$style.chevron"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 15L12 9L6 15" stroke-width="2" />
    </svg>
    <svg
      v-else
      :class="$style.chevron"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 9L12 15L6 9" stroke-width="2" />
    </svg>
    <span>{{ expanded ? closeText : openText }}</span>
  </button>
</template>

<style module>
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  margin-top: var(--space-2);
  padding: 0 var(--space-2);
  border: 2px solid var(--color-border-section);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}
.btn:hover {
  color: var(--color-text-secondary);
}
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.chevron {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-block;
}
</style>
