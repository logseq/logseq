# Navigation Reveal Flat Projection

## Problem

Navigation to an off-window block only polls for an already mounted element. `Router.jump_to_anchor` does not ask the logical outliner to materialize it. Native rows can remain cold for the whole polling deadline. Web already exposes key-to-index scrolling, but navigation does not use that producer.

The native outliner currently nests lazy child spines inside page rows and journal days. Pinning an ancestor and eagerly rendering its whole subtree would defeat the requested flat-list design and bounded mounting. Journals and page view need one flat projected row sequence per owner.

Patch baseline: Logseq `89ad7a0eef82e877084384d9d365ad1d38450559`, with paired SDK pins at `bc89138b7c44804ab5c0cf72e833635c85261db1`. Initial investigation used `fb42b833c2a258ecf7fc6d0e64a0a17eba49d2e4`. Master reference: `a0f4399cbeaff24d92cb33bb9524f88626056fc4`, particularly route anchors, block highlight readiness, and logical-index scrolling. Task36 is physical failure evidence, not evidence of a particular SDK execution branch or refusal reason.

## Proposal

Implement navigation-owned reveal against one complete flat logical projection shared by journals and page view. The user's decisions explicitly exclude nested virtual sources, windows, owners, anchors, and ancestor proof chains. The exact flat SDK has passed its CI and focused source-review gates; Main owns the coordinated three-pin change.

1. Project the displayed, expanded block hierarchy into ordered rows. Keep interaction scope, section, depth, and indentation ancestry in row data. Occurrence keys include interaction scope and stable block identity, not position or ancestor path; indent, outdent, reorder, and data refresh must preserve a surviving occurrence's key. Journal headers and section content participate in the same source rather than containing another virtual block list. Keep the hierarchical semantic model and selection owners intact.
2. Reuse the existing rich-text block row and property/comment components. Separate a block's own row from recursive child rendering for the flat path. Derive dynamic depth/indentation from row signals so moving a mounted row does not leave stale metadata. Render indent guides with typed layout props. Ordinary nonvirtual row content remains allowed.
3. Own one viewport handle and one stable root source in application view state for the main scroll lifetime. Bind that owner to the actual existing main scroll and bind its source once to the flat list. Dispose application-owned handles with their application scope; view consumers borrow SDK signals. Never create a source per day, block, or child list.
4. Give each navigation request a serial and its repository, route, interaction scope, and target. Preserve CmdK's existing collapsed-ancestry target-zoom decision. If the target is absent from the current projection, resolve domain loading/expansion readiness first; an ancestor may help that resolution but never creates another viewport source or proof chain. Superseding navigation or scope retirement cancels old obligations and callbacks.
5. Once the current projection contains the target, use its logical key/index before looking for a native view. Web drives the scoped key/index scroller. SwiftUI retains exactly that flat row and publishes a fresh application scroll token before the final mounted-target poll. Read-only navigation cancels its lease after exact occurrence verification; it does not produce a native receipt. Editor handoffs independently use public registration and acknowledgement for the exact current editor control, then request release with the opaque receipt and wait for actual `Released`. Ordinary cold-row proximity hydration remains separate from explicit reveal.
6. Resolve the mounted occurrence in the requested interaction scope, then perform final scroll/highlight or selection only while the request and edit ownership remain current. Host request completion is transport progress; only the SDK receipt establishes retention state. Preserve opaque B3 receipt forwarding. Release with the current receipt and wait for `Released`, or explicitly cancel when the target is no longer needed. Stale evidence must be refreshed rather than rewritten or reused.
7. Resolve retained ancestry after detached keyed/reactive constructors have attached. Admit query/reference view construction from a scope-owned deferred callback, using an ordinary anchor and an explicit virtualization decision before any cached result subtree is built. Discover the exact editor control from its attached retained node and explicit interaction scope, current target, application context, and projected occurrence; use a unique registration token for pending-aware cleanup. Re-probe through the same deferred seam on target, route/repository/context or projection changes, coalescing pending probes; a draft may activate after its static sink mounts. Clear only that registration when it stops matching. A surviving control may serve a new edit epoch; the issued intent independently captures and checks that epoch and its context. Native scheduling must be genuinely deferred because the native Promise shim invokes settled callbacks synchronously. Resolve an exact requested-scope UUID across all sections before allowing an embedded fallback, so an earlier journal embed cannot shadow a later main occurrence.

Implement this as one app integration, beginning with the pure projection and row-rendering boundary, then the single-root list, and finally the navigation/host producer. Keep the source patch separate from Main's SDK pin commit. Do not alter frozen runtime roots, databases, processes, or evidence.

## Alternatives considered

### Increase the mounted-element polling deadline

Rejected: additional time does not create an absent row.

### Force the old recursive ancestor subtree to mount

Rejected: it can mount an unbounded descendant tree and does not satisfy the single flat-list contract.

### Add nested SDK sources or ancestor receipts

Rejected by the user's explicit scope decision and the paired flat-only SDK contract.

## Acceptance criteria

- A page with many expanded descendants and multiple journal days uses one flat logical source under one owner, with no nested virtual list/source/owner on the participating path.
- Surviving block occurrences retain their keys across indent, outdent, reorder, collapse changes, and model updates; section/depth metadata updates without transferring interaction ownership.
- A navigation request to an initially unmounted target produces a logical reveal/materialization obligation before the final mounted-element poll.
- A target in a foreign projection cannot satisfy the request. Superseded route/request/edit ownership cannot receive final selection from a stale callback.
- Rich-text editing, native selection, property content, comment content, journal pagination, and the existing collapsed-ancestry navigation policy remain supported.
- Native/Melange builds, existing regression suites, focused source review, and diff checks pass. Decide the value of any new or changed tests before creating them.
- Real native acceptance separately verifies an initially unmounted target, scrolling, visibility, and selection. Source/build evidence alone cannot close this physical gate.

## Risks

- Flattening changes retained parent/sibling relationships. Audit row consumers that currently infer hierarchy or children from the DOM, especially selection, DND, indentation guides, lazy hydration, and editor identity.
- Journal headers, references, empty-page controls, and pagination must retain their existing lifecycle and spacing when separated from day subtrees.
- Row materialization and a callback returning successfully do not prove actual native visibility or accepted retention. Native proof must refer to the actual mounted view and the current SDK lease/generation.
- General graph view remains out of scope. Existing unrelated context-menu and CmdK parity gaps are not closed by this work; Main queued the remaining CmdK oracle after this producer.

## Questions

None. The user has selected the flat shape and authorized this navigation producer; Main coordinates pins and physical validation. API/implementation choices follow the public flat-only SDK contract.
