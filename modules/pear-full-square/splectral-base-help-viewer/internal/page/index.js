// page: the help page: an mrepo's help info by keywords, as `haicc <at>
// info/get <keywords>` answers, drawn; or, raw, as the terminal prints it
// (README.md beside it).
import { unpack } from 'haicc-base-app'
import { words } from 'mrepo-base-request'
import { draw } from '../draw/index.js'
import { ANSWER } from '../render/index.js'

// The mrepo read when none is asked for: the docs mrepo, the install's
// manual.
export const DEFAULT = 'docs'
// The width a raw page is printed to: the terminal's when its output is
// no terminal.
export const WIDTH = 80
// A position from the root: the root itself, or names.
const AT = /^(\.|[a-z][a-z0-9-]*(\/[a-z][a-z0-9-]*)*)$/

// The keywords below an answer, every choice's, each once.
const belowOf = answer => {
  const seen = new Map()
  for (const c of Array.isArray(answer?.choices) ? answer.choices : []) {
    for (const b of Array.isArray(c.below) ? c.below : []) if (!seen.has(b.keyword)) seen.set(b.keyword, b)
  }
  return [...seen.values()]
}
// A keyword named below its parent: the part after it.
const relative = (parent, keyword) => parent && keyword.startsWith(`${parent}/`) ? keyword.slice(parent.length + 1) : keyword

// The mrepos' drop-down: the install's, a tree, each to its top; `at`
// chosen (there even when the server did not say it).
function mreposOf (list, at, address) {
  const mrepos = (list?.mrepos ?? []).map(m => ({ label: `${'  '.repeat(m.depth)}${m.at === '.' ? '. (the root)' : m.at.split('/').pop()}`, value: address('', { mrepo: m.at }), selected: m.at === at }))
  if (!mrepos.some(m => m.selected)) mrepos.push({ label: at, value: address('', { mrepo: at }), selected: true })
  return mrepos
}

// form: { uri: the keywords, the path below the component; query: { at,
// raw, cmd } }. Its links relative to its section: right wherever it is
// mounted (the site gives the page its base).
export async function page (exec, { uri = '', query = {} } = {}) {
  if (typeof query.cmd === 'string') return commandPage(exec, query)
  const at = query.at ?? DEFAULT
  if (!AT.test(at)) throw new Error(`not an mrepo's position: ${at}`)
  const raw = 'raw' in query
  const keywords = String(uri ?? '').split('/').filter(Boolean).join('/')
  const names = keywords ? keywords.split('/') : []
  // an address: the keywords, the mrepo when not the default, raw or not
  const address = (k, { mrepo = at, asRaw = raw } = {}) => {
    const q = [...(mrepo === DEFAULT ? [] : [`at=${encodeURIComponent(mrepo)}`]), ...(asRaw ? ['raw'] : [])]
    return `${k || './'}${q.length ? `?${q.join('&')}` : ''}`
  }
  const command = keywords ? ['info/get', keywords] : ['info/get']
  // the mrepos first (what is kept is dropped when the install changed),
  // then this page's answer and each level's above it, asked at once
  // catch: the mrepos not known (the server did not say): this one alone in its drop-down
  const list = await exec.mrepos().catch(() => null)
  const parents = names.map((_, i) => names.slice(0, i).join('/'))
  const [above, current] = await Promise.all([
    // catch: a level above that does not answer: its drop-down holds this page's keyword alone
    Promise.all(parents.map(p => exec.data(at, p ? ['info/get', p] : ['info/get']).catch(() => null))),
    raw
      ? exec.record(at, command).then(text => { const form = JSON.parse(text).value.value; return { text, answer: form.output ?? null, error: form.error ?? null } }, err => ({ text: null, answer: null, error: err.message }))
      : exec.data(at, command).then(answer => ({ answer, error: null }), err => ({ answer: null, error: err.message }))
  ])
  const { answer, error } = current
  // the navigation: the mrepo, then a level a keyword, each level's
  // choices its parent's own answer's below; then what is below this page
  const mrepos = mreposOf(list, at, address)
  const option = (parent, b, chosen) => ({ label: `${relative(parent, b.keyword)}${(b.choices ?? 1) > 1 ? ` (${b.choices})` : ''}`, value: address(b.keyword), selected: b.keyword === chosen })
  const levels = names.map((_, i) => {
    const parent = parents[i]
    const chosen = names.slice(0, i + 1).join('/')
    const options = belowOf(above[i]).map(b => option(parent, b, chosen))
    if (!options.some(o => o.selected)) options.push({ label: relative(parent, chosen), value: address(chosen), selected: true })
    // the first: nothing chosen at this level, its parent
    return [{ label: '–', value: address(parent), selected: false }, ...options]
  })
  const next = belowOf(answer)
  if (next.length) levels.push([{ label: '…', value: '', selected: true }, ...next.map(b => option(keywords, b, null))])
  const nav = { mrepos, levels }
  const box = { value: '', placeholder: `${at} ${command.join(' ')}` }
  const footer = `\`haicc ${at} ${command.join(' ')}\``
  const title = keywords ? `${keywords} · ${at}` : at
  exec.log('verbose', 'page', { at, keywords: keywords || '.', raw, error })
  if (raw) {
    return draw({ title, nav, box, view: { label: 'page', href: address(keywords, { asRaw: false }) }, raw: current.text === null ? null : unpack(current.text, WIDTH), error: current.text === null ? error : null, footer })
  }
  const choices = Array.isArray(answer?.choices) ? answer.choices : []
  // where a section is from, when that is not obvious: several answers, or one page several packages share
  const from = c => (choices.length > 1 || (c.packages?.length ?? 0) > 1) ? (c.packages ?? []) : []
  const sections = choices.map(c => ({
    title: c.title,
    from: from(c),
    markdown: c.page ?? c.oneliner ?? '',
    below: (c.below ?? []).map(b => ({ label: b.keyword, href: address(b.keyword), oneliner: b.oneliner, pages: b.choices ?? 1 }))
  }))
  // a keyword not there: the nearest one and what is below it, as links
  const missing = /^no .+ here: nearest (\S+), below it (.+)$/.exec(error ?? '')
  const near = missing
    ? { label: missing[1], href: missing[1] === '.' ? address('') : address(missing[1]), below: missing[2] === 'nothing' ? [] : missing[2].split(', ').map(n => { const k = missing[1] === '.' ? n : `${missing[1]}/${n}`; return { label: k, href: address(k) } }) }
    : null
  return draw({
    title,
    nav,
    box,
    view: { label: 'raw', href: address(keywords, { asRaw: true }) },
    sections,
    error: error ?? (choices.length ? null : `nothing at ${keywords || '.'}`),
    near,
    footer
  })
}

// The command box: a command as typed after `haicc` (its position first,
// `.` the root), answered with help where it would run: sent with the help
// flag, so nothing of it is executed (a rewrite, strict: mrepo-base-request).
// The answer drawn; raw, as the terminal prints it. Never kept: the door's
// answer is here and now.
async function commandPage (exec, query) {
  const raw = 'raw' in query
  const typed = String(query.cmd).trim().replace(/^haicc\s+/, '')
  const self = asRaw => `./?cmd=${encodeURIComponent(typed)}${asRaw ? '&raw' : ''}`
  let parts = []
  let problem = null
  try { parts = words(typed) } catch (err) { problem = err.message }
  const [position, ...rest] = parts
  if (!problem && (!position || !rest.length)) problem = 'a command as typed after haicc: <position> <protocol>/<action> [<argument>...] (. the root)'
  if (!problem && !AT.test(position)) problem = `not an mrepo's position: ${position}`
  const at = problem ? (AT.test(query.at ?? '') ? query.at : DEFAULT) : position
  const address = (k, { mrepo = at } = {}) => `${k || './'}${mrepo === DEFAULT ? '' : `?at=${encodeURIComponent(mrepo)}`}`
  // catch: the mrepos not known (the server did not say): this one alone in its drop-down
  const list = await exec.mrepos().catch(() => null)
  const nav = { mrepos: mreposOf(list, at, address), levels: [] }
  const box = { value: typed, placeholder: `${at} info/get` }
  const title = `${typed || 'a command'} · help`
  if (problem) return draw({ title, nav, box, error: problem })
  // the help flag on the last command: after a list of its own, or a list of its own
  const last = rest.lastIndexOf('--flags')
  const command = last >= 0 && !rest.slice(last).includes('--') ? [...rest.slice(0, last + 1), 'help', ...rest.slice(last + 1)] : [...rest, '--flags', 'help']
  const footer = `\`haicc ${at} ${command.join(' ')}\``
  let text = null
  let form = null
  let error = null
  // asked typed: help/annotate's answer as its schema (ANSWER), its
  // response whole beside it for the raw view
  try { form = await exec.typed(at, command, ANSWER); text = form.record ?? null } catch (err) { error = err.message }
  exec.log('verbose', 'command', { at, command: command.join(' '), raw, error })
  if (raw) return draw({ title, nav, box, view: { label: 'page', href: self(false) }, raw: text === null ? null : unpack(text, WIDTH), error: text === null ? error : null, footer })
  const view = { label: 'raw', href: self(true) }
  const out = form?.output
  if (form && 'error' in form) return draw({ title, nav, box, view, error: form.error, footer })
  if (out?.run === false) return draw({ title, nav, box, view, error: `not run: ${(out.why ?? []).join('; ')}`, footer })
  if (!out || typeof out.door !== 'string') return draw({ title, nav, box, view, error: error ?? 'no help in the answer', footer })
  // to read more: the info page it names, at that mrepo, in this viewer
  const more = /^info\/get(?: (\S+))?$/.exec(out.more ?? '')
  return draw({
    title,
    nav,
    box,
    view,
    help: {
      command: `haicc ${at} ${out.help}`,
      does: out.does,
      door: out.door,
      taken: out.door.startsWith('taken'),
      arguments: out.arguments,
      run: `haicc ${at} ${out.run}`,
      more: more ? { label: `haicc ${at} ${out.more}`, href: address(more[1] ?? '') } : null
    },
    footer
  })
}
