import { commonPrefix } from '@/lib/strings'
import { padBlob } from '@/lib/zip'

const RECORD_EXTENSION = '.aoe2record'
const TARGET_SIZE = Math.round(1024 * 1024 * 9.75)

export function paddedRecordName(name: string) {
  const baseName = name.endsWith(RECORD_EXTENSION)
    ? name.substring(0, name.length - RECORD_EXTENSION.length)
    : name
  return `${baseName}_padded${RECORD_EXTENSION}`
}

export function paddedSize(recordings: Blob[]) {
  if (recordings.length == 0) {
    return 0
  }
  return Math.max(...recordings.map((recording) => recording.size), TARGET_SIZE)
}

export function padRecording(recording: Blob, targetSize: number) {
  if (recording.size > targetSize) {
    return recording
  }
  return padBlob(recording, targetSize - recording.size, 'AOE2_PAD')
}

// Packer file names are <match>_G<n>.aoe2record, so the common prefix ends in "_G"
export function spoilerZipName(names: string[]) {
  let zipName = commonPrefix(names) || 'padded-recordings'
  if (zipName.endsWith('_G')) {
    zipName = zipName.substring(0, zipName.length - 2)
  }
  return `${zipName}.zip`
}
