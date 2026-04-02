<script setup lang="ts">
const expanded = defineModel<boolean>()

const { openText = 'Expand', closeText = 'Hide' } = defineProps<{
  openText?: string
  closeText?: string
}>()
</script>
<template>
  <button
    class="text-sm mt-2 pl-2 pr-2 rounded-full border-2 cursor-pointer text-gray-500 dark:hover:text-gray-300 hover:text-gray-600 dark:text-gray-400 dark:border-gray-700"
    @click="expanded = !expanded"
  >
    <svg
      v-if="expanded"
      class="w-6 h-6 inline-block"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 15L12 9L6 15" stroke-width="2" />
    </svg>
    <svg
      v-else
      class="w-6 h-6 inline-block"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 9L12 15L6 9" stroke-width="2" />
    </svg>
    <span class="h-6">{{ expanded ? closeText : openText }}</span>
  </button>
</template>
