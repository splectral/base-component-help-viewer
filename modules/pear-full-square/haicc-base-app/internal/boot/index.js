// deploy and teardown: the machine level, above the root mrepo (README.md
// beside it).
import { existsSync, readdirSync, statSync, rmSync } from 'bare-fs'
import { join } from 'bare-path'
import { spawn, spawnSync } from 'bare-subprocess'
import { sources } from '../sources/index.js'
import { Failure } from '../failure.js'

// haicc boot/deploy: the boot component's bundle, from the sources, run
// with the Bare running this; its exit code.
export async function deploy ({ home, work, bare, org, boot, stdio = 'inherit' }) {
  const s = sources(home)
  const bundle = s.find(`${org}/${boot}.bundle`)
  if (!bundle) throw new Failure(`no ${org}/${boot}.bundle in the sources (haicc sources link <folder>)`, 3)
  const child = spawn(bare, [bundle, `--work=${work}`, ...s.list().map(x => `--sources=${x}`), '--no-follow'], { stdio })
  return new Promise(resolve => child.on('exit', code => resolve(code ?? 1)))
}

// The mrepos of the install: every folder holding a .git under the work
// folder's mrepos/ (each placed by its unique URI, side by side), the root
// last.
function mrepos (work, root) {
  return [...holding(join(work, 'mrepos')).filter(p => p !== root), root]
}
// Every folder holding a .git below one, in name order.
function holding (top) {
  const found = []
  const walk = d => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n)
      let folder = false
      // catch: not there: not a folder
      try { folder = statSync(p).isDirectory() } catch {}
      if (!folder) continue
      if (existsSync(join(p, '.git'))) found.push(p); else walk(p)
    }
  }
  if (existsSync(top)) walk(top)
  return found
}

// The containers of the install: each labelled with a folder under the
// work folder's containers/ (haicc.folder): a replica's (the container
// protocol's, mrepo-base-container) or a pair's (the boot protocol's,
// mrepo-base-boot): each removed, running or not. -> how many
function containers (work) {
  const docker = (...args) => { const r = spawnSync('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] }); return { ok: r.status === 0, out: (r.stdout ?? '').toString().trim() } }
  let removed = 0
  // each container labelled with a folder under containers/: a replica's
  // (its folder), a pair's (the container's haicc home, the .git folders
  // deeper inside it)
  const top = join(work, 'containers')
  if (!existsSync(top)) return 0
  const found = docker('ps', '-a', '--filter', 'label=haicc.folder', '--format', '{{.ID}} {{.Label "haicc.folder"}}')
  if (!found.ok) throw new Failure(`Docker does not answer: the containers under ${top} are not removed`, 1)
  for (const line of found.out.split('\n').filter(Boolean)) {
    const [id, folder] = [line.slice(0, line.indexOf(' ')), line.slice(line.indexOf(' ') + 1)]
    if (!folder.startsWith(top + '/')) continue
    if (!docker('rm', '-f', id).ok) throw new Failure(`a container under ${work} was not removed: ${id}`, 1)
    removed++
  }
  return removed
}

// haicc boot/teardown: every runtime of the install stopped, the
// replicas' containers removed, then what boot/deploy put in place
// removed; what was done.
export async function teardown ({ work, root }) {
  if (!existsSync(root)) throw new Failure(`no boot mrepo at ${work} (nothing to tear down)`, 3)
  // the runtime's library only here: nothing else of the app needs it
  const { stop } = await import('mrepo-base-runtime')
  let runtimes = 0
  for (const dir of mrepos(work, root)) {
    try { if (await stop({ repo: dir })) runtimes++ } catch (err) { throw new Failure(`a runtime under ${work} did not stop`, 1, { cause: err }) }
  }
  const replicas = containers(work)
  // what boot/deploy put in place, and what was made below it, by name:
  // nothing else in the work folder
  for (const n of ['mrepos', 'containers', 'packages', 'mrepo.json']) rmSync(join(work, n), { recursive: true, force: true })
  return { tornDown: '.', runtimes, containers: replicas, work }
}

// The machine level's protocols, their actions.
export const MACHINE = { boot: { deploy, teardown } }
