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
  type DummyReplay
} from './game'
import type { SavegameSummary } from 'aoe2rec-js'

function makePlayer(name: string, resigned: boolean): Player {
  return new Player(1, name, name, 'Britons', 1, 1, resigned)
}

function makeGame(leftResigned: boolean, rightResigned: boolean): Game {
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
    const game = makeGame(false, true)
    game.setWinner()
    expect(game.outcome?.side).toBe('left')
    expect(game.outcome?.team_id).toBe(1)
  })

  it('sets right team as winner when left team resigned', () => {
    const game = makeGame(true, false)
    game.setWinner()
    expect(game.outcome?.side).toBe('right')
    expect(game.outcome?.team_id).toBe(2)
  })

  it('sets no winner when neither team has resigned', () => {
    const game = makeGame(false, false)
    game.setWinner()
    expect(game.outcome).toBeNull()
  })

  it('sets no winner when both teams have resigned', () => {
    const game = makeGame(true, true)
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
    const game = new Game()
    const dummyRecording: DummyReplay = { dummy: true, header: { timestamp: 0 } }
    game.replays.push({ recording: dummyRecording } as Replay)
    expect(game.isDummy()).toBe(false)
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
