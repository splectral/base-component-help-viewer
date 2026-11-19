// draw: the help page as HTML, whole: its sections in markdown, the
// keywords below each as links (README.md beside it).
import { markdown, inline, escape } from '../markdown/index.js'

export const STYLE = `
:root{--bg:#fff;--fg:#1d1f23;--muted:#5f6670;--line:#e3e6ea;--accent:#2457c5;--code:#f4f5f7}
@media (prefers-color-scheme:dark){:root{--bg:#16181c;--fg:#e6e8eb;--muted:#9aa2ad;--line:#2c3036;--accent:#7fa6ff;--code:#202329}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:48rem;margin:0 auto;padding:1.25rem 1rem 3rem}
nav.crumbs{font-size:.9rem;color:var(--muted);margin-bottom:1rem}nav.crumbs a{color:var(--accent);text-decoration:none}
h1,h2,h3{line-height:1.25}h1{font-size:1.6rem;margin:.2rem 0 .8rem}h2{font-size:1.25rem;margin:1.8rem 0 .6rem}
a{color:var(--accent)}code{background:var(--code);padding:.1em .3em;border-radius:4px;font-size:.9em}
pre{background:var(--code);padding:.8rem;border-radius:6px;overflow-x:auto}pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;font-size:.95rem;display:block;overflow-x:auto}th,td{border-bottom:1px solid var(--line);padding:.35rem .5rem;text-align:left;vertical-align:top}
section+section{border-top:1px solid var(--line);margin-top:2rem}
ul.below{list-style:none;padding:0}ul.below li{padding:.35rem 0;border-bottom:1px solid var(--line)}ul.below .one{color:var(--muted);font-size:.92rem}
.error{border-left:3px solid #c0392b;padding:.4rem .8rem;background:var(--code)}
footer{margin-top:2.5rem;color:var(--muted);font-size:.85rem}
`

// input: { title, crumbs: [{ label, href }], sections: [{ title, markdown,
// below: [{ label, href, oneliner }] }], error, footer } -> HTML
export function draw (input) {
  if (!input || typeof input !== 'object') throw new Error('missing argument: page ({ title, sections })')
  const sections = Array.isArray(input.sections) ? input.sections : []
  const crumbs = Array.isArray(input.crumbs) && input.crumbs.length
    ? `<nav class="crumbs">${input.crumbs.map(c => c.href ? `<a href="${escape(c.href)}">${escape(c.label)}</a>` : escape(c.label)).join(' / ')}</nav>`
    : ''
  const body = sections.map(s => {
    const below = Array.isArray(s.below) && s.below.length
      ? `<h2>Below</h2><ul class="below">${s.below.map(b => `<li><a href="${escape(b.href)}">${escape(b.label)}</a>${b.oneliner ? `<div class="one">${inline(b.oneliner)}</div>` : ''}</li>`).join('')}</ul>`
      : ''
    return `<section>${s.title ? `<h1>${escape(s.title)}</h1>` : ''}${markdown(String(s.markdown ?? '').replace(/^#\s+.*\n+/, ''))}${below}</section>`
  }).join('\n')
  const error = input.error ? `<p class="error">${escape(input.error)}</p>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(input.title ?? 'Splectral')}</title><style>${STYLE}</style></head><body><main>${crumbs}${error}${body}${input.footer ? `<footer>${inline(input.footer)}</footer>` : ''}</main></body></html>`
}
