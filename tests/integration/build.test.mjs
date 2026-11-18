import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createSitePublisher } from '../../src/main/compose.mjs'

function fixture (t, files) {
  const dir = mkdtempSync(join(tmpdir(), 'public-site-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const sourceDir = join(dir, 'public')
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(sourceDir, path)), { recursive: true })
    writeFileSync(join(sourceDir, path), content)
  }
  return { sourceDir, outputDir: join(dir, 'dist') }
}

test('builds dist/ from public/ with the real adapters and bundled client', async t => {
  const dirs = fixture(t, {
    'robots.txt': 'User-agent: *',
    'images/brand/logo.svg': '<svg/>',
    'images/.gitkeep': ''
  })
  const publishSite = await createSitePublisher()

  const files = await publishSite({ ...dirs, gtmId: 'GTM-TEST123' })

  assert.deepEqual(files.map(file => file.path), ['images/brand/logo.svg', 'robots.txt'])
  assert.equal(readFileSync(join(dirs.outputDir, 'images/brand/logo.svg'), 'utf8'), '<svg/>')
  assert.equal(existsSync(join(dirs.outputDir, 'images/.gitkeep')), false)

  const html = readFileSync(join(dirs.outputDir, 'index.html'), 'utf8')
  assert.match(html, /"path":"images\/brand\/logo.svg","size":6/)
  assert.match(html, /<a href="https:\/\/lppjunior.com\/">lppjunior.com<\/a> · public<\/footer>/)
  assert.match(html, /googletagmanager\.com\/ns\.html\?id=GTM-TEST123/)
  assert.match(html, /files-data/)
  assert.doesNotMatch(html, /\{\{\s*\w+\s*\}\}/)
  assert.doesNotMatch(html, /\bimport\s*[{"']/, 'client script must be bundled')
})

test('builds an empty site when public/ does not exist', async t => {
  const dirs = fixture(t, {})
  const publishSite = await createSitePublisher({ logger: { warn () {} } })
  assert.deepEqual(await publishSite({ ...dirs, dev: true }), [])
  assert.ok(existsSync(join(dirs.outputDir, 'index.html')))
})
