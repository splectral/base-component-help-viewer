// output(home): the width a printed record is fitted to, and the haicc
// output command (README.md beside it).
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from 'bare-fs'
import { join } from 'bare-path'
import { Failure } from '../failure.js'

// The width set, in haicc's own folder: a number; no file: auto.
export const WIDTH = 'output.width'
// The width when nothing says one: the output is no terminal.
export const DEFAULT = 80

const USAGE = 'haicc output [<width> | auto]'

// widthOf(home, columns): the width in force, and where it comes from:
// set (haicc output <width>), the terminal's (columns: its width now, null
// when the output is none), or the default.
export function widthOf (home, columns = null) {
  const file = join(home, WIDTH)
  const set = existsSync(file) ? Number(readFileSync(file, 'utf8').trim()) : NaN
  if (Number.isInteger(set) && set > 0) return { width: set, from: 'set' }
  return columns > 0 ? { width: columns, from: 'terminal' } : { width: DEFAULT, from: 'default' }
}

const said = ({ width, from }) => (from === 'set'
  ? `${width} (set: haicc output auto for the terminal's width)`
  : from === 'terminal' ? `auto: ${width} (the terminal's width)` : `auto: ${width} (the output is no terminal)`)

// haicc output <argument>: what it prints, a line.
export function outputCommand (home, args, columns = null) {
  const file = join(home, WIDTH)
  const [what, ...rest] = args
  if (rest.length) throw new Failure(USAGE, 2)
  if (what === undefined) return [said(widthOf(home, columns))]
  if (what === 'auto') { rmSync(file, { force: true }); return [said(widthOf(home, columns))] }
  if (!/^[1-9][0-9]*$/.test(what)) throw new Failure(`${USAGE} (a width: a number of characters, or auto)`, 2)
  writeFileSync(`${file}.part`, `${what}\n`)
  renameSync(`${file}.part`, file)
  return [said(widthOf(home, columns))]
}
