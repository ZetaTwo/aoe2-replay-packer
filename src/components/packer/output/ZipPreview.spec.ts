import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ZipPreview from './ZipPreview.vue'
import { Game } from '@/entities/game'
import { makeGame, makeRecording } from '@/entities/__tests__/recordings'

function previewLines(games: Game[]) {
  const wrapper = mount(ZipPreview, { props: { games, player1: 'Alice', player2: 'Bob' } })
  return wrapper
    .find('div')
    .element.innerHTML.split('<br>')
    .map((line) => line.replace(/<[^>]+>/g, '').trim())
    .filter((line) => line.length > 0)
}

describe('ZipPreview', () => {
  it('always lists metadata.json, which the download always includes', () => {
    expect(previewLines([new Game()])).toContain('├──metadata.json')
  })

  it('lists one file per replay and one for each placeholder game', () => {
    expect(previewLines([makeGame(makeRecording(), makeRecording()), new Game()])).toEqual([
      'Alice_vs_Bob.zip',
      '├──metadata.json',
      '├──Alice_vs_Bob_G1a.aoe2record',
      '├──Alice_vs_Bob_G1b.aoe2record',
      '└──Alice_vs_Bob_G2.aoe2recorddummy file'
    ])
  })
})
