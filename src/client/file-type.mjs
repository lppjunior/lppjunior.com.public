const EXTENSIONS_BY_KIND = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'],
  code: ['js', 'mjs', 'cjs', 'ts', 'json', 'css', 'html', 'htm', 'xml', 'yml', 'yaml', 'sh', 'py', 'webmanifest'],
  text: ['txt', 'md', 'csv', 'log'],
  doc: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt'],
  archive: ['zip', 'gz', 'tgz', 'rar', '7z', 'tar'],
  media: ['mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov'],
  font: ['woff', 'woff2', 'ttf', 'otf']
}

const MAX_BADGE_LENGTH = 4

/** Visual family of a file, used to color its icon. */
export function kindOf (extension) {
  return Object.keys(EXTENSIONS_BY_KIND).find(kind => EXTENSIONS_BY_KIND[kind].includes(extension)) ?? 'other'
}

export function badgeOf (extension) {
  return (extension || 'file').slice(0, MAX_BADGE_LENGTH).toUpperCase()
}

export function typeLabelOf (extension) {
  return extension ? extension.toUpperCase() : 'File'
}
