# Shortcut source parity and native qualification ledger

## Scope and counting rules

This is a source inventory, not an execution pass. Frozen master is
`29fd2edd015e12963742b985ce6d2311c074e09b`; the reviewed App is
`ea2bfbae0f542f6a748734b892b24e6945e152b2`, with pinned LUI
`93712b51ab40d7c5882fed1501568a55ab6722ba` and NSH
`adc186db7213f3ccd1eacaa836cc721e9779fd14`. No build, compiler, test or native
application was run for this review. Existing coordinated execution evidence is explicitly
identified below; it does not convert this inventory into a full keyboard pass.

Every entry of master's `all-built-in-keyboard-shortcuts` in
`src/main/frontend/modules/shortcut/config.cljs` is represented below, including
unbound, conditional desktop/plugin/developer entries. Default strings/vectors
and both literal `(if mac? ... ...)` branches were read from balanced source
forms. Runtime `:inactive` expressions are recorded, not guessed. The count is
therefore reproducible without pretending that mutually conditional entries are
all active in one session. Plugin-registered commands and user overrides are an
open runtime set, not part of this finite built-in inventory. `mod` means Cmd on
macOS and Ctrl elsewhere. Slash-separated alternatives are alternatives; spaces
inside a binding denote a sequence, not simultaneous keys.

- Master: **145 built-in IDs**, **118 macOS / 122 non-Mac IDs with a nonempty
  default binding**, before `:inactive` pruning. **121 unconditional IDs** and
  **24 conditionally inactive IDs**. Among the unconditional IDs, 109 macOS /
  113 non-Mac IDs have nonempty defaults.
- Current: **135 of those 145 IDs have matching effective default keystrokes
  on both platform branches**. Empty master vectors and current `null` both
  have no default keystroke; this comparison does not equate the separate
  configured Disabled/Unbound states. **10 IDs have no current default entry**.
- Of the 10 absent entries, **7 have a master default key**: three Electron
  find commands, graph save, shell run, fallback copy and Graph View. The three
  other absent entries are two unbound plugin-install commands and an unbound
  developer database-replacement command. Graph View is explicitly excluded
  from the user's migration scope; the other absences remain individually
  classified below.
- Context memberships overlap: `editor/add-comment` belongs to editing and
  nonediting groups.
  The matrix keeps both memberships. Counts above count command IDs, not bindings or scope
  memberships. No row is marked universally executed.

## Context and delivery owners

Master's `*config` and `modules/shortcut/before.cljs` determine contexts:
`editing` requires block editing; `editor` allows the editor-global group when
not editing another component (with SRS/history exceptions); `global` is the
prevent-default group; `normal` refuses editing/input targets and enforces
`:selection?` when present; `ac` owns autocomplete; `pdf` and `cards` are their
own nonediting modal contexts. `misc` is the final browser copy fallback.
The date-picker namespace adds **zero built-ins in this map**; its real local
calendar/input keys are not an omitted catalog row.

Current effective/configured defaults and scopes are owned by
`src/settings/keymap_data.ml:45–140,297–315,349–362`. Native publication in
`native/native_embed.ml:93–126` includes only its five global/editor scopes.
`nsh/src/services/keyboard.rs:130–149,240–380` validates and installs those
strokes, deduplicates them, preserves editor-owned and platform-reserved keys,
and uses contextual `When` policy. A sequence is flattened only for native
stroke subscription; `Editor_keys.on_global_key` remains the sequence matcher.
Native `native-key` decoding/admission/current-editor checks occur in
`native/native_embed.ml:948–989`. These mechanisms prove a route, not actual
OS delivery for every shortcut/layout/platform.

`Editor_keys` has independent guards for composition, publication, palette,
photo-viewer, control-owned keys, CodeMirror, property editors and pending focus
handoffs (`src/editor/editor_keys.ml:16–92,661–751,1569–1660`). Its current
catalog gate is not identical to master's `:selection?` metadata: named-property
and other command target helpers must enforce meaningful target availability.
The keymap recording owner runs before application shortcuts. Update admission
can refuse mutation/input while an update preparation holds the application.
Every actual test must therefore specify focus/context, selection, editable
state and composition rather than just a command ID.

## Concrete source gaps and semantic differences

| Finding | Source evidence and consequence | Required next gate |
| --- | --- | --- |
| Electron find, next, previous | Master binds Mod-F, Enter/Mod-G, Shift-Enter/Mod-Shift-G only in Electron. No current keymap entry or corresponding command branch. `go/search-in-page` is a distinct search command, not proof of desktop find parity. | Actual long-page text find/next/previous with editor and noneditor focus; decide a faithful implementation. |
| Graph save and shell | Master Electron-only Mod-S and Mod-Shift-1 are absent from current catalog/dispatcher. Normal autosave does not establish the explicit save command's flush semantics. | Trace existing save/shell capability and specify product behavior; do not claim equivalent no-op. |
| Browser fallback copy | `misc/copy` lacks a current default row. `Cmdk_state.shortcut_action` has a literal fallback, while `editor/copy` and native controls already own Mod-C. The missing final browser fallback is a source difference, not proof every native copy is broken. | Copy ordinary selectable noneditor text, input selection, block selection and reference surfaces separately. |
| PDF configured keys | Four PDF defaults remain in keymap data, but `Editor_keys.chord_table` excludes `pdf`; native publication excludes it too. `native/pdf.ml`, the Rust PDF extension and PDFKit mount have no App handler for these configured IDs. Existing toolbar actions/PDFKit platform shortcuts do not implement the configured Alt-P/N/X/F route. | Actual PDF focused/nonfocused previous/next/close/find, custom bindings and reader focus restoration, independently on each supported OS. |
| Cards native delivery | `Cards_state.on_keydown:513–540` implements S and 1–4 with phase/composition/editing guards via explicit default IDs. Those five IDs have defaults but no `items_json` rows; the native keymap publisher consequently never subscribes their modal keys. Shared handler coverage cannot establish native delivery; incidental globally bound S is not a complete 1–4 path. | Real card modal, native S and all ratings, wrong-phase suppression, input focus and custom bindings. Reuse one modal owner, not an always-global digit map. |
| Missing theme/plugin key rows | `ui/select-theme-color` (T I) and `ui/goto-plugins` (T P) retain defaults and CmdK branches but have no current keymap item rows. Both the global chord matcher and native publication enumerate item rows, so these default sequences are not published through their actual command route. | Real T I/T P with eligible desktop capability; preserve explicit unavailable plugin-runtime behavior. |
| Editing context regressions | Master `editor/add-comment` is in editing and nonediting groups; current catalog records only nonediting, and the Ctrl-Space fallback is only in `Editor_keys.on_normal_key:816`. Master `ui/toggle-contents` is global-prevent-default, current only nonediting. Their global matcher/native publisher therefore suppress these commands while an editor owns focus. | Editing Ctrl-Space must save the captured block and hand off to the comment reply; Alt-Shift-C must retain its dirty editor. Verify the normal/select-mode counterpart independently. |
| YouTube timestamp command | `Cmdk_state.editor_action:1438` forwards the ID through native `Cmdk_host.editor_command:342–344` to `Editor_keys.dispatch_command`. That function has no timestamp case and ends in `\| _ -> ()`. Thus the exposed command route does not insert a timestamp. | Owned playable media plus editing caret, persisted insertion; explicit unavailable behavior where no valid timestamp source exists. |
| Number-list selection transaction | Master `handler/events.cljs:318–334` resolves the selected blocks and chooses a batch helper when there is more than one. Native `Cmdk_host:360–361` iterates `toggle_own_list` per UUID (Web twin does too). Selection-menu low-level route targets one UUID. This is still an active batch/history parity gap; inspection is not a fix. | Selected mixed/all-numbered blocks, one history action, outside-click target, editing fallback and fresh persisted state. |
| Plugin/theme/runtime commands | Plugin dashboard and theme search have command routes. `native/plugin_host.ml` explicitly has no LSPluginCore sandbox and reports unavailable for runtime operations. Unbound plugin-install entries are omitted. Exposing a dashboard is not plugin runtime parity. | Separate supported package/theme UI from unavailable runtime commands and verify honest capability handling. |
| Developer replacement | Master unbound, Electron+developer-gated `dev/replace-graph-with-db-file` is absent; ordinary developer commands are gated in the current command table. | Explicit product-scope/owned database replacement acceptance before claiming this capability. |
| Graph View | Missing `go/graph-view` / G G is intentional because Graph View is excluded by the user. | No Graph View completion gate is required. |

## Existing execution evidence, bounded precisely

- `nsh-native-cmdk.md` records a real release AppKit driver test: native Mod-K,
  search typing, arrows/Enter result activation, cancellation preserving the
  dirty editor, continued typing and saved-query selection. This is useful
  native evidence for those paths, not every command-palette binding.
- Existing qualification records report `/tmp/logseq-current-release-block-all.log` passed actual block
  editing, copy/Undo/Enter/Tab/Escape and nonediting selection/drop/cancel with
  persisted order. It is not a per-ID, per-context shortcut matrix; code-editor
  Undo and outliner Undo must not be conflated.
- Existing qualification records report task cycling passed **19,405 shared checks, 0 failures** and
  actual native-archive admission. The marked portable command fixture drives
  the real CmdK/context entry and checks exact ordered operations. These are
  semantic document-command tests, not physical Mod-Enter delivery.
- `picker-keyboard-parity.md` identifies picker query-first Escape and the
  separate missing grid-navigation route. It must not be treated as a pass for
  all arrows/Tab. Later execution requires its own fresh receipt.
- `/tmp/logseq-linear-merge-native-900-selector.log` failed only a metadata
  predicate that read ancestry fields at the wrong level. Existing qualification records report its
  corrected strict 900-line native case passed at App c268; that demonstrates
  bounded hover/scroll/editor behavior, not shortcut coverage.
- Native hardware IME, alternate keyboard layouts and exhaustive Windows/Linux
  command delivery remain unqualified. Driver-injected native input is not a
  physical hardware test.

## Exhaustive built-in matrix

`M:line` locates the master declaration in the frozen config file. Current
locators are under `deps/ui/`: EK=`src/editor/editor_keys.ml`,
CK=`src/shared/cmdk_state.ml`, AC=`src/popups/popups_state.ml`,
CA=`src/cards/cards_state.ml`, NH=`native/cmdk_host.ml`. A listed literal is a
source locator requiring the dispatch/adapter trace above; it is deliberately
not a claim that downstream capability succeeds. `U` means no exhaustive actual
native shortcut qualification. `G` references a concrete source gap above;
`X` is the user-excluded Graph View. `Q1` is the bounded actual CmdK evidence,
with all untested contexts/platforms still U. A dash is no default key.

Gate codes describe master `:inactive`: E=not Electron; P=publishing;
L=plugins disabled; C=plugin config disabled; LE=plugins disabled or not Electron;
D=developer mode disabled; DE=not Electron or developer mode disabled.
`sel` records master's selection-required marker. `none` means no inactive gate,
not permission to run in every context. The table includes conditional entries
rather than silently dropping desktop-only commands.

| ID / master locator | Master macOS; non-Mac default | Master context / gate | Current default / scope | Current dispatch locator | Native qualification |
| --- | --- | --- | --- | --- | --- |
| `pdf/previous-page` M:56 | `alt+p` | pdf; none | same; pdf | none in dispatch owners | G / U |
| `pdf/next-page` M:59 | `alt+n` | pdf; none | same; pdf | none in dispatch owners | G / U |
| `pdf/close` M:62 | `alt+x` | pdf; none | same; pdf | none in dispatch owners | G / U |
| `pdf/find` M:65 | `alt+f` | pdf; none | same; pdf | none in dispatch owners | G / U |
| `auto-complete/complete` M:68 | `enter` | ac; none | same; auto-complete | AC:2128 | U |
| `auto-complete/prev` M:71 | `up / ctrl+p` | ac; none | same; auto-complete | AC:2128 | U |
| `auto-complete/next` M:74 | `down / ctrl+n` | ac; none | same; auto-complete | AC:2128 | U |
| `auto-complete/shift-complete` M:77 | `shift+enter` | ac; none | same; auto-complete | AC:2129 | U |
| `auto-complete/meta-complete` M:80 | `mod+enter` | ac; none | same; auto-complete | AC:2129 | U |
| `cards/toggle-answers` M:84 | `s` | cards; none | same; no catalog row | CA:521 | G / U |
| `cards/again` M:87 | `1` | cards; none | same; no catalog row | CA:521 | G / U |
| `cards/hard` M:90 | `2` | cards; none | same; no catalog row | CA:521 | G / U |
| `cards/good` M:93 | `3` | cards; none | same; no catalog row | CA:521 | G / U |
| `cards/easy` M:96 | `4` | cards; none | same; no catalog row | CA:521 | G / U |
| `editor/escape-editing` M:99 | `—` | editing; none | same; block-editing-only | EK:1346, CK:1431 | U |
| `editor/backspace` M:103 | `backspace` | editing; none | same; block-editing-only | EK:1343, CK:1431 | U |
| `editor/delete` M:106 | `delete` | editing; none | same; block-editing-only | EK:1344, CK:1431 | U |
| `editor/new-block` M:109 | `enter` | editing; none | same; block-editing-only | EK:1342, CK:1430 | U |
| `editor/new-line` M:112 | `shift+enter` | editing; none | same; block-editing-only | EK:1347, CK:1430 | U |
| `editor/follow-link` M:115 | `mod+o` | editing; none | same; block-editing-only | EK:1335, CK:1432 | U |
| `editor/open-link-in-sidebar` M:118 | `mod+shift+o` | editing; none | same; block-editing-only | EK:1336, CK:1432 | U |
| `editor/bold` M:121 | `mod+b` | editing; none | same; block-editing-only | EK:1351, CK:1437 | U |
| `editor/italics` M:124 | `mod+i` | editing; none | same; block-editing-only | EK:1352, CK:1438 | U |
| `editor/highlight` M:127 | `mod+shift+h` | editing; none | same; block-editing-only | EK:1354, CK:1437 | U |
| `editor/strike-through` M:130 | `mod+shift+s` | editing; none | same; block-editing-only | EK:1353, CK:1438 | U |
| `editor/clear-block` M:133 | `ctrl+l; alt+l` | editing; none | same; block-editing-only | EK:1355, CK:1434 | U |
| `editor/kill-line-before` M:136 | `ctrl+u; alt+u` | editing; none | same; block-editing-only | EK:1356, CK:1436 | U |
| `editor/kill-line-after` M:139 | `—; alt+k` | editing; none | same; block-editing-only | EK:1357, CK:1436 | U |
| `editor/beginning-of-block` M:142 | `—; alt+a` | editing; none | same; block-editing-only | EK:1364, CK:1434 | U |
| `editor/end-of-block` M:145 | `—; alt+e` | editing; none | same; block-editing-only | EK:1366, CK:1435 | U |
| `editor/forward-word` M:148 | `ctrl+shift+f; alt+f` | editing; none | same; block-editing-only | EK:1362, CK:1435 | U |
| `editor/backward-word` M:151 | `ctrl+shift+b; alt+b` | editing; none | same; block-editing-only | EK:1360, CK:1433 | U |
| `editor/forward-kill-word` M:154 | `ctrl+w; alt+d` | editing; none | same; block-editing-only | EK:1359, CK:1435 | U |
| `editor/backward-kill-word` M:157 | `—; alt+w` | editing; none | same; block-editing-only | EK:1358, CK:1433 | U |
| `editor/copy-embed` M:160 | `mod+shift+e` | editing; none | same; block-editing-only | EK:1339, CK:1434 | U |
| `editor/paste-text-in-one-block-at-point` M:163 | `mod+shift+v` | editing; none | same; block-editing-only | EK:1341, CK:1437 | U |
| `editor/insert-youtube-timestamp` M:166 | `mod+shift+y` | editing; none | same; block-editing-only | CK:1438 | G / U |
| `editor/cycle-todo` M:169 | `mod+enter` | editor; none | same; editor-global | CK:1415, AC:2234 | U |
| `editor/up` M:172 | `up / ctrl+p` | editor; none | same; editor-global | EK:1369, CK:1428 | U |
| `editor/down` M:175 | `down / ctrl+n` | editor; none | same; editor-global | EK:1368, CK:1428 | U |
| `editor/left` M:178 | `left` | editor; none | same; editor-global | EK:1372, CK:1428 | U |
| `editor/right` M:181 | `right` | editor; none | same; editor-global | EK:1370, CK:1428 | U |
| `editor/move-block-up` M:184 | `mod+shift+up; alt+shift+up` | editor; none | same; editor-global | CK:1390 | U |
| `editor/move-block-down` M:187 | `mod+shift+down; alt+shift+down` | editor; none | same; editor-global | CK:1391 | U |
| `editor/move-blocks` M:189 | `mod+shift+m` | editor; none | same; editor-global | CK:92 | U |
| `editor/open-edit` M:192 | `enter` | editor; none | same; editor-global | CK:1404 | U |
| `editor/open-selected-blocks-in-sidebar` M:195 | `shift+enter` | editor; none | same; editor-global | CK:1406 | U |
| `editor/select-block-up` M:198 | `alt+up` | editor; none | same; editor-global | CK:1396 | U |
| `editor/select-block-down` M:201 | `alt+down` | editor; none | same; editor-global | CK:1397 | U |
| `editor/select-up` M:204 | `shift+up` | editor; none | same; editor-global | CK:1394 | U |
| `editor/select-down` M:207 | `shift+down` | editor; none | same; editor-global | CK:1395 | U |
| `editor/delete-selection` M:210 | `backspace / delete` | editor; none | same; editor-global | CK:1392, AC:2192 | U |
| `editor/expand-block-children` M:213 | `mod+down` | editor; none | same; editor-global | CK:1410, AC:2197 | U |
| `editor/collapse-block-children` M:216 | `mod+up` | editor; none | same; editor-global | CK:1412, AC:2198 | U |
| `editor/toggle-block-children` M:219 | `mod+;` | editor; none | same; editor-global | CK:1408 | U |
| `editor/indent` M:222 | `tab` | editor; none | same; editor-global | CK:1388 | U |
| `editor/outdent` M:225 | `shift+tab` | editor; none | same; editor-global | CK:1389 | U |
| `editor/copy` M:228 | `mod+c` | editor; none | same; editor-global | EK:922, CK:1424 | U |
| `editor/copy-text` M:231 | `mod+shift+c` | editor; none | same; editor-global | CK:1425 | U |
| `editor/cut` M:234 | `mod+x` | editor; none | same; editor-global | EK:925, CK:1426, AC:2191 | U |
| `editor/undo` M:237 | `mod+z` | global; none | same; global-prevent-default | CK:1421 | U |
| `editor/redo` M:240 | `mod+shift+z / mod+y` | global; none | same; global-prevent-default | CK:1422 | U |
| `editor/insert-link` M:243 | `mod+l` | global; none | same; global-prevent-default | EK:1333, CK:1430 | U |
| `editor/select-all-blocks` M:246 | `mod+shift+a` | global; none | same; global-prevent-default | CK:1393 | U |
| `editor/select-parent` M:249 | `mod+a` | editor; none | same; editor-global | EK:729, CK:1398 | U |
| `editor/zoom-in` M:252 | `mod+. / mod+shift+.; alt+right` | editing; none | same; block-editing-only | EK:1337, CK:1432 | U |
| `editor/zoom-out` M:255 | `mod+,; alt+left` | editing; none | same; block-editing-only | EK:1338, CK:1433 | U |
| `editor/toggle-number-list` M:258 | `t n` | global; none | same; global-prevent-default | CK:1719 | G / U |
| `editor/add-property` M:261 | `mod+p; ctrl+alt+p` | global; none | same; global-prevent-default | CK:1690 | U |
| `editor/set-tags` M:266 | `p t` | normal; none + sel | same; global-non-editing-only | CK:1698 | U |
| `editor/add-property-deadline` M:271 | `p d` | normal; none + sel | same; global-non-editing-only | CK:1697 | U |
| `editor/add-property-status` M:276 | `p s` | normal; none + sel | same; global-non-editing-only | CK:1697 | U |
| `editor/add-property-priority` M:281 | `p p` | normal; none + sel | same; global-non-editing-only | CK:1698 | U |
| `editor/add-property-icon` M:286 | `p i` | normal; none + sel | same; global-non-editing-only | CK:1713 | U |
| `editor/add-reaction` M:291 | `p r` | normal; none + sel | same; global-non-editing-only | CK:1714 | U |
| `editor/add-comment` M:296 | `ctrl+space` | editing/normal; none + sel | same; global-non-editing-only | CK:1715 | G / U |
| `editor/toggle-display-hidden-properties` M:300 | `p a` | normal; none | same; global-non-editing-only | CK:1440 | U |
| `ui/toggle-brackets` M:303 | `t b` | global; none | same; global-prevent-default | CK:1722 | U |
| `go/search` M:306 | `mod+k` | global; none | same; global-prevent-default | EK:727, CK:1575 | Q1 / U |
| `go/search-themes` M:309 | `mod+shift+i; alt+shift+i` | global; none | same; global-prevent-default | CK:1581 | G / U |
| `command-palette/toggle` M:312 | `mod+shift+p` | global; none | same; global-prevent-default | EK:715, CK:1767 | U |
| `go/search-in-page` M:315 | `mod+shift+k` | global; none | same; global-prevent-default | CK:1576 | U |
| `go/electron-find-in-page` M:318 | `mod+f` | global; E | absent; no catalog row | none in dispatch owners | G / U |
| `go/electron-jump-to-the-next` M:322 | `enter / mod+g` | global; E | absent; no catalog row | none in dispatch owners | G / U |
| `go/electron-jump-to-the-previous` M:326 | `shift+enter / mod+shift+g` | global; E | absent; no catalog row | none in dispatch owners | G / U |
| `go/journals` M:330 | `g j` | normal; none | same; global-non-editing-only | CK:1587 | U |
| `go/backward` M:333 | `mod+open-square-bracket` | global; none | same; global-prevent-default | CK:1451 | U |
| `go/forward` M:336 | `mod+close-square-bracket` | global; none | same; global-prevent-default | CK:1452 | U |
| `search/re-index` M:339 | `mod+c mod+s` | global; none | same; global-prevent-default | CK:1630 | U |
| `sidebar/open-today-page` M:342 | `mod+shift+j; alt+shift+j` | global; none | same; global-prevent-default | CK:1607 | U |
| `sidebar/close-top` M:345 | `c t` | normal; none | same; global-non-editing-only | CK:1454 | U |
| `sidebar/clear` M:348 | `mod+c mod+c` | global; none | same; global-prevent-default | CK:1453 | U |
| `misc/copy` M:353 | `mod+c` | misc; none | absent; no catalog row | CK:1450 | G / U |
| `graph/export-as-html` M:356 | `—` | editor; none | same; editor-global | CK:1626 | U |
| `graph/open` M:360 | `alt+shift+g` | editor; none | same; editor-global | CK:1620 | U |
| `graph/remove` M:365 | `—` | editor; none | same; editor-global | CK:1620 | U |
| `graph/add` M:370 | `—` | editor; P | same; editor-global | CK:1619 | U |
| `graph/db-add` M:374 | `—` | editor; P | same; no catalog row | CK:1623 | U |
| `graph/db-save` M:378 | `mod+s` | global; E | absent; no catalog row | none in dispatch owners | G / U |
| `publish/open-dialog` M:382 | `mod+m` | global; P | same; global-prevent-default | CK:1629 | U |
| `shell/run` M:386 | `mod+shift+1` | global; E | absent; no catalog row | none in dispatch owners | G / U |
| `go/home` M:392 | `g h` | normal; none | same; global-non-editing-only | CK:1586 | U |
| `go/all-pages` M:395 | `g a` | normal; none | same; global-non-editing-only | CK:1594 | U |
| `go/graph-view` M:398 | `g g` | normal; none | absent; no catalog row | none in dispatch owners | X |
| `go/all-graphs` M:401 | `g shift+g` | normal; none | same; global-non-editing-only | CK:1593 | U |
| `go/keyboard-shortcuts` M:404 | `g s` | normal; none | same; global-non-editing-only | CK:1602 | U |
| `go/tomorrow` M:407 | `g t` | normal; none | same; global-non-editing-only | CK:1610 | U |
| `go/next-journal` M:410 | `g n` | normal; none | same; global-non-editing-only | CK:1611 | U |
| `go/prev-journal` M:413 | `g p` | normal; none | same; global-non-editing-only | CK:1615 | U |
| `go/flashcards` M:416 | `g f / t c` | normal; none | same; global-non-editing-only | CK:1716 | U |
| `ui/toggle-document-mode` M:419 | `t d` | normal; none | same; global-non-editing-only | CK:1681 | U |
| `ui/highlight-recent-blocks` M:422 | `mod+c mod+r` | normal; none | same; global-non-editing-only | CK:1684 | U |
| `ui/toggle-settings` M:425 | `t s / mod+,; t s` | normal; none | same; global-non-editing-only | CK:1595 | U |
| `ui/toggle-right-sidebar` M:428 | `t r` | normal; none | same; global-non-editing-only | CK:1668 | U |
| `ui/toggle-left-sidebar` M:431 | `t l` | normal; none | same; global-non-editing-only | CK:1665 | U |
| `ui/toggle-help` M:434 | `shift+/` | normal; none | same; global-non-editing-only | CK:1671 | U |
| `ui/toggle-theme` M:437 | `t t` | normal; none | same; global-non-editing-only | CK:1687 | U |
| `ui/toggle-contents` M:440 | `alt+shift+c` | global; none | same; global-non-editing-only | CK:1455 | G / U |
| `page/toggle-favorite` M:443 | `mod+shift+f` | editor; none | same; editor-global | CK:1449 | U |
| `editor/quick-add` M:446 | `mod+e; mod+alt+e` | global; P | same; global-prevent-default | CK:1423 | U |
| `editor/jump` M:449 | `mod+j` | editor; none | same; editor-global | EK:1304, CK:1429 | U |
| `editor/copy-page-url` M:452 | `—` | normal; E | same; global-non-editing-only | EK:1302, CK:1429 | U |
| `window/close` M:456 | `mod+w` | global; E | same; global-prevent-default | CK:1429, NH:343 | U |
| `ui/toggle-wide-mode` M:460 | `t w` | normal; none | same; global-non-editing-only | CK:1678 | U |
| `ui/select-theme-color` M:463 | `t i` | normal; none | same; no catalog row | CK:1456 | G / U |
| `ui/goto-plugins` M:466 | `t p` | normal; L | same; no catalog row | CK:1674 | G / U |
| `ui/install-plugins-from-file` M:470 | `—` | normal; C | absent; no catalog row | none in dispatch owners | G / U |
| `ui/install-plugin-from-github` M:474 | `—` | normal; LE | absent; no catalog row | none in dispatch owners | G / U |
| `ui/clear-all-notifications` M:478 | `—` | normal; none | same; global-non-editing-only | CK:1635 | U |
| `editor/toggle-open-blocks` M:481 | `t o` | normal; none | same; global-non-editing-only | CK:1414 | U |
| `ui/customize-appearance` M:484 | `c c` | normal; none | same; global-non-editing-only | CK:1456 | U |
| `dev/gc-graph` M:487 | `—` | normal; D | same; no catalog row | CK:1652 | U |
| `dev/replace-graph-with-db-file` M:492 | `—` | normal; DE | absent; no catalog row | none in dispatch owners | G / U |
| `dev/show-block-data` M:497 | `—` | normal; D | same; no catalog row | CK:1645, AC:2268 | U |
| `dev/show-block-ast` M:502 | `—` | normal; D | same; no catalog row | CK:1645, AC:2269 | U |
| `dev/show-page-data` M:507 | `—` | normal; D | same; no catalog row | CK:1648 | U |
| `misc/export-block-data` M:512 | `—` | normal; none | same; global-non-editing-only | CK:1636 | U |
| `misc/export-page-data` M:515 | `—` | normal; none | same; global-non-editing-only | CK:1639 | U |
| `misc/export-graph-ontology-data` M:518 | `—` | normal; none | same; global-non-editing-only | CK:1642 | U |
| `misc/import-edn-data` M:521 | `—` | normal; none | same; global-non-editing-only | CK:1644 | U |
| `dev/validate-db` M:524 | `—` | normal; D | same; no catalog row | CK:1656 | U |
| `dev/recompute-checksum` M:528 | `—` | normal; D | same; no catalog row | CK:1650 | U |
| `dev/export-client-ops-sqlite` M:532 | `—` | normal; D | same; no catalog row | CK:1650 | U |
| `dev/rtc-stop` M:536 | `—` | normal; D | same; no catalog row | CK:1662 | U |
| `dev/rtc-start` M:540 | `—` | normal; D | same; no catalog row | CK:1659 | U |

## Native execution queue derived from the matrix

Run only in private release profiles with actual artifact/worker receipts, one
fixture owner per process, a fresh graph and bounded cleanup. Do not inject a
command event and label that physical key coverage. Record OS/key layout,
focused canonical/native owner, composing/readonly state, matched key sequence,
handler outcome, persisted state and exact undo result where appropriate.

1. Close the source gaps first: configured PDF and card-modal delivery, YouTube
   timestamp, desktop find/save/shell capability, and number-list batch semantics.
   Graph View stays excluded; plugin runtime limitations stay explicit.
2. Editing: all 26 master editing memberships (including unbound commands after
   intentional temporary key configuration), formatting, caret/word boundary,
   clipboard, links, timestamp and dirty-source preservation. Test shared
   bindings against property inputs, CodeMirror and ordinary controls.
3. Nonediting/select mode: document-order selection movement/extension,
   indent/outdent/move/delete, collapsed children, parent selection, copy/cut,
   task cycling, property/reaction/comment targets and one-step Undo/Redo.
4. Global/normal contexts: each sequence in the table, including prefix overlap
   Mod-C→Mod-C/Mod-S/Mod-R, T/G/P/C prefixes, settings Mod-comma versus editing
   zoom-out, publishing gates, palette open/close and shortcut recording.
5. Modal owners: autocomplete Enter variants/arrows/control variants and Tab
   staying with indent; cards phase/ratings; PDF configured keys; calendar,
   picker, search and confirmation local Escape/Enter/Tab behavior. These local
   input keys are additional to the 145 built-in catalog IDs.
6. Repeat on Windows/Linux and alternate layouts/composition. Preserve default
   OS text/control handling for reserved strokes and unmodified printable
   input. A source inventory or one macOS native pass cannot substitute for it.

No user keymap is changed by this report. No application was launched or closed.

## Prepared correction after the inventory snapshot

The next source candidate corrects `editor/add-comment` to existing
`editor-global`, admitting editing and selection while refusing unrelated
controls through the existing `chord_may_run` guard. It corrects
`ui/toggle-contents` to master's `global-prevent-default`. It does not add a new
scope, dispatcher, key registry or input replay. Default/configured key strings
are unchanged. The exhaustive matrix above remains the original ea2bfbae0f
snapshot so its source findings are auditable.

The marked portable fixture in `test/shared_ui_regression_test.ml` now sends
`Ui_services.ev` values through the actual `Editor_keys.on_global_key` entry.
It builds the actual target's CmdK services and substitutes only the existing
Comments/Contents capability callbacks to observe dispatch/targets. It checks
editing and normal selection, dirty editor source/epoch, independent text
controls, composing input, open-palette ownership, empty targets and exact
callback counts. Runtime/editor/settings/chord state and command history are
restored. Native admission compiles this same marked test against the actual
native archives. No installed services are replaced. This source preparation is
not a native OS or persistence pass; root executes the maintained Web and
native-archive gates before any success claim.

## Prepared missing-publication correction

The subsequent source candidate adds the existing T I / T P global catalog
rows and reuses the five explicit Cards_state IDs for native subscription only
while that state belongs to the current application scheduler and is open.
It uses the existing global-non-editing-only wire scope; Rust production
keyboard parsing and installation are unchanged. No visible card shortcut
category, new snapshot payload field, modal dispatcher or SDK change is added.
The private OCaml last-publication cache observes open/close, so those state
changes no longer depend on a keymap revision to retire subscriptions.

Authored tests cover actual provider open/close/rebind/admission/input/IME/
palette/capture behavior, actual native-archive publication and card phase
entry, disabled/default/configured keys, stale scheduler refusal and actual
shared T I / T P dispatch. They restore their model, scheduler-owned states,
listeners, keymap storage/cache and process-local publication state. They remain
unexecuted here. They do not qualify actual card grading data, physical input,
or every configurable global/modal prefix collision; document listener ordering
is unchanged. The original 145-row snapshot above remains historical.

## Actual comment handoff corrects the earlier evidence assumption

Frozen master `handler/comments.cljs:132–161` saves and clears an editing block
before opening its comment thread; a blank edit becomes a Comments area in
place. It then reveals/focuses the reply and clears selection/action-bar state.
The earlier portable key test substitutes the downstream comment capability,
so its retained source/epoch assertion proves only that routing captures the
correct dirty target before the capability handoff. It does not establish the
product's subsequent focus or edit lifecycle. The actual AppKit comment case
must require saved block source followed by the authentic reply editor, rather
than retaining the original block editor. Contents retains its different
existing editor-preservation requirement.

The first actual AppKit comment run at App ea84879595 failed with `native click
target is missing or retired` after creating a visible comment draft. This
remains an authentic failure. Shared `Comments_view.add_box` already consumes
the pending reply request on placeholder appearance; `Comments_ops.reveal`
also queued a click without claiming that request. The candidate claims it
before queuing the click, preventing the appearance callback from independently
retiring that target. The native producer regression verifies that exact owner
survives an appearance event while activation is deferred. No actual native
rerun was performed during preparation; the failed run is not relabeled passed.

## Prepared master-faithful comment handoff

The shared Comments helper now drains/saves/clears through the existing
`Editor_actions.after_pending_input`, then uses the production thread endpoint
(or tags the captured blank edit in place). It clears only its matching
captured selection/action bar and waits for an actual owned refresh result
before arming reply focus. Graph/worker/route changes, replacement editing and
new selection refuse late focus. Both Comments adapters and the low-level
context command share it; no new dispatcher, registry, worker API or SDK seam
is introduced. The native-archive regression uses actual CmdK services with a
deferred worker/publication boundary rather than substituting the comment
capability. Actual AppKit evidence remains required for focus/persistence.

The frozen ea84879595 native cohort separately established that editing
Alt-Shift-C and normal T I/T P with native Escape work (6.6s and 7.9s). The
editing comment case failed the stale native click boundary. The normal
comment case reached persisted exact A,B targets, cleared selection and an
authentic comment editor, then failed its incorrect old zero-editor assertion.
That failure is not a complete pass: the corrected native scenario must prove
that the new editor belongs to the real comment area and uses native typing,
while keeping backend errors fatal. The earlier fixture expectation is
corrected to match master rather than deleting the failure condition.

## Card answer-key availability correction

Master `extensions/srs/handler.cljs` implements S by clicking only the rendered
card-answers control. The current handler previously called advance_phase even
when rating controls had replaced that button, allowing a second S to hide the
answer. The candidate shares `answer_button_available` between the actual
Cards_view condition and keyboard handler, also requiring a current card.
Default/configured keys keep the full cloze sequence and stop at show-answer;
explicit button/advance APIs and all native publication remain unchanged.
Actual native-archive regressions check these phases and a subsequent real
rating-operation batch. Private AppKit cases must independently demonstrate
second-S stability and persisted ratings before that boundary is qualified.

## Actual execution at App 7f432847c6

This later execution cohort uses App
`7f432847c6de019f3aeed7541f1e853fa5d58ead`, LUI
`93712b51ab40d7c5882fed1501568a55ab6722ba` and unchanged NSH
`adc186db7213f3ccd1eacaa836cc721e9779fd14`. The original 145-row source
snapshot above remains historical; matching default strings do not establish
working command capabilities or exhaustive native execution.

- The complete shared runner passed **19,643 checks, 0 failures** in
  `/tmp/logseq-final-shortcut-shared-tests.log`. The actual native OCaml archive
  admission passed in `/tmp/logseq-final-shortcut-native-admission.log`.
- `PATH=/Users/tienson/.cargo/bin:$PATH bash deps/ui/nsh/build.sh --release`
  passed the real startup gate in 17.76 seconds and published its checked
  receipt. All 13 task-owned workers reached durable `closed`, had no error,
  were absent, and received exactly one shutdown dispatch. Build logs are
  `/tmp/logseq-shortcut-final-release-build.stdout` and
  `/tmp/logseq-shortcut-final-release-build.log`.
- Corrected editing Ctrl-Space **failed** again in the actual AppKit driver,
  after saving `draft` and displaying the Comments reply. The fatal error is
  still `native click target is missing or retired`; the prior request-claim
  fix alone therefore does not qualify this path. Evidence:
  `/tmp/logseq-shortcut-final-native-comments.log`, private graph
  `logseq-native-block.dbFkRb`. The capture/publication ordering boundary
  remains under investigation. No error was ignored or converted to a pass.
- Four independent private-graph AppKit card cases **passed**. Each starts
  with one production-created Card tag and answer child, with no fabricated
  FSRS state or due date; actual G F opens the modal, an early rating digit
  cannot grade, S shows the answer, and a second S preserves the same answer
  and rating controls. The actual rating digit persists exactly one review;
  a repeated digit does not write again. Escape and reopening show no due
  cards while preserving the actual review. Exact readbacks are:

  | Key | Rating | State / repetitions / lapses | Persisted due offset | Private graph / duration |
  | --- | --- | --- | --- | --- |
  | 1 | again | learning / 1 / 1 | 60,000 ms | `logseq-native-block.f1mamY` / 10.7 s |
  | 2 | hard | learning / 1 / 0 | 300,000 ms | `logseq-native-block.jJz0eF` / 10.7 s |
  | 3 | good | learning / 1 / 0 | 600,000 ms | `logseq-native-block.kCYIAG` / 10.3 s |
  | 4 | easy | review / 1 / 0 | 6 days | `logseq-native-block.JkSHcB` / 10.5 s |

  Logs are `/tmp/logseq-shortcut-final-native-cards-1-authored-id.log` and
  `/tmp/logseq-shortcut-final-native-cards-{2,3,4}.log`. The first two rating-1
  attempts failed fixture assumptions: a bare UUID was not a valid worker
  `pull` entity reference, and an explicitly authored native test ID supersedes
  the generic `lui-ID`. The fixture now queries the actual answer entity ID and
  selects `card-again`/`card-hard`/`card-good`/`card-easy`. It retains all
  original state, enabled-control, persistence and phase assertions.

The card-answer and reopened PNGs from the first passing graph were inspected.
These fixtures load the actual Release application library and worker under
the macOS NSH native test host, with immutable source/artifact guards and
task-owned cleanup. They do not qualify a signed installed package, physical
keyboard layouts, hardware IME, Windows/Linux input, every configured key, or
all modal/global prefix collisions. The installed user application was not
restarted or replaced. `spec-dev-tool --help` could not run because the tool
is not installed on this host.

## Number-list whole-selection source correction

The earlier batch/history finding is addressed by the candidate shared owner
`Editor_cmds.toggle_numbered_lists`. Both actual Cmdk_host implementations now
call it once, and the context-menu dispatcher captures the ordered selection
when its clicked UUID belongs to that selection. Fresh responses are mapped by
UUID and projected in captured order; any exact `number` clears the entire
batch, otherwise one property batch sets every target to number. Palette
closing cannot change the captured targets, and an editing fallback remains
available. The existing caret-owning slash command stays separate.

The portable production-entry fixture is compiled by both the maintained Web
suite and actual native-archive admission runner. New cases cover mixed state,
repeated fresh reads, reversed worker response order, selection replacement,
selected/outside context targets, a dirty editor and graph retirement. They
assert one batch operation and existing before/after history metadata. No
physical keyboard/pointer Undo/Redo or native UI pass is implied by this source
change; those acceptance gates remain outstanding until execution evidence.
