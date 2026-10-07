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

use std::rc::Rc;
use std::sync::LazyLock;

use gpui_kit::gpui::{AnyElement, Context, Window};

use lui_gpui::dom;
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::Shared;

/// Bundled tabler children table (`icon-name -> [[tag, attrs], ...]`),
/// the same payload OCaml `icon_tabler_data`
/// consume. Resolves `app:` icon names the gpui-kit built-in set
/// doesn't cover.
static TABLER: LazyLock<serde_json::Value> = LazyLock::new(|| {
    serde_json::from_str(include_str!(
        "../../../assets/tabler-children.json"
    ))
    .unwrap_or(serde_json::Value::Null)
});

/// App-registered icons with no tabler counterpart — mirror of
/// `src/core/icons.ml` `custom_icons` (full svg markup per name).
fn custom_svg(name: &str) -> Option<&'static str> {
    Some(match name {
        "rotating-arrow" => "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" \
            fill=\"currentColor\"><path fill-rule=\"evenodd\" \
            d=\"M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 \
            128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 \
            0 402.48 0 384.662z\"/></svg>",
        "youtube-timestamp-icon" => "<svg xmlns=\"http://www.w3.org/2000/svg\" \
            fill=\"currentColor\" viewBox=\"0 0 20 20\"><path clip-rule=\"evenodd\" \
            fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 \
            1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 \
            101.415-1.415L11 9.586V6z\"/></svg>",
        "logseq-logo" => "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" \
            viewBox=\"0 0 21 21\" height=\"28\" width=\"28\"><ellipse \
            transform=\"matrix(0.987073 0.160274 -0.239143 0.970984 11.7346 \
            2.59206)\" rx=\"3.29236\" ry=\"2.04373\"/><ellipse \
            transform=\"matrix(-0.495846 0.868411 -0.825718 -0.564084 3.97209 \
            5.54515)\" rx=\"2.95326\" ry=\"3.37606\"/><ellipse \
            transform=\"matrix(0.987073 0.160274 -0.239143 0.970984 13.0843 \
            14.72)\" rx=\"7.78547\" ry=\"6.13006\"/></svg>",
        _ => return None,
    })
}

/// Full SVG markup for one `app:` icon name — the custom registry
/// first, then the bundled tabler table. `currentColor` is left as-is;
/// the caller binds it to the theme foreground before rasterizing.
fn app_svg(name: &str) -> Option<String> {
    if let Some(svg) = custom_svg(name) {
        return Some(svg.to_string());
    }
    let children = TABLER.get(name)?.as_array()?;
    let mut svg = String::from(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" \
         fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" \
         stroke-linecap=\"round\" stroke-linejoin=\"round\">",
    );
    for pair in children {
        let (Some(tag), Some(attrs)) = (pair[0].as_str(), pair[1].as_object()) else {
            continue;
        };
        svg.push('<');
        svg.push_str(tag);
        for (k, v) in attrs {
            if let Some(v) = v.as_str() {
                svg.push(' ');
                svg.push_str(k);
                svg.push_str("=\"");
                svg.push_str(v);
                svg.push('"');
            }
        }
        svg.push_str("/>");
    }
    svg.push_str("</svg>");
    Some(svg)
}

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
    // `icon ~name:(`app n)` falls through the built-in IconName set to
    // this resolver — every tabler name rasterizes instead of the
    // `[icon]` placeholder.
    shared.app_icon_svg = Some(Rc::new(|name| app_svg(name)));
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
