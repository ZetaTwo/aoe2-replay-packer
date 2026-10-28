import { describe, it, expect } from 'vitest'
import type { Tournament } from 'virtual:tournaments-data'
import {
  autofillName,
  computeScores,
  countWins,
  discordMessage,
  downloadDisabledReason,
  draftMissingWarning,
  findPlayerSides,
  gamesWithOtherPlayers,
  guessSetLength,
  missingReplaysWarning,
  playerNamesFromReplays,
  presetSetDefinition,
  replayEntries,
  scoreWarning,
  tournamentSetDefinitions,
  zipFiles
} from './packer'
import { Game, Replay } from './game'
import { MatchSetDefinition, MatchSetType } from './matchset'
import {
  ALICE,
  BOB,
  CAROL,
  DAVE,
  gameWithOutcome,
  makeGame,
  makeRecording,
  makeReplay,
  playedGame,
  unparseableGame,
  type PlayerSpec
} from './__tests__/recordings'

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

  it('returns null without any parsed game', () => {
    expect(findPlayerSides([new Game(), unparseableGame()], 'Alice', 'Bob')).toBeNull()
  })

  it('ignores games with a single team', () => {
    const soloGame = makeGame(makeRecording({ teams: [[ALICE]] }))
    expect(findPlayerSides([soloGame], 'Alice', 'Bob')).toBeNull()
    expect(findPlayerSides([soloGame, ...games], 'Carol', 'Dave')).toEqual({
      left: '1',
      right: '2'
    })
  })

  it('looks past a first game without teams', () => {
    expect(findPlayerSides([unparseableGame(), ...games], 'Bob', 'Alice')).toEqual({
      left: '2',
      right: '1'
    })
    expect(findPlayerSides([new Game(), ...games], 'Carol', 'Dave')).toEqual({
      left: '1',
      right: '2'
    })
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
    const later = [playedGame(CAROL, DAVE), unparseableGame(), playedGame(BOB, ALICE)]
    expect(findPlayerSides(later, 'Alice', 'Bob')).toEqual({ left: '1', right: '2' })
  })
})

describe('playerNamesFromReplays', () => {
  it('takes the names from the first parsed 1v1', () => {
    expect(
      playerNamesFromReplays([
        new Game(),
        unparseableGame(),
        playedGame(BOB, ALICE),
        playedGame(CAROL, DAVE)
      ])
    ).toEqual(['Bob', 'Alice'])
  })

  it('returns null for team games and free for alls', () => {
    const teams = makeGame(
      makeRecording({
        teams: [
          [ALICE, BOB],
          [CAROL, DAVE]
        ]
      })
    )
    const ffa = makeGame(makeRecording({ teams: [[ALICE], [BOB], [CAROL]] }))
    expect(playerNamesFromReplays([teams])).toBeNull()
    expect(playerNamesFromReplays([ffa])).toBeNull()
  })

  it('returns null without parsed games', () => {
    expect(playerNamesFromReplays([new Game(), unparseableGame()])).toBeNull()
  })
})

describe('autofillName', () => {
  it('replaces a name that was filled in automatically', () => {
    expect(autofillName('Player1', ['Player1'], 'Alice')).toBe('Alice')
    expect(autofillName('Bob', ['Player1', 'Bob'], 'Alice')).toBe('Alice')
  })

  it('keeps a name the user entered', () => {
    expect(autofillName('Carol', ['Player1', undefined], 'Alice')).toBe('Carol')
  })
})

describe('computeScores', () => {
  it('scores each player by name, whichever team they played in', () => {
    const games = [playedGame(ALICE, BOB, BOB), playedGame(BOB, ALICE, BOB), playedGame(ALICE, BOB)]
    expect(computeScores(games, 'Bob', 'Alice')).toEqual({ left: 0, right: 2 })
  })

  it('counts parsed games when the first replay is unparseable', () => {
    const games = [
      gameWithOutcome('right'),
      playedGame(ALICE, BOB, BOB),
      playedGame(ALICE, BOB, ALICE),
      playedGame(BOB, ALICE, BOB),
      playedGame(ALICE, BOB, BOB)
    ]
    expect(computeScores(games, 'Alice', 'Bob')).toEqual({ left: 3, right: 2 })
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

describe('gamesWithOtherPlayers', () => {
  it('is empty when all games have the same players', () => {
    const games = [playedGame(ALICE, BOB), playedGame(BOB, ALICE), playedGame(ALICE, BOB)]
    expect(gamesWithOtherPlayers(games)).toEqual([])
  })

  it('lists the games with other players than most games', () => {
    const games = [playedGame(ALICE, CAROL), playedGame(ALICE, BOB), playedGame(BOB, ALICE)]
    expect(gamesWithOtherPlayers(games)).toEqual([1])
  })

  it('compares team games by all their players', () => {
    const teamGame = (players: PlayerSpec[][]) => makeGame(makeRecording({ teams: players }))
    const games = [
      teamGame([
        [ALICE, BOB],
        [CAROL, DAVE]
      ]),
      teamGame([
        [CAROL, DAVE],
        [BOB, ALICE]
      ]),
      teamGame([
        [ALICE, BOB],
        [CAROL, { name: 'Eve', profile: 5 }]
      ])
    ]
    expect(gamesWithOtherPlayers(games)).toEqual([3])
  })

  it('ignores placeholder and unparseable games', () => {
    const games = [playedGame(ALICE, BOB), new Game(), unparseableGame(), playedGame(ALICE, BOB)]
    expect(gamesWithOtherPlayers(games)).toEqual([])
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

  it('leaves out the line of a missing map draft', () => {
    expect(discordMessage({ ...message, mapDraft: '' })).toBe(`Alice || 2 - 1 || Bob
Best of 3
Civ draft: <https://aoe2cm.net/draft/iFSPX>`)
  })

  it('leaves out the line of a missing civ draft', () => {
    expect(discordMessage({ ...message, civDraft: '' })).toBe(`Alice || 2 - 1 || Bob
Best of 3
Map draft: <https://aoe2cm.net/draft/zxvoQ>`)
  })

  it('leaves out both draft lines without drafts', () => {
    expect(discordMessage({ ...message, mapDraft: '', civDraft: '' })).toBe(`Alice || 2 - 1 || Bob
Best of 3`)
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
  const firstBase = { padding: () => 10, pickBase: (replays: File[]) => replays[0]! }

  it('packs the replays, padded placeholders and the metadata', async () => {
    const replay = makeReplay(makeRecording(), 'a.aoe2record')
    const files = zipFiles([new Game([replay]), new Game()], 'Alice', 'Bob', meta, firstBase)!

    expect(files.map((file) => file.name)).toEqual([
      'Alice_vs_Bob_G1.aoe2record',
      'Alice_vs_Bob_G2.aoe2record',
      'metadata.json'
    ])
    expect(files[0]!.content).toBe(replay.file)
    expect(files[1]!.content.size).toBe(replay.file.size + 10 + 4 + 'DUMMYREC'.length)
    expect(JSON.parse(await files[2]!.content.text())).toEqual(meta)
  })

  it('bases each placeholder on the replay picked from all replays', async () => {
    const short = makeReplay(makeRecording(), 'short.aoe2record')
    const long = new Replay(
      new File(['a much longer recording'], 'long.aoe2record'),
      makeRecording()
    )
    const games = [new Game([short]), new Game([long]), new Game(), new Game()]
    const offered: string[][] = []
    const picks = [long.file, short.file]
    const files = zipFiles(games, 'Alice', 'Bob', meta, {
      padding: () => 0,
      pickBase: (replays) => {
        offered.push(replays.map((file) => file.name))
        return picks.shift()!
      }
    })!

    expect(offered).toEqual([
      ['short.aoe2record', 'long.aoe2record'],
      ['short.aoe2record', 'long.aoe2record']
    ])
    const trailer = 4 + 'DUMMYREC'.length
    expect(files[2]!.content.size).toBe(long.file.size + trailer)
    expect(files[3]!.content.size).toBe(short.file.size + trailer)
  })

  it('returns null without any replay to base the placeholders on', () => {
    expect(zipFiles([new Game()], 'Alice', 'Bob', meta, firstBase)).toBeNull()
  })
})
