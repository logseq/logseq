# Views + All Pages UI parity audit

Screenshot comparison between the cljs master web app and the LUI rewrite
(`deps/ui`, `Views_view` / `views_table.ml` / `views_head.ml`).

- **Master**: `master` branch, shadow-cljs dev build, `http://localhost:3001/?rtc-test=true`
- **LUI**: `devin/component-migration` @ `a3dc4ff1f8` ("fix(ui): give page-title
  inner wrapper ~grow so it fills the row"), lui opam pin `315cc9f`,
  `http://localhost:3002/?rtc-test=true`
- **Seeded graph** (identical data on both): `Book` tag with properties
  Author (text), Rating (number), Published (date), Finished (checkbox),
  Genre (text), Website (url), Reading (text); 6 `#Book` objects under
  `Seed notes`; 6 plain pages; 4 journal pages; 13 All-Pages rows total.
- Screenshots live in `docs/parity-shots/views/`, named
  `NN-item.{master,lui}.png`.

**Debug note**: LUI table surfaces cannot mount on a clean build (B1 below);
LUI screenshots were taken with the per-spec warn-only
`node_properties_supported` downgrade applied to the served `main.js`.
All bugs below reproduce on the clean base build — the patch only demotes
the rejection to a console warning.

## Critical findings (LUI bugs, ordered by severity)

| # | Severity | Bug | Evidence |
|---|----------|-----|----------|
| B1 | **high** | `icon-only button requires an accessibility label` hard-rejects unlabeled `ghost_btn`s (`views_head.ml` `ghost_btn "search"` ~L588, `ghost_btn "x"` ~L612) via `lui_web_store.ml` `node_properties_supported`. One rejected batch wedges the surface permanently: `apply_pending_batch` bumps `runtime_generation` on exception while `retained_generation` stays back, so every later flush fails `expected patch generation N, received N+1`. **All Pages / tag views render 100% blank on a clean build.** | reproduction on clean a3dc4ff1f8+lui@315cc9f; instrumented store trace |
| B2 | **high** | Table row cells paint invisible. `.lui-row.sticky-columns` stretches to **full row width (1392px)** with opaque `bg-gray-01` + `z-index:8` + `position:sticky`, covering the sibling `lui-row` that holds the cell contents. DOM, text and styles are all correct (element-level screenshots paint text); only the sticky band's width is wrong. Affects every table view (All Pages, tag object tables) — screenshots show headers + empty rows. | `01`, `20`, `44`, `17` shots |
| B3 | **high** | "Gallery View" never engages. `view-action-type` menu lists Table/List/Gallery and List switch works, but clicking Gallery View leaves the previous body rendered (probe: `.ls-card-item` count stays 0, DOM keeps old body). `render_gallery`/`gallery_card_el` exist in `views_table.ml` but display_type never reaches it. | `50` shots, DOM probe |
| B4 | **high** | Tag refs inside row titles render as raw `[[uuid]]` links: `Clean Code #[[5548b760-1b3f-4c09-bd86-...]]` instead of `Clean Code #Book`. Same in list view. | `22`, `29`, `63` lui shots |
| B5 | **high** | No inline cell editors. Clicking a property cell on master opens an inline editor (white input over the value); on LUI clicking a text/url value navigates to a page titled after the value (`Robert C. Martin` → `#/page/Robert C. Martin`) — plain-text values are treated as page refs. Number/date/url/checkbox editors likewise absent. | `22`–`24` pairs |
| B6 | **medium** | View gets stuck in `Loading...` after data mutations (e.g. after "+ New" creates an object, after some filter interactions); the view never repopulates until re-navigation. | `53`, `55` lui shots |
| B7 | **medium** | Selection action bar incomplete + mispositioned. LUI renders only "Selected: N" + trash icon (`views_table.ml` `action_bar`), missing master's **Copy / Set property / Unset property** actions. It sits `absolute top-0` over the table header, so "Selected: 13" collides with the "Page name" header text. | `16`, `17`, `44` lui shots |
| B8 | **medium** | "+ New" row creates the object as a property-form block rendered in the main area + opens the entity in the right Contents sidebar (view then stuck Loading, per B6). Master appends an editable row inside the table. | `55` lui, `62` master |
| B9 | **medium** | User-created views (via `+`) lack the trailing `+ New property` column and keep the parent's column set; master's new view gets its own column set (Website/Reading/Created At/Updated At/Page + `+ New property`). | `27` lui vs `21`/`43` master |
| B10 | **low** | Cell/row click opens a right-side "Contents" entity panel on LUI; master row hover shows inline row-action icons (open-in-side-window + copy) and no panel unless clicked. | `22`–`26` lui, `21` master |
| B11 | **low** | Tag page chrome differs: LUI shows `#Tag` badge next to the title and puts toolbar icons inline-left; master renders `# Book` alone with right-aligned toolbar cluster. LUI journal renders a `#Journal` tag label; master does not. | `20` pair, journal shots |
| B12 | **low** | Search box shows two `x` clear affordances (blue icon + dark icon). | `31` lui |
| B13 | **low** | Empty-result copy differs: LUI shows `No matched result`; master shows nothing. | `31` pair |
| B14 | **low** | Master retains the typed search filter across interactions (badge stays "All 1" after the input closes); filter survives view switches. LUI's filter chip row renders differently. | `13`–`16` master |
| B15 | **low** | `logseq.api` gaps on LUI (no `upsert_nodes`, `import_edn`, `add_property_value_choices`, `add_block_tag`, `add_tag_property`, `get_tag_objects` semantics differ) — affects plugin/script parity, not end-user UI directly. | api surface probe |

## Checklist coverage

| Checklist item | Master (:3001) | LUI (:3002) | Shots |
|---|---|---|---|
| All Pages list — columns | Page name / Backlinks / Tags / Created At / Updated At | Identical columns + headers render; row contents invisible (B2) | `01` |
| Sorting per column | Header cell click → Sort ascending/descending menu; sort arrow on header | Header cell click → richer menu (Sort asc/desc + **Pin** + property config: Property name/type/Default value/Available choices/Multiple values/UI position/Hide by default/Hide empty value/Go to this property/Delete property from tag) — same items as master's full menu | `10`, `11`, `63` |
| Item actions (row hover) | Row hover shows action icons at row right edge | Hover state invisible (rows blank, B2) | `09`, `21` |
| Checkbox multi-select | Row checkboxes toggle selection | Row checkboxes exist and toggle (DOM verified); invisible due to B2 | `16` |
| Action bar on selection | `Selected: N` + Copy + Set property + Unset property + Delete | `Selected: N` + Delete only; overlaps header text (B7) | `16`, `17`, `44`, `54` |
| Pagination / scroll | Scroll container, no pager (13 rows) | Same (`lui-scroll`) | `01` |
| Tag/class object table | `# Book` + object table Name/Tags/Author/Rating + `+ New` row + Linked references | Same skeleton: `# Book #Tag`, table headers, `+ New` row, `1 Linked references` + action icons; rows blank (B2), `#Tag` badge extra (B11) | `20` |
| Column config — add/remove | `...` → Columns visibility ▸ checkbox list (All Pages); header menu property items | Identical: Columns visibility ▸ same checkbox items (verified DOM + shot); property items in header menu | `40`, `52`, `63` |
| Column config — reorder/resize | No drag affordance found on headers in these views | None found | — |
| Filtering UI | Filter menu lists columns (Page name/Tags/Created At/Updated At); tag page lists all properties incl. Finished/Genre/Website | Same menu contents incl. all tag properties; filter clause UI reachable | `12b`, `44`, `l-tagi0` dump |
| Grouping | Tag page `...` → Group by ▸ (Page, Tags) + Sort groups by/order; All Pages → Group by ▸ Tags | `...` → Group by ▸ Page + all tag properties + Tags + Page (superset; "Page" duplicated at top and bottom); Sort groups by present; **Sort groups order absent** | `41`, `52`, `61b` |
| View switcher | Set View Type ▸ Table/List/Gallery; switcher icon in toolbar | Same 3-item menu; Table & List switch OK; **Gallery dead** (B3) | `14`, `28`, `29`, `50` |
| Board/kanban columns + card drag | **Not a view type** — master's Set View Type has only Table/List/Gallery | N/A (no board impl) | — |
| Gallery cards | Cards grid renders (title-only cards, large empty card area w/o cover assets) | Switch never engages (B3) | `28`, `50` master |
| Row density | No density control found in any view menu | Same | — |
| Checkbox props in cells | `Finished` checkbox renders as list-view pill ☑/☐ and in Contents/entity card | Entity card shows `Finished ☐`; table cell not testable (B2/B5) | `29` master, `53` lui |
| Cell editors — text | Inline editor on click | Click navigates to value-named page (B5) | `22` |
| Cell editors — number | Inline | Absent (B5) | `23` |
| Cell editors — date | Inline/date picker | Absent (B5) | `24` |
| Cell editors — checkbox/select/url | Inline (url shown as link), select-type untestable (LUI api can't seed closed-values choices identically) | Absent (B5); select-type untestable | `21`, `62` |
| New-view creation | `+` → new view tab with own column set + `+ New property` col | `+` → new view tab, inherits parent columns, no `+ New property` col (B9) | `27` |
| View rename/delete | Click current view tab → Rename (submenu w/ inline block editor) + Delete | Same gesture → Rename + Delete (Rename is a direct menu item, no submenu) | `60` |
| Empty states | No empty-state copy on zero-result search | `No matched result` text | `31` |
| Set-property flows | Action bar → Set property + Unset property | Absent from action bar (B7); reachable only via header property menu | `16`, `44`, `54` |
| Export EDN | In `...` menu | In `...` menu (both All Pages + tag page) | `15`, `61` |
| Search-in-view | Magnifier → inline input, filters rows; filter retained after close (B14) | Magnifier → `Type to search` input works, debounced; two `x` icons (B12) | `12`, `13`, `31` |

## Not covered / untestable

- **Board/kanban**: not among master's view types for object tables → out of scope.
- **Row density**: no control found in either app.
- **Column resize/reorder drag**: no affordance found in either app's view tables.
- **Select-type (closed-values) cell editors**: LUI's plugin api lacks
  `add_property_value_choices`/`upsert_nodes`/`import_edn`, so an identical
  select property could not be seeded on both graphs.
- **Pagination**: neither app paginates at this row count.

## Working patches used for LUI screenshots

`static/js/main.js` (generated bundle): `node_properties_supported` rejection
replaced with `console.error` warn-only — required, otherwise every view
surface mounts blank (B1). No other app behavior patched. Master used
unmodified dev build (local `shadow-cljs.edn` dev-http port change only).
