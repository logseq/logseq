# GPUI host interactive audit

Date: 2026-10-06
Branch audited: `devin/component-migration` @ `75a961c149` (fresh pull of `origin/devin/component-migration`)
Auditor: Devin session `9759783d3e414c33b062400b9699f978`

## Verdict: BLOCKED — host does not link at HEAD

The audit could not proceed past `cargo build` in `deps/ui/gpui/host`. No
interactive scenario below was exercised; every runtime row is **untested**.
Per the audit brief, the host was not patched.

### Reproduction

```sh
cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all   # OK
cd deps/ui/gpui/host && cargo build                         # LINK FAILURE
```

Linker tail (arm64, debug profile):

```
ld: warning: object file (deps/ui/_build/default/gpui/native_embed.exe.o)
    was built for newer 'macOS' version (26.0) than being linked (11.0)
Undefined symbols for architecture arm64:
  "_lui_ocaml_context_menu_press", referenced from:
      lui_gpui::kinds::... in liblui_gpui-*.rlib
  "_lui_ocaml_press_detail", referenced from:
      lui_gpui::kinds::... in liblui_gpui-*.rlib
ld: symbol(s) not found for architecture arm64
clang: error: linker command failed with exit code 1
```

### Root cause

`gpui/host` path-deps on the sibling `lui` checkout
(`../../../../lui/platform/gpui/crates/lui-{gpui,core}`). Upstream lui commit
`904eb0d` ("Add pointer-detail event vocabulary and pointer-enabled opt-in")
added `lui_ocaml_press_detail` and `lui_ocaml_context_menu_press` to the C
ABI; `lui-gpui` calls them from press / context-menu handlers
(`crates/lui-gpui/src/kinds.rs:114`, `:1048`, declared in
`crates/lui-core/src/bridge.rs:39`,`:63`).

The logseq side never grew these entry points:

- `deps/ui/apple/logseq_lui_bridge.c` (copied into the gpui object via
  `gpui/dune` `(copy ../apple/logseq_lui_bridge.c …)`) exports only the
  pre-pointer-detail set — `nm -gU _build/default/gpui/native_embed.exe.o`
  shows `lui_ocaml_press`, `_long_press`, `_double_press`, `_appear`, … but
  no `press_detail` / `context_menu_press` / `pointer_down` / `pointer_up`.
- `deps/ui/apple/native_embed.ml` registers no matching OCaml named values
  (`Callback.register` list ends at `lui_ocaml_root_node`; no
  `lui_ocaml_press_detail` / `lui_ocaml_context_menu_press` /
  `lui_ocaml_pointer_*`). So even a C shim alone would dispatch nowhere —
  the OCaml dispatch side is also missing.

The upstream reference implementation is `lui/platform/native/
lui_ocaml_bridge.c` (the `LUI_POINTER_DETAIL_EXPORT` block ~lines 155–175
plus `pointer_enter`/`pointer_leave`); the logseq bridge, a "superset of the
gallery bridge" per `host/src/main.rs`, simply lags it by this batch.

### No clean workaround exists

There is no lui revision against which the host both links and understands
the app's emissions:

- Any lui ≥ `904eb0d` → link fails on the two missing symbols.
- Any lui < `904eb0d` → links, but the renderer predates the vocab the app
  already emits at this pin (`data-attrs`, `as`, `link`, `kbd`,
  `input ~kind`, `file_picker ~accept`, `~tooltip`, `popover`, … — all added
  by pins `d7d3b9a`/`e812049`, both of which already contain `904eb0d`).

The app does not emit `popover`-kind nodes yet (popups still use `.ed-pos`
absolute wrappers + data-attrs), but it does emit the other post-904eb0d
vocab, so an old crate would still produce a degraded, non-HEAD build.

### Scope of the breakage

- Introduced by the pin bump to `d7d3b9a` (`961faa50` — first pin containing
  upstream `904eb0d`), **not** by the latest `e812049` bump (`75a961c149`).
  The host has not been linkable on this branch since `961faa50`.
- Apple host is **unaffected**: `lui/platform/apple/Sources` does not call
  the pointer-detail symbols, so the same shared bridge object still links
  there. The gap is gpui-specific.

### What unblocks it (finding, not a patch)

Mirror the upstream bridge additions on the logseq side:

1. `apple/logseq_lui_bridge.c`: add `LUI_POINTER_DETAIL_EXPORT`-style
   exports for `lui_ocaml_press_detail`, `lui_ocaml_context_menu_press`
   (and `pointer_down`/`pointer_up`/`pointer_enter`/`pointer_leave` for ABI
   completeness), dispatching `(node, x, y, modifiers, button,
   target_class)` to OCaml named values.
2. `apple/native_embed.ml`: `Callback.register` handlers for the same
   names, routing into `Lui_elements.register_press_detail` /
   `register_context_menu_press` / pointer-enter/leave dispatch.
3. Re-run `dune build gpui/native_embed.exe.o` then `cargo build`.

Until then every interactive item below is **untested**.

## Scenario results

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 0 | `dune build @all` (5.5.0 switch) | PASS | Needed `opam pin lui#e812049` re-pin + `opam install digestif melange-transit-melange melange-edn-melange` (switch drift, same as previous sessions) |
| 0 | `cargo build` host | **FAIL** | Missing `lui_ocaml_press_detail`, `lui_ocaml_context_menu_press` exports — see above |
| 1 | Initial render (sidebar/page/cmdk) | UNTESTED | window never opened |
| 2 | Block editor surface + CJK/caret boundaries | UNTESTED | — |
| 3 | cmdk scroller + input focus | UNTESTED | — |
| 4 | popover/menu positioning | UNTESTED | — |
| 5 | `$$…$$` katex + pdf/asset blocks | UNTESTED | — |
| 6 | Resize + virtual_list scrolling | UNTESTED | — |
| 7 | Pointer detail (x/y/modifiers, shift+click) | **FAIL by inspection** | Even once linked, these events dispatch to unregistered OCaml named values → dropped; shift+click & context-menu-press have no handler path |

## Findings (severity-ranked)

1. **[P0]** gpui host does not link at HEAD — `lui_ocaml_press_detail` /
   `lui_ocaml_context_menu_press` missing from `apple/logseq_lui_bridge.c`
   (and the OCaml named values missing from `apple/native_embed.ml`).
   Blocks the entire gpui interactive surface. Broken since pin
   `d7d3b9a` (`961faa50`).
2. **[P1]** Pointer-detail event path is absent on the OCaml side
   (independent of the link failure): `press_detail`, `context_menu_press`,
   `pointer_down`, `pointer_up`, `pointer_enter`, `pointer_leave` are not
   registered — x/y/modifiers/button/target_class cannot reach handlers,
   so modifier-click and context-menu behaviors are dead on gpui even
   after the C exports are added.
3. **[P2]** Env drift (process, recurring): the 5.5.0 switch's `lui` pin
   was still on `#main@9487731` and the switch lacked
   `digestif`/`melange-transit-melange`/`melange-edn-melange` — re-pin +
   install required before `dune build @all` goes green. (Same drift as
   prior sessions; `scripts/install-opam-deps.sh` exists for this.)
4. **[P3]** Link warning: `native_embed.exe.o` built for macOS 26.0 while
   the host links at 11.0 deployment target — benign today, but worth
   aligning `-mmacosx-version-min` between the dune and cargo builds.

## What's still stub / deferred (from code inspection)

- **Native popover positioning**: not wired — the app has no
  `Lui_elements.popover` emit sites at all; popups still go through
  `.ed-pos` absolute wrappers + data-attr coordinates, so on gpui they
  render inline in the DOM-ish tree rather than as native positioned
  overlays. (Matches the deferred native-positioning note.)
- **Pointer-detail events**: see P1 — whole category is stubbed.
- **Editor IME marked text**: could not be verified at runtime; host-side
  scratch-buffer IME exists in `gpui/host/src/editor.rs`, but with the
  window never opening this remains unverified.
- `lui_ocaml_pointer_down`/`pointer_up`/`pointer_enter`/`pointer_leave`:
  declared in `lui-core`'s ABI and implemented by upstream's bridge, but
  currently uncalled by `lui-gpui` (only `press_detail` and
  `context_menu_press` are) — unblocked automatically by the same fix.

## Screenshots

None — the window never opened, so there is nothing to capture. The linker
transcript above is the evidence. `docs/audit-shots/` is left empty on
purpose.
