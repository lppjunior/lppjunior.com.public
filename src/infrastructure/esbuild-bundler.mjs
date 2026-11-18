import { build } from 'esbuild'

/** Bundles an entry point (and everything it imports) into one in-memory string, to be inlined in the page. */
function createBundler (entryPoint, options = {}) {
  return async function bundle () {
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      charset: 'utf8',
      write: false,
      logLevel: 'silent',
      ...options
    })
    return result.outputFiles[0].text
  }
}

/** Browser script: client/main.mjs and its modules as a single IIFE. */
export const createClientBundler = entryPoint => createBundler(entryPoint, { format: 'iife', target: 'es2020' })

/** Stylesheet: styles/index.css with every @import resolved, layer order preserved. */
export const createStyleBundler = entryPoint => createBundler(entryPoint)
