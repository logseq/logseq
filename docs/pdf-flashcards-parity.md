# UI parity audit — pdf annotations + flashcards

Logseq master (cljs, `devin/component-migration` — source read as reference) vs LUI rewrite (`deps/ui` @ `devin/component-migration` `c9bdad601b`, lui `1fa2d79a`, `:3010/?rtc-test=true`).
Screenshots: `docs/parity-shots/pdf-flashcards/*.png`. Seeded: one pdf asset page (manpage pdf), one `CardsTest` page with a `#Card`-tagged block.
Statuses: `ok` verified identical · `fixed` gap found and fixed this slice · `divergent` behavior differs · `untested` not exercised.

## PDF annotations

Reference: `src/main/frontend/extensions/pdf/*.cljs`, `frontend/extensions/pdf/toolbar.cljs`, `frontend/components/block.cljs` annotation bits, `editor/assets.cljs` (`db-based-save-assets!`).

| Surface | master (cljs) | LUI | Status | Shots |
|---|---|---|---|---|
| Asset block label click → open viewer | opens `.extensions__pdf-viewer` overlay w/ pdf.js render + toolbar (1/2 pager, Close) | same | ok | `lui-01`, `lui-02` |
| Text selection → ctx menu | fresh selection (no persisted hl `id`): color dots (yellow/red/green/blue/purple) + **Copy text** only — `(and id ...)` gates ref items in `core.cljs` | identical gating + items | ok | `lui-03` |
| Pick color → persist + render | hl json → `assets/<graph>/<id>.edn` `hls` blob + `.hls-text-region` rects | same write path + render | ok | `lui-04` |
| Highlight click → ctx menu | colors + **Copy ref** + **Copy text** + **Linked references** + **Delete** | identical item set | ok | `lui-05` |
| Copy ref | clipboard gets `((hl-block-uuid))` block ref | identical | ok | — |
| Copy text | clipboard gets selected text | identical | ok | — |
| Delete | removes region + ref block + hl data | identical | ok | — |
| Area highlight (shift-drag → color) | drag rect → `.hls-area-region` color box + cropped PNG saved as asset + `.hl-area` ref block | same; **was broken 3 ways** (region never appended to DOM; `thread-api/entity` Tagged result un-unwrapped → asset dbid lost; `.asset-block-wrap` collapsed to 26px in flex row) | fixed | `lui-06`, `lui-07` |
| Area PNG insertion target | `db-based-save-assets! {:pdf-area? true}` falls through to the **Asset class page** (`:logseq.class/Asset` pull), not today's journal | was inserting into today's journal → now pulls Asset class page identically | fixed | `lui-07` (ref on page) |
| `.hl-page` refs in blocks | `📌 P<n>` prefix link + hl text rendered inline under the asset block | identical rendering | ok | `lui-08` |
| `.hl-area` refs in blocks | `📌 P<n>` + `<img>` chip of the cropped region + asset action bar | identical; img verified rendering (250×130 blob PNG) | ok | `lui-07`, `lui-08` |
| Prefix-link click → back to pdf + flash | `goto-block-ref!` = ensure ref block + navigate to pdf page + `hl-flash` animation | identical (`goto_block_ref` → `#/page/<uuid>` + `hl-flash`) | ok | `lui-09` |
| Clicking annotation refs / asset labels | never enters block edit mode (cljs guards on non-editor targets) | **was entering edit mode** — pdf label + prefix clicks are `[data-pressable]` targets the editor guard didn't cover → added `[data-pressable]` to the `closest()` interactive-target selector in `editor_keys.ml` | fixed | — |
| Reopen pdf → hls restore | regions re-rendered from persisted `hls` edn | **was empty** — `thread-api/q` returns `Wire.Set` rows, `load_hls_data` only matched Array/List → now reads `W.elems` | fixed | — |
| Annotations toolbar button | `svg_annotations` → `pdf-assets/goto-annotations-page!` → pdf block's own page listing annotation refs | same button + navigation; refs render on the pdf block page | ok | `lui-08` |
| Linked references menu item | opens right-sidebar linked refs for the hl block | item renders; click path not exercised | untested | `lui-05` |

## Flashcards

Reference: `src/main/frontend/extensions/fsrs.cljs` (rating set `[:again :hard :good :easy]`, shortcuts `"s"` + `"1"–"4"`, phases `:init` → `:show-cloze`/`:show-answer` → `:init`; `repeat-card!` persists `:logseq.property.fsrs/state` + `:logseq/last-rating` + `:logseq.property.fsrs/due`).

| Surface | master (cljs) | LUI | Status | Shots |
|---|---|---|---|---|
| Flashcards nav entry | left-sidebar "Flashcards" item + due-count badge → opens review modal | same (sidebar collapsed by default; `t` `l` reveals it) | ok | `lui-10` (badge `1`) |
| `#card` tag → Practice | page with tagged blocks shows Practice affordance + cards due | Practice button + card picker | ok | `lui-10` |
| Review modal | `#cards-modal`: card-source select ("All cards" ▾) + `+` add-card + `n/total` counter + × | identical | ok | `lui-10` |
| Question shown, answer hidden | card body renders question; nested/answer content hidden until reveal | same hiding convention | ok | `lui-10` |
| Show answers (`s` / click) | reveals answer + swaps to rating buttons | identical | ok | `lui-11` |
| Rating buttons | **Again / Hard / Good / Easy** with per-rating due labels + shortcut digits | identical 4-button set + labels + `1`–`4` | ok | `lui-11` |
| Rating persists fsrs props | `:logseq.property.fsrs/state`, `:logseq/last-rating`, `:logseq.property.fsrs/due` (epoch) | verified live: `state=learning`, `last-rating=good`, `due` epoch | ok | — |
| Next card / completion | advance `n/total` → "Congrats, you've reviewed all the cards for this query, see you next time!" + Practice again | identical copy + button | ok | `lui-12` |
| Keyboard | `s` show answers, `1`–`4` rate, `Escape` close | identical | ok | — |
| Make a Flashcard ctx item | block ctx menu "Make a Flashcard" → tags block `logseq.class/Card` | same item (flag `:feature/enable-flashcards?`, default on) + `make-flashcard` cmd | ok | — |
| `+` add card in modal | inserts Card-class block into today's journal | same (`add_cards_block`) | ok | — |
| Card breadcrumb row | page-name breadcrumb sits above card text | renders on the same line and overlaps the question text (cosmetic) | divergent | `lui-11` |

## Fixes landed this slice

- `pdf_hls.ml` — region for area-hl was positioned but never appended to the DOM (`Web_dom.el_append_child box region` restored); selection→menu chain (`mousedown` → dirty `selectionchange` → document `mouseup`) verified live.
- `pdf_hls.ml` — `load_hls_data` reads `Wire.Set` rows via `W.elems` (highlights now restore on reopen).
- `pdf_assets.ml` — `thread-api/entity` Tagged result unwrapped before reading asset dbid; `save_area_png` targets the Asset class page via `thread-api/pull` of `[:block/uuid]` on `:logseq.class/Asset` (cljs `:else asset-page` parity); area ref block titled with `Platform.date_to_localedate`.
- `pdf_hls.ml` / `asset_dom.ml` — `.block-children`/`.asset-block-wrap` grow in the flex row so annotation ref blocks lay out horizontally.
- `editor_keys.ml` — `[data-pressable]` added to the click-guard `closest()` selector (annotation refs + pdf labels no longer enter edit mode).
- `resources/css/extensions-pdf.css` (new) + `resources/index.html` / `static/index.html` + `postcss.config.js` — pdf extension stylesheet wired into the web build.

## Not covered

- cljs master app was not launched this slice; master behavior is asserted from source (`pdf/*.cljs`, `fsrs.cljs`, `toolbar.cljs`, `assets.cljs`).
- Linked-references menu click-through (item renders; action unverified).
- Cloze-style cards (`{{cloze}}`) render path not exercised end-to-end (phase machine mirrors cljs `:show-cloze`; no cloze card seeded).
- Breadcrumb-overlap cosmetic divergence in the review modal.
- No lui-layer changes needed — all fixes are deps/ui + repo-root css/html/postcss.
