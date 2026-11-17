import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Repository housekeeping files are neither published nor listed.
const IGNORED = new Set(['.gitkeep', '.DS_Store', 'Thumbs.db', 'desktop.ini'])

export const isIgnored = path => path.split(/[\\/]/).some(part => IGNORED.has(part))

export function scanFiles (publicDir) {
  if (!existsSync(publicDir)) return []

  return readdirSync(publicDir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => {
      const absolute = join(entry.parentPath ?? entry.path, entry.name)
      return { path: relative(publicDir, absolute).split(sep).join('/'), size: statSync(absolute).size }
    })
    .filter(file => !isIgnored(file.path))
    .sort((a, b) => a.path.localeCompare(b.path, 'en'))
}

// Embedded in a <script> tag, so "<" must never close it early.
export const serializeFiles = files => JSON.stringify(files).replace(/</g, '\\u003c')

export function renderIndex (template, { files, css, js }) {
  const noscript = files.length
    ? files.map(file => `<li><a href="/${file.path.split('/').map(encodeURIComponent).join('/')}">${escapeHtml(file.path)}</a></li>`).join('')
    : '<li>No files yet.</li>'

  return template
    .replace('/*__STYLES__*/', () => css)
    .replace('/*__SCRIPT__*/', () => js)
    .replace('__FILES__', () => serializeFiles(files))
    .replace('<!--__NOSCRIPT__-->', () => noscript)
}

function escapeHtml (value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

export function build ({ publicDir = join(root, 'public'), outDir = join(root, 'dist'), srcDir = join(root, 'src') } = {}) {
  const files = scanFiles(publicDir)
  if (files.some(file => file.path === 'index.html')) {
    throw new Error('public/index.html would overwrite the generated listing. Rename or move it into a folder.')
  }

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  if (existsSync(publicDir)) {
    cpSync(publicDir, outDir, { recursive: true, filter: source => !IGNORED.has(basename(source)) })
  }

  const read = name => readFileSync(join(srcDir, name), 'utf8')
  writeFileSync(join(outDir, 'index.html'), renderIndex(read('index.html'), { files, css: read('styles.css'), js: read('app.js') }))

  return files
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = build()
  console.log(`Built dist/ with ${files.length} public file${files.length === 1 ? '' : 's'} and index.html.`)
}
