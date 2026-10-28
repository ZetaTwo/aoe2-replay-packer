import { execFile } from 'child_process'
import { promisify } from 'util'
import { join as joinPath } from 'path'
import { parse as parseYaml } from 'yaml'
import { Dir } from 'fs'
import { readFile, opendir } from 'fs/promises'
import type { SetFormat, Tournament } from './src/entities/tournament.ts'

const execFileAsync = promisify(execFile)

const gitDirectory = '.tcc-stats'
const tournamentsDirectoryPath = `${gitDirectory}/tournaments`

const moduleId = 'virtual:tournaments-data'
const resolvedModuleId = '\0' + moduleId

async function getTournamentDirectories(): Promise<Dir> {
  try {
    const tournamentsDirectory = await opendir(tournamentsDirectoryPath)
    await execFileAsync('git', ['-C', gitDirectory, 'pull'])
    console.log('Using cached tournaments data')
    return tournamentsDirectory
  } catch {
    console.log('Downloading tournaments data')
    await execFileAsync('git', [
      'clone',
      '--depth',
      '1',
      'https://gitlab.com/Kjir/tcc-stats.git',
      gitDirectory
    ])
    return await opendir(tournamentsDirectoryPath)
  }
}


async function getTournamentData(): Promise<Record<string, Tournament>> {
  const tournamentsDir = await getTournamentDirectories()
  const tournaments: Record<string, Tournament> = {}
  for await (const dirent of tournamentsDir) {
    if (!dirent.isDirectory()) {
      continue
    }
    const tournamentPath = joinPath(dirent.parentPath, dirent.name, 'tournament.yaml')
    const tournamentYaml = await readFile(tournamentPath, 'utf-8')
    const tournamentdata = parseYaml(tournamentYaml)
    const ensureArray = (presets: Record<SetFormat, string | string[]>) => Object.fromEntries(Object.entries(presets).map(([format, preset]) => [format, Array.isArray(preset) ? preset : [preset]])) as Record<SetFormat, string[]>
    const civPresets = ensureArray(tournamentdata['presets']['civs'] || {})
    const mapPresets = ensureArray(tournamentdata['presets']['maps'] || {})
    const draftsFormat = tournamentdata['drafts'] || 'both'
    tournaments[dirent.name] = { name: tournamentdata.name, civs: civPresets, maps: mapPresets, drafts: draftsFormat }
  }

  return tournaments
}

export default function tournamentsData() {
  return {
    name: 'tournaments-data',
    async resolveId(source: string) {
      if (source === moduleId) {
        return resolvedModuleId
      }
      return null
    },
    async load(id: string) {
      if (id === resolvedModuleId) {
        console.log('Loading tournaments data')
        const data = await getTournamentData()
        return `export default ${JSON.stringify(data)}`
      }
      return null
    }
  }
}
