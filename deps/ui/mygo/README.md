# Logseq MyGo host

The OCaml application owns the model, update loop, subscriptions and LUI patch
stream. This host loads its shared library on a dedicated registered OS thread;
MyGo owns the native window, retained rendering and platform controls. It does
not launch the SDL renderer or a web view.

## Build and run

Use the OCaml dependencies installed by `deps/ui/scripts/install-opam-deps.sh`
and the Go version in `go.mod`. Follow `../README.md` for initial setup, including
the root `pnpm install` required by the OCaml theme generators. Linux also needs
the GTK 3, fontconfig and graphics development libraries used by the `mygo-host`
CI job. Neither platform uses SDL, tsdl or tgls. Builds enable CGO explicitly.

From the repository root:

```sh
pnpm ui:mygo:build
LOGSEQ_ROOT_DIR="/path/to/isolated/graphs" \
LOGSEQ_UI_STATE_DIR="/path/to/isolated/ui-state" \
pnpm ui:mygo
```

`build.sh` creates the OCaml shared library and Go executable under
`deps/ui/_build/mygo`, with fonts, icon data, theme images and dictionaries in
the sibling `deps/ui/_build/Resources` directory. The host resolves this resource
directory relative to its executable by default. The build also creates the
native worker and copies it to `Resources/logseq-db-worker`; the development
launcher sets `LOGSEQ_DB_WORKER_BIN` to that copy unless explicitly overridden.
`LOGSEQ_NATIVE_ASSET_DIR` may
override it with another complete resource directory; `deps/ui/assets` alone
does not contain theme images or dictionaries. `run.sh` builds before launching
and accepts the host's `-width`, `-height` and `-title` flags.

## Package

```sh
pnpm ui:mygo:package
```

Packages are written to `deps/ui/_build/packages/Logseq-MyGo-*`. macOS produces
a ZIP containing `Logseq MyGo.app`; Linux produces a tarball containing
`Logseq-MyGo/`. Both include the real Go executable, OCaml shared library,
native worker and complete resources. The launcher computes paths from its own
location, not the current directory or an OCaml synthetic executable name:

| Item | macOS bundle | Linux directory |
| --- | --- | --- |
| Launcher | `Contents/MacOS/Logseq` | `bin/logseq` |
| Go executable | `Contents/MacOS/logseq-mygo` | `bin/logseq-mygo` |
| OCaml library | `Contents/Resources/liblogseq_ui.dylib` | `Resources/liblogseq_ui.so` |
| Worker | `Contents/Resources/logseq-db-worker` | `Resources/logseq-db-worker` |
| Assets | `Contents/Resources/` | `Resources/` |

The launcher passes the absolute library path and sets resource/worker paths
unless overridden. Do not invoke the Go binary without `-library`.
macOS packaging requires `dylibbundler`, bundles non-system dynamic dependencies
in `Contents/Frameworks`, and ad-hoc signs the result. These artifacts are not
Developer-ID signed or notarized. Linux packages use the host's GTK/graphics,
libffi/GMP and C runtime libraries; they are not self-contained AppImages.
Build on the target OS/architecture. Windows packaging is not implemented.

The desktop release workflow's explicit MyGo target only uploads non-release
artifacts. Existing Electron releases, signing and updater metadata remain
separate; no Electron executable is packaged under the MyGo name.

The host registers every bundled Inter face before creating the window. Missing
or invalid fonts fail startup instead of depending on a system installation.

## Integration boundary

The adapter copies borrowed callbacks, preserves patch order, applies controlled
input acknowledgements synchronously, and forwards standard LUI events through
their typed ABI rather than disguising them as extension events. Geometry is
queried only after a committed frame. Focus and imperative scrolling use LUI's
production host services, including its node-lifetime and scroll-token checks.

Checkbox detail events preserve checked state and modifier bits through
`lui_ocaml_toggle_changed_detail`. Captured pointer move/cancel events use the
same pointer-detail ABI as down/up, and navigation accepts Enter, Space and
Escape as well as directional keys. Rebuild the native library and host
together: startup requires the detail exports and rejects an older library
instead of dropping events or stripping modifiers.

Native checkbox, radio, switch and slider snapshots expose an interactive
`input` target to delegated document selectors. These are flattened native
controls, not replicas of the Web label/input subtree. Block-selection capture
therefore excludes them before handling modifier gestures, without per-view
exceptions or bypassing document default prevention.

Native initialization requires exactly `{"paintsCaret":boolean}` as its JSON
payload, independent of the platform and host profile codes. MyGo sends
`{"paintsCaret":false}` before view construction: the shared OCaml editor owns
the caret overlay and uses measurements from committed retained glyph layout.
The 1-DIP input sink does not paint a caret.
Empty, missing, non-boolean, duplicate or additional capability fields fail
initialization rather than selecting an implicit painter. Native hosts and the
OCaml library must be rebuilt together; assets and persistence configuration
remain environment-owned and are not part of this payload.

The host routes document input synchronously through OCaml before native default
handling. Document callbacks publish their flushed patches with the prevention
result; the UI thread applies them before returning to native default handling.
An unmodified Escape belongs to a committed, live native menu or popover before
the enclosing document shortcut. The host leaves that key to MyGo without also
dispatching it to OCaml; after the popup is removed, the next Escape follows the
ordinary document route. Other keys and modified Escape keep the existing route.
Standard text controls and raw extension inputs share the host's imperative
value/selection queues, node-lifetime checks and committed-frame acknowledgements.
Editor caret, selection and pointer queries use committed retained text
layout; the input sink does not maintain a second document. Theme snapshots feed
the backend's scoped color defaults. Native file dialogs, downloads, clipboard,
image decoding and shutdown saving use their real platform services.

Raw `clipboard` and external `open-url` OS failures return a `platform-error`
event with the operation and actual system error, such as
`{"operation":"open-url","message":"<system error>"}`, rather than terminating
the window. That path shows a persistent error toast; it is not a write ACK.
Task-based `clipboard-write` instead requires exactly string `request-id` and
`text` fields and returns `clipboard-write-result` with the same ID and `ok:true`,
or `ok:false` plus a nonempty `error` string. It does not route refusal through
`platform-error` or promise a persistent toast. A refused write rejects the task
and preserves the source; a successful ACK still requires the shared cut
continuation's owner/source/selection/revision and lifecycle freshness checks.
Disposal cancels pending tasks and late results cannot revive them. Neither
clipboard reads nor enqueue completion acknowledge a write. Malformed payloads
and unsupported request names remain fatal protocol errors. Rebuild the native
library and host together. The desktop must provide its own real default
applications; the host does not substitute a browser launcher.

This is not a claim of desktop feature or visual parity. Full-window acceptance
is separate from builds and headless contract tests. Raw CSS classes are not a
stylesheet engine; unsupported markup/media and imperative operations are
reported explicitly. Relative assets require an explicit graph-owned resolver.
Ambiguous multiline atomic decorations do not fabricate source line ranges.
An unsupported request is never acknowledged as a successful operation.
