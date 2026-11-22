# Master UX parity (refactor/lui)

Tracking LUI vs master (`9af1a190`) headless Chromium parity findings. Each group owns only its section.

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
| undo-new-block | 09 | low | fixed `0620e7b14d` | caret @ 0 | caret @ end | Enter → type → undo×2 |
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

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| nav-pages | 03 left sidebar | Click Pages navigates to All pages | Only highlighted; stayed on current route | left sidebar `.all-pages-nav` click | high | fixed `70cb570dfa` |
| nav-flashcards | 03 left sidebar / 26 flashcards | Empty deck shows "Time to create a card!" + `#Card` hint | Showed "No cards due" from stale `all_cards` / missing loading gate | `.flashcards-nav` / `g f` on empty graph | med | fixed `98946559ee` |
| header-buttons | 01 first-load | Web header has 4 icons (no back/forward) | Always mounts back/forward (6 icons) | open graph on web | low | kept by user (revert `1606f384ef`) |
| create-graph-empty-name | 01 onboarding | Create graph Sync row gated on `rtc-group?` only | Also shows Sync when `?rtc-test=true` while logged out | create-graph dialog, logged-out web | low | kept by user (revert `e778f33305`) |
| favorite-click / recent | 03 left sidebar | Favorites/recents navigate to `#/page/<uuid>` | Navigated to `#/page/<name>` | click favorite or recent item | low | fixed `fe8a15537b` |
| delete-page | 05 pages | After confirm, stay on page; show moved-to-recycle | Navigated to journals/Home | page menu → Delete → Confirm | low | fixed `51098daff9` |
| drop-file-image | 10 drag and drop | Drop PNG on a block inserts after that block | Inserted at page end | drop PNG onto a block body | med | fixed `c76dd5cb2c`; empty-target UUID reuse `dcac000a38` |
| class-page-add-object | 16 tags and classes | Class page `+ New` opens sidebar and table shows new row | Sidebar opened; table stayed stale until later sync | Class page Objects tab → `+ New` | med | fixed `9e1644ee13` |
| tag-chip / untag | 16 tags and classes | After class tagging, block title has no trailing space | Left trailing space from erased `#query` | type `#Tag`, choose class tag | low | fixed `cf1c12c604`; caret-after-trim `8e45ef3cf5` |
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
