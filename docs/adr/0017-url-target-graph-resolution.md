# ADR 0017: URL Target Graph Resolution

Date: 2026-05-20
Status: Accepted

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
navigation in the renderer, with a small persisted graph registry used to turn
stable graph ids into local repos.

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
4. Treat an unresolved graph id as an unresolved URL target, not as a successful
   match for the current graph. Mobile reports this to the user. Web startup
   currently logs the unresolved target and continues with the tab-local or
   stored graph so the app can still boot.
5. For Electron custom protocol URLs, the main process owns URL intake and
   graph-name/graph-id resolution. This branch keeps the existing
   renderer-mediated window creation path for custom protocol URLs and teaches
   it to resolve graph ids through the registry.
6. For web and mobile URLs, the renderer owns URL intake and graph resolution.
   It must switch to the target graph before applying the route target.
7. Once the target graph is loaded, apply the route target exactly once.
8. Do not store URL graph targets in `:git/current-repo` until the graph switch
   succeeds.
9. Use `sessionStorage` for tab-local graph identity on web reloads that do not
   carry a URL graph target. This preserves each browser tab's graph without
   appending `graph-id` to every internal route.

## Supported URL Shapes
Canonical generated web URLs use graph ids:
- `https://logseq.com/?graph-id=<graph-uuid>`
- `https://logseq.com/page/<page-uuid>?graph-id=<graph-uuid>`
- `https://logseq.com/block/<block-uuid>?graph-id=<graph-uuid>`

Electron protocol URLs accept graph ids through the same graph identifier slot:
- `logseq://graph/<graph-uuid>`
- `logseq://graph/<graph-uuid>?page=<page-name-or-uuid>`
- `logseq://graph/<graph-uuid>?block-id=<block-uuid>`
- `logseq://new-window/<graph-uuid>?page=<page-name-or-uuid>`

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
   - `:updated-at`
4. Do not persist a separate `:rtc-graph-id` in the registry. For remote graphs,
   `:graph-id` is the remote graph UUID. For local-only graphs, `:graph-id` is
   the local graph UUID.
5. Update the registry whenever a graph is created, opened, imported,
   downloaded, uploaded to RTC, renamed, unlinked, or deleted.
6. If a registry lookup fails for a graph id, the app may run an explicit repair
   path that enumerates local graph storage and opens graph DBs to rebuild the
   registry. This repair path must not be the normal URL-open path.

## Electron Runtime Design
1. Store the registry at `(.getPath app "home")/.logseq/graphs.edn`.
2. Resolve Electron protocol graph identifiers through that registry before
   falling back to existing repo/name lookup.
3. For shift-click in the graph list, open a new Electron window through the
   existing `openNewWindow` IPC using the resolved repo. Electron windows still
   use repo identity for window creation.
4. Keep a per-window pending target in Electron state only for work that cannot
   be represented safely in the URL, such as a file redirect that requires graph
   readiness. Avoid a single global `:window/once-graph-ready` callback because
   concurrent windows can overwrite each other.
5. When the renderer reports `graphReady`, Electron should look up and consume
   the pending target for that specific window id.
6. Existing error notifications for missing or unknown graphs remain, but they
   should be sent to the selected/fallback window after graph resolution fails.
7. Direct main-process creation of route-aware graph windows remains follow-up
   work; it should replace the renderer-mediated `openNewWindowOfGraph` path.

## Web Runtime Design
1. Add a parser that can read graph targets from path URLs and compatibility
   hash URLs.
2. During frontend startup:
   - parse the URL target;
   - resolve `:graph-id` through the IndexedDB graph registry;
   - resolve compatibility `:graph-identifier` against the known graph list when
     no `:graph-id` is present;
   - initialize from the resolved URL target when it resolves;
   - otherwise use the tab-local `sessionStorage` graph target, then the stored
     `:git/current-repo`, then the first linked repo.
3. During startup, apply resolved page/block URL targets after the target graph
   is restored. Later in-app route changes with graph targets are follow-up
   work.
4. During route generation:
   - generated page routes include `graph-id` when the current graph id is
     available, but startup/render-phase redirects tolerate a temporarily
     unavailable graph id instead of crashing.
5. Generated web links from `frontend.util.url` should include `graph-id` on the
   actual route.
6. Web "open in another tab" and shift-click from All graphs open `#/?graph-id=`
   URLs for existing local graphs.

## Mobile Runtime Design
1. Use the same URL target parser and resolver as the web runtime.
2. Store and resolve the graph registry from IndexedDB.
3. Treat mobile app intents and universal links as URL sources that produce the
   same target model.

## Consequences
- Resolvable graph-id URLs open the requested graph instead of silently using the
  last current graph.
- Electron protocol URLs can resolve graph ids via the registry, but route-aware
  direct window creation remains follow-up work.
- Web graph URLs become route-aware, so page and block links can switch graph
  before navigating during startup and mobile deeplink handling.
- Web and mobile graph-id resolution is fast because it reads the graph registry
  instead of scanning OPFS graph directories and opening graph databases.
- Electron graph-id resolution is fast because it reads
  `(.getPath app "home")/.logseq/graphs.edn` instead of opening each graph
  database.
- Bare web reloads preserve the tab's graph through `sessionStorage`, so two
  tabs can remain on different graphs even when one tab changes the global
  current graph.
- The implementation needs focused tests around URL parsing, graph resolution,
  first-launch Electron deeplinks, second-instance deeplinks, and web/mobile
  route changes.

## Follow-up Work
1. Add Electron main tests for first-launch and second-instance deeplinks.
2. Add renderer tests proving that web URLs switch graph before page/block
   navigation after graph switches triggered by later route changes, not only
   startup URLs.
3. Add graph registry read/write tests for IndexedDB and the Electron
   `(.getPath app "home")/.logseq/graphs.edn` registry.
4. Replace `:window/once-graph-ready` with per-window pending targets.
5. Replace Electron custom protocol's renderer-mediated `openNewWindowOfGraph`
   path with direct main-process route-aware window creation.
