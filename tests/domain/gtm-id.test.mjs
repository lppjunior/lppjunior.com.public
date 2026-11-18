import test from 'node:test'
import assert from 'node:assert/strict'
import { parseGtmId } from '../../src/domain/gtm-id.mjs'

test('accepts and trims a valid ID', () => {
  assert.equal(parseGtmId('  GTM-KMTQTFL ', { required: true }), 'GTM-KMTQTFL')
})

test('requires the ID when building for production', () => {
  for (const value of [undefined, '', '   ']) {
    assert.throws(() => parseGtmId(value, { required: true }), /VITE_GTM_ID é obrigatório para o build/)
  }
})

test('allows a missing ID in development', () => {
  assert.equal(parseGtmId('', { required: false }), null)
})

test('rejects invalid IDs even when optional', () => {
  assert.throws(() => parseGtmId('GTM-INVALID"><script>', { required: false }), /VITE_GTM_ID inválido/)
})
