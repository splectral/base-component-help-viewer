// render: the component's Splectral inbox followed, each page made, the
// data it needs asked of the platform (README.md beside it).
import { rmSync } from 'bare-fs'
import { join } from 'bare-path'
import { record, wrap, guid, outboxOf } from 'mrepo-base-request'
import { follow, TOPIC, SIDE } from 'splectral-server'
import { page } from '../page/index.js'

const completed = form => form && typeof form === 'object' && ('output' in form || 'error' in form)

// side: the component's Splectral side; installed: its record
// (component.json, splectral/install's). -> { stop, entries }
export function render ({ side, installed, timeout = 120, every = 2000 }) {
  const pending = new Map()
  const entries = []
  // the answers kept, by mrepo and command: the platform's data does not
  // change while the install does not; dropped when the server says it did
  const kept = new Map()
  let version = null
  // (into the outbox, to the server: the core's topic where its answer goes)
  const out = (key, form, topic) => outboxOf(side).write(key, wrap(TOPIC, { ...record(topic, form, key) }))
  // A request to the server, its completed form back in the inbox.
  const asked = (form, what) => {
    const key = guid()
    const answered = new Promise((resolve, reject) => {
      const t = setTimeout(() => { pending.delete(key); reject(new Error(`no answer in ${timeout} s: ${what}`)) }, timeout * 1000)
      pending.set(key, done => { clearTimeout(t); pending.delete(key); resolve(done) })
    })
    out(key, form, `/${installed.mrepo}/${SIDE}/inbox`)
    return answered
  }
  // An execution as the page sees it: the install's mrepos, its data asked
  // of the platform (kept), a command's response whole (never kept), its log.
  const execution = () => ({
    log: (level, event, data = {}) => entries.push({ level, event, time: new Date().toISOString(), ...data }),
    async mrepos () {
      const done = await asked({ request: 'mrepos' }, 'the mrepos')
      if ('error' in done) throw new Error(done.error)
      if (done.output?.version !== version) { kept.clear(); version = done.output?.version ?? null }
      return done.output
    },
    data (at, command) {
      const id = JSON.stringify([at, command])
      if (!kept.has(id)) {
        const answer = asked({ request: 'data', at, command }, `${at} ${command.join(' ')}`).then(done => { if ('error' in done) throw new Error(done.error); return done.output })
        kept.set(id, answer)
        // catch: an error is not kept, asked again the next time (the page says it)
        answer.catch(() => kept.delete(id))
      }
      return kept.get(id)
    },
    async record (at, command) {
      const done = await asked({ request: 'data', at, command, raw: true }, `${at} ${command.join(' ')}`)
      if (typeof done.record !== 'string') throw new Error(done.error ?? `no response: ${at} ${command.join(' ')}`)
      return done.record
    }
  })
  const following = follow(join(side, 'inbox'), (envelope, file) => {
    rmSync(join(side, 'inbox', file), { force: true })
    const form = envelope?.value?.value
    if ((form?.request === 'data' || form?.request === 'mrepos') && completed(form)) return pending.get(envelope.key)?.(form)
    if (form?.request !== 'page' || completed(form)) return
    const exec = execution()
    const started = Date.now()
    Promise.resolve()
      .then(() => page(exec, { uri: form.path ?? '', query: form.query ?? {} }))
      .then(output => ({ output: String(output ?? '') }), err => ({ error: err.message }))
      .then(done => {
        exec.log('info', 'page', { path: form.path ?? '', ms: Date.now() - started, ok: !('error' in done) })
        out(envelope.key, { ...form, ...done }, envelope.value.topic)
      })
  }, { every })
  return { stop: () => following.stop(), entries: () => [...entries] }
}
