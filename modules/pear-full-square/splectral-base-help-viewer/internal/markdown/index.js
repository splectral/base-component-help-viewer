// markdown: a page's markdown as HTML: what a help page uses (README.md
// beside it). Everything is escaped first; only what is recognised
// becomes markup.
export const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// A line's inline markup: code first (nothing inside it is markup, each
// span held aside), then links, bold, italic over the whole line, so
// they may hold code; then the code put back. link(href) may rewrite a
// link's address.
const HELD = /\u0000(\d+)\u0000/g
export function inline (text, { link = h => h } = {}) {
  const code = []
  let s = escape(String(text).replace(/\u0000/g, '').replace(/`([^`]*)`/g, (m, c) => `\u0000${code.push(c) - 1}\u0000`))
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => `<a href="${escape(link(href.replace(/&amp;/g, '&')))}">${label}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>')
  return s.replace(HELD, (m, i) => `<code>${escape(code[Number(i)])}</code>`)
}

const isTableRow = l => /^\s*\|.*\|\s*$/.test(l)
const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
const item = l => l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)

// The whole of it: headings, paragraphs, lists (nested by indent), fenced
// code, tables, rules. -> HTML
export function markdown (text, opts = {}) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    const fence = l.match(/^\s*```(\S*)\s*$/)
    if (fence) {
      const body = []
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i])
      i++
      out.push(`<pre><code${fence[1] ? ` class="language-${escape(fence[1])}"` : ''}>${escape(body.join('\n'))}</code></pre>`)
      continue
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/)
    if (h) { out.push(`<h${h[1].length}>${inline(h[2], opts)}</h${h[1].length}>`); i++; continue }
    if (/^\s*(---|\*\*\*)\s*$/.test(l)) { out.push('<hr>'); i++; continue }
    if (isTableRow(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const head = cells(l)
      const rows = []
      for (i += 2; i < lines.length && isTableRow(lines[i]); i++) rows.push(cells(lines[i]))
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c, opts)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c, opts)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      continue
    }
    if (item(l)) {
      const block = []
      for (; i < lines.length && (item(lines[i]) || (lines[i].trim() && /^\s+/.test(lines[i]))); i++) block.push(lines[i])
      out.push(list(block, opts))
      continue
    }
    const para = []
    for (; i < lines.length && lines[i].trim() && !item(lines[i]) && !/^(#{1,6})\s/.test(lines[i]) && !/^\s*```/.test(lines[i]) && !isTableRow(lines[i]); i++) para.push(lines[i].trim())
    out.push(`<p>${inline(para.join(' '), opts)}</p>`)
  }
  return out.join('\n')
}

// A list: its items at the first item's indent; what is indented more,
// an item's continuation or a list of its own.
function list (block, opts) {
  const indent = item(block[0])[1].length
  const ordered = /\d/.test(item(block[0])[2])
  const items = []
  for (const l of block) {
    const m = item(l)
    if (m && m[1].length === indent) items.push({ text: [m[3]], sub: [] })
    else if (items.length) {
      const last = items.at(-1)
      if (m || last.sub.length) last.sub.push(l)
      else last.text.push(l.trim())
    }
  }
  const tag = ordered ? 'ol' : 'ul'
  return `<${tag}>${items.map(it => `<li>${inline(it.text.join(' '), opts)}${it.sub.length ? list(it.sub, opts) : ''}</li>`).join('')}</${tag}>`
}
