# Current native icon and emoji picker repetition

Status: actual macOS public-driver wheel/reopen regression passed. This is not
a new memory, physical-device, frame-time or all-platform qualification.

## Revision and artifact

Application production revision: `c5bd59e23afa7c14afb9b539a20fd54350bda8d1`.
LUI: `58b7d39df9d69305c75f5a88474788ea86085a96`.
NSH: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.

The actual release OCaml library has SHA-256
`749ca82c0a3223e24e0e57b216c1f8ff54f5468c404875a44b5d4c7d99430309`.
The complete release build and real startup preflight passed before this run.
The private mixed harness mounts the actual application root and this library;
it does not substitute a picker-only component or reduce the source dataset.

## Native scenario

The separate ignored fixture is
`deps/ui/_build/nsh-native-picker-wheel/latest-repeat.test.ts`, SHA-256
`6d48315670368ae638392a46b10be6e4d3bbb8c5481433c4e00d5036f641c11d`.
Its baseline fixture remains unchanged. Run from the fixture directory:

```sh
PATH=/absolute/cargo/bin:$PATH RUSTUP_TOOLCHAIN=1.97.0 CARGO_BUILD_JOBS=2 \
  CARGO_PROFILE_DEV_STRIP=none CARGO_PROFILE_TEST_STRIP=none \
  CARGO_PROFILE_RELEASE_STRIP=none PICKER_MONITOR=0 \
  PICKER_TEST_FILE=/absolute/logseq/deps/ui/_build/nsh-native-picker-wheel/latest-repeat.test.ts \
  bash run.sh /absolute/nsh
```

The public AppKit driver performs the real Journal title hover and Add icon
press. It then alternates Emojis and Icons twice. Each pass reads the full source
count from the UI, wheels past the complete source end, checks the exact last
item, wheels back and checks the first item returns. The source counts were
1,870 Emoji and 6,200 Icon entries; terminal items were Wales Flag and Zzz Off.
The test verifies the first item retires offscreen, the last item retires on
return, fewer than 512 native buttons exist at each checkpoint, and no backend
diagnostic or full request queue is displayed. Native Escape closes the picker
and removes its cells; a fresh Add icon press reopens its first Emoji cell.

`/tmp/logseq-picker-latest-repeat.log` passed one test in 1 minute 43 seconds.
Private evidence remains under `logseq-picker-wheel.nNqN9r` in the system
temporary directory. Semantic monitoring was disabled. No screenshots, forced
collection, semantic scrolling or polling measurements were used in this run.
Only fixture-owned processes/state were cleaned; the developer's installed
frontend and worker remained running.

## Limits

This verifies native driver-injected wheel scrolling, complete list endpoints,
bounded mounted controls and popup disposal/reopening. The button bound is a
UI test witness, not an allocation or physical-footprint measurement. Earlier
release measurements around 130 MiB apply to their recorded revisions; this
test does not requalify those memory numbers or prove absence of a long-term
leak. Physical input, dark/light pixel parity, accessibility, frame latency and
Windows/Linux native scrolling remain separate acceptance gates.
