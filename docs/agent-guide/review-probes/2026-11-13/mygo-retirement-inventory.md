# MyGo retirement inventory

This is a source-only audit of App `e32164a56703d5d047fee062d6540dd785198ba2`
and LUI `24a4c494ee926a89a2999508481e2cff9607a9df`. It does not execute builds,
tests, native applications or dependency resolution. `spec-dev-tool` is not
available in this environment, so this review note records the bounded audit.

The effective desktop entrypoints use NSH. The old Go implementation remains
tracked, intentionally retained until the full native acceptance gates and the
user's temporary retention request are resolved. It is **not** a dependency
loaded by the current NSH runtime. Effective cutover, final source retirement
and delivery to `refactor/lui` are separate acceptance items.

## Effective build, launch and package graph

| Entry | Actual source route | MyGo relationship |
| --- | --- | --- |
| Root desktop commands | `package.json` lines 81–83 select `deps/ui/nsh/build.sh`, `deps/ui/nsh/run.sh` and `deps/ui/scripts/package-nsh.sh`. | No old Go command alias. |
| macOS/Linux compilation | `nsh/build.sh` builds the existing native OCaml object/C bridge, the actual `nsh-app-logseq` Cargo executable and the native DB worker; publication qualifies the staged executable/library/resources together. | No Go compiler or module input. |
| Rust dependencies | `deps/ui/nsh/Cargo.toml` selects pinned `logseq/nsh` crates, `lui-nsh` and the App's platform libraries. | No Go/MyGo renderer or runtime library. |
| Build receipt source ownership | `nsh/build_publication.mjs` `sourcePaths` explicitly enumerates shared UI/native/contract/tool/assets, actual NSH sources, worker sources and LUI sources/Cargo graph. | `deps/ui/mygo` is outside these scopes. |
| Native launch | `nsh/run.sh` checks the receipt, selects the staged OCaml library/Resources/worker and executes the returned `logseq-nsh`. `scripts/launch-nsh.sh` executes the installed same owner. | Does not call the retained Go entry. |
| Startup negotiation | App `nsh/src/lib.rs` freezes extension profile `host="nsh"`; LUI `platform/nsh/src/runtime.rs` supplies `NSH_HOST_CODE=6`. App `native_embed.ml` maps 6 to `NshHost`. | No MyGo host negotiation or adoption. |
| macOS/Linux package | `scripts/package-nsh.sh` and `package-nsh.mjs` package the qualified host, covered OCaml library and receipt-owned resources; launcher is `launch-nsh.sh`. | No legacy directory traversal or Go host copy. |
| Windows package | `nsh/build_windows.py` / `build_windows_dll.py` build the actual OCaml DLL and Rust App; `package_windows.py` stages that qualified App with its existing installer admission. | No Go build/package stage. |
| Maintained CI | `nsh-desktop.yml` and `nsh-windows.yml` build, test and package those actual NSH paths. `refactor-lui.yml` retains the Web build/tests. | No active MyGo job. Electron retains its independent pipeline. |

These are traced owners and invocation paths, rather than a repository-wide
word count. An old file's name or a historical comment cannot establish that a
runtime loads it. This audit does not independently prove the bytes already
installed on a user's machine or substitute for package/loaded-library receipts.

## Retained implementation and dependencies

The following tracked files form the separate `deps/ui/mygo/` retirement unit.
Every name below is relative to that directory:

| Responsibility | Exact files |
| --- | --- |
| Entrypoint and documentation | `main.go`, `README.md` |
| Module ownership | `go.mod`, `go.sum` |
| Runtime/host/window | `runtime.go`, `platform.go`, `viewport.go`, `app_menu.go`, `app_icons.go` |
| Native services | `clipboard.go`, `document_events.go`, `dom_mutations.go`, `editor_geometry.go`, `platform_controls.go`, `platform_controls_files.go`, `platform_performance.go`, `platform_secrets.go` |
| Extension factories | `extensions.go`, `extension_editor.go`, `extension_codemirror.go`, `extension_elements.go` |
| Resources/theme | `resource_graph.go`, `resource_renderer.go`, `resource_source.go`, `resource_svg.go`, `theme_snapshot.go`, `theme_style.go` |
| Behavioral tests | `clipboard_test.go`, `document_events_test.go`, `editor_input_test.go`, `extension_codemirror_test.go`, `extension_elements_test.go`, `platform_controls_test.go`, `platform_files_test.go`, `resource_graph_test.go`, `resource_renderer_test.go`, `resource_source_test.go`, `resource_svg_test.go`, `theme_snapshot_test.go`, `viewport_test.go` |

`main.go` remains an independently callable Go program requiring an explicit
`-library` argument. Removing its former convenience scripts did not delete
that program. No claim that it still works against the current library is made.
Its runtime uses legacy Generic host code 0 and does not make the NSH runner
load Go. Keep old reserved host code 5 unrepurposed.

Its exact module declaration is `github.com/logseq/logseq/deps/ui/mygo`, with
Go `1.27.3`. Direct dependencies are `github.com/ebitengine/purego v0.11.1`,
`github.com/egoist/mygo v0.6.4`, and
`github.com/logseq/lui/platform/mygo v0.0.0-20261108034101-2475de1e9fec`.
The MyGo replacement pins
`github.com/logseq/mygo v0.0.0-20261108090031-7fe2886ceea7`.
`go.sum` belongs to this module. Neither root pnpm entrypoints nor the actual
NSH Cargo graph imports it; removing the module is a final source-retirement
step, not a fix for a current NSH Go-memory allocation.

## References outside the Go directory

| Source | Classification and ownership |
| --- | --- |
| `deps/ui/native/host_metrics.ml` | Compiled shared native module with legacy Go sample fields and developer-only MyGo/OCaml panel text. It does not link a Go runtime. |
| `deps/ui/native/native_embed.ml` `require_go_metrics`, `native-performance-toggle`, `mygo-performance` | Retained legacy incoming event branches. They explicitly refuse Go presentation metrics on `NshHost`; no actual NSH Rust service emits those events. Do not remove shared dispatch/ABI code wholesale. |
| `deps/ui/native/chrome.ml` `performance_panel` / `shell_contents` | Mounts the legacy panel only on the non-NSH path. NSH has its separate native performance surface. Audit maintained non-NSH callers before retiring this compiled panel. |
| `deps/ui/native/render_libs.ml` introductory MyGo highlighter comment | Stale explanatory text, not an active Go import or loader. The actual native code factory is the registered Rust CodeMirror/Editor factory. |
| `deps/ui/docs/nsh-desktop-cutover.md` | Earlier source-audit snapshot explicitly defers Go directory retirement. Its older pins and feature-gap inventory are historical evidence, not a current qualification result. |
| `scripts/native_profile_run.py` and its report/tests | Generic explicit-executable/worker profiling tools using the older SDL replay input contract. Not selected by desktop launch/package scripts and not a Go dependency. Do not delete merely because they previously measured Go. |
| Historical docs and ignored `_build` evidence | May retain MyGo names and old results as dated records. They are not shipping runtime or dependency input. Do not rewrite evidence into a false NSH result or commit generated caches. |

## Prerequisites and minimal eventual retirement

The authoritative LUI plan `docs/agent-guide/006-nsh-desktop-migration.md`
requires the actual Logseq cutover and UX acceptance before declaring the goal
complete; Stage 7 explicitly includes final implementation/dependency retirement.
The user's temporary request to retain MyGo remains respected here.

Once the actual native feature/UX/performance/delivery gates and retention
condition are satisfied, the smallest reviewed retirement is the isolated
`deps/ui/mygo/` unit above, including its module lock and applicable old tests.
First map relevant behavioral cases to actual NSH regressions; deleting tests
does not qualify their replacement. Then separately review legacy Go-specific
telemetry dispatch/panel references against Generic/Apple/mobile callers and
record any removed wire/event behavior in `docs/api-migrations.md`. Update live
instructions to state the completed source retirement while preserving dated
reports. No Dune edit is needed to retire the separate Go directory.

Do **not** delete `deps/ui/native/`, `native/services/`, `native/dune` or its
source-copy rules. The native OCaml application, contracts, worker clients,
C bridge, assets/PDF/editor sources and host services are shared application
code. The native library/object/C bridge remain required by the NSH runner.
The maintained LUI Apple Swift package, Android Gradle/JNI backend, Web/Melange
backend and their build/test tooling remain excluded from retirement, including
integration contracts used by `logseq/mobile` and `logseq/logseq_journal`.
Electron is also not silently retired by this NSH source task.

## Branch delivery boundary

At audit time the App worktree is `feat/nsh-host` at the exact App revision
above. Local `refs/heads/refactor/lui` and the locally stored
`refs/remotes/origin/refactor/lui` both resolve to
`29dcb60fdc976dcda1da6ec984057bbf79d88612`. No fetch or remote verification was
performed, so this is evidence about local refs only. The NSH feature commits,
qualified immutable LUI pin and remaining retirement still require review and
delivery onto the actual requested branch. A local release artifact or green
library suite is not proof that that base branch has been updated. UX acceptance
against frozen master `29fd2edd015e12963742b985ce6d2311c074e09b` remains a separate
required product gate; this does not request an automatic merge of master.
