# Actual native editor input and selection follow-up

Status: the current native plain-block edit/save/selection/drag flow passed.
The earlier failures below remain historical evidence. Other editor/module
acceptance gates remain open. The installed application was not replaced.

## Current complete block-flow follow-up

The unchanged original AppKit scenario passed at application production revision
`98fd20aa6d62a11aa06fc026c9fca12063488af4`, with LUI production sources equal
to `58b7d39df9d69305c75f5a88474788ea86085a96` and NSH `adc186db`.
Local LUI commits through `10fdb06b` change documentation only relative to that
runtime revision. The complete fresh release publisher and actual startup gate
passed in `/tmp/logseq-selection-complete-release.log`.

The Rust executable SHA-256 is
`d01f96a5542b918d74d3fb29bd92e87cd05cd5dc72cd8a697f91f86d7d1923fc`;
the release OCaml library SHA-256 is
`8a34ea0c948ffd5a965ddae93ac79b997c0ec3fdf3f1fa8379213c7e0775a467`.
`/tmp/logseq-selection-routed-native-block-all.log` passed one test in 16.7
seconds, using private `logseq-native-block.sPsub9`. It includes native click,
Cmd+A, replacement input, durable save, Shift range selection, two Escape
presses clearing action bar and selection, persisted sibling reorder and
outside-window cancellation. The application remained inactive and its window
non-key. It uses native driver input, not semantic activation or physical keys.

The native keymap now admits Escape only for a nonediting block selection.
Focused inputs keep ownership and topmost popover Cancel takes precedence;
clearing selection removes the binding. Native FFI checks and 64 release Rust
tests plus strict all-target Clippy passed. The shared selection changes pass
16,329 Web checks and contract tests. The separate SDK cancel-only overlay
retirement defect still affects other providers and is explicitly unresolved
in `../2026-11-12/nsh-continuous-ux-review.md`; the actual selection popover uses
both Cancel and PressOutside and does not take that SDK path.

## Exact implementation and build

- Application: `c5bd59e23afa7c14afb9b539a20fd54350bda8d1`.
- LUI: `58b7d39df9d69305c75f5a88474788ea86085a96`.
- NSH: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.
- Actual release executable SHA-256:
  `aefd0facd7055dd785f139aa09f75301ed20bdede99adc2c7d427c0ec65c00b2`.
- Actual release OCaml library SHA-256:
  `749ca82c0a3223e24e0e57b216c1f8ff54f5468c404875a44b5d4c7d99430309`.

The complete release publisher passed, including static-style checking and the
real application/worker startup preflight, in
`/tmp/logseq-alt-current-release.log`. The publisher recorded release for both
Rust and Dune profiles. This is build/startup evidence, not an all-module UX gate.

## Defect and correction

The native promise implementation can run continuations inline. Previously
`Editor_actions.run_structure` attached continuations before storing its exact
operation owner. An already-resolved plain-title operation could therefore
complete before it owned the input gate, then leave that gate pending forever.
Native key and insert events arrived successfully but remained queued.

The correction publishes a stable pending completion and exact owner before
observing the operation. Its portable boolean notification adopts the original
completion, preserving Melange's opaque rejection without casts or a scheduler
change. Native FFI regressions exercise immediate success/rejection, stale and
nested owners, and ordered mounted-editor queue/drain with retained identity.
Web checks pass with the same source: 16,312 checks and zero failures.

## Actual AppKit result

The ignored fixture is `deps/ui/_build/nsh-native-block-interaction`. It uses
the pinned public native driver against the real Logseq application root,
release OCaml library, real private DB worker and fresh contained credentials,
graph and state. Initial siblings are seeded once through production worker
operations. Later domain/tree observations are read-only. No semantic edit,
test-only focus, fake input acknowledgement or window activation is used.

Run from that fixture directory:

```sh
PATH=/absolute/cargo/bin:$PATH RUSTUP_TOOLCHAIN=1.97.0 CARGO_BUILD_JOBS=2 \
  CARGO_PROFILE_DEV_STRIP=none CARGO_PROFILE_TEST_STRIP=none \
  CARGO_PROFILE_RELEASE_STRIP=none BLOCK_CASE=edit \
  bash run.sh /absolute/nsh
```

`/tmp/logseq-current-native-block-edit.log` passed one actual AppKit test in
7.1 seconds. Evidence remains private under
`logseq-native-block.1bqSjl` in the system temporary directory. A native content
press opened editor 530. Native Cmd+A changed its anchor/caret to 0/23; native
`x` replaced the source, incremented its source version to 1 and retained the
same editor node. Escape exited editing and a real worker query proved the
durable block title was `x`. The application stayed inactive, window visible
and non-key. The fixture cleaned only its own process group and worker.

The preceding combined run, `/tmp/logseq-current-native-block-all.log`, proved
the same edit/save and native Shift+Down expansion to two blocks, but failed
when repeated Escape did not clear selection and its action bar. That failure
is retained, not reclassified as a passing whole-flow gate. Source inspection
found that the controlled selection popover lacked its existing `on_dismiss`
callback, and that a nonediting Escape command lacked the direct-key cleanup
branch. The popover gap is the stronger explanation for the default native
binding; both corrections require separate verification. Earlier actual
drag qualification passed inside reordering and outside cancellation, but this
combined run did not reach those steps. A subsequent independent current-artifact
`BLOCK_CASE=drag` run passed in 9.0 seconds:
`/tmp/logseq-current-native-block-drag.log`, private `logseq-native-block.1p8Yza`.
It proved persisted sibling reordering and outside-window cancellation without
an unintended editor or data move. This does not remove the combined flow's
selection failure or qualify held-Alt reference insertion.

## Test-tool limitation and remaining gates

The first two mixed-harness attempts failed before UI startup with custom
Cargo's `E0463` loading a QuickJS proc-macro variant. The established explicit
`DEV/TEST/RELEASE_STRIP=none` profile selected a previously successful variant
and the describe build and real native run passed. This does not establish the
underlying custom Cargo artifact-routing cause. No cache deletion, target
override, warning suppression or SDK change was used.

These tests qualify public-driver injected AppKit input, not physical hardware,
IME/composition, accessibility, selection reversal, all commands, rich editor
formats, cross-platform native input or the complete UX acceptance matrix.
Installation and SDK restart qualification remain disabled/pending.

## Real-worker reference-drop durability

The source-only event regression was extended by fixture commits `27a1a75bca`
and `9a6befbd5a`, using actual native application archives with production
selection correction `b2a6e0b62d`. The complete contained worker driver passed:
`/tmp/logseq-durable-reference-worker-tests.log`. No OCaml compiler warning was
emitted; the existing findlib dependency warnings remain visible in that log.

Alongside the existing protocol and two-worker rollback modes, the new outliner
mode mounts actual keyed rows/editor and sends canonical native down/move/up
events through `Native_embed` and its document controller. All seeding, reads
and writes use the real session-carrying `Worker_client`. It checks reference
UUID/title values, after-target, before-first-target and append-child ordering,
unchanged source/child parents, dirty save before insertion and editor ownership
after the actual page refresh. It then disposes the view and proves the data
survives exact owned-worker stop/reopen. Worker SHA-256 remains
`5404762a8ccd9b5987c0ab00fc8455000e428f0ac652a5e55166b20ec0ba1b50`;
the outliner worker instances were `42ca3c67-832f-4c4a-a382-e173ceb3ff52` and
`fa0568ce-787b-4da8-a64b-1930509cf660`.

The resulting JSON reports `stage2Qualified`, `coordinatorQualified` and
`outlinerDropQualified` true, and `installerEnabled` false. This fixture uses
authored bounded row geometry and a recording native backend; host commands
are recorded without fabricated replies. It qualifies the controller-to-real-DB
path and restart durability, not NSH hit testing, physical held-Alt, focus or
the whole-application updater. The installed developer session stayed running.
