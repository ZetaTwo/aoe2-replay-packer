import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameActions from './GameActions.vue'

describe('GameActions', () => {
  it('emits clear and remove', async () => {
    const wrapper = mount(GameActions)
    await wrapper.find('[title="Clear info"]').trigger('click')
    await wrapper.find('[title="Remove game"]').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('can hide the clear button', () => {
    const wrapper = mount(GameActions, { props: { showClear: false } })
    expect(wrapper.find('[title="Clear info"]').exists()).toBe(false)
    expect(wrapper.find('[title="Remove game"]').exists()).toBe(true)
  })
})
