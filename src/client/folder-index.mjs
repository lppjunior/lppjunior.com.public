import { parentOf, ROOT_FOLDER } from '../domain/public-path.mjs'

/**
 * Folder tree derived from the flat file list: each folder knows its direct
 * subfolders and files, plus the total size and file count of its subtree.
 */
export function createFolderIndex (files) {
  const folders = new Map()
  const folderAt = path => {
    if (!folders.has(path)) folders.set(path, { path, folders: new Set(), files: [], size: 0, fileCount: 0 })
    return folders.get(path)
  }

  folderAt(ROOT_FOLDER)
  for (const file of files) {
    const parent = parentOf(file.path)
    folderAt(parent).files.push(file)
    addToAncestors(folderAt, parent, file.size)
  }

  return {
    has: path => folders.has(path),
    get: path => folders.get(path)
  }
}

function addToAncestors (folderAt, folderPath, size) {
  let child = null
  let current = folderPath
  while (true) {
    const folder = folderAt(current)
    folder.size += size
    folder.fileCount++
    if (child !== null) folder.folders.add(child)
    if (current === ROOT_FOLDER) return
    child = current
    current = parentOf(current)
  }
}
