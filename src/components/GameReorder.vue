<script setup lang="ts">
const props = defineProps<{
  top: boolean
  bottom: boolean
}>()

const emit = defineEmits<{
  move: [direction: 'up' | 'down']
}>()
</script>
<template>
  <div class="flex flex-col h-full justify-between">
    <button
      v-if="!props.top"
      class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-hidden focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5 text-left"
      type="button"
      title="Move up"
      @click="emit('move', 'up')"
    >
      <svg
        class="w-6 h-6 text-gray-500 dark:text-gray-400 inline-block"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z"
        ></path>
      </svg>
      <span class="h-6 p-3">Move up</span>
    </button>
    <div v-else></div>

    <button
      v-if="!props.bottom"
      class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-hidden focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5 text-left"
      type="button"
      title="Move down"
      @click="emit('move', 'down')"
    >
      <svg
        class="w-6 h-6 text-gray-500 dark:text-gray-400 inline-block"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.3166 21.0976 11.6834 21.0976 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3Z"
        ></path>
      </svg>
      <span class="h-6 p-3">Move down</span>
    </button>
    <div v-else></div>
  </div>
</template>
