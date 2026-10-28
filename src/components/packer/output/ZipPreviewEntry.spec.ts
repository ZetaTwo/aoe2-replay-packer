import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ZipPreviewEntry from './ZipPreviewEntry.vue'

describe('ZipPreviewEntry', () => {
  const baseProps = { filename: 'Alice_vs_Bob_G1.aoe2record', placeholder: false, last: false }

  it('shows ├── for non-last items', () => {
    expect(mount(ZipPreviewEntry, { props: baseProps }).text()).toContain('├──')
  })

  it('shows └── for the last item', () => {
    expect(mount(ZipPreviewEntry, { props: { ...baseProps, last: true } }).text()).toContain('└──')
  })

  it('renders the filename', () => {
    expect(mount(ZipPreviewEntry, { props: baseProps }).text()).toContain(
      'Alice_vs_Bob_G1.aoe2record'
    )
  })

  it('shows "dummy file" badge for a placeholder', () => {
    const wrapper = mount(ZipPreviewEntry, { props: { ...baseProps, placeholder: true } })
    expect(wrapper.text()).toContain('dummy file')
  })

  it('does not show "dummy file" badge for a replay', () => {
    expect(mount(ZipPreviewEntry, { props: baseProps }).text()).not.toContain('dummy file')
  })
})
