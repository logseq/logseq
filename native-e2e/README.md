# Real native desktop E2E

This is an OCaml test executable for `deps/ui/ocaml_host/logseq_native.exe`
(SDL/Metal) and `deps/db-worker/bin/main.exe`. It is not Electron, SwiftUI,
gpui, a browser adapter, or a reducer simulation.

## Milestone and coverage

The scaffold has one real boot/create/edit/persistence smoke. The 249 upstream
registrations in 30 `ocaml-e2e/test/test_*.ml` files are **pending ports**, not
passing native coverage. `upstream.json` is an inventory/ownership contract,
not execution evidence. Three `test_graph.ml` cases are pure helper contracts;
they must remain `Suite.Helper`, not fabricated desktop scenarios.

`inventory.exe` uses OCaml compiler-libs `Parse.implementation` and AST traversal.
It identifies literal `Fest.Promise.test` registrations and genuine top-level
wrappers forwarding a name to that function. The editor's `t` is a wrapper;
outliner's `t title children = Node (...)` is not. Unknown dynamic/indirect
registrations and shadowed wrappers fail rather than silently disappearing.
All upstream files must belong exactly once to these five groups:

| Group | Exclusive source/test modules |
| --- | --- |
| editor_outliner | editor_basic, outliner_basic, undo_redo, reference_basic, cmdk_scroll_basic |
| properties_tags | bidirectional_properties, block_property_basic, property_basic, property_config_basic, property_scoped_choices, tag_basic |
| commands_views | commands_basic, query_builder_basic, query_results_basic, view_basic, library_basic, flashcards_basic |
| navigation | graph, graph_navigation_basic, left_sidebar_basic, multi_tabs, right_sidebar |
| assets_rtc | assets_basic, import_basic, export_basic, plugins_basic, plugins_marketplace, rtc_basic, rtc_extra, rtc_extra_part2 |

For each basename, the source is `ocaml-e2e/test/test_<name>.ml` and the exclusively
owned additive destination is `native-e2e/tests/test_<name>.ml`. The manifest
contains the exact names, IDs, source locations and target paths.

## macOS bootstrap

A logged-in graphical macOS desktop and Xcode Command Line Tools are required.
The current host's Metal/AppKit build is macOS-specific; this script does not
pretend to validate Linux/Windows host behavior.

Install tooling first, for example:

```sh
brew install opam node pnpm cmake pkgconf freetype libpng jpeg-turbo sqlite3 gmp
opam init --bare --no-setup -y
./native-e2e/bootstrap.sh
./native-e2e/run.sh --filter native-boot-create-edit-persist-smoke
```

`bootstrap.sh` creates/uses switch 5.5.0 (`OPAMSWITCH` may select verified 5.5.1),
uses both documented `install-opam-deps.sh` installers, installs `eio_posix` and
`tsdl`, installs JS dependencies including exact `@playwright/test` 1.58.2,
builds host/daemon/client and checks the inventory. The UI install is explicitly
`pnpm --dir deps/ui install --ignore-workspace`; root workspace installation
alone does not install the UI's `melange.js` runtime dependencies.

The UI installer pins `lui#feat/ml-backend` and
`ocaml-signal#02e18cdc5e0ad672aa223f638eaa3ba52fc9421e`, then updates/upgrades
them; an already installed stale LUI package is insufficient.

**Genuine SDL2 is mandatory.** Homebrew's current `sdl2` may resolve to
`sdl2-compat`. Its SDL2-to-SDL3 event conversion rejects synthetic SDL2 text
events; an independent OCaml `Sdl.push_event TEXTINPUT` probe crashed there.
Bootstrap builds official SDL2 2.32.10 from a SHA-256-checked tarball at
`$HOME/.local/sdl2-2.32.10`. Override with `LOGSEQ_NATIVE_SDL_PREFIX`.
The client supplies `DYLD_LIBRARY_PATH` directly to the host process so SIP
shell/env launchers cannot accidentally erase the runtime library selection.
This fixes the dependency, not the native input semantics.

## Adding suites without registry conflicts

Create only your group's owned `tests/test_<name>.ml`. Each exports:

```ocaml
let tests =
  [ Suite.test ~covers:["ocaml-e2e/test/test_x.ml::exact-upstream-name"]
      "exact-upstream-name" (fun ctx ->
        Suite.with_app ctx (fun app ->
          (* Operate the real UI; assert its stable contract. *)
          Client.press app "Mod+k";
          ignore (Client.wait_for app ".cp__cmdk-search-input");
          Suite.check ctx "Search input has native focus"
            (Client.focused app <> 0))) ]
```

`discover.exe` automatically discovers sorted `tests/test_*.ml` modules at build
time. Do not edit `dune`, `discover.ml` or a central registry to add cases.
Do not claim coverage for unrelated behavior. Inventory drift requires an
explicit reviewed `inventory.exe --write <repo>` regeneration.

```sh
./native-e2e/run.sh --group navigation
./native-e2e/run.sh --filter exact-upstream-name
./native-e2e/run.sh --inventory-only
./native-e2e/run.sh --coverage --inventory-only
./native-e2e/run.sh --coverage
```

The strict `--coverage` gate exits 2 for any missing mapping. Duplicate IDs,
unknown IDs, wrong ownership, wrong helper/desktop contract and unmapped tests
(except the scaffold smoke) fail in all modes. Runtime fails tests with zero
executed assertions or desktop claims with zero SDL input. A complete parity
claim requires **both** complete mapping and passing runtime, not inventory-only.
These guards cannot prove semantic equivalence of assertions: review each port.

## OCaml client/fixture contract

`client.mli` and `suite.mli` are the public interfaces. `Suite.with_app` creates
and starts a real app, captures failure evidence, and closes it in `Fun.protect`.
Nested calls create simultaneous clients with separate daemon roots/settings.
`Client.create/start/close` is the lower-level lifecycle interface; always protect
`close`. Optional `root` shares an explicitly caller-owned graph root for RTC or
multi-client scenarios; the caller must remove that external root after all
clients close. Settings and socket directories remain private per app.

- Inputs: `press` (e.g. `Mod+k`, `Enter`, `Escape`, `Down`/`ArrowDown`), raw SDL
  scancode `key`, UTF-8 `text`, `fill`, `move`, `button`, `click_at`, semantic
  `click`, bounded-step `drag`, `wheel`. All event actions queue `Sdl.Event`
  through `Sdl.push_event`; the existing host loop drains and dispatches them.
  Responses acknowledge queueing, **not** completion; poll a state transition.
  `text` chunks on UTF-8 boundaries within SDL's 31-byte TEXTINPUT limit.
- Coordinates: selectors return current retained nodes with SDL-client rects
  derived from production layout/scroll offsets/display scale. `click` rejects
  zero-area/off-viewport targets. Scroll before clicking; never add guessed
  screen/window offsets. `status` supplies viewport, scale, renderer and focus.
- Readback: `snapshot`, `query`, `attr`, raw `text_content` (retained subtree
  content), `rect`, `focused`. `wait_for ~text` does substring matching with
  collapsed ASCII/NBSP whitespace, like browser visible-text locators; raw
  persistence/title equality is not normalized. Native editor extension is
  `editor.ed-input`, **not** a browser textarea. Use `.block-editor` for mounted
  edit mode, `data-block-title`/daemon readback for editor content; host `shadow`
  belongs to standard LUI text controls, not the editor extension.
- Oracle: `q ?inputs` sends the real `[repo, [query, inputs...]]` Transit contract;
  `read` allows only enumerated read-only worker endpoints. `invoke_fixture`
  is explicit arbitrary worker setup transport; it must never replace the UI
  operation under test. Encoding reuses project `Wire` and native `Transit`
  verbatim; no cache-string or storage-format transformations.
- SDK: `sdk_call ?namespace` uses closed `Api | Ui | Utils | Assets | Experiments
  | Debug` namespaces and invokes the same production `Sdk_api` registry as
  `window.logseq.api`/`sdk.*`, with at most four JSON arguments and async polling.
  It is for original API-specific cases, fixtures and oracles, not reducer
  dispatch or a substitute for UI interaction. Unknown methods/namespaces fail.
  JSON is transport only; the client, runner, fixtures and cases are OCaml.
- Lifecycle: `reload` restarts only the host with the same settings/daemon;
  `restart ()` restarts host and owned daemon, preserving the isolated disk graph.
  Cleanup verifies daemon executable/root ownership before sending signals,
  then removes socket/private temp directories. No user graph is touched.
- Clipboard: `clipboard_read/write` use the production SDL/OS clipboard.
  Restore previous clipboard content in a protected fixture when a case uses it.
- Polling: `poll ?timeout` has a bounded deadline and short poll interval;
  `wait_for`/SDK use 15 seconds, socket requests 8 seconds, boot/daemon 45 seconds,
  HTTP 15 seconds, shutdown 5 seconds before escalation. No readiness sleeps.
  Runner enforces a 120-second per-case deadline (`--timeout` overrides it).

## Evidence and real limitations

Results, protocol/host logs and screenshots are under ignored `artifacts/run-*`.
Failures retain the semantic tree, status, backtrace, daemon logs and a full
desktop screenshot (or an explicit screenshot error). Graph/settings/temp
directories are removed on pass/fail and caught SIGINT/SIGTERM; SIGKILL cannot
be handled by any in-process cleanup. Artifacts are deliberately retained but
must never be committed. A screenshot is OS desktop evidence, not fake DOM paint.

The smoke creates a page through native Cmd+K and pointer input, adds/edits a
block through SDL pointer/text input, checks exact ASCII/Chinese text via the
real daemon, restarts both processes (asserting a new daemon PID), and verifies
the persisted block renders after navigating back through the real UI.

Default production NSMenu is retained. Native menus/file choosers are modal and
can block a loop-serviced socket. They are **not yet automated**; do not switch
to `LOGSEQ_NATIVE_MENUS=0` overlays and claim native-menu coverage. Assets/nav
ports need actual system dialog automation or a documented production picker
callback interception with real selected files and the initiating SDL click.
`Plugin_host` marketplace installation/toggle/toolbar remains no-op: a passing
SDK read test is not marketplace coverage. External RTC/auth setup is also not
provided by this scaffold. Unsupported contracts must fail/report gaps, not skip.

On behavior failures, compare the same scenario with master
`114f6416a7fb21d20d6fe5a593271e5ea7697966` and `https://app.logseq.com`.
Desktop tool Chinese typing can corrupt text on master too; compare real UTF-8
SDL input/clipboard rather than weakening expected text or guessing app bugs.
Resize/maximize paint-versus-hit coordinates remain a parent-reported hypothesis,
not a proven fix. The smoke uses the default viewport and no hardcoded offsets.
