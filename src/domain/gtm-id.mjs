// Google Tag Manager container ID rules, shared with the other lppjunior.com projects.

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

export const GTM_DISABLED_WARNING = 'VITE_GTM_ID não configurado; Google Tag Manager desativado.'

/**
 * Returns a valid ID, or null when GTM is optional and not configured.
 * @param {string | undefined} value
 * @param {{ required: boolean }} options
 */
export function parseGtmId (value, { required }) {
  const id = value?.trim() || null
  if (id && !GTM_ID_PATTERN.test(id)) throw new Error('VITE_GTM_ID inválido.')
  if (!id && required) throw new Error('VITE_GTM_ID é obrigatório para o build. Configure a variável antes de continuar.')
  return id
}
