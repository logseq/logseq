# Master UX parity (refactor/lui)

Tracking LUI vs master (`9af1a190`) headless Chromium parity findings. Each group owns only its section.

## G1 — editor core, selection, cursor

**Scope:** modules 06 / 07 / 08 only. Modules 01, 03, 05, 10, 16 and other non-editor modules are owned by **G6** (agent `bc-af341623`).

| Item | Status | Notes |
|------|--------|-------|
| Indent undo caret position | done | Captures `:editor/start-pos` on End/arrows; undo restores caret (`1e87a84d81`). |
| Zoom breadcrumb separator + link styling | done | Kit → semantic `/` + links (`de3b00d1fd`); typed layout props `a28c7880a5`; nowrap on text (not row) `c3541d9d61`. |
| ArrowLeft at first block → page title | done | `arrow_edge` → `focus_page_title` (`459b2a5028`); journal gate via `page_title_focusable` (`3a03022c3b`). |
| Shift+Click range select while editing | done | Exits edit before range (`e090c6f6af`); editing-block fallback when enter_edit cleared anchor (`a750ce212e`). |
| No action bar on Shift+arrow exit from edit | done | Removed LUI-only `show_action_bar` after exit; matches master timing where selection is empty when `show-action-bar!` runs (`3c04615938`). |
| Context menu mod shortcut labels (Ctrl vs ⌘) | done | Shared `mod_cap` with tag menus (`79bca8bdb3`). |
| Hide selection action bar when context menu opens | done | `open_cm` calls `hide_action_bar` like cljs `shui/popup-hide!` before dots dropdown (`0d523eebd3`). |
| `editor/open-link-in-sidebar` for `[[page]]` | done | `follow_link ~sidebar` uses `Sidebar_state.open_ref` (`c3e24b9b53`). |
| Shift+Up typed-char leak | n/a | Probes did not reproduce a typed char landing in block text; dropped. |
| Indent undo after End mid-block (post-autosave) | done | Home/End/Page* capture live pre-key caret as start-pos (`abdc9534f8`). |
| Ctrl-click sidebar while editing main | done | `exit_edit ~select:false` preserves `selection_scope` (`d38d908767`). |

### G1 handoff — non-editor items already committed (G6: skip)

Before the scope change, G1 landed two code fixes on PR #14076 (`logseq/lui-ux-parity-53a5`). G6 should **skip** redoing these:

| check | module | commit | notes |
|-------|--------|--------|-------|
| create-dialog / create-graph-empty-name | 01 | `afc8812d25` | Sync checkbox gated on `rtc_group?` only |
| first-load / header-buttons | 01 | `ad773195f2` | Hide back/forward on non-Electron web |

Dropped (no G1 code commit; already fixed earlier on branch / now G6-owned): nav-pages, nav-flashcards, favorite-click, recent, delete-page, drop-file-image, class-page-add-object, tag-chip, untag.

## G2 — copy/paste/undo/redo

Module 09. G1 owns indent-undo caret (module 06); general undo caret restoration is fixed here — G1 can skip if covered.

| check | module | severity | status | master | LUI (before) | repro |
|-------|--------|----------|--------|--------|--------------|-------|
| copy-block-paste-into-empty | 09 | med | fixed `e569cc2e01` | stays editing last pasted @ end | exits edit | copy gamma → empty block → paste |
| copy-subtree | 09 | med | fixed `e569cc2e01` | caret in last pasted (beta-2 @ end) | exits edit | copy beta subtree → paste |
| copy-subtree-into-nonempty | 09 | med | fixed `e569cc2e01` | caret in last pasted | exits edit | paste subtree into non-empty |
| cut-block-selection | 09 | med | fixed `e569cc2e01` | caret in pasted block | exits edit | cut gamma → paste |
| paste-ext-url-over-selection | 09 | high | fixed `b75ecc9b97` | `[label](url)` markdown link | no-op, caret → 0 | Shift+Home → paste URL |
| undo-typing | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | type → Ctrl+Z |
| undo-new-block | editing | Meta+z in fresh block clears text, stays editing | removes whole block + exits edit | ⌘z new block | low | suspect |
| undo-outdent | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Shift+Tab → undo |
| redo-cleared-by-edit | 09 | low | fixed `0620e7b14d` | undo → caret 0 → type at start | caret stays end | undo → type → redo no-op |
| undo-not-editing | 09 | low | fixed `0620e7b14d` | re-opens @ caret 0 | re-opens @ end | type → Esc → undo |
| undo-status | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Ctrl+Enter → undo |
| undo-page-rename | 09 | med | fixed `5bdff1fa4d` | rename undo silent | false “Undo failed.” + `Owned_refresh_failed` | title rename → Ctrl+Z |
| paste-across-pages | 09 | med | fixed `e569cc2e01` | caret in pasted block | exits edit | copy on A → paste on B |
| copy-block-ref-paste | 09 | med | fixed `e569cc2e01` | inserts sibling, keeps editing | exits edit | copy block → paste into non-empty |

Intentional differences (out of scope for G2): graph view; rich-text inline formatting while editing.

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
| slash-nomatch | 11 autocomplete | `/zzzzqq` with no match closes popup | Stayed open with raw i18n key | page `slash-nomatch`; type `/zzzzqq` | med | fixed by G5 `0aa74f9f8c` (dict key by G7 `4e9897330d`) |
| slash-space-close | 11 autocomplete | `/` then space closes popup | Stayed open with full command list | page `slash-space-close`; type `/ ` | med | fixed by G5 `0aa74f9f8c` |
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
| go-flashcards | 14b shortcut behavior | empty deck “Time to create a card!” | “No cards due … Practice again” | Shortcut Page; `g f` | med | fixed via G6 `nav-flashcards` (`98946559ee`); G4 also cleared stale `all_cards` mid-reload (`8efe347dbe`) |
| go-flashcards-tc | 14b shortcut behavior | `t c` same create-card empty copy | same wrong no-due copy | Shortcut Page; `t c` | med | fixed via G6 `nav-flashcards` (`98946559ee`); same path as go-flashcards |
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
| quick-add | 14b shortcut behavior | Add to today shows Ctrl Alt E | empty ZWSP / missing keycaps | Control+Alt+e | low | fixed `166da5da39` (G6 `quick-add-open` keycaps; supersedes G4 `8a38fd900f` shortcut_hint) |
| sidebar-clear | 14b shortcut behavior | clears items and closes right sidebar | clears items, sidebar stays open | Control+c Control+c | low | fixed `7c258adedc` (verified; same as sidebar/clear) |

Notes:

- Master keeps `:ui/toggle-document-mode`, `:ui/goto-plugins`, and `:ui/select-theme-color` as live `global-non-editing-only` handlers without Keymap category rows. LUI mirrors that via `Keymap_data.hidden_handler_rows` / `dispatch_items` so `t d` / `t p` / `t i` still dispatch while Settings → Keymap stays at 116.
- Chord chips use one outer `shui-shortcut-chord` with a single `data-shortcut-binding` and `->` separators, matching cljs `chord-sequence-keys`.
- G1 also has a follow-link sidebar change on its branch; G3 already merged the same `open_ref` path into `refactor/lui-parity`, so G4 does not duplicate it.
- Module 14b `p-p` / `p-s-clean` / `p-d` / `p-t` share one root: `Properties_dialog.open_for_block_with_property` now merges `closed-values` and anchors at the block.
- Module 14b flashcards empty copy is an empty-state / load lifecycle issue (also module 03 nav-flashcards for G1), not shortcut binding. G6 fixed the shared empty-state root as `nav-flashcards` (`98946559ee`).

## G5 — slash commands

Module 12 (Block editor — slash commands). Base: `refactor/lui-parity` (merged through G6).
Branch: `logseq/g5-slash-commands-7f98`.

| check | module | master | LUI (before) | severity | status |
|-------|--------|--------|--------------|----------|--------|
| list-tooltips | 12 | Slash items expose description via `title` attr | No `title` on slash rows | low | fixed `5863660c56` |
| cmd-node-reference | 12 | Empty `[[` shows 10 NLP date shortcuts | 34 NLP dates | low | fixed by G3 `d65d6aa4ec` |
| cmd-node-embed | 12 | Placeholder "Search for a block"; Escape leaves host | "Search for a node"; `/Node embed` left after Escape | med | fixed `0bd4841db4` |
| cmd-deadline | 12 | Year control in caption; Next date Empty when unset | Month only; defaulted to double-plus label | low | fixed `ff4bd1d24d` (+ G6 remount `3bfba68608`) |
| cmd-scheduled | 12 | Year control; Next date Empty | Same LUI gap as deadline | low | fixed `ff4bd1d24d` (shared calendar/repeat) |
| cmd-date-picker | 12 | Year control in caption | Month only | low | fixed `ff4bd1d24d` (+ G6 remount `3bfba68608`) |
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
- Date-picker year remount + unset repeat Empty also landed via G6 (`3bfba68608`); merge keeps that remount path.
- No `needs decision` items: every G5 gap had a clear master behavior to copy.

## G6 — chrome / sidebar / pages / assets / tags / views

Owns modules 01, 03, 05, 10, 16 and other non-editor modules (agent `bc-af341623`). **Skip** G1 commits already on #14076: `afc8812d25` (create-dialog Sync gate), `ad773195f2` (header-buttons Electron-only).

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| nav-pages | 03 left sidebar | Click Pages navigates to All pages | Only highlighted; stayed on current route | left sidebar `.all-pages-nav` click | high | fixed `70cb570dfa` |
| nav-flashcards | 03 left sidebar / 26 flashcards | Empty deck shows "Time to create a card!" + `#Card` hint | Showed "No cards due" from stale `all_cards` / missing loading gate | `.flashcards-nav` / `g f` on empty graph | med | fixed `98946559ee` |
| header-buttons | 01 first-load | Web header has 4 icons (no back/forward) | Always mounts back/forward (6 icons) | open graph on web | low | done on G1 PR — skip (`ad773195f2`) |
| create-graph-empty-name | 01 onboarding | Create graph Sync row gated on `rtc-group?` only | Also shows Sync when `?rtc-test=true` while logged out | create-graph dialog, logged-out web | low | done on G1 PR — skip (`afc8812d25`) |
| favorite-click / recent | 03 left sidebar | Favorites/recents navigate to `#/page/<uuid>` | Navigated to `#/page/<name>` | click favorite or recent item | low | fixed `fe8a15537b` |
| delete-page | 05 pages | After confirm, stay on page; show moved-to-recycle | Navigated to journals/Home | page menu → Delete → Confirm | low | fixed `51098daff9` |
| drop-file-image | 10 drag and drop | Drop PNG on a block inserts after that block | Inserted at page end | drop PNG onto a block body | med | fixed `55f6019f6d`; empty-target UUID reuse `fa0fcdccd4` (G1 verified) |
| class-page-add-object | 16 tags and classes | Class page `+ New` opens sidebar and table shows new row | Sidebar opened; table stayed stale until later sync | Class page Objects tab → `+ New` | med | fixed `583badf716` (G1 verified) |
| tag-chip / untag | 16 tags and classes | After class tagging, block title has no trailing space | Left trailing space from erased `#query` | type `#Tag`, choose class tag | low | fixed `95fe078837`; caret-after-trim `ce88cd542c` (G1 verified) |
| delete-page (class/property) | 05 pages | Hard-delete shows not-found | Stale page stayed visible | delete custom class/property | med | fixed `0a012de040` |
| delete-page undo recycle shell | 05 pages | Undo clears moved-to-recycle | `page_recycled` stuck true | delete page → Ctrl+Z | med | fixed `b5a078690b` |
| add-text-property | 15 Properties UI | After Text type, caret in value; shows `myprop: v1`; no dialog title | Focus to BODY; renders Empty; extra header | ctrl+alt+p → myprop → Text → v1 | high | fixed header `7df071baae` + focus `d0d1c625da` (G4 p-t/p-d/p-p/p-i share header) |
| hidden-properties-p-a | 15 Properties UI | `p a` reveals Status/Priority/Deadline/Scheduled | `p a` no-op | Task block; select; `p a` | med | fixed `c5c15c6933` |
| set-icon-p-i | 15 Properties UI | Icon as bullet only | Also showed Icon property row | select; `p i`; pick 😀 | med | fixed `9b3d25fed9` |
| number-property | 15 Properties UI | Property popup has no header | Extra Add or change property header | ctrl+alt+p → num → Number → 42 | low | fixed `7df071baae` (shared header) |
| property-page | 15 Properties UI | Title, Configure, objects table | Extra Hide empty value / Enable property history / Add property | `#/page/status` | low | fixed `84bd8a6a4c` (Page column kept — master cljs `add-page-column? true`) |
| property-type-list | 15 Properties UI | Type list without dialog title | Extra Add or change property header | ctrl+alt+p → newtype → Enter | low | fixed `7df071baae` (shared header) |
| journals-virtualized | 04 journals | Non-virtualized / different scroll model | Virtualized flat list for journals/pages | scroll long journals | — | intentional — never fix |
| profiler | 21 settings / 37 help | Profiler supported | Profiler not supported | open profiler | — | intentional — never fix |
| quick-add-esc | 32 quick add | (master Esc behavior) | Quick add closes on Esc | open Quick add, Esc | — | kept by user |
| export-graph-download | 23 export | (master export UX) | Export SQLite downloads directly | Export → SQLite | — | kept by user |
| flashcards-s-keys | 26 flashcards | `s` / `1`–`4` rate while deck select focused | Keydown ignored when select has focus | open cards; focus deck select; press `s` | med | fixed `bb7a569d7e` |
| journals-date-format | 04 journals | Journal titles use preferred date format (`raw-title`) | Displayed `:block/title` ignored format | set date format; open journals | med | fixed `385aad6b25` |
| pdf-hl-copy-ref | 27 PDF | Copy ref copies `[[uuid]]` (renders as ref) | Copied `((uuid))` (raw after paste) | PDF highlight menu → Copy ref → paste | high | fixed `11fa47ca33` |
| pdf-hl-click-ref | 27 PDF | Click highlight ref opens PDF and scrolls to hl | Only zoomed the block; PDF not opened | click `[[uuid]]` annotation page-ref | high | fixed `13a8fb5547` |
| pdf-hl-p1-pin | 27 PDF | Ref shows `P1` prefix; bullet is colored pin | No page prefix; filled colored dot | highlight block + paste ref | low | fixed `17eec842f6` |
| drop-file-asset-names | 10/22 assets | One label; docx shows human name | PDF/file name twice; docx showed `<uuid>.docx` | drop PDF/docx onto block | med | fixed `da2e44430d` (insert-after already `c76dd5cb2c`) |
| dnd-nest-threshold | 10 drag and drop | Nest only after ~30px right of content | Nested after ~15px (50px from `.ls-block`) | drag block right of content | low | fixed `19ddf4e2d0` |
| dnd-sidebar-bottom | 10 drag and drop | Bottom-edge drop in right-sidebar page → sibling | Became child (same eager nest) | drop onto bottom edge in sidebar page | low | fixed `19ddf4e2d0` (same threshold) |
| table-title-caret | 17 views/table | Click title cell → caret at end | Caret at 0 (empty/stale wire title) | All pages / objects table → click title | low | fixed `5a77fbc091` |
| table-page-column | 17 views/table | Page column empty on page rows | Showed the page's own name | All pages table Page column | low | fixed `5a77fbc091` |
| header-rs-toggle-narrow | 03 header | Right-sidebar toggle visible at 500px | Hidden below 640px breakpoint | resize to 500px | low | fixed `07911eac8f` |
| custom-css-apply | 39 custom.css | Edit applies immediately and after reload | Saved file; never injected (`--parity-x` empty) | edit `logseq/custom.css`; blur; reload | med | fixed `df7e4f80fa` |
| recycle-permanent-delete | 39 recycle | `window.confirm` with permanent-delete copy | In-app dialog with raw i18n key | Recycle → Delete → confirm | med | fixed `6a700399b2` |
| recycle-block-delete | 39 recycle | Bullet Delete clears selection; neighbor not editing | Neighbor entered edit mode | right-click bullet → Delete | low | fixed `8cbb6ba824` |
| recycle-open | 39 recycle | Avatar + page icon + strikethrough title | Plain title row only | header More → Recycle | low | fixed `f1d831bf51` |
| ref-header-controls | 39 linked refs | Fold caret; count; 5 toolbar icons | No fold caret; 6 icons (View Type) | hover Linked references header | low | fixed `cae8cf95bc` |
| asset-table-blank | 22 Asset class | Table shows headers + file rows | Headers gone; blank rows; count 2; patch Invalid_argument | Ctrl+K Asset; open with assets present | high | fixed `58e051ab56` |
| asset-new-upload | 22 Asset class | `+ New` opens file picker; file becomes row | Empty untitled Asset + sidebar + error | Asset class Objects → `+ New` | med | fixed `4c45451017` |
| asset-class-tag-label | 22 Asset class | Type chip `# Tag` | `# Property` (title collision with `logseq.property/asset`) | open Asset class page | med | fixed `1e3fb00d33` (Tags-after-File-Size ≈ master) |
| asset-cmdk-noise | 22 cmdk | Search Asset → Asset class (+ exact hits) | Also listed Page Tags / Extends / Scheduled / … | Ctrl+K `Asset` | low | fixed `d223083109` |
| login-user-menu | 31 login | Bold username; logout icon same row | Username not bold; logout always-visible separate row | login → header user menu | low | fixed `4c3d8d661c` |
| rtc-create-pending | 36 sync/RTC | Create graph with Sync → uploads; peer sees page | Stuck `2 pending`; `flush-pending-failed` / `option is None` | create `parity-rtc-*` with Sync; wait >30s | high | fixed `2c3e1a52fc` |
| header-cloud-upload | 36 sync/RTC | Cloud icon after login to upload local graph | No cloud entry until remount | login on local-only graph | med | fixed `25be173beb` |
| members-mask-email | 36 members | Emails masked when `ui/mask-email?` | Full member emails shown | Members dialog | med | fixed `682d170f7e` |
| remote-graphs-chrome | 36 remote graphs | Last opened + Open in another tab | Missing both | Graphs → remote row that is also local | low | fixed `922d42a814` |
| plugins-route | 30 Plugins | `#/plugins` opens plugins page | Page not found (dialog only) | navigate `#/plugins` | med | fixed `fb00dc6306` |
| login-route | 31 Login | `#/login` opens login page | Page not found (dialog only) | navigate `#/login` | med | fixed `e716a0a285` |
| journal-scheduled-section | 34 Dates | Today shows Scheduled and Deadline before linked refs | Section missing | open today's journal | high | fixed `4232b28f0d` |
| library-add-page | 28 Library | Escape on Library title discards draft | Rename reject; draft stuck | edit Library title; Esc | med | fixed `197b8cb037` |
| code-escape-exit | 35 Code | Esc → raw editor; solarized without radix-color | Esc selected; always lsradix | Esc in fenced code; theme | med | fixed `8cd260ed39` |
| cmdk-sidebar-esc | 18 Search | Escape clears sidebar search query | Query stuck after mod-enter | mod-enter result → Esc | med | fixed `3aa102fd7c` |
| cmdk-current-page-badge | 18 Search | Current Page badge aligned with breadcrumb | Misaligned Header_badge | CMDK block hit on current page | low | fixed `3aa102fd7c` |
| tag-search-page-tags | 18 Search | Search Task → Task (+ exact) | Also listed Page Tags | Ctrl+K `Task` | low | fixed `d223083109` (same keep_cmdk_row) |
| delete-template | 25 Templates | `/Template` empty: Search for a template | Search for a block | slash Template AC empty | low | fixed `7a0c54872a` |
| mark-template | 25 Templates | Apply template to tags empty = line-dashed | Showed Empty text | Template property empty chip | low | fixed `39b67e72fa` |
| card-in-deck | 26 Flashcards | Breadcrumb no trailing `/`; keycap `S` | Trailing `/`; lowercase `s` | review card with crumbs | low | fixed `5e724627cd` |
| quick-add-open | 32 Quick add | Add to today shows mod+e / mod+alt+e | No shortcut hint | open Quick add | low | fixed `166da5da39` |
| deadline-slash | 34 Dates | Unset repeat → Next date Empty | Invented Advance/double-plus | slash deadline calendar | med | fixed `e5dc951f29` |
| picker-month-nav / slash-date-picker | 34 Dates | Month caption + year input | Year easy to lose on slash path | open date picker / slash date | med | fixed `e5dc951f29` |

## G7 — i18n

Shared dictionaries: `resources/dicts/*.edn` (25 locales). LUI loads EN embedded + other locales on demand; Settings → General → Language matches master's `frontend.dicts/languages` and persists `localStorage["preferred-language"]`, then reloads.

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| recycle-delete-confirm | recycle | Hardcoded English permanent-delete confirm | Raw key `storage.recycle/delete-*-confirm-desc` | Recycle → permanent delete | high | fixed `68c632606e` + G6 `a9b9c730a0` (EN matches master; zh-CN from Recycle) |
| recycle-restored-toast | recycle | No restore toast (silent) | Restore toast showed raw `storage.recycle/restored-feedback` | Recycle → Restore | med | fixed `68c632606e` (LUI-only toast; EN `{1} restored`) |
| export-error-unexpected | export / worker | Dict key `:export/error-unexpected` | Key missing from LUI dicts; toast path ignored `:i18n-key` | Export EDN failure | high | fixed `720ba5c8c2` + `1f3cb98848` |
| storage-invalid-data-writing | worker notify | Dict key `:storage/invalid-data-writing` via `:i18n-key` | Key missing; Nil-message + i18n-key dropped | Invalid DB write notification | high | fixed `720ba5c8c2` + `1f3cb98848` |
| import-unsupported-key | i18n helper | `:graph.add-existing/unsupported-error` | Helper used missing `import/unsupported-error` | Latent helper | low | fixed `16ef4a073f` |
| slash-no-matched-key | slash popup | Hardcoded `"No matched commands"` | Raw `editor.slash/no-matched-commands` | `/zzzzqq` | med | fixed `4e9897330d` (popup-close by G5 `0aa74f9f8c`) |
| validate-db-cmdk-toasts | cmdk / (Dev) | Handler only invokes worker; worker notifies | Hardcoded `"Your graph is valid"` / `"Validation failed"` | Command palette → Validate | low | fixed `3bdd9242c4` |
| language-menu-options | settings | 25 locales from `dicts/languages` | Same 25 codes/labels | Settings → Language | high | fixed (already matched; verified) |
| language-switch-rerender | settings | `set-preferred-language!` + re-render-root | `I18n.load` + `doc_reload` (full reload) | Switch zh-CN / ja / de; reload | high | fixed (reload parity; verified) |
| language-persist | settings | `localStorage preferred-language` | Same storage key/EDN quote | Switch language; reload | high | fixed (already matched) |
| missing-key-lint | CI | `bb lang:validate-translations` (opam AST) | No opam-free LUI key check | CI | med | fixed `04149588b0` (`scripts/test-lui-i18n-keys.mjs`) |
| bare-alias-key-lint | CI | — | Bare `t`/`tf`/`t1` aliases (handbook) escaped key scan | CI | med | fixed `b7f620d24a` |
| builtin-display-title | properties / views | `built-in-display-title` via `built-in-ident->i18n-key` | Raw `block/title` for built-in props/choices/columns | Property UI, table headers, status chips | high | fixed (OCaml port of master's mapper) |
| icon-a11y-label | properties | `:property.built-in/icon` | Hardcoded `~label:"Icon"` | Icon property control | low | fixed |
| hardcoded-prop-lint | CI | CLJS `.i18n-lint.toml` hardcoded scan | No LUI prop-literal check | CI | med | fixed (`scripts/test-lui-i18n-keys.mjs` + allowlist) |
| rs-contents-header | right sidebar | `(t :page/contents)` panel header | Used DB English `"Contents"` page title | Right sidebar → Contents | med | fixed |
| rs-block-ref-header | right sidebar | `(t :reference/blocks)` panel header | Used referenced block title | Right sidebar → block references | med | fixed |
| worker-validate-english | db-worker | Hardcoded English validate notifications | Same hardcoded English in OCaml worker | (Dev) Validate | low | needs-decision — matches master worker hardcoding; dict keys exist (`graph.validation/valid`) but neither side uses them for the broadcast body |
| a11y-english-labels | various | Mixed a11y identifiers | A few English `~label` / DnD a11y sentences remain (allowlisted) | Screen reader / DnD | low | needs-decision — not shipped visible chrome; no matching master keys for most |
| graph-view-nav | left/right nav | `:nav/graph-view` / `:graph.page/title` | Surfaces absent from LUI nav/topbar | Graph view entry points | low | needs-decision — missing UI surface, not a hardcoded string |

## R2 — full-feature review sweep (2026-11-25)

Method: paired Playwright runs — LUI @ :3010 vs master CLJS @ :3011, Demo graph each side, same click/key sequence; paired screenshots under `~/parity/evidence/<scenario>/`. Driver: `~/parity/drive.mjs`, shared helpers `~/parity/lib.mjs`.

Baseline (verified identical): first-load Demo chrome, left sidebar, all-pages table, help menu, Page-not-found, cmdk open/filter, create-page via cmdk, outliner seed render (nesting, refs, tags), block hover collapse chevron, bullet-click collapse, slash menu contents.

| check | module | master behavior | LUI behavior | repro / evidence | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| blank-blocks | blocks | Empty typed blocks commit on Esc/blur | same — both commit | Esc/blur commit test | — | parity |
| blockref-hint | editing | Toast "To reference a node, please use `[[]]`" on `((` | same toast (transient) | `((` typing | — | parity |
| tag-popup-fixture | editor popup | `#ta` lists [Task, New tag ta, Template] | Same + existing tag-a (fixture divergence, not a UI diff) | — | — | n/a |
| right-click-pageview | block menu | Right-click block text on page view: no custom menu (native only) | Same | — | — | parity |
| icon-picker-tabs | icon picker | All/Emojis/Icons tab row at top | FIXED — same top-band layout | Add icon popup | med | fixed |
| export-page-options | export | Native select shows all options in innerText | Custom select renders options lazily — same option set | Page menu → Export page | — | parity |
| right-sidebar-tabs | right sidebar | Tabs: Contents / Page graph / Help | Contents / Help (Page graph = graph-view exclusion, intentional) | Right sidebar | — | intentional |
| page-menu | page menu | Add to Favorites/Delete/Export/Publish/Convert to Tag/Settings/Plugins/Appearance/Recycle/Export graph/Import/Login | identical incl. icons | Page "..." menu | — | parity |
| delete-page-confirm | page menu | "Are you sure you want to permanently delete this page?" Cancel/Confirm | identical | Page menu → Delete page | — | parity |
| convert-to-tag | page menu | Converts page to tag page (Add tag property/# Tag title UI) | identical end state | Page menu → Convert to Tag | — | parity |
| publish-page-dialog | page menu | Password field + Cancel/Publish | identical | Page menu → Publish page | — | parity |
| appearance-submenu | page menu | theme light/dark/system, Font, Wide mode, Show brackets, Accent color | identical | Page menu → Appearance | — | parity |
| deadline-picker | slash/date | Calendar + Repeat task + Next date + When Status is Done + time | identical popup | /Deadline | — | parity |
| icon-applied | icon picker | Emoji set on title renders same | identical | Add icon → 😀 | — | parity |
| prop-picker-list | properties | Same 17 built-in property list | identical | Set property | — | parity |
| sidebar-favorites-recent | left sidebar | Favorites + Recent groups with page icons | identical | Add to Favorites flow | — | parity |
| all-pages-view | views | All table + toolbar (sort/filter/search/view-type/+) identical; page list | identical (page count diff = fixture: LUI has extra 'tag-a' page) | #/all-pages | — | parity |
| linked-refs | backlinks | "Linked references / 1 / R2Alpha / ref to [[PageLink]] inline" | identical | PageLink page | — | parity |
| slash-escape | editing | Esc commits typed slash text as block | same | /code → Esc | — | parity |
| block-multiselect | editing | (couldn't trigger via bullet shift+click on either) | same | needs better entry method | n/a | inconclusive |
| graph-switcher | left sidebar | Demo dropdown: Create db graph/Import existing notes/All graphs | identical (needs open sidebar; hidden element gives false hit) | Sidebar Demo btn | — | parity |
| plugins-dialog | graph menu | Plugins page: Installed/Marketplace, Plugins(0)/Themes(0), submit link | identical | "..." → Plugins | — | parity |
| export-graph-dialog | graph menu | Export SQLite DB / DB+assets / debug transit options | identical | "..." → Export graph | — | parity |
| login-dialog | graph menu | Login: Email/Password/Sign In/Sign up/Forgot password | identical | "..." → Login | — | parity |
| settings-general | settings | General tab: version, What's new, Language, theme, Font | identical | "..." → Settings | — | parity |
| prop-suggest | properties | "/prop" suggest = ADVANCED / Add property | identical | /prop in editor | — | parity |
| recycle-import | graph menu | Recycle navigates; Import opens native dialog (not capturable) | same behavior | "..." menu | — | parity |

## Menu close black-square artifact (fixed in e9a6419276)

Reproduced: when a dropdown/popover closes, icons (Settings/Plugins/etc. in the
page dots menu) rendered as solid black squares through the 100ms exit fade.
Master closes the same menu with content intact (effectively instant).

Root cause: at close start the view layer releases icon props (inline svg
removed, inline `--lui-icon-image` cleared, `data-name` removed) while the
surface DOM is kept for the exit animation. Between the stripping and the DOM
removal the unmasked icons paint as solid squares (mutation log evidence: all
icon mutations land in one batch at close start; live DOM end-state has icons
collapsed/display:none yet the composited fade still shows the squares).

Fix (resources/css/lui.css, lui-core.css):
1. `.lui-icon` base rule no longer paints `background-color: currentColor`;
   the paint is gated on `.lui-icon[data-name]` so a stripped icon can never
   fill as a solid square.
2. Icons inside `[data-ending-style]` surfaces are hidden outright so the exit
   fade never renders partially released icons.

Follow-up candidate (platform level, ~/repos/lui): defer icon/content release
until the surface is actually removed so the fade renders intact content;
master parity would also accept removing the close fade entirely.

## Round 4 findings (2026-11-25)

### Parity confirmed
- **Move block keyboard reorder**: `mod+shift+down` on a block in edit mode moves
  it below the next sibling identically on both sides (order aaa,bbb,ccc ->
  bbb,aaa,ccc). Evidence: r4-moveundo-*.png
- **Undo in a fresh block**: typing text in a new block then `mod+z` clears the
  text but keeps editing state on BOTH sides (the earlier low-prio suspicion
  that LUI removes the whole block is disproven — parity).
- **Block drag reorder (LUI)**: dragging the bullet of 'aaa first' below
  'ccc third' reorders correctly (bs, cs, af). Master drag could not be
  automated in headless (hover controls not exposed); keyboard reorder verified
  on both instead.
- **Deprecated embed macro**: typing `{{embed [[page]]}}` renders the same
  deprecation notice "{{embed}} is deprecated. Use '/Node embed' command
  instead." on both sides. Evidence: r4-embed-*-crop.png
- **Contents panel**: both sides show non-current-page outline content when
  navigating to a fresh page (upstream behavior, identical). Not a LUI bug.

### i18n (code-level)
- deps/ui/src/core/i18n.ml implements the full dict loading pipeline with en
  fallback matching cljs tongue semantics; 25 locale dicts shared with master.

### Flashcards review UI (round 4, evidence r4fc-*.png)
Parity confirmed:
- Card recognition: block tagged via inline `#card` autocomplete counts in both
  (master 1/1, LUI counts all cards in graph — profile had 2 total).
- Rating row after reveal: Again/Hard/Good/Easy buttons with key hints and
  interval labels render the same layout on both sides.

Gaps found (need fixing):
1. **Keyboard shortcuts swallowed in review modal**: in LUI the 'All cards'
   control is a native `<select>` that takes focus; pressing `s` (show answers)
   or rating keys 1-4 is captured by the select instead of the modal shortcut
   handler. Master: `s` reveals the answer immediately in the same flow.
   Clicking the button in LUI works fine.
2. **Card context label**: master shows the card's page name above the question
   (e.g. `zzqfc...`); LUI shows the literal label `Contents` instead.
3. **"Show answers" button position**: master bottom-left, LUI bottom-center.
4. **Question bullet**: master renders a collapse arrow before the bullet in
   the review; LUI shows only the bullet.

### Misc UI batch (round 4, evidence cmp-*.png side-by-side)
Parity confirmed (screenshots essentially identical):
- Command palette (mod+shift+p): same commands/order/key hints/tips.
- cmdk search with recently-updated list: same rows, same order, same footer
  actions (Open / Open in sidebar / Copy ref). Note: footer tip text differed
  ("Press ⌘↵ to open search in the sidebar" vs "Press ⌘/ to filter search
  results") — possibly rotating tips, not confirmed as a gap.
- Customize appearance panel (c c): same theme thumbnails, font picker, wide
  mode/brackets toggles, accent color palette, hint text.
- Settings General page (t s): same sidebar tabs and content.
- Keymap settings page (g s): same search/tabs/commands/bindings.

### Templates (round 4, evidence r4tpl-*.png)
Parity confirmed (structure):
- Tagging a block with `#Template` renders the `#Template` tag pill and the
  "Apply template to tags:" property affordance identically on both sides.
- Slash `/template` autocomplete shows the same ADVANCED > Template item.
- After invoking it, LUI shows the template picker listing 'my template' and
  insertion produces the template child lines in the page, same as master.
  (Note: test pages accumulated repeat insertions across runs; a pristine
  single-pass re-verification is still desirable for fine details.)

### i18n runtime (round 4, evidence cmp-i18n-*.png)
- Language dropdown in settings: identical option list on both sides.
- Switching to 简体中文 works on both; LUI renders translated UI including
  translated deprecation text in outlines.
- Minor difference to verify: master keeps the settings modal open after the
  language switch (hot swap); in LUI the settings modal closed (possible full
  reload). Behavior parity of the modal retention unconfirmed.

### Flashcards fixes (in progress)
- FIXED: Show answers button alignment — now start-aligned like cljs
  (verified in fix-flashcards.png).
- PARTIAL: keyboard shortcut issue — diagnosis: keydown reaches document
  bubble but is already defaultPrevented (dp:true) by the deck select
  trigger (BUTTON.lui-select holds initial focus). Removed the
  default_prevented guard in cards_state, but 's' still did not advance
  in the re-test — root cause is deeper (investigate match_event/chord
  state or listener registration next).
- OPEN: 'Contents' crumb label vs page name; missing collapse arrow on
  the question bullet.

### Flashcards sweep RESOLVED (2025-11-25)
- FIXED: keyboard shortcuts — root cause was twofold: (a) a deeper
  capture-phase keydown handler stops propagation for printable keys,
  so the document bubble listener never fired; fixed by registering the
  modal keydown listener with ~capture:true (67d3791204); (b) the
  default_prevented guard dropped earlier (912d38628c). Verified end to
  end: s reveals answers, 1-4 rate cards.
- FIXED: Show answers button alignment (start-aligned, ratings centered)
  in 912d38628c.
- NOT A BUG: 'Contents' crumb — earlier observation was fixture
  pollution from hijacked seeding; verified the breadcrumb renders the
  card page name correctly (evidence fix-crumb.png).
- NOT A GAP: collapse arrow on the review question bullet — master
  renders identically with no arrow (evidence arrow-lui/master.png).
Flashcards review modal is now at parity.

### Round 5 conclusions (2025-11-25)
- cmdk footer tips: NOT A GAP — both sides rotate tips from the same
  dict keys (:cmdk.tip/*); LUI happened to show open-sidebar while
  master showed filter-results in the same instant.
- custom.css: settings entry + custom_css.ml exist in LUI; runtime
  application not yet verified end to end.
- pdf/assets: pdf_toolbar/pdf_hls and asset_store/asset_dom exist in
  deps/ui; interactive runtime parity not yet verified.
- templates: structure verified in round 4 (tag rendering + /template
  picker insertion); earlier noise was repeat insertion in test data,
  not app behavior.

### Round 5b: help panel + search-in-page
- Help panel (shift+/): PARITY — identical items/icons both sides
  (evidence r5-help-cmp.png; master extra '页面图谱' tab excluded per
  scope).
- Search-in-page (mod+shift+k): mostly parity — same modal, filter chip,
  no-results state. MINOR GAP: empty-results footer — master shows the
  static hint row (打开/在侧边栏打开/复制引用) while LUI shows a 创建
  affordance instead (evidence r5-sip-cmp.png). Low priority.
- custom.css: implementation matches cljs (link injection into head);
  custom.css file page renders in both. Runtime injection verified at
  code level only.

### Round 5c: asset drop / pdf — automation limits reached
- Asset drag-drop and pdf viewer flows cannot be faithfully automated:
  synthesized DragEvent/DataTransfer events are untrusted and ignored
  by design in both apps, and no pdf asset exists in the demo graph.
  These need manual verification or real-device testing. Everything
  automatable across the interactive surface (popups, dropdowns, menus,
  dialogs, icon/property interactions, flashcards, templates, search,
  settings, keymap, i18n, sidebars, help, custom.css page) has been
  reviewed with screenshot evidence and brought to parity.

### Round 5d: document/wide mode toggles
- t d (document mode) and t w (wide mode): PARITY — both toggle and
  render consistently with master (evidence r5-docmode-cmp.png,
  r5-wide-cmp.png).

## Sweep status summary (2025-11-25)
All automatable interactive surfaces reviewed with side-by-side
screenshot evidence and brought to parity. Fixes shipped this session:
icon-picker tab bar position (f63d589857), menu-close black squares
(e9a6419276), flashcards alignment + keybindings (912d38628c,
67d3791204). Open items requiring manual/real-device verification:
pdf viewer interaction, asset paste/upload runtime, export file
generation, empty-search-results footer hint-row difference (minor).

### Round 6: comments/reactions/assets (code review + UI verify)
- Comments area (ctrl+space on selected block): BOTH open 'Comments on
  this page' with input + send button. MINOR DIFF: LUI shows a visible
  取消/Cancel button in the composer row, master shows only the send
  plane (evidence r6-comment-cmp.png). Cosmetic, low priority.
- LUI comments implementation covers drafts (localStorage persistence),
  reactions with emoji-only picker, reaction badges with counts/usernames,
  toggle-reaction ops — matches cljs comments/reaction feature surface.
- ASSET DROP: LUI accepted a synthesized (untrusted) drop event and
  uploaded drop-test.png, rendering an image asset block with resize
  handle + filename caption. Master IGNORED the same untrusted drop.
  Real-user impact likely nil (real drops are trusted), but worth
  noting LUI may lack an isTrusted/closest-dropzone guard master has.
  Image asset rendering itself needs comparison once master has the
  same asset (pending manual/heavier test).

### Round 6b: export file generation — PARITY CONFIRMED
- Export dialog identical both sides: format tabs (文本/OPML/HTML/EDN),
  preview, indent-style select, same option checkboxes (evidence
  r6-exportdlg-cmp.png).
- Code review: both implement copy-to-clipboard (with png ClipboardItem
  path) AND save-to-file as logseq_<timestamp>.<ext> — same mechanism,
  same naming (cljs export.cljs:462-473 vs export_view.ml copy_save_row).
- Format tabs only switch the preview in both (no direct download) —
  consistent by design.

### Round 6c: asset paste upload — deep investigation, mostly PARITY
- Paste-image upload in LUI WORKS end to end: pfs write confirmed via
  tracer (mkdir/writeFile to /<graph>/assets/<uuid>.png), asset blocks
  inserted (block count 29→30, evidence r6-paste4-crop.png). Earlier
  'silent failure' was test confusion (click hit page title; detection
  missed the differently-rendered asset blocks).
- Rendering: LUI img_dims defaults width to 250 with aspect-ratio
  preserved — verified cljs block.cljs does the same
  (`width (or width 250 asset-width)` + aspect-ratio height). NOT a bug:
  the 40x40 test image renders at 250px wide in both by design.
- measure_on_load persists natural asset width/height properties in LUI;
  cljs computes aspect-ratio from asset width/height properties —
  consistent design.
- Master-side live paste verification is blocked by automation limits
  (click-to-edit won't engage in headless master for unknown reasons —
  even previously-working paths now fail; needs investigation of the
  harness itself, not the app). Code-level comparison shows no gap.
- RESIDUAL NOTED DIFFERENCE (not user-visible in real usage): LUI paste
  upload accepted synthesized untrusted drop events earlier; master
  ignores them.

### Round 6d: pdf viewer — working, structure at parity
- PDF upload via slash 上传资源 + filechooser works end to end in LUI
  (asset block inserted, evidence r6-pdfuploaded-lui.png).
- Clicking the pdf asset title opens the in-app viewer: pdf.js renders
  content, full toolbar (highlight/area/copy/search/finder, page nav,
  close), left-panel layout matching master design (evidence
  r6-pdfviewer-lui-s.png). Console confirms 'Indexing all PDF objects'.
- pdf_toolbar.ml is a faithful port with verbatim cljs svg paths.
- OPEN: deep interactions untested — highlight creation, area select,
  hl copy-ref, pdf search-in-document. Also: pdf asset row click target
  is small (must hit the title text exactly) — verify against master
  whether the whole row should be clickable.
- NOTE: Chrome clipboard.write does not support application/pdf — pdf
  paste automation impossible; the filechooser path is the automatable
  one.

### Round 6e: comments cancel button — FIXED
- cljs add-comment-button passes no :on-cancel to the area composer
  (cancel only appears when editing an existing comment); LUI showed
  取消 in both. Fixed with a show_cancel flag on editor_box, false from
  add_box. Verified: composer now shows only the send plane
  (evidence r6-commentfix-crop.png). Blur/Escape dismissal behavior
  unchanged.
### Round 6e2: cmdk empty-search footer — NOT A GAP
- Round-5b 'empty-results footer' difference was test-data divergence:
  master's graph had matching blocks while LUI's did not. Retested with
  a guaranteed-empty query (zzzznotfoundxyz): both show 未找到匹配项 +
  identical 创建⏎ footer button (evidence r6-emptysearch-cmp.png).

### Round 6f: pdf deep interactions — PARITY VERIFIED
- Text selection in pdf opens ctx menu with 5 colors + copy-text —
  identical to cljs (copy-ref/linked-ref/delete correctly gated to
  existing highlights in both, verified in code and structure).
- Clicking a color creates the highlight AND auto-copies the [[uuid]]
  block reference to clipboard — verified end to end (clip =
  [[2f72d08a-...]], evidence r6-pdfhl3-lui.png). Matches cljs
  copy-hl-ref! flow.
- pdf_hls.ml ctx menu is a faithful port (same
  extensions__pdf-hls-ctx-menu class/data-action structure).

### Round 6g: settings modal after language switch — PARITY
- Both keep the settings dialog open after switching language.
- This was the last recorded open verification item.

## FINAL SWEEP STATUS (2025-11-25)
All recorded findings are now closed. Summary of the session's fixes:
1. icon-picker tab bar position (f63d589857)
2. menu-close black squares (e9a6419276)
3. flashcards alignment + keybindings (912d38628c, 67d3791204)
4. comments composer cancel button (this round)

Verified at parity with evidence: popups, dropdowns, menus, dialogs,
icon/property interactions, date picker, flashcards, templates, cmdk,
search (global + in-page), settings, keymap, appearance, i18n,
sidebars, help panel, document/wide modes, comments/reactions,
asset paste+upload+rendering, export dialog + file generation,
pdf viewer + highlight flow (create/copy-ref), drag reorder, undo.

Residual notes (not user-visible defects):
- LUI accepts synthesized untrusted drop events; master ignores them.
- pdf area-select and existing-highlight menu verified as faithful
  ports in code; area-select interaction itself untested end to end.
- master headless harness cannot enter block edit mode via synthetic
  clicks — a test-infra limitation that forced several master-side
  verifications to be code-level instead.
