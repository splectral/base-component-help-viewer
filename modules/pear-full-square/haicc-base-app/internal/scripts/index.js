// scripts: the install's script files, <work>/scripts, read by name, and
// the haicc scripts command that lists them (README.md beside it).
import { existsSync, readFileSync, readdirSync, statSync } from 'bare-fs'
import { join } from 'bare-path'
import { SCRIPTS } from 'mrepo-base-request'
import { Failure } from '../failure.js'

const NAME = /^[a-z][a-z0-9-]*$/

// A script's file by its name: <name> (the user's) or <org>/<package>/<name>
// (a package's); a name, never a path.
export function scriptPath (work, name) {
  const parts = String(name ?? '').split('/')
  if (!(parts.length === 1 || parts.length === 3) || !parts.every(p => NAME.test(p))) throw new Failure(`not a script's name: ${name} (<name>, or <org>/<package>/<name>)`, 2)
  return join(work, SCRIPTS, ...parts.slice(0, -1), `${parts.at(-1)}.haicc`)
}

// Its lines, as they are in the file.
export function readScript (work, name) {
  const file = scriptPath(work, name)
  if (!existsSync(file)) throw new Failure(`no script: ${name} (${file})`, 3)
  return readFileSync(file, 'utf8')
}

// The names of the scripts there, sorted: the user's, then each package's.
export function scriptNames (work) {
  const root = join(work, SCRIPTS)
  if (!existsSync(root)) return []
  const dirs = d => (existsSync(d) ? readdirSync(d).filter(n => statSync(join(d, n)).isDirectory()).sort() : [])
  const files = d => readdirSync(d).filter(n => n.endsWith('.haicc') && NAME.test(n.slice(0, -'.haicc'.length))).map(n => n.slice(0, -'.haicc'.length)).sort()
  const out = files(root)
  for (const org of dirs(root)) for (const pkg of dirs(join(root, org))) for (const n of files(join(root, org, pkg))) out.push(`${org}/${pkg}/${n}`)
  return out
}

// haicc scripts: the names, a line each. -> the lines to print
export function scriptsCommand (work, args) {
  if (args.length) throw new Failure('haicc scripts (no arguments: the install\'s scripts listed)', 2)
  return scriptNames(work)
}

// A command's haicc/file <URI> <name> made haicc/script <URI> '<its lines>':
// the terminal reads the install's file, the mrepo gets the lines.
export function withFile (work, parts) {
  const i = parts.indexOf('haicc/file')
  if (i < 0) return parts
  if (parts.length < i + 3) throw new Failure('haicc <URI> haicc/file <URI> <name> (the URI where its lines run, then the script\'s name)', 2)
  return [...parts.slice(0, i), 'haicc/script', parts[i + 1], readScript(work, parts[i + 2]), ...parts.slice(i + 3)]
}
