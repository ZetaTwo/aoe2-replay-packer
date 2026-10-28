import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { parse_rec_summary } from 'aoe2rec-js'
import ReplayDropzone from './ReplayDropzone.vue'
import BaseDropzone from '@/components/common/BaseDropzone.vue'
import { useGamesStore } from '@/stores/games'
import { makeRecording, recFile } from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))

function fileList(...files: File[]) {
  return files as unknown as FileList
}

describe('ReplayDropzone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(parse_rec_summary).mockReturnValue(makeRecording())
  })

  it('adds recordings and expands archives', async () => {
    const store = useGamesStore()
    const addRec = vi.spyOn(store, 'addRec').mockResolvedValue()
    const expandArchive = vi.spyOn(store, 'expandArchive').mockResolvedValue()
    const wrapper = mount(ReplayDropzone)
    const rec = recFile('game.aoe2record')
    const archive = new File(['zip'], 'replays.zip')
    wrapper.findComponent(BaseDropzone).vm.$emit('files', fileList(rec, archive))
    expect(addRec).toHaveBeenCalledWith(rec)
    expect(expandArchive).toHaveBeenCalledWith(archive)
  })

  it('warns about skipped duplicates until the next drop', async () => {
    const store = useGamesStore()
    const wrapper = mount(ReplayDropzone)
    const dropzone = wrapper.findComponent(BaseDropzone)

    dropzone.vm.$emit('files', fileList(recFile('a.aoe2record'), recFile('a.aoe2record')))
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('Skipped files that were already added: a.aoe2record')
    )

    dropzone.vm.$emit('files', fileList(recFile('b.aoe2record')))
    await nextTick()
    expect(wrapper.text()).not.toContain('Skipped files')
    await vi.waitFor(() => expect(store.games[0]?.replays).toHaveLength(2))
  })
})
