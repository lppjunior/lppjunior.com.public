const TOAST_DURATION_MS = 1800
const TOAST_VISIBLE = 'toast--visible'

/** Copies absolute file URLs and confirms with a toast (or shows the URL if the clipboard is unavailable). */
export function createLinkCopier ({ toast, origin, clipboard }) {
  let hideTimer

  function show (message) {
    toast.textContent = message
    toast.classList.add(TOAST_VISIBLE)
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => toast.classList.remove(TOAST_VISIBLE), TOAST_DURATION_MS)
  }

  return async function copyLink (urlPath) {
    const url = new URL(urlPath, origin).href
    try {
      await clipboard.writeText(url)
      show('Link copied')
    } catch {
      show(url)
    }
  }
}
