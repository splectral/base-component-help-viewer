# unpack

Unpacks a stored record across lines in a compact form, changing nothing of it.

A container, an object or an array, that fits on the line is left as it
is stored. One that does not is opened, its entries packed on lines of
their own. Nothing of the record is changed.

## Packed

An opened container's entries are indented by two, as many on a line as
fit the width, separated by `, `. An entry is never split across lines;
one that does not fit on a line of its own is opened below, the same
way. Only line breaks, indentation, the space between two entries on a
line and a space after the colon of an opened object's keys are added.

```
"value": {
  "command": ["boot/teardown","host"], "protocol": "boot",
  "action": "teardown", "uri": ["main","host"], "args": [],
  "output": {"tornDown":"host"}
}
```

## Signature

`unpack(text, width)`: the record as stored, and the width to fit it to,
80 by default (the command line hands in the width in force: `output`).

## Returns

The text, across lines, without a line break at its end.

## Design

A scanner over the text, not a parser: it follows strings and depth, so
numbers, escapes and the order of keys stay exactly as stored. Taking the
line breaks and the spaces outside its strings off again gives the
record back.
