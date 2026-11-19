# program

The help viewer's program: what its `start` hook starts with `runtime/start`, until it is ended.

## Signature

`program(argv)`: `--dir=<the mrepo's folder>`, `--runtime=<pid>`,
`--state=<file>`, as `runtime/start` hands them.

## Returns

Resolves when it has ended.

## Errors

- No `--dir` or no `--state`.
- No component installed there: `no component here` (`splectral/install`
  first).

## Design

- **What runtime/start asks of a program**: its state written, whole,
  with its `pid`, once it follows its inbox (`{ pid, component,
  started }`); removed as it ends; ended by SIGTERM, SIGINT, its mrepo's
  folder gone or its runtime ended.
- **Splectral's side only**: it reads the component's Splectral inbox and
  writes its Splectral outbox; the mrepo's own boxes are its runtime's.
- **The component's own**: no renderer apart; what a second component
  needs of it is learnt from this one, then split out.
