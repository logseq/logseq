# Logseq Apple desktop host

This macOS 14+ SwiftUI/AppKit executable hosts the native OCaml application
through the LUI Apple backend. PDF annotations use PDFKit; an isolated WebKit
widget renders the repository's bundled KaTeX and chemistry extension.

## Build

Use Xcode with Swift 6.2, the repository's OCaml switch, and the native worker
dependencies documented in `../README.md`. On a fresh switch, run the repository
dependency scripts before building:

```sh
(cd deps/db-worker && sh scripts/install-opam-deps.sh)
(cd deps/ui && sh scripts/install-opam-deps.sh)
bash deps/ui/apple/build.sh
```

The script builds `native/native_embed.exe.o`, links `liblogseq_ui.dylib`, builds
the native db-worker, stages resources, and builds the release Swift executable.
Outputs live under `deps/ui/_build/apple` and `deps/ui/_build/Resources`.
SwiftPM's LUI revision must match `scripts/install-opam-deps.sh`; the build fails
when the pins differ. `Package.resolved` records that exact revision.

## Run

```sh
bash deps/ui/apple/run.sh
```

For isolated validation, use disposable storage and preferences:

```sh
LOGSEQ_ROOT_DIR=/tmp/logseq-apple-test \
LOGSEQ_UI_STATE_DIR=/tmp/logseq-apple-ui \
bash deps/ui/apple/run.sh
```

The run script builds when the executable is absent. Re-run `build.sh` after
source changes. The window's close button and Quit command ask OCaml to save
before terminating; a failed save keeps the window open.

| Variable | Meaning / default |
| --- | --- |
| `LOGSEQ_ROOT_DIR` | Native graph databases, daemon registry and logs; `$HOME/logseq` |
| `LOGSEQ_UI_STATE_DIR` | Native UI preferences; `$HOME/Library/Application Support/logseq` |
| `LOGSEQ_GRAPHS_DIR` | Optional explicit graph directory, interpreted by the shared native core |
| `LOGSEQ_DB_WORKER_BIN` | Native worker executable; staged `Resources/logseq-db-worker` |
| `LOGSEQ_NATIVE_ASSET_DIR` | Resource root containing JSON assets, fonts, images and dictionaries |
| `LOGSEQ_APPLE_LIBRARY` | Development override for the OCaml dynamic library |
| `LUI_SOURCE` | Explicit OCaml Git source for validating a paired LUI revision |

To validate a framework commit before the shared default pin advances, change
the Swift package's revision to that full SHA, then install and build the same
source in the selected opam switch:

```sh
export LUI_SOURCE="git+https://github.com/logseq/lui.git#<full-commit-sha>"
bash deps/ui/scripts/install-opam-deps.sh
bash deps/ui/apple/build.sh
```

The build compares Swift's revision with the active opam Git pin, including
explicit `LUI_SOURCE` overrides. Without an override it also requires the shared
installer's default revision to match. It refuses mismatched schemas before
building either runtime.

Graph layout and formats belong to the shared OCaml runtime. The host does not
copy or migrate existing graphs. Relative resource paths are checked against
the graph's resource context. Keychain values use standard generic-password
items with the requested service/account and UTF-8 value, including existing
`Logseq E2EE` entries.

## Package

Install `dylibbundler`, then run:

```sh
bash deps/ui/apple/package.sh
```

This produces `deps/ui/_build/packages/Logseq.app` and an architecture/version
ZIP. The bundle includes the worker, assets and OCaml dynamic dependencies,
uses ad-hoc signing, and runs `codesign --verify --deep --strict`. Move or remove
the previous output before packaging again. Distribution signing and
notarization are separate release steps.

Set `LOGSEQ_DUMP=1` for layout diagnostics: document clicks log retained node
frames and mounted native scroll metrics without including document text.
For a disposable graph, set `LOGSEQ_APPLE_TRACE_PATCHES=/absolute/path/patches.jsonl`
to capture every raw patch callback in order. Each launch starts a new trace;
the trace includes document content and should only be shared after inspection.

## Architecture

`NativeRuntime` resolves the complete Logseq C ABI with `dlopen`, starts OCaml
with the macOS/SwiftUI profile, queues callbacks, and drains them on the main
actor. OCaml wakeups schedule `lui_ocaml_pump`; timers remain OCaml-owned. The
pinned bridge does not export the newer LUI runtime-clock API. Incremental JSON
batch arrays are applied in order. A refused runtime call requests an
authoritative resync and applies it with `applySnapshot`, preserving the backend
and restoring the active editor's focus. Refusal of recovery is fatal.
Batch JSON is passed to LUI without reserialization; decoded host metadata is
kept separately. Recovery retires incremental batches from the previous epoch.

`LUISwiftUIRoot` renders the retained tree. Typed backend events invoke the
specific `lui_ocaml_*` entry points. Raw Logseq elements, editor input and code
editors are registered as LUI Apple extensions with the same schema fingerprints
as OCaml. The rich editor is an input conduit: OCaml owns source, selection,
undo and composition state. UTF-16 selection offsets are converted to UTF-8
model offsets at the boundary.

`EditorGeometry` projects the actual committed text runs onto OCaml's source
spans, including hidden delimiters, atomic decorations and line-end landing
text. Measurements wait for a committed frame and reject retired nodes and
superseded source. The same geometry drives pointer selection and the native
IME candidate window. Host view registries are excluded from Observation to
avoid a layout/update feedback loop.

`PDFWorkspace` loads graph assets or remote PDFs, renders the OCaml annotation
model, and emits the existing PDF events for text/area highlights, colors,
deletion, reference links, navigation and persisted page/scale state. Area
snapshots are saved under the active graph's asset directory. `Math` renders
KaTeX in a nonpersistent WebKit instance with bundled fonts, `trust:false`,
network access blocked by CSP, and stale document-size reports discarded.

`PlatformServices` implements the request envelope `name + "\n" + payload`,
native menus, clipboard, URL opening, keychain, resource context, UI state,
theme snapshots, performance overlay, file dialogs, exports and basic node
measurement/controls. Document keyboard and pointer events are routed before
native controls; prevented events are consumed. File panels are asynchronous
window sheets and are cancelled during shutdown.

On macOS the shared chrome emits an ordinary fractional LUI Split, which the
Apple backend renders as `NavigationSplitView`. Its collapse and resize events
update OCaml's existing sidebar state and pixel-width preference. The other
native profiles keep their existing custom split handles. The AppKit window
uses a transparent full-size title bar with system traffic lights; the host
measures those controls and publishes their actual leading inset to OCaml.

`InputRouter` preserves document pointer/mouse ordering, button state,
default-prevention, focus loss and retained-node incarnation checks. Physical
key codes follow DOM naming independently of the active keyboard layout.
Native Edit-menu clipboard commands enter the same document handlers before
falling through to the first responder. Graph View and Page Graph View are
outside this host's current acceptance scope.

## Backend capabilities and validation

The paired LUI package exposes icon registration, image dimensions, snapshots
and committed text geometry. Bundled Tabler icons and custom `app-icons` use
the public icon registry. Images load asynchronously from graph assets,
bundled resources, HTTP(S) or base64 data URIs, then answer pending dimension
queries. Audio/video use AVKit; iframe embeds use an isolated WKWebView with
native external-link handling. Raw tables use a horizontally scrollable
SwiftUI grid. Scroll requests use the public retained-node scroll APIs and
wait for their native viewport probes through frame reports. Requests keep
absolute positioning before a later reveal and discard recycled node targets.
Unsupported presentation mutations and raw SVG/canvas widgets return a
structured `platform-error` and log `UNSUPPORTED`.

Build and package validation do not establish interaction parity. Acceptance
requires the real macOS host with isolated graph/UI state, including journal
editing, commands, properties, non-edit selection, dragging, shortcuts, PDF,
math, sidebar collapse and clean save/quit. Graph View and Page Graph View are
excluded.
