import { computed, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { parse_rec_summary, SavegameSummary } from 'aoe2rec-js'
import { Game, Replay, type DummyReplay } from '@/entities/game'
import webworker from 'libarchive.js/dist/worker-bundle.js?url'

export const useGamesStore = defineStore('games', () => {
  const games: Ref<Game[]> = ref([new Game(), new Game(), new Game()])

  async function addRec(file: File) {
    const recording = await parseRec(file)
    const gameTypes = Object.groupBy(games.value, (game) => (game.isDummy() ? 'dummy' : 'real'))
    const existingGame = (gameTypes.real ?? []).find((game) => game.matchesRecording(recording))
    if (existingGame) {
      existingGame.addRecording(file, recording)
      return
    }

    const newGame = new Game([new Replay(file, recording)])
    addGame(newGame)
  }

  async function parseRec(file: File) {
    return new Promise<SavegameSummary | DummyReplay>((resolve) => {
      const reader = new FileReader()
      reader.addEventListener(
        'loadend',
        (event) => {
          if (!event.target || !event.target.result) {
            console.error('Could not find target')
            return
          }
          try {
            const recording = parse_rec_summary(event.target.result as ArrayBuffer)
            resolve(recording)
          } catch (error) {
            console.error('Failed to parse', error)
            const recording: DummyReplay = { header: { timestamp: file.lastModified }, dummy: true }
            resolve(recording)
          }
        },
        false
      )
      reader.readAsArrayBuffer(file)
    })
  }

  function addGame(newGame: Game) {
    const gameTypes = Object.groupBy(games.value, (game) => (game.isDummy() ? 'dummy' : 'real'))

    const realGames = Object.groupBy(gameTypes.real ?? [], (game) =>
      (game.date?.getTime() ?? 0) < (newGame.date?.getTime() ?? 0) ? 'before' : 'after'
    )
    const sortedGames = [...(realGames.before ?? []), newGame, ...(realGames.after ?? [])]

    games.value = [...sortedGames, ...(gameTypes['dummy']?.slice(0, -1) ?? [])]
  }

  function clearGame(index: number) {
    games.value = games.value.filter((_game, game_index) => index != game_index)
    games.value.push(new Game())
  }

  function removeGame(index: number) {
    games.value = games.value.filter((_game, game_index) => index != game_index)
  }

  function setGamesNumber(gamesNumber: number) {
    games.value = games.value.slice(0, gamesNumber)
    while (games.value.length < gamesNumber) {
      games.value.push(new Game())
    }
  }

  function moveGame(index: number, positionShift: number) {
    const otherIndex = index + positionShift
    if (!games.value[index] || !games.value[otherIndex] || otherIndex == index) {
      return
    }

    ;[games.value[index], games.value[otherIndex]] = [games.value[otherIndex], games.value[index]]
  }

  function moveReplay(replayId: number, sourceGameIdx: number, targetGameIdx: number) {
    const sourceGame = games.value[sourceGameIdx]
    if (!sourceGame) {
      return
    }

    const replayToMove = sourceGame.replays.find((replay) => replay.id == replayId)

    if (!replayToMove) {
      return
    }

    games.value = games.value
      .map((game, index) => {
        if (index == sourceGameIdx) {
          return new Game(game.replays.filter((replay) => replay.id != replayId))
        }
        if (index == targetGameIdx) {
          game.addReplay(replayToMove)
        }
        return game
      })
      .toSorted((game1, game2) => +game1.isDummy() - +game2.isDummy())

    if (targetGameIdx == -1) {
      addGame(new Game([replayToMove]))
    }
  }

  // TODO: file issues to add these to the lib
  type CompressedFile = { name: string; extract: () => Promise<File> }
  type ArchiveEntry = { file: CompressedFile; path: string }

  async function expandArchive(file: File) {
    const { Archive } = await import('libarchive.js')
    Archive.init({ workerUrl: webworker })
    const archiveData = await Archive.open(file)

    const filesList: ArchiveEntry[] = await archiveData.getFilesArray()
    const recFiles = await Promise.all(
      filesList
        .filter((f) => f.file.name.endsWith('.aoe2record'))
        .sort((a, b) => a.file.name.localeCompare(b.file.name))
        .map((f) => f.file.extract())
    )
    await Promise.all(recFiles.map((rec) => addRec(rec)))
  }

  const realGamesCount = computed(() => games.value.filter((game) => !game.isDummy()).length)
  const hasGames = computed(() => realGamesCount.value > 0)
  return {
    addRec,
    parseRec,
    games,
    hasGames,
    clearGame,
    removeGame,
    setGamesNumber,
    moveGame,
    realGamesCount,
    moveReplay,
    expandArchive
  }
})
