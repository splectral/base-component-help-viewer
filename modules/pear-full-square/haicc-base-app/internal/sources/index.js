// sources(home): the sources registered, and the haicc sources command
// (README.md beside it).
import { existsSync, readFileSync, writeFileSync, renameSync, statSync } from 'bare-fs'
import { join, resolve } from 'bare-path'
import { Failure } from '../failure.js'

// The list's file, in haicc's own folder: a line a source, folder:<path>
// or github:<org>.
export const LIST = 'sources.list'
// catch: not there: not a folder
const isFolder = f => { try { return statSync(f).isDirectory() } catch { return false } }

export function sources (home) {
  const file = join(home, LIST)
  const lines = () => existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []
  const write = l => { writeFileSync(`${file}.part`, l.map(x => `${x}\n`).join('')); renameSync(`${file}.part`, file) }
  const self = {
    // the folders first, in the order they were linked, then https, the backup
    list: () => [...lines().filter(l => l.startsWith('folder:')), ...lines().filter(l => !l.startsWith('folder:'))],
    folders: () => lines().filter(l => l.startsWith('folder:')).map(l => l.slice('folder:'.length)),
    // a file (relative to a source) in the first folder that holds it
    find: name => self.folders().map(d => join(d, name)).find(f => existsSync(f)) ?? null,
    register: entry => { if (!lines().includes(entry)) write([...lines(), entry]) },
    unregister: entry => { if (existsSync(file)) write(lines().filter(l => l !== entry)) }
  }
  return self
}

const USAGE = 'haicc sources [unlink <folder> | download <org>... | https [<org>...] | no-https [<org>...]]'
// An organisation's name: <org>
const ORG = /^[a-z][a-z0-9-]*$/

// haicc sources <action> <argument>...: what it prints, a line each.
export function sourcesCommand (home, args, { org, err = () => {} }) {
  const s = sources(home)
  const [action = 'list', ...rest] = args
  switch (action) {
    case 'list':
      if (rest.length) throw new Failure(USAGE, 2)
      return s.list()
    case 'unlink':
      if (rest.length !== 1) throw new Failure('haicc sources unlink <folder>', 2)
      s.unregister(`folder:${isFolder(rest[0]) ? resolve(rest[0]) : rest[0]}`)
      return s.list()
    case 'https': {
      // each organisation named, haicc's own when none is
      const orgs = rest.length ? rest : [org]
      for (const o of orgs) if (!ORG.test(o)) throw new Failure(`haicc sources https [<org>...] (not an organisation: ${o})`, 2)
      for (const o of orgs) s.register(`github:${o}`)
      return s.list()
    }
    case 'no-https': {
      // each organisation named, every one when none is
      for (const o of rest) if (!ORG.test(o)) throw new Failure(`haicc sources no-https [<org>...] (not an organisation: ${o})`, 2)
      for (const l of s.list().filter(l => l.startsWith('github:') && (!rest.length || rest.includes(l.slice('github:'.length))))) s.unregister(l)
      return s.list()
    }
    case 'download': {
      // what the first step (sh, before Bare) fetches never comes here:
      // bare, third-party and the organisations; a package alone is never
      // downloaded
      if (!rest.length) throw new Failure('haicc sources download bare|<org>...', 2)
      for (const what of rest) {
        if (what.includes('/')) err(`haicc: ${what}: a package is not downloaded alone; its organisation is (haicc sources download ${what.split('/')[0]})`)
        else if (what === 'bare' || what === 'third-party' || ORG.test(what)) err(`haicc: ${what}: fetched before the app (haicc sources download ${what})`)
        else err(`haicc: nothing to download for '${what}' (bare, <org>)`)
      }
      throw new Failure('', 3)
    }
    default:
      throw new Failure(USAGE, 2)
  }
}
