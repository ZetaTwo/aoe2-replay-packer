<script setup lang="ts">
import { ref, watch } from 'vue'
import { MatchSetType } from '@/entities/matchset'

const emit = defineEmits<{
  setGames: [number]
  setBoPa: [MatchSetType]
}>()

const props = defineProps<{
  gamesCount: number
}>()

const customGameCount = ref(9)
const bestOf = ref<number | 'custom'>(props.gamesCount)
const boPa = ref<MatchSetType | null>(null)

watch(customGameCount, async (newCount, oldCount) => {
  if (newCount == oldCount) {
    return
  }
  if (newCount < 0) {
    customGameCount.value = 0
    return
  }
  if (newCount > 99) {
    customGameCount.value = 99
    return
  }
  if (bestOf.value != 'custom') {
    return
  }
  emit('setGames', newCount)
})

watch(
  () => props.gamesCount,
  (newGamesCount, oldGamesCount) => {
    if (newGamesCount == oldGamesCount) {
      return
    }

    if (bestOf.value != newGamesCount) {
      customGameCount.value = newGamesCount
    }

    if (bestOf.value != 'custom' && [3, 5, 7].includes(newGamesCount)) {
      bestOf.value = newGamesCount
    } else {
      bestOf.value = 'custom'
    }
  }
)

watch(bestOf, (newBestOf, oldBestOf) => {
  if (newBestOf == oldBestOf) {
    return
  }
  if (newBestOf == 'custom') {
    emit('setGames', customGameCount.value)
  } else {
    emit('setGames', newBestOf)
  }
})

watch(boPa, (newBoPa, oldBoPa) => {
  if (newBoPa == oldBoPa) {
    return
  }
  if (newBoPa == null) {
    return
  }
  emit('setBoPa', newBoPa)
})
</script>
<template>
  <div class="mt-4 text-center">
    <ul class="w-full gap-6 flex flex-row">
      <li class="basis-3/11">
        <div class="block">
          <div class="inline-flex w-1/2">
            <input
              id="best-of"
              v-model="boPa"
              type="radio"
              name="bo-pa"
              class="hidden peer"
              :value="MatchSetType.BestOf"
            />
            <label
              for="best-of"
              class="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-r border-l-2 border-y-2 rounded-l-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div class="text-center w-full text-lg font-semibold">Best of</div>
            </label>
          </div>
          <div class="inline-flex w-1/2">
            <input
              id="play-all"
              v-model="boPa"
              type="radio"
              name="bo-pa"
              class="hidden peer"
              :value="MatchSetType.PlayAll"
            />
            <label
              for="play-all"
              class="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-l border-r-2 border-y-2 rounded-r-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div class="text-center w-full text-lg font-semibold">Play all</div>
            </label>
          </div>
        </div>
      </li>
      <li v-for="count in [3, 5, 7]" :key="count" class="basis-2/11" :value="count">
        <input
          :id="`bo${count}`"
          v-model="bestOf"
          type="radio"
          name="bo"
          :value="count"
          class="hidden peer"
          required
        />
        <label
          :for="`bo${count}`"
          class="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div class="block w-full">
            <div class="text-center w-full text-lg font-semibold">{{ count }} Games</div>
          </div>
        </label>
      </li>

      <li class="basis-2/11">
        <input
          id="bo-custom"
          v-model="bestOf"
          type="radio"
          name="bo"
          value="custom"
          class="hidden peer"
          :checked="bestOf == 'custom'"
        />
        <label
          for="bo-custom"
          class="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div class="block w-full">
            <div class="w-full text-lg font-semibold">
              <input
                v-model="customGameCount"
                class="p-0 w-8 bg-transparent border text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white"
                style="-moz-appearance: textfield"
                type="number"
                aria-roledescription="Number field"
                value="9"
                data-hs-input-number-input=""
                min="1"
                max="99"
                maxlength="2"
              />
              Games
            </div>
          </div>
        </label>
      </li>
    </ul>
  </div>
</template>
