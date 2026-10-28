<script setup lang="ts">
import { computed, inject } from 'vue'
import pMap from 'p-map'
import {
  type Aoe2CmRecentDraft,
  extractDraftId,
  fetchAoe2CmApi,
  getDraftTypeLabel,
  getRecentDrafts
} from '@/entities/aoe2cm'
import { aoe2cmApiKey } from '@/stores/keys'

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

const mapDraftURI = defineModel<string>('mapDraft', { required: true })
const civDraftURI = defineModel<string>('civDraft', { required: true })

const currentMapDraftId = computed(() => extractDraftId(mapDraftURI.value))
const currentCivDraftId = computed(() => extractDraftId(civDraftURI.value))

const aoe2cmApi = inject(aoe2cmApiKey, fetchAoe2CmApi)

const recentDrafts = getRecentDrafts(
  await pMap(
    presets.value,
    async (presetId) => ({ presetId, drafts: (await aoe2cmApi.getPresetDrafts(presetId)) ?? [] }),
    { concurrency: MAX_CONCURRENT_API_REQUESTS }
  ),
  Date.now() - MAX_DRAFT_AGE_SECONDS * 1000,
  MAX_DRAFT_ITEMS
)

function selectDraft(draft: Aoe2CmRecentDraft) {
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
  <div :class="$style.panel">
    <h2 :class="$style.title">Recent Drafts</h2>
    <ul v-if="recentDrafts.length > 0" role="list" :class="$style.list">
      <li v-for="recentDraft in recentDrafts" :key="recentDraft.draftId" :class="$style.row">
        <button
          :class="[
            $style.draftBtn,
            [currentMapDraftId, currentCivDraftId].includes(recentDraft.draftId)
              ? $style.selected
              : null
          ]"
          @click="selectDraft(recentDraft)"
        >
          <div :class="$style.draftBody">
            <span :class="$style.meta">
              {{ getDraftTypeLabel(recentDraft, mapPresets, civPresets) }}</span
            >
            <span :class="$style.name">{{ recentDraft.nameHost }}</span>
            <span :class="$style.meta">vs</span>
            <span :class="$style.name">{{ recentDraft.nameGuest }}</span>
            <span :class="[$style.meta, $style.truncate]"
              >{{ recentDraft.title }} ({{ recentDraft.draftId }})</span
            >
          </div>
        </button>
      </li>
    </ul>
    <p v-else :class="$style.empty">No recent drafts found for the selected presets</p>
  </div>
</template>

<style module>
.panel {
  text-align: center;
  padding: var(--space-4);
  border: 2px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  height: 21.25rem;
  overflow: auto;
}
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list > li + li {
  border-top: 1px solid var(--color-border-section);
}
.row {
  display: flex;
  justify-content: space-between;
}
.draftBtn {
  flex: 1 1 auto;
  text-align: start;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;
  color: inherit;
}
.draftBtn:hover {
  background-color: var(--color-bg-hover);
}
.draftBtn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
/* Selected uses a pale-blue accent tint that's clearly stronger than the
   gray hover state. The bg stays pale in both themes, so force dark text
   on the descendants for contrast (overrides .name / .meta colors). */
.selected {
  background-color: var(--color-accent-disabled);
}
.selected,
.selected .name,
.selected .meta {
  color: #111827;
}
.draftBody {
  min-width: 25rem;
  padding: 0 var(--space-4);
}
.meta {
  margin: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1.5;
  color: var(--color-text-primary);
}
.truncate {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty {
  color: var(--color-text-muted);
}
</style>
