import test from 'node:test'
import assert from 'node:assert/strict'
import { createPublishSite } from '../../src/application/publish-site.mjs'
import { GTM_DISABLED_WARNING } from '../../src/domain/gtm-id.mjs'

function createInMemoryStorage (sourceFiles) {
  const calls = []
  return {
    calls,
    output: new Map(),
    async listFiles () { return sourceFiles },
    async resetDirectory (dir) { calls.push(['reset', dir]) },
    async copyFiles (from, to, paths) { calls.push(['copy', from, to, paths]) },
    async writeFile (dir, path, content) { this.output.set(`${dir}/${path}`, content) }
  }
}

function setup (sourceFiles) {
  const storage = createInMemoryStorage(sourceFiles)
  const warnings = []
  const pages = []
  const publishSite = createPublishSite({
    storage,
    renderPage: async page => { pages.push(page); return '<html>listing</html>' },
    logger: { warn: message => warnings.push(message) }
  })
  return { publishSite, storage, warnings, pages }
}

const options = { sourceDir: 'public', outputDir: 'dist', gtmId: 'GTM-TEST123' }

test('publishes public files at the same paths and writes the listing page', async () => {
  const { publishSite, storage, pages } = setup([
    { path: 'robots.txt', size: 1 },
    { path: 'images/.gitkeep', size: 0 },
    { path: 'docs/guide.pdf', size: 2 }
  ])

  const files = await publishSite(options)

  assert.deepEqual(files.map(file => file.path), ['docs/guide.pdf', 'robots.txt'])
  assert.deepEqual(storage.calls, [
    ['reset', 'dist'],
    ['copy', 'public', 'dist', ['docs/guide.pdf', 'robots.txt']]
  ])
  assert.equal(storage.output.get('dist/index.html'), '<html>listing</html>')
  assert.deepEqual(pages, [{ files, gtmId: 'GTM-TEST123' }])
})

test('validates before touching the output folder', async () => {
  const { publishSite, storage } = setup([{ path: 'index.html', size: 1 }])
  await assert.rejects(publishSite(options), /public\/index.html/)
  await assert.rejects(publishSite({ ...options, gtmId: '' }), /VITE_GTM_ID é obrigatório/)
  assert.deepEqual(storage.calls, [])
})

test('warns and renders without GTM in development when the ID is absent', async () => {
  const { publishSite, warnings, pages } = setup([])
  await publishSite({ ...options, gtmId: undefined, dev: true })
  assert.deepEqual(warnings, [GTM_DISABLED_WARNING])
  assert.equal(pages[0].gtmId, null)
})
