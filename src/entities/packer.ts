import type { Tournament } from 'virtual:tournaments-data'
import { computeReplayFilename, type Game, type Player } from './game'
import type { ReplayErrors, ReplayMetadata } from './gamemeta'
import { MatchSetDefinition, MatchSetType } from './matchset'
import { extractDraftUrl } from './aoe2cm'
import { padBlob, type ZipFile } from '@/lib/zip'

type Side = 'left' | 'right'
export type Scores = Record<Side, number>
type PlayerSides = Record<Side, Player['profile'] | undefined>

export function missingReplaysWarning(games: Game[], boPa: MatchSetType | null) {
  return boPa == MatchSetType.PlayAll && games.some((game) => game.isDummy())
}

// Wins by player profile, plus manually set outcomes that only know the side
export function countWins(games: Game[]) {
  return games.reduce(
    (count, game) => {
      const outcome = game.outcome
      if (outcome) {
        const winnerProfile = outcome.firstPlayer?.profile
        if (winnerProfile) {
          count.players[winnerProfile] = (count.players[winnerProfile] ?? 0) + 1
        } else if (outcome.side == 'left') {
          count.left += 1
        } else if (outcome.side == 'right') {
          count.right += 1
        }
      }
      return count
    },
    { left: 0, right: 0, players: {} } as Scores & { players: Record<Player['profile'], number> }
  )
}

// Which profile plays as player 1 (left) and player 2 (right), matched by name
export function findPlayerSides(
  games: Game[],
  player1: string,
  player2: string
): PlayerSides | null {
  if ((games[0]?.teams?.length ?? 0) < 2) {
    return null
  }

  const playerNameIsSimilarTo = (draftPlayer: string) => (player: Player) =>
    player.name.toLowerCase().includes(draftPlayer.toLowerCase()) ||
    draftPlayer.toLowerCase().includes(player.name.toLowerCase())

  const parsedGames = games.filter((game) => !game.isUnparseable() && !game.isDummy())

  for (const game of parsedGames) {
    const team1 = game.teams[0]
    const team2 = game.teams[1]
    if (!team1 || !team2) {
      continue
    }

    const profile1 = team1.asGameWinner('left').firstPlayer?.profile
    const profile2 = team2.asGameWinner('right').firstPlayer?.profile

    if (team1.players.find(playerNameIsSimilarTo(player1))) {
      return { left: profile1, right: profile2 }
    }
    if (team1.players.find(playerNameIsSimilarTo(player2))) {
      return { left: profile2, right: profile1 }
    }
    if (team2.players.find(playerNameIsSimilarTo(player2))) {
      return { left: profile1, right: profile2 }
    }
    if (team2.players.find(playerNameIsSimilarTo(player1))) {
      return { left: profile2, right: profile1 }
    }
  }

  for (const game of parsedGames) {
    const team1 = game.teams[0]
    const team2 = game.teams[game.teams.length - 1]
    if (!team1 || !team2) {
      continue
    }
    return {
      left: team1.asGameWinner('left').firstPlayer?.profile,
      right: team2.asGameWinner('left').firstPlayer?.profile
    }
  }

  return null
}

export function computeScores(games: Game[], player1: string, player2: string): Scores {
  const wins = countWins(games)
  const sides = findPlayerSides(games, player1, player2)
  return {
    left: (wins.players[sides?.left ?? ''] ?? 0) + wins.left,
    right: (wins.players[sides?.right ?? ''] ?? 0) + wins.right
  }
}

// A best of ends once a player has won a majority of the games
export function scoreWarning(scores: Scores, gamesCount: number, boPa: MatchSetType | null) {
  if (boPa == MatchSetType.PlayAll) {
    return false
  }
  return 2 * scores.left > gamesCount + 1 || 2 * scores.right > gamesCount + 1
}

export function draftMissingWarning(presets: string[] | null, draftUri: string) {
  return (presets?.length ?? 0) > 0 && draftUri.length == 0
}

export function downloadDisabledReason(
  errors: ReplayErrors,
  boPa: MatchSetType | null,
  expectedGamesCount: number,
  games: Game[]
) {
  if (errors.civs || errors.maps) {
    return 'The draft links have some issues'
  }
  if (boPa == null || expectedGamesCount == 0) {
    return 'You must choose the type of set (e.g. Best of 5)'
  }
  if (games.every((game) => game.isDummy())) {
    return 'Replays are missing'
  }
  return null
}

// Best of sets have an odd number of games
export function guessSetLength(pickedMapsCount: number) {
  return pickedMapsCount % 2 == 0 ? pickedMapsCount + 1 : pickedMapsCount
}

export function tournamentSetDefinitions(tournament: Tournament) {
  return [...new Set([...Object.keys(tournament.maps), ...Object.keys(tournament.civs)])].map(
    MatchSetDefinition.parse
  )
}

export function presetSetDefinition(tournament: Tournament, preset: string) {
  const setType = [...Object.entries(tournament.maps), ...Object.entries(tournament.civs)].findLast(
    ([, presets]) => presets.includes(preset)
  )?.[0]
  return setType ? MatchSetDefinition.parse(setType) : undefined
}

export function discordMessage({
  player1,
  player2,
  scores,
  showResults,
  boPa,
  gamesCount,
  mapDraft,
  civDraft
}: {
  player1: string
  player2: string
  scores: Scores
  showResults: boolean
  boPa: MatchSetType | null
  gamesCount: number
  mapDraft: string
  civDraft: string
}) {
  const boPaLabel = boPa?.toString() ?? 'Best of' // TODO: should there be a default value?
  const scorePreview = showResults ? `|| ${scores.left} - ${scores.right} ||` : 'vs'
  return `${player1} ${scorePreview} ${player2}
${boPaLabel} ${gamesCount}
Map draft: <${extractDraftUrl(mapDraft)}>
Civ draft: <${extractDraftUrl(civDraft)}>`
}

export type ReplayEntry =
  { kind: 'replay'; filename: string; file: File } | { kind: 'placeholder'; filename: string }

export function replayEntries(games: Game[], player1: string, player2: string): ReplayEntry[] {
  return games.flatMap((game, gameIdx): ReplayEntry[] => {
    if (game.isDummy()) {
      const filename = computeReplayFilename(player1, player2, game, gameIdx, 0)
      return [{ kind: 'placeholder', filename }]
    }
    return game.replays.map((replay, replayIdx) => ({
      kind: 'replay',
      filename: computeReplayFilename(player1, player2, game, gameIdx, replayIdx),
      file: replay.file
    }))
  })
}

// Placeholders are a real replay padded to a random size, so file sizes don't reveal which games were played
export function zipFiles(
  games: Game[],
  player1: string,
  player2: string,
  meta: ReplayMetadata,
  placeholderPadding: () => number
): ZipFile[] | null {
  const entries = replayEntries(games, player1, player2)
  const placeholderBase = entries.find((entry) => entry.kind == 'replay')?.file
  if (!placeholderBase) {
    return null
  }

  return [
    ...entries.map((entry) => ({
      name: entry.filename,
      content:
        entry.kind == 'replay'
          ? entry.file
          : padBlob(placeholderBase, placeholderPadding(), 'DUMMYREC')
    })),
    {
      name: 'metadata.json',
      content: new Blob([JSON.stringify(meta)], { type: 'application/json' })
    }
  ]
}
