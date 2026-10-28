<script setup lang="ts">
import { computed } from 'vue'
import { useSpoilerStore } from '@/stores/spoiler'
import { readableSize } from '@/lib/maths'
import { generateZip } from '@/lib/zip'
import { paddedRecordName, paddedSize, padRecording, spoilerZipName } from '@/entities/spoiler'
import { saveAs } from 'file-saver'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const spoilerStore = useSpoilerStore()

const downloadEnabled = computed(() => spoilerStore.recordings.length > 0)
const targetSize = computed(() => paddedSize(spoilerStore.recordings))

function downloadPadded(file: File) {
  saveAs(padRecording(file, targetSize.value), paddedRecordName(file.name))
}

async function downloadZip() {
  const files = spoilerStore.recordings.map((recording) => ({
    name: paddedRecordName(recording.name),
    content: padRecording(recording, targetSize.value)
  }))
  const zipName = spoilerZipName(spoilerStore.recordings.map((recording) => recording.name))
  saveAs(await generateZip(files), zipName)
}
</script>

<template>
  <BaseCard spacing="top" :class="$style.cardSpacing">
    <table :class="$style.table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Padded size</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>All replays</td>
          <td></td>
          <td></td>
          <td>
            <BaseButton variant="primary" :disabled="!downloadEnabled" @click="downloadZip">
              Download
            </BaseButton>
          </td>
        </tr>
        <tr v-for="recording in spoilerStore.recordings" :key="recording.name">
          <td>{{ paddedRecordName(recording.name) }}</td>
          <td>{{ readableSize(recording.size) }}</td>
          <td>{{ readableSize(targetSize) }}</td>
          <td>
            <BaseButton
              variant="primary"
              :disabled="!downloadEnabled"
              @click="downloadPadded(recording)"
            >
              Download
            </BaseButton>
          </td>
        </tr>
      </tbody>
    </table>
  </BaseCard>
</template>

<style module>
.cardSpacing {
  margin-bottom: var(--space-4);
}
.table {
  border-collapse: collapse;
}
.table th,
.table td {
  border: 1px solid var(--color-border-section);
  padding: var(--space-1);
}
</style>
