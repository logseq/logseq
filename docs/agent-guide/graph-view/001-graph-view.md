# Graph View

This document describes the current Graph View design principles and
requirements. It is the source of truth for how the global Graph View, the
page/block graph panel, the Datascript graph builders, and the Pixi renderer
should behave.

## Source Map

Primary source files:

- `src/main/frontend/routes.cljs` mounts `/graph` to
  `frontend.components.graph/global-graph`.
- `src/main/frontend/components/graph.cljs` owns the global Graph View UI,
  settings, filtering, worker loading, and the bridge into `graph-2d`.
- `src/main/frontend/components/page.cljs` reuses `graph-2d` for the page/block
  graph panel in the right sidebar.
- `src/main/frontend/components/graph_actions.cljs` owns node activation,
  sidebar opening, redirect refs, and node preview popups.
- `src/main/frontend/extensions/graph.cljs` is the Rum wrapper around the Pixi
  renderer and incremental update API.
- `src/main/frontend/extensions/graph/pixi.cljs` owns the Pixi application,
  layers, event handling, drawing, labels, runtime instance management, and FPS
  overlay.
- `src/main/frontend/extensions/graph/pixi/logic.cljs` owns pure graph layout,
  visibility, highlighting, zoom, label selection, edge runs, and geometry
  helpers.
- `src/main/frontend/common/graph_view.cljs` builds graph node/link data from a
  Datascript db.
- `src/main/frontend/worker/db_core.cljs` exposes
  `:thread-api/build-graph`, which delegates to `frontend.common.graph-view`.
- `src/main/frontend/extensions/graph.css` styles the global Graph View toolbar,
  settings panel, time travel control, reset control, accessibility panel, and
  canvas shell.

Generated files under `dist/static/**/cljs-runtime/` are compiled artifacts and
are not the source of truth.

## Core Principles

- Graph View is a relationship browser. It should show meaningful relationships
  between visible graph entities without inventing synthetic product modes.
- Layout is a stable semantic contract. Performance work may optimize data
  structures, iteration, rendering, culling, and hit testing, but must not
  change layout placement rules unless the product behavior explicitly changes.
- Hidden nodes are not interactive. If a node is hidden by focus, selection,
  time travel, journal filtering, tag filtering, grid sampling, or viewport
  culling, it must not intercept clicks, drags, hover, or edge hit testing.
- Focus and selection are inspection states, not lock states. Users can still
  drag visible nodes while a tag is focused or a node is selected.
- Selected or focused neighborhoods use smart labels. Related labels should be
  shown when possible, but label selection must cull overlap by current screen
  occupancy.
- The renderer should target smooth interaction. The Pixi ticker target is
  `120` FPS, and zooming into object detail must avoid unnecessary offscreen
  work so the bottom FPS overlay stays close to the display refresh budget.
- The all-pages and tags-and-objects modes should share common renderer paths
  where possible. Mode-specific behavior belongs in data building, layout, and
  visibility rules, not duplicated UI plumbing.
- Task status preview / Task view is not part of Graph View. Do not reintroduce
  task-specific graph modes, task-specific preview surfaces, or task-specific
  status grouping in the Pixi renderer.

## Runtime Entry Points

The global graph route is `/graph`. The shortcut config binds
`:go/graph-view` to `g g`, which calls
`frontend.handler.route/redirect-to-graph-view!` and navigates to the same
route.

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
- `:links` is a vector of maps with string `:source`, string `:target`,
  optional `:label`, and optional `:edge/type`.
- Global graphs also include `:meta {:view-mode ...}`.
- All-pages graphs include `:all-pages {:created-at-min ... :created-at-max ...}`
  for the time travel range.

`build-links` requirements:

- Drop links with missing endpoints.
- Normalize endpoints to strings.
- Deduplicate exact directed endpoint pairs.
- Keep the first non-blank label for a duplicate endpoint pair.
- Preserve class extension links with `:edge/type "class-extends"`.
- Preserve class extension edge labels from the worker db property title.

## Relationship Semantics

The graph builders must model these relationship types consistently:

- `:block/tags` connects objects/pages to tags.
- `:block/refs` connects pages through page references, lifted from block refs
  to the owning pages where needed.
- User ref properties with `:db.type/ref` add labeled relationship edges between
  visible graph nodes. The label is the property title, falling back to the
  property ident name.
- `:logseq.property.class/extends` adds class/tag extension edges. Extension
  edges are relationships in both tags-and-objects and all-pages graphs, and in
  page graphs when the focused page extends visible classes.
- `:block/parent` adds parent-child page edges in all-pages graphs when both
  endpoints are rendered pages.

Extension edges are structural edges. They should be drawn as graph edges and
display the worker db property title, normally `Extends`.

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
- Non-core built-in tags can be displayed when they are actually used by
  visible objects.

Object selection rules:

- Objects are entities connected to selected tag ids through `:block/tags`.
- Class and property entities are removed from the object set.
- Hidden, recycled, excluded, hidden-parent, recycled-parent, and excluded-page
  objects are removed.
- Tagged pages can appear as object nodes and carry `:page? true`.

Node/link behavior:

- Tag nodes have `:kind "tag"` and include `:db-ident` when available.
- Object nodes have `:kind "object"`.
- Object-to-tag links connect object ids to tag ids.
- Class extension links connect child tags/classes to parent tags/classes.
- User ref property links connect visible entity nodes.
- Node labels use title, name, uuid, then db id. ID refs inside titles are
  resolved when normalization is enabled.
- Icons from `:logseq.property/icon` are carried through to the renderer.
- In tags view mode, non-tag nodes should use a smaller uniform visual size;
  tag nodes keep their tag emphasis. All-pages sizing remains degree-based.

### All Pages

`build-all-pages-graph` builds a page graph from entities with `:block/name`.

Visibility rules:

- Hidden and recycled pages are excluded.
- Internal tags and property pages are excluded.
- Journals are included or excluded by the builder's `:journal?` option.
- Built-in pages are excluded unless `:builtin-pages?` is enabled.
- Pages with `:logseq.property/exclude-from-graph-view` are excluded unless
  `:excluded-pages?` is enabled.
- Orphan pages are included by default. Passing `:orphan-pages? false` keeps
  only linked pages.

Edges include:

- Page reference edges from `:block/refs`, lifted from block to page.
- Page tag edges when both endpoints are rendered pages.
- User ref property edges, with property-title labels.
- Class extension edges from `:logseq.property.class/extends`.
- Page parent-child edges from `:block/parent` when both endpoints are rendered
  pages.

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
  node sizing, and still preserves property ref, parent, and class extension
  links.

The global UI currently loads all-pages data with `:journal? true` and applies
the user-facing "show journals" setting later through frontend visibility
filtering.

## Page And Block Graphs

`build-page-graph` builds around a page uuid:

- The root page links to referenced pages, mentioned pages, and tags.
- It includes class extension links for the focused page when the extended
  classes are visible.
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
panel. Page-mode graphs show smart node labels by default.

## Global UI State And Settings

`frontend.components.graph` owns global Graph View state.

Settings are persisted per repo under:

```text
logseq.graph.settings.<repo>
```

The persisted settings contract includes:

- `:view-mode`
- `:selected-tag-ids`
- `:depth`
- `:link-distance`
- `:grid-layout?`
- `:show-journals?`
- `:open-groups`

Current defaults:

- `:view-mode :tags-and-objects`
- all tags selected, represented by `:selected-tag-ids nil`
- no created-at filter
- depth `1`
- link distance `72`
- grid layout disabled
- show journals disabled
- open groups `#{:view-mode :displayed-tags :layout}`

The visible settings UI exposes view mode, displayed tag selection, depth, link
distance, grid layout for tags-and-objects mode, show journals for all-pages
mode, and time travel when a created-at range exists.

Settings decoding clamps invalid numeric values:

- depth: `1..5`
- link distance: `36..180`

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
- Time travel cutoff is session state only. It must not be encoded into
  per-repo persisted graph settings, and legacy stored `createdAtFilter` values
  should be ignored during settings decode so initial all-pages loading starts
  at the full graph.
- `graph-visible-node-ids` returns `nil` when the source and visible graph are
  identical; Pixi treats `nil` as all nodes visible.
- The created-at filter is applied in the frontend for the global UI. The data
  builder also supports `:created-at-filter`, but the current global loader does
  not pass it.

Bottom toolbar behavior:

- The settings button, time travel button, and reset button share the same
  compact control style.
- Reset is shown when there are selected nodes or a focused tag node.
- Reset sits to the right of time travel.
- Reset clears selection, clears tag focus/highlight, restores the initial
  camera transform, and resets Pixi interaction state.
- Time travel animation should be slow enough for users to see progress.

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
- Graph view mode, graph data, theme, selection depth, link distance, grid
  layout, and reset token participate in renderer rebuilds or incremental
  updates according to the wrapper contract.

Incremental update effects call Pixi methods for:

- visible node ids and background visible node ids
- selection depth
- link distance
- edge arrow and edge label display
- interaction reset

## Pixi Scene Architecture

`frontend.extensions.graph.pixi/render-container!` creates a Pixi
`Application`, initializes it with transparent antialiased rendering, and stores
one live instance per DOM container. Render tokens prevent stale async
initialization from replacing newer renders.

The scene uses a root `world` container for graph-space content:

- `detail-layer`
- `tag-layer`
- `node-label-layer`
- `cluster-background-layer`

Edge labels are screen-positioned in a stage-level wrapper. The FPS overlay is
also stage-level. Nodes, node labels, and cluster backgrounds use world
coordinates and move with pan/zoom.

The initial camera transform uses `logic/fit-transform` to fit the rendered
layout into the container.

The runtime maintains atoms for:

- committed layout by id
- preview layout by id for dragging
- display links
- visible node sets
- highlighted ids
- hover id
- tag focus id
- spatial hit-test indexes
- world transform animation target
- label/detail visibility state

## Pixi Interaction Model

Pointer behavior:

- Pointer drag on empty canvas pans the world.
- Wheel zoom keeps the pointer's graph-space point stable.
- Pointer drag on a visible node moves that node and connected neighbors with
  depth-decayed weights.
- Pointer up without movement clicks a node or edge.
- Meta-click opens a preview popup.
- Shift-click or double-click opens/activates the node.
- Single click highlights or unhighlights the node.
- Clicking an edge selects its two endpoints.
- Clicking blank canvas clears selection.

Node activation behavior is delegated to `frontend.components.graph-actions`:

- Normal activation redirects to the node uuid/block uuid when present.
- Shift activation opens the node in the sidebar.
- Nodes with `:graph/open-in-sidebar? true` open in the sidebar by default.
- Preview uses a Shui popup positioned at the pointer.

Hit testing requirements:

- Hit testing uses the current displayed node spatial index, not the full graph
  index.
- Nodes hidden by focus, selection, filtering, grid sampling, or progressive
  visibility must not be hit-testable.
- Edge hit testing uses visible links only.
- Focused tags and selected nodes still allow visible nodes to be dragged.

## Layout Logic

`frontend.extensions.graph.pixi.logic/layout-nodes` is the pure layout entry
point.

Layout mode thresholds:

- All-pages graphs use fast layout at `2500` nodes and above.
- Tags-and-objects graphs use fast layout at `10000` nodes and above.
- Large all-pages rendering draws at most `3600` edges and `2200` nodes.
- Large non-all-pages rendering draws at most `8000` edges and `12000` nodes.
- Regular graphs draw at most `28000` edges.
- Fast layout work should stay within `500ms` for large Pixi layout test cases.

Shared decoration:

- Degree is computed from links whose endpoints are present.
- Node radius is based on kind and degree, except tags view non-tag nodes use a
  smaller uniform size.
- Colors come from source node color when present, otherwise kind/theme
  defaults.
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
- Fast all-pages layout must preserve the same row/column placement semantics
  while optimizing iteration.
- Stabilization recenters linked nodes and keeps isolated rings outside them.

Tags-and-objects layout:

- Tag nodes become cluster roots.
- Non-grid mode assigns each object to one displayed tag cluster and then runs
  D3 force, with cluster forces pulling nodes toward their tag centers.
- Grid mode duplicates multi-tag objects into visual nodes with ids from
  `visual-node-id`, stores the original id in `:source-id`, and places clusters
  in a grid.
- Grid layout must keep unselected tag groups visible.
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
- Selection mode displays the selected/focused neighborhood, but hidden nodes
  remain non-interactive.

Label behavior:

- Graph details remain visible at all zoom levels.
- Labels use show/hide hysteresis to reduce flicker.
- Label candidates are culled by viewport and screen-cell occupancy.
- Page-mode graphs make smart node labels visible by default.
- Tags are prioritized over overlapping object labels.
- Hovered labels can be forced into the rendered label set.
- Selected or focused neighborhoods use smart label selection over related
  nodes so labels are useful without heavily overlapping.
- Label text is shortened by default and expands for hovered/focused labels.

Edge behavior:

- In all-pages and page modes, arrows are forced on by the renderer's detail
  mode. Edge labels are allowed by default in those modes, but still require the
  current zoom scale to be at least `edge-label-visible-scale`.
- In tags-and-objects mode, edge arrows are disabled by the global UI and edge
  labels are allowed by the global UI, but still require the same zoom scale.
- Without selection, tags-and-objects mode hides ordinary links.
- With selection, visible links are filtered to the selected active
  neighborhood.
- Duplicate same-direction edges are deduplicated for drawing, and reciprocal
  edges receive a parallel offset.
- Edge label drawing leaves a gap in the edge line under the label.
- Class extension edges show the `Extends` edge label.

## Rendering Performance

Renderer performance requirements:

- The Pixi ticker target is `120` FPS.
- The dev FPS overlay is anchored in the lower-right corner and should be used
  for Chrome verification during graph performance work.
- Zooming in may reveal more object nodes, but rendering should cull offscreen
  nodes and labels to avoid FPS dropping into the `30..40` range.
- Small and medium non-virtual renders should mount all visible nodes. Viewport
  node culling belongs to the virtual large-graph path where the renderer cannot
  afford a display object per node.
- Viewport culling is a rendering optimization only. It must not change graph
  layout coordinates, cluster assignment, edge semantics, or persisted settings.
- Hit-test indexes must follow the displayed/renderable node set so offscreen
  or hidden nodes do not block panning.
- Large graph CPU optimizations should prefer transient vectors, indexed loops,
  JS maps/sets, and cached values where they preserve output semantics.

## Styling

`frontend.extensions.graph.css` styles only the surrounding HTML UI, not Pixi
nodes themselves.

It defines:

- full-height transparent global graph root
- bottom toolbar placement
- settings, time travel, and reset controls
- settings panel
- view-mode tabs
- tag search, tag rows, and tag actions
- layout stats, sliders, and toggles
- loading and error overlays
- keyboard-accessible selected-node panel
- time travel pill and expanded slider
- graph canvas sizing, focus ring, and touch behavior
- mobile adjustments for the settings panel and time travel control

Pixi-specific visual styling for nodes, edges, labels, cluster backgrounds, and
the FPS overlay lives in `frontend.extensions.graph.pixi`.

## Tests

Focused test files:

- `src/test/frontend/common/graph_view_test.cljs` covers global graph data
  building, view modes, visibility filters, ref property labels, created-at
  metadata, icons, class extension links, parent links, large graph shortcuts,
  and performance expectations.
- `src/test/frontend/components/graph_test.cljs` covers global UI settings, tag
  filtering, created-at filtering, time travel range, and layout setting
  clamps.
- `src/test/frontend/extensions/graph_test.cljs` covers `graph-2d` render deps
  and incremental edge display behavior.
- `src/test/frontend/extensions/graph_pixi_logic_test.cljs` covers pure Pixi
  logic: labels, edge runs, icon text, dragging weights, selection, zoom,
  layout modes, tag clusters, fast paths, FPS target, and node sizing.
- `src/test/frontend/components/graph_actions_test.cljs` covers activation,
  sidebar opening, and redirect refs.
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
