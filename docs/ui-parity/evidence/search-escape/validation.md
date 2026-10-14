# Search Escape, filter query and input ownership

Reference: master `7dfa9b45a`. Actual native: SDL/OpenGL, Linux, scale1,
1280x900, English/light, private Demo fixture. Current page comparisons use
`Native focus verified` / `Focus ownership persisted`; baseline Escape captures
use the same graph's journal. No graph visualization was opened or tested.

## Reproduce and fail first

- Native Ctrl+K → query → Escape closed immediately. Master clears the query
  while keeping the palette/input active, then closes on the next Escape.
  The SDL host ran native overlay dismissal before document capture; native
  `prevent_default` was a no-op. Dispatch-prevention regression failed first.
- Select Nodes with `Focus`: native discarded the query and lost input focus.
  Master preserves `Focus` and returns focus to its input. Filter focus tests
  failed2 checks; query-preservation tests failed6 checks before repair.
- Pin `Focus ownership persisted` via Ctrl+Enter; reopen global search. The
  first global input selector resolved the sidebar input, not the modal input.
  Actual typing `Z` dispatched keydown to sidebar node1818 and did not edit
  the modal. A native snapshot/host-operation test failed the same ownership
  assertion. This is an executable issue, not only a static review candidate.

## Repairs

- Native event dispatch records prevention for one event; nested events restore
  their parent's prevention/propagation state. Later listeners see prevention.
- Only SDL Escape changes ordering: synchronous document dispatch and resulting
  patches precede the native default. Consumed Escape skips overlay dismissal
  and editor conduit; unconsumed Escape retains the normal host behavior.
  Escape is not dispatched twice. Other key ordering is unchanged.
- Filter selection preserves the query, removing only its final slash suffix
  as master's `get-filter-user-input` / `split-last` does. Selection/clearing
  reset keyboard highlight mode and return focus to the search input.
- Both host services scope value/focus/initial-focus operations to their owner:
  modal by default; pinned searches use their existing sidebar panel identifier.

## Validation

- Native-host/contracts/host tests pass. Tests cover prevention, nesting,
  propagation-vs-default, snapshot events, host document/default ordering and
  modal/sidebar input selection. Shared UI suite: **2114 checks, 0 failures**,
  including query Escape, second close, filter focus/query/suffix and web input
  ownership checks. Failure logs remain in the isolated workspace.
- Focused E2E `cmdk-create-page-keeps-spaced-label-and-editor-focus`: passes
  after the final repair. This is a browser regression, not native proof.
- Actual newly built native binary: first Escape clears query and keeps palette
  active; typing without another click works; second Escape closes. Selecting
  Nodes preserves `Focus`; type ` ownership`, Escape clears only filter, then
  type ` persisted` without another click.
- Actual pinned-sidebar/global-modal coexistence: sidebar query stays
  `Focus ownership persisted`, modal becomes `Focus`; select Nodes, Escape,
  type ` ownership`, only modal changes. Standalone sidebar filter action then
  typing `!` updates its own input. Retained-tree observations confirm separate
  node values; `native-owned-input-*.png` preserves appearance evidence.
- Toolbar menu and Settings still close on unconsumed Escape. Existing-block
  click → Ctrl+A → `Escape dispatch saved` → Escape persists that exact title
  to the actual worker (`native-editor-save.json`). Representative content was
  restored through the same native editor afterward.

Remaining: result ordering/current-page grouping, other filters/commands,
move mode, multi-pinned-search behavior, keyboard selection, scrolling, palette
metrics/highlight appearance and pinned-state restart persistence. These
repairs do not establish complete search/sidebar/editor parity. Broad web-twin
E2E remains red and is not represented as a passing native suite.

The changed agent proposal passes `spec-dev-tool check <path>`. Repository-wide
`check --all` still reports pre-existing noncanonical `003-assets/*.md` paths
and missing sections in `2026-10-11-004-css-to-lui-api.md`; those unrelated
reference-era documents are not rewritten in this interaction repair.
