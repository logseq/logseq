# Retired MyGo host source

The desktop entrypoints, packaging scripts and CI selection have moved to
`../nsh/`. Use `pnpm ui:nsh:build`, `pnpm ui:nsh` and `pnpm ui:nsh:package`.
There are no MyGo compatibility aliases. This directory is historical source
pending final source retirement; it is not imported by the active Rust host or
the maintained OCaml/Web/mobile builds. Do not remove the shared `../native/`
application and services when retiring this directory.

The former Go host loaded a pinned historical LUI Go module. It does not supply
NSH capabilities: the native PDF extension and resource/markup coverage must be
qualified on the active NSH route, independently of these historical files.
