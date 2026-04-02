<script setup lang="ts">
import { Game, type Replay } from '@/entities/game'
import { computed, ref } from 'vue'
import GameTeam from '@/components/GameTeam.vue'
import GameDate from '@/components/GameDate.vue'
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
</script>
<template>
  <Teleport to="#modals">
    <div
      tabindex="-1"
      class="overflow-y-auto overflow-x-hidden fixed top-40 inset-x-0 mx-auto z-50 w-1/2 h-3/4"
      :class="{ hidden: !props.show }"
      :aria-hidden="!props.show"
    >
      <div class="p-4 w-full max-h-full">
        <!-- Modal content -->
        <div class="border-2 bg-white rounded-lg shadow-xs dark:bg-gray-700">
          <!-- Modal header -->
          <div
            class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Move recording to a different game
            </h3>
            <button
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-toggle="select-modal"
              @click="emit('close')"
            >
              <svg
                class="w-3 h-3"
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
          <!-- Modal body -->
          <div class="flex flex-col gap-2 p-4 md:p-5">
            <div class="w-full grid grid-cols-2 gap-6 justify-items-between">
              <game-team
                v-for="(team, index) in replayInfo.teams"
                :key="team.id"
                :team="team"
                :position="index % 2 == 0 ? 'left' : 'right'"
                class="p-0"
              />
              <p>
                Played on {{ replayInfo.mapName }} <game-date :date="replayInfo.date" /> and was
                {{ format(new UTCDate(replayInfo.duration), 'HH:mm:ss') }} long.
              </p>
            </div>
            <div>
              <label for="game" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Move to</label
              >
              <select
                id="game"
                v-model="targetGame"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              >
                <option :value="-1">New game</option>
                <option v-for="game in games" :key="game" :value="game">Game {{ game + 1 }}</option>
              </select>
            </div>
            <button
              class="btn text-xl text-white dark:text-black bg-blue-500 dark:bg-blue-700"
              @click="emit('move', targetGame)"
            >
              Move recording
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
