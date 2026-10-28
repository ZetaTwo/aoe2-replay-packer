// All files in the dropped entries, including those in (nested) folders
export async function filesFromEntries(entries: FileSystemEntry[]): Promise<File[]> {
  const files = await Promise.all(entries.map(readEntry))
  return files.flat()
}

async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject)
    )
    return [file]
  }
  if (entry.isDirectory) {
    const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader())
    return filesFromEntries(children)
  }
  return []
}

// readEntries returns the folder contents in batches, ending with an empty one
async function readAllEntries(reader: FileSystemDirectoryReader) {
  const entries: FileSystemEntry[] = []
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject)
    )
    if (batch.length == 0) {
      return entries
    }
    entries.push(...batch)
  }
}
