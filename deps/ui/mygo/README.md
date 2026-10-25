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
LOGSEQ_NATIVE_ASSET_DIR="$PWD/deps/ui/assets" \
LOGSEQ_DB_WORKER_BIN="$PWD/deps/db-worker/_build/default/bin/main.exe" \
LOGSEQ_ROOT_DIR="/path/to/isolated/graphs" \
LOGSEQ_UI_STATE_DIR="/path/to/isolated/ui-state" \
pnpm ui:mygo
```

`build.sh` creates the OCaml shared library and Go executable under
`deps/ui/_build/mygo`. `run.sh` builds before launching and accepts the host's
`-width`, `-height` and `-title` flags.

## Integration boundary

The adapter copies borrowed callbacks, preserves patch order, applies controlled
input acknowledgements synchronously, and forwards standard LUI events through
their typed ABI rather than disguising them as extension events. Geometry is
queried only after a committed frame. Focus and imperative scrolling use LUI's
production host services, including its node-lifetime and scroll-token checks.

This is an initial host integration, not desktop feature or visual parity.
Known gaps are reported explicitly: document/window event capture, editor
shaped-layout measurements and hit testing, application CSS-variable/theme
cascade, and unsupported raw markup/media. The editor source and selection stay
in OCaml; the input sink must not invent geometry or maintain a second document.
File, image, clipboard and shell services use public platform APIs where wired;
an unsupported request is not acknowledged as a successful operation.
