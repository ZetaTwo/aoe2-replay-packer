import type { Game } from './game'
import { MatchSetType } from './matchset'

export function missingReplaysWarning(games: Game[], boPa: MatchSetType | null) {
  return boPa == MatchSetType.PlayAll && games.some((game) => game.isDummy())
}
