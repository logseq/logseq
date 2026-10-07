//! Native menubar — the gpui counterpart of the Electron
//! `set_app_menu` template (deps/db-worker/desktop/electron_main.ml).
//!
//! Custom items dispatch `menu-*` platform events — the OCaml side
//! routes them exactly like the web/Electron menu commands
//! (native/menu_bar.ml). OS behaviors map to gpui actions and
//! `OsAction` items so the standard Edit menu works against
//! gpui-component inputs through the responder chain.
//!
//! Accelerators come from `cx.bind_keys` — the OS menu shows the
//! keystroke bound to each action. Only app-level chords that do not
//! reach the OCaml dom keymap are bound; in-app chords (`t l`, `g h`)
//! keep their existing route.

use gpui_kit::gpui::{
    actions, App, KeyBinding, Menu, MenuItem, OsAction, SystemMenuType,
};

extern "C" {
    fn lui_ocaml_platform_event(
        data: *const std::os::raw::c_char,
        length: std::os::raw::c_int,
    ) -> i32;
}

/// Post one `menu-*` envelope — same channel platform-request replies
/// use; OCaml emits any resulting patches through the normal sink.
fn menu_event(name: &str) {
    let envelope = format!("{name}\n{{}}");
    unsafe {
        lui_ocaml_platform_event(envelope.as_ptr().cast(), envelope.len() as i32);
    }
}

actions!(
    logseq_gpui_menu,
    [
        AboutLogseq,
        HideLogseq,
        HideOthers,
        ShowAll,
        QuitLogseq,
        CloseWindow,
        MinimizeWindow,
        ZoomWindow,
        CommandPalette,
        ToggleLeftSidebar,
        ToggleRightSidebar,
        ToggleWideMode,
        OpenSettings,
        OpenDocs,
        EditCut,
        EditCopy,
        EditPaste,
        EditSelectAll,
        EditUndo,
        EditRedo,
    ]
);

/// Register actions, key bindings, and the menubar. Call once inside
/// `app.run` — window-handle captures are resolved per dispatch through
/// `cx.windows()` so a re-opened window still works.
pub fn install(cx: &mut App) {
    cx.on_action(|_: &AboutLogseq, _cx| menu_event("menu-open-settings"));
    cx.on_action(|_: &HideLogseq, cx| cx.hide());
    cx.on_action(|_: &HideOthers, cx| cx.hide_other_apps());
    cx.on_action(|_: &ShowAll, cx| cx.unhide_other_apps());
    cx.on_action(|_: &QuitLogseq, cx| cx.quit());
    cx.on_action(|_: &CloseWindow, cx| {
        for window in cx.windows() {
            let _ = window.update(cx, |_, window, _cx| window.remove_window());
        }
    });
    cx.on_action(|_: &MinimizeWindow, cx| {
        for window in cx.windows() {
            let _ = window.update(cx, |_, window, _cx| window.minimize_window());
        }
    });
    cx.on_action(|_: &ZoomWindow, cx| {
        for window in cx.windows() {
            let _ = window.update(cx, |_, window, _cx| window.zoom_window());
        }
    });
    cx.on_action(|_: &CommandPalette, _cx| menu_event("menu-toggle-search"));
    cx.on_action(|_: &ToggleLeftSidebar, _cx| {
        menu_event("menu-toggle-left-sidebar")
    });
    cx.on_action(|_: &ToggleRightSidebar, _cx| {
        menu_event("menu-toggle-right-sidebar")
    });
    cx.on_action(|_: &ToggleWideMode, _cx| menu_event("menu-toggle-wide-mode"));
    cx.on_action(|_: &OpenSettings, _cx| menu_event("menu-open-settings"));
    cx.on_action(|_: &OpenDocs, cx| cx.open_url("https://docs.logseq.com"));
    // Edit items exist so the os_action wiring has a dispatchable action;
    // the responder chain does the real cut/copy/paste on focused inputs.
    cx.on_action(|_: &EditCut, _cx| {});
    cx.on_action(|_: &EditCopy, _cx| {});
    cx.on_action(|_: &EditPaste, _cx| {});
    cx.on_action(|_: &EditSelectAll, _cx| {});
    cx.on_action(|_: &EditUndo, _cx| {});
    cx.on_action(|_: &EditRedo, _cx| {});

    cx.bind_keys([
        KeyBinding::new("cmd-q", QuitLogseq, None),
        KeyBinding::new("cmd-h", HideLogseq, None),
        KeyBinding::new("cmd-alt-h", HideOthers, None),
        KeyBinding::new("cmd-m", MinimizeWindow, None),
        KeyBinding::new("cmd-w", CloseWindow, None),
        KeyBinding::new("cmd-,", OpenSettings, None),
    ]);

    cx.set_menus([
        Menu::new("Logseq").items([
            MenuItem::action("About Logseq", AboutLogseq),
            MenuItem::separator(),
            MenuItem::action("Settings…", OpenSettings),
            MenuItem::separator(),
            MenuItem::os_submenu("Services", SystemMenuType::Services),
            MenuItem::separator(),
            MenuItem::action("Hide Logseq", HideLogseq),
            MenuItem::action("Hide Others", HideOthers),
            MenuItem::action("Show All", ShowAll),
            MenuItem::separator(),
            MenuItem::action("Quit Logseq", QuitLogseq),
        ]),
        Menu::new("File").items([MenuItem::action("Close Window", CloseWindow)]),
        Menu::new("Edit").items([
            MenuItem::os_action("Undo", EditUndo, OsAction::Undo),
            MenuItem::os_action("Redo", EditRedo, OsAction::Redo),
            MenuItem::separator(),
            MenuItem::os_action("Cut", EditCut, OsAction::Cut),
            MenuItem::os_action("Copy", EditCopy, OsAction::Copy),
            MenuItem::os_action("Paste", EditPaste, OsAction::Paste),
            MenuItem::os_action("Select All", EditSelectAll, OsAction::SelectAll),
        ]),
        Menu::new("View").items([
            MenuItem::action("Command Palette", CommandPalette),
            MenuItem::separator(),
            MenuItem::action("Toggle Left Sidebar", ToggleLeftSidebar),
            MenuItem::action("Toggle Right Sidebar", ToggleRightSidebar),
            MenuItem::separator(),
            MenuItem::action("Toggle Wide Mode", ToggleWideMode),
        ]),
        Menu::new("Window").items([
            MenuItem::action("Minimize", MinimizeWindow),
            MenuItem::action("Zoom", ZoomWindow),
        ]),
        Menu::new("Help").items([MenuItem::action("Documentation", OpenDocs)]),
    ]);
}
