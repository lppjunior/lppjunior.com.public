import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build, scanFiles, serializeFiles } from '../scripts/build.mjs'

function fixture (files) {
  const dir = mkdtempSync(join(tmpdir(), 'public-build-'))
  const publicDir = join(dir, 'public')
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(publicDir, path)), { recursive: true })
    writeFileSync(join(publicDir, path), content)
  }
  return { dir, publicDir, outDir: join(dir, 'dist') }
}

test('copies public to the dist root with the same structure and writes the listing', t => {
  const { dir, publicDir, outDir } = fixture({
    'robots.txt': 'User-agent: *',
    'docs/guide.pdf': 'pdf',
    'images/brand/logo.svg': '<svg/>',
    'images/.gitkeep': ''
  })
  t.after(() => rmSync(dir, { recursive: true, force: true }))

  const files = build({ publicDir, outDir, gtmId: 'GTM-TEST123' })

  assert.deepEqual(files.map(file => file.path), ['docs/guide.pdf', 'images/brand/logo.svg', 'robots.txt'])
  assert.equal(readFileSync(join(outDir, 'images/brand/logo.svg'), 'utf8'), '<svg/>')
  assert.equal(readFileSync(join(outDir, 'robots.txt'), 'utf8'), 'User-agent: *')
  assert.equal(existsSync(join(outDir, 'images/.gitkeep')), false)

  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  assert.match(html, /"path":"images\/brand\/logo.svg","size":6/)
  assert.match(html, /<a href="https:\/\/lppjunior.com\/">lppjunior.com<\/a> · public<\/footer>/)
  assert.match(html, /<a href="\/docs\/guide.pdf">docs\/guide.pdf<\/a>/)
  assert.doesNotMatch(html, /__FILES__|__STYLES__|__SCRIPT__|__NOSCRIPT__/)
})

test('refuses a public/index.html that would hide the listing', t => {
  const { dir, publicDir, outDir } = fixture({ 'index.html': '<p>hi</p>' })
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  assert.throws(() => build({ publicDir, outDir, gtmId: 'GTM-TEST123' }), /public\/index.html/)
})

test('builds an empty listing when public has no files', t => {
  const { dir, publicDir, outDir } = fixture({ '.gitkeep': '' })
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  assert.deepEqual(build({ publicDir, outDir, gtmId: 'GTM-TEST123' }), [])
  assert.ok(existsSync(join(outDir, 'index.html')))
  assert.deepEqual(scanFiles(join(dir, 'missing')), [])
})

test('file names cannot break out of the embedded data script', () => {
  assert.equal(serializeFiles([{ path: '</script>.txt', size: 1 }]).includes('</'), false)
})
