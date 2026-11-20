# Master UX parity (refactor/lui)

Tracking LUI vs master (`9af1a190`) headless Chromium parity findings. Each group owns only its section.

## G3 — autocomplete & refs

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| pageref-open | 11 autocomplete | Empty `[[` popup lists 10 date shortcuts (Today … Next year) | Listed 34 date shortcuts | page `pageref-open`; edit end; type `[[` | low | fixed `135989e0bb` |
| pageref-down-enter | 11 autocomplete | `[[Exist` list is Exist \| Existing Page \| Existing Other (no New page when exact page exists); Down+Enter picks Existing Page | Always inserted New page Exist as 2nd row | page `pageref-down-enter`; type `[[Exist`, ArrowDown, Enter | med | fixed `d2f9f6071d` |
| pageref-ctrl-n-p | 11 autocomplete | ctrl+n/p walk Exist → Existing Page → Existing Other | Walked Exist → New page Exist → Existing Page | page `pageref-ctrl-n-p`; type `[[Exist`, Control+n/p | med | fixed `d2f9f6071d` |
| tag-open | 11 autocomplete | `#` popup lists built-in tags without Page | Also listed built-in Page class | page `tag-open`; type `#` | low | fixed `f7c7e893b1` |
| tag-filter | 11 autocomplete | Tag list is items only under `#ui__ac` (hint is sibling outside `#ui__ac`) | Hint text appeared inside `#ui__ac` | page `tag-filter`; type `#MyT` | low | fixed `789ca92986` |
| tag-new | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-new`; type `#NewTagX`, Enter | low | fixed `789ca92986` |
| tag-space-closes | 11 autocomplete | `#` popup has no Page | Included Page | page `tag-space-closes`; type `#` then space | low | fixed `f7c7e893b1` |
| tag-duplicate | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-duplicate`; add `#MyTag` twice | low | fixed `789ca92986` |
| slash-filter | 11 autocomplete | Filtering `/head` keeps group header Heading | Group headers dropped while filtering | page `slash-filter`; type `/head` | low | fixed by G5 `0aa74f9f8c` |
| slash-nomatch | 11 autocomplete | `/zzzzqq` with no match closes popup | Stayed open with raw i18n key | page `slash-nomatch`; type `/zzzzqq` | med | fixed by G5 `0aa74f9f8c` |
| slash-space-close | 11 autocomplete | `/` then space closes popup | Stayed open with full command list | page `slash-space-close`; type `/ ` | med | fixed by G5 `0aa74f9f8c` |
| slash-then-pageref | 11 autocomplete | After slash then `[[`, empty popup has 10 date items | Had 34 date items | page `slash-then-pageref`; type `/`, Backspace, `[[` | low | fixed `135989e0bb` |
| follow-link-sidebar | 13 refs/embeds | Ctrl+Shift+O inside `[[Linked Pg2]]` opens page in right sidebar | Nothing; sidebar stayed closed | caret inside ref; mod+shift+o | high | fixed `b4f17a0497` |

## G5 — slash commands

Module 12 (Block editor — slash commands). Base: `refactor/lui-parity` @ `9c3497f356` (rebased).
Branch: `logseq/g5-slash-commands-7f98`. UI tests after rebase: `6693` checks, `0` failures.

| check | module | master | LUI (before) | severity | status |
|-------|--------|--------|--------------|----------|--------|
| list-tooltips | 12 | Slash items expose description via `title` attr | No `title` on slash rows | low | fixed `5863660c56` |
| cmd-node-reference | 12 | Empty `[[` shows 10 NLP date shortcuts | 34 NLP dates | low | fixed by G3 `d65d6aa4ec` |
| cmd-node-embed | 12 | Placeholder "Search for a block"; Escape leaves host | "Search for a node"; `/Node embed` left after Escape | med | fixed `0bd4841db4` |
| cmd-deadline | 12 | Year control in caption; Next date Empty when unset | Month only; defaulted to double-plus label | low | fixed `ff4bd1d24d` |
| cmd-scheduled | 12 | Year control; Next date Empty | Same LUI gap as deadline | low | fixed `ff4bd1d24d` (shared calendar/repeat) |
| cmd-date-picker | 12 | Year control in caption | Month only | low | fixed `ff4bd1d24d` (shared year input) |
| cmd-add-comment | 12 | Caret moves into new empty comment | Thread created; caret stays on host | med | fixed `84c53c3e3d` |
| cmd-query | 12 | Clear slash; move host title into query child; empty host; tag Query | Wrong child path / lost title | low | fixed `91fb6875f4` + `90a2be21ce` |
| cmd-advanced-query | 12 | Keep host title; empty clojure code query child; no live all-nodes table | Title discarded; Untitled; live 28-row table | high | fixed `210c43f33a` + `90a2be21ce` |
| cmd-query-function | 12 | Inline `{{function null}}` (master is inline, not own-line) | Empty/missing null; looked like own-line gap | low | fixed `1df1a903b7` |
| cmd-upload-an-asset | 12 | Keeps `/Upload an asset` until file chosen | Cleared slash text immediately | low | fixed `11addbf1a0` |
| cmd-template | 12 | Placeholder "Search for a template" | "Search for a block" | low | fixed `50864e4d1a` |
| cmd-embed-video-url | 12 | `{{video }}` on own line under host | Inline `host {{video}}` | low | fixed `4fdb2e397d` |
| cmd-embed-youtube-timestamp | 12 | No video → clear slash/block content | Kept host; nothing inserted | low | fixed `6756044250` |

### Extra slash-filter parity (prompt edge cases)

| check | master | LUI (before) | status |
|-------|--------|--------------|--------|
| slash-filter `/head` | Group name searchable; Heading group title kept | Group headers dropped when filtered | fixed `0aa74f9f8c` |
| slash-filter no-match | Close after >2 chars past last match; else "No matched commands" | Untranslated key; popup stayed open | fixed `0aa74f9f8c` + tests `23864be16e` |
| slash-filter `/ ` | Slash+space closes popup | Full list stayed open | fixed `0aa74f9f8c` |

### Notes

- Intentional differences excluded by charter: graph view; rich-text editor formatting while editing.
- NLP take-10 for empty `[[` was fixed on `refactor/lui-parity` by G3 (`d65d6aa4ec`); G5 does not re-land that change.
- No `needs decision` items: every G5 gap had a clear master behavior to copy.
