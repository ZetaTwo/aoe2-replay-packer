export type SetFormat = 'bo3' | 'bo5' | 'bo7' | 'bo9' | 'pa2' | 'pa3' | 'pa5' | 'pa7'

export type Tournament = {
  name: string
  maps: Record<SetFormat, string[]>
  civs: Record<SetFormat, string[]>
  drafts: 'both' | 'map' | 'civ' | 'none'
}

export function getTournament(params: URLSearchParams, tournaments: Record<string, Tournament>) {
  const tournamentId = params.get('tournament')
  return tournamentId ? tournaments[tournamentId] : undefined
}

// Presets from the URL plus those of the tournament, as [civ presets, map presets]
export function getPresets(
  params: URLSearchParams,
  tournament?: Tournament
): [string[] | null, string[] | null] {
  const civDraftPresets = params.get('civpresets')?.split(',') || []
  const mapDraftPresets = params.get('mappresets')?.split(',') || []
  if (tournament) {
    civDraftPresets.push(...Object.values(tournament.civs).flat())
    mapDraftPresets.push(...Object.values(tournament.maps).flat())
  }
  return [
    civDraftPresets.length > 0 ? civDraftPresets : null,
    mapDraftPresets.length > 0 ? mapDraftPresets : null
  ]
}
