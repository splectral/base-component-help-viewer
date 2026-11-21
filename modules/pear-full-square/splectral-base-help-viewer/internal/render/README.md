# render

Follows the component's Splectral inbox: each page made, the data it needs asked of the platform.

## Signature

`render({ side, installed, timeout, every })`: `side` the component's
Splectral side; `installed` its record, `component.json` as
`splectral/install` leaves it (its mrepo, where answers come back);
`timeout` how long a data request is waited for (120 s); `every` the slow look at the inbox, the
net for an event missed (2 s).

## Returns

`{ stop, entries }`: `stop()` ends the following; `entries()` the log so
far.

## Errors

None thrown: what fails is the page's `error`.

## Design

- **The fixed exchange** (`splectral-server`, `internal/components`): a
  page asked for, `{ request: "page", path, query }`, answered
  under its key in the Splectral outbox, `output` the page; a data
  request written there, `{ request: "data", at, command }`, its
  completed form back in the inbox under its key (`raw: true`: the
  response whole too); the install's mrepos asked, `{ request: "mrepos"
  }`, the server's answer `{ version, mrepos }`. A record taken from the
  inbox is removed.
- **The page's execution**: `exec.mrepos()`, the install's mrepos;
  `exec.data(at, command)`, the platform's data, a promise of the
  command's output (its error thrown); `exec.record(at, command)`, the
  response whole, as the terminal reads it; `exec.log(level, event,
  data)`.
- **Answers kept**: `data`'s, by mrepo and command, while the program
  runs: the platform's data does not change while the install does not.
  Dropped when the mrepos' `version` moved (a deploy, a teardown, a
  service moved); an error is not kept; `record` never.
- **The page**: `page` (beside it), called in this process, `{ uri,
  query }`: the path below the component, the query. Nothing is taken by name: the help viewer is
  one page.
