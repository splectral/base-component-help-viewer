// The command line read: what each form asks for, and what is refused.
import test from 'brittle'
import { command, Failure } from '../index.js'

const refused = (t, argv, code, said) => {
  try { command(argv); t.fail(`not refused: haicc ${argv.join(' ')}`) } catch (err) {
    t.ok(err instanceof Failure && err.code === code && err.message === said, `haicc ${argv.join(' ')}: exit ${code}, ${said}`)
    if (err.message !== said) t.comment(`said: ${err.message}`)
  }
}

test('a command for the mrepos: at the root written plain, elsewhere the haicc command as it is', (t) => {
  t.alike(command(['./', 'help/get']).parts, ['help/get'], './ alone: the root too')
  t.alike(command(['./sources', 'help/get']).parts, ['haicc', './sources', 'help/get'], 'a position named like a command of haicc itself: ./ in front, sent as typed')
  t.alike(command(['sources', 'unlink', 'x']).kind, 'sources', 'without it: the command')
  t.alike(command(['help', 'service/start']).parts, ['haicc', 'help', 'service/start'], 'a position named help, a command after it: a URI')
  t.alike(command(['test/mydata/users', 'users/check-addresses', '*']).parts, ['haicc', 'test/mydata/users', 'users/check-addresses', '*'], 'a deeper position')
  t.alike(command(['/host', 'service/start']).parts, ['haicc', '/host', 'service/start'], 'a leading slash: sent as typed, for the mrepo to refuse')
  t.alike(command(['.', 'boot/deploy', 'host', 'haiccing/base-component-haicc']), { kind: 'request', uri: '.', parts: ['boot/deploy', 'host', 'haiccing/base-component-haicc'], print: null }, 'at the root: the command plain')
  t.alike(command(['host', 'service/start']), { kind: 'request', uri: 'host', parts: ['haicc', 'host', 'service/start'], print: null }, 'elsewhere: haicc <URI> <command>')
  t.alike(command(['host', 'haicc', 'node-1', 'help/get', '.']).parts, ['haicc', 'host', 'haicc', 'node-1', 'help/get', '.'], 'chained: the parts as typed')
  t.alike(command(['.', 'help/get', '.', 'packages', 'no "such" section']).parts, ['help/get', '.', 'packages', 'no "such" section'], 'an argument with spaces and quotes: one part')
  t.alike(command(['host', 'crud/read', 'swarms', '--flags', 'log=debug']).parts, ['haicc', 'host', 'crud/read', 'swarms', '--flags', 'log=debug'], 'flags after the last command\'s URI: among its parts, as typed')
  t.alike(command(['.', 'crud/read', 'swarms', '--flags', 'log=debug', '--', 'x']).parts, ['crud/read', 'swarms', '--flags', 'log=debug', '--', 'x'], 'at the root too')
  t.alike(command(['host', '--flags', 'log=debug', '--', 'haicc', 'node-1', 'crud/read', 'swarms']), { kind: 'request', uri: 'host', parts: ['haicc', 'host', '--flags', 'log=debug', '--', 'haicc', 'node-1', 'crud/read', 'swarms'], print: null }, 'flags after the URI: that step\'s, sent as typed')
  t.alike(command(['.', '--flags', 'log=debug', '--', 'crud/read', 'swarms']).parts, ['haicc', '.', '--flags', 'log=debug', '--', 'crud/read', 'swarms'], 'at the root: the haicc command goes as it is, the flags being the step\'s there')
  t.alike(command(['--raw', 'host', '--flags', 'log=debug', '--', 'help/get']), { kind: 'request', uri: 'host', parts: ['haicc', 'host', '--flags', 'log=debug', '--', 'help/get'], print: 'raw' }, 'after --raw')
  t.alike(command(['output']), { kind: 'output', args: [] }, 'haicc output: the app\'s own')
  t.alike(command(['output', '100']), { kind: 'output', args: ['100'] })
  t.alike(command(['./output', 'help/get']).parts, ['haicc', './output', 'help/get'], 'a position named so: ./output')
  t.is(command(['--raw', '.', 'help/get']).print, 'raw', '--raw before the URI')
  t.is(command(['--output', 'host', 'help/get']).print, 'output', '--output before the URI')
  t.alike(command(['--output', 'host', 'help/get']).parts, ['haicc', 'host', 'help/get'], 'the option is not a part')
})

test('the machine level, the usage, the sources', (t) => {
  t.alike(command(['boot/deploy']), { kind: 'machine', protocol: 'boot', action: 'deploy' })
  t.alike(command(['boot/teardown']), { kind: 'machine', protocol: 'boot', action: 'teardown' })
  for (const a of [[], ['help'], ['--help'], ['-h']]) t.alike(command(a), { kind: 'usage' }, `haicc ${a.join(' ')}: the usage`)
  t.alike(command(['sources']), { kind: 'sources', args: [] })
  t.alike(command(['sources', 'unlink', '/a/folder']), { kind: 'sources', args: ['unlink', '/a/folder'] })
})

test('refused, exit 2: not a command, or its arguments wrong', (t) => {
  refused(t, ['nosuch'], 2, "no command 'nosuch' (haicc --help; a URI is followed by its command: haicc nosuch info/get)")
  refused(t, ['-x'], 2, "no command '-x' (haicc --help)")
  refused(t, ['.'], 2, 'haicc <URI> <protocol>/<action> <argument>... (a command follows the URI)')
  refused(t, ['swarms/swarm-1'], 2, 'haicc <URI> <protocol>/<action> <argument>... (a command follows the URI)')
  refused(t, ['host'], 2, "no command 'host' (haicc --help; a URI is followed by its command: haicc host info/get)")
  refused(t, ['boot'], 2, 'haicc boot/deploy, haicc boot/teardown')
  refused(t, ['boot/nosuch'], 2, 'no action: boot nosuch (deploy, teardown)')
  refused(t, ['boot/deploy', 'host'], 2, 'haicc boot/deploy (no arguments)')
  refused(t, ['--output'], 2, '--output goes before a URI')
  refused(t, ['--raw'], 2, '--raw goes before a URI')
  refused(t, ['--raw', 'host'], 2, 'haicc <URI> <protocol>/<action> <argument>... (a command follows the URI)')
  refused(t, ['--flags', 'log=debug', '--', 'host', 'help/get'], 2, 'haicc <URI> --flags <flag>... -- <protocol>/<action> ... (flags follow a URI: they are that step\'s)')
  refused(t, ['--raw', '--flags', 'log=debug', '--', 'host', 'help/get'], 2, 'haicc <URI> --flags <flag>... -- <protocol>/<action> ... (flags follow a URI: they are that step\'s)')
})
