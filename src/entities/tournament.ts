export type SetFormat = 'bo3' | 'bo5' | 'bo7' | 'bo9' | 'pa2' | 'pa3' | 'pa5' | 'pa7'

export type Tournament = {
  name: string
  maps: Record<SetFormat, string[]>
  civs: Record<SetFormat, string[]>
  drafts: 'both' | 'map' | 'civ' | 'none'
}
