<script setup lang="ts">
import { watch, ref } from 'vue'
import { MatchSetDefinition, MatchSetType } from '@/entities/matchset'
import SegmentedOption from '@/components/common/SegmentedOption.vue'

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
  <div :class="$style.wrap">
    <ul :class="$style.list">
      <li v-for="setType in props.setTypes" :key="setType.label()" :class="$style.cell">
        <SegmentedOption
          v-model="chosenSetDefinition"
          :input-id="`${setType.type}-${setType.length}`"
          name="set-definition"
          :value="setType"
        >
          {{ setType.label() }}
        </SegmentedOption>
      </li>
    </ul>
  </div>
</template>

<style module>
.wrap {
  margin-top: var(--space-4);
  text-align: center;
}
.list {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: var(--space-6);
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
}
.cell {
  flex-basis: 18.18%;
}
</style>
