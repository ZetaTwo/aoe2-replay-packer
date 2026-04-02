import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpandButton from './ExpandButton.vue'

describe('ExpandButton', () => {
  it('shows openText when collapsed', () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: false } })
    expect(wrapper.text()).toContain('Expand')
  })

  it('shows custom openText when collapsed', () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: false, openText: 'Show more' } })
    expect(wrapper.text()).toContain('Show more')
  })

  it('shows closeText when expanded', () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: true } })
    expect(wrapper.text()).toContain('Hide')
  })

  it('shows custom closeText when expanded', () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: true, closeText: 'Collapse' } })
    expect(wrapper.text()).toContain('Collapse')
  })

  it('emits true when clicked while collapsed', async () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: false } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits false when clicked while expanded', async () => {
    const wrapper = mount(ExpandButton, { props: { modelValue: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
