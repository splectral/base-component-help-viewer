// unpack(text, width): a record unpacked across lines, in a compact form
// (README.md beside it). A scanner over the text as it is stored, not a
// parser: it follows strings and depth, and changes nothing of it.
export function unpack (text, width = 80) {
  const s = text.replace(/\n/g, '')
  const n = s.length
  // the matching end of each container (strings passed over)
  const shut = new Map()
  const open = []
  let instr = false
  let esc = false
  for (let i = 0; i < n; i++) {
    const c = s[i]
    if (instr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') instr = false; continue }
    if (c === '"') instr = true
    else if (c === '{' || c === '[') open.push(i)
    else if (c === '}' || c === ']') shut.set(open.pop(), i)
  }
  const skip = i => { while (i < n && (s[i] === ' ' || s[i] === '\t')) i++; return i }
  // where the value starting at i ends
  const end = i => {
    const c = s[i]
    if (c === '{' || c === '[') return shut.get(i) ?? n - 1
    if (c === '"') {
      let e = false
      for (let j = i + 1; j < n; j++) {
        if (e) e = false
        else if (s[j] === '\\') e = true
        else if (s[j] === '"') return j
      }
      return n - 1
    }
    for (let j = i; j < n; j++) if (s[j] === ',' || s[j] === '}' || s[j] === ']') return j - 1
    return n - 1
  }
  let out = ''
  const container = i => (s[i] === '{' || s[i] === '[')
  // the value at i..e: ind the indentation of the line it is on, col the
  // column it starts at. One that fits stays as stored; one opened puts
  // its entries on lines of their own, packed: as many on a line as fit
  // the width, separated by `, `; an entry is never split, and one that
  // does not fit on a line of its own is opened below.
  const emit = (i, e, ind, col) => {
    const c = s[i]
    if (!container(i) || e - i + 1 + col <= width || e === i + 1) { out += s.slice(i, e + 1); return }
    out += c + '\n'
    const pad = ' '.repeat(ind + 2)
    let line = ''
    const flush = () => { if (line) { out += pad + line + '\n'; line = '' } }
    let p = skip(i + 1)
    while (p < e) {
      let head = ''
      let v = p
      if (c === '{') {
        const ke = end(p)
        head = `${s.slice(p, ke + 1)}: `
        v = skip(skip(ke + 1) + 1) // past the colon
      }
      const ve = end(v)
      p = skip(ve + 1)
      const more = s[p] === ','
      if (more) p = skip(p + 1)
      const whole = head + s.slice(v, ve + 1) + (more ? ',' : '')
      if (pad.length + whole.length <= width || !container(v) || ve === v + 1) {
        if (line && pad.length + line.length + 1 + whole.length > width) flush()
        line += (line ? ' ' : '') + whole
      } else {
        flush()
        out += pad + head
        emit(v, ve, ind + 2, pad.length + head.length)
        out += (more ? ',' : '') + '\n'
      }
    }
    flush()
    out += ' '.repeat(ind) + s[e]
  }
  const i = skip(0)
  if (i >= n) return ''
  emit(i, end(i), 0, 0)
  return out
}
