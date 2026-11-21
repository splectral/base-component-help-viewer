# outcome

Finds a response record's completed form and returns its output or its error.

The record is an envelope around a core around the form, so the form is
the value two levels down.

## Signature

`outcome(text)`: the response record as stored.

## Returns

- `{ output }`: the form holds an output. With `continuation`,
  `{ at, script }`, when the form answers with a script to go on with
  (anything there that is no such thing is left out).
- `{ error }`: the form holds an error, a string on one line. An error
  wins over an output.
- `null`: the text is not a record, or its form is not completed.
