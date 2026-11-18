import { compareNames, extensionOf, isInside, nameOf, parentOf, ROOT_FOLDER } from '../domain/public-path.mjs'

export const LISTING_STATUS = Object.freeze({
  OK: 'ok',
  EMPTY: 'empty',
  NO_MATCH: 'no-match',
  NOT_FOUND: 'not-found'
})

/**
 * What the page shows for a folder and search query, independent of the DOM.
 * Entries: { type: 'parent' | 'folder' | 'file', ... }.
 */
export function buildListing ({ index, files, folder, query = '' }) {
  if (folder === null || !index.has(folder)) {
    return { status: LISTING_STATUS.NOT_FOUND, folder: ROOT_FOLDER, entries: [], summary: null }
  }

  const term = query.trim().toLowerCase()
  const content = term ? searchEntries(files, folder, term) : folderEntries(index, folder)
  const { size, fileCount } = index.get(folder)

  return {
    status: content.length ? LISTING_STATUS.OK : term ? LISTING_STATUS.NO_MATCH : LISTING_STATUS.EMPTY,
    folder,
    entries: !term && folder !== ROOT_FOLDER ? [parentEntry(folder), ...content] : content,
    summary: { size, fileCount }
  }
}

function folderEntries (index, folder) {
  const current = index.get(folder)
  const folders = [...current.folders]
    .sort(compareNames)
    .map(path => folderEntry(index.get(path)))
  const files = current.files
    .map(file => fileEntry(file, { showLocation: false }))
    .sort((a, b) => compareNames(a.name, b.name))
  return [...folders, ...files]
}

function searchEntries (files, folder, term) {
  const prefixLength = folder === ROOT_FOLDER ? 0 : folder.length + 1
  return files
    .filter(file => isInside(file.path, folder) && file.path.slice(prefixLength).toLowerCase().includes(term))
    .map(file => fileEntry(file, { showLocation: true }))
}

const parentEntry = folder => ({ type: 'parent', path: parentOf(folder) })

const folderEntry = ({ path, size, fileCount }) => ({ type: 'folder', path, name: nameOf(path), size, fileCount })

const fileEntry = ({ path, size }, { showLocation }) => ({
  type: 'file',
  path,
  name: nameOf(path),
  size,
  extension: extensionOf(path),
  location: showLocation ? `/${parentOf(path)}` : null
})
