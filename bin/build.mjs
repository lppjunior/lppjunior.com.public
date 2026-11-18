// npm run build [-- --dev]: publishes public/ into dist/ with the listing page.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadDotEnv, readBuildConfig } from '../src/infrastructure/build-config.mjs'
import { createSitePublisher } from '../src/main/compose.mjs'

const rootDir = fileURLToPath(new URL('..', import.meta.url))

export async function runBuild (argv = process.argv.slice(2)) {
  loadDotEnv(rootDir)
  const config = readBuildConfig({ rootDir, env: process.env, argv })
  const publishSite = await createSitePublisher()
  const files = await publishSite(config)
  console.log(`Built dist/ with ${files.length} public file${files.length === 1 ? '' : 's'} and index.html.`)
  return config
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBuild().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
