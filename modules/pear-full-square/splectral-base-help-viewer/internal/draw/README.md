# draw

The help page as HTML, whole: its sections in markdown, the keywords below each as links.

## Signature

`draw(input)`: `input` the page, `{ title, crumbs, sections, error,
footer }`: `crumbs` where it is, `[{ label, href }]`; `sections` each
`{ title, markdown, below: [{ label, href, oneliner }] }`; `error` said
at the top; `footer` a line in markdown at the end.

## Returns

The page, whole: HTML with its style in it.

## Errors

- No page given: `missing argument: page`.

## Design

- **Self-contained**: its style with it, light and dark; nothing loaded
  from elsewhere, no script.
- **A section's own heading not repeated**: its markdown's first
  heading is the section's title, drawn once.
