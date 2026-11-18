// npm run dev: development build (GTM optional) served locally.
import { createStaticServer } from '../src/infrastructure/static-server.mjs'
import { runBuild } from './build.mjs'

const port = Number(process.env.PORT) || 9010

try {
  const { outputDir } = await runBuild(['--dev'])
  createStaticServer(outputDir)
    .on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to use another one.` : error.message)
      process.exitCode = 1
    })
    .listen(port, () => console.log(`Preview: http://localhost:${port}/`))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
