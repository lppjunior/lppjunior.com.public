import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Loads .env without overriding variables already set (e.g. by the deploy provider). */
export function loadDotEnv (rootDir) {
  const file = join(rootDir, '.env')
  if (existsSync(file)) process.loadEnvFile(file)
}

export function readBuildConfig ({ rootDir, env, argv }) {
  return {
    sourceDir: join(rootDir, 'public'),
    outputDir: join(rootDir, 'dist'),
    gtmId: env.VITE_GTM_ID,
    dev: argv.includes('--dev')
  }
}
