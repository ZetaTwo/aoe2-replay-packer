import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToggleButton from './ToggleButton.vue'

describe('ToggleButton', () => {
  it('renders the label text', () => {
    const wrapper = mount(ToggleButton, { props: { label: 'Enable feature', modelValue: false } })
    expect(wrapper.text()).toContain('Enable feature')
  })

  it('checkbox is unchecked when model is false', () => {
    const wrapper = mount(ToggleButton, { props: { label: 'Toggle', modelValue: false } })
    const checkbox = wrapper.find('input[type="checkbox"]').element as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('checkbox is checked when model is true', () => {
    const wrapper = mount(ToggleButton, { props: { label: 'Toggle', modelValue: true } })
    const checkbox = wrapper.find('input[type="checkbox"]').element as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('emits true when checkbox is checked', async () => {
    const wrapper = mount(ToggleButton, { props: { label: 'Toggle', modelValue: false } })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits false when checkbox is unchecked', async () => {
    const wrapper = mount(ToggleButton, { props: { label: 'Toggle', modelValue: true } })
    await wrapper.find('input[type="checkbox"]').setValue(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
