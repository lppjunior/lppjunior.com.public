const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export const ICON_PATHS = Object.freeze({
  folder: 'M2 6.5A2.5 2.5 0 0 1 4.5 4h4.6l2.2 2.2h8.2A2.5 2.5 0 0 1 22 8.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5z',
  up: 'M12 5 5 12h4.5v7h5v-7H19z',
  copy: 'M9 9h10v11H9zM5 15V4h10'
})

/** Creates an element. Text always goes through textContent, so file names are never parsed as HTML. */
export function h (tag, { attributes = {}, ...properties } = {}, children = []) {
  const element = document.createElement(tag)
  Object.assign(element, properties)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  element.append(...[].concat(children).filter(child => child != null))
  return element
}

export function icon (name, className) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  if (className) svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NAMESPACE, 'path')
  path.setAttribute('d', ICON_PATHS[name])
  svg.append(path)
  return svg
}
