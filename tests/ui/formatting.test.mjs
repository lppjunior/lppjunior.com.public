import test from 'node:test'
import assert from 'node:assert/strict'
import { badgeOf, kindOf, typeLabelOf } from '../../src/domain/file-type.mjs'
import { formatSize, plural } from '../../src/ui/format.mjs'
import { folderFromHash, hashOf, pageTitleOf } from '../../src/ui/route.mjs'

test('formats sizes with readable units', () => {
  assert.equal(formatSize(512), '512 B')
  assert.equal(formatSize(1536), '1.5 KB')
  assert.equal(formatSize(48213), '47 KB')
  assert.equal(formatSize(3100000), '3.0 MB')
  assert.equal(plural(1, 'file'), '1 file')
  assert.equal(plural(2, 'file'), '2 files')
})

test('describes file types', () => {
  assert.equal(kindOf('pdf'), 'doc')
  assert.equal(kindOf('webp'), 'image')
  assert.equal(kindOf('xyz'), 'other')
  assert.equal(badgeOf('webmanifest'), 'WEBM')
  assert.equal(badgeOf(''), 'FILE')
  assert.equal(typeLabelOf(''), 'File')
})

test('maps folders to hash routes and back', () => {
  for (const folder of ['', 'docs', 'TCC/notes with spaces']) {
    assert.equal(folderFromHash(hashOf(folder)), folder)
  }
  assert.equal(folderFromHash(''), '')
  assert.equal(folderFromHash('#/docs'), 'docs')
  assert.equal(folderFromHash('#/%E0%A4%A'), null)
  assert.equal(pageTitleOf('docs'), '/docs · public · lppjunior.com')
})
