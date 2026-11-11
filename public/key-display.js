'use strict'
const KeyDisplay = (() => {
  const SPECIALS = { SPACE: '␣', ENTER: '↵', BACKSPACE: '⌫' }
  const escape = (str) =>
    String(str).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    )
  function label(k) {
    if (!k) return ''
    if (k.startsWith('SHIFT+')) return 'Shift + ' + k.replace('SHIFT+', '')
    if (Object.hasOwn(SPECIALS, k)) return SPECIALS[k]
    if (/^[A-Z]$/.test(k)) return k + '·' + k.toLowerCase()
    return k
  }
  function html(k) {
    if (!k) return ''
    if (/^[A-Z]$/.test(k))
      return `<span class="key-pair"><span>${k}</span><em>${k.toLowerCase()}</em></span>`
    return escape(label(k))
  }
  return { label, html }
})()
globalThis.KeyDisplay = KeyDisplay
