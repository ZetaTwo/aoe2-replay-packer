export function toBase26(value: number, width: number) {
  const res = []
  value = Math.floor(value)
  do {
    const digit = value % 26
    value = Math.floor(value / 26)
    res.push(String.fromCharCode(0x61 + digit))
  } while (value > 0)
  return res.reverse().join('').padStart(width, 'a')
}

export function logn(x: number, y: number) {
  return Math.log(x) / Math.log(y)
}

export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
}

export function readableSize(bytes: number) {
  const sizeInKb = bytes / 1024

  if (sizeInKb >= 1024) {
    return `${Math.round((sizeInKb / 1024) * 100) / 100} Mb`
  } else {
    return `${Math.round(sizeInKb)} Kb`
  }
}
