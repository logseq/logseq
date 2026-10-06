//! Native hosts for the `logseq-*` extension family.
//!
//! Registered through the renderer-override hook
//! (`LuiShared::extension_renderers`) — a registered identifier wins
//! before the generic `logseq-*` → `dom::render` routing:
//!
//! - `logseq-codemirror` — gpui-component `Editor` (tree-sitter highlight)
//!   behind the extension node; `cm-event` goes back to OCaml.
//! - `logseq-katex`      — LaTeX translated to typst, compiled to SVG and
//!   rasterized by gpui's svg renderer.
//! - `logseq-pdf`        — hayro rasterizes the current page into a
//!   `RenderImage`; `hls` overlay data is parsed and drawn as highlight
//!   rects. Annotation editing events are stubbed on purpose — the data
//!   model is defined, the editing UI is not.
//! - `logseq-div`/`logseq-span` — intercepted only to service the
//!   generic `.latex`/`.latex-inline` slot shape (a node whose
//!   `.opacity-0` child holds the raw tex); everything else falls
//!   through to the framework's dom renderer.

use gpui_kit::gpui::{AnyElement, Context, Window};

use lui_gpui::dom;
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::Shared;

pub mod codemirror;
pub mod katex;
pub mod pdf;

/// Register the logseq extension renderers onto the shared backend bag.
/// Call once at boot, next to `editor::register`.
pub fn register(shared: &Shared) {
    let mut shared = shared.borrow_mut();
    shared
        .extension_renderers
        .insert("logseq-codemirror".to_string(), codemirror::render);
    shared
        .extension_renderers
        .insert("logseq-katex".to_string(), katex::render);
    shared
        .extension_renderers
        .insert("logseq-pdf".to_string(), pdf::render);
    shared
        .extension_renderers
        .insert("logseq-div".to_string(), div_or_latex_slot);
    shared
        .extension_renderers
        .insert("logseq-span".to_string(), div_or_latex_slot);
}

/// `logseq-div`/`logseq-span` nodes carrying the `.latex`/`.latex-inline`
/// slot shape render through the katex pipeline (tex discovered from the
/// `.opacity-0` holder child); every other node keeps the generic dom
/// renderer.
fn div_or_latex_slot(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    if katex::is_latex_slot(node) {
        katex::render_slot(view, node, window, cx)
    } else {
        dom::render(view, node, window, cx)
    }
}
