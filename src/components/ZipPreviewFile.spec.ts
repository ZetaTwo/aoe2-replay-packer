import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ZipPreviewFile from './ZipPreviewFile.vue'
import { Game, Replay } from '../entities/game'
import type { SavegameSummary } from 'aoe2rec-js'

function makeGame(dummy = false): Game {
  const game = new Game()
  if (!dummy) {
    game.replays.push({ recording: {} as SavegameSummary } as Replay)
  }
  return game
}

describe('ZipPreviewFile', () => {
  const baseProps = { player1: 'Alice', player2: 'Bob', gameIdx: 0, replayIdx: 0 }

  it('shows ├── for non-last items', () => {
    const wrapper = mount(ZipPreviewFile, { props: { ...baseProps, game: makeGame(), last: false } })
    expect(wrapper.text()).toContain('├──')
  })

  it('shows └── for the last item', () => {
    const wrapper = mount(ZipPreviewFile, { props: { ...baseProps, game: makeGame(), last: true } })
    expect(wrapper.text()).toContain('└──')
  })

  it('renders the computed replay filename', () => {
    const wrapper = mount(ZipPreviewFile, { props: { ...baseProps, game: makeGame(), last: false } })
    expect(wrapper.text()).toContain('Alice_vs_Bob_G1.aoe2record')
  })

  it('uses gameIdx + 1 in the filename', () => {
    const wrapper = mount(ZipPreviewFile, {
      props: { ...baseProps, game: makeGame(), gameIdx: 2, last: false }
    })
    expect(wrapper.text()).toContain('Alice_vs_Bob_G3.aoe2record')
  })

  it('shows "dummy file" badge for a dummy game', () => {
    const wrapper = mount(ZipPreviewFile, { props: { ...baseProps, game: makeGame(true), last: false } })
    expect(wrapper.text()).toContain('dummy file')
  })

  it('does not show "dummy file" badge for a real game', () => {
    const wrapper = mount(ZipPreviewFile, { props: { ...baseProps, game: makeGame(false), last: false } })
    expect(wrapper.text()).not.toContain('dummy file')
  })
})
