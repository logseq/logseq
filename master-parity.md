## G1 — editor core, selection, cursor

| Item | Status | Notes |
|------|--------|-------|
| Indent undo caret position | done | Captures `:editor/start-pos` on End/arrows; undo restores caret (`1e87a84d81`). |
| Zoom breadcrumb separator + link styling | done | Kit → semantic `/` + links (`de3b00d1fd`). |
| ArrowLeft at first block → page title | done | `arrow_edge` falls through to `focus_page_title` like cljs `.ls-page-title` neighbour (`459b2a5028`). |
| Shift+Click range select while editing | done | `modifier_select` exits edit before range; finish_exit preserves armed bar (`e090c6f6af`). |
| No action bar on Shift+arrow exit from edit | done | Removed LUI-only `show_action_bar` after exit; matches master timing where selection is empty when `show-action-bar!` runs (`3c04615938`). |
| Context menu mod shortcut labels (Ctrl vs ⌘) | done | Shared `mod_cap` with tag menus (`79bca8bdb3`). |
| Hide selection action bar when context menu opens | done | `open_cm` calls `hide_action_bar` like cljs `shui/popup-hide!` before dots dropdown (`0d523eebd3`). |
| `editor/open-link-in-sidebar` for `[[page]]` | done | `follow_link ~sidebar` uses `Sidebar_state.open_ref` (`c3e24b9b53`). |
| Shift+Up typed-char leak | n/a | Probes did not reproduce a typed char landing in block text; dropped. |
