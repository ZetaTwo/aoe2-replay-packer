import type { SavegameSummary } from 'aoe2rec-js'
import { Game, Replay, type DummyReplay } from '../game'

type PlayerSpec = { name: string; profile?: number; civ?: number; resigned?: boolean }

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
  let playerNumber = 1
  return {
    header: {
      timestamp,
      game_settings: { resolved_map_id: mapId, rms_strings: rmsStrings }
    },
    duration,
    teams: teams.map((players, teamIdx) => ({
      players: players.map((player) => ({
        player_number: playerNumber++,
        name: player.name,
        profile_id: player.profile ?? playerNumber * 100,
        civ_id: player.civ ?? 1,
        color_id: playerNumber - 2,
        resigned: player.resigned ?? false,
        resolved_team_id: teamIdx + 1
      }))
    }))
  } as unknown as SavegameSummary
}

export function makeReplay(
  recording: SavegameSummary | DummyReplay = makeRecording(),
  name = 'game.aoe2record'
) {
  return new Replay(new File(['rec'], name), recording)
}

export function makeGame(...recordings: SavegameSummary[]) {
  return new Game((recordings.length ? recordings : [makeRecording()]).map((r) => makeReplay(r)))
}
