<script setup lang="ts">
import { computed } from 'vue'
import pMap from 'p-map'
import { type draft, type draftV2, getDraftTypeLabel, extractDraftId } from '../entities/draft'

const MAX_CONCURRENT_API_REQUESTS = 4
const MAX_DRAFT_AGE_SECONDS = 60 * 60 * 24
const MAX_DRAFT_ITEMS = 10

const props = defineProps<{
  civPresets: string[] | null
  mapPresets: string[] | null
}>()
const mapPresets = computed(() => props.mapPresets ?? [])
const civPresets = computed(() => props.civPresets ?? [])

const presets = computed(() => [...mapPresets.value, ...civPresets.value])

const mapDraftURI = defineModel<string>('mapDraft')
const civDraftURI = defineModel<string>('civDraft')

const currentMapDraftId = computed(() => extractDraftId(mapDraftURI.value))
const currentCivDraftId = computed(() => extractDraftId(civDraftURI.value))

const fetchDraftsFromPresetIds = async (presetId: string, maxAgeSeconds: number) => {
  const presetURL = `https://aoe2cm.net/api/preset/${presetId}/drafts`
  const response = await fetch(presetURL)
  if (!response.ok) {
    return []
  }
  const minTs = Date.now() - maxAgeSeconds * 1000
  const drafts = ((await response.json()) as draftV2[])
    .filter((draft) => draft.ts >= minTs)
    .map((draft) => {
      return {
        draftId: draft.draftId,
        presetId: presetId,
        ts: draft.ts,
        // The preset-specific endpoint does not return a title so we make up a sensible one
        title: `${draft.host} vs ${draft.guest}`,
        nameHost: draft.host,
        nameGuest: draft.guest
      }
    })
  return drafts
}

const recentDrafts = await (async () => {
  const drafts = (
    await pMap(
      presets.value,
      (presetId) => fetchDraftsFromPresetIds(presetId, MAX_DRAFT_AGE_SECONDS),
      {
        concurrency: MAX_CONCURRENT_API_REQUESTS
      }
    )
  )
    .flat(1)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_DRAFT_ITEMS)
  return drafts
})()

function selectDraft(draft: draft) {
  if (mapPresets.value.includes(draft.presetId)) {
    if (mapDraftURI.value == draft.draftId) {
      mapDraftURI.value = ''
    } else {
      mapDraftURI.value = draft.draftId
    }
  } else {
    if (civDraftURI.value == draft.draftId) {
      civDraftURI.value = ''
    } else {
      civDraftURI.value = draft.draftId
    }
  }
}
</script>

<template>
  <div class="text-center p-4 border-2 col-span-3 mt-4 h-85 overflow-auto">
    <h2 class="text-center text-2xl">Recent Drafts</h2>
    <ul
      v-if="recentDrafts.length > 0"
      role="list"
      class="divide-y divide-gray-100 dark:divide-gray-800"
    >
      <li
        v-for="recentDraft in recentDrafts"
        :key="recentDraft.draftId"
        class="flex justify-between"
      >
        <button
          class="flex-auto text-start hover:bg-slate-100 dark:hover:bg-slate-900"
          :class="{
            'bg-slate-300': [currentMapDraftId, currentCivDraftId].includes(recentDraft.draftId),
            'dark:bg-slate-600': [currentMapDraftId, currentCivDraftId].includes(
              recentDraft.draftId
            )
          }"
          @click="selectDraft(recentDraft)"
        >
          <div class="min-w-100 flex-auto px-4">
            <span class="mt-1 text-xs text-gray-500 m-3">
              {{ getDraftTypeLabel(recentDraft, mapPresets, civPresets) }}</span
            >
            <span class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-50">{{
              recentDraft.nameHost
            }}</span>
            <span class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400 m-3">vs</span>
            <span class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-50">{{
              recentDraft.nameGuest
            }}</span>
            <span class="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400 m-3"
              >{{ recentDraft.title }} ({{ recentDraft.draftId }})</span
            >
          </div>
        </button>
      </li>
    </ul>
    <p v-else class="text-gray-500 dark:text-gray-400">
      No recent drafts found for the selected presets
    </p>
  </div>
</template>
