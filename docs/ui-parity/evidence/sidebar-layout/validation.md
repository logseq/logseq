# Sidebar width ownership and native pointer resizing

## Inputs and scope

Reference master `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8`; native parent
`3c9a39b4995c1899b62657b7488576712f773ce8`. Linux, actual Electron reference
and actual GL/SDL native executable, 1280 × 900, scale 1, English/light.
Both show the disposable `Window 标题 final` page. Its visible body is empty;
older recent-page lists are not globally identical and do not establish list parity.
Graph View and Page graph visualization are user-excluded; neither was activated.
The accepted top-header placement does not exempt its sidebar background.

## Observed difference and repair

Master sources: `left_sidebar.cljs:517` owns a 246px default and a three-pixel
overlaid handle. Left drag stores the handle's left edge, clamped to 240–460px,
as a quoted CSS pixel string. `right_sidebar.cljs:403`, `state.cljs:151` and
`container.css` own a 40% default, pointer/viewport percentage, a 320px drag
minimum (at this viewport), close below half that minimum, and a 60vw visible cap.

Before repair, native defaults rendered 247px/429px rather than 246px/512px.
Confirmed pointer dragging did not emit `ValueChanged` or resize the dock.
The custom SDL loop lacked split gesture translation. Fraction-owned left
preferences also drifted with viewport and right-dock changes.

The narrow `Host_split` adapter now translates captured sidebar gestures through
existing typed `ValueChanged` events using retained geometry, without changing
LUI or introducing a browser wrapper. Popups keep ownership; release, removed
owners and window blur/hide/minimize cancel capture. Left pixels and right
percentages are persisted in canonical quoted CSS units. Former native bare
fractions are converted and rewritten once at initialization, after obtaining
the actual SDL dimensions. No graph/DB migration is involved. All rendered-width
consumers use the same 60vw cap; header underlay follows the left pixel width.

Review exposed a missed inner minimum-width consumer: a 65% preference required
820px inside a 768px pane. `right-inner-cap-red.txt` reproduces this in production
layout before the targeted fix. Review also exposed redundant synchronous
preference writes for unchanged/clamped widths; `unchanged-width-write-red.txt`
reproduces this before guards. The final native tests pass both regressions.

## Paired interaction evidence

| Reproduction | Master | Native after repair | Evidence |
| --- | --- | --- | --- |
| Both docks initially open | Left246px, right512px | Left246px, right512px | `master-both-initial*`, `native-both-before*`, `native-both-after.png` |
| Left handle246→310 at y450 | Left309px; `"309.00px"` | Same309px and pixel string | `master-left-drag64*`, `native-left-drag64-after.png`, `native-drags-after.txt` |
| Right handle770→720 at y450 | Right560px;43.75% | Same560px;43.7500% (equivalent precision) | `master-matched-drags*`, `native-right-drag-after.png`, `native-drags-after.txt` |
| Left drag below/above limits | 240px /460px | 240px /460px | `master-limits.json`, `native-limits.jsonl`, `native-left-min.png`, `native-left-max.png` |
| Right drag to x448 (65% preference) | Visible768px/60vw | Visible768px; inner/header inside viewport | `master-right65-visible60.png`, `native-right65-visible60.png`, production geometry regression |
| Right drag past half-minimum | Closes; prior last valid preference retained | Closes; prior last valid preference retained | `master-limits.json`, `native-right-closed.png`, `native-limits.jsonl` |
| Header toggle reopens right | Retains previous preference | Retains previous preference | Actual pointer execution, reference limits JSON |
| Left header toggle closed/open | Reference behavior previously inventoried | Retains309px | Actual native pointer execution before restart |
| Resize1280→1100→1280 | Pixel/percentage ownership established by source | Left309px at both sizes; right follows percentage | `native-1100-after*`, `native-1280-restored.png` |
| Native UI and own worker stop/restart | Not an OS lifecycle equivalence claim | New UI195880/worker195887 restores309px and560px when right reopened | `native-worker-restart*` |

Continuous closing drags may persist different last valid fractions because the
platforms receive different intermediate motion samples. The final close rule,
unit ownership and restored preference semantics match; sample-dependent values
are not claimed identical. Right open/closed state across application restart is
not covered here; width restoration is verified by explicitly reopening it.

The master screenshot includes excluded navigation entries, so Favorites/Recent
and Help naturally occur earlier in native. No fake placeholders were added.

## Validation

- Test first: split gesture and width-owner regressions, capped production inner
  geometry, unchanged preference-write suppression. Malformed stored values also
  explicitly reject in focused native tests.
- `opam exec -- dune build -j3 ocaml_host/logseq_native.exe js_app test`: pass.
- `opam exec -- dune runtest --force -j3 test/native_host test/contracts ocaml_host`:
  pass; expected simulated save rejection diagnostics are intentional tests.
- Shared production UI suite: **2119 checks, zero failures**.
- Fresh Vite bundle: pass. Serial journal/page/property browser regressions:
  **5/5 pass**. Focused command-menu page creation/editor-focus E2E: **1/1 pass**.
- Focused spec validation and whitespace checks: pass. No new shipped UI text.
- Nine independent read-only review passes completed. All actionable findings
  have targeted fixes and red/green coverage; no remaining code findings.

Input qualifications: some automation drags delivered motion without a matching
SDL down event, or down at the previous pointer location. Those were not counted.
Successful trials first established the handle location with an actual click,
then used a foreground drag; SDL down/move/up, `ValueChanged`, retained bounds and
persisted preferences confirmed delivery. A query against an already closed
window blocked the desktop automation daemon; it was restarted with its existing
settings. Application data and deadline timer were unchanged. One reference
locator used an incorrect icon class and timed out; the correct existing
`.toggle-right-sidebar` control was used for the passing repetition.

## Still incomplete (L04/R02 remain Partial)

- Resizer hover/active colored line, cursor transitions and tooltip states;
  native right separator keyboard5px steps/Tab focus/ARIA semantics.
- Native left grip above the body header boundary, very narrow/mobile layouts,
  touch, resize during menu/editor activation, external pointer release and blur
  execution (cancellation code exists, not all OS paths exercised).
- Sidebar item drag/reorder, folds, independent scroll, breadcrumbs, favorites,
  recents, graph switching and all right-item actions remain separate inventory.
- Contents card appearance/properties alignment, disclosure state and title
  wrapping/hyphenation still visibly differ in paired cap screenshots.
- Dark theme and macOS-specific behavior are not verified by this chunk.
- Dependency retained-cache, glyph opacity, GL tooltip and web pointer-overlay
  blockers remain documented elsewhere. No dependency source was edited.

This is a validated pointer-sizing checkpoint, not complete sidebar or app parity.
