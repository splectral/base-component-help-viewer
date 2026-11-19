# test/

The tests of splectral-base-help-viewer, a section per file, each test by its name.

## `program.js`

Shared by the tests, not a test itself. The help viewer as a program, as the package's run.js starts it.

## `help-viewer.test.js`

- markdown: headings, paragraphs, lists nested, code, tables; everything escaped first
- draw: a whole page, its sections, the keywords below as links; no page given refused
- page: the keywords asked of the docs mrepo, drawn; links to the same view; the command it shows
- page: the top; another mrepo; an answer that is an error said on the page; an at that is no position refused
- render: a page asked in the inbox, its data asked through the outbox, the page answered; an error said
- the program: its state once it follows its inbox, removed as it ends; ended with its runtime
