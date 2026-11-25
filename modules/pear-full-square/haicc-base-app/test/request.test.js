// A command sent: its record in the mrepo's inbox folder, value by value;
// its response waited for in the outbox folder.
import test from 'brittle'
import { mkdtempSync, mkdirSync, rmSync, readFileSync, existsSync } from 'bare-fs'
import { inboxOf, outboxOf, nameOf } from 'mrepo-base-request'
import { tmpdir } from 'bare-os'
import { join } from 'bare-path'
import { request, Failure } from '../index.js'

// An mrepo's folder, its two boxes; answer(): the first record in its inbox
// answered in its outbox, as a runtime would (the envelope read, returned).
function mrepo () {
  const root = mkdtempSync(join(tmpdir(), 'haicc-app-'))
  mkdirSync(join(root, 'inbox')); mkdirSync(join(root, 'outbox'))
  const answer = (result, after = 50) => new Promise(resolve => {
    const t = setInterval(() => {
      const arrived = inboxOf(root).list()
      if (!arrived.length) return
      clearInterval(t)
      const envelope = inboxOf(root).read(arrived[0])
      setTimeout(() => {
        outboxOf(root).put(arrived[0], { topic: '/outbox', offset: envelope.offset, timestamp: 'now', headers: {}, value: { ...envelope.value, value: { command: envelope.value.value, ...result } } })
        resolve({ arrived, envelope })
      }, after)
    }, 20)
  })
  return { root, answer, remove: () => rmSync(root, { recursive: true, force: true }) }
}

test('request: the record written, value by value; its response read as stored', async (t) => {
  const m = mrepo()
  try {
    const answered = m.answer({ output: { ok: 1 } })
    const r = await request(m.root, ['boot/deploy', 'host', 'a "b" c'], { uri: 'local/boot', reply: '/haicc/terminal', timeout: 5, every: 20 })
    const { arrived, envelope } = await answered
    t.alike(arrived.map(nameOf), [r.key], 'one record in the inbox folder, named by its offset')
    t.ok(/^\d{13}$/.test(r.key) && Math.abs(Number(r.key) - Date.now()) < 60000, 'its offset: the milliseconds when it arrived, given as it was dropped')
    t.ok(existsSync(join(m.root, 'inbox', r.key.slice(0, 5), r.key.slice(0, 6), `${r.key}.json`)), 'a streaming folder: in its buckets, nothing half written beside it')
    t.alike(Object.keys(envelope), ['topic', 'offset', 'timestamp', 'headers', 'value'], 'an envelope: a record')
    t.is(envelope.topic, '/local/boot/inbox', "addressed to the mrepo's inbox, by its unique URI")
    t.is(nameOf(envelope.offset), r.key, 'its offset the request\'s')
    t.alike(envelope.headers, {}, 'its headers empty')
    t.ok(!isNaN(Date.parse(envelope.timestamp)), 'its timestamp a time')
    const core = envelope.value
    t.alike(Object.keys(core).sort(), ['headers', 'offset', 'timestamp', 'topic', 'value'], 'its value the core: a record')
    t.is(core.topic, '/haicc/terminal', 'the core addressed back: where the completed form is to arrive')
    t.is(core.offset, envelope.offset, 'the same offset')
    t.alike(core.headers, { trigger: 'external' }, 'its headers: triggered from outside, a terminal')
    t.alike(core.value, ['boot/deploy', 'host', 'a "b" c'], 'its value the command: the parts as given, unnamed')
    t.is(r.text, readFileSync(outboxOf(m.root).fileOf(Number(r.key)), 'utf8'), 'the response: the record in the outbox folder under the same offset, as stored')
    t.alike(JSON.parse(r.text).value.value.output, { ok: 1 })
  } finally { m.remove() }
})

test('request: its response seen as it arrives: the outbox folder watched, not looked at on a clock', async (t) => {
  const m = mrepo()
  try {
    const answered = m.answer({ output: { ok: 2 } }, 100)
    const began = Date.now()
    // (a look only every 5 s: without the watching this would end in no response)
    const r = await request(m.root, ['help/get'], { uri: 'local/boot', reply: '/haicc/terminal', timeout: 3, every: 5000 })
    await answered
    t.alike(JSON.parse(r.text).value.value.output, { ok: 2 }, 'the response read')
    t.ok(Date.now() - began < 2500, 'well before the next look: it was told')
  } finally { m.remove() }
})

test('request: no response in time: exit 4, the offset said; the request stays', async (t) => {
  const m = mrepo()
  try {
    let failure = null
    try { await request(m.root, ['help/get'], { uri: 'local/boot', reply: '/haicc/terminal', timeout: 0.2, every: 20 }) } catch (err) { failure = err }
    t.ok(failure instanceof Failure && failure.code === 4, 'exit 4')
    const [stays] = inboxOf(m.root).list()
    t.is(failure.message, `no response in 0.2 s (the request stays: ${nameOf(stays)})`, 'said, with its offset')
  } finally { m.remove() }
})
