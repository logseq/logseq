//! `logseq-editor` conduit — the gpui host half of the shared-OCaml
//! editor surface (deps/ui/docs/editor-surface-extension.md).
//!
//! The OCaml twin (`gpui/logseq_editor.ml`, copied from `native/`) emits a
//! `logseq-editor` extension node whose `runs` prop zips in document
//! order against the `.ed-r` text runs rendered inside the enclosing
//! `.block-editor` column. This module supplies the platform half:
//!
//! - a specialized extension renderer: an invisible focusable element
//!   that registers an `ElementInputHandler` during paint, routing
//!   keystrokes and IME marked text into OCaml as `key` / `insert` /
//!   `composition` / `focus` / `blur` extension events — the same wire
//!   vocabulary the web adapter emits. Mouse presses inside the block
//!   editor hit-test to model offsets and arrive as `pointer` events.
//!
//! - the measurement dom-ops (`caret-rect` / `offset-at` /
//!   `line-ranges` / `scroll-height` / `set-input-focus`), computed from
//!   the rendered run nodes: `shared.node_bounds` supplies window-space
//!   element rects and the gpui text system shapes each run's line for
//!   glyph positions. Replies return through the platform-event channel;
//!   px are relative to the `.block-editor` container and offsets are
//!   UTF-8 model bytes (native units — no UTF-16 boundary translation;
//!   see the units note in the design doc).

use std::cell::RefCell;
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::ops::Range;
use std::sync::{Arc, Mutex};

use gpui_kit::gpui::{
    canvas, div, px, AnyElement, App, AppContext, Bounds, Context, DispatchPhase,
    ElementInputHandler, Entity, EntityId, EntityInputHandler, FocusHandle, FocusOutEvent,
    InteractiveElement, LineLayout, MouseButton, MouseDownEvent, ParentElement, Pixels,
    Point, Styled, Subscription, UTF16Selection, Window,
};
use gpui_kit::IntoElement;
use lui_core::bridge;
use lui_core::store::{Node, NodeIdentity, Store};
use lui_core::wire::Value as WireValue;
use lui_core::Property;
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::{drain_pending, Shared};
use serde_json::{json, Value};

const IDENTIFIER: &str = "logseq-editor";

// ---------------------------------------------------------------------------
// Store lookups
// ---------------------------------------------------------------------------

fn style_class(node: &Node) -> Option<&str> {
    node.string_prop(Property::StyleClass).or_else(|| {
        node.extension_props
            .get("style-class")
            .and_then(WireValue::as_str)
    })
}

fn has_class(node: &Node, name: &str) -> bool {
    style_class(node)
        .map(|classes| classes.split_whitespace().any(|t| t == name))
        .unwrap_or(false)
}

/// The `logseq-editor` extension node carrying this `block-id`.
fn find_editor_node(store: &Store, block_id: &str) -> Option<i64> {
    store
        .nodes
        .iter()
        .find(|(_, node)| {
            matches!(&node.identity, NodeIdentity::Extension { identifier, .. }
                if identifier.as_str() == IDENTIFIER)
                && node
                    .extension_props
                    .get("block-id")
                    .and_then(WireValue::as_str)
                    == Some(block_id)
        })
        .map(|(id, _)| *id)
}

/// The `.block-editor` column enclosing the sink node (the web twin's
/// `closest(".block-editor")`; falls back to the sink's own parent).
fn container_of(store: &Store, sink: i64) -> Option<i64> {
    let mut cursor = Some(sink);
    while let Some(id) = cursor {
        let node = store.node(id)?;
        if has_class(node, "block-editor") {
            return Some(id);
        }
        cursor = node.parent;
    }
    store.node(sink).and_then(|node| node.parent)
}

/// `.ed-r` nodes inside `root`, in document order — zipped index-wise
/// with the `runs` prop entries.
fn collect_run_nodes(store: &Store, id: i64, out: &mut Vec<i64>) {
    let Some(node) = store.node(id) else { return };
    for &child in &node.children {
        let Some(child_node) = store.node(child) else {
            continue;
        };
        if has_class(child_node, "ed-r") {
            out.push(child);
        } else {
            collect_run_nodes(store, child, out);
        }
    }
}

/// `runs` prop: "a,b,k;…" — [start, end) model-byte span plus tag
/// (p=plain d=delim a=pill r=raw z=pad) per `.ed-r` element.
fn parse_runs_prop(node: &Node) -> Vec<(i64, i64, u8)> {
    node.extension_props
        .get("runs")
        .and_then(WireValue::as_str)
        .map(|raw| {
            raw.split(';')
                .filter_map(|entry| {
                    let mut parts = entry.split(',');
                    let lo = parts.next()?.parse::<i64>().ok()?;
                    let hi = parts.next()?.parse::<i64>().ok()?;
                    let tag = parts.next()?.bytes().next().unwrap_or(b'p');
                    Some((lo, hi, tag))
                })
                .collect()
        })
        .unwrap_or_default()
}

/// One `.ed-r` run element zipped with its `runs` prop span.
struct Run {
    node: i64,
    /// [lo, hi) model-byte span this element renders.
    lo: i64,
    hi: i64,
    tag: u8,
    /// The `.ed-line` row this run renders inside.
    row: i64,
}

fn run_text(store: &Store, node_id: i64) -> String {
    store
        .node(node_id)
        .and_then(|node| {
            node.string_prop(Property::TextValue)
                .or_else(|| node.string_prop(Property::TitleValue))
        })
        .unwrap_or("")
        .to_string()
}

/// The enclosing `.ed-line` row for a run node.
fn row_of(store: &Store, run_node: i64) -> Option<i64> {
    let mut cursor = store.node(run_node).and_then(|node| node.parent);
    while let Some(id) = cursor {
        let node = store.node(id)?;
        if has_class(node, "ed-line") {
            return Some(id);
        }
        cursor = node.parent;
    }
    None
}

/// `(container, runs in document order)` for the block's editor node.
fn editor_runs(store: &Store, editor: i64) -> Option<(i64, Vec<Run>)> {
    let container = container_of(store, editor)?;
    let spans = parse_runs_prop(store.node(editor)?);
    let mut run_nodes = Vec::new();
    collect_run_nodes(store, container, &mut run_nodes);
    let runs = run_nodes
        .into_iter()
        .zip(spans)
        .map(|(node, (lo, hi, tag))| Run {
            node,
            lo,
            hi,
            tag,
            row: row_of(store, node).unwrap_or(container),
        })
        .collect();
    Some((container, runs))
}

fn node_bounds(shared: &Shared, node_id: i64) -> Option<Bounds<Pixels>> {
    shared.borrow().node_bounds.get(&node_id).copied()
}

/// Runs grouped by their `.ed-line` row, rows in document order:
/// `(row node, indices into `runs`)`.
fn rows_of<'a>(runs: &'a [Run]) -> Vec<(i64, Vec<&'a Run>)> {
    let mut rows: Vec<(i64, Vec<&Run>)> = Vec::new();
    for run in runs {
        match rows.last_mut() {
            Some((row, members)) if *row == run.row => members.push(run),
            _ => rows.push((run.row, vec![run])),
        }
    }
    rows
}

// ---------------------------------------------------------------------------
// Measurement — gpui text layout over the rendered run nodes
// ---------------------------------------------------------------------------

/// Shape one run's text the way the node renderer lays it out: the
/// window text style as a single font run (no `text-*`/`font-*` tokens
/// reach the `.ed-r` style classes).
fn layout_run(text: &str, window: &mut Window) -> Arc<LineLayout> {
    let style = window.text_style();
    let font_size = style.font_size.to_pixels(window.rem_size());
    let run = style.to_run(text.len());
    window
        .text_system()
        .layout_line(text, font_size, &[run], None)
}

/// Snap `index` back onto a UTF-8 boundary (gpui indices are bytes).
fn utf8_floor(text: &str, mut index: usize) -> usize {
    index = index.min(text.len());
    while index > 0 && !text.is_char_boundary(index) {
        index -= 1;
    }
    index
}

/// `(x, y, height, container origin)` of the caret at model-byte `off`:
/// x/y/h are px relative to the `.block-editor` container (what the
/// conduit overlay draws in), origin is the container's window-space
/// top-left (what the popup anchor adds back to land in viewport px —
/// the web twin's caretPopupPos contract).
fn caret_rect(
    shared: &Shared,
    block_id: &str,
    off: i64,
    window: &mut Window,
) -> Option<(f32, f32, f32, Pixels, Pixels)> {
    let (container, runs) = {
        let shared = shared.borrow();
        let editor = find_editor_node(&shared.store, block_id)?;
        editor_runs(&shared.store, editor)
    }?;
    let origin = node_bounds(shared, container)?.origin;
    for run in &runs {
        if !(run.lo <= off && off <= run.hi) {
            continue;
        }
        let Some(bounds) = node_bounds(shared, run.node) else {
            continue;
        };
        let x = if run.tag == b'a' {
            // Pill: the caret sits on whichever edge the offset reaches.
            if off >= run.hi {
                bounds.origin.x + bounds.size.width
            } else {
                bounds.origin.x
            }
        } else {
            let text = run_text(&shared.borrow().store, run.node);
            // Pads ("z") cover [e, e): their ZWSP pins index 0.
            let index = if run.tag == b'z' {
                0
            } else {
                utf8_floor(&text, (off - run.lo).max(0) as usize)
            };
            bounds.origin.x + layout_run(&text, window).x_for_index(index)
        };
        return Some((
            f32::from(x - origin.x),
            f32::from(bounds.origin.y - origin.y),
            f32::from(bounds.size.height),
            origin.x,
            origin.y,
        ));
    }
    None
}

/// Model-byte offset under `wx` (window px) inside `run`'s bounds.
fn offset_in_run(
    shared: &Shared,
    run: &Run,
    bounds: Bounds<Pixels>,
    wx: Pixels,
    window: &mut Window,
) -> i64 {
    match run.tag {
        // Pads hit the line-end offset; pill interiors expand;
        // marked (IME composition) text is zero-width in model coords —
        // a click anywhere inside it lands on the composition start.
        b'z' => run.lo,
        b'c' => run.lo,
        b'a' => run.lo + 1,
        _ => {
            let text = run_text(&shared.borrow().store, run.node);
            let index =
                layout_run(&text, window).closest_index_for_x(wx - bounds.origin.x);
            run.lo + utf8_floor(&text, index) as i64
        }
    }
}

/// `(x, y)` block-editor-relative px -> model-byte offset. The visual
/// line is the `.ed-line` row containing `y` (nearest row when `y`
/// falls outside all rows); inside the row the first run whose bounds
/// cover `x` wins, otherwise the closest boundary.
fn offset_at(
    shared: &Shared,
    block_id: &str,
    x: i64,
    y: i64,
    window: &mut Window,
) -> Option<i64> {
    let (container, runs) = {
        let shared = shared.borrow();
        let editor = find_editor_node(&shared.store, block_id)?;
        editor_runs(&shared.store, editor)
    }?;
    let origin = node_bounds(shared, container)?.origin;
    let wx = origin.x + px(x as f32);
    let wy = f32::from(origin.y) + y as f32;

    let rows = rows_of(&runs);
    let mut chosen = None;
    let mut best_dist = f32::MAX;
    for row in &rows {
        let Some(bounds) = node_bounds(shared, row.0) else {
            continue;
        };
        let top = f32::from(bounds.origin.y);
        let bottom = f32::from(bounds.origin.y + bounds.size.height);
        if wy >= top && wy < bottom {
            chosen = Some(row);
            break;
        }
        let dist = if wy < top { top - wy } else { wy - bottom };
        if dist < best_dist {
            best_dist = dist;
            chosen = Some(row);
        }
    }
    let (_, members) = chosen?;

    let mut end = None;
    for run in members {
        let Some(bounds) = node_bounds(shared, run.node) else {
            continue;
        };
        if wx < bounds.origin.x {
            return Some(run.lo);
        }
        if wx <= bounds.origin.x + bounds.size.width {
            return Some(offset_in_run(shared, run, bounds, wx, window));
        }
        end = Some(run.hi);
    }
    end
}

/// Visual lines as `[lo, hi)` model-byte ranges — one per `.ed-line`
/// row (gpui rows do not wrap, so rows are the visual lines).
fn line_ranges(shared: &Shared, block_id: &str) -> Vec<(i64, i64)> {
    let runs = {
        let shared = shared.borrow();
        let Some(editor) = find_editor_node(&shared.store, block_id) else {
            return Vec::new();
        };
        match editor_runs(&shared.store, editor) {
            Some((_, runs)) => runs,
            None => return Vec::new(),
        }
    };
    rows_of(&runs)
        .iter()
        .filter_map(|(_, members)| {
            let lo = members.first().map(|run| run.lo)?;
            let hi = members.last().map(|run| run.hi)?;
            Some((lo, hi))
        })
        .collect()
}

/// Content height (px) of the block editor's text — the bottom edge of
/// the lowest `.ed-line` row relative to the container top.
fn scroll_height(shared: &Shared, block_id: &str) -> i64 {
    let (container, runs) = {
        let shared = shared.borrow();
        let Some(editor) = find_editor_node(&shared.store, block_id) else {
            return 0;
        };
        match editor_runs(&shared.store, editor) {
            Some(pair) => pair,
            None => return 0,
        }
    };
    let Some(top) = node_bounds(shared, container).map(|b| b.origin.y) else {
        return 0;
    };
    let bottom = rows_of(&runs)
        .iter()
        .filter_map(|(row, _)| node_bounds(shared, *row))
        .map(|bounds| bounds.origin.y + bounds.size.height)
        .fold(top, |acc, y| acc.max(y));
    f32::from(bottom - top).round() as i64
}

// ---------------------------------------------------------------------------
// Emit: extension events back into OCaml, then drain any patches
// ---------------------------------------------------------------------------

/// FFI half of `emit`: posts the conduit event to OCaml but skips
/// `drain_pending`. Safe to call mid-render, where re-borrowing the
/// store to apply patches would panic; queued replies are applied by
/// the next pump tick.
fn emit_ffi(node_id: i64, name: &CStr, values: String) {
    let values = CString::new(values).unwrap_or_default();
    unsafe {
        bridge::lui_ocaml_extension_event(
            node_id,
            c"logseq-editor".as_ptr(),
            name.as_ptr(),
            values.as_ptr(),
        )
    };
}

fn emit(shared: &Shared, node_id: i64, name: &CStr, values: String, cx: &mut App) {
    emit_ffi(node_id, name, values);
    drain_pending(shared, cx);
}

// ---------------------------------------------------------------------------
// Input surface — EntityInputHandler for the editor's invisible input
// ---------------------------------------------------------------------------

/// Per-sink input state. The scratch `text`/`marked` pair only mirrors
/// in-flight IME marked text so the platform's UTF-16 ranges stay
/// consistent during a composition — the block buffer itself lives in
/// the OCaml `Edit_model`, so committed text is never applied twice.
struct EditorInputState {
    node_id: i64,
    shared: Shared,
    focus: FocusHandle,
    /// The LuiNodeView entity that renders this conduit — notified after
    /// a focus grant so its canvas repaints and registers the input
    /// handler (`handle_input` only registers a focused handler at paint
    /// time, and a deferred grant lands after the element's first paint).
    view_entity_id: EntityId,
    /// Marked (composing) text + its UTF-16 range in `text`.
    marked: Option<(String, Range<usize>)>,
    /// Scratch buffer reported to the platform — holds the marked text
    /// while a composition is live, empty otherwise.
    text: String,
    subs: Vec<Subscription>,
}

/// node id -> input entity, keyed by the `logseq-editor` node. Entries
/// outlive dropped nodes; bounded by mounted editors. Global (not
/// thread-local) because `on_next_frame` pump callbacks and render run
/// on different threads — a thread-local map looks empty to the pump.
static INPUT_STATES: std::sync::LazyLock<Mutex<HashMap<i64, Entity<EditorInputState>>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

thread_local! {
    /// block-id -> desired focus state: `set-input-focus` can race ahead
    /// of the surface mount (the request is emitted once on the OCaml
    /// side), so it's drained when the input entity is created.
    static PENDING_FOCUS: RefCell<HashMap<String, bool>> =
        RefCell::new(HashMap::new());
}

fn input_state(
    node_id: i64,
    shared: &Shared,
    cx: &mut Context<LuiNodeView>,
) -> Entity<EditorInputState> {
    let mut states = INPUT_STATES.lock().unwrap();
    if let Some(state) = states.get(&node_id) {
        return state.clone();
    }
    let shared = shared.clone();
    let view_entity_id = cx.entity_id();
    let state = cx.new(|cx| EditorInputState {
        node_id,
        shared,
        focus: cx.focus_handle(),
        view_entity_id,
        marked: None,
        text: String::new(),
        subs: Vec::new(),
    });
    states.insert(node_id, state.clone());
    state
}

fn ext_int_prop(store: &Store, node_id: i64, name: &str) -> Option<i64> {
    store
        .node(node_id)
        .and_then(|node| node.extension_props.get(name))
        .and_then(WireValue::as_int)
}

fn ext_str_prop(store: &Store, node_id: i64, name: &str) -> Option<String> {
    store
        .node(node_id)
        .and_then(|node| node.extension_props.get(name))
        .and_then(WireValue::as_str)
        .map(str::to_owned)
}

impl EditorInputState {
    fn emit(&mut self, name: &'static CStr, values: String, cx: &mut App) {
        emit(&self.shared, self.node_id, name, values, cx);
    }

    fn block_id(&self) -> Option<String> {
        ext_str_prop(&self.shared.borrow().store, self.node_id, "block-id")
    }

    /// Caret rect for the IME candidate window, in window space.
    fn caret_bounds(
        &mut self,
        _element_bounds: Bounds<Pixels>,
        window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<Bounds<Pixels>> {
        let shared = self.shared.clone();
        let block_id = self.block_id()?;
        let caret = ext_int_prop(&shared.borrow().store, self.node_id, "caret")?;
        let (x, y, h, ox, oy) = caret_rect(&shared, &block_id, caret, window)?;
        Some(Bounds::new(
            gpui_kit::gpui::point(ox + px(x), oy + px(y)),
            gpui_kit::gpui::size(px(0.), px(h)),
        ))
    }
}

impl EntityInputHandler for EditorInputState {
    /// The platform queries our buffer through these — report the
    /// scratch text (marked text only); outside a composition the real
    /// model owns the buffer so there is nothing to report.
    fn text_for_range(
        &mut self,
        range: Range<usize>,
        _adjusted_range: &mut Option<Range<usize>>,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<String> {
        utf16_slice(&self.text, range)
    }

    fn selected_text_range(
        &mut self,
        _ignore_disabled_input: bool,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<UTF16Selection> {
        Some(UTF16Selection {
            range: 0..0,
            reversed: false,
        })
    }

    fn marked_text_range(
        &self,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<Range<usize>> {
        self.marked.as_ref().map(|(_, range)| range.clone())
    }

    /// Marked text disappeared without a commit — IME cancel.
    fn unmark_text(&mut self, _window: &mut Window, cx: &mut Context<Self>) {
        if self.marked.take().is_some() {
            self.text.clear();
            self.emit(c"composition", "{\"state\":\"cancel\"}".into(), cx);
        }
    }

    fn replace_text_in_range(
        &mut self,
        _range: Option<Range<usize>>,
        text: &str,
        _window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.marked.take().is_some() {
            // Commit of the marked range — the model's composition prop
            // already mirrors the marked text; `end` splices `text` in.
            self.text.clear();
            let json = json!({ "state": "end", "text": text, "range": "" });
            self.emit(c"composition", json.to_string(), cx);
        } else if !text.is_empty() {
            let json = json!({ "text": text });
            self.emit(c"insert", json.to_string(), cx);
        }
    }

    fn replace_and_mark_text_in_range(
        &mut self,
        _range: Option<Range<usize>>,
        new_text: &str,
        _new_selected_range: Option<Range<usize>>,
        _window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.marked.is_none() {
            self.emit(c"composition", "{\"state\":\"start\"}".into(), cx);
        }
        let len = new_text.encode_utf16().count();
        self.text = new_text.to_string();
        self.marked = Some((new_text.to_string(), 0..len));
        let json = json!({
            "state": "update",
            "text": new_text,
            "range": format!("0,{len}"),
        });
        self.emit(c"composition", json.to_string(), cx);
    }

    /// IME candidate window anchor — the caret rect in window space.
    fn bounds_for_range(
        &mut self,
        _range_utf16: Range<usize>,
        element_bounds: Bounds<Pixels>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Option<Bounds<Pixels>> {
        Some(
            self.caret_bounds(element_bounds, window, cx)
                .unwrap_or(element_bounds),
        )
    }

    fn character_index_for_point(
        &mut self,
        _point: Point<Pixels>,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<usize> {
        None
    }

    fn text_length_utf16(
        &mut self,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<usize> {
        Some(self.text.encode_utf16().count())
    }
}

/// UTF-16 range -> slice of `text`, snapped to boundaries.
fn utf16_slice(text: &str, range: Range<usize>) -> Option<String> {
    let mut start_byte = None;
    let mut end_byte = None;
    for (utf16_ix, (byte_ix, ch)) in text.char_indices().enumerate() {
        if utf16_ix == range.start {
            start_byte = Some(byte_ix);
        }
        let end = utf16_ix + ch.len_utf16();
        if end == range.end {
            end_byte = Some(byte_ix + ch.len_utf8());
        }
    }
    if range.start == text.encode_utf16().count() {
        start_byte = Some(text.len());
    }
    if range.end == text.encode_utf16().count() {
        end_byte = Some(text.len());
    }
    match (start_byte, end_byte) {
        (Some(a), Some(b)) if a <= b => Some(text[a..b].to_string()),
        _ if range.is_empty() => Some(String::new()),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Renderer + mouse/key listeners
// ---------------------------------------------------------------------------

/// gpui key name -> the DOM `KeyboardEvent.key` the model expects.
fn dom_key_name(key: &str) -> &str {
    match key {
        "left" => "ArrowLeft",
        "right" => "ArrowRight",
        "up" => "ArrowUp",
        "down" => "ArrowDown",
        "backspace" => "Backspace",
        "enter" => "Enter",
        "tab" => "Tab",
        "escape" => "Escape",
        "home" => "Home",
        "end" => "End",
        "delete" => "Delete",
        "pageup" => "PageUp",
        "pagedown" => "PageDown",
        "space" => " ",
        other => other,
    }
}

/// Click inside this node's `.block-editor` container: hit-test to a
/// model offset, focus the input, emit `pointer` (extend = shift).
fn pointer_down(
    shared: &Shared,
    node_id: i64,
    event: &MouseDownEvent,
    window: &mut Window,
    cx: &mut App,
) {
    if event.button != MouseButton::Left {
        return;
    }
    let (container, block_id) = {
        let shared = shared.borrow();
        let Some(block_id) = ext_str_prop(&shared.store, node_id, "block-id")
        else {
            return;
        };
        match container_of(&shared.store, node_id) {
            Some(container) => (container, block_id),
            None => return,
        }
    };
    let Some(bounds) = node_bounds(shared, container) else {
        return;
    };
    let point = event.position;
    if !bounds.contains(&point) {
        return;
    }
    // Focus is only ever granted by OCaml's `set-input-focus`, emitted
    // once this click turns into editing state — a conduit that holds
    // gpui focus without a grant swallows every keystroke (plain chars
    // insert into an invisible editor; global chords like `t l` and
    // ⌘[ never reach the document keydown handler).
    let offset = offset_at(
        shared,
        &block_id,
        f32::from(point.x - bounds.origin.x) as i64,
        f32::from(point.y - bounds.origin.y) as i64,
        window,
    );
    if let Some(offset) = offset {
        let json = json!({ "offset": offset, "extend": event.modifiers.shift });
        emit(shared, node_id, c"pointer", json.to_string(), cx);
    }
}

/// Grant focus to a conduit and report it deterministically: the
/// entity-scoped `on_focus` subscription is not reliable on the
/// deferred/`on_next_frame` path (it fires on direct `focus()` during
/// an event dispatch but has been observed not to fire when the grant
/// lands in a frame callback), so the conduit event is emitted from
/// the grant site itself. A duplicate `focus` emit is idempotent on
/// the OCaml side (`focused_block := uuid` either way).
fn grant_focus(
    state: &Entity<EditorInputState>,
    window: &mut Window,
    cx: &mut App,
) {
    let focus = state.read(cx).focus.clone();
    let was = focus.is_focused(window);
    focus.focus(window, cx);
    let now = focus.is_focused(window);
    if !was && now {
        state.update(cx, |this, cx| this.emit(c"focus", "{}".into(), cx));
        // the canvas paint that registers the input handler ran before
        // this grant (set-input-focus races the mount), so it skipped
        // the focus check — invalidate the node view to re-paint it
        let view_entity_id = state.read(cx).view_entity_id;
        cx.notify(view_entity_id);
    }
}

fn focus_editor(node_id: i64, window: &mut Window, cx: &mut App) {
    let Some(state) = INPUT_STATES.lock().unwrap().get(&node_id).cloned()
    else {
        return;
    };
    grant_focus(&state, window, cx);
}

/// Reconcile focused conduit state once per pump tick:
///
/// - Blur a conduit whose node left the store while it still held window
///   focus. `window.focus` is not cleared when a focused element
///   unmounts, and `INPUT_STATES` retains the `FocusHandle`, so the stale
///   id keeps `window.focused()` non-empty — which makes the root key
///   forwarder swallow printable keys as if a text input were still
///   live. Blurring fires `focus_out`, which emits the conduit `blur`
///   event so OCaml can commit the buffer.
///
/// - Notify the focused conduit's view every tick. gpui recomputes
///   `focused_text_input_active` at the end of every drawn frame from
///   the elements that called `handle_input` during that paint; on any
///   frame where the conduit canvas does not repaint, the platform input
///   handler is unregistered and `insertText` is silently dropped.
///   Keeping the view dirty each tick keeps the handler registered.
pub(crate) fn reconcile_stale_focus(shared: &Shared, window: &mut Window, cx: &mut App) {
    let states: Vec<(i64, Entity<EditorInputState>)> = INPUT_STATES
        .lock()
        .unwrap()
        .iter()
        .map(|(node_id, state)| (*node_id, state.clone()))
        .collect();
    let mut prune: Vec<i64> = Vec::new();
    for (node_id, state) in states {
        let (view_entity_id, focused) = {
            let state = state.read(cx);
            (state.view_entity_id, state.focus.is_focused(window))
        };
        let present = shared.borrow().store.node(node_id).is_some();
        if !present {
            // Node left the store: blur once (fires `focus_out` -> conduit
            // `blur` so OCaml commits the buffer), then drop the entry.
            if focused {
                window.blur(cx);
                state.update(cx, |this, cx| this.emit(c"blur", "{}".into(), cx));
            }
            prune.push(node_id);
        } else if focused {
            cx.notify(view_entity_id);
        }
    }
    if !prune.is_empty() {
        let mut states = INPUT_STATES.lock().unwrap();
        for node_id in prune {
            states.remove(&node_id);
        }
    }
}

/// `set-input-focus {block-id, focused}` — focus/blur the block's
/// hidden input surface.
fn set_input_focus(
    shared: &Shared,
    block_id: &str,
    focused: bool,
    window: &mut Window,
    cx: &mut App,
) {
    PENDING_FOCUS.with(|p| p.borrow_mut().insert(block_id.to_owned(), focused));
    let node_id = {
        let shared = shared.borrow();
        find_editor_node(&shared.store, block_id)
    };
    let Some(node_id) = node_id else {
        return;
    };
    if focused {
        focus_editor(node_id, window, cx);
    } else {
        window.blur(cx);
        if let Some(state) =
            INPUT_STATES.lock().unwrap().get(&node_id).cloned()
        {
            state.update(cx, |this, cx| this.emit(c"blur", "{}".into(), cx));
        }
    }
}

/// The `logseq-editor` surface: an invisible focus-tracked element that
/// registers the `EntityInputHandler` during paint — no visual output.
/// The runs render as sibling `.ed-r` text nodes inside the container.
fn editor_surface(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let shared = view.shared.clone();
    let node_id = node.id;
    let state = input_state(node_id, &shared, cx);
    let focus = state.read(cx).focus.clone();
    // The root keydown forwarder resolves the focused element's node
    // through this registry — the sink's own `key` events own editing,
    // but a stale focus must still route keys at the right target.
    shared.borrow_mut().register_focus(node_id, focus.clone());

    // Focus/blur subscriptions, once per input entity. Installed before
    // draining a pending focus so the landing emits the conduit event.
    let needs_subs = state.read(cx).subs.is_empty();
    if needs_subs {
        state.update(cx, |this, cx| {
            let focus = this.focus.clone();
            this.subs.push(cx.on_focus(&focus, window, |this, _window, cx| {
                this.emit(c"focus", "{}".into(), cx);
            }));
            this.subs.push(cx.on_focus_out(
                &focus,
                window,
                |this, _event: FocusOutEvent, _window, cx| {
                    this.emit(c"blur", "{}".into(), cx);
                },
            ));
        });
    }

    // a set-input-focus that raced the mount lands here once the input
    // entity exists
    if let Some(block_id) = node
        .extension_props
        .get("block-id")
        .and_then(WireValue::as_str)
    {
        if let Some(want) =
            PENDING_FOCUS.with(|p| p.borrow_mut().remove(block_id))
        {
            // Grant synchronously instead of deferring: `window.focus`
            // only writes window fields, so a grant during render is
            // picked up by this frame's own prepaint — `track_focus`
            // records it in the dispatch tree and the canvas paint
            // registers the input handler in the same frame. The
            // confirm event goes through `emit_ffi` (no drain, which
            // would re-borrow the store mid-render); a deferred grant
            // can park arbitrarily long because effect flushes only run
            // when an update cycle ends.
            if want {
                let was = focus.is_focused(window);
                if !was {
                    focus.focus(window, cx);
                }
                if focus.is_focused(window) {
                    emit_ffi(node_id, c"focus", "{}".into());
                    // The mount-frame paint does not always reach the
                    // conduit canvas (clipped paint ranges), which is
                    // where `handle_input` registers the platform input
                    // handler — a repaint forces registration so
                    // insertText works before the first keystroke.
                    cx.notify();
                }
            } else {
                window.blur(cx);
                emit_ffi(node_id, c"blur", "{}".into());
            }
        }
    }

    let key_shared = shared.clone();
    let hit_shared = shared.clone();
    let hit_state = state.clone();
    div()
        .absolute()
        .size(px(1.))
        .track_focus(&focus)
        .on_key_down(move |event, _window, cx| {
            let keystroke = &event.keystroke;
            let mods = &keystroke.modifiers;
            let global_key = mods.control || mods.platform;
            // Only printable key_chars are text: gpui reports named keys
            // (Enter "\r", Tab "\t", Escape "\x1b", Backspace) as
            // control-char key_chars, and routing them through `insert`
            // both writes garbage into the model and hides the key from
            // the conduit keymap (Enter must reach `key` → SplitBlock).
            let text_key = keystroke
                .key_char
                .as_deref()
                .is_some_and(|s| s.chars().all(|c| !c.is_control()))
                && !global_key
                && !mods.function;
            if text_key {
                // Emit the text directly as an `insert` conduit event —
                // the OCaml side applies `insert` the same way insertText
                // does, without depending on the platform input handler,
                // whose registration only happens on frames where this
                // 1px conduit actually paints. Handled here so Cocoa
                // never also routes the key through `insertText` (which
                // would double-insert once a handler is registered).
                let json = json!({ "text": keystroke.key_char.as_ref().unwrap() });
                emit(&key_shared, node_id, c"insert", json.to_string(), cx);
                // The web DOM still delivers the keydown to document
                // listeners (chords like "t t" live there): emit it too.
                // The conduit target makes the editor's document handler
                // a no-op for it, so nothing double-inserts.
                lui_gpui::dom::dom_event(
                    &key_shared,
                    node_id,
                    IDENTIFIER,
                    "keydown",
                    json!({
                        "key": dom_key_name(&keystroke.key),
                        "keyChar": keystroke.key_char,
                        "metaKey": mods.platform,
                        "ctrlKey": mods.control,
                        "shiftKey": mods.shift,
                        "altKey": mods.alt,
                        "repeat": event.is_held,
                    }),
                    cx,
                );
                cx.stop_propagation();
                return;
            }
            let json = json!({
                "key": dom_key_name(&keystroke.key),
                "shift": mods.shift,
                "alt": mods.alt,
                "meta": mods.platform,
                "ctrl": mods.control,
                "repeat": event.is_held,
            });
            emit(&key_shared, node_id, c"key", json.to_string(), cx);
            // The web DOM delivers the same physical keydown to
            // document listeners too (autocomplete Enter/arrows/Escape
            // live there, the editor's own listener no-ops on the
            // block-editor target): emit the dom-event directly. Then
            // mark the key consumed — an unconsumed keystroke falls
            // through to the input context and its key_char lands as
            // literal text (⌘V inserting "v"). Keys bound to app-level
            // gpui actions (quit/hide/minimize/close/settings) are the
            // exception: they must keep bubbling so their KeyBinding
            // match marks them handled — the root observer emits their
            // document keydown instead.
            let app_action_key = mods.platform
                && !mods.control
                && matches!(
                    keystroke.key.as_str(),
                    "q" | "h" | "m" | "w" | ","
                );
            if !app_action_key {
                lui_gpui::dom::dom_event(
                    &key_shared,
                    node_id,
                    IDENTIFIER,
                    "keydown",
                    json!({
                        "key": dom_key_name(&keystroke.key),
                        "keyChar": keystroke.key_char,
                        "metaKey": mods.platform,
                        "ctrlKey": mods.control,
                        "shiftKey": mods.shift,
                        "altKey": mods.alt,
                        "repeat": event.is_held,
                    }),
                    cx,
                );
                // ⌘C/⌘X/⌘V: emit the clipboard events a browser fires
                // on the textarea — the editing keymap has no plain
                // copy/cut/paste branches because on web they're real
                // events, not keys. The sink carries .ed-input +
                // data-block-id so the OCaml target gate takes its
                // editing arm; the root observer only emits `paste`
                // itself when no conduit is focused. ⌘⇧V / ⌘⇧C stay
                // model keymap commands (paste-text-in-one-block /
                // copy-text), matching cljs.
                if mods.platform && !mods.control && !mods.alt && !mods.shift
                {
                    let clip_name = match keystroke.key.as_str() {
                        "c" => Some("copy"),
                        "x" => Some("cut"),
                        "v" => Some("paste"),
                        _ => None,
                    };
                    if let Some(clip_name) = clip_name {
                        let text = if clip_name == "paste" {
                            cx.read_from_clipboard()
                                .and_then(|item| item.text())
                                .unwrap_or_default()
                        } else {
                            String::new()
                        };
                        lui_gpui::dom::dom_event(
                            &key_shared,
                            node_id,
                            IDENTIFIER,
                            clip_name,
                            json!({ "clipboardData": { "text": text } }),
                            cx,
                        );
                    }
                }
                cx.stop_propagation();
            }
        })
        .child(canvas(
            |_, _, _| {},
            move |bounds, _, window, cx| {
                window.handle_input(
                    &focus,
                    ElementInputHandler::new(bounds, hit_state.clone()),
                    cx,
                );
                let shared = hit_shared.clone();
                window.on_mouse_event(
                    move |event: &MouseDownEvent, phase, window, cx| {
                        if phase == DispatchPhase::Bubble {
                            pointer_down(&shared, node_id, event, window, cx);
                        }
                    },
                );
            },
        ))
        .into_any_element()
}

/// Register the `logseq-editor` renderer so it takes over the generic
/// `logseq-*` DOM rendering for this identifier.
pub fn register(shared: &Shared) {
    shared
        .borrow_mut()
        .extension_renderers
        .insert(IDENTIFIER.to_string(), editor_surface);
}

// ---------------------------------------------------------------------------
// dom-ops (called from handle_platform_request's "dom-op" arm)
// ---------------------------------------------------------------------------

/// Handle a `logseq-editor` dom-op. `Some` = consumed (empty vec = the
/// op produced no replies); `None` = not an editor op — fall through to
/// `lui_gpui::domops`. `window` is the live frame window — dom-ops run
/// inside `on_next_frame`, where `cx.windows()` handles no longer update
/// (the window sits on gpui's update stack).
pub fn handle_dom_op(
    op: &str,
    body: &str,
    shared: &Shared,
    window: &mut Window,
    cx: &mut App,
) -> Option<Vec<(String, Value)>> {
    match op {
        "caret-rect" | "offset-at" | "line-ranges" | "scroll-height"
        | "set-input-focus" => {}
        _ => return None,
    }
    let parsed: Value = match serde_json::from_str(body) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("logseq-editor: dom-op {op} bad json: {e}");
            return Some(Vec::new());
        }
    };
    let Some(block_id) = parsed
        .get("block-id")
        .and_then(Value::as_str)
        .map(str::to_owned)
    else {
        return Some(Vec::new());
    };
    let replies = match op {
        "caret-rect" => {
            let off = parsed.get("offset").and_then(Value::as_i64).unwrap_or(0);
            caret_rect(shared, &block_id, off, window)
                .map(|(x, y, h, ox, oy)| {
                    vec![(
                        "caret-rect".to_string(),
                        json!({
                            "block-id": block_id,
                            "offset": off,
                            "x": x.round() as i64,
                            "y": y.round() as i64,
                            "h": h.round() as i64,
                            "ox": f32::from(ox).round() as i64,
                            "oy": f32::from(oy).round() as i64,
                        }),
                    )]
                })
                .unwrap_or_default()
        }
        "offset-at" => {
            let x = parsed.get("x").and_then(Value::as_i64).unwrap_or(0);
            let y = parsed.get("y").and_then(Value::as_i64).unwrap_or(0);
            offset_at(shared, &block_id, x, y, window)
                .map(|offset| {
                    vec![(
                        "offset-at".to_string(),
                        json!({
                            "block-id": block_id,
                            "x": x,
                            "y": y,
                            "offset": offset,
                        }),
                    )]
                })
                .unwrap_or_default()
        }
        "line-ranges" => {
            let ranges = line_ranges(shared, &block_id)
                .iter()
                .map(|(lo, hi)| format!("{lo},{hi}"))
                .collect::<Vec<_>>()
                .join(";");
            vec![(
                "line-ranges".to_string(),
                json!({ "block-id": block_id, "ranges": ranges }),
            )]
        }
        "scroll-height" => {
            let height = scroll_height(shared, &block_id);
            vec![(
                "scroll-height".to_string(),
                json!({ "block-id": block_id, "height": height }),
            )]
        }
        "set-input-focus" => {
            let focused = parsed
                .get("focused")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            set_input_focus(shared, &block_id, focused, window, cx);
            Vec::new()
        }
        _ => Vec::new(),
    };
    Some(replies)
}

