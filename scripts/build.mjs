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

// Same rules as the Vite projects: the ID is required to build and optional in development (GTM is then omitted).
export function resolveGtmId (value, { dev = false } = {}) {
  const gtmId = value?.trim()
  if (gtmId && !/^GTM-[A-Z0-9]+$/.test(gtmId)) throw new Error('VITE_GTM_ID inválido.')
  if (!gtmId && !dev) throw new Error('VITE_GTM_ID é obrigatório para o build. Configure a variável antes de continuar.')
  if (!gtmId) console.warn('VITE_GTM_ID não configurado; Google Tag Manager desativado.')
  return gtmId || null
}

export function injectGtm (html, gtmId) {
  if (!gtmId) return html
  const script = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});</script>`
  const noscript = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`

  return html
    .replace(/<head>/, match => `${match}\n    ${script}`)
    .replace(/<body>/, match => `${match}\n    ${noscript}`)
}

export function build ({
  publicDir = join(root, 'public'),
  outDir = join(root, 'dist'),
  srcDir = join(root, 'src'),
  gtmId = process.env.VITE_GTM_ID,
  dev = false
} = {}) {
  const validGtmId = resolveGtmId(gtmId, { dev })
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
  const html = renderIndex(read('index.html'), { files, css: read('styles.css'), js: read('app.js') })
  writeFileSync(join(outDir, 'index.html'), injectGtm(html, validGtmId))

  return files
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Variables already set in the environment (e.g. on the deploy provider) take precedence over .env.
  if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'))
  const files = build({ dev: process.argv.includes('--dev') })
  console.log(`Built dist/ with ${files.length} public file${files.length === 1 ? '' : 's'} and index.html.`)
}
