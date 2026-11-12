# Native editor text ownership and CmdK qualification

Status: the current actual AppKit keyboard/search scenario passed. Other
commands, scalar properties, hardware IME and all-platform UX remain open.

## Implementation and artifact

Application: `b14403b6fe61c4e0b9125165df125a2d53329fda`.
LUI runtime sources: `58b7d39df9d69305c75f5a88474788ea86085a96`;
local LUI changes through `10fdb06b` are documentation only.
NSH: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.

The complete release publisher and real application/worker startup passed in
`/tmp/logseq-printable-fixed-release.log`. Executable SHA-256:
`0dd1cb2ef181c6a69500551fbbfdd8a22d6ce02e470e15bebe1c668e996fe802`.
Release OCaml library SHA-256:
`860f1a76541d3ac3915095257f7f5c85bed5b7e2bee3dbefc057b672267a316c`.
No installed developer application was replaced.

## Reproduced input loss

The initial native CmdK scenario failed before opening the palette: five
contiguous native keys spelling `draft` produced `draf` in the native input,
OCaml source and database. A separate bounded, private metadata trace confirmed
plain `t`, modifier mask 0, was consumed by a priority-2 global key binding
while editor 530 was focused. Actual catalog sequences such as
`editor/toggle-number-list` (`t n`, `global-prevent-default`) were flattened
into strokes, then registered with `When::Always` in the custom editor.
OCaml receiving a prefix could not restore the already-consumed native text.

The correction keeps printable strokes without Cmd/Ctrl/Alt at `When::Auto`
while an editor owns focus. Modified commands retain their existing ownership;
palette and shortcut-capture modes are unchanged. It adds no input replay,
per-character waits, fake acknowledgement, buffer or new SDK API.

The catalog-backed Rust regression checks seven contiguous ASCII keys and
exact callback order. Separate public Headless composition/Unicode operations
check marked versus committed text and modified-command suppression/restoration.
It respects the actual editor-local ModK conduit; the raw Input fixture does
not pretend to implement that conduit. All 65 Rust library tests and strict
all-target Clippy pass. The actual native FFI assertions verify the source
catalog defaults/scopes. The native archive suite and 16,329 Web checks pass.

Historical failure logs are `/tmp/logseq-native-cmdk.log`,
`/tmp/logseq-native-cmdk-phase.log` and
`/tmp/logseq-native-cmdk-key-trace.log`. The trace had at most 48 metadata events
and was not merged into production. Its temporary Rust-module override was
restored by an owned cleanup trap.

## Actual native result

The ignored fixture is `deps/ui/_build/nsh-native-cmdk`. Its baseline
`cmdk.test.ts` SHA-256 is
`6013aa09bc035b44f2375f4766a86ef7b2aeaefca1a8c9efb8bcc847649984f8`.
It mounts the actual application with the release OCaml library, real private
worker and fresh contained graph/state/credentials. Only setup seeds data;
later observations of actual tree/model/database state are read-only.

Run from its directory:

```sh
PATH=/absolute/cargo/bin:$PATH RUSTUP_TOOLCHAIN=1.97.0 CARGO_BUILD_JOBS=2 \
  CARGO_PROFILE_DEV_STRIP=none CARGO_PROFILE_TEST_STRIP=none \
  CARGO_PROFILE_RELEASE_STRIP=none bash run.sh /absolute/nsh
```

`/tmp/logseq-native-cmdk-printable-fixed.log` passed one actual AppKit test in
24.9 seconds; private evidence is `logseq-native-cmdk.GAAglO` in the system
temporary directory. The unchanged scenario proves:

- Real block click, native select-all and contiguous typing preserve `draft`.
- Native ModK opens search and native typing reaches its focused input without
  an explicit focus helper or semantic activation.
- Search returns the real seeded B/C block UUIDs; native arrows and Enter
  select and navigate the actual result.
- Cancelling search preserves editor node 530 and its source/value; native `z`
  resumes that editor, producing `draftz`.
- Reopening restores the saved query with selection, so native typing replaces
  it rather than appending; clear/close/reopen leaves no backend diagnostic.

The test uses native driver-injected input, not physical hardware. It does not
qualify every command, accessibility, native IME, long-term performance, native
Windows/Linux input, package installation or SDK restart. Only fixture-owned
processes were cleaned and no display activation was requested.
