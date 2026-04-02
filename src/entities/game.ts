import unidecode from 'unidecode'
import { logn, toBase26 } from '../lib/maths'
import { mapNames } from './maps'
import { civNames } from './civs'
import type { SavegameSummary, Team as SavegameTeam } from 'aoe2rec-js'

const UNICODE_NORMALIZATION = false // Setting this to true doubles the code size

let gameCounter = 0
let replayCounter = 0

type player_id = number

export class Player {
  id: player_id
  name: string
  profile: string
  civ: string
  team_id: number
  color: number
  resigned: boolean

  constructor(
    id: player_id,
    name: string,
    profile: string,
    civ: string,
    team_id: number,
    color: number,
    resigned: boolean
  ) {
    this.id = id
    this.name = name
    this.profile = profile
    this.civ = civ
    this.team_id = team_id
    this.color = color
    this.resigned = resigned
  }
}

export class Team {
  id: number
  players: Player[]
  survivor: boolean
  constructor(team_id: number, players: Player[]) {
    this.id = team_id
    this.players = players
    this.survivor = players.some((player) => !player.resigned)
  }

  asGameWinner(side: 'left' | 'right'): GameWinner {
    const sortedPlayers = this.players.toSorted((p1, p2) => p1.profile.localeCompare(p2.profile))
    return {
      team_id: this.id,
      side: side,
      firstPlayer: sortedPlayers[0],
      players: sortedPlayers
    }
  }
}

type GameWinner = {
  team_id?: Team['id']
  side: 'left' | 'right'
  firstPlayer?: Player
  players: Player[]
}

export const dummyWinner = (side: 'left' | 'right') => {
  return {
    side: side,
    players: []
  }
}

export type GameOutcome = GameWinner | null

export class Game {
  replays: Replay[] = []
  outcome: GameOutcome
  id: number
  date?: Date
  mapName?: string
  teams: Team[]
  duration: number

  constructor(replays: Replay[] | null = null) {
    this.id = gameCounter++
    this.outcome = null
    this.teams = []
    this.duration = 0
    if (Array.isArray(replays)) {
      this.replays = replays
    } else {
      this.replays = []
    }

    const recording = this.replays[0]?.recording
    if (recording) {
      if ('dummy' in recording) {
        this.date = new Date(recording.header.timestamp)
        return
      }
      const { date, mapName, duration, teams } = extractRecordingInfo(recording)
      this.date = date
      this.mapName = mapName
      this.duration = duration
      this.teams = teams
      this.setWinner()
    }
  }

  setWinner() {
    const left_team = this.teams[0]
    const right_team = this.teams[this.teams.length - 1]
    if (left_team?.survivor && !right_team?.survivor) {
      this.outcome = left_team.asGameWinner('left')
    } else if (right_team?.survivor && !left_team?.survivor) {
      this.outcome = right_team.asGameWinner('right')
    }
  }

  isDummy() {
    return this.replays.length == 0 || this.replays.findIndex((replay) => !!replay.recording) == -1
  }

  isUnparseable() {
    return (
      !this.mapName &&
      this.replays.length > 0 &&
      this.replays.every((replay) => 'dummy' in replay.recording)
    )
  }

  matchesRecording(recording: SavegameSummary | DummyReplay) {
    if ('dummy' in recording) {
      return false
    }
    const recordingInfo = extractRecordingInfo(recording)
    if (recordingInfo.mapName != this.mapName) {
      return false
    }
    if (recordingInfo.teams.length != (this?.teams?.length ?? -1)) {
      return false
    }
    return recordingInfo.teams.every((team, index) => {
      const recordingPlayers = team.players
      if (!this.teams || !this.teams[index]) {
        return false
      }
      const players = this.teams[index].players
      if (recordingPlayers.length != players.length) {
        return false
      }
      return recordingPlayers.every((recordingPlayer, playerIndex) => {
        const player = players[playerIndex]
        if (recordingPlayer.profile != player?.profile) {
          return false
        }
        if (recordingPlayer.civ != player?.civ) {
          return false
        }
        return true
      })
    })
  }

  addRecording(file: File, recording: SavegameSummary | DummyReplay) {
    this.addReplay(new Replay(file, recording))
  }

  addReplay(replay: Replay) {
    this.replays = [...this.replays, replay].sort(
      (replayA, replayB) =>
        (replayA.recording?.header?.timestamp ?? 0) - (replayB.recording?.header?.timestamp ?? 0)
    )
    const lastReplay = this.replays.findLast(
      (replay) => !!replay.recording && !('dummy' in replay.recording)
    )
    const latestRecording = lastReplay?.recording ?? replay.recording
    if ('dummy' in latestRecording) {
      return
    }
    const recordingInfo = extractRecordingInfo(latestRecording)
    this.duration = recordingInfo.duration
    this.teams = recordingInfo.teams
    this.setWinner()
  }
}

export class Replay {
  id: number
  file: File
  recording: SavegameSummary | DummyReplay
  constructor(file: File, recording: SavegameSummary | DummyReplay) {
    this.id = replayCounter++
    this.file = file
    this.recording = recording
  }
}

export type DummyReplay = { header: { timestamp: number } } & {
  dummy: true
}

export function normalizePlayerName(playerName: string, defaultName: string) {
  const asciiName = UNICODE_NORMALIZATION
    ? unidecode(playerName)
    : playerName.replace(/[^\x00-\x7F]/g, '')

  const noWhitespaceName = asciiName.replace(/\s/g, '')

  const noUnprintableName = noWhitespaceName.replace(/[\x00-\x20]/g, '')
  const normalizedName = noUnprintableName.replace(/[<>:"/\\|?*]/g, '')

  if (normalizedName.length == 0) {
    return defaultName
  } else {
    return normalizedName
  }
}

export function matchName(player1: string, player2: string) {
  return `${normalizePlayerName(player1, 'Player1')}_vs_${normalizePlayerName(player2, 'Player2')}`
}

export function zipFilename(player1: string, player2: string) {
  return `${matchName(normalizePlayerName(player1, 'Player1'), normalizePlayerName(player2, 'Player2'))}.zip`
}

export function computeReplayFilename(
  player1: string,
  player2: string,
  game: Game,
  gameIdx: number,
  replayIdx: number
) {
  const numReplays = game.replays.length
  const replaySubNumbering =
    numReplays > 1 ? toBase26(replayIdx, Math.ceil(logn(numReplays, 26))) : ''
  return `${matchName(normalizePlayerName(player1, 'Player1'), normalizePlayerName(player2, 'Player2'))}_G${gameIdx + 1}${replaySubNumbering}.aoe2record`
}

function getTeams(teams: SavegameTeam[]) {
  return teams.map((team) => {
    const team_id = team.players.at(0)?.resolved_team_id ?? -1
    return new Team(
      team_id,
      team.players.map(
        (player) =>
          new Player(
            player.player_number,
            player.name,
            `${player.profile_id}`,
            civNames[player.civ_id] ?? 'Unknown Civ',
            team_id,
            player.color_id + 1,
            player.resigned
          )
      )
    )
  })
}

export function extractRecordingInfo(recording: SavegameSummary) {
  const game_settings = recording.header.game_settings
  const map_id = game_settings.resolved_map_id
  const date = new Date(recording.header.timestamp * 1000)
  const mapName =
    mapNames[map_id] ??
    game_settings.rms_strings[1]?.split(':')[2]?.replace(/\.rms$/, '') ??
    'Unknown map'
  const duration = recording.duration
  const teams = getTeams(recording.teams)
  return { date, mapName, duration, teams }
}
