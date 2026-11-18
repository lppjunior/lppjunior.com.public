// Guards the CSS architecture: every file is imported, sits in the layer of its folder,
// and every class the DOM uses has a rule.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const stylesDir = fileURLToPath(new URL('../../src/presentation/page/styles/', import.meta.url))
const read = path => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

const index = readFileSync(`${stylesDir}index.css`, 'utf8')
const styleFiles = readdirSync(stylesDir, { recursive: true })
  .map(path => path.split('\\').join('/'))
  .filter(path => path.endsWith('.css') && path !== 'index.css')
const allCss = styleFiles.map(path => readFileSync(`${stylesDir}${path}`, 'utf8')).join('\n')

test('declares the layer order once', () => {
  assert.match(index, /@layer settings, base, layout, components, utilities;/)
})

test('imports every stylesheet from index.css', () => {
  for (const path of styleFiles) assert.ok(index.includes(`@import './${path}';`), `${path} is not imported`)
})

test('wraps each stylesheet in the layer of its folder', () => {
  for (const path of styleFiles) {
    const layers = [...readFileSync(`${stylesDir}${path}`, 'utf8').matchAll(/@layer\s+([\w-]+)\s*\{/g)].map(match => match[1])
    assert.deepEqual(layers, [path.split('/')[0]], path)
  }
})

test('every class used by the template and the client has a CSS rule', () => {
  const template = read('../../src/presentation/page/template.html')
  const client = ['view.mjs', 'link-copier.mjs'].map(file => read(`../../src/client/${file}`)).join('\n')

  const used = new Set([
    ...[...template.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)),
    ...[...client.matchAll(/className: '([^']+)'/g)].flatMap(match => match[1].split(/\s+/)),
    ...[...client.matchAll(/'([a-z-]+(?:__|--)[a-z-]+)'/g)].map(match => match[1])
  ])

  for (const className of used) {
    assert.match(allCss, new RegExp(`\\.${className}(?![\\w-])`), `.${className} has no rule`)
  }
})
