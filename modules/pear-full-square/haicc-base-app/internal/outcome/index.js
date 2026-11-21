// outcome(text): a response record's completed form, its output or its
// error (README.md beside it).
// A continuation as a response holds one: { at, script }, the position it
// is run for and its script, shell text; anything else is none.
const continuationOf = c => (c && typeof c === 'object' && typeof c.at === 'string' && c.at && typeof c.script === 'string' && c.script.trim() ? { at: c.at, script: c.script } : null)

export function outcome (text) {
  let form = null
  // catch: not a record: no outcome to tell (the caller says so)
  try { form = JSON.parse(text)?.value?.value } catch { return null }
  if (!form || typeof form !== 'object' || Array.isArray(form)) return null
  if ('error' in form) return { error: (typeof form.error === 'string' ? form.error : JSON.stringify(form.error)).replace(/\n/g, ' ') }
  // (with an output, a continuation: a script to go on with: { at, script })
  if ('output' in form) return { output: form.output, ...(continuationOf(form.continuation) ? { continuation: continuationOf(form.continuation) } : {}) }
  return null
}
