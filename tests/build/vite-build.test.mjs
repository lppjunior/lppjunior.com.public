// Runs the real Vite build: public/ copied to the output root, file list bundled, CSS inlined, GTM injected.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { build, resolveConfig } from 'vite'
import { listFiles } from '../../vite-plugins/public-files.mjs'

const configFile = fileURLToPath(new URL('../../vite.config.mjs', import.meta.url))

function fixture (t, files) {
  const dir = mkdtempSync(join(tmpdir(), 'public-site-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const publicDir = join(dir, 'public')
  mkdirSync(publicDir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(publicDir, path)), { recursive: true })
    writeFileSync(join(publicDir, path), content)
  }
  return { publicDir, outDir: join(dir, 'dist') }
}

async function withGtmId (id, run) {
  const previous = process.env.VITE_GTM_ID
  process.env.VITE_GTM_ID = id
  try {
    return await run()
  } finally {
    if (previous === undefined) delete process.env.VITE_GTM_ID
    else process.env.VITE_GTM_ID = previous
  }
}

const buildSite = ({ publicDir, outDir }, id = 'GTM-TEST123') => withGtmId(id, () => build({
  configFile,
  logLevel: 'silent',
  publicDir,
  build: { outDir, emptyOutDir: true }
}))

test('lists every file of a folder with posix paths and sizes', async t => {
  const { publicDir } = fixture(t, { 'a.txt': 'abc', 'docs/2026/b.pdf': '12345' })
  const files = await listFiles(publicDir)
  assert.deepEqual(files.sort((a, b) => a.path.localeCompare(b.path)), [
    { path: 'a.txt', size: 3 },
    { path: 'docs/2026/b.pdf', size: 5 }
  ])
  assert.deepEqual(await listFiles(join(publicDir, 'missing')), [])
})

test('copies public/ to the output root and bundles the file list', async t => {
  const dirs = fixture(t, { 'robots.txt': 'User-agent: *', 'images/brand/logo.svg': '<svg/>' })
  await buildSite(dirs)

  assert.equal(readFileSync(join(dirs.outDir, 'images/brand/logo.svg'), 'utf8'), '<svg/>')
  assert.equal(readFileSync(join(dirs.outDir, 'robots.txt'), 'utf8'), 'User-agent: *')

  const html = readFileSync(join(dirs.outDir, 'index.html'), 'utf8')
  assert.doesNotMatch(html, /<link[^>]+href="\/assets\/[^"]+\.css"/, 'CSS is inlined')
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1]
  const layerOrder = [...new Set([...css.matchAll(/@layer ([\w-]+)[{,;]/g)].map(match => match[1]))]
  assert.deepEqual(layerOrder, ['settings', 'base', 'layout', 'components', 'utilities'])
  assert.match(html, /<a href="https:\/\/lppjunior.com\/">lppjunior.com<\/a> · public<\/footer>/)

  const scripts = readdirSync(join(dirs.outDir, 'assets')).filter(file => file.endsWith('.js'))
  const bundle = scripts.map(file => readFileSync(join(dirs.outDir, 'assets', file), 'utf8')).join('\n')
  assert.match(bundle, /images\/brand\/logo\.svg/)
  assert.match(bundle, /robots\.txt/)
})

test('refuses a public/index.html that would replace the listing', async t => {
  const dirs = fixture(t, { 'index.html': '<p>hi</p>' })
  await assert.rejects(buildSite(dirs), /public\/index.html would overwrite the generated listing/)
  assert.equal(existsSync(join(dirs.outDir, 'index.html')), false)
})

test('builds the GTM script and noscript fallback with the configured ID', async t => {
  const dirs = fixture(t, {})
  await buildSite(dirs)
  const html = readFileSync(join(dirs.outDir, 'index.html'), 'utf8')
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'))
  assert.match(head, /"GTM-TEST123"/)
  assert.match(body, /<noscript>\s*<iframe[^>]+googletagmanager\.com\/ns\.html\?id=GTM-TEST123/)

  let inserted
  const firstScript = { parentNode: { insertBefore: element => { inserted = element } } }
  const document = { getElementsByTagName: () => [firstScript], createElement: () => ({}) }
  const window = {}
  runInNewContext(head.match(/<script>([\s\S]*?)<\/script>/)[1], { document, window })
  assert.equal(inserted.src, 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123')
  assert.equal(inserted.async, true)
  assert.equal(window.dataLayer[0].event, 'gtm.js')
})

test('rejects builds when the ID is empty or whitespace', async t => {
  const dirs = fixture(t, {})
  for (const id of ['', '   ']) {
    await assert.rejects(buildSite(dirs, id), /VITE_GTM_ID é obrigatório para o build/)
  }
})

test('rejects invalid IDs instead of injecting them into HTML', async t => {
  await assert.rejects(buildSite(fixture(t, {}), 'GTM-INVALID"><script>'), /VITE_GTM_ID inválido/)
})

test('warns and omits GTM in development if the ID is absent', async t => {
  const warnings = []
  t.mock.method(console, 'warn', message => warnings.push(message))
  await withGtmId('', async () => {
    const config = await resolveConfig({ configFile, logLevel: 'silent' }, 'serve')
    const plugin = config.plugins.find(plugin => plugin.name === 'google-tag-manager')
    assert.deepEqual(plugin.transformIndexHtml(), [])
  })
  assert.ok(warnings.some(message => message.includes('VITE_GTM_ID não configurado')))
})
