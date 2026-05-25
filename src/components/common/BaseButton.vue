<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'gray' | 'primary'
    size?: 'sm' | 'lg'
    disabled?: boolean
  }>(),
  { variant: 'gray', size: 'sm', disabled: false }
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      $style.btn,
      variant === 'primary' ? $style.primary : $style.gray,
      size === 'lg' ? $style.lg : $style.sm,
      disabled ? $style.disabled : null
    ]"
  >
    <slot />
  </button>
</template>

<style module>
.btn {
  display: inline-block;
  border: 0;
  cursor: pointer;
  font: inherit;
  line-height: 1.2;
  border-radius: var(--radius-sm);
}
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-base);
}
.lg {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-2xl);
  border-radius: var(--radius-md);
}
.gray {
  background-color: var(--color-bg-subtle);
  color: var(--color-text-primary);
}
.primary {
  background-color: var(--color-accent);
  color: var(--color-text-on-accent);
}
.primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}
.disabled,
.btn:disabled {
  cursor: not-allowed;
}
.primary.disabled,
.primary:disabled {
  background-color: var(--color-accent-disabled);
}
.gray.disabled,
.gray:disabled {
  color: var(--color-text-muted);
}
</style>
