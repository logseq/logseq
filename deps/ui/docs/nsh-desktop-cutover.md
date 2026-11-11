# Desktop cutover source audit

The source comparison is between the user's clean `refactor/lui` checkout at
`29dcb60fdc976dcda1da6ec984057bbf79d88612` and the NSH feature worktree. This is a
source audit and implementation record, not execution evidence.

## Active paths

- Repository desktop scripts select `deps/ui/nsh/{build,run}.sh` and
  `scripts/package-nsh.sh`. No MyGo compatibility alias remains.
- `refactor-lui.yml` retains its Web build/test job and uses immutable LUI
  `28fcb8d1595f0866ef3c1da448b3b2b6df650d7e`. Its old MyGo job is retired;
  dedicated NSH CI is independent. Electron releases retain their own pipeline.
- The native builder continues to build `native/native_embed.exe.o`, link its
  C bridge into the OCaml shared library and stage the native database worker.
  There is no Dune modification or target rename in this cutover.
- The native host registers exact exported schemas, uses the seven-argument
  Logseq bridge, and composes native block Editor/Input, CodeMirror Editor,
  markup, icons, theme, menu, clipboard, credential and DOM services.

## Source deletion boundaries

`native/dune` declares all native modules except `native_embed` in
`logseq_ui_native`, then the existing executable/object target and
`logseq_lui_bridge` foreign stubs. `native/services/dune` owns native platform,
resource and host services. These files are shared application code, not a
MyGo renderer. Their names and old telemetry strings do not authorize deletion.
The source-copy rules for shared views, PDF/assets, worker clients and SDK code
must remain. Web, Apple/iOS and Android paths must remain maintained.

The Go host directory is outside these Dune targets. Its four active shell
build/launch/package entrypoints are removed. Remaining Go source and historical
module dependencies are not imported by NSH; deleting that directory can be a
separate reviewed source retirement after the native feature/UX gates. Keep its
history for comparison without routing any active command or CI job through it.

## Actual gaps before a complete native release claim

- `native/pdf.ml` still emits `logseq-pdf` with page/scale/highlight events.
  NSH's raw validator rejects `pdf`; no native PDF/annotation factory is
  registered. The former MyGo host also explicitly reported that resource type
  unavailable, so the Go directory is not a working PDF dependency to preserve.
  Graph View exclusion does not exclude the PDF feature.
- `native/asset_dom.ml` now emits canonical Image URLs from OCaml-owned graph
  paths. Raw markdown `<img>` still sends its src directly to native Image.
  NSH's resource-context service stores graph context but its raw Image factory
  does not resolve graph-relative src or `data-asset-file`; old MyGo did. That
  resolver seam needs explicit retained graph-change qualification.
- Native raw `video`, `audio`, iframe, SVG families and select/options have
  explicit capability gaps. App-icons uses the native icon registry instead;
  handbook videos and arbitrary user markup must be qualified separately.
- Rust has a Windows platform entry, but current OCaml build/run scripts accept
  macOS/Linux only. Windows DLL linking, assets and package launch are not proven.
- Archive/signing code does not create a distribution release/update feed.
  Ad-hoc signing is not Developer ID signing or notarization. The archive's
  package version is separate from the currently placeholder Cargo/nsh.json
  versions and must be unified before configuring native updates.
- Existing main/body startup gates establish only the encountered startup path.
  Actual graph edits/reorder/IME, PDF/assets, installed native launch, accessibility,
  master-branch UX comparison and upgrade behavior need their own evidence.
