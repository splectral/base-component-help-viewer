# base-component-help-viewer

The help viewer, Splectral's first component: one page showing a help info request's answer, as on the command line.

A component is an app on Splectral: an mrepo Splectral deploys, this
package laid on top of it. Its page is served at its position:
`/help/hdlc/validation` is `haicc docs info/get hdlc/validation`, drawn;
`?at=host` reads another mrepo; the docs mrepo by default. The human
sees what the AI reads on the command line.

A standalone first implementation: one package, its program and its
page in it; the generic viewer is designed from what it teaches.

## Links

- [mrepo](mrepo/)
- [howto](howto/)
- [test](test/)
- [test-reports](test-reports/)
- [modules](modules/)

## Installing

```sh
haicc splectral boot/deploy help haiccing/base-package-service
haicc splectral splectral/install help splectral/base-component-help-viewer
haicc splectral/help service/initialise
haicc splectral/help service/start
```

Then `http://127.0.0.1:4400/help/`. Its service stopped, its program
ends and its pages are not answered; `haicc splectral boot/teardown
help` removes it.
