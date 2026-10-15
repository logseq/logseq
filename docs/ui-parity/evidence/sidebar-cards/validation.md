# Right-sidebar card folding and layout

## Runtime and comparison

Reference master `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8`; native parent
`f7f0821e15b6d2c9ad5b8533e9598d985f3b5ae6`. Actual Electron versus actual
GL/SDL native windows, 1280×900, scale 1, English/light. Both docks use 309px/560px
and the same disposable `Window 标题 final` page. Contents is the same built-in
page UUID `00000004-1690-2597-3200-000000000000`, initially without body blocks.
Graph visualization was not opened or tested. Excluded Graph View/Page graph
entries appear incidentally in reference captures; no native placeholders added.

Native has no CLJS `:app` runtime: actual SDL interactions, retained-store dumps
and native production-layout tests are its applicable runtime evidence. The
reference uses Playwright attached to its actual Electron renderer on 9224,
not a replacement browser application. Logs were checked before and after.

## Before, cause and repair

`native-collapsed-before.png/.txt` show the native card marked `collapsed` and
body marked `hidden`, but its body still occupies 128px and remains visible.
Only CSS classes changed; the style-less native renderer does not implement
those layout rules. The card also retained its expanded minimum height and
always painted the right-pointing disclosure icon.

The body now receives typed `display:none` when folded, while retaining its
mounted subtree. The card shrinks to its 32 px header and chooses the existing
native down-caret when expanded. Existing radius/shadow recipes supply the
reference surface. The page body now has typed spacing rather than ignored
inline CSS:8px leading offset, 12px horizontal/20px trailing page margins,
64px inner footer and responsive 16/32px section gaps. Absent property/tab slots
are omitted rather than consuming empty gaps. Properties controls have a compact
leading row with 12px/500 text and explicit 4px control padding. Header titles
carry the reference 14px/500 text. Adjacent cards retain 8px drop-indicator spacing.

Master DOM/computed-style evidence is in `master-expanded.json`,
`master-collapsed.json`, `master-reopened.json` and `master-help-collapsed.json`.
Focused regressions were red before each corresponding fix: folding, spacing,
control padding/weight, responsive gap and adjacent-card gap logs are preserved.

## Actual paired verification

| Path | Reference | Native | Evidence |
| --- | --- | --- | --- |
| Contents expanded | Card 540×220 at 732, 48; body 540×188 | Same card/body geometry | `master-expanded*`, `native-final-expanded.png`, `native-final-reopened.txt` |
| Click header to fold | Card 540×32; body not displayed | Same; body has no layout/hit rectangle | `master-collapsed*`, `native-final-collapsed.png` |
| Click header to reopen |220 px card returns | Same; body identity retained in production native/browser tests | `master-reopened*`, `native-final-reopened*` |
| Help item, fold/reopen, close | Folded Help 32px, next Contents startsy 88 | Same card stacking after 8px spacing fix | `master-help-collapsed*`, `native-final-help-collapsed*` |
| Ctrl+K, Long Page, Ctrl+Enter | Pins Search with queryLong Page | Same actual native route | `master-search-expanded.png`, `native-search-expanded.png` |
| Fold/reopen Search |32px folded, queryLong Page restored | Same query retained | `master-search-retention.json`, paired search captures, `native-search-reopened.txt` |
| Fresh native UI restart | Not a cross-OS persistence claim | Final UI 215980 opens correct 220px Contents card and folds/reopens | Final captures; own worker 195887/41135 retained |

Search captures precede the final 8px inter-card margin change; they establish
query retention, not final list spacing. Final Help and Contents geometry captures
include that repair. Later font-weight-only refinement was validated in the final
native Contents capture and production tests; stacking is unchanged.

The properties button is no longer stretched across the card. Its native width
is 109px versus reference 101.09px, so exact inline-label positioning is **not**
claimed. Investigation identifies a likely double-counted explicit inset in the
custom SDL layout measurement callback (`logseq_native.ml:688–693`): it adds text
placement padding while the layout engine also applies typed padding. That
cross-cutting measurement repair needs its own focused regression and validation.
Disclosure glyph opacity remains subject to the separately documented renderer
opacity defect. Help-body typography/list spacing and Search internal layout also
remain visibly different; these captures do not claim full pane parity.

## Confirmed unresolved keyboard-focus blocker

Actual native reproduction, not merely a static suspicion:

1. Collapse Contents using its header; card is 32px and body 0×0.
2. Starting from pointer-cleared focus, press Tab 25 times in this fixture.
3. SDL key trace reaches hidden properties button 577.
4. Press Enter. The still-hidden label changes fromOpen properties toHide
   properties while the card remains 32px.

`native-hidden-keyboard-trace.txt` and `native-hidden-keyboard-focus.txt` preserve
this. The paired reference header→Tab sequence reaches More, Close, Skip to main
and the left-menu control; it does not enter the hidden body
(`master-collapsed-tab.json`).

Installed LUI `platform/native/lui_input/lui_focus.ml` filters Tab candidates by
`node_enabled`/control kind without ancestor display visibility; `sync_dead`
checks node existence only. A read-only installed-library probe independently
confirmed a TextField below `display:none` is returned by `focusables`/`step` and
retains focus. The dependency needs visibility-aware eligibility/cleanup.
**No LUI source was edited** while additional-repository authorization is pending.
Unmounting bodies or app-level disabling workarounds would lose the required
retained state and do not solve the root cause. LUI revision remains
`7ae8b157281fc4837fc7e6f1507d722c1f13404c`.

## Newly discovered owner-routing defect (next repair)

During active-editor folding QA, clicking the Contents add row at 820, 138 inserted
an empty block into the *main* `Window 标题 final` page, not Contents. The pre-fix
capture is `native-add-block-wrong-owner.png`. Worker reads confirmed Contents
remained empty and the main page gained a row. `Editor_actions.append_block`
looks for explicit owners only among journals, then silently falls back to the
route page. This pre-existing path must be repaired separately before claiming
sidebar editing parity. No text was typed into the incorrectly opened editor.
A normal Backspace restored the main fixture to one empty row (its empty-block
UUID is nowee 3a 186f-a 68c-43dd-868d-df 2b 3fe 1da 9f); title/content still match the
reference fixture. No real user graph was used. Active sidebar-editor save/fold
semantics are **not verified** by this chunk.

## Validation and review

- Native production layout test: folding, retained identity, 220/32px extents,
  compact properties geometry/weight/padding, 8px adjacent-card spacing and 600px
  responsive-gap case: pass.
- Native build and forced native-host/contracts/host suites: pass.
- Shared production UI suite:2119 checks, zero failures.
- Fresh Vite bundle: pass. Serial browser regressions:6/6, including the new
  public-SDK-fixture/real-keyboard card folding test. No forced clicks.
- Focused command-menu creation/editor-focus E 2E:1/1 pass.
- Focused spec and whitespace checks: pass. No new user-facing translation text.
- Nine independent read-only review passes completed. Responsive-gap, spacing and
  prose findings fixed; keyboard-focus dependency finding remains explicitly
  unresolved. No schema/settings migration is required.

Expanded class/property tabs, property-panel contents, context menu operations,
active editor folding, drag/reorder, all keyboard/ARIA states, dark theme and
macOS rendering remain separate work. This is a pointer-folding/layout repair,
not complete right-sidebar or application parity.
