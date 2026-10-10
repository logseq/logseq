# Shared UI Visual Design Implementation Plan

Goal: Give Web and GPUI the same Logseq visual design by defining layout, design tokens, component appearance, and interaction states once in the shared UI layer.

Architecture: Shared OCaml modules own application tokens and reusable component recipes.
LUI carries typed layout and appearance properties to each renderer, while small host adapters map the shared theme to browser variables and GPUI Kit controls.
Migrate one component family at a time and remove duplicated CSS and Rust definitions after both renderers pass behavior and visual checks.

Tech Stack: OCaml, Melange, LUI, ocaml-signal, Rust, GPUI Kit, Web CSS, and existing production-view test harnesses.

Related: `docs/agent-guide/proposed/architecture/2026-10-08-002-ui-shared-implementation.md`, `docs/agent-guide/proposed/feature/2026-10-09-ui-interaction-parity.md`, `deps/ui/docs/architecture.md`, `deps/ui/docs/component-migration.md`, and `deps/ui/docs/gpui-plan.md`.

Status: Exploring implementation plan, created on 2026-10-10.
This document follows the repository-required spec-dev-tool lifecycle naming rather than the generic planning skill's root-level numbering convention.
Sequence 003 is retained in the topic name.
The request authorizes creating this document; no application or LUI implementation is included in this task.

## Problem

The shared UI tree does not yet carry all information needed to reproduce Logseq's visual design.
Web obtains important geometry, typography, surfaces, and interaction states from CSS selectors.
GPUI receives the component tree and typed props, then supplements them with a separately maintained Rust class-style table.
Changes to one definition can leave the other renderer incomplete or visually inconsistent.


The older component migration specification explicitly drops decoration in favor of native theme defaults.
That policy preserves shared structure but loses product-specific visual hierarchy and component density.
Matching colors alone cannot fix different row heights, text weights, badge shapes, focus rings, or selected states.

### Current source evidence

| File | Evidence | Consequence |
| --- | --- | --- |
| `resources/css/lui-overlay.css` | Command-palette headers, badges, result rows, and highlighted states carry appearance and layout rules. | The shared view is not the complete visual specification. |
| `deps/ui/src/shared/cmdk_view.ml` | Headers and badges rely on semantic classes such as `cp__cmdk-group-title`. | These components need shared appearance and layout definitions. |
| `deps/ui/gpui/host/src/logseq_ext.rs` | `register_class_styles` manually ports Web rules. | The application maintains two visual definitions. |
| `../lui/platform/gpui/crates/lui-gpui/src/style.rs` | GPUI handles typed surface props, utility tokens, and registered semantic classes. | Reuse typed support; GPUI does not ignore every class. |
| `../lui/src/lui_elements.mli` | Elements already expose layout, colors, borders, and corner radius. | Much of the migration can use current APIs. |
| `deps/ui/src/contracts/ui_services.mli` | Theme preference, effective mode, and platform application have a service boundary. | Extend that boundary only where shared theme delivery needs it. |
| `deps/ui/docs/component-migration.md` | Decoration policy prefers native defaults and Web stylesheet classes. | Update the policy when shared visual ownership is implemented. |

### Working-tree boundary

At planning time, this checkout contains unrelated staged changes and an unresolved merge in `deps/ui/gpui/host/src/main.rs`.
A staged `deps/ui/gpui/host/src/logseq_theme.rs` introduces a classic light/dark palette, and `logseq_ext.rs` also has pending edits.
Treat these as ongoing work, not an established clean baseline.
Before implementation, inspect the resolved checkout and integrate its theme work instead of introducing another parallel palette.
Do not resolve the merge, change staging, or modify those files during document creation.

## Proposal

Make the shared UI layer the authoritative definition of Logseq's visual design.
Use typed layout props, shared design tokens, and reusable component recipes with explicit state appearance.
Keep application design decisions in Logseq and LUI's primitives application-independent.


The suggested visual reference is the current approved Web appearance, allowing differences in text rasterization and platform window chrome.
This baseline remains subject to the question at the end of the document.
Deliver the command palette first, then migrate other component families using the verified pattern.
The initial delivery targets Web and GPUI; it does not promise Apple pixel parity or portable execution of arbitrary user CSS.

## Testing Plan

Add production-view scenarios that exercise real command-palette components and inspect emitted layout and appearance props in both Melange and native entries.
Use the existing fake worker only at the graph boundary.
Assert visible behavior: opening, selection, readable hierarchy, theme changes, focus retention, and dismissal.
Do not substitute token-record shape tests for renderer checks.


Add focused LUI renderer regressions for each missing appearance capability before implementing it.
For Web, check computed styles, bounding rectangles, actual focus, and pointer/keyboard transitions on mounted elements.
For GPUI, check rendered geometry and paint using the existing renderer regression support.
Use the real GPUI application window for pilot acceptance, because recording-host and headless tests cannot establish application popup visibility.


Capture identical disposable fixtures at 1280 by 900 in light and dark modes, with identical content, font preference, and documented device scale.
Cover normal, hovered, pressed, keyboard-focused, selected, and disabled states where applicable.
Assert intended logical dimensions within one logical pixel and compare stable surfaces separately from text antialiasing.
Review baseline, wrapping, clipping, and visual hierarchy explicitly.
Record absolute placement before crop normalization; an aggregate pixel-difference percentage must not hide a missing popup or misplaced focus ring.


Preserve command execution, two-step Escape behavior, initial focus, outside dismissal, and selection scrolling.
Theme changes must repaint retained elements without clearing the query or remounting the input.
The planning task runs document validation only and does not claim that application checks already pass.


NOTE: I will write *all* tests before I add any implementation behavior.

## Architecture

```text
Logseq shared OCaml
  Ui_theme: colors, typography, spacing, radius, density
  Ui_components: result row, section header, badge, button, panel
  Production views: typed layout + variants + controlled state
                          |
                  LUI typed properties
                   /              \
          Web renderer          GPUI renderer
          DOM styles            Styled refinements
          browser states        GPUI interaction states

One shared theme snapshot
          /                         \
 Web theme adapter              GPUI theme adapter
 CSS variables                  GPUI Kit Theme slots
```

### Ownership

| Concern | Shared owner | Backend responsibility |
| --- | --- | --- |
| Component layout | Production view or reusable component | Render typed sizes, gap, padding, alignment, and flex behavior. |
| Palette and scales | `Ui_theme` | Consume the selected snapshot. |
| Variants and controlled state | `Ui_components` | Render resolved appearance. |
| Hover, press, focus-visible, disabled refinements | Shared recipe using a small typed LUI capability | Apply appearance to actual interaction state. |
| GPUI Kit controls | Shared theme values | Map values to Kit slots without owning another palette. |
| Browser-specific decoration and user CSS | Web boundary | Apply explicit Web overrides. |
| Window chrome, IME, editor conduit, media | Existing platform boundaries | Preserve behavior and consume shared visual values where relevant. |

### Shared theme

Create proposed portable modules `deps/ui/src/shared/ui_theme.ml` and `deps/ui/src/shared/ui_theme.mli`.
Use a small typed vocabulary based on real needs: canvas, panel, elevated surface, foreground, muted foreground, border, accent, selected surface, focus ring, and destructive content.
Define named typography, spacing, radius, and density values alongside colors.
Keep exact built-in design values here rather than independently maintaining them in CSS and Rust.


Resolve colors and dimensions from the active snapshot and deliver them through existing typed props wherever possible.
Reuse effective light/dark mode and persistence from the current settings and theme service.
Keep one theme-state owner, not a second preference store or observer loop.
Deliver the same snapshot through that service to remaining Web CSS variables and GPUI Kit slots.
Adapters own explicit mappings, not independent palette values.
Fail on missing required built-in values rather than silently substituting defaults.


The pilot does not require a stylesheet parser, a new design language, or a generated palette pipeline.
If build integration becomes necessary, scope it separately and do not commit build artifacts.

### Shared components

Create proposed portable modules `deps/ui/src/shared/ui_components.ml` and `deps/ui/src/shared/ui_components.mli`.
Start with section headers, result rows, badges, and the command-palette input surface.
Add buttons and panels only when an actual migration needs them.
Prefer small constructors built on `Lui_elements` to a second virtual tree or generic CSS abstraction.


Each recipe owns geometry, text hierarchy, surface appearance, and supported states.
Use existing background, foreground, border, radius, gap, padding, and alignment props first.
If a kind lacks a necessary property, add the smallest reusable LUI capability rather than injecting utility classes or JSON attributes.
These module names and any new state-property identifiers are proposals, not current APIs.

### State appearance

Keep selection, toggling, and availability controlled by application state and express changes through reactive typed props.
Treat hover and press as renderer-local transient states governed by shared appearance.
Keep keyboard focus-visible distinct from pointer focus.
Retain accessibility and activation behavior.


Inventory existing state and typography APIs before choosing new identifiers.
If necessary, add a typed state-refinement representation scoped to pilot needs and supported by both renderers.
Define precedence: disabled suppresses activation and hover/press treatment; pressed refines hovered appearance; selected remains meaningful with hover; keyboard focus retains a ring unless disabled.
Do not use backend-specific class suffixes or whole-component remounts to encode these states.

### LUI capability boundary

Candidate core files are `../lui/schema/components.json`, `../lui/src/lui_elements.ml`, `../lui/src/lui_elements.mli`, `../lui/src/lui_protocol.ml`, and `../lui/src/lui_protocol.mli`.
Use existing generation tooling to synchronize wire-schema outputs.
Web support belongs in `../lui/platform/web/melange/render/lui_web_props.ml` and the applicable widget renderer.
GPUI support belongs in `../lui/platform/gpui/crates/lui-gpui/src/style.rs` and the applicable path in `kinds.rs`.
Add size, weight, and line-height support only where existing typography is insufficient.
LUI must not encode Logseq class names or palette keys.


Read LUI directory instructions and `../lui/.agents/skills/lui-reactive/SKILL.md` before implementing view changes there.
LUI prohibits Dune changes unless explicitly requested; identify any necessary build-rule change separately before implementation.
Publish and pin the tested LUI revision before declaring clean-checkout integration reproducible.
Check Apple renderer validation and coverage for new shared properties; do not silently ignore unsupported appearance.

## Implementation sequence

### Task 1: Freeze the pilot and inventory capabilities

Files: this plan, `deps/ui/src/shared/cmdk_view.ml`, `resources/css/lui-overlay.css`, `deps/ui/gpui/host/src/logseq_ext.rs`, and the LUI API and renderer files above.

1. Inspect the resolved Git status in both repositories and identify the latest palette implementation.
2. Capture approved command-palette references in light and dark modes with a disposable fixture.
3. Inventory pilot CSS and Rust mappings, including descendant selectors, inheritance, and state selectors.
4. Classify each rule as shared layout, shared appearance, state treatment, stable selector hook, or Web-only decoration.
5. Record existing properties, missing capabilities, baseline test results, and known native visibility failures.

Exit: every pilot rule has an owner, migration destination, and observable acceptance check.

### Task 2: Implement missing LUI capabilities with renderer tests

Files: LUI core and renderer files above, `../lui/test/test_lui.ml`, `../lui/platform/web/test/`, and `../lui/platform/gpui/crates/lui-gpui/tests/regressions.rs`.

1. Write a failing mounted-renderer test for each missing typography or state capability.
2. Run the focused test and confirm the intended rendering failure.
3. Add only the missing typed property and wire support.
4. Implement Web and GPUI rendering and validate other backend protocol coverage.
5. Verify retained-node updates preserve focus and input state.
6. Run focused checks, publish the tested revision, and update the application pin through `deps/ui/scripts/install-opam-deps.sh`.

Exit: the pilot can express its design without CSS-only geometry or new semantic class mappings.

### Task 3: Establish shared tokens and theme delivery

Files: proposed `ui_theme.ml` and `.mli`, `deps/ui/src/contracts/ui_services.ml` and `.mli`, `deps/ui/web/platform_web.ml`, `deps/ui/native/services/platform_native.ml`, `deps/ui/gpui/host/src/logseq_theme.rs`, and `resources/css/theme/vars-classic.css`.

1. Write a failing theme-switch scenario checking mounted colors, focus retention, and preserved query text.
2. Move the pilot's design values into the shared theme module.
3. Deliver the snapshot through the current service with explicit required fields.
4. Apply it to browser variables and Kit slots through value-conversion adapters.
5. Initialize the Kit registry and selected theme before the first relevant paint.
6. Verify Light, Dark, and System transitions, including changes while the palette is open.

Exit: one shared token changes the same visual role in both renderers, including Kit controls.

### Task 4: Migrate the command palette

Files: proposed `ui_components.ml` and `.mli`, `deps/ui/src/shared/cmdk_view.ml`, `deps/ui/src/shared/ui_parts.ml`, `deps/ui/test/shared/shared_scenarios_cmdk.ml`, `resources/css/lui-overlay.css`, and `deps/ui/gpui/host/src/logseq_ext.rs`.

1. Add failing tests for header typography, result density, badge geometry, and selection appearance.
2. Implement shared recipes using the active theme.
3. Replace layout-carrying classes with typed props and move visual states into the shared recipe.
4. Keep stable semantic classes only where tests, SDK callers, or user CSS actually need them.
5. Delete the migrated declarations from both the stylesheet and Rust table.
6. Verify search, focus, selection, scrolling, activation, two-step Escape, outside dismissal, and reopening.
7. Capture actual Web and GPUI windows and record remaining placement or visibility differences.

Exit: both renderers display the pilot correctly without relying on removed duplicate rules.

### Task 5: Expand by component family

| Batch | Candidate files | Required checks |
| --- | --- | --- |
| Sidebar and shell | `deps/ui/src/sidebar/left_sidebar_view.ml`, `deps/ui/src/sidebar/right_sidebar_view.ml`, `deps/ui/src/shell/chrome.ml` | Navigation density, selection, hover, icon alignment, disclosure, resizing, overflow. |
| Menus and dialogs | `deps/ui/src/popups/popups_view.ml`, `deps/ui/src/dialogs/dialogs_view.ml`, `deps/ui/src/dialogs/quick_add_view.ml` | Surface, border, radius, padding, layering, focus, keyboard navigation, anchor placement. |
| Settings and properties | `deps/ui/src/shared/settings_controls.ml`, `deps/ui/src/properties/properties_view.ml`, `deps/ui/src/properties/properties_select.ml` | Labels, input height, disabled state, checkbox/switch geometry, saved values. |
| Pages and editor | `deps/ui/src/pages/page.ml`, `deps/ui/src/editor/edit_view.ml`, `deps/ui/src/render/` | Heading hierarchy, line metrics, read/edit consistency, caret/selection alignment, task/property glyphs. |

For each batch, inventory rules, write failing tests, implement shared recipes, delete duplicates, and capture both actual renderers before proceeding.
Confirm current paths and owners before editing; the table identifies areas, not a broad directory rewrite.
Editor text measurement, painting, caret, and selection must consume consistent font and line metrics.
Shell parity does not establish editor or property-control parity.

### Task 6: Remove obsolete ownership and update guidance

Files: `deps/ui/docs/component-migration.md`, `deps/ui/docs/gpui-plan.md`, `deps/ui/docs/architecture.md`, `deps/ui/src/shared/ui_parts.ml`, affected CSS, and `deps/ui/gpui/host/src/logseq_ext.rs`.

1. Replace the native-default decoration policy with shared visual ownership. *(done — `component-migration.md`, `gpui-plan.md`, `architecture.md` now describe the `Ui_theme` token snapshot + `Ui_components` recipes → typed props model; adapters only translate props, and decoration with no native channel stays adapter-side in `lui-overlay.css`/`logseq_ext.rs` hook classes)*
2. Remove unused registrations and utility bundles after their consumers migrate. *(done — dead-registration audit of all 87 classes registered in `logseq_ext.rs`: every registration still has a live emitter or a CSS-side consumer, including dynamic families `ls-dialog-*`, `mode-*`, `block-drag-over-*`; `menu-links-wrapper` kept for its `lui-overlay.css` consumer. Zero removals)*
3. Keep specialized widget registration separate from generic appearance. *(done — `ui__dialog-*`, `cp__theme-modes-*`, `ed-*`, `block-drag-*` widget chrome registrations stay; no generic appearance remains in `register_class_styles` beyond hook classes)*
4. Check selector callers before deleting class names. *(done — unstyled-emitted-token audit: 162 tokens have neither a CSS rule nor a gpui registration; 65 e2e/test hooks, 12 imperative selector hooks, 5 dynamic-prefix-family members, 75 dead candidates, 5 extraction artifacts — classification in `003-assets/audit-unstyled-tokens.md`; no code deleted)*
5. Extend `deps/ui/scripts/check-shared-boundaries.sh` only if an actual regression requires a narrow rule; do not impose a blanket CSS/Rust-style ban. *(done — no regression demanded a rule; script unchanged)*
6. Record family-specific evidence and intentional backend differences. *(done — see "Family evidence" below)*

Exit: migrated components have no independently maintained Web and GPUI design values.

### Family evidence

Per-family deleted-rule totals (web CSS lines / `logseq_ext.rs` registrations removed during T1–T5):

| family | deleted CSS rules | deleted `logseq_ext.rs` registrations |
| --- | --- | --- |
| cmdk (T1) | 559 lines | 45 |
| settings (T2) | ~600 lines | — |
| menus/overlays (T3) | ~445 lines | — |
| editor chrome (T4) | ~181 lines | — |
| sidebar + split machinery (T5) | ~330 LOC | — |

Intentional backend differences that remain adapter-side on gpui
(natively inexpressible, no typed-prop channel): `letter-spacing`,
`user-select`, keyframe animations, `var()` fallback chains
(`hsl(var(--popover))`, `var(--ls-*)` twins), `dvh` viewport sizing,
programmatic menu anchoring (pre-#175), `::selection` colors,
tooltip-arrow `rotate` transform, descendant-hover rules
(`.cp__cmdk-hint-label`, `.prop-edit-ico`), media-query breakpoints
(640/768 px), `calc()` micro-layout, `::first-letter`,
`-webkit-line-clamp`, `text-align`, `resize`, `transform` (switch
knob, `.ls-icon-mini`), `grid-template-columns` (fit-content 260px),
calendar/date-picker family, file_picker backend, blur channel.
Web-side equivalents live in `resources/css/lui-overlay.css`; gpui-side
ones in `logseq_ext.rs` hook-class registrations.

## Verification commands

These are implementation gates, not checks executed during plan creation.
Use the existing opam switch and locked dependencies from the named directory.
Confirm current emitted test paths and fixture prerequisites before running older documented commands.

| Working directory | Command | Expected result |
| --- | --- | --- |
| `logseq/deps/ui` | `rtk proxy opam exec --switch=5.5.0 -- dune build js_app test gpui/drive_test.exe gpui/native_embed.exe.o` | Affected Web, tests, native driver, and embed compile. |
| `logseq/deps/ui` | `rtk proxy node _build/default/test/ui_test/test/test_main.js` | Production-view Web checks pass. |
| `logseq/deps/ui` | `rtk proxy opam exec --switch=5.5.0 -- dune exec gpui/drive_test.exe` | Shared production scenarios pass natively. |
| `logseq/deps/ui` | `rtk proxy opam exec --switch=5.5.0 -- dune runtest test/contracts gpui` | Service and native-process regressions pass. |
| `logseq/deps/ui/gpui/host` | `rtk cargo test --locked` | Application-host tests pass. |
| `lui` | `rtk proxy opam exec --switch=5.5.0 -- dune runtest test` | Core typed-prop and runtime checks pass. |
| `lui/platform/web` | `rtk npm test` | Existing Web adapter tests pass. |
| `lui/platform/web` | `rtk proxy node --test test/review.e2e.mjs` | Real-browser checks pass with existing fixture setup. |
| `lui/platform/gpui/crates/lui-gpui` | `rtk cargo test --locked --test regressions` | Native renderer checks pass using required platform display setup. |
| `logseq` | `rtk bb lint:dev` | Development lint passes. |
| `logseq` | `rtk bb dev:lint-and-test` | Required checks pass before submitting a PR. |

Use the current documented GPUI launch and capture workflow for actual application-window evidence.
Do not invent a pixel runner if current support cannot capture that window.
If application end-to-end coverage is expanded, use the App suite in `ocaml-e2e/`; CLI E2E is outside this visual migration.
Rebuild changed targets only and reuse unchanged compiled CLJS test artifacts.

## Alternatives considered

### Continue manually porting CSS to GPUI classes

This can repair individual screens quickly but preserves duplicate ownership.
Keep existing registrations only until their component family migrates.

### Build a general CSS engine for GPUI

This expands scope to selectors, inheritance, cascade, pseudo-elements, browser units, and unsupported rendering effects.
It introduces a compatibility surface unnecessary for typed component design.

### Share only palette tokens

This improves colors while leaving typography, density, geometry, and states divergent.
Tokens must feed shared recipes to solve the problem.

### Design an independent GPUI interface

This requires independent ongoing design and acceptance.
It does not satisfy the suggested shared-visual-design goal.

## Acceptance criteria

- The pilot renders visibly in actual Web and GPUI windows in light and dark modes.
- Shared props or recipes define dimensions, typography, surfaces, and state treatment.
- Both adapters consume one theme snapshot without independent built-in palettes.
- One token or recipe edit changes the corresponding appearance on both renderers.
- Theme/state changes preserve query, focus, selection, and node identity.
- Activation, disabled behavior, scrolling, initial focus, dismissal, and reopening remain correct.
- Migrated CSS and Rust rules are removed rather than retained as hidden fallbacks.
- Screenshot evidence records absolute position and visible states, with intentional rasterization differences documented.
- Each later family meets the same checks before completion is claimed.
- The dependency pin installs the tested LUI revision on a clean checkout.
- Guidance no longer instructs contributors to discard shared decoration for native defaults.

## Risks

- Unresolved application changes can invalidate ownership and captures; refresh the baseline after integration.
- Kit slots may combine roles that Logseq separates; shared surfaces must retain necessary distinctions.
- Typography changes can affect editor measurement and selection geometry.
- Removing inherited CSS can expose visual properties never explicitly modeled.
- Theme changes can leave cached GPUI paint stale without correct invalidation.
- User CSS remains a Web override mechanism, not a portable theme format.
- Pixel identity across text rasterizers is unrealistic; geometry and hierarchy still need explicit acceptance.
- New properties require schema, wire, and backend synchronization, including Apple validation coverage.

## Testing Details

Production-view tests exercise real state transitions and inspect emitted rendering props.
Browser tests verify computed appearance and visible interactions on mounted nodes.
GPUI regressions verify layout and paint, while actual-window captures establish application popup visibility and placement.
Theme tests establish retained-state behavior rather than merely checking a changed token table.
Do not write tests that only repeat recipe definitions or check mock return values.

## Implementation Details

- Keep application tokens and recipes in portable OCaml modules.
- Prefer existing typed props before extending the protocol.
- Resolve built-in design values once and deliver them through existing services.
- Limit adapters to conversion and explicit Kit-slot mappings.
- Use reactive props for controlled appearance changes.
- Keep transient interaction handling in renderers using shared state appearance.
- Delete duplicate rules after each family's acceptance gate.
- Preserve selector hooks only where actual callers require them.
- Follow @.agents/skills/logseq-lui/SKILL.md and @/Users/tiensonqin/.codex/skills/test-driven-development/SKILL.md during implementation.
- Load @.agents/skills/logseq-i18n/SKILL.md before changing shipped text; this plan requires no new user-facing strings.

## Questions

1. Should visual acceptance use the current Web design, allowing platform text rasterization and window-chrome differences, or should GPUI have its own separately designed appearance?
   The recommended choice is the current Web design, and the implementation sequence above is drafted around that choice.

---
## Appendix — Task 1 cmdk visual inventory

Working inventory for `2026-10-10-003-shared-ui-visual-design.md`. Source
files audited:

- `resources/css/lui-overlay.css` — cmdk block lines ~732–1310 (71 rules)
- `deps/ui/gpui/host/src/logseq_ext.rs` — cmdk registrations lines ~306–780
  (~40 entries; web keys `[data-cmdk-item]` attrs, gpui registers
  `cp__cmdk-item`/`cp__cmdk-item-hl` classes — dual hook tracks)
- `deps/ui/src/shared/cmdk_view.ml` — view structure emitted for both ends
- Prior gpui audit: ~800 class tokens emitted by views, ~135 (17%) resolve
  on the gpui host.

Reference captures (web, 1280×900, deployed refactor/lui build):
`003-assets/cmdk-web-light.png`, `003-assets/cmdk-web-dark.png`.
GPUI baseline: gpui child report screenshots (cmdk/dialog/toast already
verified renderable).

## Classification

Every rule is classified as: **layout** (shared, typed-prop owned),
**appearance** (shared, token/recipe owned), **state** (typed state
refinements), **hook** (structure-only, keep for tests/commands), or
**deco** (web-only decoration, stays in per-platform CSS).

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.lui-dialog.ls-dialog-cmdk` overflow hidden | layout | dialog recipe (clip) |
| `.cp__cmdk-dismiss` position:absolute inset:0 | layout | overlay/dismiss recipe — needs position+inset props |
| `.ls-dialog-cmdk` width 90dvw max-w 56rem | layout | dialog recipe |
| `.cp__cmdk__modal` border-radius .5rem | appearance | token `radius.modal` |
| `.cp__cmdk` flex-col h-full radius color | layout+appearance | palette recipe |
| `.cp__cmdk__block` variants (sidebar mode) | layout | palette recipe variant |
| `.cp__cmdk .ui__icon` font-size 1rem | appearance | icon slot recipe |
| `.cp__cmdk > .hints` flex row min-h 45px padding gap bg border-t | layout+appearance | hints-bar recipe + tokens |
| `.cp__cmdk-input-row` flex h 54px gap bg border-b | layout+appearance | input-row recipe |
| `.cp__cmdk-input-row .ui__icon` opacity .6 | appearance | muted icon slot |
| `.cp__cmdk-search-input` flex1 min-w font-size 1.25rem lh 1.75rem pad color | layout+appearance | search-input recipe + text tokens |
| input focus ring removal (`:focus-within`, `:focus` outline none) | state | typed focus state (suppress ring) |
| `::selection` colors | deco | web adapter only |
| `.cp__cmdk-scroller` overflow-y auto min/max-h 65dvh pb 3.5rem | layout | scroller recipe |
| `.cp__cmdk-group` pb border-b / `[data-cmdk-group-kind="create"]` / `:last-child` | layout+appearance | group recipe + kind variant |
| `.cp__cmdk-group-header` flex h-2rem pad font .75rem color bg | layout+appearance | group-header recipe |
| `.cp__cmdk-group-title` weight 700 user-select cursor | appearance+state | text token + selectable prop |
| `.cp__cmdk-group-count` radius 9999 font .7rem color | appearance | count pill recipe |
| `.cp__cmdk-group-more` opacity .5 → .9 hover | state | typed hover opacity |
| `.cp__cmdk-group-more-inner` flex gap .25 | layout | recipe |
| `.cp__cmdk-group-spacer` flex-grow 1 | layout | spacer kind |
| `[data-cmdk-item]` col gap pad radius margin font .875 lh 1.25 | layout+appearance | item-row recipe |
| `[data-hoverable]` cursor pointer | state | typed hoverable/cursor |
| `.cmdk-item-header` flex gap pl-2rem font .75/300 ellipsis color | layout+appearance | item-header recipe (needs nowrap+ellipsis props) |
| `.cmdk-item-main` flex gap .75 align-start | layout | recipe |
| `.cmdk-item-icon` 1rem×1.25rem chip radius bg (+dark #fff) | appearance | icon-chip recipe |
| `.cmdk-item-body` flex-col flex1 min-w-0 | layout | recipe |
| `.cp__cmdk-item-main-text` flex gap weight 500 color overflow | layout+appearance | item-title recipe |
| `.lui-stack` display:inline inside main-text / `.cp__cmdk-item-info` descendants inline | deco | web quirk — LUI stack is block-ish; recipe should emit inline text runs instead of forcing display:inline |
| `.cp__cmdk-item-info` inline font .75 muted color | appearance | info suffix slot |
| `.breadcrumb.block-parents` nowrap ellipsis | layout | breadcrumb recipe (needs ellipsis) |
| `.cp__cmdk-current-page-badge` inline-flex pill border font colors | appearance | badge recipe |
| `[data-kb-highlighted]` bg + inset ring shadow | state | typed selected state + shadow token |
| `[data-hoverable]:not([data-highlighted]):hover` bg + ring | state | typed hover state |
| `[data-hoverable][data-highlighted]:hover` stronger ring | state | typed hover+selected |
| `.dark` variants clearing box-shadow on highlighted rows | state | dark-aware state recipe |
| `.shui-shortcut-combo/-separate/-chord` inline-flex gap | layout | keycap recipe |
| `.shui-shortcut-chord-sep` font 10px opacity .45 | appearance | keycap separator slot |
| `.shui-shortcut-key` Inter 12px ls -.5px min-w pad | appearance | keycap text recipe (needs letter-spacing prop) |
| `.shui-shortcut-combo.shui-shortcut-glow` inset shadows | appearance | glow variant + shadow tokens |
| `.shui-shortcut-separate .shui-shortcut-key` boxed bg/border | appearance | boxed variant |
| `.shui-shortcut-separator` 1px self-stretch | layout | recipe |
| `.ui__tooltip-content` flex gap max-w pad font border radius bg shadow | layout+appearance | tooltip recipe + tokens |
| `.ui__tooltip-content` fade-zoom animation | deco | web transition attr |
| `.ui__tooltip-arrow` absolute .5rem rotate45 border bg | layout+appearance | arrow recipe (needs position+transform or host primitive) |
| `.ls-tooltip-col` / `.ls-tooltip-keys` flex gap opacity | layout+appearance | recipe |
| `.cp__cmdk-hints/-inner/-row/-label` flex gap font colors | layout+appearance | hints recipe |
| `.cp__cmdk-tip` / `:hover` underline-ish color | state | typed hover |
| `.cp__cmdk-hint` padding radius bg + hover | appearance+state | hint chip recipe |
| `.cp__cmdk-hints` keycap overrides (boxed separate) | appearance | keycap recipe variant, not selector override |
| `.cp__cmdk-search-only-name/-clear` | appearance | recipe slots |
| `.cp__cmdk-empty` padding muted text | appearance | empty-state recipe |
| `[data-cmdk-item] mark` highlight color | appearance | highlight slot token |
| `.cp__cmdk-group-spacer` | layout | recipe |

## Hooks that MUST survive migration

Structure-only attributes/classes consumed by tests and command logic:
`data-cmdk-item`, `data-cmdk-group-kind`, `data-hoverable`,
`data-highlighted`, `data-kb-highlighted`, `.cp__cmdk-scroller` (scroll
anchoring), block/page id attributes. These stay as emitted attrs — the
visual spec moves to typed props; the hooks do not carry styling.

## LUI capability gaps (input to Task 2)

Required before cmdk can express its spec through typed props:

1. position absolute/fixed + inset offsets + z-index (dismiss overlay,
   tooltip arrow)
2. font-size / font-weight / line-height / letter-spacing on text
3. state refinements: hover / pressed / focus-visible / disabled /
   selected (per-prop state variants — bg, ring/shadow, opacity, cursor)
4. white-space nowrap + text-overflow ellipsis + overflow hidden on text
5. min-height / max-height (65dvh scroller), min-width
6. user-select none
7. box-shadow inset (highlight rings)

## Decoration that stays per-platform (adapter CSS, not tokens)

`::selection` colors, fade-zoom/transition keyframes, font-family stacks,
cursor details beyond pointer/default, `.lui-stack` display:inline quirks
(eliminated by emitting inline runs instead).

## Task 4 leftovers (accepted, per Tienson clarification)

The following bits of the old spec have no typed-prop channel and stay
as small CSS rules in `resources/css/lui-overlay.css`, or are dropped
for gpui:

- `.cp__cmdk-search-input::selection` — selection colors (no prop).
- `.cp__cmdk .ui__icon` + `.cp__cmdk-input-row .ui__icon` — `font-size`
  is not admitted on the Icon kind; the icon's point-size prop only
  sizes the glyph.
- `.ui__tooltip-content` fade-zoom animation (keyframes have no prop)
  and `.ui__tooltip-arrow` `transform: rotate(45deg)` (no transform
  prop).
- `.cp__cmdk-hint-label` + `:hover .cp__cmdk-hint-label` — child
  brightens on parent hover; a descendant relationship props cannot
  express (kept as a gpui class registration too).
- gpui-unsupported values emitted in props but unresolved on gpui:
  `hsl(var(--popover))` tooltip surface, `var(--ls-*)` twin fallbacks,
  letter-spacing, white-space/user-select hints, `dvh` viewport sizing.
  The gpui renderer uses what it natively supports and ignores the rest
  (documented leftover — no CSS machinery added to the host).

Also unchanged by design: `.lui-dialog.ls-dialog-cmdk` host geometry
block on both renderers, scrollbars, font stacks.

## Task 5 leftovers (settings & properties)

Blocked items with no typed-prop channel, kept as CSS or deferred:

- Date-picker/calendar family (44 rules: `.ui__calendar`,
  `.ls-editor-date-picker`, `.ls-date-month-menu`, `.ls-repeat-panel`,
  `.ls-time-picker`) — needs a calendar recipe + `color-scheme` and
  `table[role=grid]` support first.
- Grid track templates: `.property-panel-row`
  `fit-content(260px) minmax(0,1fr)` stays (no `grid-template-columns`
  prop). The `.it` 3-col grid was replaced by grow ratios instead.
- Web `file_picker` backend, blur event channel, parent-hover channel
  (`.prop-edit-ico` reveal, `:has(...:hover)` operands) — capability
  gaps; CSS/hook rules kept.
- Fractional sizing: plugin card `width:calc(50% - .5rem)` rides a
  `style` data_attr; `dvh` modal heights unchanged.
- Breakpoint channels: `.settings-menu-item[data-id="keymap"]`
  hide/show at 640px and `.panel-wrap`/`cp__settings-inner` 640/768
  breakpoints kept as media-query rules.
- `.shortcut-toolbar-row`/`.shortcut-filter-pills` keep `flex-wrap:wrap`
  only (no wrap prop); `.ls-cm-colors-row` keeps `margin-top`.
- `.select-item` value chips, importer/onboarding/new-graph/cards text
  recipes, `.ui__select-*`/`.ls-font-*` select & font pickers,
  `.ui__switch`/`.ui__checkbox` internals — un-migrated (either stay-
  custom emitters or pending sibling recipes).
- `::first-letter` capitalize, `-webkit-line-clamp`, `text-align`,
  `resize`, `transform` (switch knob, `.ls-icon-mini` scale) — no prop
  channel, CSS kept or handled by existing rules.

## Task 5 leftovers (menus & overlays batch)

**Programmatic menu anchor — verdict: NOT AVAILABLE in LUI
`2662e3c`.** `dropdown_menu` anchors to its DOM parent (trigger
pattern); `context_menu` binds right-click; neither accepts a
computed rect. `popover` is the only point-anchored kind
(`~at:(x, y)`, plus `~anchor`/`~anchor_alignment`), but its child
contract is free-form and rejects `menu_item` children
(`child_kind_supported` restricts `menu_item` to menu kinds), so it
cannot carry a menu surface. `views_popup.menu_level` (~20 call
sites) and the left-sidebar anchored menus stay on
`ui__dropdown-menu-*` classes this batch.

Required prop shape (LUI capability task, not a logseq-side hack):

- Preferred: `dropdown_menu ~at:(x, y)` or
  `~anchor_rect:{x,y,w,h}` — open the menu surface at a computed
  point/rect instead of its DOM parent, with existing
  `~anchor_alignment`/`~on_dismiss` semantics.
- Alternative: widen `popover`'s child contract to accept
  `menu_item`/`menu_section` children (a menu-surface role), so
  `popover ~at` can host menus.
- Either way the mounted surface must keep `menu_item` state
  channels (`selected`, `disabled`, `on_press`) and Escape /
  outside-tap dismiss parity with `dropdown_menu`.

**pdf docinfo modal** (`extension/pdf_toolbar.ml:887+`) stays
custom: it is imperative `Web_dom.create_element` DOM outside the
LUI element tree — needs a view-tree entry point before the `dialog`
kind can adopt it.

## Task 5 leftovers (editor chrome batch)

Blocked items per `review-editor-kit.md`, recorded for the LUI
capability list:

- **Accordion animation for foldables** — `.ls-foldable-title` /
  `.ls-collapsed` height+opacity transitions need an accordion kind (or
  animated disclosure) before the foldable family can adopt; CSS rules
  kept.
- **Tabs per-tab menu/overflow** — view tabs' per-tab context menu and
  tab overflow need a per-tab menu slot on the `tabs` kind; the `+`
  add-view button already rides a plain trigger.
- **Badge kind** — no badge/count kind; `ls-count` text hooks kept.
- **Segmented control** — no segmented kind (toggle_group covers
  settings' pill filters but the editor's bordered-pill sort/segment
  controls remain custom).
- **Menu/confirm e2e contract** — menu and confirm-dialog adoption is
  gated on the e2e contract task from the menus batch.

**Hover-reveal primitive (G7)** — not built. Where the earlier class
port dropped cljs's hover-lit reveal to popup-open-only
(`views_head.ml`), the `Signal.state` + `~opacity` +
`float_prop_signal` bridge from `properties_area.ml` now drives the
reveal: head hover and popup-open states OR into `signal_of_bools` and
both `.view-actions` and `.ls-add-view` consume the same derivation.
The `transition: opacity` rules are decoration and stay in
`lui-overlay.css`.

**Toolbar surface channel** — `toolbar` and the `action_toolbar`
composite admit no background/border/opacity props; `flat_toolbar`
flattens the card chrome via the data-attrs style pair and
`action_bar_capsule` supplies the floating-bar spec. Workable today,
but a proper surface/variant prop on the toolbar kind would retire the
style-pair trick.
