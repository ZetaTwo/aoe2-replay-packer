import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchSetPicker from './MatchSetPicker.vue'
import { MatchSetType } from '@/entities/matchset'

function mountPicker(gamesCount = 0) {
  return mount(MatchSetPicker, { props: { gamesCount } })
}

const radio = (wrapper: ReturnType<typeof mountPicker>, id: string) =>
  wrapper.find<HTMLInputElement>(`#${id}`)

describe('MatchSetPicker', () => {
  it('emits the chosen set type', async () => {
    const wrapper = mountPicker()
    await radio(wrapper, 'play-all').setValue()
    await radio(wrapper, 'best-of').setValue()
    expect(wrapper.emitted('setBoPa')).toEqual([[MatchSetType.PlayAll], [MatchSetType.BestOf]])
  })

  it('emits the chosen number of games', async () => {
    const wrapper = mountPicker()
    await radio(wrapper, 'bo5').setValue()
    expect(wrapper.emitted('setGames')).toEqual([[5]])
  })

  it('emits the custom number of games', async () => {
    const wrapper = mountPicker()
    await radio(wrapper, 'bo-custom').setValue()
    await wrapper.find('input[type="number"]').setValue('11')
    expect(wrapper.emitted('setGames')).toEqual([[9], [11]])
  })

  it('only emits a custom number of games while custom is chosen', async () => {
    const wrapper = mountPicker()
    await radio(wrapper, 'bo3').setValue()
    await wrapper.find('input[type="number"]').setValue('11')
    expect(wrapper.emitted('setGames')).toEqual([[3]])
  })

  it('limits the custom number of games to 0-99', async () => {
    const wrapper = mountPicker()
    await radio(wrapper, 'bo-custom').setValue()
    const input = wrapper.find<HTMLInputElement>('input[type="number"]')
    await input.setValue('120')
    expect(input.element.value).toBe('99')
    await input.setValue('-5')
    expect(input.element.value).toBe('0')
    expect(wrapper.emitted('setGames')).toEqual([[9], [99], [0]])
  })

  it('selects a standard number of games set from outside', async () => {
    const wrapper = mountPicker()
    await wrapper.setProps({ gamesCount: 5 })
    expect(radio(wrapper, 'bo5').element.checked).toBe(true)
  })

  it('selects custom for any other number of games set from outside', async () => {
    const wrapper = mountPicker()
    await wrapper.setProps({ gamesCount: 9 })
    expect(radio(wrapper, 'bo-custom').element.checked).toBe(true)
    expect(wrapper.find<HTMLInputElement>('input[type="number"]').element.value).toBe('9')
  })
})
