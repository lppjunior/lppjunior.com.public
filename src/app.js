(() => {
  const files = JSON.parse(document.getElementById('files-data').textContent)
  const $ = id => document.getElementById(id)
  const rowsEl = $('rows')
  const emptyEl = $('empty')
  const searchEl = $('search')
  const toastEl = $('toast')
  const SVG = 'http://www.w3.org/2000/svg'

  const KINDS = {
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'],
    code: ['js', 'mjs', 'cjs', 'ts', 'json', 'css', 'html', 'htm', 'xml', 'yml', 'yaml', 'sh', 'py', 'webmanifest'],
    text: ['txt', 'md', 'csv', 'log'],
    doc: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt'],
    archive: ['zip', 'gz', 'tgz', 'rar', '7z', 'tar'],
    media: ['mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov'],
    font: ['woff', 'woff2', 'ttf', 'otf']
  }

  // Index every folder of the flat file list: folder path -> direct subfolders, direct files, total size and file count.
  const folders = new Map()
  const folder = path => {
    if (!folders.has(path)) folders.set(path, { dirs: new Set(), files: [], size: 0, count: 0 })
    return folders.get(path)
  }
  folder('')
  for (const file of files) {
    const parts = file.path.split('/')
    let current = ''
    folder('').size += file.size
    folder('').count++
    for (const part of parts.slice(0, -1)) {
      const next = current ? `${current}/${part}` : part
      folder(current).dirs.add(next)
      folder(next).size += file.size
      folder(next).count++
      current = next
    }
    folder(current).files.push(file)
  }

  const nameOf = path => path.slice(path.lastIndexOf('/') + 1)
  const extOf = path => {
    const name = nameOf(path)
    const dot = name.lastIndexOf('.')
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
  }
  const kindOf = ext => Object.keys(KINDS).find(kind => KINDS[kind].includes(ext)) || 'other'
  const fileHref = path => '/' + path.split('/').map(encodeURIComponent).join('/')
  const folderHref = path => '#/' + (path ? path.split('/').map(encodeURIComponent).join('/') + '/' : '')
  const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`
    const units = ['KB', 'MB', 'GB']
    let value = bytes / 1024
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024
      unit++
    }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
  }
  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

  function currentFolder () {
    let path = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '')
    try {
      path = path.split('/').map(decodeURIComponent).join('/')
    } catch {
      return null
    }
    return folders.has(path) ? path : null
  }

  function el (tag, props = {}, children = []) {
    const node = document.createElement(tag)
    Object.assign(node, props)
    for (const child of [].concat(children)) if (child != null) node.append(child)
    return node
  }

  function svgIcon (d) {
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('aria-hidden', 'true')
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    svg.append(path)
    return svg
  }

  const FOLDER_PATH = 'M2 6.5A2.5 2.5 0 0 1 4.5 4h4.6l2.2 2.2h8.2A2.5 2.5 0 0 1 22 8.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5z'
  const UP_PATH = 'M12 5 5 12h4.5v7h5v-7H19z'
  const COPY_PATH = 'M9 9h10v11H9zM5 15V4h10'

  function row ({ href, icon, label, sub, type, size, copy }) {
    const labelEl = el('span', { className: 'label', textContent: label }, sub ? el('small', { textContent: sub }) : null)
    const link = el('a', { className: 'name', href }, [icon, labelEl])
    const actions = el('span', { role: 'cell' })
    if (copy) {
      const button = el('button', { className: 'copy', type: 'button', title: 'Copy link' }, svgIcon(COPY_PATH))
      button.setAttribute('aria-label', `Copy link to ${label}`)
      button.addEventListener('click', () => copyLink(href))
      actions.append(button)
    }
    const cell = el('span', { role: 'cell' }, link)
    const result = el('div', { className: 'row' }, [
      cell,
      el('span', { className: 'col-type', textContent: type, role: 'cell' }),
      el('span', { className: 'col-size', textContent: size, role: 'cell' }),
      actions
    ])
    result.setAttribute('role', 'row')
    return result
  }

  function folderRow (path) {
    const info = folders.get(path)
    return row({
      href: folderHref(path),
      icon: el('span', { className: 'icon dir' }, svgIcon(FOLDER_PATH)),
      label: nameOf(path),
      sub: plural(info.count, 'file'),
      type: 'Folder',
      size: formatSize(info.size)
    })
  }

  function fileRow (file, showFolder) {
    const ext = extOf(file.path)
    const badge = (ext || 'file').slice(0, 4).toUpperCase()
    const parent = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''
    return row({
      href: fileHref(file.path),
      icon: el('span', { className: `icon ${kindOf(ext)}`, textContent: badge }),
      label: nameOf(file.path),
      sub: showFolder ? `/${parent}` : null,
      type: ext ? ext.toUpperCase() : 'File',
      size: formatSize(file.size),
      copy: true
    })
  }

  function renderBreadcrumb (path) {
    const nav = $('breadcrumb')
    const parts = path ? path.split('/') : []
    const crumbs = [['public', '']].concat(parts.map((part, index) => [part, parts.slice(0, index + 1).join('/')]))
    nav.replaceChildren(...crumbs.flatMap(([label, target], index) => {
      const last = index === crumbs.length - 1
      const node = last
        ? el('span', { textContent: label })
        : el('a', { href: folderHref(target), textContent: label })
      if (last) node.setAttribute('aria-current', 'page')
      return index ? [el('span', { className: 'sep', textContent: '/' }), node] : [node]
    }))
  }

  function render () {
    const path = currentFolder()
    const query = searchEl.value.trim().toLowerCase()
    emptyEl.hidden = true

    if (path === null) {
      renderBreadcrumb('')
      rowsEl.replaceChildren()
      emptyEl.replaceChildren('This folder does not exist. ', el('a', { href: '#/', textContent: 'Back to public' }))
      emptyEl.hidden = false
      return
    }

    const info = folders.get(path)
    renderBreadcrumb(path)
    document.title = path ? `/${path} · public · lppjunior.com` : 'public · lppjunior.com'
    $('stats').replaceChildren(
      el('strong', { textContent: info.count }), ` ${info.count === 1 ? 'file' : 'files'} · `,
      el('strong', { textContent: formatSize(info.size) })
    )

    const rows = []
    if (query) {
      const prefix = path ? `${path}/` : ''
      for (const file of files) {
        if (file.path.startsWith(prefix) && file.path.slice(prefix.length).toLowerCase().includes(query)) rows.push(fileRow(file, true))
      }
      if (!rows.length) {
        emptyEl.textContent = `No files match “${searchEl.value.trim()}”.`
        emptyEl.hidden = false
      }
    } else {
      if (path) {
        const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
        rows.push(row({ href: folderHref(parent), icon: el('span', { className: 'icon up' }, svgIcon(UP_PATH)), label: '..', type: '', size: '' }))
      }
      const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      ;[...info.dirs].sort(byName).forEach(dir => rows.push(folderRow(dir)))
      info.files.slice().sort((a, b) => byName(nameOf(a.path), nameOf(b.path))).forEach(file => rows.push(fileRow(file, false)))
      if (!info.dirs.size && !info.files.length) {
        emptyEl.textContent = 'No files yet.'
        emptyEl.hidden = false
      }
    }
    rowsEl.replaceChildren(...rows)
  }

  let toastTimer
  async function copyLink (href) {
    const url = new URL(href, window.location.origin).href
    try {
      await navigator.clipboard.writeText(url)
      toastEl.textContent = 'Link copied'
    } catch {
      toastEl.textContent = url
    }
    toastEl.classList.add('is-visible')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 1800)
  }

  window.addEventListener('hashchange', () => {
    searchEl.value = ''
    render()
  })
  searchEl.addEventListener('input', render)
  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== searchEl && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      searchEl.focus()
    } else if (event.key === 'Escape' && document.activeElement === searchEl) {
      searchEl.value = ''
      render()
    }
  })

  render()
})()
