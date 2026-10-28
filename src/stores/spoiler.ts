import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { extractRecordings } from '@/lib/archive'

export const useSpoilerStore = defineStore('spoiler', () => {
  const recordings: Ref<File[]> = ref([])

  async function clearRecordings() {
    recordings.value = []
  }

  async function addRecording(file: File) {
    recordings.value.push(file)
  }

  async function expandArchive(file: File) {
    recordings.value.push(...(await extractRecordings(file)))
  }

  return {
    recordings,
    addRecording,
    clearRecordings,
    expandArchive
  }
})
