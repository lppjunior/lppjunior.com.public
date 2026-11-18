const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => HTML_ESCAPES[char])
}

/** JSON safe to embed in a <script> element: "<" can never close it early. */
export function serializeForScript (value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** JavaScript safe to inline in a <script> element. */
export function escapeInlineScript (code) {
  return code.replace(/<\/(script)/gi, '<\\/$1')
}

/** Replaces every {{ name }} slot; fails on a slot without a value so templates and code stay in sync. */
export function fillTemplate (template, values) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    if (!Object.hasOwn(values, name)) throw new Error(`Missing template value: ${name}`)
    return values[name]
  })
}
