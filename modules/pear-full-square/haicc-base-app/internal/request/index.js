// request(root, parts, { uri, reply, timeout }): a command sent to an
// mrepo, its response waited for (README.md beside it).
import { existsSync, readFileSync, watch } from 'bare-fs'
import { join } from 'bare-path'
import { record, wrap, guid, inboxOf } from 'mrepo-base-request'
import { Failure } from '../failure.js'

export async function request (root, parts, { uri, reply, timeout = 120, every = 200 }) {
  const key = guid()
  // the command, in its core (where the completed form goes back), in an
  // envelope addressed to the mrepo's inbox; written whole, then renamed
  // into place (the folder's write): the runtime never sees half of one
  inboxOf(root).write(key, wrap(`/${uri}/inbox`, { ...record(reply, parts, key), headers: { trigger: 'external' } }))
  // its response: the completed form, in the outbox folder under the same key
  // waited for by watching the folder: looked at when something is written
  // there, and every `every` all the same (an event missed, a folder that
  // cannot be watched)
  const back = join(root, 'outbox', `${key}.json`)
  let arrived = () => {}
  let watcher = null
  // catch: a folder that cannot be watched is looked at instead: every `every`
  try { watcher = watch(join(root, 'outbox'), () => arrived()); watcher.on('error', () => {}) } catch {}
  try {
    for (const end = Date.now() + timeout * 1000; !existsSync(back);) {
      if (Date.now() >= end) throw new Failure(`no response in ${timeout} s (the request stays: ${key})`, 4)
      await new Promise(resolve => { const t = setTimeout(resolve, Math.min(every, Math.max(0, end - Date.now()))); arrived = () => { clearTimeout(t); resolve() } })
    }
    return { key, text: readFileSync(back, 'utf8') }
  } finally { watcher?.close() }
}
