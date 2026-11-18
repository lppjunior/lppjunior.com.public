import { GTM_DISABLED_WARNING, parseGtmId } from '../domain/gtm-id.mjs'
import { assertPublishable, byPath, isIgnored } from '../domain/public-path.mjs'

export const LISTING_PAGE = 'index.html'

/**
 * Use case: publish every public file at the same path and add the listing page.
 *
 * Ports:
 * - storage.listFiles(dir) -> [{ path, size }]
 * - storage.resetDirectory(dir)
 * - storage.copyFiles(fromDir, toDir, paths)
 * - storage.writeFile(dir, path, content)
 * - renderPage({ files, gtmId }) -> html
 * - logger.warn(message)
 */
export function createPublishSite ({ storage, renderPage, logger }) {
  return async function publishSite ({ sourceDir, outputDir, gtmId, dev = false }) {
    const validGtmId = parseGtmId(gtmId, { required: !dev })
    if (!validGtmId) logger.warn(GTM_DISABLED_WARNING)

    const files = (await storage.listFiles(sourceDir))
      .filter(file => !isIgnored(file.path))
      .sort(byPath)
    assertPublishable(files)

    await storage.resetDirectory(outputDir)
    await storage.copyFiles(sourceDir, outputDir, files.map(file => file.path))
    await storage.writeFile(outputDir, LISTING_PAGE, await renderPage({ files, gtmId: validGtmId }))

    return files
  }
}
