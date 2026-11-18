import { toUrlPath } from '../domain/public-path.mjs'
import { injectGtm } from './gtm-snippet.mjs'
import { escapeHtml, escapeInlineScript, fillTemplate, serializeForScript } from './html.mjs'

/** Plain list of links shown when JavaScript is disabled. */
export function renderFallbackList (files) {
  if (!files.length) return '<li>No files yet.</li>'
  return files
    .map(file => `<li><a href="${escapeHtml(toUrlPath(file.path))}">${escapeHtml(file.path)}</a></li>`)
    .join('')
}

/** renderPage port: builds the listing page from the template, bundled styles and bundled client script. */
export function createListingPageRenderer ({ template, bundleStyles, bundleClient }) {
  return async function renderPage ({ files, gtmId }) {
    const [styles, script] = await Promise.all([bundleStyles(), bundleClient()])
    const html = fillTemplate(template, {
      styles,
      fallbackList: renderFallbackList(files),
      filesJson: serializeForScript(files),
      script: escapeInlineScript(script)
    })
    return injectGtm(html, gtmId)
  }
}
