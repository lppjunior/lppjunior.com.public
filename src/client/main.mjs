// Browser entry point: reads the embedded file list and keeps the listing in sync with the URL and search.
import { createFolderIndex } from './folder-index.mjs'
import { createLinkCopier } from './link-copier.mjs'
import { buildListing } from './listing.mjs'
import { folderFromHash, pageTitleOf } from './route.mjs'
import { renderListing } from './view.mjs'

const byId = id => document.getElementById(id)

const files = JSON.parse(byId('files-data').textContent)
const index = createFolderIndex(files)
const elements = {
  breadcrumb: byId('breadcrumb'),
  summary: byId('summary'),
  rows: byId('rows'),
  message: byId('message'),
  search: byId('search')
}
const copyLink = createLinkCopier({ toast: byId('toast'), origin: window.location.origin, clipboard: navigator.clipboard })

function render () {
  const query = elements.search.value
  const listing = buildListing({ index, files, folder: folderFromHash(window.location.hash), query })
  renderListing(elements, listing, { query, onCopyLink: copyLink })
  document.title = pageTitleOf(listing.folder)
}

function clearSearch () {
  elements.search.value = ''
  render()
}

function onKeyDown (event) {
  const searchFocused = document.activeElement === elements.search
  if (event.key === '/' && !searchFocused && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    elements.search.focus()
  } else if (event.key === 'Escape' && searchFocused) {
    clearSearch()
  }
}

window.addEventListener('hashchange', clearSearch)
elements.search.addEventListener('input', render)
document.addEventListener('keydown', onKeyDown)
render()
