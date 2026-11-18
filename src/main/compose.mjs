// Composition root: the only place that wires concrete adapters into the use case.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createPublishSite } from '../application/publish-site.mjs'
import { createClientBundler, createStyleBundler } from '../infrastructure/esbuild-bundler.mjs'
import { nodeStorage } from '../infrastructure/node-storage.mjs'
import { createListingPageRenderer } from '../presentation/listing-page.mjs'

const fromHere = path => fileURLToPath(new URL(path, import.meta.url))

export async function createSitePublisher ({ logger = console } = {}) {
  const renderPage = createListingPageRenderer({
    template: await readFile(fromHere('../presentation/page/template.html'), 'utf8'),
    bundleStyles: createStyleBundler(fromHere('../presentation/page/styles/index.css')),
    bundleClient: createClientBundler(fromHere('../client/main.mjs'))
  })

  return createPublishSite({ storage: nodeStorage, renderPage, logger })
}
