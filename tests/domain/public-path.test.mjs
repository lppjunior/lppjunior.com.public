import test from 'node:test'
import assert from 'node:assert/strict'
import { compareNames, extensionOf, isIgnored, isInside, nameOf, parentOf, toUrlPath, visibleFiles } from '../../src/domain/public-path.mjs'

test('splits paths into name, parent folder and extension', () => {
  assert.equal(nameOf('docs/2026/Guide.PDF'), 'Guide.PDF')
  assert.equal(parentOf('docs/2026/Guide.PDF'), 'docs/2026')
  assert.equal(parentOf('robots.txt'), '')
  assert.equal(extensionOf('docs/2026/Guide.PDF'), 'pdf')
  assert.equal(extensionOf('.htaccess'), '')
  assert.equal(extensionOf('LICENSE'), '')
})

test('checks whether a path is inside a folder', () => {
  assert.equal(isInside('docs/a.pdf', ''), true)
  assert.equal(isInside('docs/a.pdf', 'docs'), true)
  assert.equal(isInside('docs-old/a.pdf', 'docs'), false)
})

test('ignores repository housekeeping files at any depth', () => {
  assert.equal(isIgnored('.gitkeep'), true)
  assert.equal(isIgnored('images/.DS_Store'), true)
  assert.equal(isIgnored('.well-known/security.txt'), false)
})

test('builds the public URL with each segment encoded', () => {
  assert.equal(toUrlPath('TCC/notes with spaces#1.pdf'), '/TCC/notes%20with%20spaces%231.pdf')
})

test('lists visible files sorted by path', () => {
  const files = [{ path: 'robots.txt' }, { path: 'docs/.DS_Store' }, { path: 'docs/a.pdf' }]
  assert.deepEqual(visibleFiles(files).map(file => file.path), ['docs/a.pdf', 'robots.txt'])
})

test('orders names naturally, ignoring case', () => {
  assert.deepEqual(['guide 10', 'Guide 2', 'alpha'].sort(compareNames), ['alpha', 'Guide 2', 'guide 10'])
})
