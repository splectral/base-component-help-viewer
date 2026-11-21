# draw

The help page as HTML, whole: its sections in markdown, the keywords below each as links.

## Signature

`draw(input)`: `input` the page, `{ title, nav, box, view, sections,
help, raw, error, near, footer }`: `box` the command box, `{ value,
placeholder }`; `help` a command's help, `{ command, does, door, taken,
arguments, run, more: { label, href } }`; `nav` where it is and where to go, `{ mrepos,
levels }`, `mrepos` the mrepo's drop-down and `levels` one a level, each
a list of `{ label, value, selected }`, `value` an address; `view` the
other view, `{ label, href }`; `raw` a text shown as it is;
`sections` each `{ title, from, markdown, below: [{ label, href,
oneliner, pages }] }`, `from` the packages it is from, shown when given; `error` said at the top; `near` a keyword not there, the
nearest one and what is below it, `{ label, href, below: [{ label, href
}] }`; `footer` a line in markdown at the end.

## Returns

The page, whole: HTML with its style in it.

## Errors

- No page given: `missing argument: page`.

## Design

- **Self-contained**: its style with it, light and dark; nothing loaded
  from elsewhere. One script, with the navigation only: a choice opens
  its address at the top, relative to the page's base, as a link is
  followed. Plain `<select>`s: the keyboard and a phone with no more.
- **A section's own heading not repeated**: its markdown's first
  heading is the section's title, drawn once.
- **Where to go next, on the page**: the drop-downs; a keyword below
  says how many pages it opens when more than one; a keyword not there
  gives the nearest one and what is below it as links.
