# markdown

A page's markdown as HTML, what a help page is drawn with.

## Signature

- `markdown(text, { link })`: the whole text.
- `inline(text, { link })`: a line's inline markup.
- `escape(text)`: HTML's special characters escaped.

`link(href)`, optional, rewrites a link's address.

## Returns

HTML text.

## Errors

None: what is not recognised stays text.

## Design

- **Code first, held aside**: a code span is never markup; bold, italic
  and links run over the whole line, so they may hold code
  (`**\`haicc scripts\`**`).
- **Escaped first**: the text is never taken as HTML; only what is
  recognised becomes markup.
- **What is recognised**: headings, paragraphs, lists (bulleted and
  numbered, nested by their indent, an item's continuation lines), fenced
  code, tables, rules; inline: code, links, bold, italic. What the
  platform's pages use, no more.
