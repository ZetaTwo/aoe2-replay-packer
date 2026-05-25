<script setup lang="ts">
const model = defineModel<unknown>()

defineProps<{
  value: unknown
  inputId: string
  name: string
  join?: 'left' | 'right'
}>()
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    type="radio"
    :name="name"
    :value="value"
    class="sr-only"
  />
  <label
    :for="inputId"
    :class="[
      $style.tile,
      join === 'left' ? $style.joinLeft : null,
      join === 'right' ? $style.joinRight : null,
      !join ? $style.standalone : null
    ]"
  >
    <div :class="$style.label"><slot /></div>
  </label>
</template>

<style module>
.tile {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4);
  background-color: var(--color-bg-card);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border-default);
  cursor: pointer;
}
.tile:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
}
.standalone {
  border-radius: var(--radius-lg);
}
.joinLeft {
  border-top-left-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);
  border-right-width: 1px;
}
.joinRight {
  border-top-right-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  border-left-width: 1px;
}
input:checked + .tile {
  color: var(--color-accent-text);
  border-color: var(--color-border-accent);
}
input:focus-visible + .tile {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.label {
  text-align: center;
  width: 100%;
  font-size: var(--font-size-lg);
  font-weight: 600;
}
</style>
