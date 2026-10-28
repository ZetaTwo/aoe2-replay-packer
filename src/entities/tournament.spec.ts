import { describe, it, expect } from 'vitest'
import { getPresets, getTournament, type Tournament } from './tournament'

const tournament = {
  name: 'Test Cup',
  maps: { bo3: ['maps3'], bo5: ['maps5a', 'maps5b'] },
  civs: { bo3: ['civs3'] },
  drafts: 'both'
} as unknown as Tournament

describe('getTournament', () => {
  const tournaments = { testcup: tournament }

  it('looks up the tournament from the URL', () => {
    expect(getTournament(new URLSearchParams('tournament=testcup'), tournaments)).toBe(tournament)
  })

  it('returns undefined for an unknown or missing tournament', () => {
    expect(getTournament(new URLSearchParams('tournament=other'), tournaments)).toBeUndefined()
    expect(getTournament(new URLSearchParams(''), tournaments)).toBeUndefined()
  })
})

describe('getPresets', () => {
  it('returns null for both without presets', () => {
    expect(getPresets(new URLSearchParams(''))).toEqual([null, null])
  })

  it('reads comma separated presets from the URL', () => {
    expect(getPresets(new URLSearchParams('civpresets=c1,c2&mappresets=m1'))).toEqual([
      ['c1', 'c2'],
      ['m1']
    ])
  })

  it('adds the presets of the tournament', () => {
    expect(getPresets(new URLSearchParams('mappresets=m1'), tournament)).toEqual([
      ['civs3'],
      ['m1', 'maps3', 'maps5a', 'maps5b']
    ])
  })
})
