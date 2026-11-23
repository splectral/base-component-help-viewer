# test/

The tests of splectral-base-help-viewer, a section per file, each test by its name.

## `program.js`

Shared by the tests, not a test itself. The help viewer as a program, as the package's run.js starts it.

## `help-viewer.test.js`

- markdown: headings, paragraphs, lists nested, code, tables; everything escaped first
- draw: a whole page, its sections, the keywords below as links, the navigation a drop-down a level; raw; the command box and a command's help; no page given refused
- page: the keywords asked of the docs mrepo, drawn; links to the same view, relative; the command it shows
- page: the navigation: the mrepo, the install's, a drop-down; a level a keyword, each one's choices its parent's answer; then what is below
- page: raw: the command's response whole, as the terminal prints it (to 80); the navigation kept; the drawn page a link away
- page: the command box: a command as typed after haicc, sent with the help flag, its help drawn; refused; not run; an error; raw; not a command
- page: the top; another mrepo; the root; an answer that is an error said on the page; a keyword not there, the nearest as links; where a section is from, its package's context always; an at that is no position refused; the docs mrepo where the server finds it, or said missing
- render: a page asked in the inbox, the mrepos and its data asked through the outbox, the page answered; answers kept until the install changed; raw never kept; an error said
- render: help asked typed: its answer back from the server as AVRO, read as help/annotate's answer; one written as json read as written
- the program: its state once it follows its inbox, removed as it ends; ended with its runtime
