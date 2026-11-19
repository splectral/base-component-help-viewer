# component

A Splectral component: an app, an mrepo Splectral deploys, its package laid on top, its pages served at its position.

Pattern: splectral-component

A component is a package of the splectral family that is a list, today
of itself only: its program (`run.js`), what makes its pages, in it; and
two hooks, `start` and `stop`, its program started and ended. It is
installed in two halves, haicc's then Splectral's. The help viewer is
the first, a standalone first implementation: a renderer every
component shares comes from what it teaches.

## Steps

```sh
# cloned from this one (the package how-to); its module beside it, its
# program and its pages (splectral-base-help-viewer a model)
cp -a splectral/base-component-help-viewer splectral/<component>
$EDITOR splectral/<component>/mrepo/packages/layer.json splectral/<component>/mrepo/runtime/hooks/start.haicc
# the check: its pre-release
tools/bare tools/package-test.js splectral/<component>
# installed on a running Splectral: a plain service-managed mrepo first,
# then the component on top; its service started, its program runs
haicc splectral boot/deploy <position> haiccing/base-package-service
haicc splectral splectral/install <position> splectral/<component>
haicc splectral/<position> service/initialise
haicc splectral/<position> service/start
# its pages: http://127.0.0.1:4400/<position>/
```

## Notes

- **Its list names its own organisation's packages only**:
  `splectral/install` refuses another's.
- **Its program**: started by `runtime/start . splectral/packages/<the
  first of its list>`; the server knows it runs by that program's
  state. It follows the Splectral inbox: a page asked for, `{ request:
  "page", path, query, base }`, answered in the outbox; the data it
  needs asked there, `{ request: "data", at, command }`, a command as
  typed at a position from the root, its answer back in the inbox.
- **Deploy and teardown**: no upgrade in place. A change is `haicc
  splectral boot/teardown <position>`, then both halves again.
