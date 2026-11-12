# Actual native editor input and selection follow-up

Status: native plain-block edit/save passed; the combined selection/drag flow
remains incomplete. The installed developer application was not replaced.

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
