import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameList from './GameList.vue'
import GameCard from './GameCard.vue'
import { Game } from '@/entities/game'
import { useGamesStore } from '@/stores/games'
import { ALICE, BOB, CAROL, DAVE, playedGame } from '@/entities/__tests__/recordings'

vi.mock('aoe2rec-js', () => ({ parse_rec_summary: vi.fn() }))

const matchAB = () => playedGame(ALICE, BOB)
const matchCD = () => playedGame(CAROL, DAVE)

const ids = (games: Game[]) => games.map((game) => game.id)

function mountList() {
  return mount(GameList, { global: { stubs: { teleport: true } } })
}

describe('GameList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows a message without games', () => {
    expect(mountList().text()).toContain('No games selected yet.')
  })

  it('shows a card per game, with placeholders', () => {
    const store = useGamesStore()
    store.games = [matchAB(), new Game()]
    const wrapper = mountList()
    const titles = wrapper.findAll('h3').map((title) => title.text())
    expect(titles.filter((title) => title.startsWith('Game'))).toEqual(['Game 1', 'Game 2'])
    expect(wrapper.text()).toContain('Placeholder game')
  })

  it('removes a game', async () => {
    const store = useGamesStore()
    const [ab, cd] = [matchAB(), matchCD()]
    store.games = [ab, cd]
    const wrapper = mountList()
    await wrapper.findAllComponents(GameCard)[0]!.find('[title="Remove game"]').trigger('click')
    expect(ids(store.games)).toEqual([cd.id])
  })

  it('clears a game', async () => {
    const store = useGamesStore()
    const [ab, cd] = [matchAB(), matchCD()]
    store.games = [ab, cd]
    const wrapper = mountList()
    await wrapper.findAllComponents(GameCard)[0]!.find('[title="Clear info"]').trigger('click')
    expect(store.games[0]?.id).toBe(cd.id)
    expect(store.games[1]?.isDummy()).toBe(true)
  })

  it('moves a game down', async () => {
    const store = useGamesStore()
    const [ab, cd] = [matchAB(), matchCD()]
    store.games = [ab, cd]
    const wrapper = mountList()
    wrapper.findAllComponents(GameCard)[0]!.vm.$emit('move', 'down')
    expect(ids(store.games)).toEqual([cd.id, ab.id])
  })

  it('moves a replay into another game', async () => {
    const store = useGamesStore()
    const [ab, cd] = [matchAB(), matchCD()]
    store.games = [ab, cd]
    const replayId = ab.replays[0]!.id
    const wrapper = mountList()
    wrapper.findAllComponents(GameCard)[0]!.vm.$emit('moveReplay', replayId, 1)
    expect(store.games[0]?.replays.map((replay) => replay.id)).toContain(replayId)
    expect(store.games[0]?.replays).toHaveLength(2)
  })

  it('sets the outcome chosen in a card', async () => {
    const store = useGamesStore()
    store.games = [matchAB()]
    const wrapper = mountList()
    await wrapper.find('input[value="left"]').trigger('change')
    expect(store.games[0]?.outcome?.side).toBe('left')
  })
})
