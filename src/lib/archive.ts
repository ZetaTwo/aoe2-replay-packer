import webworker from 'libarchive.js/dist/worker-bundle.js?url'

// TODO: file issues to add these to the lib
type CompressedFile = { name: string; extract: () => Promise<File> }
type ArchiveEntry = { file: CompressedFile; path: string }

// Includes recordings in subfolders
export async function extractRecordings(archive: File): Promise<File[]> {
  const { Archive } = await import('libarchive.js')
  Archive.init({ workerUrl: webworker })
  const archiveData = await Archive.open(archive)

  const entries: ArchiveEntry[] = await archiveData.getFilesArray()
  return Promise.all(
    entries
      .filter((entry) => entry.file.name.endsWith('.aoe2record'))
      .sort((a, b) => a.file.name.localeCompare(b.file.name))
      .map((entry) => entry.file.extract())
  )
}
