<script setup lang="ts">
import { format } from 'date-fns'
import { UTCDate } from '@date-fns/utc'
import GameOrderControls from './GameOrderControls.vue'
import GameActions from './GameActions.vue'
import { type Game, type GameOutcome, dummyWinner } from '@/entities/game'
import GameTeam from './GameTeam.vue'
import ExpandButton from '@/components/common/ExpandButton.vue'
import winner from '@/assets/crown.svg'
import loser from '@/assets/skull.svg'
import { computed, ref } from 'vue'
import { readableSize } from '@/lib/maths'
import MoveReplayButton from './MoveReplayButton.vue'
import MoveReplayModal from './MoveReplayModal.vue'
import RelativeDate from '@/components/common/RelativeDate.vue'
import { useGamesStore } from '@/stores/games'

const props = defineProps<{
  index: number
  numGames: number
  game: Game
  showResults: boolean
}>()

const emit = defineEmits<{
  setOutcome: [outcome: GameOutcome]
  move: [direction: 'up' | 'down']
}>()

const { moveReplay } = useGamesStore()

const leftName = computed(() => props.game.teams[0]?.players?.[0]?.name)
const rightName = computed(() => {
  if (typeof props.game.teams == 'undefined') {
    return ''
  }

  return props.game.teams[1]?.players?.[0]?.name
})

const replayExpandText = computed(
  () => `${props.game.replays.length} replay${props.game.replays.length > 1 ? 's' : ''}`
)
const showReplays = ref<boolean>(false)
const showModal = ref<number | null>(null)

function moveGameReplay(replayId: number, targetGame: number) {
  showModal.value = null
  moveReplay(replayId, props.index, targetGame)
}
</script>
<template>
  <div>
    <GameOrderControls
      :class="$style.orderControls"
      :top="props.index == 0"
      :bottom="props.index + 1 == props.numGames"
      @move="(direction: 'up' | 'down') => emit('move', direction)"
    />
    <GameActions :class="$style.actions" :game-index="props.index" />
    <h3 :class="$style.title">Game {{ props.index + 1 }}</h3>
    <h4 v-if="props.game.isUnparseable()" :class="[$style.subtitle, $style.warning]">
      Unparseable game
    </h4>
    <h4 :class="$style.subtitle">{{ props.game.mapName }}</h4>
    <p v-if="props.game.date" :class="$style.muted">
      Played <RelativeDate :date="props.game.date" /> and lasted
      {{ format(new UTCDate(props.game.duration), 'HH:mm:ss') }}
    </p>
    <p v-if="props.game.replays.length > 1" :class="$style.muted">
      Game was restored {{ props.game.replays.length - 1 }} time{{
        props.game.replays.length > 2 ? 's' : ''
      }}
    </p>
    <div v-if="showResults" :class="$style.winnerRow">
      <div :class="$style.winnerHalf">
        <input
          :id="`winner-${props.game.id}`"
          type="radio"
          :name="`winlose-${props.game.id}`"
          class="sr-only"
          :checked="props.game.outcome?.side == 'left'"
          value="left"
          @change="
            emit('setOutcome', props.game.teams[0]?.asGameWinner('left') ?? dummyWinner('left'))
          "
        />
        <label :for="`winner-${props.game.id}`" :class="[$style.winnerLabel, $style.left]">
          <img
            :src="props.game.outcome?.side == 'left' ? winner : loser"
            width="35"
            height="35"
            :class="$style.outcomeIcon"
          />
          {{ leftName }}
        </label>
      </div>
      <div :class="$style.winnerHalf">
        <input
          :id="`loser-${props.game.id}`"
          type="radio"
          :name="`winlose-${props.game.id}`"
          class="sr-only"
          :checked="props.game.outcome?.side == 'right'"
          value="right"
          @change="
            emit('setOutcome', props.game.teams[1]?.asGameWinner('right') ?? dummyWinner('right'))
          "
        />
        <label :for="`loser-${props.game.id}`" :class="[$style.winnerLabel, $style.right]">
          {{ rightName }}
          <img
            :src="props.game.outcome?.side == 'right' ? winner : loser"
            width="35"
            height="35"
            :class="$style.outcomeIcon"
          />
        </label>
      </div>
    </div>
    <div v-if="props.game.isUnparseable()" :class="$style.unparseable">
      <p :class="$style.muted">
        This recording <strong>could not be parsed</strong> by the replay packer.
      </p>
      <p :class="$style.muted">
        Please check that you have selected the <strong>correct file</strong>. Consider
        <a href="https://forms.gle/NDKqE8acLdYR2JrKA" target="_blank"
          >reporting an issue</a
        >.
      </p>
      <p :class="[$style.muted, $style.spacedTop]">
        The uploaded file will still be included in the downloaded Zip. You can proceed with the
        submission of your results regardless of this issue.
      </p>
    </div>
    <div v-else :class="$style.teamsGrid">
      <GameTeam
        v-for="(team, teamIndex) in props.game.teams"
        :key="team.id"
        :team="team"
        :position="teamIndex % 2 ? 'right' : 'left'"
        :class="$style.teamBox"
      />
    </div>
    <div :class="$style.replaysFooter">
      <ExpandButton
        v-model="showReplays"
        :open-text="replayExpandText"
        :close-text="replayExpandText"
      />
      <ul :class="[$style.replaysList, showReplays ? $style.open : $style.closed]">
        <li v-for="replay in props.game.replays" :key="replay.id" :class="$style.replayItem">
          {{ replay.file.name }} ({{ readableSize(replay.file.size) }})
          <MoveReplayButton @click="showModal = replay.id" />
          <MoveReplayModal
            :show="showModal == replay.id"
            :current-game="props.index"
            :total-games="props.numGames"
            :replay="replay"
            @close="showModal = null"
            @move="(targetGame) => moveGameReplay(replay.id, targetGame)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style module>
.orderControls {
  position: absolute;
  left: 0;
  top: 0;
}
.actions {
  position: absolute;
  right: 0;
  top: var(--space-1);
}
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
}
.subtitle {
  text-align: center;
  font-size: var(--font-size-lg);
}
.warning {
  color: var(--color-unparseable-text);
}
.muted {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.winnerRow {
  display: flex;
  margin-top: var(--space-6);
  padding: 0 var(--space-6);
}
.winnerHalf {
  display: inline-flex;
  width: 50%;
  height: 100%;
}
.winnerLabel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--space-2);
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  cursor: pointer;
  border-top: 2px solid var(--color-border-default);
  border-bottom: 2px solid var(--color-border-default);
}
.left {
  border-left: 2px solid var(--color-border-default);
  border-right: 1px solid var(--color-border-default);
  border-top-left-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);
}
.right {
  border-right: 2px solid var(--color-border-default);
  border-left: 1px solid var(--color-border-default);
  border-top-right-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}
.winnerLabel:hover {
  background-color: var(--color-bg-hover);
}
input:checked + .winnerLabel {
  border-color: var(--color-border-accent);
  color: var(--color-accent-text);
}
input:focus-visible + .winnerLabel {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.outcomeIcon {
  margin-top: calc(-1 * var(--space-1));
  margin-bottom: calc(-1 * var(--space-1));
}
.unparseable {
  margin-top: var(--space-4);
}
.spacedTop {
  margin-top: var(--space-2);
}
.teamsGrid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  justify-items: stretch;
  margin-top: var(--space-4);
  margin-bottom: var(--space-12);
  padding: 0 var(--space-6);
}
.teamBox {
  border: 2px solid var(--color-border-section);
  padding: var(--space-4);
}
.replaysFooter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.replaysList {
  margin-top: var(--space-2);
  overflow: hidden;
  transition: max-height 0.2s;
  list-style: none;
  padding: 0;
}
.open {
  max-height: 100vh;
}
.closed {
  max-height: 0;
}
.replayItem {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  align-items: center;
}
</style>
