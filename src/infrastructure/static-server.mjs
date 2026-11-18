import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
}

/** Minimal static file server used to preview the output locally. */
export function createStaticServer (rootDir) {
  const root = resolve(rootDir)

  return createServer(async (request, response) => {
    try {
      let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      if (path.endsWith('/')) path += 'index.html'
      const file = join(root, normalize(path))
      if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found')

      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' })
      createReadStream(file).pipe(response)
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
    }
  })
}
