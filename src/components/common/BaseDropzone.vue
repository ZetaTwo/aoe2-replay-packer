<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    accept?: string
    description?: string
  }>(),
  {
    accept: '.aoe2record, .zip, .rar, .7z',
    description: 'One or multiple aoe2record savegames'
  }
)

const emit = defineEmits<{
  files: [files: FileList]
}>()

const inputId = useId()

function onDrop(event: DragEvent) {
  if (!event?.dataTransfer?.files) {
    return
  }
  emit('files', event.dataTransfer.files)
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) {
    return
  }
  emit('files', target.files)
  target.value = ''
}
</script>

<template>
  <div
    :class="$style.wrapper"
    @dragenter.prevent
    @dragover.prevent
    @drop.prevent="onDrop($event)"
  >
    <label :for="inputId" :class="$style.zone">
      <div :class="$style.content">
        <svg
          :class="$style.icon"
          fill="currentColor"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            stroke="currentColor"
            d="M256,0C114.837,0,0,114.837,0,256s114.837,256,256,256s256-114.837,256-256S397.163,0,256,0z M384,277.333H277.333V384 c0,11.776-9.557,21.333-21.333,21.333s-21.333-9.557-21.333-21.333V277.333H128.043c-11.776,0-21.333-9.557-21.333-21.333 s9.557-21.333,21.333-21.333h106.624V128c0-11.776,9.557-21.333,21.333-21.333s21.333,9.557,21.333,21.333v106.667H384 c11.776,0,21.333,9.557,21.333,21.333S395.776,277.333,384,277.333z"
          ></path>
        </svg>
        <p :class="$style.primary">
          <span :class="$style.strong">Click to add replay(s)</span> or drag and drop
        </p>
        <p :class="$style.secondary">{{ description }}</p>
      </div>
      <input
        :id="inputId"
        :accept="accept"
        multiple
        type="file"
        class="sr-only"
        @change="onChange($event)"
      />
    </label>
  </div>
</template>

<style module>
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: var(--space-4);
}
.zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 2px dashed var(--color-border-section);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-subtle);
  cursor: pointer;
}
.zone:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-text-muted);
}
.zone:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) var(--space-4) var(--space-6);
}
.icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}
.primary {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.strong {
  font-weight: 600;
}
.secondary {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
