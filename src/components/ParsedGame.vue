<script setup lang="ts">
import { format } from 'date-fns'
import { UTCDate } from '@date-fns/utc'
import GameReorder from '@/components/GameReorder.vue'
import GameToolbox from '@/components/GameToolbox.vue'
import { type Game, type GameOutcome, dummyWinner } from '@/entities/game'
import GameTeam from '@/components/GameTeam.vue'
import ExpandButton from '@/components/ExpandButton.vue'
import winner from '@/assets/crown.svg'
import loser from '@/assets/skull.svg'
import { computed, ref } from 'vue'
import { readableSize } from '@/lib/maths'
import MoveButton from '@/components/MoveButton.vue'
import MoveModal from '@/components/MoveReplayModal.vue'
import GameDate from './GameDate.vue'
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
    <GameReorder
      class="absolute left-0 top-0"
      :top="props.index == 0"
      :bottom="props.index + 1 == props.numGames"
      @move="(direction: 'up' | 'down') => emit('move', direction)"
    />
    <GameToolbox class="absolute right-0 top-1" :game-index="props.index" />
    <h3 class="text-center text-2xl">Game {{ props.index + 1 }}</h3>
    <h4
      v-if="props.game.isUnparseable()"
      class="text-center text-lg text-yellow-500 dark:text-yellow-200"
    >
      Unparseable game
    </h4>
    <h4 class="text-center text-lg">{{ props.game.mapName }}</h4>
    <p v-if="props.game.date" class="text-center text-sm text-gray-500 dark:text-gray-400">
      Played <game-date :date="props.game.date" /> and lasted
      {{ format(new UTCDate(props.game.duration), 'HH:mm:ss') }}
    </p>
    <p
      v-if="props.game.replays.length > 1"
      class="text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Game was restored {{ props.game.replays.length - 1 }} time{{
        props.game.replays.length > 2 ? 's' : ''
      }}
    </p>
    <div v-if="showResults" class="flex mt-6 pl-6 pr-6">
      <div class="inline-flex w-1/2 h-full">
        <input
          :id="`winner-${props.game.id}`"
          type="radio"
          :name="`winlose-${props.game.id}`"
          class="peer hidden"
          :checked="props.game.outcome?.side == 'left'"
          value="left"
          @change="
            emit('setOutcome', props.game.teams[0]?.asGameWinner('left') ?? dummyWinner('left'))
          "
        />
        <label
          :for="`winner-${props.game.id}`"
          class="inline-flex items-center justify-center w-full p-2 bg-white border-r border-l-2 border-y-2 rounded-l-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <img
            :src="props.game.outcome?.side == 'left' ? winner : loser"
            width="35"
            height="35"
            class="-mt-1 -mb-1"
          />
          {{ leftName }}
        </label>
      </div>
      <div class="inline-flex w-1/2 h-full">
        <input
          :id="`loser-${props.game.id}`"
          type="radio"
          :name="`winlose-${props.game.id}`"
          class="peer hidden"
          :checked="props.game.outcome?.side == 'right'"
          value="right"
          @change="
            emit('setOutcome', props.game.teams[1]?.asGameWinner('right') ?? dummyWinner('right'))
          "
        />
        <label
          :for="`loser-${props.game.id}`"
          class="inline-flex items-center justify-center w-full p-2 bg-white border-l border-r-2 border-y-2 rounded-r-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {{ rightName }}
          <img
            :src="props.game.outcome?.side == 'right' ? winner : loser"
            width="35"
            height="35"
            class="-mt-1 -mb-1"
          />
        </label>
      </div>
    </div>
    <div v-if="props.game.isUnparseable()" class="w-full mt-4">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        This recording <strong>could not be parsed</strong> by the replay packer.
      </p>
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Please check that you have selected the <strong>correct file</strong>. Consider
        <a class="underline" href="https://forms.gle/NDKqE8acLdYR2JrKA" target="_blank"
          >reporting an issue</a
        >.
      </p>
      <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        The uploaded file will still be included in the downloaded Zip. You can proceed with the
        submission of your results regardless of this issue.
      </p>
    </div>
    <div v-else class="w-full grid grid-cols-2 gap-12 justify-items-between mt-4 mb-12 pl-6 pr-6">
      <GameTeam
        v-for="(team, teamIndex) in props.game.teams"
        :key="team.id"
        :team="team"
        :position="teamIndex % 2 ? 'right' : 'left'"
        class="border-2 p-4"
      />
    </div>
    <div class="flex justify-end">
      <div class="flex flex-col content-end">
        <span class="flex justify-end">
          <expand-button
            v-model="showReplays"
            :open-text="replayExpandText"
            :close-text="replayExpandText"
          />
        </span>
        <ul
          :class="showReplays ? ['max-h-screen'] : ['max-h-0']"
          class="mt-2 transition-max-height overflow-hidden duration-200 justify-items-end"
        >
          <li
            v-for="replay in props.game.replays"
            :key="replay.id"
            class="flex gap-2 mb-2 flex-row items-center"
          >
            {{ replay.file.name }} ({{ readableSize(replay.file.size) }})
            <move-button @click="showModal = replay.id" />
            <move-modal
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
  </div>
</template>
