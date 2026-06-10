# ADR 0020: Journals UI Stability

Date: 2026-06-02
Status: Accepted

## Context

The journals page renders one virtualized item per journal page. Each item can
contain a full page body, long block trees, embeds, today queries, scheduled and
deadline sections, and linked references.

Chrome verification showed the outer journals Virtuoso height and the main
scroll height changing while scrolling long journals. The same journal item also
changed height repeatedly after it was measured. Three concrete sources were
confirmed:

- `.journal-item` used bottom margin, which is outside the box measured by
  ResizeObserver.
- Long journals could render a nested block-level Virtuoso inside the outer
  journals Virtuoso, so two virtualizers measured the same scroll surface.
- After a long journal item was unmounted and remounted by the outer
  virtualizer, dynamic content such as PDF embeds and linked references could
  report a temporarily low height. That made the same measured journal shrink
  and grow while scrolling back up.

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

Each journal item remembers its last measured height by repo and page id. When
the outer virtualizer remounts that item, the remembered height is used as a
temporary `min-height` reserve while dynamic content settles. The reserve is
released when the inner page content reaches the remembered height, when the
item receives editing input, or after a five-second fallback so real content
shrink can still be measured.

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

Remounting a long journal no longer lets transiently low dynamic-content height
collapse a previously measured journal item during scroll restoration.

Dynamic sections such as linked references, today queries, scheduled/deadline
sections, embeds, and images can still change the measured journal item height.
Those changes are now handled by the outer journals Virtuoso without competing
with an inner block virtualizer or unmeasured margins.

## Verification

Focused clj-e2e coverage verifies:

- journal items have no bottom margin;
- long journals keep a single `#journals` Virtuoso scroller;
- long journals do not restart from a low measured height after remount;
- linked references remain visible in journals;
- the existing journals scroll-select-copy workflow still works.

Manual Chrome investigation on the affected page shape informed the decision.
