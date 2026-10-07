# UI parity audit — page body, properties, references

Slice: PROPERTIES + PAGE BODY + REFERENCES
Compared: `master` (cljs, :3001) vs `devin/component-migration` @ `a3dc4ff1f8` (deps/ui, lui `315cc9f`, :3003 `?rtc-test=true`).
Method: identical fixture on both — `ParityTest` page (icon 🚀, 6 properties, tagged/card/ref/mention blocks, `{{query}}` block, block-level property) + `RefSource` page linking to it + journal ref. Screenshots under `parity-shots/page/` (`m-*` master, `l-*` LUI).

## Result table

| # | Checklist item | Master (:3001) | LUI (:3003) | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 | Page title display | Bold title with 🚀, x≈139 | Title + 🚀 renders, x≈54; ~96px narrower gutter | ⚠️ layout delta | m-page / l-page |
| 2 | Title rename flow | Click → textarea prefilled with name | Click → textarea *appears* empty but holds the name; typing appends → "ParityTestParityTest" | ❌ BUG: prefill invisible, duplicates on edit | l-title-edit |
| 3 | Page properties block | Rows: type icon + name + value, "+ Add property" | Rows render: name + value, no type icons; "Add property" icon glyph broken (⊘); value column farther right | ⚠️ renders, styling/icon gaps | m-page / l-page |
| 4 | Property picker | "Add or change property" popover: search + property list | Same dialog title opens but **crashes**: `MelangeError: Invalid_argument` at `apply_pending_batch`/`flush` — body stays empty. Both "Set property" and "Add property" hit it | ❌ BLOCKER: cannot add any property via UI | m-prop-picker / l-prop-dialog, l-prop-dialog-empty |
| 5 | Value editor — text | Select/input editor | Inline input opens but is **empty** (existing value not preloaded); commits on Enter | ❌ BUG: editor doesn't preload value (data-loss risk) | m-prop-picker / l-prop-val-editor |
| 6 | Value editor — number | Editor w/ numeric value | Unreachable via UI (picker crash) | ❌ untestable via UI | m-number-editor |
| 7 | Value editor — date | Date picker, value renders as page-ref link | Unreachable via UI; seeded value renders as plain text | ❌ untestable via UI | m-date-editor |
| 8 | Value editor — checkbox | Checkbox row editor | Unreachable via UI; seeded `true` renders as literal text, no checkbox | ❌ untestable via UI + render gap | m-check-editor / l-page |
| 9 | Value editor — URL | Link-styled value editor | Unreachable via UI; seeded URL renders as link | ⚠️ render ok, editor untestable | m-url-editor / l-page |
| 10 | Value editor — node/select | Node picker ("+ New option") | Unreachable via UI | ❌ untestable via UI | m-node-editor |
| 11 | Property row layout | Icon + name (x≈139) + value (x≈310) | Name (x≈68) + value (x≈505), no icons | ⚠️ layout delta | m-page / l-page |
| 12 | Property visibility toggles | Property-name click → "Configure property" panel: Hide by default / Hide empty value / Multiple values / Delete | Property-name click does nothing — no config panel | ❌ missing feature | m-prop-config / — |
| 13 | Block-level properties | Row nested under block | Row nested under block renders correctly | ✅ | m-block-prop / l-page |
| 14 | Tag/class badges on pages | `#ParityTag`, `#card`, `#Journal`, `#Query` blue badges | Badges render; `#card` normalized to `#Card` (case change) | ⚠️ case normalization differs | m-page / l-page |
| 15 | Namespace hierarchy | `/` in page name rejected (toast "Page name can't include '/'") | `/` rejected too — but via thrown `MelangeError: Outliner_validate.Notification` (uncaught), not a toast | ⚠️ parity behavior, worse error surfacing | — |
| 16 | Linked References section | "Linked references N" + groups by source page | Same section + a visible toolbar (+, ⚡, sort, funnel, search, columns, ···) | ⚠️ renders; extra toolbar present but dead (see #17) | m-page / l-page |
| 17 | Linked refs filters | "Page filter" funnel → working include/exclude filter popover | Same buttons present; **none do anything** (funnel/+/search/⚡/sort/columns/··· all dead) | ❌ toolbar is decorative | m-refs-filter / l-refs-toolbar |
| 18 | Group collapse | Group header click → navigate to source page / rename affordance (no collapse control) | Same: header click navigates to source page | ✅ | — / l-group-nav |
| 19 | Unlinked references | "▸ Unlinked references +" collapsed section; clicking doesn't expand in this build | Identical collapsed section; clicking doesn't expand either | ✅ (both unresponsive) | m-unlinked / l-unlinked |
| 20 | Hierarchy section | Absent (no namespaced pages creatable) | Absent | ✅ N/A | — |
| 21 | Page history/version items | Not present in page menu | Not present in page menu | ✅ | m-menu / l-menu |
| 22 | Aliases display | `Alias` property row w/ icon | `Alias` row renders | ⚠️ renders; row-icon missing | m-page / l-page |
| 23 | Asset/file embeds | Not exercised (no upload path tested) | Not exercised | ➖ untested | — |
| 24 | Page-level icons | "Add icon" → emoji picker (Emojis/Icons tabs, search); pick applies immediately | Same picker + search opens; pick writes the icon (db row present) but **page doesn't update until reload** | ❌ BUG: selection applies only after reload | m-icon-picker / l-icon-picker |
| 25 | Query blocks on pages | "/query" → Query block w/ `#Query` badge + Filter; `{{query}}` → deprecation text | `/` opens **no slash menu**; query block unreachable via UI; `{{query}}` shows same deprecation | ❌ slash commands missing; legacy render parity | m-slash-query, m-query-block / l-slash |
| 26 | Flashcards markers | `#card` badge on block; "Flashcards" in sidebar | `#Card` badge (case delta); "Flashcards" in sidebar | ⚠️ renders, case delta | m-page / l-page |
| 27 | Contents / ToC panel | Right sidebar: Contents / Page graph / Help tabs; Contents panel opens | Right sidebar: Contents / Help only — **Page graph tab missing**; Contents panel opens | ⚠️ panel parity, missing Page graph tab | m-sidebar / l-sidebar |
| 28 | Page "···" menu | Add to Favorites / Delete page / Export page / Publish page / Convert to Tag | Identical item set | ✅ | m-menu / l-menu |
| 29 | Global layout / gutter | Content column starts x≈139 | Starts x≈54; ~96px left indent missing | ⚠️ persistent layout delta | m-page / l-page |

## Notable LUI defects (ranked)

1. **Blocker** — "Add or change property" dialog crashes on open: `MelangeError: Invalid_argument` in `apply_pending_batch`/`flush` (reactive runtime). No property can be added, renamed, or typed via the UI.
2. **High** — Inline editors (title, property value) do not preload the current value: they *look* empty but hold the value; typing appends (title became `ParityTestParityTest`) or overwrites.
3. **High** — Slash-command menu absent; Query/command blocks cannot be created via UI.
4. **Medium** — Linked-references toolbar (+, filter ⚡, sort, funnel, search, columns, ···) renders but every button is a no-op; master has a working Page-filter popover.
5. **Medium** — Icon picker selection writes to the db but the page doesn't reflect it until reload (reactivity gap).
6. **Medium** — No "Configure property" panel (property-name click does nothing) → no visibility toggles, type change, or delete.
7. **Low** — Property rows lack per-type icons; checkbox values render as `true` text; `Add property` icon glyph broken (⊘); content gutter ~96px narrower; `#card`→`#Card` case normalization; right sidebar lacks Page graph tab.

## Master-side observations

- Node-type property value commit and "New option" node submit produce toast "Invalid data writing to db!" (master-side rejection — likely a pre-existing master issue, not LUI).
- `/` page names rejected with a proper toast.
- `{{query}}` macro prints deprecation text; identical on LUI.
- Unlinked-references section doesn't expand on click in this build — same on LUI, so treated as parity.

## Fixture notes

- LUI properties were seeded via `logseq.api.upsert_block_property` (picker is broken). They land under `:plugin.property._test_plugin/*` (test-plugin namespace, `rtc-test` graph) as text-typed values — this is why some rows render as plain text on LUI.
- Rapid consecutive `upsert_block_property` calls race on the LUI worker — some writes silently dropped until spaced ~2.5s apart.
- Master also auto-created `ParityTest` via `[[ref]]` typing; LUI same path worked.
