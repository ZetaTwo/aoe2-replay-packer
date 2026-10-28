import { describe, it, expect } from 'vitest'
import type { Tournament } from 'virtual:tournaments-data'
import {
  computeScores,
  countWins,
  discordMessage,
  downloadDisabledReason,
  draftMissingWarning,
  findPlayerSides,
  guessSetLength,
  missingReplaysWarning,
  presetSetDefinition,
  replayEntries,
  scoreWarning,
  tournamentSetDefinitions,
  zipFiles
} from './packer'
import { Game, dummyWinner, type DummyReplay } from './game'
import { MatchSetDefinition, MatchSetType } from './matchset'
import { makeGame, makeRecording, makeReplay } from './__tests__/recordings'

const ALICE = { name: 'Alice', profile: 1 }
const BOB = { name: 'Bob', profile: 2 }

// Game between the two teams where the given player resigned
function playedGame(left: typeof ALICE, right: typeof ALICE, loser?: typeof ALICE) {
  return makeGame(
    makeRecording({
      teams: [[{ ...left, resigned: loser == left }], [{ ...right, resigned: loser == right }]]
    })
  )
}

function unparseableGame() {
  const recording: DummyReplay = { dummy: true, header: { timestamp: 0 } }
  return new Game([makeReplay(recording)])
}

function gameWithOutcome(side: 'left' | 'right') {
  const game = unparseableGame()
  game.outcome = dummyWinner(side)
  return game
}

const noErrors = { maps: null, civs: null }

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

describe('countWins', () => {
  it('counts wins by winner profile', () => {
    const games = [playedGame(ALICE, BOB, BOB), playedGame(BOB, ALICE, BOB), playedGame(ALICE, BOB)]
    expect(countWins(games)).toEqual({ left: 0, right: 0, players: { '1': 2 } })
  })

  it('counts manually set outcomes by side', () => {
    const games = [gameWithOutcome('left'), gameWithOutcome('right'), gameWithOutcome('left')]
    expect(countWins(games)).toEqual({ left: 2, right: 1, players: {} })
  })
})

describe('findPlayerSides', () => {
  const games = [playedGame(ALICE, BOB, BOB)]

  it('returns null when the first game has no teams', () => {
    expect(findPlayerSides([new Game(), ...games], 'Alice', 'Bob')).toBeNull()
  })

  it('keeps the team order when player 1 is in the first team', () => {
    expect(findPlayerSides(games, 'Alice', 'Someone')).toEqual({ left: '1', right: '2' })
  })

  it('swaps the teams when player 2 is in the first team', () => {
    expect(findPlayerSides(games, 'Someone', 'Alice')).toEqual({ left: '2', right: '1' })
  })

  it('keeps the team order when only player 2 matches the second team', () => {
    expect(findPlayerSides(games, 'Someone', 'Bob')).toEqual({ left: '1', right: '2' })
  })

  it('swaps the teams when only player 1 matches the second team', () => {
    expect(findPlayerSides(games, 'Bob', 'Someone')).toEqual({ left: '2', right: '1' })
  })

  it('matches names case-insensitively and by substring', () => {
    expect(findPlayerSides(games, 'bob', '')).toEqual({ left: '2', right: '1' })
    expect(findPlayerSides(games, '[TAG] Bob', 'x')).toEqual({ left: '2', right: '1' })
  })

  it('falls back to the team order when no names match', () => {
    expect(findPlayerSides(games, 'Carol', 'Dave')).toEqual({ left: '1', right: '2' })
  })

  it('looks through later games for a name match', () => {
    const carol = { name: 'Carol', profile: 3 }
    const dave = { name: 'Dave', profile: 4 }
    const later = [playedGame(carol, dave), unparseableGame(), playedGame(BOB, ALICE)]
    expect(findPlayerSides(later, 'Alice', 'Bob')).toEqual({ left: '1', right: '2' })
  })
})

describe('computeScores', () => {
  it('scores each player by name, whichever team they played in', () => {
    const games = [playedGame(ALICE, BOB, BOB), playedGame(BOB, ALICE, BOB), playedGame(ALICE, BOB)]
    expect(computeScores(games, 'Bob', 'Alice')).toEqual({ left: 0, right: 2 })
  })

  it('adds manually set outcomes', () => {
    const games = [playedGame(ALICE, BOB, BOB), gameWithOutcome('right')]
    expect(computeScores(games, 'Alice', 'Bob')).toEqual({ left: 1, right: 1 })
  })

  it('is zero without games', () => {
    expect(computeScores([new Game()], 'Alice', 'Bob')).toEqual({ left: 0, right: 0 })
  })
})

describe('scoreWarning', () => {
  it('accepts a possible best of score', () => {
    expect(scoreWarning({ left: 2, right: 1 }, 3, MatchSetType.BestOf)).toBe(false)
  })

  it('warns when a player won more than a best of allows', () => {
    expect(scoreWarning({ left: 3, right: 0 }, 3, MatchSetType.BestOf)).toBe(true)
    expect(scoreWarning({ left: 0, right: 4 }, 5, null)).toBe(true)
  })

  it('never warns for play all', () => {
    expect(scoreWarning({ left: 3, right: 0 }, 3, MatchSetType.PlayAll)).toBe(false)
  })
})

describe('draftMissingWarning', () => {
  it('warns when presets are required and no draft is given', () => {
    expect(draftMissingWarning(['preset'], '')).toBe(true)
  })

  it('does not warn when a draft is given', () => {
    expect(draftMissingWarning(['preset'], 'abc')).toBe(false)
  })

  it('does not warn without required presets', () => {
    expect(draftMissingWarning(null, '')).toBe(false)
    expect(draftMissingWarning([], '')).toBe(false)
  })
})

describe('downloadDisabledReason', () => {
  const games = [makeGame(), new Game()]

  it('is null when everything is in place', () => {
    expect(downloadDisabledReason(noErrors, MatchSetType.BestOf, 3, games)).toBeNull()
  })

  it('requires the drafts to be valid', () => {
    expect(downloadDisabledReason({ maps: 'bad', civs: null }, MatchSetType.BestOf, 3, games)).toBe(
      'The draft links have some issues'
    )
  })

  it('requires a set type and length', () => {
    const reason = 'You must choose the type of set (e.g. Best of 5)'
    expect(downloadDisabledReason(noErrors, null, 3, games)).toBe(reason)
    expect(downloadDisabledReason(noErrors, MatchSetType.BestOf, 0, games)).toBe(reason)
  })

  it('requires at least one replay', () => {
    expect(downloadDisabledReason(noErrors, MatchSetType.BestOf, 3, [new Game()])).toBe(
      'Replays are missing'
    )
  })
})

describe('guessSetLength', () => {
  it('rounds an even map count up to an odd set length', () => {
    expect(guessSetLength(4)).toBe(5)
  })

  it('keeps an odd map count', () => {
    expect(guessSetLength(3)).toBe(3)
  })
})

const tournament = {
  name: 'Test Cup',
  maps: { bo3: ['maps3'], bo5: ['maps5'] },
  civs: { bo3: ['civs3'], pa2: ['civs2'] },
  drafts: 'both'
} as unknown as Tournament

describe('tournamentSetDefinitions', () => {
  it('lists each set type of the tournament once', () => {
    expect(tournamentSetDefinitions(tournament).map((set) => set.label())).toEqual([
      'Best of 3',
      'Best of 5',
      'Play all 2'
    ])
  })
})

describe('presetSetDefinition', () => {
  it('finds the set type of a map preset', () => {
    expect(presetSetDefinition(tournament, 'maps5')).toEqual(
      new MatchSetDefinition(MatchSetType.BestOf, 5)
    )
  })

  it('finds the set type of a civ preset', () => {
    expect(presetSetDefinition(tournament, 'civs2')).toEqual(
      new MatchSetDefinition(MatchSetType.PlayAll, 2)
    )
  })

  it('returns undefined for a preset outside the tournament', () => {
    expect(presetSetDefinition(tournament, 'other')).toBeUndefined()
  })
})

describe('discordMessage', () => {
  const message = {
    player1: 'Alice',
    player2: 'Bob',
    scores: { left: 2, right: 1 },
    showResults: true,
    boPa: MatchSetType.BestOf,
    gamesCount: 3,
    mapDraft: 'zxvoQ',
    civDraft: 'https://aoe2cm.net/draft/iFSPX'
  }

  it('includes the spoilered score and draft links', () => {
    expect(discordMessage(message)).toBe(`Alice || 2 - 1 || Bob
Best of 3
Map draft: <https://aoe2cm.net/draft/zxvoQ>
Civ draft: <https://aoe2cm.net/draft/iFSPX>`)
  })

  it('leaves out the score when results are hidden', () => {
    expect(discordMessage({ ...message, showResults: false })).toMatch(/^Alice vs Bob\n/)
  })

  it('defaults to best of before the set type is chosen', () => {
    expect(discordMessage({ ...message, boPa: null })).toContain('\nBest of 3\n')
  })
})

describe('replayEntries', () => {
  it('names each replay and placeholder game', () => {
    const twoReplays = new Game([
      makeReplay(makeRecording(), 'a.aoe2record'),
      makeReplay(makeRecording(), 'b.aoe2record')
    ])
    const entries = replayEntries([twoReplays, new Game()], 'Alice', 'Bob')
    expect(entries.map(({ kind, filename }) => [kind, filename])).toEqual([
      ['replay', 'Alice_vs_Bob_G1a.aoe2record'],
      ['replay', 'Alice_vs_Bob_G1b.aoe2record'],
      ['placeholder', 'Alice_vs_Bob_G2.aoe2record']
    ])
    expect(entries.map((entry) => entry.kind == 'replay' && entry.file.name)).toEqual([
      'a.aoe2record',
      'b.aoe2record',
      false
    ])
  })
})

describe('zipFiles', () => {
  const meta = { maps: null, civs: null, player1_score: 2, player2_score: 1 }

  it('packs the replays, padded placeholders and the metadata', async () => {
    const replay = makeReplay(makeRecording(), 'a.aoe2record')
    const files = zipFiles([new Game([replay]), new Game()], 'Alice', 'Bob', meta, () => 10)!

    expect(files.map((file) => file.name)).toEqual([
      'Alice_vs_Bob_G1.aoe2record',
      'Alice_vs_Bob_G2.aoe2record',
      'metadata.json'
    ])
    expect(files[0]!.content).toBe(replay.file)
    expect(files[1]!.content.size).toBe(replay.file.size + 10 + 4 + 'DUMMYREC'.length)
    expect(JSON.parse(await files[2]!.content.text())).toEqual(meta)
  })

  it('returns null without any replay to base the placeholders on', () => {
    expect(zipFiles([new Game()], 'Alice', 'Bob', meta, () => 10)).toBeNull()
  })
})
