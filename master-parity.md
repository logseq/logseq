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
| slash-filter | 11 autocomplete | Filtering `/head` keeps group header Heading | Group headers dropped while filtering | page `slash-filter`; type `/head` | low | open — owned by G5 (slash popup) |
| slash-nomatch | 11 autocomplete | `/zzzzqq` with no match closes popup | Stayed open with raw i18n key | page `slash-nomatch`; type `/zzzzqq` | med | open — owned by G5 (slash popup) |
| slash-space-close | 11 autocomplete | `/` then space closes slash popup | Stayed open with full command list | page `slash-space-close`; type `/ ` | med | open — owned by G5 (slash popup) |
| slash-then-pageref | 11 autocomplete | After slash then `[[`, empty popup has 10 date items | Had 34 date items | page `slash-then-pageref`; type `/`, Backspace, `[[` | low | fixed `135989e0bb` |
| follow-link-sidebar | 13 refs/embeds | Ctrl+Shift+O inside `[[Linked Pg2]]` opens page in right sidebar | Nothing; sidebar stayed closed | caret inside ref; mod+shift+o | high | fixed `b4f17a0497` |

## G4 — keyboard shortcuts

| check | module | master | LUI (before) | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| keymap-counts | 14 Keymap listing | All · 116 | All · 117 | Settings → Keymap; read filter chips | low | fixed `ae9c91a9a0` |
| keymap-extra-in-lui | 14 Keymap listing | includes `:go/graph-view`; no `:ui/toggle-document-mode` / `:ui/goto-plugins` | listed `t d` / `t p`; omitted graph view | compare Keymap id sets | low | fixed `ae9c91a9a0` |
| row-ui-toggle-document-mode | 14 Keymap listing | not listed (handler still `t d`) | listed Toggle document mode | Settings → Keymap | low | fixed `ae9c91a9a0` |
| row-ui-goto-plugins | 14 Keymap listing | not listed (handler still `t p`) | listed Go to plugins | Settings → Keymap | low | fixed `ae9c91a9a0` |
| row-search-re-index | 14 Keymap listing | one chord `Ctrl C → Ctrl S` | read as two alternative bindings | Settings → Keymap → Rebuild search index | med | fixed `6222b04510` |
| row-sidebar-clear | 14 Keymap listing | one chord `Ctrl C → Ctrl C` | read as two alternative bindings | Settings → Keymap → Clear all in the right sidebar | med | fixed `6222b04510` |
| follow-link-sidebar | 14 shortcut behavior | `mod+shift+o` opens `[[page]]` in right sidebar | page-title refs were a no-op | caret inside `[[Page]]`; Ctrl+Shift+O | high | fixed on base by G3 (`c98878612c` / `b4f17a0497`); G4 regression `7cd0754717` |
| ui/toggle-contents | 14 shortcut behavior | `alt+shift+c` toggles Contents; `global-prevent-default` | ensure-only open; wrong handler gate | Alt+Shift+C with Contents already open | med | fixed `7c258adedc` |
| sidebar/clear | 14 shortcut behavior | clears items and hides right sidebar | cleared items but left sidebar open | `mod+c mod+c` | med | fixed `7c258adedc` |
| go/graph-view listing | 14 Keymap listing | lists Go to graph view (`g g`) | omitted | Settings → Keymap | low | fixed `ae9c91a9a0` — listing only; Graph View UI itself is an intentional LUI exclusion |

Notes:

- Master keeps `:ui/toggle-document-mode`, `:ui/goto-plugins`, and `:ui/select-theme-color` as live `global-non-editing-only` handlers without Keymap category rows. LUI mirrors that via `Keymap_data.hidden_handler_rows` / `dispatch_items` so `t d` / `t p` / `t i` still dispatch while Settings → Keymap stays at 116.
- Chord chips use one outer `shui-shortcut-chord` with a single `data-shortcut-binding` and `->` separators, matching cljs `chord-sequence-keys`.
- G1 also has a follow-link sidebar change on its branch; G3 already merged the same `open_ref` path into `refactor/lui-parity`, so G4 does not duplicate it.
