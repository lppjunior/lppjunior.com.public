import test from 'node:test'
import assert from 'node:assert/strict'
import { createFolderIndex } from '../../src/client/folder-index.mjs'
import { buildListing, LISTING_STATUS } from '../../src/client/listing.mjs'

const files = [
  { path: 'docs/2026/report.pdf', size: 300 },
  { path: 'docs/guide 10.pdf', size: 20 },
  { path: 'docs/guide 2.pdf', size: 10 },
  { path: 'robots.txt', size: 5 }
]
const index = createFolderIndex(files)
const listingOf = (folder, query) => buildListing({ index, files, folder, query })

test('indexes folder totals and direct children', () => {
  assert.deepEqual([...index.get('').folders], ['docs'])
  assert.deepEqual(index.get('docs').files.map(file => file.path), ['docs/guide 10.pdf', 'docs/guide 2.pdf'])
  assert.equal(index.get('docs').size, 330)
  assert.equal(index.get('docs').fileCount, 3)
  assert.equal(index.get('').fileCount, 4)
})

test('lists folders first, then files in natural order, with a parent entry below the root', () => {
  const listing = listingOf('docs')
  assert.equal(listing.status, LISTING_STATUS.OK)
  assert.deepEqual(listing.entries.map(entry => [entry.type, entry.name ?? entry.path]), [
    ['parent', ''],
    ['folder', '2026'],
    ['file', 'guide 2.pdf'],
    ['file', 'guide 10.pdf']
  ])
  assert.deepEqual(listing.summary, { size: 330, fileCount: 3 })
  assert.equal(listingOf('').entries[0].type, 'folder')
})

test('searches files inside the current folder and shows where they are', () => {
  const listing = listingOf('docs', ' REPORT ')
  assert.deepEqual(listing.entries.map(entry => [entry.name, entry.location]), [['report.pdf', '/docs/2026']])
  assert.equal(listingOf('docs', 'robots').status, LISTING_STATUS.NO_MATCH)
})

test('reports unknown folders and an empty site', () => {
  assert.equal(listingOf('missing').status, LISTING_STATUS.NOT_FOUND)
  assert.equal(listingOf(null).status, LISTING_STATUS.NOT_FOUND)
  const empty = buildListing({ index: createFolderIndex([]), files: [], folder: '' })
  assert.equal(empty.status, LISTING_STATUS.EMPTY)
})
