import { computed, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { parse_rec_summary, SavegameSummary } from 'aoe2rec-js'
import { Game, Replay, type DummyReplay } from '@/entities/game'
import { extractRecordings } from '@/lib/archive'
import { sha256 } from '@/lib/hash'

export const useGamesStore = defineStore('games', () => {
  const games: Ref<Game[]> = ref([new Game(), new Game(), new Game()])
  const skippedDuplicates: Ref<string[]> = ref([])

  async function addRec(file: File) {
    const contents = await file.arrayBuffer()
    const contentHash = await sha256(contents)
    // No awaits from here on, so files added in parallel can't both pass the duplicate check
    const isDuplicate = games.value.some((game) =>
      game.replays.some((replay) => replay.contentHash == contentHash)
    )
    if (isDuplicate) {
      skippedDuplicates.value = [...skippedDuplicates.value, file.name]
      return
    }

    const replay = new Replay(file, parseRec(file, contents), contentHash)
    const gameTypes = Object.groupBy(games.value, (game) => (game.isDummy() ? 'dummy' : 'real'))
    const existingGame = (gameTypes.real ?? []).find((game) =>
      game.matchesRecording(replay.recording)
    )
    if (existingGame) {
      existingGame.addReplay(replay)
      return
    }

    addGame(new Game([replay]))
  }

  function clearSkippedDuplicates() {
    skippedDuplicates.value = []
  }

  function parseRec(file: File, contents: ArrayBuffer): SavegameSummary | DummyReplay {
    try {
      return parse_rec_summary(contents)
    } catch (error) {
      console.error('Failed to parse', error)
      return { header: { timestamp: file.lastModified / 1000 }, dummy: true }
    }
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

  async function expandArchive(file: File) {
    const recFiles = await extractRecordings(file)
    await Promise.all(recFiles.map((rec) => addRec(rec)))
  }

  const realGamesCount = computed(() => games.value.filter((game) => !game.isDummy()).length)
  const hasGames = computed(() => realGamesCount.value > 0)
  return {
    addRec,
    games,
    skippedDuplicates,
    clearSkippedDuplicates,
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
