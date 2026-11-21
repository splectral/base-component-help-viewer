// draw: the help page as HTML, whole: its sections in markdown, the
// keywords below each as links (README.md beside it).
import { markdown, inline, escape } from '../markdown/index.js'

export const STYLE = `
:root{--bg:#fff;--fg:#1d1f23;--muted:#5f6670;--line:#e3e6ea;--accent:#2457c5;--code:#f4f5f7}
@media (prefers-color-scheme:dark){:root{--bg:#16181c;--fg:#e6e8eb;--muted:#9aa2ad;--line:#2c3036;--accent:#7fa6ff;--code:#202329}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:48rem;margin:0 auto;padding:1.25rem 1rem 3rem}
nav.go{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;font-size:.9rem;color:var(--muted)}nav.go select{font:inherit;max-width:14rem;padding:.15rem .3rem;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--fg)}
a.view{font-size:.85rem;text-decoration:none}
form.cmd{display:flex;gap:.4rem;margin:0 0 1rem}form.cmd input{flex:1;min-width:0;font:inherit;font-family:ui-monospace,monospace;font-size:.9rem;padding:.3rem .5rem;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--fg)}form.cmd button{font:inherit;font-size:.9rem;padding:.3rem .8rem;border:1px solid var(--line);border-radius:4px;background:var(--code);color:var(--fg);cursor:pointer}
dl.help{display:grid;grid-template-columns:max-content 1fr;gap:.4rem 1rem;margin:0}dl.help dt{color:var(--muted)}dl.help dd{margin:0}dd.taken{color:#1e8449}dd.refused{color:#c0392b}pre.raw{font-size:.82rem;line-height:1.35}
h1,h2,h3{line-height:1.25}h1{font-size:1.6rem;margin:.2rem 0 .8rem}h2{font-size:1.25rem;margin:1.8rem 0 .6rem}
a{color:var(--accent)}code{background:var(--code);padding:.1em .3em;border-radius:4px;font-size:.9em}
pre{background:var(--code);padding:.8rem;border-radius:6px;overflow-x:auto}pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;font-size:.95rem;display:block;overflow-x:auto}th,td{border-bottom:1px solid var(--line);padding:.35rem .5rem;text-align:left;vertical-align:top}
section+section{border-top:1px solid var(--line);margin-top:2rem}
ul.below{list-style:none;padding:0}ul.below li{padding:.35rem 0;border-bottom:1px solid var(--line)}ul.below .one{color:var(--muted);font-size:.92rem}ul.below .n{color:var(--muted);font-size:.85rem;margin-left:.4rem}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:.5rem;margin-bottom:1rem}
.near{margin:.5rem 0 1.5rem}p.from{margin:-.5rem 0 .8rem;color:var(--muted);font-size:.88rem}
.error{border-left:3px solid #c0392b;padding:.4rem .8rem;background:var(--code)}
footer{margin-top:2.5rem;color:var(--muted);font-size:.85rem}
`

// A choice made: its address opened at the top, relative to the page's
// base (its section), as a link is followed.
const GO = 'function go(s){if(s.value)top.location.href=new URL(s.value,document.baseURI).href}'
const select = (label, options) => `<select aria-label="${escape(label)}" onchange="go(this)">${options.map(o => `<option value="${escape(o.value)}"${o.selected ? ' selected' : ''}>${escape(o.label)}</option>`).join('')}</select>`

// input: { title, nav: { mrepos, levels }, box: { value, placeholder },
// view: { label, href }, sections: [{ title, from, markdown, below: [{
// label, href, oneliner, pages }] }], help: { command, does, door, taken,
// arguments, run, more: { label, href } }, raw, error, near: { label,
// href, below: [{ label, href }] }, footer } -> HTML
export function draw (input) {
  if (!input || typeof input !== 'object') throw new Error('missing argument: page ({ title, sections })')
  const sections = Array.isArray(input.sections) ? input.sections : []
  // where it is and where to go: a drop-down the mrepo, then one a level
  const nav = input.nav
    ? `<nav class="go">${[select('mrepo', input.nav.mrepos ?? []), ...(input.nav.levels ?? []).map((options, i) => select(`level ${i + 1}`, options))].join('<span>›</span>')}</nav>`
    : ''
  const view = input.view ? `<a class="view" href="${escape(input.view.href)}">${escape(input.view.label)}</a>` : ''
  const top = nav || view ? `<div class="top">${nav}${view}</div>` : ''
  // a command, answered with help: a plain form, its section's top
  const box = input.box ? `<form class="cmd" action="./"><input name="cmd" value="${escape(input.box.value ?? '')}" placeholder="${escape(input.box.placeholder ?? '')}" aria-label="a command, as typed after haicc: answered with help, not run" autocomplete="off" spellcheck="false"><button>help</button></form>` : ''
  const h = input.help
  const help = h ? `<section><h1><code>${escape(h.command)}</code></h1><dl class="help"><dt>does</dt><dd>${h.does ? inline(h.does) : '–'}</dd><dt>door</dt><dd class="${h.taken ? 'taken' : 'refused'}">${escape(h.door)}</dd><dt>arguments</dt><dd>${escape(h.arguments ?? '')}</dd><dt>run it</dt><dd><code>${escape(h.run)}</code></dd>${h.more ? `<dt>read more</dt><dd><a href="${escape(h.more.href)}">${escape(h.more.label)}</a></dd>` : ''}</dl></section>` : ''
  const body = sections.map(s => {
    const below = Array.isArray(s.below) && s.below.length
      ? `<h2>Below</h2><ul class="below">${s.below.map(b => `<li><a href="${escape(b.href)}">${escape(b.label)}</a>${b.pages > 1 ? `<span class="n">${b.pages} pages</span>` : ''}${b.oneliner ? `<div class="one">${inline(b.oneliner)}</div>` : ''}</li>`).join('')}</ul>`
      : ''
    const from = Array.isArray(s.from) && s.from.length ? `<p class="from">${s.from.length > 1 ? `in ${s.from.length} packages: ` : 'in '}${s.from.map(escape).join(', ')}</p>` : ''
    return `<section>${s.title ? `<h1>${escape(s.title)}</h1>` : ''}${from}${markdown(String(s.markdown ?? '').replace(/^#\s+.*\n+/, ''))}${below}</section>`
  }).join('\n')
  const raw = typeof input.raw === 'string' ? `<pre class="raw"><code>${escape(input.raw)}</code></pre>` : ''
  const error = input.error ? `<p class="error">${escape(input.error)}</p>` : ''
  const near = input.near ? `<div class="near">Nearest: <a href="${escape(input.near.href)}">${escape(input.near.label)}</a>${input.near.below?.length ? `; below it: ${input.near.below.map(b => `<a href="${escape(b.href)}">${escape(b.label)}</a>`).join(', ')}` : ''}</div>` : ''
  const script = nav ? `<script>${GO}</script>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(input.title ?? 'Splectral')}</title><style>${STYLE}</style>${script}</head><body><main>${top}${box}${error}${near}${raw}${help}${body}${input.footer ? `<footer>${inline(input.footer)}</footer>` : ''}</main></body></html>`
}
