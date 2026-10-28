import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameCard from './GameCard.vue'
import MoveReplayModal from './MoveReplayModal.vue'
import { Game } from '@/entities/game'
import {
  ALICE,
  BOB,
  makeGame,
  makeRecording,
  playedGame,
  unparseableGame
} from '@/entities/__tests__/recordings'

function mountCard(game: Game, showResults = true) {
  return mount(GameCard, {
    props: { index: 1, numGames: 3, game, showResults },
    global: { stubs: { teleport: true } }
  })
}

describe('GameCard', () => {
  it('shows the game number, map and players', () => {
    const wrapper = mountCard(playedGame(ALICE, BOB))
    expect(wrapper.find('h3').text()).toBe('Game 2')
    expect(wrapper.text()).toContain('Arabia')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('emits the winner chosen by the user', async () => {
    const wrapper = mountCard(playedGame(ALICE, BOB))
    await wrapper.find('input[value="right"]').trigger('change')
    const [outcome] = wrapper.emitted('setOutcome')![0]!
    expect(outcome).toMatchObject({ side: 'right', firstPlayer: { name: 'Bob' } })
  })

  it('hides the results when asked to', () => {
    const wrapper = mountCard(makeGame(), false)
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
  })

  it('warns about an unparseable game', () => {
    const wrapper = mountCard(unparseableGame())
    expect(wrapper.text()).toContain('could not be parsed')
  })

  it('counts restored games', () => {
    const wrapper = mountCard(makeGame(makeRecording(), makeRecording(), makeRecording()))
    expect(wrapper.text()).toContain('Game was restored 2 times')
  })

  it('emits clear and remove from its actions', async () => {
    const wrapper = mountCard(makeGame())
    await wrapper.find('[title="Clear info"]').trigger('click')
    await wrapper.find('[title="Remove game"]').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('emits moving a replay to another game', async () => {
    const game = makeGame()
    const wrapper = mountCard(game)
    wrapper.findComponent(MoveReplayModal).vm.$emit('move', 2)
    expect(wrapper.emitted('moveReplay')).toEqual([[game.replays[0]!.id, 2]])
  })
})
