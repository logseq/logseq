//! `logseq-codemirror` — gpui-component `Editor` behind the extension node.
//!
//! Props: `lang` (tree-sitter language name), `value` (controlled text),
//! `read-only`, `uuid`/`source-role`/`style-class` (ignored or passed
//! through styling). Events go back as `cm-event`:
//!   {name:"input", value}           — every edit
//!   {name:"key",   key, value}      — Enter / Escape
//!   {name:"focus"|"blur"}           — focus transitions
//!
//! The web adapter skips writing `value` while the editor is focused; the
//! same rule applies here so an OCaml re-emit can never clobber a pending
//! keystroke.

use std::cell::RefCell;
use std::ffi::CString;
use std::rc::Rc;

use gpui_kit::component::input::{Editor, EditorState, InputEvent};
use gpui_kit::component::theme::ActiveTheme;
use gpui_kit::gpui::{
    div, px, AnyElement, AppContext, Context, ElementId, Focusable, InteractiveElement,
    IntoElement, ParentElement, Styled, Window,
};
use lui_core::wire::Value;

use lui_gpui::Shared;
use lui_gpui::extension::fire_extension;
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::style;

fn ext<'a>(node: &'a NodeSnapshot, name: &str) -> Option<&'a str> {
    node.extension_props.get(name).and_then(Value::as_str)
}

fn ext_bool(node: &NodeSnapshot, name: &str) -> bool {
    node.extension_props
        .get(name)
        .and_then(Value::as_bool)
        .unwrap_or(false)
}

/// Host-side per-node state, stored in `ComponentStates::app_state`.
struct CmState {
    editor: Option<gpui_kit::gpui::Entity<EditorState>>,
    /// Last `value` pushed into the editor — the wire value only wins
    /// while the editor is not focused.
    wire: RefCell<String>,
}

fn cm_state(view: &mut LuiNodeView) -> Rc<RefCell<CmState>> {
    if view.states.app_state.is_none() {
        view.states.app_state = Some(Rc::new(RefCell::new(CmState {
            editor: None,
            wire: RefCell::new(String::new()),
        })));
    }
    view.states
        .app_state
        .clone()
        .expect("app_state set")
        .downcast::<RefCell<CmState>>()
        .expect("app_state belongs to logseq-codemirror")
}

/// Push one `cm-event` into the OCaml runtime.
fn cm_event(shared: &Shared, node_id: i64, name: &str, fields: serde_json::Value, cx: &mut gpui_kit::gpui::App) {
    let identifier = CString::new("logseq-codemirror").unwrap();
    let event = CString::new("cm-event").unwrap();
    let mut values = serde_json::json!({ "name": name });
    if let serde_json::Value::Object(extra) = fields {
        for (k, v) in extra {
            values[k] = v;
        }
    }
    fire_extension(
        shared,
        node_id,
        identifier.as_c_str(),
        event.as_c_str(),
        values.to_string(),
        cx,
    );
}

pub fn render(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let node_id = node.id;
    let lang = ext(node, "lang").unwrap_or_default().to_string();
    let wire_value = ext(node, "value").unwrap_or_default().to_string();
    let read_only = ext_bool(node, "read-only");

    let cm = cm_state(view);
    if cm.borrow().editor.is_none() {
        let state = cx.new(|cx| {
            let mut state = EditorState::new(window, cx)
                .line_number(true)
                // The wrap sizes the editor to its content, so the code
                // editor's default "empty rows past the last line" scroll
                // room must go: it lets wheel deltas park the retained
                // editor state below its content (blank on remount) and
                // eats scroll the page should get.
                .scroll_beyond_last_line(Some(0));
            if !lang.is_empty() {
                state = state.language(lang.clone());
            }
            if !wire_value.is_empty() {
                state = state.default_value(wire_value.clone());
            }
            state.set_readonly(read_only, cx);
            state
        });
        *cm.borrow().wire.borrow_mut() = wire_value.clone();
        let shared = view.shared.clone();
        let subscription = cx.subscribe(&state, move |_this, state, event: &InputEvent, cx| {
            let value = state.read(cx).value().to_string();
            match event {
                InputEvent::Change => {
                    cm_event(&shared, node_id, "input", serde_json::json!({ "value": value }), cx);
                }
                InputEvent::PressEnter { .. } => {
                    cm_event(
                        &shared,
                        node_id,
                        "key",
                        serde_json::json!({ "key": "Enter", "value": value }),
                        cx,
                    );
                }
                InputEvent::Focus => {
                    cm_event(&shared, node_id, "focus", serde_json::json!({}), cx);
                }
                InputEvent::Blur => {
                    cm_event(&shared, node_id, "blur", serde_json::json!({ "value": value }), cx);
                }
            }
        });
        view.states.subscriptions.push(subscription);
        cm.borrow_mut().editor = Some(state);
    }
    let state = cm.borrow().editor.clone().expect("initialized");

    // Read-only + language sync on prop drift; both setters no-op when
    // the value is already current.
    state.update(cx, |state, cx| {
        state.set_readonly(read_only, cx);
        if !lang.is_empty() && state.language_name().as_str() != lang.as_str() {
            state.set_highlighter(lang.clone(), cx);
        }
    });

    // Controlled value: push the wire value only when it changed from the
    // last applied one AND the editor is not focused (typing in progress).
    if *cm.borrow().wire.borrow() != wire_value {
        let focused = state.read(cx).focus_handle(cx).is_focused(window);
        if !focused {
            *cm.borrow().wire.borrow_mut() = wire_value.clone();
            let current = state.read(cx).value().to_string();
            if current != wire_value {
                state.update(cx, |state, cx| {
                    state.set_value(wire_value.clone(), window, cx)
                });
            }
        }
    }

    let shared = view.shared.clone();
    // Root keydown forwarding needs the focused element's node — register
    // the editor's focus handle so keys route at the right target.
    shared
        .borrow_mut()
        .register_focus(node_id, state.read(cx).focus_handle(cx));
    // Web sizes the CodeMirror wrap to its content (height: auto); gpui's
    // Editor fills its parent, so a `~grow` wrap with unconstrained
    // height collapses to zero — give the wrap an explicit content
    // height from the value's line count.
    let lines = wire_value.lines().count().max(1);
    let line_h = state
        .read(cx)
        .line_height()
        .unwrap_or_else(|| px(20.));
    let editor_h = px(f32::from(line_h) * lines as f32 + 12.);
    let mut element = div()
        .id(ElementId::Integer(node.id as u64))
        .w_full()
        .min_h(editor_h)
        .child(Editor::new(&state));
    // Escape reaches us through the bubble phase even though the inner
    // input keymap consumes the Escape action itself.
    element = element.on_key_down(move |event, _window, cx| {
        if event.keystroke.key.as_str() == "escape" {
            let value = state.read(cx).value().to_string();
            cm_event(
                &shared,
                node_id,
                "key",
                serde_json::json!({ "key": "Escape", "value": value }),
                cx,
            );
        }
    });
    style::all(element, node, cx.theme()).into_any_element()
}
