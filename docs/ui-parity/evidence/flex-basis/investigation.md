# Percentage flex-basis resize cache blocker

LUI source/installed revision `7ae8b157281fc4837fc7e6f1507d722c1f13404c`.
No dependency edits or pushes; additional-repository authorization is pending.

Actual native Long Page: resize1280x900 →1100x700 →1280x900. Final tree shows
root stack/row/split1280x900, but split's first column1100x900, header1100x48
and page viewport1097x852. A later app layout mutation can restore the width.
`../page-spacing/native-clamp-after-tree.log` preserves the actual tree.

Read-only independent installed-library probe:

1. Split fraction1 at1280 gives first pane1280.
2. Shrink to1100 gives1100.
3. Mutate first child's vertical padding at1100 (normal layout-affecting churn).
4. Expand to1280: first pane remains1100.
5. Explicit layout invalidation restores1280.

The split style is percentage-based, not a fixed-pixel split override.
`lui_flex.ml:1697–1704` treats a resolved percentage basis as static and updates
computed_flex_basis only when undefined. resolve_specs changes the resolved
basis when its owner changes size without invalidating that cached basis.
A shallow resize without intervening layout churn can pass, so regression
coverage must include that churn and compare with a fresh layout engine.

Minimal dependency repair: refresh the definite computed basis when entering
that branch; add the percentage-basis shrink/mutate/expand regression. Do not
mask it with whole-layout invalidation in the app. This is separate from the
app-host post-paint scroll-clamp repair, which is validated and implemented.
