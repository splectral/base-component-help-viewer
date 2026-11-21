# splectral-base-help-viewer

The help viewer, a Splectral component on its own: one page showing a help info request's answer.

A component is an mrepo with Splectral's side laid on top: its package
in its folder, `splectral/`, beside a Splectral inbox and outbox linked
with the Splectral server and nothing else. This is the program on that
side and everything it does. Offered by
`splectral/base-component-help-viewer`.

## Links

- [internal](internal/)
- [test](test/)

## What it does

Started by the component's `start` hook (`runtime/start`), it takes
each page the server asks for from the inbox, asks the platform for the
help info it shows (`info/get <keywords>` at the docs mrepo, or at
`?at=<position>`) through the outbox, draws the page and writes it
back. Ended by the `stop` hook, and with its runtime.

`/help/hdlc/validation` is `haicc docs info/get hdlc/validation`, drawn:
the human sees what the AI reads on the command line. A drop-down the
mrepo, one a level of keywords, each level's choices its parent's own
answer; `?raw`, the response as the terminal prints it. A command box:
a command typed answered with help where it would run, never run.

## Design

- **A standalone first implementation** (the team, 2026-11-19): one
  package, one module, one page; no protocol, no element set, no
  renderer apart. What it teaches is the start of the generic viewer
  and of a renderer every component shares.
- **Help specific** (the team, 2026-11-19): its page, layout and all,
  is shaped for help alone; nothing in it is kept general for later.

## Tests

- `brittle-bare test/*.test.js` (Bare installed): markdown and the page drawn; the page's data asked and mapped; a page made over the boxes with its data, an error; the program's state.
