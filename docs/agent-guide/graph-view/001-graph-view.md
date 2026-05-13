# Graph View

This document describes the current Graph View implementation as it exists in
the source tree. It covers the global Graph View page, the reusable Pixi graph
renderer, the page/block graph side panel, and the worker-side graph data
builders.

## Source Map

Primary source files:

- `src/main/frontend/routes.cljs` mounts `/graph` to
  `frontend.components.graph/global-graph`.
- `src/main/frontend/components/graph.cljs` owns the global Graph View React/Rum
  UI, settings, filtering, worker loading, and the bridge into `graph-2d`.
- `src/main/frontend/components/page.cljs` reuses `graph-2d` for the page/block
  graph panel in the right sidebar.
- `src/main/frontend/components/graph_actions.cljs` owns node activation,
  sidebar opening, and node preview popups.
- `src/main/frontend/extensions/graph.cljs` is the Rum wrapper around the Pixi
  renderer and incremental update API.
- `src/main/frontend/extensions/graph/pixi.cljs` owns the Pixi application,
  layers, event handling, drawing, labels, task status preview, and runtime
  instance management.
- `src/main/frontend/extensions/graph/pixi/logic.cljs` owns pure graph layout,
  visibility, highlighting, zoom, task status grouping, and geometry helpers.
- `src/main/frontend/common/graph_view.cljs` builds graph node/link data from a
  Datascript db.
- `src/main/frontend/worker/db_core.cljs` exposes
  `:thread-api/build-graph`, which delegates to `frontend.common.graph-view`.
- `src/main/frontend/extensions/graph.css` styles the global Graph View toolbar,
  settings panel, time travel control, accessibility panel, and canvas shell.

Generated files under `dist/static/**/cljs-runtime/` are compiled artifacts and
are not the source of truth.

## Runtime Entry Points

The global graph route is `/graph`. The shortcut config binds
`:go/graph-view` to `g g`, which calls
`frontend.handler.route/redirect-to-graph-view!` and navigates to the same route.

The page/block graph is separate from `/graph`. It is rendered by
`frontend.components.page/page-graph` in the right sidebar. It calls the same
worker API with `:type :page` for page entities and `:type :block` otherwise,
then renders the result with `graph-2d` in `:page` renderer mode.

`frontend.handler.graph` is adjacent graph metadata plumbing for repository
list metadata such as `created-at` and `last-seen-at`. It does not participate
in the Pixi Graph View rendering pipeline.

## Worker Data Pipeline

The frontend never reads Datascript graph data directly for Graph View. It calls
the db worker:

```clojure
(state/<invoke-db-worker :thread-api/build-graph repo opts)
```

`src/main/frontend/worker/db_core.cljs` resolves the repo's Datascript
connection and delegates to:

```clojure
(frontend.common.graph-view/build-graph @conn opts)
```

`build-graph` dispatches by `(:type opts)`:

- `:global` builds the global Graph View data.
- `:page` builds a local page graph around a page uuid.
- `:block` builds a local reference graph around a block uuid.

The graph data contract is plain CLJS data:

- `:nodes` is a vector of maps with string `:id`, numeric `:db-id`, optional
  string `:uuid`, `:label`, `:kind`, `:page?`, optional `:size`, optional
  `:color`, optional `:icon`, and optional `:block/created-at`.
- `:links` is a vector of maps with string `:source`, string `:target`, and
  optional `:label`.
- Global graphs also include `:meta {:view-mode ...}`.
- All-pages graphs include `:all-pages {:created-at-min ... :created-at-max ...}`
  for the time travel range.

`build-links` drops links with missing endpoints, normalizes endpoints to
strings, deduplicates exact directed endpoints, and keeps the first non-blank
label encountered for a duplicate endpoint pair.

## Global View Modes

Global Graph View has two modes:

- `:tags-and-objects`, the default mode.
- `:all-pages`.

`frontend.common.graph-view/normalize-view-mode` treats any value other than
`:all-pages` as `:tags-and-objects`.

### Tags And Objects

`build-tags-and-objects-graph` builds a graph of tag/class nodes plus tagged
object nodes.

Tag selection rules:

- Tags are entities tagged with `:logseq.class/Tag`.
- Property entities are excluded from the tag set.
- Hidden, recycled, and `:logseq.property/exclude-from-graph-view` entities are
  excluded.
- Core built-in tag idents are hidden:
  `:logseq.class/Root`, `:logseq.class/Tag`, `:logseq.class/Property`,
  `:logseq.class/Page`, `:logseq.class/Whiteboard`, and
  `:logseq.class/Asset`.
- Non-core built-in tags, including `:logseq.class/Task`, can be displayed when
  they are actually used by visible objects.

Object selection rules:

- Objects are entities connected to selected tag ids through `:block/tags`.
- Class and property entities are removed from the object set.
- Hidden, recycled, excluded, hidden-parent, recycled-parent, and excluded-page
  objects are removed.
- Tagged pages can appear as object nodes and carry `:page? true`.

Node/link behavior:

- Tag nodes have `:kind "tag"` and include `:db-ident` when available.
- Object nodes have `:kind "object"`.
- Links connect object ids to tag ids.
- User ref properties with `:db.type/ref` add labeled relationship edges between
  visible graph nodes. The label is the property title, falling back to the
  property ident name.
- Node labels use title, name, uuid, then db id. ID refs inside titles are
  resolved when normalization is enabled.
- Icons from `:logseq.property/icon` are carried through to the renderer.

### All Pages

`build-all-pages-graph` builds a page graph from entities with `:block/name`.

Visibility rules:

- Hidden and recycled pages are excluded.
- Internal tags and property pages are excluded.
- Journals are included or excluded by the builder's `:journal?` option.
- Built-in pages are excluded unless `:builtin-pages?` is enabled.
- Pages with `:logseq.property/exclude-from-graph-view` are excluded unless
  `:excluded-pages?` is enabled.
- Orphan pages are included by default. Passing `:orphan-pages? false` keeps only
  linked pages.

Edges include:

- Page reference edges from `:block/refs`, lifted from block to page.
- Page tag edges when both endpoints are rendered pages.
- User ref property edges, with property-title labels.

Node behavior:

- Page `:kind` is derived from tags: `"tag"`, `"property"`, `"journal"`, or
  `"page"`.
- Node color comes from page kind and theme.
- Node size is degree-based in the normal path.
- Labels that look like UUIDs or asset/file paths are removed by
  `normalize-page-name`.
- Links are pruned after node normalization so every link endpoint is rendered.

There are two builder paths:

- Normal path: used for smaller graphs or when `:created-at-filter` is passed.
- Large fast path: used when there are at least `10000` page name datoms and no
  `:created-at-filter`. It bounds visible ref links to `20000`, uses compact
  node sizing, and still preserves property ref links.

The global UI currently loads all-pages data with `:journal? true` and applies
the user-facing "show journals" setting later through frontend visibility
filtering.

## Page And Block Graphs

`build-page-graph` builds around a page uuid:

- The root page links to referenced pages, mentioned pages, and tags.
- It adds second-order links among referenced/mentioned pages when those pages
  reference or mention each other.
- The root page node is marked `:root? true` for the renderer.
- Journal mention inclusion is controlled by `:show-journal?`.

`build-block-graph` builds around a block uuid:

- The root block is connected to pages from both incoming and outgoing block
  refs.
- Self links are removed.
- It reuses the older `build-nodes` page-shaped node contract, so the output
  nodes carry `:page? true` even when the root entity is a block.

Both page and block graphs are rendered in Pixi `:page` mode by the sidebar
panel.

## Global UI State And Settings

`frontend.components.graph` owns global Graph View state.

Settings are persisted per repo under:

```text
logseq.graph.settings.<repo>
```

The persisted settings contract includes:

- `:view-mode`
- `:selected-tag-ids`
- `:created-at-filter`
- `:depth`
- `:link-distance`
- `:visible-recent-task-count`
- `:grid-layout?`
- `:show-journals?`
- `:open-groups`

Current defaults:

- `:view-mode :tags-and-objects`
- all tags selected, represented by `:selected-tag-ids nil`
- no created-at filter
- depth `1`
- link distance `72`
- visible recent task count `12`
- grid layout disabled
- show journals disabled
- open groups `#{:view-mode :displayed-tags :layout}`

The visible settings UI currently exposes view mode, displayed tag selection,
depth, link distance, grid layout for tags-and-objects mode, show journals for
all-pages mode, and time travel when a created-at range exists.
`visible-recent-task-count` is part of the persisted/render contract but does
not currently have a visible control in `layout-group`.

Settings decoding clamps invalid numeric values:

- depth: `1..5`
- link distance: `36..180`
- visible recent task count: `1..24`

Loading behavior:

- Graph data is cached per view mode in component state.
- Switching view modes clears selected nodes.
- Changing repo or theme clears cached graph data, loading state, and errors.
- Each mode is loaded independently through `load-global-graph!`.
- Build failures are stored per mode and shown as a retryable graph error.

Filtering behavior:

- Tag filtering changes the actual node/link set passed to Pixi for
  `:tags-and-objects`.
- Journal and time-travel filtering usually keep the full mode graph as the
  Pixi layout input and pass `visible-node-ids` for display filtering.
- `graph-visible-node-ids` returns `nil` when the source and visible graph are
  identical; Pixi treats `nil` as all nodes visible.
- The created-at filter is applied in the frontend for the global UI. The data
  builder also supports `:created-at-filter`, but the current global loader does
  not pass it.

## React To Pixi Bridge

`frontend.extensions.graph/graph-2d` creates a DOM container and schedules
Pixi rendering.

Render behavior:

- Full container rendering is scheduled through `requestAnimationFrame` followed
  by `setTimeout 0`.
- Render cancellation uses the effect cleanup returned by
  `schedule-render-container!`.
- Unmounting calls `pixi/destroy-instance!`.
- `render-container-deps` intentionally excludes `:show-arrows?` and
  `:show-edge-labels?`; those are updated incrementally.
- `:visible-recent-task-count` is included in render deps, so changing it causes
  a full renderer rebuild.

Incremental update effects call Pixi methods for:

- visible node ids and background visible node ids
- selection depth
- link distance
- edge arrow and edge label display

## Pixi Scene Architecture

`frontend.extensions.graph.pixi/render-container!` creates a Pixi
`Application`, initializes it with transparent antialiased rendering, and stores
one live instance per DOM container. Render tokens prevent stale async
initialization from replacing newer renders.

The scene uses a root `world` container for graph-space content:

- `detail-layer`
- `tag-layer`
- `node-label-layer`
- `task-status-label-layer`
- `cluster-background-layer`
- `task-status-background-layer`

Edge labels are screen-positioned in a stage-level wrapper. The FPS overlay is
also stage-level. Nodes, node labels, cluster backgrounds, and task status
surfaces use world coordinates and move with pan/zoom.

The initial camera transform uses `logic/fit-transform` to fit the rendered
layout into the container.

The runtime maintains atoms for:

- committed layout by id
- preview layout by id for dragging and task status preview
- display links
- visible node sets
- highlighted ids
- hover id
- tag focus id
- task status preview state
- spatial hit-test indexes
- world transform animation target
- label/detail visibility state

## Pixi Interaction Model

Pointer behavior:

- Pointer drag on empty canvas pans the world.
- Wheel zoom keeps the pointer's graph-space point stable.
- Pointer drag on a node moves that node and connected neighbors with
  depth-decayed weights.
- Pointer up without movement clicks a node or edge.
- Meta-click opens a preview popup.
- Shift-click or double-click opens/activates the node.
- Single click highlights or unhighlights the node.
- Clicking an edge selects its two endpoints.
- Clicking blank canvas clears selection only when task status preview is not
  active.

Node activation behavior is delegated to `frontend.components.graph-actions`:

- Normal activation redirects to the node uuid/block uuid when present.
- Shift activation opens the node in the sidebar.
- Nodes with `:graph/open-in-sidebar? true` open in the sidebar by default.
- Preview uses a Shui popup positioned at the pointer.

Hit testing uses a fixed-size spatial index over layouted nodes and separate
edge segment hit testing for visible links.

## Layout Logic

`frontend.extensions.graph.pixi.logic/layout-nodes` is the pure layout entry
point.

Layout mode thresholds:

- All-pages graphs use fast layout at `2500` nodes and above.
- Tags-and-objects graphs use fast layout at `10000` nodes and above.
- Large all-pages rendering draws at most `3600` edges and `2200` nodes.
- Large non-all-pages rendering draws at most `8000` edges and `12000` nodes.
- Regular graphs draw at most `28000` edges.

Shared decoration:

- Degree is computed from links whose endpoints are present.
- Node radius is based on kind and degree.
- Colors come from source node color when present, otherwise kind/theme defaults.
- Icons are rendered as emoji text or Tabler icon text when the icon can be
  resolved.

Page mode layout:

- Root node, when present, is fixed at the center.
- Neighbor nodes are grouped by graph depth around the root.
- Without a root, the fallback is a phyllotaxis layout.

All-pages layout:

- Normal all-pages layout separates linked and isolated nodes.
- Linked nodes use deterministic phyllotaxis placement.
- Isolated nodes are placed in rings outside the linked graph.
- Fast all-pages layout uses a compact grid and a fast JS degree map.
- Stabilization recenters linked nodes and keeps isolated rings outside them.

Tags-and-objects layout:

- Tag nodes become cluster roots.
- Non-grid mode assigns each object to one displayed tag cluster and then runs
  D3 force, with cluster forces pulling nodes toward their tag centers.
- Grid mode duplicates multi-tag objects into visual nodes with ids from
  `visual-node-id`, stores the original id in `:source-id`, and places clusters
  in a grid.
- Medium tags-and-objects force layouts are bounded to at most `900` nodes for
  D3 force simulation, then cluster deltas are merged back into the full node
  set.

Cluster backgrounds are generated by `tag-cluster-backgrounds` from the current
visible clustered nodes. Non-grid clusters use a softened convex hull. Grid
clusters are centered on the tag node.

`display-links` remaps source links to duplicated grid visual nodes when needed,
and drops links whose display endpoints are not present.

## Visibility, Labels, And Edges

Tags-and-objects mode has progressive visibility:

- With no selection and non-grid layout, the initial display set is tag nodes.
- Zooming into a tag can isolate the focused tag and reveal a balanced budget of
  object nodes around it.
- Grid layout displays all tags plus a bounded sample of object nodes per group.
- Selection mode uses the full visible index so selected neighborhoods can be
  reached even when default display is collapsed.

Label behavior:

- Graph details remain visible at all zoom levels.
- Labels use show/hide hysteresis to reduce flicker.
- Label candidates are culled by viewport and screen-cell occupancy.
- Tags are prioritized over overlapping object labels.
- Hovered and selected labels can be forced into the rendered label set.
- Task status preview suppresses the normal graph label layer and uses its own
  Pixi label layer.

Edge behavior:

- In all-pages and page modes, arrows are forced on by the renderer's detail
  mode. Edge labels are allowed by default in those modes, but still require the
  current zoom scale to be at least `edge-label-visible-scale`.
- In tags-and-objects mode, edge arrows are disabled by the global UI and edge
  labels are allowed by the global UI, but still require the same zoom scale.
- Without selection, tags-and-objects mode hides ordinary links unless task
  status preview supplies its own display links.
- With selection, visible links are filtered to the selected active
  neighborhood.
- Duplicate same-direction edges are deduplicated for drawing, and reciprocal
  edges receive a parallel offset.
- Edge label drawing leaves a gap in the edge line under the label.

## Task Status Preview

Task status preview is a graph-native focus mode implemented in
`graph.pixi.logic` and `graph.pixi`.

Eligibility is based on the current implementation:

- The normalized renderer mode must be `:tags-and-objects`.
- Exactly one selected group id is used as the candidate.
- The candidate must resolve to the built-in Task group or to a label-only Task
  node/tag according to `task-tag-node?`.
- At least `task-status-detail-min-task-count` (`4`) visible task neighbors must
  be found.
- The current pure eligibility function accepts `:grid-layout? true`; grid
  layout is not currently a blocker.

This means the current code still has label-only Task compatibility and does not
enforce the older "grid layout disabled" rule.

Task collection:

- Visible neighbor nodes of the selected group are collected.
- Nodes with `:task? true` are tasks.
- When the selected group itself is the Task tag, non-tag neighbors can be
  treated as tasks even if they do not carry compact task metadata.
- Task entry selection can redirect to the Task group through
  `task-status-preview-entry-group-id`.

Task grouping:

- Status id is normalized from `:task/status-ident` and
  `:task/status-title`.
- Missing status is represented as the `"No status"` group.
- Groups are sorted by lower-case status title, then status key, status area,
  and status id. They are not sorted by a hard-coded built-in workflow order.
- Tasks inside a group are sorted by most recent `:block/updated-at`, then most
  recent `:block/created-at`, then lower-case label, then id.

Task status layout:

- The selected Task node stays at the current graph-world center.
- Status groups are placed around the Task node from deterministic anchors.
- Groups are pushed apart by circle distance and then by organic blob bounds.
- Each group gets a status badge, count/overflow information, an organic blob,
  and visible task positions.
- Only currently visible/revealed task nodes receive positions in
  `:positions-by-id`.
- Overflow is represented by a collapsed `"..."` control and `:hidden-count`.
- Clicking a status badge or `"..."` control reveals more tasks in batches.
- The default requested visible count is `12`, reduced for tight viewports or
  high status-group density.
- Label cards are created for visible tasks, shifted away from other cards and
  task dots, and can include one non-Task tag summary.

Pixi runtime behavior:

- Selecting an eligible Task entry computes groups, merges preview positions
  into the current layout, and fits the camera to the Task status composition.
- The previous transform is saved and restored when the preview is cleared.
- Normal cluster backgrounds are cleared while task preview is active.
- Background context nodes are limited to the nearest `900` visible non-task
  nodes.
- Task status display links are synthetic denoised links from the selected Task
  root to status groups and visible tasks, plus sparse task-to-task relation
  links.
- Task label cards and center labels activate the target node in the sidebar.
- Clicking a task node while preview is active also opens it in the sidebar.

## Styling

`frontend.extensions.graph.css` styles only the surrounding HTML UI, not Pixi
nodes themselves.

It defines:

- full-height transparent global graph root
- bottom toolbar placement
- settings button and panel
- view-mode tabs
- tag search, tag rows, and tag actions
- layout stats, sliders, and toggles
- loading and error overlays
- keyboard-accessible selected-node panel
- time travel pill and expanded slider
- graph canvas sizing, focus ring, and touch behavior
- mobile adjustments for the settings panel and time travel control

Pixi-specific visual styling for nodes, edges, labels, cluster backgrounds, task
status blobs, and the FPS overlay lives in `frontend.extensions.graph.pixi`.

## Tests

Focused test files:

- `src/test/frontend/common/graph_view_test.cljs` covers global graph data
  building, view modes, visibility filters, ref property labels, created-at
  metadata, icons, Task compact metadata, large graph shortcuts, and performance
  expectations.
- `src/test/frontend/components/graph_test.cljs` covers global UI settings,
  tag filtering, created-at filtering, time travel range, and layout setting
  clamps.
- `src/test/frontend/extensions/graph_test.cljs` covers `graph-2d` render deps
  and incremental edge display behavior.
- `src/test/frontend/extensions/graph_pixi_logic_test.cljs` covers pure Pixi
  logic: labels, edge runs, icon text, dragging weights, selection, zoom, task
  status preview, layout modes, tag clusters, fast paths, and node sizing.
- `src/test/frontend/components/graph_actions_test.cljs` covers activation,
  sidebar opening, redirect refs, and task label activation behavior.
- `src/test/frontend/worker/db_core_test.cljs` verifies
  `:thread-api/build-graph` delegates to `frontend.common.graph-view`.

Focused validation commands:

```bash
bb dev:test -v frontend.common.graph-view-test
bb dev:test -v frontend.components.graph-test
bb dev:test -v frontend.extensions.graph-test
bb dev:test -v frontend.extensions.graph-pixi-logic-test
bb dev:test -v frontend.components.graph-actions-test
```

General validation:

```bash
git diff --check
bb dev:lint-and-test
```
