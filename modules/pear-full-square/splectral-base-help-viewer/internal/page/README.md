# page

The help page: an mrepo's help info by keywords, as `haicc <at> info/get <keywords>` answers it, drawn or raw.

Made by the component's program for every page the browser asks of it:
the path below the component the keywords, as the command line has
them. `/help/hdlc/validation` is `haicc docs info/get hdlc/validation`,
drawn. The docs mrepo is read unless another is asked for
(`?at=host`, `?at=.` the root).

## Signature

`page(exec, { uri, query })`: `exec` what the program hands it (`render`):
`mrepos()`, `data(at, command)`, `record(at, command)` and `log(level,
event, data)`.

## Arguments

- `uri`: the keywords, the path below the component; none: the top.
- `query.at`: the mrepo read, by its position from the root (`.` the
  root itself); `docs` by default.
- `query.raw`: there (`?raw`): the command's response whole, as the
  terminal prints it.
- `query.cmd`: a command as typed after `haicc` (`?cmd=host crud/read
  swarms`, its position first, `.` the root): answered with help, not
  run.

## Returns

The page, whole (HTML): the navigation; the keyword's page, each choice
a section, the keywords below each as links to the same view; or, raw,
the response printed; the command it shows, at the end.

## Errors

- An `at` that is no position: `not an mrepo's position`.
- What the command answered with an error is said on the page, not
  thrown: a page is always drawn.

## Design

- **The data is the platform's**: asked for with `exec.data(at,
  command)`, run as a terminal runs a command; the answer mapped to the
  page's input and drawn (`draw`).
- **The navigation, a drop-down each** (the team, 2026-11-20): the
  mrepo, the install's mrepos as Splectral's server knows them, a tree,
  each to its top; then a level a keyword, `docs › hdlc › validation`,
  each level's choices its parent's own `info/get` answer's below (no
  index of its own that can drift: the navigation is the command line's
  too); then what is below this page. A choice opens its address; `–`
  goes up a level; a keyword opening several pages says how many
  (`package (3)`).
- **This page's answer and each level's above it, asked at once**; the
  mrepos first, so that what `render` keeps is dropped when the install
  changed.
- **Raw, like for like** (the team, 2026-11-20): `?raw` is the response
  whole, `exec.record`, printed as the `haicc` command prints it, by its
  own `unpack` (`haicc-base-app`), to the width it prints to when its
  output is no terminal (`WIDTH`, 80); never kept. A link switches
  between the two views; a choice keeps the view.
- **The command box** (the team, 2026-11-20): a command typed is sent
  with the help flag on its last command (into its own list when it has
  one), so nothing of it is executed (a rewrite, strict:
  `mrepo-base-request`); `help/annotate`'s answer drawn where it would
  run: the command, what it does, the door's answer here and now, its
  arguments, `run it` with the position typed in front, `read more` a
  link to that page at that mrepo, in this viewer. Not run, an error,
  not a command: said. Never kept: the door's answer is now. `?raw` the
  same, as the terminal prints it. The box on every page, the page's own
  command its example.
- **Where a section is from**: its packages, said when a keyword has
  several answers (three packages' "Package") or one page several
  packages share (a template's generic page, once).
- **A keyword not there**: what `info/get` said, and its nearest
  keyword and those below it (from that answer) as links.
- **Relative links**: to the keywords below and back up, relative to
  its section (`hdlc/validation`, `./?at=host`): right wherever it is
  mounted; the site gives the page its base.
- **Help specific**: it knows `info/get`'s answer (its choices, the
  keywords below each); a viewer of other commands' answers is the
  generic viewer's, designed from this one.
- **In step with the command line**: the keywords in the address bar are
  those of `info/get`; the page ends with the command it shows.

## Also exported

`DEFAULT`: `docs`. `WIDTH`: 80.
