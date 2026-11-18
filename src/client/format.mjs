const BYTES_PER_UNIT = 1024
const UNITS = ['KB', 'MB', 'GB', 'TB']

export function formatSize (bytes) {
  if (bytes < BYTES_PER_UNIT) return `${bytes} B`

  let value = bytes / BYTES_PER_UNIT
  let unit = 0
  while (value >= BYTES_PER_UNIT && unit < UNITS.length - 1) {
    value /= BYTES_PER_UNIT
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`
}

export function plural (count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** Human order: case-insensitive, with numbers compared by value ("2" before "10"). */
export function compareNames (a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}
