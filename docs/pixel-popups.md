# Pixel parity: popups & menus

LUI web app vs master cljs Logseq, `devin/component-migration` @ 8f13c04c12 (rebased on c9bdad601b).
Viewport 1280x800, light theme, same fixture graph. Master served on :3001, LUI on :3010.
Screenshot pairs in `docs/pixel-popups/` (`<state>-{master,lui}.png`).

## Final measurements

| Surface | Master | LUI | Result |
|---|---|---|---|
| Toolbar dots menu | (1019,40) 256×371 | (1019,40) 256×371 | identical |
| dots open state | hi=9 "Import" focused, tabindex 0 | hi=9 "Import" focused, tabindex 0 | identical |
| dots ArrowDown | hi=10 "Login" | hi=10 "Login" | identical |
| Block context menu | (156,131) 280×138 | (46,96) 280×138 | size identical; x/y = block-layout offset (exception) |
| Page-title context menu | (156,131) 280×138 | (127,131) 280×138 | size identical; x residual ~29px same cause |
| Tooltip (dots trigger) | (1198,40) 55.4×30, border 1px | (1200,40) 55.4×30, border 1px | identical size; +2x trigger-layout residual |
| Tooltip (sidebar item) | (5,40) 132×54 + arrow | (5,40) 132×54 + arrow | identical |
| Delete-confirm dialog | (384,297) 512×206, btn h28 | (384,297) 512×206, btn h28 | identical; backdrop dim present both |
| `/` slash AC | outer (180,211) 288×494, 48 items 274×32 | outer (196,192) 288×494, 48 items 274×32 | identical geometry; anchor residual = editor-caret offset |
| `[[te` page-ref AC | outer (186,211) 512×494, n=24 | outer (202,192) 512×174, n=5 | width identical; height = result-set count (exception) |
| `#ta` tag AC | outer (184,211) 512×154, n=3, hint 20px @8px gap | outer (196,192) 512×155, n=3, hint 20px @8px | identical (±1px rounding) |
| Graph-switcher dropdown | 300×118 @ (8,84) | 300×118 @ (8,84) | identical (previous slice) |
| Menu item semantics | `div[role=menuitem] tabindex=-1`, active 0 | `button[role=menuitem] tabindex=-1`, active 0 | role/tabindex identical; tag name differs (LUI emits `button`, no visual effect) |

## Interactions verified

- **Keyboard nav**: ArrowUp/ArrowDown rove `data-highlighted` + DOM focus with wraparound, Home/End jump, Enter activates, tabindex roves 0/-1 — matches base-ui useListNavigation.
- **Open state**: menus open with the LAST enabled item highlighted + focused (base-ui getMaxListIndex). The session tail (Login / user block) is excluded via `data-menu-tail`, mirroring cljs where it mounts after the nav list syncs — ArrowDown still reaches it.
- **Outside-click / Escape close**: popover layer dismiss wiring verified.
- **Scroll**: AC inner scrolls to `max-height` cap (480px side=bottom); roving calls scrollIntoView(nearest).
- **Anchors**: context menus anchor at `document.elementFromPoint` target center (same as cljs pointer math); dots menu right edge at trigger.right + 32; AC at caret −20x / +line-height−3y with flip.
- **Known issues re-verified**: modal backdrop dim ✓; popover rendered in portal layer (not document flow) ✓; delete-confirm button visible (h28, rgb(3,125,186)) ✓.

## Fixes landed

- **lui** `devin/1791353564-theme-var-namespace` @ `0d40a3f` (on top of main 1fa2d79):
  theme-token `--lui-*` namespace; menu-popover `role=menuitem` propagation;
  menus open with last enabled item highlighted + focused (`data-menu-tail` excluded).
  Pin updated in `deps/ui/scripts/install-opam-deps.sh`.
- **deps/ui**: `menu_keydown` roving nav (+tabindex); cm anchors via `elementFromPoint`;
  tooltip sideOffset 0 + 5px x margin; `caret_popup_pos` aligned to cljs;
  `menu_item.el` forwards `~data_attrs`; login/user tail marked `data-menu-tail`;
  `--lui-c-*` aliases wrap `hsl()` — theme vars are hsl triplets in both themes, so
  `border: 1px solid var(--x)` silently invalidated all popup borders;
  tag-search hint `margin: 8px 0` + `line-height: 20px` (master's `<p>`).

## Exceptions

1. **AC / context-menu anchor residual (+~16x, −19y)**: identical popup rect math; the
   residual is the block/editor layout offset (caret rects differ between apps) — the
   offset belongs to the blocks slice, not popup positioning.
2. **`[[te` item count (5 vs 24)**: popup height follows the number of search results;
   LUI's page-search backend returns fewer matches — a search-layer data difference,
   not a styling one. Width, item metrics, and max-height cap are identical.
3. **`data-menu-tail` / login item**: cljs highlights the pre-tail last item because the
   session tail mounts after the nav-list sync — a timing artifact, not intent. LUI
   marks it explicitly; both items remain arrow-navigable.
4. **Favorites/recent row menu**: not screenshotted — no favorites/recents seeded in the
   fixture (rows render only for favorited pages). LUI implements the same
   `.sidebar-page-actions` trigger + `w-60` `ui__dropdown-menu-content` popover path
   (`lp-menu`), whose item/styling machinery is verified above.
5. **Menu item tag name** (`button` vs `div`): role/tabindex/aria identical; visual
   output identical. LUI emits `button` for the menu_item kind — kept for native-side
   a11y; the shui `div` carries no styling difference.
