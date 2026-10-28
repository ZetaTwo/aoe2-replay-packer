import type { MockedFunction } from 'vitest'
import type { parse_rec_summary, SavegameSummary } from 'aoe2rec-js'
import { Game, Replay, dummyWinner, type DummyReplay } from '../game'

export type PlayerSpec = { name: string; profile?: number; civ?: number; resigned?: boolean }

export const ALICE = { name: 'Alice', profile: 1, civ: 1 }
export const BOB = { name: 'Bob', profile: 2, civ: 2 }
export const CAROL = { name: 'Carol', profile: 3, civ: 3 }
export const DAVE = { name: 'Dave', profile: 4, civ: 4 }

// Only the fields extractRecordingInfo reads
export function makeRecording({
  teams = [[{ name: 'Alice' }], [{ name: 'Bob' }]],
  mapId = 9,
  rmsStrings = [],
  timestamp = 1700000000,
  duration = 1000
}: {
  teams?: PlayerSpec[][]
  mapId?: number
  rmsStrings?: string[]
  timestamp?: number
  duration?: number
} = {}): SavegameSummary {
  let playerNumber = 0
  return {
    header: {
      timestamp,
      game_settings: { resolved_map_id: mapId, rms_strings: rmsStrings }
    },
    duration,
    teams: teams.map((players, teamIdx) => ({
      players: players.map((player) => {
        playerNumber++
        return {
          player_number: playerNumber,
          name: player.name,
          profile_id: player.profile ?? playerNumber * 100,
          civ_id: player.civ ?? 1,
          color_id: playerNumber - 1,
          resigned: player.resigned ?? false,
          resolved_team_id: teamIdx + 1
        }
      })
    }))
  } as unknown as SavegameSummary
}

export function makeUnparseable(timestamp = 0): DummyReplay {
  return { dummy: true, header: { timestamp } }
}

// A 1v1 that ended with the loser resigning, or without a result
export function makeMatch(
  left: PlayerSpec,
  right: PlayerSpec,
  { loser, timestamp }: { loser?: PlayerSpec; timestamp?: number } = {}
) {
  return makeRecording({
    teams: [[{ ...left, resigned: loser == left }], [{ ...right, resigned: loser == right }]],
    timestamp
  })
}

export function makeReplay(
  recording: SavegameSummary | DummyReplay = makeRecording(),
  name = 'game.aoe2record'
) {
  return new Replay(new File(['rec'], name), recording)
}

export function makeGame(...recordings: (SavegameSummary | DummyReplay)[]) {
  return new Game((recordings.length ? recordings : [makeRecording()]).map((r) => makeReplay(r)))
}

export function playedGame(left: PlayerSpec, right: PlayerSpec, loser?: PlayerSpec) {
  return makeGame(makeMatch(left, right, { loser }))
}

export function unparseableGame() {
  return makeGame(makeUnparseable())
}

// An unparseable game whose winner was set by hand, so only the side is known
export function gameWithOutcome(side: 'left' | 'right') {
  const game = unparseableGame()
  game.outcome = dummyWinner(side)
  return game
}

// Files with different names get different contents, so they aren't duplicates
export function recFile(name = 'game.aoe2record', lastModified?: number, contents = name) {
  return new File([contents], name, { lastModified })
}

// Queue one parse result per file, in the order the files get parsed
export function mockParsing(
  parse: MockedFunction<typeof parse_rec_summary>,
  ...results: (SavegameSummary | 'unparseable')[]
) {
  for (const result of results) {
    if (result == 'unparseable') {
      parse.mockImplementationOnce(() => {
        throw new Error('Unparseable recording')
      })
    } else {
      parse.mockReturnValueOnce(result)
    }
  }
}
