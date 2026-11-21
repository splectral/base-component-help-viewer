# output

Says the width a printed record is fitted to, and answers the `haicc output` command.

A record is printed unpacked across lines (`unpack`), to a width. By
default the width is the terminal's, read each time a record is printed;
80 when the output is no terminal (piped, written to a file). A width
set holds for every later command: it is kept in haicc's own folder.

## Signature

- `widthOf(home, columns)`: the width in force. `home` is haicc's own
  folder; `columns` the terminal's width now, `null` when the output is
  none.
- `outputCommand(home, args, columns)`: the command, its arguments after
  `output`.

## Returns

- `widthOf`: `{ width, from }`; `from` is `set`, `terminal` or `default`.
- `outputCommand`: the lines to print: the width in force and where it
  comes from.

```
haicc output          auto: 132 (the terminal's width)
haicc output 100      100 (set: haicc output auto for the terminal's width)
haicc output auto     auto: 132 (the terminal's width)
```

## Errors

A `Failure` with exit code 2: a width that is no number of characters,
more than one argument.

## Design

- **`auto` is the default**: nothing kept; the terminal's width when the
  output is one, 80 when not.
- **Set, it is saved**: `output.width` in haicc's own folder (`WIDTH`),
  a number; `haicc output auto` removes it.
- **No environment variable** sets the width: one place says it.

## Also exported

`WIDTH`: the file's name. `DEFAULT`: 80.
