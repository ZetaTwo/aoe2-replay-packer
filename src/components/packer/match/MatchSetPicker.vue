<script setup lang="ts">
import { ref, watch } from 'vue'
import { MatchSetType } from '@/entities/matchset'
import SegmentedOption from '@/components/common/SegmentedOption.vue'

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
  <div :class="$style.wrap">
    <ul :class="$style.list">
      <li :class="$style.bopaCell">
        <div :class="$style.bopaRow">
          <div :class="$style.half">
            <SegmentedOption
              v-model="boPa"
              input-id="best-of"
              name="bo-pa"
              :value="MatchSetType.BestOf"
              join="left"
            >
              Best of
            </SegmentedOption>
          </div>
          <div :class="$style.half">
            <SegmentedOption
              v-model="boPa"
              input-id="play-all"
              name="bo-pa"
              :value="MatchSetType.PlayAll"
              join="right"
            >
              Play all
            </SegmentedOption>
          </div>
        </div>
      </li>
      <li v-for="count in [3, 5, 7]" :key="count" :class="$style.cell">
        <SegmentedOption v-model="bestOf" :input-id="`bo${count}`" name="bo" :value="count">
          {{ count }} Games
        </SegmentedOption>
      </li>
      <li :class="$style.cell">
        <SegmentedOption v-model="bestOf" input-id="bo-custom" name="bo" value="custom">
          <input
            v-model="customGameCount"
            :class="$style.numberInput"
            type="number"
            aria-roledescription="Number field"
            value="9"
            min="1"
            max="99"
            maxlength="2"
          />
          Games
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
  list-style: none;
  padding: 0;
  margin: 0;
}
.bopaCell {
  flex-basis: 27.27%;
}
.bopaRow {
  display: flex;
}
.cell {
  flex-basis: 18.18%;
}
.half {
  display: inline-flex;
  width: 50%;
}
.numberInput {
  padding: 0;
  width: 2rem;
  background-color: transparent;
  border: 1px solid var(--color-border-section);
  color: var(--color-text-primary);
  text-align: center;
  -moz-appearance: textfield;
}
.numberInput::-webkit-inner-spin-button,
.numberInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.numberInput:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
