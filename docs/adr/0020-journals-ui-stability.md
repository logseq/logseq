# ADR 0020: Journals UI Stability

Date: 2026-06-02
Status: Accepted

## Context

The journals page renders one virtualized item per journal page. Each item can
contain a full page body, long block trees, embeds, today queries, scheduled and
deadline sections, and linked references.

Chrome verification showed the outer journals Virtuoso height and the main
scroll height changing while scrolling long journals. The same journal item also
changed height repeatedly after it was measured. Two concrete sources were
confirmed:

- `.journal-item` used bottom margin, which is outside the box measured by
  ResizeObserver.
- Long journals could render a nested block-level Virtuoso inside the outer
  journals Virtuoso, so two virtualizers measured the same scroll surface.

Linked references must remain visible in journals. The fix cannot hide them or
rely on default collapse as a workaround.

## Decision

Use the journals Virtuoso as the only virtualized measurement owner for journal
items.

Journal item spacing is measured inside the item box. The previous
`pb-[64px] mb-[38px]` visual spacing is represented as `pb-[102px]`, removing
the margin from the measured boundary.

The outer journals Virtuoso uses `skipAnimationFrameInResizeObserver true` so
ResizeObserver updates are applied synchronously with the measurement source.

Block-level virtualization is disabled when rendering page blocks under
`:journals?`. For long journal pages, root blocks are still rendered
progressively so the initial paint remains bounded without nesting another
Virtuoso under the journal item.

Linked references continue to render normally. Existing view logic already
disables linked-reference view virtualization under `:journals?`; this decision
keeps that behavior and verifies that linked-reference result bodies remain
visible.

## Consequences

The journals page has one scroll measurement owner for journal items, which
removes the feedback loop between nested virtualizers.

Long visible journal pages can eventually render all their visible root blocks,
but they do so progressively. This trades inner virtualization for stable outer
scroll geometry while preserving initial editing responsiveness.

Dynamic sections such as linked references, today queries, scheduled/deadline
sections, embeds, and images can still change the measured journal item height.
Those changes are now handled by the outer journals Virtuoso without competing
with an inner block virtualizer or unmeasured margins.

## Verification

Focused clj-e2e coverage verifies:

- journal items have no bottom margin;
- long journals keep a single `#journals` Virtuoso scroller;
- linked references remain visible in journals;
- the existing journals scroll-select-copy workflow still works.

Manual Chrome investigation on the affected page shape informed the decision.
