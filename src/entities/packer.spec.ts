import { describe, it, expect } from 'vitest'
import { missingReplaysWarning } from './packer'
import { Game } from './game'
import { MatchSetType } from './matchset'
import { makeGame } from './__tests__/recordings'

describe('missingReplaysWarning', () => {
  it('warns for play all with a game missing its replay', () => {
    expect(missingReplaysWarning([makeGame(), new Game()], MatchSetType.PlayAll)).toBe(true)
  })

  it('does not warn for play all with all replays', () => {
    expect(missingReplaysWarning([makeGame(), makeGame()], MatchSetType.PlayAll)).toBe(false)
  })

  it('does not warn for best of', () => {
    expect(missingReplaysWarning([makeGame(), new Game()], MatchSetType.BestOf)).toBe(false)
  })

  it('does not warn before the set type is chosen', () => {
    expect(missingReplaysWarning([new Game(), new Game()], null)).toBe(false)
  })
})
