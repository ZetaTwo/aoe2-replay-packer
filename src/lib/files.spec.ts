import { describe, it, expect } from 'vitest'
import { filesFromEntries } from './files'

function fileEntry(name: string): FileSystemEntry {
  return {
    isFile: true,
    isDirectory: false,
    file: (resolve: (file: File) => void) => resolve(new File([name], name))
  } as unknown as FileSystemEntry
}

// Returns the children in batches of two, like browsers return large folders in batches
function folderEntry(...children: FileSystemEntry[]): FileSystemEntry {
  return {
    isFile: false,
    isDirectory: true,
    createReader: () => {
      const remaining = [...children]
      return {
        readEntries: (resolve: (entries: FileSystemEntry[]) => void) =>
          resolve(remaining.splice(0, 2))
      }
    }
  } as unknown as FileSystemEntry
}

const names = (files: File[]) => files.map((file) => file.name)

describe('filesFromEntries', () => {
  it('returns dropped files', async () => {
    expect(names(await filesFromEntries([fileEntry('a'), fileEntry('b')]))).toEqual(['a', 'b'])
  })

  it('returns the files in folders and subfolders', async () => {
    const entries = [
      fileEntry('a'),
      folderEntry(fileEntry('b'), folderEntry(fileEntry('c'), fileEntry('d')), fileEntry('e'))
    ]
    expect(names(await filesFromEntries(entries))).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('returns nothing for an empty folder', async () => {
    expect(await filesFromEntries([folderEntry()])).toEqual([])
  })
})
