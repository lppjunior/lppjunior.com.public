import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { injectGtm } from '../../src/presentation/gtm-snippet.mjs'
import { escapeInlineScript, fillTemplate, serializeForScript } from '../../src/presentation/html.mjs'
import { createListingPageRenderer, renderFallbackList } from '../../src/presentation/listing-page.mjs'

const template = '<html><head><style>{{ styles }}</style></head><body><ul>{{ fallbackList }}</ul>' +
  '<script type="application/json">{{ filesJson }}</script><script>{{ script }}</script></body></html>'

test('fills every slot and fails on a missing value', () => {
  assert.equal(fillTemplate('<p>{{ a }}{{b}}</p>', { a: '1', b: '{{ a }}' }), '<p>1{{ a }}</p>')
  assert.throws(() => fillTemplate('{{ missing }}', {}), /Missing template value: missing/)
})

test('file names cannot break out of the page', () => {
  assert.equal(serializeForScript([{ path: '</script>.txt' }]).includes('</'), false)
  assert.equal(escapeInlineScript('a="</script>"'), 'a="<\\/script>"')
  assert.equal(renderFallbackList([{ path: '<b>&.txt' }]), '<li><a href="/%3Cb%3E%26.txt">&lt;b&gt;&amp;.txt</a></li>')
  assert.equal(renderFallbackList([]), '<li>No files yet.</li>')
})

test('renders the page with styles, data, script and GTM', async () => {
  const renderPage = createListingPageRenderer({
    template,
    bundleStyles: async () => 'body{}',
    bundleClient: async () => 'run()'
  })
  const html = await renderPage({ files: [{ path: 'a.txt', size: 1 }], gtmId: 'GTM-TEST123' })
  assert.match(html, /<style>body\{\}<\/style>/)
  assert.match(html, /\[\{"path":"a.txt","size":1\}\]/)
  assert.match(html, /<script>run\(\)<\/script>/)
  assert.match(html, /<head>\s*<script>\(function\(w,d,s,l,i\)/)
})

test('injects the same GTM snippet as the Vite projects', () => {
  const html = injectGtm('<head></head><body></body>', 'GTM-TEST123')
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'))
  assert.match(body, /^<body>\s*<noscript><iframe[^>]+googletagmanager\.com\/ns\.html\?id=GTM-TEST123/)

  let inserted
  const firstScript = { parentNode: { insertBefore: element => { inserted = element } } }
  const document = { getElementsByTagName: () => [firstScript], createElement: () => ({}) }
  const window = {}
  runInNewContext(head.match(/<script>([\s\S]*?)<\/script>/)[1], { document, window })
  assert.equal(inserted.src, 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123')
  assert.equal(inserted.async, true)
  assert.equal(window.dataLayer[0].event, 'gtm.js')
  assert.equal(injectGtm('<head>', null), '<head>')
})
