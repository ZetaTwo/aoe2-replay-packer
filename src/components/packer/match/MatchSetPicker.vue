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

const MIN_GAMES = 1
const MAX_GAMES = 99

const customGameCount = ref(9)
const bestOf = ref<number | 'custom'>(props.gamesCount)
const boPa = ref<MatchSetType | null>(null)

watch(customGameCount, async (newCount, oldCount) => {
  if (newCount == oldCount) {
    return
  }
  if (newCount < MIN_GAMES) {
    customGameCount.value = MIN_GAMES
    return
  }
  if (newCount > MAX_GAMES) {
    customGameCount.value = MAX_GAMES
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
      <li :class="$style.customCell">
        <SegmentedOption v-model="bestOf" input-id="bo-custom" name="bo" :value="'custom' as const">
          <span :class="$style.stepper">
            <button
              type="button"
              :class="$style.stepButton"
              aria-label="Fewer games"
              :disabled="customGameCount <= MIN_GAMES"
              @click="customGameCount--"
            >
              −
            </button>
            <input
              v-model="customGameCount"
              :class="$style.numberInput"
              type="number"
              aria-roledescription="Number field"
              value="9"
              :min="MIN_GAMES"
              :max="MAX_GAMES"
              maxlength="2"
            />
            <button
              type="button"
              :class="$style.stepButton"
              aria-label="More games"
              :disabled="customGameCount >= MAX_GAMES"
              @click="customGameCount++"
            >
              +
            </button>
          </span>
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
  flex-basis: 26.27%;
}
.bopaRow {
  display: flex;
}
.cell {
  flex-basis: 17.5%;
}
/* Wider to fit the stepper and "Games" on one line */
.customCell {
  flex-basis: 21.7%;
}
.half {
  display: inline-flex;
  width: 50%;
}
/* Exactly one line tall including the border, so the tile is as tall as the others */
.stepper {
  display: inline-flex;
  align-items: stretch;
  box-sizing: border-box;
  height: 1lh;
  vertical-align: top;
  border: 1px solid var(--color-border-section);
}
.numberInput {
  padding: 0;
  width: 2rem;
  background-color: transparent;
  border: 0;
  border-left: 1px solid var(--color-border-section);
  border-right: 1px solid var(--color-border-section);
  color: var(--color-text-primary);
  font: inherit;
  text-align: center;
  -moz-appearance: textfield;
}
.numberInput::-webkit-inner-spin-button,
.numberInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stepButton {
  padding: 0 3px;
  background-color: transparent;
  border: 0;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.85em;
  line-height: 1;
  cursor: pointer;
}
.stepButton:disabled {
  color: var(--color-text-muted);
  cursor: default;
}
.stepButton:focus-visible,
.numberInput:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
