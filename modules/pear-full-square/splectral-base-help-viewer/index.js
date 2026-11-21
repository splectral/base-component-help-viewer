// splectral-base-help-viewer: the help viewer, a Splectral component on
// its own: one page that shows the answer of a help info request
// (README.md beside each).
//   internal/   program: the component's program; render: its inbox
//               followed, its pages made; page: the help page, its data
//               asked; draw: the page as HTML; markdown: a page's markdown
export { program } from './internal/program/index.js'
export { render } from './internal/render/index.js'
export { page, DEFAULT, WIDTH } from './internal/page/index.js'
export { draw, STYLE } from './internal/draw/index.js'
export { markdown, inline, escape } from './internal/markdown/index.js'
