// Vite plugin: exposes the files of publicDir to the app as `import files from 'virtual:public-files'`.
// Vite itself copies publicDir to the output root; this plugin only describes what is there.
import { readdir, stat } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

const VIRTUAL_ID = 'virtual:public-files'
const RESOLVED_ID = `\0${VIRTUAL_ID}`
const RESERVED_PATH = 'index.html'

/** Every file under dir as { path, size }, with "/"-separated relative paths. */
export async function listFiles (dir) {
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
      return { path: relative(dir, absolute).split(sep).join('/'), size: (await stat(absolute)).size }
    }))
}

export default function publicFiles () {
  let publicDir = ''

  return {
    name: 'public-files',

    configResolved (config) {
      publicDir = config.publicDir ? resolve(config.publicDir) : ''
    },

    resolveId (id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    async load (id) {
      if (id !== RESOLVED_ID) return
      const files = publicDir ? await listFiles(publicDir) : []
      if (files.some(file => file.path === RESERVED_PATH)) {
        this.error(`public/${RESERVED_PATH} would overwrite the generated listing. Rename or move it into a folder.`)
      }
      return `export default ${JSON.stringify(files)}`
    },

    // In development, adding, removing or changing a public file refreshes the listing.
    configureServer (server) {
      const refresh = file => {
        if (!publicDir || !resolve(file).startsWith(publicDir + sep)) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      for (const event of ['add', 'unlink', 'change']) server.watcher.on(event, refresh)
    }
  }
}
