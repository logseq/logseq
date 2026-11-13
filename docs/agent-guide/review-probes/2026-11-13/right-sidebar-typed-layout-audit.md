# Right sidebar typed layout audit

Scope: `deps/ui/src/sidebar/right_sidebar_view.ml` at App
`caaf226a8df8deb7118e8ca2427904f22b170397`, with the authored blocks clipping
projection in this branch. The existing shared producer suite and the actual
App/native fixtures remain separate qualification surfaces. `spec-dev-tool` is
unavailable in this environment; this note follows the repository's existing
review-probe location and is not a new architecture decision.

## Established clipping correction

The original `.ls-page-blocks` Box authored `overflow:hidden` only in a
`data-attrs` style string. Its canonical snapshot therefore had no overflow
property. The isolated replay used the actual1329 primitive nodes, producer
initialization theme/icon payloads, nine bundled Inter faces and public Renderer
admission. It reproduced1424pt ScrollContent despite1118pt descendant frame
extent. All13 earlier structural/property deltas still inflated. The measured
parts batch showed that typed `overflow=hidden` on that existing Box alone
reports1118pt, retains the960pt card and every real child, and removes the extra
range. Evidence: `/tmp/logseq-right-sidebar-parts-20261113`.

This branch projects that existing authored clipping through
`Ui_components.Prop.overflow` on the same Box and removes its style carrier.
No wrapper, guessed height, scroll offset or SDK default is involved. The
shared regression exercises the real producer, populated rows and owner
retention. A fresh actual native end/return wheel run is still required before
claiming the application error is fixed.

The source of the *unclipped* descendant overflow remains unresolved. The
snapshot has no authored percentage/viewport heights, insets, absolute/fixed
position, display-none or hidden branches. The diagnostic did not establish a
Taffy or SDK defect or justify changing their defaults. Correct projection of an
already-authored clipping contract is independently required.

## Remaining source carriers

These declarations still affect Web but are not a native typed-layout channel.
Use existing typed props on the existing owner; preserve semantic classes,
non-style data attributes, callbacks and keys. No new wrapper or renderer is
needed for the integer-valued panel spacing below.

| Existing owner / source expression | Declaration still in the style carrier | Faithful conversion or remaining seam |
| --- | --- | --- |
| `topbar` / `rs-topbar` | `position:sticky;top:0;-webkit-app-region:drag` | The topbar now sits outside its sibling content Scroll, so sticky positioning needs a current Web/short-window check rather than copying a second positioning owner. Keep drag-region semantics separate; there is no matching public LUI window-drag property in the maintained constructor surface. Do not silently remove browser titlebar dragging. |
| Non-NSH `rs-settings` | `margin:0;overflow:auto` | Margin has a typed equivalent. Reuse an actual horizontal Scroll for hosts needing scroll ownership, as the current NSH branch already does; never project overflow-auto onto an NSH Row. Preserve the32pt control row and verify horizontal keyboard/focus behavior on maintained hosts. |
| Item-menu separator | `border-top:1px solid hsl(var(--border))` | Reuse the existing Divider and its typed thickness/color properties. Confirm the intended top edge versus line surface before deleting this declaration. |
| Breadcrumb Row | `margin:0;text-align:left` | Typed zero margin and existing text-alignment=start on the same owner; retain caption opacity and child order. |
| Three `help_pane` item Boxes (`item_style`) | `display:list-item;list-style:circle;font-size:16px;line-height:24px;margin-top:4px` | Font size, line height and top margin have existing typed equivalents. Circle-list semantics need a real native/list-marker design using current primitives; unsupported list-item display must not be silently treated as a Box. |
| Help shortcuts Button | `cursor:pointer` | The existing Button already owns the typed pointer cursor; remove this duplicate carrier without adding a handler. |
| Help section title Text | `display:block;margin:16px 0 4px` | Existing typed display and top/bottom/left/right margins preserve the authoring. Keep existing semantic font/color roles. |
| Help list Box | `display:block;margin-left:19.2px` | Typed block display exists, but canonical margin constructors take integer points. Exact19.2px cannot be preserved by silently rounding or a low-level float escape. Keep this as an explicit precision/marker acceptance seam. |
| Outer Help Box | `display:block;margin:4px 0 0 8px` | Typed block display, top margin4, left margin8 and zero remaining margins on the same owner. |
| Search, Help and ordinary panel body | `padding-top:8px` | Existing `Prop.padding_top 8` on each existing body; retain current conditional horizontal padding and collapsed state. |
| Ordinary page wrap Column (`wrap-*`) | `position:relative;margin:0 12px 20px` | Existing position=relative, horizontal margins12, top0 and bottom20 on this Column. Keep its existing grow and key. |
| Page inner Column (`inner-*`) | `margin-bottom:0;padding-bottom:64px` | Existing zero bottom margin and bottom padding64 on this same Column. Keep gap16 and properties/reference ownership. |

## Cohesive follow-up sequence

1. **Panel spacing owner batch:** convert the three8pt body insets, existing
   page-wrap positioning/margins and64pt inner tail padding together. These are
   existing authored values, not a new design. Add actual producer assertions
   across maintained profiles, retain clipping and data-cid, then repeat the
   short-window native end/return gate. Its expected document extent will grow
   by the newly projected spacing; do not preserve the old1118pt number as an
   artificial height budget. Compare screenshots against current Web and frozen
   master29fd2edd.
2. **Simple chrome/help spacing batch:** convert the breadcrumb, redundant
   cursor, help title and integer outer-help margins using existing typed
   properties. Keep the circle marker and19.2px precision issue visible until
   a faithful native solution is qualified; do not label approximate layout as
   complete parity.
3. **Host semantics batch:** review horizontal settings scrolling and the
   sticky/drag topbar separately, with real focus/keyboard/window behavior.
   Existing public platform ownership must decide these; a generic CSS parser,
   hidden DOM shim or new global event handler is unnecessary.

Also inspect the effective Web stylesheet before removing duplicate carriers:
`resources/css/lui-core.css` still sets `.sidebar-item-list` to display-block,
`height:calc(100vh - 48px)` and150px bottom padding, and gives page-inner4rem
bottom padding. These are class-owned layout declarations outside this file's
style carriers. Blindly copying that viewport-height rule onto the native
intrinsic document would change its sizing owner and is not part of this
clipping fix. Web cascade and maintained mobile rendering require their actual
qualification when the spacing batch lands.
