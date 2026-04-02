import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayerColor from './PlayerColor.vue'

describe('PlayerColor', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('renders color number %i', (color) => {
    const wrapper = mount(PlayerColor, { props: { color } })
    expect(wrapper.find('span').text()).toBe(String(color))
  })
})
