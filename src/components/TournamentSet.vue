<script setup lang="ts">
import { watch, ref } from 'vue'
import { MatchSetDefinition, MatchSetType } from '@/entities/matchset'

const emit = defineEmits<{
  setGames: [number]
  setBoPa: [MatchSetType]
}>()

const props = defineProps<{
  setTypes: MatchSetDefinition[] | undefined
  type: MatchSetType | null
  length: number
}>()

const chosenSetDefinition = ref<MatchSetDefinition | null>(null)

watch(
  () => [props.type, props.length],
  ([newType, newLength], [oldType, oldLength]) => {
    if (newType == oldType && newLength == oldLength) {
      return
    }

    for (const candidateType of props.setTypes ?? []) {
      if (candidateType.length == newLength && candidateType.type == newType) {
        chosenSetDefinition.value = candidateType
        return
      }
    }
  }
)

watch(chosenSetDefinition, (newType, oldType) => {
  if (newType == null) {
    return
  }
  if (newType == oldType) {
    return
  }

  emit('setGames', newType.length)
  emit('setBoPa', newType.type)
})
</script>
<template>
  <div class="mt-4 text-center">
    <ul class="w-full gap-6 flex flex-row justify-center">
      <li v-for="setType in props.setTypes" :key="setType.label()" class="basis-2/11">
        <input
          :id="`${setType.type}-${setType.length}`"
          v-model="chosenSetDefinition"
          name="set-definition"
          type="radio"
          :value="setType"
          class="hidden peer"
          required
        />
        <label
          :for="`${setType.type}-${setType.length}`"
          class="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div class="block w-full">
            <div class="text-center w-full text-lg font-semibold">{{ setType.label() }}</div>
          </div>
        </label>
      </li>
    </ul>
  </div>
</template>
