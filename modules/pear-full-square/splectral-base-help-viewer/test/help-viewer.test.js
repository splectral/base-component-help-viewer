import test from 'brittle'
import os from 'bare-os'
import { spawn } from 'bare-subprocess'
import { mkdtempSync, mkdirSync, writeFileSync, renameSync, readFileSync, readdirSync, rmSync, existsSync } from 'bare-fs'
import { join, dirname } from 'bare-path'
import { tmpdir } from 'bare-os'
import { fileURLToPath } from 'bare-url'
import { unpack } from 'haicc-base-app'
import { markdown, inline, escape, draw, page, DEFAULT, WIDTH, render } from '../index.js'

const here = join(dirname(fileURLToPath(import.meta.url)), '..')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async (ok, ms = 5000) => { for (let i = 0; i < ms / 50; i++) { if (await ok()) return true; await wait(50) } return false }
// catch: no such process: not alive
const alive = pid => { try { os.kill(pid, 0); return true } catch { return false } }

test('markdown: headings, paragraphs, lists nested, code, tables; everything escaped first', (t) => {
  t.is(escape('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;')
  t.is(inline('`<b>` and **bold** and *it* and [a](b)'), '<code>&lt;b&gt;</code> and <strong>bold</strong> and <em>it</em> and <a href="b">a</a>')
  t.is(markdown('# Title\n\nOne\nline.'), '<h1>Title</h1>\n<p>One line.</p>')
  t.is(markdown('- a\n  more\n- b\n  - c'), '<ul><li>a more</li><li>b<ul><li>c</li></ul></li></ul>', 'an item\'s continuation, a list nested by its indent')
  t.is(markdown('1. one\n2. two'), '<ol><li>one</li><li>two</li></ol>')
  t.is(markdown('```sh\nhaicc <x>\n```'), '<pre><code class="language-sh">haicc &lt;x&gt;</code></pre>')
  t.is(markdown('| a | b |\n|---|---|\n| `1` | 2 |'), '<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td><code>1</code></td><td>2</td></tr></tbody></table>')
  t.is(markdown('<script>x</script>'), '<p>&lt;script&gt;x&lt;/script&gt;</p>', 'no HTML passes')
  t.is(inline('[a](b)', { link: h => `/v/${h}` }), '<a href="/v/b">a</a>', 'a link\'s address rewritten')
  t.is(inline('**`haicc scripts`** lists'), '<strong><code>haicc scripts</code></strong> lists', 'bold that holds code')
  t.is(inline('`**not bold**` and [`x`](y)'), '<code>**not bold**</code> and <a href="y"><code>x</code></a>', 'code never markup; a link that holds code')
})

test('draw: a whole page, its sections, the keywords below as links, the navigation a drop-down a level; raw; the command box and a command\'s help; no page given refused', (t) => {
  const html = draw({ title: 'Validation', nav: { mrepos: [{ label: 'docs', value: './', selected: true }], levels: [[{ label: '–', value: './', selected: false }, { label: 'validation', value: 'validation', selected: true }]] }, view: { label: 'raw', href: 'validation?raw' }, sections: [{ title: 'Validation', markdown: '# Validation\n\nBefore **every** commit.', below: [{ label: 'hdlc/test', href: '/v/hdlc/test', oneliner: 'The `tests`.' }] }], footer: 'at `docs`' })
  t.ok(html.startsWith('<!doctype html>'), 'a whole page')
  t.ok(html.includes('<title>Validation</title>'))
  t.ok(html.includes('<nav class="go"><select aria-label="mrepo" onchange="go(this)"><option value="./" selected>docs</option></select><span>›</span><select aria-label="level 1" onchange="go(this)"><option value="./">–</option><option value="validation" selected>validation</option></select></nav><a class="view" href="validation?raw">raw</a>'), 'where it is: a drop-down the mrepo, one a level; the other view')
  t.ok(html.includes('<h1>Validation</h1><p>Before <strong>every</strong> commit.</p>'), 'its section: the page\'s own heading not repeated')
  t.ok(html.includes('<a href="/v/hdlc/test">hdlc/test</a><div class="one">The <code>tests</code>.</div>'), 'a keyword below, a link, its one-liner')
  t.ok(html.includes('prefers-color-scheme:dark'), 'its style with it, light and dark')
  t.absent(/<link\b/.test(html), 'nothing loaded from elsewhere')
  t.alike(html.match(/<script>[^<]*<\/script>/g), ['<script>function go(s){if(s.value)top.location.href=new URL(s.value,document.baseURI).href}</script>'], 'one script only: a choice opens its address at the top')
  t.ok(draw({ title: 'x', raw: '{\n  "a": "<b>"\n}' }).includes('<pre class="raw"><code>{\n  &quot;a&quot;: &quot;&lt;b&gt;&quot;\n}</code></pre>'), 'raw: the text as it is, escaped')
  t.absent(draw({ title: 'x' }).includes('<script'), 'no navigation, no script')
  t.ok(draw({ title: 'x', box: { value: 'host "a"', placeholder: 'docs info/get' } }).includes('<form class="cmd" action="./"><input name="cmd" value="host &quot;a&quot;" placeholder="docs info/get"'), 'the command box: a plain form, what was typed kept')
  const card = draw({ title: 'x', help: { command: 'haicc host crud/read x', does: 'Reads `x`.', door: 'refused here: no', taken: false, arguments: 'none', run: 'haicc host crud/read x', more: { label: 'haicc host info/get crud/read', href: 'crud/read?at=host' } } })
  t.ok(card.includes('<h1><code>haicc host crud/read x</code></h1><dl class="help"><dt>does</dt><dd>Reads <code>x</code>.</dd><dt>door</dt><dd class="refused">refused here: no</dd>'), 'a command\'s help: the command, what it does, the door')
  t.ok(draw({ title: 'x', error: 'no <answer>' }).includes('<p class="error">no &lt;answer&gt;</p>'), 'an error said')
  t.exception(() => draw(), /missing argument: page/)
})

// An execution as the program hands one: the mrepos, the data asked for,
// recorded; a response whole.
function execution (answers, { mrepos = { version: 1, mrepos: [{ at: '.', depth: 0 }, { at: 'docs', depth: 1 }, { at: 'splectral', depth: 1 }, { at: 'splectral/help', depth: 2 }] }, records = {} } = {}) {
  const asked = []
  return {
    asked,
    mrepos: async () => { if (mrepos instanceof Error) throw mrepos; return mrepos },
    data: async (at, command) => { asked.push([at, ...command]); const a = answers[`${at} ${command.join(' ')}`]; if (a instanceof Error || a === undefined) throw a ?? new Error(`no page here: ${command[1]}`); return a },
    record: async (at, command) => { asked.push(['raw', at, ...command]); const r = records[`${at} ${command.join(' ')}`]; if (r === undefined) throw new Error('no response'); return r },
    log () {}
  }
}
const DOCS = {
  'docs info/get': { keyword: '.', choices: [{ title: 'base-component-docs', page: '# docs', below: [{ keyword: 'hdlc', oneliner: 'How.' }, { keyword: 'package', choices: 3 }] }] },
  'docs info/get hdlc': { keyword: 'hdlc', choices: [{ title: 'HDLC', page: 'How.', below: [{ keyword: 'hdlc/validation' }, { keyword: 'hdlc/branches' }] }] },
  'docs info/get hdlc/validation': { keyword: 'hdlc/validation', choices: [{ title: 'Validation', page: 'Before every commit.', below: [{ keyword: 'hdlc/validation/x', oneliner: 'X.', choices: 1 }, { keyword: 'hdlc/validation/y', oneliner: 'Y.', choices: 3 }] }] }
}

test('page: the keywords asked of the docs mrepo, drawn; links to the same view, relative; the command it shows', async (t) => {
  const exec = execution(DOCS)
  const html = await page(exec, { uri: 'hdlc/validation', query: {} })
  t.is(DEFAULT, 'docs')
  t.alike(exec.asked.slice().sort(), [['docs', 'info/get'], ['docs', 'info/get', 'hdlc'], ['docs', 'info/get', 'hdlc/validation']], 'its data: info/get at the docs mrepo, the keywords as the command line has them; and each level above')
  t.ok(html.includes('<title>hdlc/validation · docs</title>'), 'its title: the keywords and the mrepo')
  t.ok(html.includes('<h1>Validation</h1><p>Before every commit.</p>'), 'a choice a section')
  t.ok(html.includes('<a href="hdlc/validation/x">hdlc/validation/x</a><div class="one">X.</div>'), 'the keywords below, links to the same view, relative: right wherever it is mounted')
  t.ok(html.includes('<a href="hdlc/validation/y">hdlc/validation/y</a><span class="n">3 pages</span>'), 'how many pages a keyword opens, when more than one')
  t.ok(html.includes('<footer><code>haicc docs info/get hdlc/validation</code></footer>'), 'the command it shows')
  t.ok(html.includes('<a class="view" href="hdlc/validation?raw">raw</a>'), 'the other view: as the terminal prints it')
})

test('page: the navigation: the mrepo, the install\'s, a drop-down; a level a keyword, each one\'s choices its parent\'s answer; then what is below', async (t) => {
  const html = await page(execution(DOCS), { uri: 'hdlc/validation', query: {} })
  const selects = html.match(/<select[^>]*>.*?<\/select>/g)
  t.is(selects.length, 4, 'the mrepo, two levels, what is below')
  t.is(selects[0], '<select aria-label="mrepo" onchange="go(this)"><option value="./?at=.">. (the root)</option><option value="./" selected>  docs</option><option value="./?at=splectral">  splectral</option><option value="./?at=splectral%2Fhelp">    help</option></select>', 'the mrepos as the server knows them, a tree; each its top; this one chosen')
  t.is(selects[1], '<select aria-label="level 1" onchange="go(this)"><option value="./">–</option><option value="hdlc" selected>hdlc</option><option value="package">package (3)</option></select>', 'the first level: the top\'s below; how many pages a keyword opens; back up')
  t.is(selects[2], '<select aria-label="level 2" onchange="go(this)"><option value="hdlc">–</option><option value="hdlc/validation" selected>validation</option><option value="hdlc/branches">branches</option></select>', 'the next: hdlc\'s below, named below it')
  t.is(selects[3], '<select aria-label="level 3" onchange="go(this)"><option value="" selected>…</option><option value="hdlc/validation/x">x</option><option value="hdlc/validation/y">y (3)</option></select>', 'what is below this page: nothing chosen yet')
  const top = await page(execution(DOCS), { uri: '' })
  t.is(top.match(/<select/g).length, 2, 'the top: the mrepo and what is below it')
  const lost = await page(execution(DOCS, { mrepos: new Error('no server') }), { uri: '', query: { at: 'host' } })
  t.ok(lost.includes('<select aria-label="mrepo" onchange="go(this)"><option value="./?at=host" selected>host</option></select>'), 'the mrepos not known: this one alone')
  t.ok((await page(execution({ 'docs info/get': DOCS['docs info/get'] }), { uri: 'hdlc/validation' })).includes('<option value="hdlc/validation" selected>validation</option>'), 'a level whose parent did not answer: this page\'s keyword still')
})

test('page: raw: the command\'s response whole, as the terminal prints it (to 80); the navigation kept; the drawn page a link away', async (t) => {
  const text = JSON.stringify({ topic: '/outbox', key: 'k', timestamp: 't', headers: {}, value: { topic: '/splectral', key: 'k', timestamp: 't', headers: {}, value: { command: ['haicc', 'docs', 'info/get', 'hdlc'], output: DOCS['docs info/get hdlc'] } } }) + '\n'
  const exec = execution(DOCS, { records: { 'docs info/get hdlc': text } })
  const html = await page(exec, { uri: 'hdlc', query: { raw: '' } })
  t.ok(exec.asked.some(a => a[0] === 'raw' && a.join(' ') === 'raw docs info/get hdlc'), 'the response asked whole')
  t.ok(html.includes(`<pre class="raw"><code>${escape(unpack(text, WIDTH))}</code></pre>`), 'printed as the terminal prints it, its width when no terminal')
  t.is(WIDTH, 80)
  t.ok(html.includes('<option value="hdlc/validation?raw">validation</option>'), 'what is below, from the response: each choice raw too')
  t.ok(html.includes('<a class="view" href="hdlc">page</a>'), 'the drawn page a link away')
  t.absent(html.includes('<section>'), 'nothing drawn')
  const failed = await page(execution(DOCS), { uri: 'nope', query: { raw: '' } })
  t.ok(failed.includes('<p class="error">no response</p>'), 'no response: said')
})

test('page: the command box: a command as typed after haicc, sent with the help flag, its help drawn; refused; not run; an error; raw; not a command', async (t) => {
  const rec = (command, done) => JSON.stringify({ topic: '/outbox', key: 'k', timestamp: 't', headers: {}, value: { topic: '/splectral', key: 'k', timestamp: 't', headers: {}, value: { command, ...done } } }) + '\n'
  const taken = { help: 'crud/read swarms', does: 'The nodes at a URI, read.', door: 'taken here, now', arguments: 'none', run: 'crud/read swarms', more: 'info/get crud/read' }
  const records = {
    'host crud/read swarms --flags help': rec(['haicc', 'host', 'crud/read', 'swarms', '--flags', 'help'], { output: taken }),
    'host crud/read x --flags help log=debug': rec([], { output: { ...taken, help: 'crud/read x --flags log=debug', run: 'crud/read x --flags log=debug' } }),
    'host --flags log=debug -- crud/read x --flags help': rec([], { output: { ...taken, help: 'crud/read x' } }),
    'host crud/update x --flags help': rec([], { output: { ...taken, help: 'crud/update x', does: null, door: 'refused here: no action: crud update (create, delete, read)', run: 'crud/update x', more: 'info/get crud' } }),
    '. crud/read x --flags help nope': rec([], { output: { run: false, command: 'crud/read x --flags help nope', why: ['no flag: nope'] } }),
    'nowhere info/get --flags help': rec([], { error: 'haicc nowhere: no node there' })
  }
  const exec = execution(DOCS, { records })
  const html = await page(exec, { uri: '', query: { cmd: 'haicc host crud/read swarms' } })
  t.alike(exec.asked.at(-1), ['raw', 'host', 'crud/read', 'swarms', '--flags', 'help'], 'sent at its position with the help flag: answered, nothing of it run; never kept')
  t.ok(html.includes('<h1><code>haicc host crud/read swarms</code></h1>'), 'the command as understood, as typed')
  t.ok(html.includes('<dt>does</dt><dd>The nodes at a URI, read.</dd>'), 'what it does')
  t.ok(html.includes('<dd class="taken">taken here, now</dd>'), 'the door\'s answer here and now')
  t.ok(html.includes('<dt>run it</dt><dd><code>haicc host crud/read swarms</code></dd>'), 'the command to run it, from the terminal')
  t.ok(html.includes('<a href="crud/read?at=host">haicc host info/get crud/read</a>'), 'to read more: its page at that mrepo, in this viewer')
  t.ok(html.includes('<form class="cmd" action="./"><input name="cmd" value="host crud/read swarms"'), 'the box keeps what was typed')
  t.ok(html.includes('<option value="./?at=host" selected>host</option>'), 'the mrepo it runs in, chosen')
  t.ok(html.includes('<a class="view" href="./?cmd=host%20crud%2Fread%20swarms&amp;raw">raw</a>'), 'raw a link away')
  await page(exec, { uri: '', query: { cmd: 'host crud/read x --flags log=debug' } })
  t.alike(exec.asked.at(-1).slice(1), ['host', 'crud/read', 'x', '--flags', 'help', 'log=debug'], 'a list of its own: help put in it')
  await page(exec, { uri: '', query: { cmd: 'host --flags log=debug -- crud/read x' } })
  t.alike(exec.asked.at(-1).slice(1), ['host', '--flags', 'log=debug', '--', 'crud/read', 'x', '--flags', 'help'], 'a list on a step that passes on: help on the last command, a list of its own')
  t.ok((await page(exec, { uri: '', query: { cmd: 'host crud/update x' } })).includes('<dd class="refused">refused here: no action: crud update (create, delete, read)</dd>'), 'refused at the door: said why')
  t.ok((await page(exec, { uri: '', query: { cmd: '. crud/read x --flags nope' } })).includes('<p class="error">not run: no flag: nope</p>'), 'not run: said why')
  t.ok((await page(exec, { uri: '', query: { cmd: 'nowhere info/get' } })).includes('<p class="error">haicc nowhere: no node there</p>'), 'an error: said')
  const raw = await page(exec, { uri: '', query: { cmd: 'host crud/read swarms', raw: '' } })
  t.ok(raw.includes(`<pre class="raw"><code>${escape(unpack(records['host crud/read swarms --flags help'], WIDTH))}</code></pre>`), 'raw: the response as the terminal prints it')
  t.ok((await page(exec, { uri: '', query: { cmd: 'host' } })).includes('<p class="error">a command as typed after haicc: &lt;position&gt; &lt;protocol&gt;/&lt;action&gt; [&lt;argument&gt;...] (. the root)</p>'), 'a position alone: not a command')
  t.ok((await page(exec, { uri: '', query: { cmd: '../x info/get' } })).includes('<p class="error">not an mrepo&#39;s position: ../x</p>'), 'no position: said')
  t.ok((await page(exec, { uri: '', query: { cmd: 'host "open' } })).includes('a quote not closed'), 'split as the shell splits it')
  t.ok((await page(execution(DOCS), { uri: 'hdlc/validation', query: {} })).includes('<form class="cmd" action="./"><input name="cmd" value="" placeholder="docs info/get hdlc/validation"'), 'on every page, the command it shows the example')
})

test('page: the top; another mrepo; the root; an answer that is an error said on the page; a keyword not there, the nearest as links; where a section is from; an at that is no position refused', async (t) => {
  const exec = execution({ 'docs info/get': { keyword: '.', choices: [{ title: 'base-component-docs', page: '# docs', below: [{ keyword: 'hdlc' }] }] }, 'host info/get': { keyword: '.', choices: [] }, 'host info/get service': new Error('no page here: service'), 'docs info/get hdlc/nope': new Error('no hdlc/nope here: nearest hdlc, below it validation, branches'), '. info/get': { keyword: '.', choices: [{ title: 'base-component-boot', page: 'Boot.' }] } })
  const top = await page(exec, { uri: '' })
  t.alike(exec.asked[0], ['docs', 'info/get'], 'the top: info/get alone')
  t.ok(top.includes('<a href="hdlc">hdlc</a>'))
  const other = await page(exec, { uri: 'service', query: { at: 'host' } })
  t.ok(exec.asked.some(a => a.join(' ') === 'host info/get service'), 'another mrepo, by its position')
  t.ok(other.includes('<p class="error">no page here: service</p>'), 'its error said on the page')
  t.ok(other.includes('<option value="./?at=host">–</option>'), 'its links keep the mrepo')
  const root = await page(exec, { uri: '', query: { at: '.' } })
  t.ok(root.includes('<footer><code>haicc . info/get</code></footer>'), 'the root, as the command line names it')
  const nope = await page(exec, { uri: 'hdlc/nope' })
  t.ok(nope.includes('<div class="near">Nearest: <a href="hdlc">hdlc</a>; below it: <a href="hdlc/validation">hdlc/validation</a>, <a href="hdlc/branches">hdlc/branches</a></div>'), 'a keyword not there: the nearest and what is below it, links')
  const shared = execution({ 'docs info/get haicc/package': { keyword: 'haicc/package', choices: [{ title: 'Package', page: 'A.', below: [], packages: ['haiccing/base-app-haicc'] }, { title: 'Package', page: 'B.', below: [], packages: ['haiccing/base-package-haicc'] }] }, 'docs info/get haicc/test-reports': { keyword: 'haicc/test-reports', choices: [{ title: 'test-reports/', page: 'The proof.', below: [], packages: ['haiccing/a', 'haiccing/b'] }] }, 'docs info/get hdlc': { keyword: 'hdlc', choices: [{ title: 'HDLC', page: 'How.', below: [], packages: ['haiccing/base-docs-hdlc'] }] } })
  t.ok((await page(shared, { uri: 'haicc/package' })).includes('<h1>Package</h1><p class="from">in haiccing/base-app-haicc</p>'), 'several answers: each says where it is from')
  t.ok((await page(shared, { uri: 'haicc/test-reports' })).includes('<p class="from">in 2 packages: haiccing/a, haiccing/b</p>'), 'one page several packages share: said once, its packages')
  t.absent((await page(shared, { uri: 'hdlc' })).includes('class="from"'), 'one answer from one package: nothing to say')
  await t.exception(page(exec, { uri: '', query: { at: '../x' } }), /not an mrepo's position/)
})

// The component's Splectral side as splectral/install leaves it.
function side () {
  const dir = mkdtempSync(join(tmpdir(), 'help-viewer-'))
  const s = join(dir, 'splectral')
  mkdirSync(join(s, 'inbox'), { recursive: true })
  mkdirSync(join(s, 'outbox'), { recursive: true })
  writeFileSync(join(s, 'component.json'), JSON.stringify({ at: 'help', mrepo: 'local/help', component: 'splectral/base-component-help-viewer', list: ['splectral/base-component-help-viewer'] }))
  return { dir, side: s }
}
const put = (folder, key, value) => { writeFileSync(join(folder, `${key}.json.new`), JSON.stringify(value)); renameSync(join(folder, `${key}.json.new`), join(folder, `${key}.json`)) }
const envelope = (key, form) => ({ topic: '/local/help/splectral/inbox', key, timestamp: new Date().toISOString(), headers: {}, value: { topic: '/splectral', key, timestamp: new Date().toISOString(), headers: {}, value: form } })
const taken = (folder, key) => existsSync(join(folder, `${key}.json`)) ? JSON.parse(readFileSync(join(folder, `${key}.json`), 'utf8')) : null

test('render: a page asked in the inbox, the mrepos and its data asked through the outbox, the page answered; answers kept until the install changed; raw never kept; an error said', { timeout: 30000 }, async (t) => {
  const { dir, side: s } = side()
  const inbox = join(s, 'inbox')
  const outbox = join(s, 'outbox')
  const r = render({ side: s, installed: JSON.parse(readFileSync(join(s, 'component.json'), 'utf8')), every: 200 })
  // the server, as far as the test goes: each request in the outbox answered
  const seen = []
  let version = 1
  const server = setInterval(() => {
    for (const name of readdirSync(outbox)) {
      const asked = JSON.parse(readFileSync(join(outbox, name), 'utf8'))
      const form = asked.value.value
      if (form.request === 'page') continue
      rmSync(join(outbox, name))
      seen.push({ ...form, topic: asked.value.topic })
      if (form.request === 'mrepos') put(inbox, asked.key, envelope(asked.key, { ...form, output: { version, mrepos: [{ at: '.', depth: 0 }, { at: 'docs', depth: 1 }] } }))
      else if (form.raw) put(inbox, asked.key, envelope(asked.key, { ...form, output: { keyword: 'hdlc' }, record: '{"value":{"value":{"output":{"keyword":"hdlc"}}}}\n' }))
      else put(inbox, asked.key, envelope(asked.key, { ...form, output: { keyword: form.command[1] ?? '.', choices: [{ title: form.command[1] ?? 'top', page: 'How work is done.' }] } }))
    }
  }, 50)
  const ask = async (key, path, query = {}) => { put(inbox, key, envelope(key, { request: 'page', path, query })); return (await until(() => taken(outbox, key))) ? taken(outbox, key).value.value : null }
  try {
    const key = '11111111-1111-4111-8111-111111111111'
    const done = await ask(key, 'hdlc')
    t.ok(done, 'the page answered under its own key')
    t.absent(existsSync(join(inbox, `${key}.json`)), 'the page request taken from the inbox')
    const asked = seen.map(f => f.request === 'data' ? [f.request, f.at, ...f.command].join(' ') : f.request)
    t.alike([asked[0], ...asked.slice(1).sort()], ['mrepos', 'data docs info/get', 'data docs info/get hdlc'], 'the mrepos first; then the data the page needs, asked at once: a command at a position, this page\'s and the level above')
    t.ok(seen.every(f => f.topic === '/local/help/splectral/inbox'), 'their answers to come back to its inbox')
    t.alike([done.request, done.path], ['page', 'hdlc'], 'the page request, completed')
    t.ok(done.output.includes('<h1>hdlc</h1><p>How work is done.</p>'), 'the page, drawn')
    seen.length = 0
    await ask('33333333-3333-4333-8333-333333333333', 'hdlc')
    t.alike(seen.map(f => f.request), ['mrepos'], 'asked again: the answers kept, only the mrepos asked')
    seen.length = 0
    version = 2
    await ask('44444444-4444-4444-8444-444444444444', 'hdlc')
    t.alike(seen.map(f => f.request), ['mrepos', 'data', 'data'], 'the install changed (its version moved): asked again')
    seen.length = 0
    const raw = await ask('55555555-5555-4555-8555-555555555555', 'hdlc', { raw: '' })
    t.ok(raw.output.includes('<pre class="raw">'), 'raw: the response printed')
    t.alike(seen.filter(f => f.request === 'data').map(f => f.raw ?? false), [true], 'raw: the response asked whole, never kept; the level above kept')
    const bad = '22222222-2222-4222-8222-222222222222'
    put(inbox, bad, envelope(bad, { request: 'page', path: '', query: { at: '../x' } }))
    t.ok(await until(() => taken(outbox, bad)))
    t.is(taken(outbox, bad).value.value.error, 'not an mrepo\'s position: ../x', 'a page that cannot be made: its error')
    t.ok(r.entries().some(e => e.event === 'page'), 'what it logged kept')
  } finally {
    clearInterval(server)
    r.stop()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('the program: its state once it follows its inbox, removed as it ends; ended with its runtime', { timeout: 30000 }, async (t) => {
  const { dir } = side()
  const state = join(dir, 'help-viewer.state.json')
  const runtime = spawn(Bare.argv[0], ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
  const p = spawn(Bare.argv[0], [join(here, 'test', 'program.js'), `--dir=${dir}`, `--state=${state}`, `--runtime=${runtime.pid}`], { stdio: 'ignore' })
  try {
    t.ok(await until(() => existsSync(state), 10000), 'its state written')
    const s = JSON.parse(readFileSync(state, 'utf8'))
    t.alike([s.pid, s.component], [p.pid, 'splectral/base-component-help-viewer'], 'its pid, the component')
    runtime.kill()
    t.ok(await until(() => !alive(p.pid), 10000), 'ended with its runtime')
    t.absent(existsSync(state), 'its state removed')
  } finally {
    // catch: ended already: nothing to signal
    try { runtime.kill() } catch {}
    // catch: ended already: nothing to signal
    try { os.kill(p.pid, 'SIGKILL') } catch {}
    rmSync(dir, { recursive: true, force: true })
  }
})
