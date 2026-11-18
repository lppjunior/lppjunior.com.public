// Rules about the files published from public/. Paths are always relative and "/"-separated.

const SEPARATOR = '/'

/** Repository housekeeping files: never published nor listed. */
export const IGNORED_NAMES = Object.freeze(['.gitkeep', '.DS_Store', 'Thumbs.db', 'desktop.ini'])

/** Output paths owned by the generated site. */
export const RESERVED_PATHS = Object.freeze(['index.html'])

export const ROOT_FOLDER = ''

export function nameOf (path) {
  return path.slice(path.lastIndexOf(SEPARATOR) + 1)
}

export function parentOf (path) {
  const index = path.lastIndexOf(SEPARATOR)
  return index === -1 ? ROOT_FOLDER : path.slice(0, index)
}

export function extensionOf (path) {
  const name = nameOf(path)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function isInside (path, folder) {
  return folder === ROOT_FOLDER || path.startsWith(folder + SEPARATOR)
}

export function isIgnored (path) {
  return path.split(SEPARATOR).some(part => IGNORED_NAMES.includes(part))
}

/** URL where a public file is served: the same path, percent-encoded per segment. */
export function toUrlPath (path) {
  return SEPARATOR + path.split(SEPARATOR).map(encodeURIComponent).join(SEPARATOR)
}

export function assertPublishable (files) {
  const conflict = files.find(file => RESERVED_PATHS.includes(file.path))
  if (conflict) {
    throw new Error(`public/${conflict.path} would overwrite the generated listing. Rename or move it into a folder.`)
  }
}

export function byPath (a, b) {
  return a.path.localeCompare(b.path, 'en')
}
