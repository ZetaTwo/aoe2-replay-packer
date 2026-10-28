import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TournamentSetPicker from './TournamentSetPicker.vue'
import { MatchSetDefinition, MatchSetType } from '@/entities/matchset'

const setTypes = [MatchSetDefinition.parse('bo3'), MatchSetDefinition.parse('pa2')]

function mountPicker() {
  return mount(TournamentSetPicker, { props: { setTypes, type: null, length: 0 } })
}

describe('TournamentSetPicker', () => {
  it('lists the set types of the tournament', () => {
    expect(
      mountPicker()
        .findAll('label')
        .map((label) => label.text())
    ).toEqual(['Best of 3', 'Play all 2'])
  })

  it('emits the chosen set type and length', async () => {
    const wrapper = mountPicker()
    await wrapper.find('[id="Play all-2"]').setValue()
    expect(wrapper.emitted('setGames')).toEqual([[2]])
    expect(wrapper.emitted('setBoPa')).toEqual([[MatchSetType.PlayAll]])
  })

  it('selects the set type set from outside', async () => {
    const wrapper = mountPicker()
    await wrapper.setProps({ type: MatchSetType.BestOf, length: 3 })
    expect(wrapper.find<HTMLInputElement>('[id="Best of-3"]').element.checked).toBe(true)
  })

  it('ignores a set type outside the tournament', async () => {
    const wrapper = mountPicker()
    await wrapper.setProps({ type: MatchSetType.BestOf, length: 5 })
    expect(wrapper.findAll<HTMLInputElement>('input').some((input) => input.element.checked)).toBe(
      false
    )
    expect(wrapper.emitted('setGames')).toBeUndefined()
  })
})
