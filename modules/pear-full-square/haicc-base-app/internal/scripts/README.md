# scripts

Reads the install's script files by name, lists them, and turns haicc/file into haicc/script.

The install keeps scripts in its own folder, `<home>/scripts`, next to
`work`: the user's at `scripts/<name>.haicc`, a package's at
`scripts/<org>/<package>/<name>.haicc`. Each is lines of simple
commands. `haicc <URI> haicc/file <URI> <name>` is the terminal's: it
reads the file and sends its lines as `haicc/script`, so no mrepo reads
a file of the machine.

## Signature

- `scriptPath(home, name)`: the file a name stands for.
- `readScript(home, name)`: its lines.
- `scriptNames(home)`: the names there, the user's first, then each
  package's.
- `scriptsCommand(home, args)`: `haicc scripts`, the names, a line each.
- `withFile(home, parts)`: a command's parts with `haicc/file <URI>
  <name>` made `haicc/script <URI> '<lines>'`; others as they are.

## Errors

- A name that is a path, or not of lowercase letters, digits and
  hyphens: `not a script's name` (exit 2).
- No such file: `no script: <name> (<file>)` (exit 3).
- `haicc/file` without its URI and name (exit 2).
