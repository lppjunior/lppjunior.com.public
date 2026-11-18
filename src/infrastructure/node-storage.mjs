import { copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'

const toPosix = path => path.split(sep).join('/')

/** Storage port implemented on the local file system. */
export const nodeStorage = {
  async listFiles (dir) {
    let entries
    try {
      entries = await readdir(dir, { recursive: true, withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }

    return Promise.all(entries
      .filter(entry => entry.isFile())
      .map(async entry => {
        const absolute = join(entry.parentPath ?? entry.path, entry.name)
        return { path: toPosix(relative(dir, absolute)), size: (await stat(absolute)).size }
      }))
  },

  async resetDirectory (dir) {
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
  },

  async copyFiles (fromDir, toDir, paths) {
    await Promise.all(paths.map(async path => {
      const target = join(toDir, path)
      await mkdir(dirname(target), { recursive: true })
      await copyFile(join(fromDir, path), target)
    }))
  },

  async writeFile (dir, path, content) {
    const target = join(dir, path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content)
  }
}
