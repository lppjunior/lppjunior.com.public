// Entry point: wires the file list, the listing logic and the UI, and keeps them in sync with the URL and search.
import publicFiles from 'virtual:public-files'
import { createFolderIndex } from './application/folder-index.mjs'
import { buildListing } from './application/listing.mjs'
import { visibleFiles } from './domain/public-path.mjs'
import { createLinkCopier } from './ui/link-copier.mjs'
import { folderFromHash, pageTitleOf } from './ui/route.mjs'
import { renderListing } from './ui/view.mjs'
import './ui/styles/index.css'

const byId = id => document.getElementById(id)

const files = visibleFiles(publicFiles)
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
