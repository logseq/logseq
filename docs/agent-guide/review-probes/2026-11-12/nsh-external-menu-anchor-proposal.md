# Native external menu anchors: proposed scope and remaining callers

Status: proposed, not authorized for publication or dependency pinning.

The native graph selector and Favorites dots actions use permanent canonical
`context_menu` attachments on their existing Buttons. The existing LUI NSH
adapter forwards those Buttons into the public NSH `Menu` trigger slot. Native
More already uses this path in `deps/ui/native/chrome.ml`; its shared Web twin is
not the desktop implementation. These changes do not implement every external
menu in the application.

## Remaining actual callers

These shared modules are used by the native application; there are no native
module twins replacing the listed implementations. The inventory follows source
call paths and does not claim every path has been exercised in a native window.

| Owner | Existing external path | Required native treatment |
| --- | --- | --- |
| Favorites / Recent row secondary click | `Left_sidebar_view.lp_menu` and the delegated document context handler | Reuse the same canonical action items through a point-anchored native Menu. The dots Button attachment alone does not implement row secondary click. |
| Navigation editing | `Left_sidebar_view.nav_edit_menu` / `menu_box` | Attach a native Menu to the actual edit trigger, preserving native checkable items. |
| Plugin toolbar | `Left_sidebar_view.plugins_menu` / `menu_box` | Attach a native Menu to its trigger; convert passive custom action rows into canonical menu items. Embedded plugin UI needs an explicit rich-popover decision. |
| Right sidebar item actions | `Right_sidebar_view.item_menu` | Attach to the actual item action trigger or supply its retained native anchor. Convert passive action rows into canonical items. |
| Page heading secondary click | `Page_menu.view` with `with_app_items=false` | Reuse existing `page_items` with the frozen target rectangle and native Menu controller. Toolbar More already has a native owner. |
| Block / editor context actions | `Popups_view` main and nested menu popovers | Lower the action tree to canonical MenuItem/Submenu nodes once and supply the pointer/selection anchor. Native nested traversal must replace custom hover/focus bookkeeping. |
| Table and view actions | `Views_popup.show_menu`, `menu_level_scoped`, nested popovers | Reuse canonical native menu items/submenus at the retained trigger. The native view-type selector has already migrated independently. |
| Table and view search/select picker | `Views_popup.show_select` | Inspect the input, multiple selection and Apply/footer semantics; a rich picker should use native Popover/Dialog semantics rather than changing only its accessibility role. |
| Property configuration | `Properties_menu.menu_view` / `open_menu` through `Properties_popup.open_anchored` | Separate actual menu actions from form panes. Menu trees use the common native Menu anchor seam; editable panes use native Popover/Dialog. |
| Extends / reference selector | `Properties_value` inline `role=menu` popover | Inspect its search and selection behavior and use the appropriate native picker surface. |

Removing LUI's `role=menu` rejection without adding a native Menu controller is
insufficient. Generic external popovers currently use a core overlay with Dialog
semantics. Canonical MenuItems outside NSH's private MenuContext lack native
traversal and submenu state. Likewise, relabeling rich popovers is not evidence
that their controls and keyboard behavior match.

## Concrete NSH source proposal

An isolated, unpushed source draft is commit `5310584` on
`fix/external-menu-anchor-proposal`, based on the pinned NSH `2635333` revision.
The draft changes `crates/nsh-base/src/menu.rs`, its public exports, two regression
fixtures and the existing popup implementation documentation. It has not been
compiled or tested and is not the application's dependency.

The proposed Rust API is:

```rust
pub fn anchored_menu(
    open: Prop<Option<bool>>,
    anchor: Prop<OverlayAnchor>,
    focus_return: Option<ElementRef>,
    options: MenuSurfaceOptions,
    children: impl Fn() -> AnyElement + 'static,
    on_event: impl Fn(MenuEvent) + 'static,
) -> AnyElement;
```

`MenuSurfaceOptions` exposes the existing menu placement and appearance fields:
placement, alignment, offset, safe-area margin, popup classes/style, desktop
starting/ending classes/style and touch backdrop classes/style. Defaults match
Menu: bottom/start placement and no authored presentation. It adds no styled
library and does not choose application colors or animation tokens.

- The anchor is the existing public core `OverlayAnchor`: live native node,
  pointer point or explicit rectangle. No synthetic trigger or extra overlay is
  created. The existing surface performs collision placement and scrolling.
- `None` starts open and closes natively. `Some(bool)` uses the existing controlled
  request semantics. The caller can unmount a structurally owned popup after its
  native close notification, without requiring a second hidden open state.
- Selection, disabled traversal, keyboard entry, submenus, Escape, outside
  dismissal, focus return, sheet presentation and motion use the existing Menu
  surface and controllers. An outside press retains the user's new focus.
- One private owner isolates MenuContext and effects from sibling controls.
  Children are made lazily within that owner. Existing Menu and ContextMenu keep
  their component-child path without a new child-factory allocation.
- This is a Rust composition API. It does not add QuickJS types, change existing
  MenuProps/ContextMenuProps, or require exposing native refs through TSX props.

Illustrative native composition:

```rust
anchored_menu(
    None.into(),
    Prop::bind(move || OverlayAnchor::Point(pointer.get())),
    Some(actual_trigger),
    MenuSurfaceOptions::default(),
    move || render_canonical_items(),
    move |event| match event {
        MenuEvent::OpenChange(false, _) => dismiss_model_popup(),
        _ => {}
    },
)
```

This replaces repeated app-specific Menu controllers. It does not automatically
convert passive application rows into MenuItems or rich form panes into menus.
Those app changes remain necessary and belong in their shared adapters.

## Verification required before adoption

1. Review the API and authorize this additional fork scope; keep the existing
   immutable dependency pin until the implementation is accepted and verified.
2. Compile the source draft and run its native Menu traversal/submenu/focus-return
   and live-anchor identity regressions, then the existing Menu/ContextMenu suite.
3. Run NSH fmt, strict Clippy and compatibility checks on the exact approved
   revision. Check existing menu operation counts for regressions.
4. Integrate the API once into LUI's actual menu-role external popup lowering,
   preserving canonical lifetime and dismiss behavior. Add target-aware static
   diagnostics for any remaining statically rejected combinations and boundary
   checks for dynamic values.
5. Port the remaining app action trees to canonical items/submenus, and treat rich
   pickers separately. Test actual open/select/cancel/outside/keyboard paths on
   the release app and inspect screenshots; semantic presence is insufficient.
6. Publish the authorized immutable fork revision only after the required checks,
   update pins, and record final public contracts and migration examples in the
   API migration documents.

`spec-dev-tool --help` was attempted but the executable was unavailable on PATH;
this source review proposal has not passed that document validator. No tool
installation, compiler run, dependency pin change or fork push was performed for
this proposal.
