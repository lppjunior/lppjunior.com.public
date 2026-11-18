import { ROOT_FOLDER } from '../domain/public-path.mjs'

// Folders are addressed in the hash ("#/docs/2026/") so a single index.html serves every folder.

/** Folder path for a location hash, or null when the hash cannot be decoded. */
export function folderFromHash (hash) {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  try {
    return path.split('/').map(decodeURIComponent).join('/')
  } catch {
    return null
  }
}

export function hashOf (folder) {
  if (folder === ROOT_FOLDER) return '#/'
  return `#/${folder.split('/').map(encodeURIComponent).join('/')}/`
}

export function pageTitleOf (folder) {
  return folder === ROOT_FOLDER ? 'public · lppjunior.com' : `/${folder} · public · lppjunior.com`
}
