// request(root, parts, { uri, reply, timeout }): a command sent to an
// mrepo, its response waited for (README.md beside it).
import { record, drop, answered, nameOf } from 'mrepo-base-request'
import { Failure } from '../failure.js'

export async function request (root, parts, { uri, reply, timeout = 120, every = 200 }) {
  // the command, in its core (where the completed form goes back), in an
  // envelope addressed to the mrepo's inbox: dropped as everyone drops a
  // record, its offset given as it arrives (the folder's lock), the file
  // written whole: the runtime never sees half of one
  const offset = drop(root, uri, { ...record(reply, parts), headers: { trigger: 'external' } })
  // its response: the completed form, in the outbox folder under the same
  // offset, waited for by watching the folder: looked at when something is
  // written there, and every `every` all the same (an event missed, a
  // folder that cannot be watched)
  const text = await answered(root, offset, { timeout, every })
  if (text === null) throw new Failure(`no response in ${timeout} s (the request stays: ${nameOf(offset)})`, 4)
  return { key: nameOf(offset), text }
}
