import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import BaseDropzone from './BaseDropzone.vue'

function fileEntry(file: File) {
  return {
    isFile: true,
    isDirectory: false,
    file: (resolve: (file: File) => void) => resolve(file)
  }
}

function folderEntry(...files: File[]) {
  return {
    isFile: false,
    isDirectory: true,
    createReader: () => {
      let done = false
      return {
        readEntries: (resolve: (entries: unknown[]) => void) => {
          resolve(done ? [] : files.map(fileEntry))
          done = true
        }
      }
    }
  }
}

describe('BaseDropzone', () => {
  const a = new File(['a'], 'a.aoe2record')
  const b = new File(['b'], 'b.aoe2record')

  it('emits dropped files and the files in dropped folders', async () => {
    const wrapper = mount(BaseDropzone)
    const items = [fileEntry(a), folderEntry(b)].map((entry) => ({ webkitGetAsEntry: () => entry }))
    await wrapper.trigger('drop', { dataTransfer: { items, files: [] } })
    await flushPromises()
    expect(wrapper.emitted('files')).toEqual([[[a, b]]])
  })

  it('falls back to the dropped files without entries', async () => {
    const wrapper = mount(BaseDropzone)
    await wrapper.trigger('drop', { dataTransfer: { files: [a] } })
    await flushPromises()
    expect(wrapper.emitted('files')).toEqual([[[a]]])
  })

  it('emits the files chosen in the file picker', async () => {
    const wrapper = mount(BaseDropzone)
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [a, b] })
    await input.trigger('change')
    expect(wrapper.emitted('files')).toEqual([[[a, b]]])
  })
})
