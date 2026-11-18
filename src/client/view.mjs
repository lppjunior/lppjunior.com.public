import { toUrlPath } from '../domain/public-path.mjs'
import { h, icon } from './dom.mjs'
import { badgeOf, kindOf, typeLabelOf } from './file-type.mjs'
import { formatSize, plural } from './format.mjs'
import { LISTING_STATUS } from './listing.mjs'
import { hashOf } from './route.mjs'

// Class names follow the BEM blocks in presentation/page/styles/components/.

/** Renders a listing (see listing.mjs) into the page elements. */
export function renderListing (elements, listing, { query, onCopyLink }) {
  renderBreadcrumb(elements.breadcrumb, listing.folder)
  renderSummary(elements.summary, listing.summary)
  elements.rows.replaceChildren(...listing.entries.map(entry => ENTRY_RENDERERS[entry.type](entry, onCopyLink)))
  renderMessage(elements.message, listing.status, query)
}

function renderBreadcrumb (nav, folder) {
  const parts = folder ? folder.split('/') : []
  const crumbs = [{ label: 'public', path: '' }, ...parts.map((label, index) => ({ label, path: parts.slice(0, index + 1).join('/') }))]

  nav.replaceChildren(...crumbs.flatMap(({ label, path }, index) => {
    const isCurrent = index === crumbs.length - 1
    const crumb = isCurrent
      ? h('span', { className: 'breadcrumb__current', textContent: label, attributes: { 'aria-current': 'page' } })
      : h('a', { className: 'breadcrumb__link', href: hashOf(path), textContent: label })
    return index === 0 ? [crumb] : [h('span', { className: 'breadcrumb__separator', textContent: '/' }), crumb]
  }))
}

function renderSummary (element, summary) {
  const value = text => h('strong', { className: 'site-header__summary-value', textContent: text })
  element.replaceChildren(...(summary
    ? [value(summary.fileCount), ` ${summary.fileCount === 1 ? 'file' : 'files'} · `, value(formatSize(summary.size))]
    : []))
}

const MESSAGES = {
  [LISTING_STATUS.EMPTY]: () => 'No files yet.',
  [LISTING_STATUS.NO_MATCH]: query => `No files match “${query.trim()}”.`,
  [LISTING_STATUS.NOT_FOUND]: () => ['This folder does not exist. ', h('a', { href: hashOf(''), textContent: 'Back to public' })]
}

function renderMessage (element, status, query) {
  const message = MESSAGES[status]
  element.hidden = !message
  element.replaceChildren(...(message ? [].concat(message(query)) : []))
}

const ENTRY_RENDERERS = {
  parent: entry => entryRow({
    href: hashOf(entry.path),
    badge: fileIcon('parent', icon('up', 'file-icon__svg')),
    label: '..'
  }),
  folder: entry => entryRow({
    href: hashOf(entry.path),
    badge: fileIcon('folder', icon('folder', 'file-icon__svg')),
    label: entry.name,
    detail: plural(entry.fileCount, 'file'),
    type: 'Folder',
    size: formatSize(entry.size)
  }),
  file: (entry, onCopyLink) => entryRow({
    href: toUrlPath(entry.path),
    badge: fileIcon(kindOf(entry.extension), badgeOf(entry.extension)),
    label: entry.name,
    detail: entry.location,
    type: typeLabelOf(entry.extension),
    size: formatSize(entry.size),
    action: copyButton(entry, onCopyLink)
  })
}

function fileIcon (kind, content) {
  return h('span', { className: `file-icon file-icon--${kind}` }, content)
}

function entryRow ({ href, badge, label, detail = null, type = '', size = '', action = null }) {
  const cell = (className, children) => h('span', { className, attributes: { role: 'cell' } }, children)
  const name = h('span', { className: 'entry__label', textContent: label },
    detail ? h('small', { className: 'entry__detail', textContent: detail }) : null)

  return h('div', { className: 'entry', attributes: { role: 'row' } }, [
    cell('entry__name', h('a', { className: 'entry__link', href }, [badge, name])),
    cell('entry__type', type),
    cell('entry__size', size),
    cell('entry__actions', action)
  ])
}

function copyButton (entry, onCopyLink) {
  const button = h('button', {
    className: 'copy-button',
    type: 'button',
    title: 'Copy link',
    attributes: { 'aria-label': `Copy link to ${entry.name}` }
  }, icon('copy', 'copy-button__svg'))
  button.addEventListener('click', () => onCopyLink(toUrlPath(entry.path)))
  return button
}
