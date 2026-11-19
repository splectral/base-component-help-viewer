import test from 'brittle'
import os from 'bare-os'
import { spawn } from 'bare-subprocess'
import { mkdtempSync, mkdirSync, writeFileSync, renameSync, readFileSync, readdirSync, rmSync, existsSync } from 'bare-fs'
import { join, dirname } from 'bare-path'
import { tmpdir } from 'bare-os'
import { fileURLToPath } from 'bare-url'
import { markdown, inline, escape, draw, page, DEFAULT, render } from '../index.js'

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
})

test('draw: a whole page, its sections, the keywords below as links; no page given refused', (t) => {
  const html = draw({ title: 'Validation', crumbs: [{ label: 'docs', href: '/v' }, { label: 'validation' }], sections: [{ title: 'Validation', markdown: '# Validation\n\nBefore **every** commit.', below: [{ label: 'hdlc/test', href: '/v/hdlc/test', oneliner: 'The `tests`.' }] }], footer: 'at `docs`' })
  t.ok(html.startsWith('<!doctype html>'), 'a whole page')
  t.ok(html.includes('<title>Validation</title>'))
  t.ok(html.includes('<nav class="crumbs"><a href="/v">docs</a> / validation</nav>'), 'where it is')
  t.ok(html.includes('<h1>Validation</h1><p>Before <strong>every</strong> commit.</p>'), 'its section: the page\'s own heading not repeated')
  t.ok(html.includes('<a href="/v/hdlc/test">hdlc/test</a><div class="one">The <code>tests</code>.</div>'), 'a keyword below, a link, its one-liner')
  t.ok(html.includes('prefers-color-scheme:dark'), 'its style with it, light and dark')
  t.absent(/<(script|link)\b/.test(html), 'nothing loaded from elsewhere, no script')
  t.ok(draw({ title: 'x', error: 'no <answer>' }).includes('<p class="error">no &lt;answer&gt;</p>'), 'an error said')
  t.exception(() => draw(), /missing argument: page/)
})

// An execution as the program hands one: the data asked for, recorded.
function execution (answers) {
  const asked = []
  return {
    asked,
    data: async (at, command) => { asked.push([at, ...command]); const a = answers[`${at} ${command.join(' ')}`]; if (a instanceof Error) throw a; return a },
    log () {}
  }
}

test('page: the keywords asked of the docs mrepo, drawn; links to the same view; the command it shows', async (t) => {
  const exec = execution({ 'docs info/get hdlc/validation': { keyword: 'hdlc/validation', choices: [{ title: 'Validation', page: 'Before every commit.', below: [{ keyword: 'hdlc/validation/x', oneliner: 'X.' }] }] } })
  const html = await page(exec, { uri: 'hdlc/validation', query: {}, base: '/help' })
  t.is(DEFAULT, 'docs')
  t.alike(exec.asked, [['docs', 'info/get', 'hdlc/validation']], 'its data: info/get at the docs mrepo, the keywords as the command line has them')
  t.ok(html.includes('<title>hdlc/validation · docs</title>'), 'its title: the keywords and the mrepo')
  t.ok(html.includes('<nav class="crumbs"><a href="/help/">docs</a> / <a href="/help/hdlc">hdlc</a> / validation</nav>'), 'where it is, from the top')
  t.ok(html.includes('<h1>Validation</h1><p>Before every commit.</p>'), 'a choice a section')
  t.ok(html.includes('<a href="/help/hdlc/validation/x">hdlc/validation/x</a><div class="one">X.</div>'), 'the keywords below, links to the same view')
  t.ok(html.includes('<footer><code>haicc docs info/get hdlc/validation</code></footer>'), 'the command it shows')
})

test('page: the top; another mrepo; an answer that is an error said on the page; an at that is no position refused', async (t) => {
  const exec = execution({ 'docs info/get': { keyword: '.', choices: [{ title: 'base-component-docs', page: '# docs', below: [{ keyword: 'hdlc' }] }] }, 'host info/get service': new Error('no page here: service') })
  const top = await page(exec, { uri: '', base: '/help' })
  t.alike(exec.asked[0], ['docs', 'info/get'], 'the top: info/get alone')
  t.ok(top.includes('<a href="/help/hdlc">hdlc</a>'))
  const other = await page(exec, { uri: 'service', query: { at: 'host' }, base: '/help' })
  t.alike(exec.asked[1], ['host', 'info/get', 'service'], 'another mrepo, by its position')
  t.ok(other.includes('<p class="error">no page here: service</p>'), 'its error said on the page')
  t.ok(other.includes('<a href="/help/?at=host">host</a>'), 'its links keep the mrepo')
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

test('render: a page asked in the inbox, its data asked through the outbox, the page answered; an error said', { timeout: 30000 }, async (t) => {
  const { dir, side: s } = side()
  const inbox = join(s, 'inbox')
  const outbox = join(s, 'outbox')
  const r = render({ side: s, installed: JSON.parse(readFileSync(join(s, 'component.json'), 'utf8')), every: 200 })
  try {
    const key = '11111111-1111-4111-8111-111111111111'
    put(inbox, key, envelope(key, { request: 'page', path: 'hdlc', query: {}, base: '/help' }))
    t.ok(await until(() => readdirSync(outbox).length === 1), 'a data request in its outbox')
    t.absent(existsSync(join(inbox, `${key}.json`)), 'the page request taken from the inbox')
    const name = readdirSync(outbox)[0]
    const asked = JSON.parse(readFileSync(join(outbox, name), 'utf8'))
    t.alike(asked.value.value, { request: 'data', at: 'docs', command: ['info/get', 'hdlc'] }, 'the data the page needs: a command at a position')
    t.is(asked.value.topic, '/local/help/splectral/inbox', 'its answer to come back to its inbox')
    rmSync(join(outbox, name))
    // the platform's answer, as the server writes it
    put(inbox, asked.key, envelope(asked.key, { ...asked.value.value, output: { keyword: 'hdlc', choices: [{ title: 'HDLC', page: 'How work is done.' }] } }))
    t.ok(await until(() => taken(outbox, key)), 'the page answered under its own key')
    const done = taken(outbox, key).value.value
    t.alike([done.request, done.path, done.base], ['page', 'hdlc', '/help'], 'the page request, completed')
    t.ok(done.output.includes('<h1>HDLC</h1><p>How work is done.</p>'), 'the page, drawn')
    const bad = '22222222-2222-4222-8222-222222222222'
    put(inbox, bad, envelope(bad, { request: 'page', path: '', query: { at: '../x' }, base: '/help' }))
    t.ok(await until(() => taken(outbox, bad)))
    t.is(taken(outbox, bad).value.value.error, 'not an mrepo\'s position: ../x', 'a page that cannot be made: its error')
    t.ok(r.entries().some(e => e.event === 'page'), 'what it logged kept')
  } finally {
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
