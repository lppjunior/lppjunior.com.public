import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { build } from '../scripts/build.mjs'

function buildWithId (gtmId, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'public-gtm-'))
  try {
    build({ publicDir: join(dir, 'public'), outDir: join(dir, 'dist'), gtmId, ...options })
    return readFileSync(join(dir, 'dist', 'index.html'), 'utf8')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('builds the GTM script and noscript fallback with the configured ID', () => {
  const html = buildWithId('GTM-TEST123')
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'))
  assert.match(head, /^<head>\s*<script>\(function\(w,d,s,l,i\)/)
  assert.match(head, /"GTM-TEST123"/)
  assert.match(body, /^<body>\s*<noscript><iframe[^>]+googletagmanager\.com\/ns\.html\?id=GTM-TEST123/)
  const script = head.match(/<script>([\s\S]*?)<\/script>/)[1]
  let inserted
  const firstScript = { parentNode: { insertBefore: element => { inserted = element } } }
  const document = { getElementsByTagName: () => [firstScript], createElement: () => ({}) }
  const window = {}
  runInNewContext(script, { document, window })
  assert.equal(inserted.src, 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123')
  assert.equal(inserted.async, true)
  assert.equal(window.dataLayer[0].event, 'gtm.js')
})

test('rejects builds when the ID is absent, empty or whitespace', () => {
  for (const id of [undefined, '', '   ']) {
    assert.throws(() => buildWithId(id), /VITE_GTM_ID é obrigatório para o build/)
  }
})

test('warns and omits GTM in development if the ID is absent', t => {
  const warnings = []
  t.mock.method(console, 'warn', message => warnings.push(message))
  const html = buildWithId('', { dev: true })
  assert.doesNotMatch(html, /googletagmanager/)
  assert.ok(warnings.some(message => message.includes('VITE_GTM_ID não configurado')))
})

test('rejects invalid IDs instead of injecting them into HTML', () => {
  assert.throws(() => buildWithId('GTM-INVALID"><script>'), /VITE_GTM_ID inválido/)
})
