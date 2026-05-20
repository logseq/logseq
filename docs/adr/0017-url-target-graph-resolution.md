# ADR 0017: URL Target Graph Resolution

Date: 2026-05-20
Status: Proposed

## Context
Logseq URLs can point at a graph, page, block, or file. Today the graph target is
not carried through one coherent flow.

The custom protocol path is handled in Electron main:
- `logseq://graph/<graph>` and `logseq://new-window/<graph>` are parsed in
  `electron.url/local-url-handler`.
- Electron resolves `<graph>` through `electron.handler/get-graph-name`.
- If no window is already associated with that graph, Electron asks the current
  renderer to run `openNewWindowOfGraph`.
- The renderer then opens a new Electron window with `#/?graph=<repo>`.

This depends on renderer IPC timing and renderer-local storage. On first app
launch, the initial deeplink is handled soon after the main window is created,
while the renderer listener can still be unavailable. When the message is lost,
the newly opened app falls back to the stored `:git/current-repo`, so the URL
appears to always open the current graph.

The web app has a related weakness. `frontend.state` only reads `:graph` from
`frontend.util/parse-params` during initial state creation, and that parser only
understands hash fragments shaped like `#/?graph=...`. Page/block web URLs and
later hash changes can route inside the currently opened graph instead of first
switching to the graph named by the URL.

Graph names are not stable identifiers. Users can rename graphs, and two linked
graphs can share the same short basename. URLs that are meant to survive
renames, browser sessions, and device handoffs need to identify the graph by id.

## Decision
Make URL graph selection an explicit target object and process it before route
navigation.

1. Introduce a shared URL target model for Electron protocol URLs, web URLs, and
   mobile URLs:
   - `:graph-id` - canonical graph id from the URL.
   - `:graph-identifier` - compatibility alias, such as a short graph name or
     full DB repo name.
   - `:repo` - resolved full local repo name, for example `logseq_db_work`.
   - `:route` - one of graph home, page, block, or file.
   - `:open-mode` - current window or new window.
   - `:source` - protocol URL, web URL, startup argv, or second instance.
2. Use `:graph-id` as the canonical URL identity. For remote graphs,
   `:graph-id` is the remote graph UUID. For local-only graphs, `:graph-id` is
   the local graph UUID. Generated URLs should include `graph-id` whenever the
   graph id is known.
3. Resolve URL graph targets through one graph resolver that accepts, in order:
   - graph ids from the local graph registry;
   - full DB repo names, such as `logseq_db_work`;
   - short local graph names, such as `work`;
   - existing canonicalized DB repo names.
4. Treat an unresolved graph as an error. Do not fall back to
   `:git/current-repo`.
5. For Electron custom protocol URLs, the main process owns URL intake and graph
   resolution. It must create or focus the target graph window directly instead
   of sending `openNewWindowOfGraph` to an arbitrary renderer.
6. For web and mobile URLs, the renderer owns URL intake and graph resolution.
   It must switch to the target graph before applying the route target.
7. Once the target graph is loaded, apply the route target exactly once.
8. Do not store URL graph targets in `:git/current-repo` until the graph switch
   succeeds.

## Supported URL Shapes
Canonical generated URLs use graph ids:
- `https://logseq.com/?graph-id=<graph-uuid>`
- `https://logseq.com/page/<page-uuid>?graph-id=<graph-uuid>`
- `https://logseq.com/block/<block-uuid>?graph-id=<graph-uuid>`
- `logseq://graph/<graph-uuid>`
- `logseq://graph/<graph-uuid>?page-id=<page-uuid>`
- `logseq://graph/<graph-uuid>?block-id=<block-uuid>`
- `logseq://new-window/<graph-uuid>?page-id=<page-uuid>`

Compatibility URLs remain accepted:
- `logseq://graph/<graph-name>`
- `logseq://graph/<graph-name>?page=<page-name>`
- `logseq://graph/<graph-name>?block-id=<uuid>`
- `logseq://graph/<graph-name>?file=<file>`
- `https://logseq.com/#/?graph=<graph-name>`
- `https://logseq.com/#/page/<page-name>?graph=<graph-name>`

Generated web URLs should use path routes instead of hash routes. The app may
continue accepting hash-routed URLs during migration, but new share/copy-link
helpers should emit path URLs with `graph-id`.

## Graph Registry
URL graph-id resolution must not open every graph database during startup. Keep a
small graph registry outside each graph DB.

1. Web and mobile store the graph registry in IndexedDB.
2. Electron stores the graph registry in
   `(.getPath app "home")/.logseq/graphs.edn`.
3. Registry entries include at least:
   - `:graph-id`
   - `:repo`
   - `:graph-name`
   - `:local-graph-id`
   - `:rtc-graph-id`
   - `:updated-at`
4. For remote graphs, `:graph-id` must equal `:rtc-graph-id`. For local-only
   graphs, `:graph-id` must equal `:local-graph-id`.
5. Update the registry whenever a graph is created, opened, imported,
   downloaded, uploaded to RTC, renamed, unlinked, or deleted.
6. If a registry lookup fails for a graph id, the app may run an explicit repair
   path that enumerates local graph storage and opens graph DBs to rebuild the
   registry. This repair path must not be the normal URL-open path.

## Electron Runtime Design
1. Replace the renderer-mediated `openNewWindowOfGraph` path for deeplinks with
   a main-process function similar to:
   - resolve URL target;
   - find existing windows for `:repo` using `electron.window/get-graph-all-windows`;
   - focus the existing graph window when `:open-mode` is current-window and a
     matching window exists;
   - otherwise create a new window with the target encoded into its initial URL.
2. Extend `electron.window/create-main-window!` so it can receive a full URL
   target, not only a `:graph` option. The initial load URL should include both
   graph and route information, for example:
   - `/?graph-id=<graph-uuid>`
   - `/page/<page-uuid>?graph-id=<graph-uuid>`
3. Keep a per-window pending target in Electron state only for work that cannot
   be represented safely in the URL, such as a file redirect that requires graph
   readiness. Avoid a single global `:window/once-graph-ready` callback because
   concurrent windows can overwrite each other.
4. When the renderer reports `graphReady`, Electron should look up and consume
   the pending target for that specific window id.
5. Existing error notifications for missing or unknown graphs remain, but they
   should be sent to the selected/fallback window after graph resolution fails.

## Web Runtime Design
1. Add a parser that can read graph targets from path URLs and compatibility
   hash URLs.
2. During frontend startup:
   - parse the URL target;
   - resolve `:graph-id` through the IndexedDB graph registry;
   - resolve compatibility `:graph-identifier` against the known graph list when
     no `:graph-id` is present;
   - initialize `:git/current-repo` from the URL target only when it resolves;
   - otherwise keep the stored graph and show an explicit error.
3. During route changes:
   - if the URL carries a graph target different from the current graph,
     dispatch `[:graph/switch repo {:url-target? true}]`;
   - defer page/block navigation until the switch finishes and the target graph
     is ready;
   - then remove or preserve `graph-id` according to routing policy, but never
     navigate the target route inside the old current graph.
4. Generated web links from `frontend.util.url` should include `graph-id` on the
   actual route.

## Mobile Runtime Design
1. Use the same URL target parser and resolver as the web runtime.
2. Store and resolve the graph registry from IndexedDB.
3. Treat mobile app intents and universal links as URL sources that produce the
   same target model.

## Consequences
- Opening a URL either opens the requested graph or fails loudly. It no longer
  silently opens the last current graph.
- Electron main becomes responsible for graph-window selection for deeplinks,
  which removes the startup race caused by sending `openNewWindowOfGraph` before
  the renderer listener is ready.
- Web graph URLs become route-aware, so page and block links can switch graph
  before navigating.
- Web and mobile graph-id resolution is fast because it reads the graph registry
  instead of scanning OPFS graph directories and opening graph databases.
- Electron graph-id resolution is fast because it reads
  `(.getPath app "home")/.logseq/graphs.edn` instead of opening each graph
  database.
- The implementation needs focused tests around URL parsing, graph resolution,
  first-launch Electron deeplinks, second-instance deeplinks, and web/mobile
  route changes.

## Follow-up Work
1. Add pure tests for shared URL target parsing:
   - protocol graph home, page, block, and file URLs with graph ids;
   - web graph home, page, and block path URLs with graph ids;
   - compatibility name/hash URLs;
   - invalid or missing graph targets.
2. Add Electron main tests for first-launch and second-instance deeplinks.
3. Add renderer tests proving that web URLs switch graph before page/block
   navigation.
4. Add graph registry read/write tests for IndexedDB and the Electron
   `(.getPath app "home")/.logseq/graphs.edn` registry.
5. Replace `:window/once-graph-ready` with per-window pending targets.
6. Update link generation helpers in `frontend.util.url` to emit route-aware
   graph-id URLs.
