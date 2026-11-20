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
| add-comment-ctrl-space | 14b shortcut behavior | `ctrl+space` while editing adds a comment thread | no-op | block “comment host”; caret @end; Control+Space | high | fixed `1740e37849` |
| go-back-fwd-clean | 14b shortcut behavior | after A→B, `mod+[` / `mod+]` walk history | `Ctrl+[` no-op | Nav A then Nav B; Ctrl+[ / Ctrl+] | high | fixed `eea57aab11` |
| select-theme-color | 14b shortcut behavior | `t i` opens Themes \| Logseq • Default Light Theme | no-op | Shortcut Page; not editing; `t i` | med | fixed `68c114c5d3` |
| go-flashcards | 14b shortcut behavior | empty deck “Time to create a card!” | “No cards due … Practice again” | Shortcut Page; `g f` | med | partial `8efe347dbe` — cleared stale `all_cards` mid-reload; empty-state copy also owned by G1 nav-flashcards |
| go-flashcards-tc | 14b shortcut behavior | `t c` same create-card empty copy | same wrong no-due copy | Shortcut Page; `t c` | med | partial `8efe347dbe` — same empty-state path as go-flashcards |
| p-p | 14b shortcut behavior | priority picker Low \| Medium \| High \| Urgent | header + input, no choices | select block; `p p` | med | fixed `b3514d2015` (shared named-property open) |
| p-s-clean | 14b shortcut behavior | status picker lists 6 statuses | only Todo | fresh graph; select block; `p s` | med | fixed `b3514d2015` |
| toggle-contents | 14b shortcut behavior | Alt+Shift+C twice opens then closes Contents | second press leaves sidebar open | Shortcut Page; Alt+Shift+C ×2 | med | fixed `7c258adedc` (verified) |
| toggle-contents-clean | 14b shortcut behavior | same toggle close on fresh session | second press no-op | fresh; Alt+Shift+C ×2 | med | fixed `7c258adedc` (same path) |
| backward-kill-word | 14b shortcut behavior | `alt+w` at `one two\| three` → `one three` | `one  three` (double space) | caret @7; Alt+w | low | fixed `abe658c330` |
| bold-toggle-off | 14b shortcut behavior | `****bo****` renders as `x *bo* y` | renders as `x **bo** y` | mod+b on bold selection | low | leave — pure rich-text rendering of `****bo****`, not shortcut wiring |
| command-palette | 14b shortcut behavior | 86 commands; starts Toggle wide mode… | 85; starts Search themes… | Control+Shift+p | low | fixed `6eaca45c43` — only palette picks write `commands-history` (shortcuts no longer pollute order); table includes `go/graph-view` |
| go-search-themes | 14b shortcut behavior | `Logseq Default theme — light #logseq-classic-theme`; Apply theme | name only; Trigger | Alt+Shift+i | low | fixed `605514b14f` |
| p-d | 14b shortcut behavior | date picker without Add-or-change chrome | extra Add-or-change header | select block; `p d` | low | fixed `b3514d2015` |
| p-i | 14b shortcut behavior | icon picker tabs at bottom | tabs at top | select block; `p i` | low | fixed `e0f35ab1c3` |
| p-t | 14b shortcut behavior | tag picker without Add-or-change header | extra header | select block; `p t` | low | fixed `b3514d2015` |
| quick-add | 14b shortcut behavior | Add to today shows Ctrl Alt E | empty ZWSP / missing keycaps | Control+Alt+e | low | fixed `8a38fd900f` |
| sidebar-clear | 14b shortcut behavior | clears items and closes right sidebar | clears items, sidebar stays open | Control+c Control+c | low | fixed `7c258adedc` (verified; same as sidebar/clear) |

Notes:

- Master keeps `:ui/toggle-document-mode`, `:ui/goto-plugins`, and `:ui/select-theme-color` as live `global-non-editing-only` handlers without Keymap category rows. LUI mirrors that via `Keymap_data.hidden_handler_rows` / `dispatch_items` so `t d` / `t p` / `t i` still dispatch while Settings → Keymap stays at 116.
- Chord chips use one outer `shui-shortcut-chord` with a single `data-shortcut-binding` and `->` separators, matching cljs `chord-sequence-keys`.
- G1 also has a follow-link sidebar change on its branch; G3 already merged the same `open_ref` path into `refactor/lui-parity`, so G4 does not duplicate it.
- Module 14b `p-p` / `p-s-clean` / `p-d` / `p-t` share one root: `Properties_dialog.open_for_block_with_property` now merges `closed-values` and anchors at the block.
- Module 14b flashcards empty copy is an empty-state / load lifecycle issue (also module 03 nav-flashcards for G1), not shortcut binding.
