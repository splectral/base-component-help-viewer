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
  page asked for, `{ request: "page", path, query, base }`, answered
  under its key in the Splectral outbox, `output` the page; a data
  request written there, `{ request: "data", at, command }`, its
  completed form back in the inbox under its key. A record taken from the
  inbox is removed.
- **The page's execution**: `exec.data(at, command)`, the platform's
  data, a promise of the command's output (its error thrown);
  `exec.log(level, event, data)`.
- **The page**: `page` (beside it), called in this process, `{ uri,
  query, base }`: the path below the component, the query, the
  component's own address. Nothing is taken by name: the help viewer is
  one page.
