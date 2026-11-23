// The app's usage: the commands it answers (haicc --help).
export const USAGE = `haicc <URI> <protocol>/<action> <argument>...   a command for the mrepos:
                                                go to this node position and
                                                execute the command that
                                                follows; its response record
                                                printed, unpacked across lines
                                                to the width (haicc output)
haicc --raw <URI> <protocol>/<action> ...       the record as it is stored,
                                                one line
haicc --output <URI> <protocol>/<action> ...    the completed form's output
                                                alone
haicc <URI> --flags <flag>... -- <command>      flags after a URI: that
                                                step's, space separated,
                                                closed by --, the next
                                                command after it; they hold
                                                down the chain until changed:
                                                log=info|verbose|debug, how
                                                much the request's log holds
                                                (info without it);
                                                layer=<name>, the layer the
                                                command's URI is read at
                                                (main without it);
                                                container, on a boot/deploy:
                                                the child deployed into a
                                                Docker container, run there
                                                by its own haicc install
haicc <URI> <command> <URI> --flags <flag>...   after the last command's URI:
                                                that command's, closed by the
                                                end of the line
haicc output                                    the width a record is printed
                                                to: auto, the terminal's (80
                                                when the output is none)
haicc output <width> | auto                     set, kept; back to auto
haicc boot/deploy                               the machine level: the boot
                                                mrepo put in place at the
                                                root, its runtime started
haicc boot/teardown                             every runtime stopped, what
                                                boot/deploy put in place removed
                                                (your scripts kept); again: a
                                                warning, nothing done
haicc scripts                                   the install's scripts by
                                                name: <work>/scripts/: each
                                                package's, placed by a deploy
                                                (<org>/<package>/<name>), and
                                                yours (<name>.haicc); haicc
                                                <URI> haicc/file <URI> <name>
                                                runs one
haicc sources                                   the sources registered
haicc sources unlink <folder>
haicc sources download <org>...                 an organisation's packages
                                                fetched over https (the first
                                                step's, before the app)
haicc sources https | no-https [<org>...]       https as the backup, or not

  haicc boot/deploy
  haicc . boot/deploy host haiccing/base-component-haicc
  haicc host service/stop
  haicc host service/start
  haicc host boot/deploy node-1 haiccing/base-component-haicc
  haicc host haicc node-1 info/get
  haicc host crud/read . --flags log=verbose
  haicc host --flags log=debug -- haicc node-1 crud/read .
  haicc . crud/read "done/*[value/value/protocol='boot']" --flags layer=request
  haicc . boot/deploy workbench haiccing/base-solution-workbench
  haicc host boot/teardown node-1
  haicc . boot/teardown host
  haicc boot/teardown

A URI is relative, without a leading slash: . is the local root, host the
position host in it. A position named like a command of haicc itself is
written with ./ in front: ./sources, ./boot, ./output. An action's first
argument is its own target URI, . the position itself, then what it
takes: haicc splectral splectral/start . 4401.

A request's log is in its record: info unasked, more with --flags
log=verbose; the requests done, at the request layer:
haicc host crud/read "done/*" --flags layer=request.

An mrepo answers about itself: haicc host info/get, haicc host info/get haiccing;
a package by its name fully qualified: haicc host info/get
haiccing/base-package-boot/deploy. The platform's documentation, once its mrepo
is deployed (haicc . boot/deploy docs haiccing/base-component-docs): haicc docs
info/get, haicc docs info/get haiccing/base-docs-hdlc`
