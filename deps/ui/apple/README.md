# Logseq Apple desktop host

This macOS 14+ SwiftUI/AppKit executable hosts the native OCaml application
through the LUI Apple backend. It does not embed a web view or a Go runtime.

## Build

Use Xcode with Swift 6.2, the repository's OCaml switch, and the native worker
dependencies documented in `../README.md`. On a fresh switch, run the repository
dependency scripts before building:

```sh
(cd deps/db-worker && sh scripts/install-opam-deps.sh)
(cd deps/ui && sh scripts/install-opam-deps.sh)
opam install uucp
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

## Architecture

`NativeRuntime` resolves the complete Logseq C ABI with `dlopen`, starts OCaml
with the macOS/SwiftUI profile, queues callbacks, and drains them on the main
actor. OCaml wakeups schedule `lui_ocaml_pump`; timers remain OCaml-owned. The
pinned bridge does not export the newer LUI runtime-clock API. Incremental JSON
batch arrays are applied in order. A refused runtime call requests an
authoritative resync and rebuilds the retained backend from that snapshot (the
pinned package predates `applySnapshot`). Refusal of recovery is fatal.
Batch JSON is passed to LUI without reserialization; decoded host metadata is
kept separately. Recovery retires incremental batches from the previous epoch.

`LUISwiftUIRoot` renders the retained tree. Typed backend events invoke the
specific `lui_ocaml_*` entry points. Raw Logseq elements, editor input and code
editors are registered as LUI Apple extensions with the same schema fingerprints
as OCaml. The rich editor is an input conduit: OCaml owns source, selection,
undo and composition state. UTF-16 selection offsets are converted to UTF-8
model offsets at the boundary.

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

## Remaining backend capabilities

The exact pinned LUI package does not expose dynamic SVG icon registration or
committed per-run glyph geometry. These operations return a structured
`platform-error` and log `UNSUPPORTED`: app-icons; caret-rect; selection-rects;
offset-at; line-ranges; scroll-height; and rich DOM presentation mutations
without a native control. Media/embedded SVG raw-element rendering also reports
unsupported capabilities. Natural image dimensions currently require a mounted
native image view. Raw HTML extensions render native containers and controls;
they do not implement a browser's entire HTML/CSS layout engine.

Accurate geometry must come from the text actually drawn by the backend;
reconstructing a second TextKit layout from source would produce incorrect
caret and pointer positions. These remaining operations need the coordinated
LUI Apple APIs before this host has full editing/rendering parity.
