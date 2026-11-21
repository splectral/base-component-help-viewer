// command(argv): what a command line asks for (README.md beside it).
import { Failure } from '../failure.js'
import { MACHINE } from '../boot/index.js'

// The commands that are neither for the mrepos nor the machine level.
const OWN = ['sources', 'output', 'scripts']
const USAGE = ['help', '--help', '-h']
// (a word that could be a position: the command a URI wants said too)
const none = name => new Failure(/^[a-z][a-z0-9-]*$/.test(name) ? `no command '${name}' (haicc --help; a URI is followed by its command: haicc ${name} info/get)` : `no command '${name}' (haicc --help)`, 2)
// A position written as the root: `.`, or `./` and nothing after.
export const isRoot = uri => uri.replace(/^(\.\/)+/, '') === '.' || uri.replace(/^(\.\/)+/, '') === ''

// A request's flags: a list after a URI, after this word: that step's.
const FLAGS = '--flags'
const END = '--'

function forMrepos (args, print) {
  if (args[0] === FLAGS) throw new Failure(`haicc <URI> ${FLAGS} <flag>... ${END} <protocol>/<action> ... (flags follow a URI: they are that step's)`, 2)
  const [uri, ...parts] = args
  if (!parts.length) throw new Failure('haicc <URI> <protocol>/<action> <argument>... (a command follows the URI)', 2)
  // at the root the command is written plain; anywhere else, and where
  // flags follow the URI (they are the step's at that position), the haicc
  // command goes as it is, and the root mrepo resolves the position
  return { kind: 'request', uri, parts: isRoot(uri) && parts[0] !== FLAGS ? parts : ['haicc', uri, ...parts], print }
}

export function command (argv) {
  const [first = '', ...rest] = argv
  if (first === '--output' || first === '--raw') {
    if (!rest.length) throw new Failure(`${first} goes before a URI`, 2)
    return forMrepos(rest, first.slice(2))
  }
  if (first === FLAGS) return forMrepos(argv, null)
  if (first === '' || (USAGE.includes(first) && !rest.length)) return { kind: 'usage' }
  // the machine level: a protocol and its action, no URI before them
  const actions = p => Object.keys(MACHINE[p]).sort()
  const [protocol, action] = first.includes('/') ? [first.slice(0, first.indexOf('/')), first.slice(first.indexOf('/') + 1)] : [first, null]
  if (MACHINE[protocol]) {
    if (action === null) throw new Failure(actions(protocol).map(a => `haicc ${protocol}/${a}`).join(', '), 2)
    if (!MACHINE[protocol][action]) throw new Failure(`no action: ${protocol} ${action} (${actions(protocol).join(', ')})`, 2)
    if (rest.length) throw new Failure(`haicc ${protocol}/${action} (no arguments)`, 2)
    return { kind: 'machine', protocol, action }
  }
  if (OWN.includes(first)) return { kind: first, args: rest }
  // anything else is a URI: a position, and the command that follows it
  if (!rest.length) throw first === '.' || first.includes('/') ? new Failure('haicc <URI> <protocol>/<action> <argument>... (a command follows the URI)', 2) : none(first)
  return forMrepos(argv, null)
}
