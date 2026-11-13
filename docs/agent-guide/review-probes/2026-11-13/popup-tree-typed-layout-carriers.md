# Popup, outliner, view-header and card layout carriers

This audit covers the active authored producers in `blocks/tree.ml`, `popups/popups_view.ml`, `views/views_head.ml`, and `cards/cards_view.ml`. The starting evidence is the actual-CMT inline-layout preflight captured at App c756ec5f, with 22 reported constructor sites in these four files. The later shared-block clipping correction is already integrated and is preserved. This source-only batch has not been compiled, run or visually qualified.

## Exact projections

All changes use the original keyed canonical node. `Ui_components.with_props` adds typed properties to that mounted node; it does not add a wrapper or change the subtree.

- Outliner bullet-link Row already declares `cross=center`; its parent is the control Row, so flex-item blockification makes the inline/block distinction immaterial there. Remove only duplicate `display:inline-flex;align-items:center`; preserve the typography declarations.
- Display content remains the original grow-1 Row. Project only its existing `overflow-x:visible` through typed Overflow. The other overflow axis was already the default visible and remains so. Preserve the original `user-select:text` style carrier; this batch does not introduce a typed or inherited selection policy.
- Both ordinary and reference outliner trailing-control Rows project existing `flex-shrink:0` only on Web/NSH, and `position:relative`. Their independent `align-self:flex-start` requirement is retained and still needs a faithful typed capability.
- The autocomplete icon slot projects `flex-shrink:0` only on Web/NSH. Its existing 20px height, opacity, right margin, key, and empty-slot behavior remain.
- The autocomplete Scroll projects relative positioning; its Web touch-scrolling declaration remains.
- The autocomplete hint projects only its explicit 8px vertical margin. Its rem-based horizontal padding remains unresolved. The untouched horizontal margin was the default zero; no app stylesheet supplies another margin for this semantic class.
- The preview document projects only its explicit 64px bottom padding, after its existing uniform 8px padding on the same Box. The preview title content Box projects relative positioning and retains its pointer handlers.
- The reference-filter result Row projects its existing flex-wrap. Its fixed 500px width/max-width, gap and choice callbacks remain.
- The flashcard action Row projects existing shrink-0 only on Web/NSH, preserving its children, phase keying, spacing and callbacks.

Existing shared recording-host tests cover the real autocomplete and preview/outliner producers, retained owner identity, exact padding, and trailing control ownership. They do not establish physical native geometry, pixel parity, or the unresolved declarations below.

## Remaining authored requirements

These are still active acceptance gaps, not declarations to delete or hide behind a non-NSH branch merely to pass the guard.

| Producer | Remaining requirement | Why this batch retains it |
| --- | --- | --- |
| Tree block-head Row | `width:100%` | Typed width is integer points. `grow=1` already exists, but an oversized intrinsic child may differ from an authored percentage basis; no equivalence is assumed. |
| Both Tree trailing-control Rows | `align-self:flex-start` | Canonical API has no AlignSelf property. Their parent Row uses cross=center; deleting this declaration changes placement. |
| Autocomplete hint | `padding:0 0.25rem` | Canonical padding is integer points. Web root font size is not proven invariant under theme/custom CSS. |
| Command-menu shortcut Row | `padding-left:0.5rem` | Same unit boundary; rounding or assuming 16px changes an unproven metric contract. |
| Preview Popover | `padding-left:1.5rem` | Same unit boundary. |
| Preview document Box | `margin-left:-1.25rem;padding-left:1.75rem` | Same unit boundary; 64px bottom padding is projected separately. |
| View-header filter chip and both filter Rows | `max-width:100%` | MaxWidth is integer points; viewport-relative sizing addresses a different owner. A nearest-container relative frame fills width rather than imposing this maximum. |
| Reference-filter chip label | `margin-right:0.25rem` | Same unit boundary. |
| Reference-filter dialog header | `padding-bottom:0.5rem` | Same unit boundary. |
| Both flashcard shortcut Kbd nodes | `transform:scale(0.9)` | No typed transform. Reducing font size changes layout metrics and is not an equivalent paint transform. |
| Flashcard action Row | `padding-bottom:0.5rem` | Same unit boundary; shrink-0 is projected separately. |

The native theme radius resolver includes a 16px rem multiplier, but that is not proof of a fixed Web root metric for these application layout declarations. This batch therefore does not convert rem values to points, invent unsupported typed values, use CSS compatibility parsing, change mobile backends, or add a global layout policy.

## Qualification

Root should run the maintained shared producer suite and actual native admission/static carrier preflight after integration. The preflight must continue to report the unresolved requirements above. Actual native preview, autocomplete, cards and outliner geometry remain separate gates. No SDK, schema, dependency, Dune, virtualizer or public LUI API changes are included.

## Maintained backend boundary

Unconditional `row ~shrink:0.` would be invalid on Apple/iOS and Android: `lui_runtime.ml:set_prop` explicitly rejects ShrinkValue for SwiftUIHost/KotlinHost/GenericHost, Apple `LUIWireProtocol.propertySupported` rejects `.shrink`, and Android `LuiKindRules` rejects `"shrink"`. The scoped implementation uses the already-existing `Ui_parts.float_prop` adapter only with `Some 0.` for exact WebHost/NshHost; all other profiles receive `None`, so no unsupported property is submitted. Relative positioning and all original node identities remain. No new helper, fallback layout or backend API is introduced. The previously ignored CSS shrink declaration did not implement mobile shrinking; this batch preserves that prior native behavior rather than claiming new mobile shrink support.

The actual `mobile/logseq.opam` and `logseq_journal/logseq_journal.opam` depend on independent pinned LUI packages, not these desktop App Tree/Card/Popup modules. This does not excuse invalid shared calls: the new actual autocomplete producer regression also mounts the same slot under Web, NSH, SwiftUI and Kotlin profiles, requiring shrink only on its supported hosts and preserving the empty 20px slot on all four. Execution remains owned by root.

UserSelect admission is not sufficient evidence of native behavior: the Apple/Android validators admit it as typography, but their renderers do not expose corresponding selectable-text lowering. Consequently this patch preserves the old style carrier unchanged and projects only Overflow; it makes no new selection, pointer, or drag-routing claim on any backend.
