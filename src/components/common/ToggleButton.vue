<script setup lang="ts">
const props = defineProps<{
  label: string
}>()

const model = defineModel<boolean>()
</script>
<template>
  <label :class="$style.wrapper">
    <input v-model="model" type="checkbox" class="sr-only" />
    <span :class="$style.track"></span>
    <span :class="$style.label">{{ props.label }}</span>
  </label>
</template>

<style module>
.wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.track {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  background-color: var(--color-border-default);
  border-radius: var(--radius-full);
  transition: background-color 0.2s;
}
/* Thumb is always white — it sits on top of the colored track in any theme. */
.track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border-section);
  border-radius: var(--radius-full);
  transition: transform 0.2s, border-color 0.2s;
}
input:checked ~ .track {
  background-color: var(--color-accent);
}
input:checked ~ .track::after {
  transform: translateX(100%);
  border-color: #ffffff;
}
input:focus-visible ~ .track {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.label {
  margin-inline-start: var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}
</style>
