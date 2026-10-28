# Logseq MyGo host

The OCaml application owns the model, update loop, subscriptions and LUI patch
stream. This host loads its shared library on a dedicated registered OS thread;
MyGo owns the native window, retained rendering and platform controls. It does
not launch the SDL renderer or a web view.

## Build and run

Use the OCaml dependencies installed by `deps/ui/scripts/install-opam-deps.sh`
and the Go version in `go.mod`. Linux also needs the GTK 3, fontconfig and graphics
development libraries used by the `mygo-host` CI job.

From the repository root:

```sh
opam exec -- dune build --root deps/db-worker bin/main.exe
pnpm ui:mygo:build
LOGSEQ_DB_WORKER_BIN="$PWD/deps/db-worker/_build/default/bin/main.exe" \
LOGSEQ_ROOT_DIR="/path/to/isolated/graphs" \
LOGSEQ_UI_STATE_DIR="/path/to/isolated/ui-state" \
pnpm ui:mygo
```

`build.sh` creates the OCaml shared library and Go executable under
`deps/ui/_build/mygo`, with fonts, icon data, theme images and dictionaries in
the sibling `deps/ui/_build/Resources` directory. The host resolves this resource
directory relative to its executable by default. `LOGSEQ_NATIVE_ASSET_DIR` may
override it with another complete resource directory; `deps/ui/assets` alone
does not contain theme images or dictionaries. `run.sh` builds before launching
and accepts the host's `-width`, `-height` and `-title` flags.

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

Native initialization requires exactly `{"paintsCaret":boolean}` as its JSON
payload, independent of the platform and host profile codes. MyGo sends
`{"paintsCaret":false}` before view construction: the shared OCaml editor owns
the caret overlay and uses measurements from committed retained glyph layout.
The 1-DIP input sink does not paint a caret. The SDL host sends
`{"paintsCaret":true}` because it already owns a glyph-layout caret painter.
Empty, missing, non-boolean, duplicate or additional capability fields fail
initialization rather than selecting an implicit painter. Native hosts and the
OCaml library must be rebuilt together; assets and persistence configuration
remain environment-owned and are not part of this payload.

The host routes document input synchronously through OCaml before native default
handling. Editor caret, selection and pointer queries use committed retained text
layout; the input sink does not maintain a second document. Theme snapshots feed
the backend's scoped color defaults. Native file dialogs, downloads, clipboard,
image decoding and shutdown saving use their real platform services.

Clipboard-write and external-URL OS failures return a `platform-error` event with
`{"operation":"open-url","message":"<system error>"}` rather than terminating
the window. The shared native application shows the actual error as a persistent
toast; this is not a success acknowledgement. Malformed payloads and unsupported
request names remain fatal protocol errors. Rebuild the native library and host
together. The desktop must provide its own real default applications; the host
does not substitute a browser launcher.

This is not a claim of desktop feature or visual parity. Full-window acceptance
is separate from builds and headless contract tests. Raw CSS classes are not a
stylesheet engine; unsupported markup/media and imperative operations are
reported explicitly. Relative assets require an explicit graph-owned resolver.
Ambiguous multiline atomic decorations do not fabricate source line ranges.
An unsupported request is never acknowledged as a successful operation.
