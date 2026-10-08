//! Focus plumbing for the DOM `focus` dom-op plus the focus/blur
//! dom-event feed (web parity pieces missing from the generic dom-op
//! handler):
//!
//! - `el_focus` targets any element, not just inputs — non-input nodes
//!   (dialog buttons, links, tabindex containers) get a lazily-created
//!   `FocusHandle` registered in `shared.focus_nodes`, so
//!   `focused_node` and the keydown carrier walk see them.
//! - `document.activeElement` on the OCaml side is
//!   `Editor_dom.last_active_id`, fed by `focus`/`blur` dom-events —
//!   `reconcile` diffs the focused node each pump tick and emits the
//!   pair on every change.
//! - `focus` ops for nodes not yet materialized park in `PENDING` and
//!   retry each tick (e.g. autofocus racing the dialog's first patch).

use gpui_kit::gpui::{App, FocusHandle, Window};
use lui_core::store::NodeIdentity;
use lui_core::Property;
use lui_gpui::backend::Shared;
use serde_json::Value;
use std::sync::Mutex;

/// Focus ops that arrived before their target mounted — retried each
/// pump tick with a bounded attempt count (~2s at 60fps).
static PENDING: Mutex<Vec<(Value, u32)>> = Mutex::new(Vec::new());
/// Node the last `focus`/`blur` pair was emitted for.
static LAST_FOCUSED: Mutex<Option<i64>> = Mutex::new(None);

const MAX_PENDING_TICKS: u32 = 120;

/// Twin of lui-gpui domops::resolve_ref (`{"node-id": n}` or
/// `{"#ref"/"ref-id": "<accessibility-identifier>"}`; `#ref` <= 0 maps
/// to the store root — the documentElement/body placeholders).
fn resolve_ref(shared: &Shared, ref_: &Value) -> Option<i64> {
    if let Some(id) = ref_.get("node-id").and_then(Value::as_i64) {
        return Some(id);
    }
    if let Some(n) = ref_.get("#ref").and_then(Value::as_i64) {
        return if n <= 0 { shared.borrow().store.root } else { None };
    }
    let ident = ref_
        .get("#ref")
        .or_else(|| ref_.get("ref-id"))
        .and_then(Value::as_str)?;
    let guard = shared.borrow();
    guard
        .store
        .nodes
        .iter()
        .find(|(_, node)| {
            node.extension_props
                .get("accessibility-identifier")
                .and_then(|v| v.as_str())
                .or_else(|| node.string_prop(Property::AccessibilityIdentifier))
                == Some(ident)
        })
        .map(|(id, _)| *id)
}

/// dom.rs's carrier rule: nearest `logseq-*` extension ancestor-or-self,
/// excluding the conduit idents that own their input channel; falls
/// back to the first carrier in the tree.
fn is_dom_carrier(identifier: &str) -> bool {
    identifier.starts_with("logseq-")
        && !matches!(
            identifier,
            "logseq-editor" | "logseq-codemirror" | "logseq-em-emoji" | "logseq-katex"
                | "logseq-virt"
        )
}

fn carrier_of(store: &lui_core::store::Store, id: i64) -> Option<String> {
    match &store.node(id)?.identity {
        NodeIdentity::Extension { identifier, .. }
            if is_dom_carrier(identifier) =>
        {
            Some(identifier.clone())
        }
        _ => None,
    }
}

fn logseq_carrier(shared: &Shared, from: Option<i64>) -> Option<(i64, String)> {
    let shared = shared.borrow();
    let store = &shared.store;
    let mut cursor = from;
    while let Some(id) = cursor {
        if let Some(ident) = carrier_of(store, id) {
            return Some((id, ident));
        }
        cursor = store.node(id).and_then(|n| n.parent);
    }
    let mut stack: Vec<i64> = store.root.into_iter().collect();
    while let Some(id) = stack.pop() {
        if let Some(node) = store.node(id) {
            if let Some(ident) = carrier_of(store, id) {
                return Some((id, ident));
            }
            stack.extend(node.children.iter().copied());
        }
    }
    None
}

fn emit_dom_event(
    shared: &Shared,
    node_id: i64,
    name: &str,
    cx: &mut App,
) {
    let Some((carrier, ident)) = logseq_carrier(shared, Some(node_id)) else {
        return;
    };
    lui_gpui::dom::dom_event_via(
        shared,
        carrier,
        &ident,
        node_id,
        name,
        serde_json::json!({}),
        cx,
    );
}

/// Focus `node_id`: registered handles (inputs, textareas, the editor
/// conduit — all registered via `Shared::register_focus`) win;
/// everything else gets a lazily-minted generic handle.
fn focus_node_id(shared: &Shared, node_id: i64, window: &mut Window, cx: &mut App) {
    let handle = {
        let mut guard = shared.borrow_mut();
        if guard.store.node(node_id).is_none() {
            return;
        }
        match guard
            .focus_nodes
            .iter()
            .find(|(id, _)| *id == node_id)
            .map(|(_, h)| h.clone())
        {
            Some(h) => h,
            None => {
                let h: FocusHandle = cx.focus_handle().tab_stop(true);
                guard.register_focus(node_id, h.clone());
                h
            }
        }
    };
    handle.focus(window, cx);
}

/// Emit `blur`/`focus` dom-events when the focused node changed since
/// the last call — driven from the pump tick so programmatic focus,
/// click-to-focus and blur all land in `last_active_id`.
pub fn reconcile(shared: &Shared, window: &mut Window, cx: &mut App) {
    let current = shared.borrow_mut().focused_node(window);
    let prev = {
        let mut last = match LAST_FOCUSED.lock() {
            Ok(g) => g,
            Err(e) => e.into_inner(),
        };
        if *last == current {
            return;
        }
        std::mem::replace(&mut *last, current)
    };
    if let Some(old) = prev {
        emit_dom_event(shared, old, "blur", cx);
    }
    if let Some(new) = current {
        emit_dom_event(shared, new, "focus", cx);
    }
}

/// Retry parked focus ops whose targets have since materialized.
pub fn flush_pending(shared: &Shared, window: &mut Window, cx: &mut App) {
    let mut pending = match PENDING.lock() {
        Ok(g) => g,
        Err(e) => e.into_inner(),
    };
    let mut kept = Vec::new();
    for (ref_, attempts) in pending.drain(..) {
        match resolve_ref(shared, &ref_) {
            Some(node) => focus_node_id(shared, node, window, cx),
            None if attempts < MAX_PENDING_TICKS => kept.push((ref_, attempts + 1)),
            None => {}
        }
    }
    *pending = kept;
}

/// Claims the `focus` dom-op (returns `Some`); every other op passes
/// through (`None`).
pub fn handle_dom_op(
    op: &str,
    body: &str,
    shared: &Shared,
    window: &mut Window,
    cx: &mut App,
) -> Option<Vec<(String, Value)>> {
    if op != "focus" {
        return None;
    }
    let parsed: Value = serde_json::from_str(body).unwrap_or(Value::Null);
    let ref_ = parsed.get("ref").cloned().unwrap_or(Value::Null);
    match resolve_ref(shared, &ref_) {
        Some(node) => focus_node_id(shared, node, window, cx),
        None => {
            if let Ok(mut pending) = PENDING.lock() {
                pending.push((ref_, 0));
            }
        }
    }
    reconcile(shared, window, cx);
    Some(Vec::new())
}
