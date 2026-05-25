<script setup lang="ts">
import { Game, type Replay } from '@/entities/game'
import { computed, nextTick, ref, useId, watch } from 'vue'
import GameTeam from './GameTeam.vue'
import RelativeDate from '@/components/common/RelativeDate.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { format } from 'date-fns'
import { UTCDate } from '@date-fns/utc'

const props = defineProps<{
  show: boolean
  currentGame: number
  totalGames: number
  replay: Replay
}>()
const emit = defineEmits<{
  close: []
  move: [targetGame: number]
}>()

const targetGame = ref<number>(-1)

const games = computed<number[]>(() =>
  Array.from({ length: props.totalGames }, (_value, index) => index).filter(
    (index) => index != props.currentGame
  )
)
const replayInfo = computed<Game>(() => new Game([props.replay]))

const titleId = useId()
const dialogRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      const focusable = dialogRef.value?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    } else if (previouslyFocused) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  }
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) {
    event.stopPropagation()
    emit('close')
  }
}
</script>
<template>
  <Teleport to="#modals">
    <div
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :class="[$style.backdrop, { [$style.hidden]: !props.show }]"
      :aria-hidden="!props.show"
      @keydown="onKeydown"
    >
      <div :class="$style.frame">
        <div :class="$style.dialog">
          <div :class="$style.header">
            <h3 :id="titleId" :class="$style.title">Move recording to a different game</h3>
            <button type="button" :class="$style.close" @click="emit('close')">
              <svg
                :class="$style.closeIcon"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <div :class="$style.body">
            <div :class="$style.teamsGrid">
              <GameTeam
                v-for="(team, index) in replayInfo.teams"
                :key="team.id"
                :team="team"
                :position="index % 2 == 0 ? 'left' : 'right'"
              />
              <p>
                Played on {{ replayInfo.mapName }} <RelativeDate :date="replayInfo.date" /> and was
                {{ format(new UTCDate(replayInfo.duration), 'HH:mm:ss') }} long.
              </p>
            </div>
            <div>
              <label for="game" :class="$style.label">Move to</label>
              <select id="game" v-model="targetGame" :class="$style.select">
                <option :value="-1">New game</option>
                <option v-for="game in games" :key="game" :value="game">Game {{ game + 1 }}</option>
              </select>
            </div>
            <BaseButton variant="primary" @click="emit('move', targetGame)">
              Move recording
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.backdrop {
  position: fixed;
  top: 10rem;
  left: 0;
  right: 0;
  margin: 0 auto;
  z-index: 50;
  width: 50%;
  height: 75%;
  overflow-y: auto;
  overflow-x: hidden;
}
.hidden {
  display: none;
}
.frame {
  padding: var(--space-4);
  width: 100%;
  max-height: 100%;
}
.dialog {
  border: 2px solid var(--color-border-section);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-section);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}
.title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}
.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-left: auto;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: pointer;
}
.close:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}
.close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.closeIcon {
  width: 0.75rem;
  height: 0.75rem;
}
.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}
.teamsGrid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  justify-items: stretch;
}
.label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}
.select {
  display: block;
  width: 100%;
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-subtle);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-section);
  border-radius: var(--radius-lg);
}
.select:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
