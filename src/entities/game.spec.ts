import { describe, it, expect } from 'vitest'
import {
  normalizePlayerName,
  matchName,
  zipFilename,
  computeReplayFilename,
  Game,
  Player,
  Team,
  Replay,
  extractRecordingInfo
} from './game'
import type { SavegameSummary } from 'aoe2rec-js'
import {
  ALICE,
  BOB,
  makeGame,
  makeRecording,
  makeReplay,
  makeUnparseable
} from './__tests__/recordings'

function makePlayer(name: string, resigned: boolean): Player {
  return new Player(1, name, name, 'Britons', 1, 1, resigned)
}

function gameWithResignations(leftResigned: boolean, rightResigned: boolean): Game {
  const game = new Game()
  game.teams = [
    new Team(1, [makePlayer('Alice', leftResigned)]),
    new Team(2, [makePlayer('Bob', rightResigned)])
  ]
  return game
}

describe('Team.survivor', () => {
  it('is true when no players have resigned', () => {
    const team = new Team(1, [makePlayer('Alice', false), makePlayer('Bob', false)])
    expect(team.survivor).toBe(true)
  })

  it('is true when at least one player has not resigned', () => {
    const team = new Team(1, [makePlayer('Alice', true), makePlayer('Bob', false)])
    expect(team.survivor).toBe(true)
  })

  it('is false when all players have resigned', () => {
    const team = new Team(1, [makePlayer('Alice', true), makePlayer('Bob', true)])
    expect(team.survivor).toBe(false)
  })
})

describe('Game.setWinner', () => {
  it('sets left team as winner when right team resigned', () => {
    const game = gameWithResignations(false, true)
    game.setWinner()
    expect(game.outcome?.side).toBe('left')
    expect(game.outcome?.team_id).toBe(1)
  })

  it('sets right team as winner when left team resigned', () => {
    const game = gameWithResignations(true, false)
    game.setWinner()
    expect(game.outcome?.side).toBe('right')
    expect(game.outcome?.team_id).toBe(2)
  })

  it('sets no winner when neither team has resigned', () => {
    const game = gameWithResignations(false, false)
    game.setWinner()
    expect(game.outcome).toBeNull()
  })

  it('sets no winner when both teams have resigned', () => {
    const game = gameWithResignations(true, true)
    game.setWinner()
    expect(game.outcome).toBeNull()
  })
})

describe('normalizePlayerName', () => {
  it('does not modify acceptable name', () => {
    expect(normalizePlayerName('Player3', 'DefaultName')).toBe('Player3')
  })
  it('removes whitespace', () => {
    expect(normalizePlayerName(' P l a y e r 3 ', 'DefaultName')).toBe('Player3')
  })
  it('removes bad characters', () => {
    expect(normalizePlayerName('Player<>:"/\\Three ', 'DefaultName')).toBe('PlayerThree')
  })
})

describe('normalizePlayerName', () => {
  it('uses default name if result is empty', () => {
    expect(normalizePlayerName('<>:"/\\', 'DefaultName')).toBe('DefaultName')
  })
})

describe('matchName', () => {
  it('generates a correct match name', () => {
    expect(matchName('Player1', 'Player2')).toBe('Player1_vs_Player2')
  })
})

describe('zipFilename', () => {
  it('generates a correct zip filename', () => {
    expect(zipFilename('Player1', 'Player2')).toBe('Player1_vs_Player2.zip')
  })
})

describe('Game.isDummy', () => {
  it('is true when there are no replays', () => {
    expect(new Game().isDummy()).toBe(true)
  })

  it('is true when no replay has a recording', () => {
    const game = new Game()
    game.replays.push({} as Replay)
    expect(game.isDummy()).toBe(true)
  })

  it('is false when at least one replay has a recording', () => {
    const game = new Game()
    game.replays.push({ recording: {} as SavegameSummary } as Replay)
    expect(game.isDummy()).toBe(false)
  })

  it('is false when a replay has a dummy recording', () => {
    expect(new Game([makeReplay(makeUnparseable())]).isDummy()).toBe(false)
  })
})

describe('computeReplayFilename', () => {
  it('creates some replay file names', () => {
    const game1 = new Game()
    for (let i = 0; i < 30; i++) {
      game1.replays.push({} as Replay) // Actual object is irrelevant
    }

    expect(computeReplayFilename('Playe<>r 3', ' Pl ay::er 4 ', game1, 0, 27)).toBe(
      'Player3_vs_Player4_G1bb.aoe2record'
    )
    expect(computeReplayFilename('Playe<>r 3', ' Pl ay::er 4 ', game1, 1, 25)).toBe(
      'Player3_vs_Player4_G2az.aoe2record'
    )
    expect(computeReplayFilename('Playe<>r 3', ' Pl ay::er 4 ', game1, 2, 28)).toBe(
      'Player3_vs_Player4_G3bc.aoe2record'
    )
  })
})

describe('Game.addReplay', () => {
  it('orders replays by timestamp, including unparseable ones', () => {
    const recording = makeRecording({ timestamp: 1700000000 })
    const game = new Game([makeReplay(recording, 'second.aoe2record')])
    game.addReplay(makeReplay(makeUnparseable(1700000000 - 60), 'first.aoe2record'))
    expect(game.replays.map((replay) => replay.file.name)).toEqual([
      'first.aoe2record',
      'second.aoe2record'
    ])
  })
})

describe('Game date', () => {
  it('reads the timestamp of an unparseable replay as seconds', () => {
    const game = makeGame(makeUnparseable(1700000000))
    expect(game.date).toEqual(new Date(1700000000 * 1000))
  })
})

describe('extractRecordingInfo', () => {
  it('reads the map, date, duration and teams', () => {
    const info = extractRecordingInfo(
      makeRecording({ teams: [[ALICE], [BOB]], mapId: 9, timestamp: 1700000000, duration: 1234 })
    )
    expect(info.mapName).toBe('Arabia')
    expect(info.date).toEqual(new Date(1700000000 * 1000))
    expect(info.duration).toBe(1234)
    expect(info.teams.map((team) => team.players)).toEqual([
      [new Player(1, 'Alice', '1', 'Britons', 1, 1, false)],
      [new Player(2, 'Bob', '2', 'Franks', 2, 2, false)]
    ])
  })

  it('takes the name of a custom map from its script', () => {
    const recording = makeRecording({ mapId: 99999, rmsStrings: ['', 'a:b:My Map.rms'] })
    expect(extractRecordingInfo(recording).mapName).toBe('My Map')
  })

  it('falls back to unknown map and civ names', () => {
    const recording = makeRecording({ mapId: 99999, teams: [[{ name: 'X', civ: 999 }]] })
    const info = extractRecordingInfo(recording)
    expect(info.mapName).toBe('Unknown map')
    expect(info.teams[0]?.players[0]?.civ).toBe('Unknown Civ')
  })
})

describe('Game.matchesRecording', () => {
  const game = makeGame(makeRecording({ teams: [[ALICE], [BOB]] }))

  it('matches a recording of the same players, civs and map', () => {
    expect(game.matchesRecording(makeRecording({ teams: [[ALICE], [BOB]], timestamp: 5 }))).toBe(
      true
    )
  })

  it('does not match a different map', () => {
    expect(game.matchesRecording(makeRecording({ teams: [[ALICE], [BOB]], mapId: 10 }))).toBe(false)
  })

  it('does not match different civs or players', () => {
    expect(game.matchesRecording(makeRecording({ teams: [[ALICE], [{ ...BOB, civ: 3 }]] }))).toBe(
      false
    )
    expect(
      game.matchesRecording(makeRecording({ teams: [[ALICE], [{ ...BOB, profile: 3 }]] }))
    ).toBe(false)
  })

  it('does not match a different team setup', () => {
    expect(game.matchesRecording(makeRecording({ teams: [[ALICE, BOB]] }))).toBe(false)
    expect(game.matchesRecording(makeRecording({ teams: [[ALICE], [BOB], [ALICE]] }))).toBe(false)
  })

  it('does not match an unparseable recording', () => {
    expect(game.matchesRecording(makeUnparseable())).toBe(false)
  })
})

describe('Game.addReplay teams', () => {
  const recording = (timestamp: number, bobResigned: boolean) =>
    makeRecording({ teams: [[ALICE], [{ ...BOB, resigned: bobResigned }]], timestamp })

  it('takes the teams and outcome from the latest replay', () => {
    const game = makeGame(recording(1000, false))
    expect(game.outcome).toBeNull()
    game.addReplay(makeReplay(recording(2000, true)))
    expect(game.outcome?.firstPlayer?.name).toBe('Alice')
  })

  it('keeps the latest replay when adding an earlier one', () => {
    const game = makeGame(recording(2000, true))
    game.addReplay(makeReplay(recording(1000, false)))
    expect(game.teams[1]?.survivor).toBe(false)
  })

  it('keeps the teams when adding an unparseable replay', () => {
    const game = makeGame(recording(1000, true))
    game.addReplay(makeReplay(makeUnparseable()))
    expect(game.teams).toHaveLength(2)
  })
})

describe('Game.isUnparseable', () => {
  it('is true when every replay is unparseable', () => {
    expect(makeGame(makeUnparseable(), makeUnparseable()).isUnparseable()).toBe(true)
  })

  it('is false for a parsed game', () => {
    expect(makeGame().isUnparseable()).toBe(false)
  })

  it('is false for a placeholder game', () => {
    expect(new Game().isUnparseable()).toBe(false)
  })
})
