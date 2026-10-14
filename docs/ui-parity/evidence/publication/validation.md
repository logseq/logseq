# Desktop local publication flag and hidden checkbox visibility

Reference actual Electron: master `7dfa9b45a`. Actual native SDL/OpenGL on Linux,
1280x900, scale1, English/light, both sidebars closed. Same private imported
Long Page fixture/UUID `6acfb138-272f-49e4-b333-5de24a86813f`. Graph visualization
excluded. Neither application publishes anything to a cloud service here.

## Reference and fail-first evidence

Master desktop menu exposes `Make it public for publishing`, then `Make it
private` after toggling the existing local publishing checkbox. Source writes
`logseq.property/publishing-public?` only. Actual master worker reads confirm
true then false (`master-public.json`, `master-private.json`).

Native menu previously omitted that control (`native-menu-before.png`). A
production native menu test failed first. Current private/public menu labels
and both toggle payloads pass: existing `set-block-property`, page UUID,
existing property keyword, opposite Boolean. Missing UUID/contained-block
routes do not acquire this page-only action.

The existing full-entity `get-case-page` read already includes the flag. Hydrate
it before resolving page tags, including the empty-tag case. No worker/schema,
protocol or migration changes; no additional read endpoint. Explicit-true
semantics match master. This is local export selection, NOT cloud publication,
a shared graph's visibility, or a membership/access-policy change.

## Actual native reproduction and persistence

1. Open Long Page through real Ctrl+K, open header menu, select Make public.
2. Actual worker returns true; reopened menu offers Make private.
3. Gracefully close/restart native application, reopen same page: true remains
   and menu still offers Make private (`native-public-restart-*`).
4. Select Make private: worker returns false and menu offers Make public.
5. Restart again: false remains (`native-private-restart.json`).

Toggling initially revealed an empty hidden-property panel/Add property button,
shifting the outline, unlike master. Master property.cljs skips ordinary-page
hidden-only panels unless explicitly shown. The shared page area now derives
visibility from its owned data/show-hidden signals and follows that condition;
class handling and the separate sidebar area remain unchanged. Production
native panel test failed first and now verifies suppression/reveal. Current
native default outline remains at the reference coordinates after both flags.

Explicit native `p a` reveals the hidden property. Its actual value checkbox
previously had a0x0 rect (the left checkbox glyph was the property-type icon,
not the value). A production geometry regression failed first. The property
checkbox now has a16x16 hit target and preserves an explicit false value.
Actual native pointer click changes false→true, paints a checked value, writes
true to the worker and updates the reopened menu to Make private. Restore false
through the same menu and collapse hidden properties afterward. No new body
paint-cache defect is claimed: saved pre/post incidental resize images have
pixel-identical main content, differing only in the scrollbar strip.

## Validation

- Native executable/web emission/tests build; native-host/contracts/host pass.
- Shared UI suite: **2119 checks, 0 failures**, including five flag-value cases.
- Fresh Vite bundle; browser journal/named-page spacing and hidden-only page
  visibility tests pass. The latter uses an isolated new page, verifies no
  default empty panel, real keyboard show/hide, false state and16px geometry.
- Current-bundle focused creation/focus/persistence E2E passes.
- `bb lang:lint-hardcoded`: passes. Reuse existing page/make-public/private keys.
- Independent read-only data-contract/regression reviews found no further
  evidenced issue; actual pointer mutation/persistence completes their runtime
  verification gap.

Remaining: menu padding/typography/keyboard states, other page commands,
cloud Publish dialog and export workflows, selection-scoped hidden-property
shortcuts and other property types/error paths. The browser twin's `.cp__overlays`
currently intercepts a real checkbox pointer attempt; this attempt timed out,
not force-clicked away. Native pointer interaction is verified separately.
This checkpoint does not establish complete page-menu/property parity.
