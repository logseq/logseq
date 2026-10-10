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
//! - `logseq-iframe` — a real WKWebView overlay parked on the node's
//!   bounds (macOS); other platforms keep a labeled chip.

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

/// Expanded disclosure arrows rotate the application's shared SVG on
/// native hosts, where the web's class transform is not available.
pub fn install_app_icons(shared: &Shared, payload: &str) {
    let icons: std::collections::HashMap<String, String> =
        serde_json::from_str(payload).expect("application icon pack must map names to SVG markup");
    shared.borrow_mut().app_icon_svg = Some(Rc::new(move |name| {
        if name == "rotating-arrow-down" {
            let svg = icons.get("rotating-arrow")?;
            let (head, body) = svg.split_once('>')?;
            return Some(format!("{head}><g transform=\"rotate(90 96 256)\">{}</g></svg>",
                                body.strip_suffix("</svg>")?));
        }
        icons.get(name).cloned().or_else(|| app_svg(name))
    }));
}

/// Full SVG markup for one bundled Tabler icon name. `currentColor` is left as-is;
/// the caller binds it to the theme foreground before rasterizing.
fn app_svg(name: &str) -> Option<String> {
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
pub mod webview;

/// Register the logseq extension renderers onto the shared backend bag.
/// Call once at boot, next to `editor::register`.
pub fn register(shared: &Shared) {
    // Semantic-class layout ported from resources/css/lui-core.css — the
    // gpui backend has no stylesheet, so classes that carry real layout on
    // the web are registered here once (`style::register_class_style`).
    //
    // .block-head-wrap { display:flex; align-items:center; flex:1;
    //                    flex-wrap:wrap; justify-content:space-between;
    //                    width:100% }
    // Without the flex-1 the wrap shrink-wraps its content and siblings
    // (fenced code editor, wide blocks) collapse to their intrinsic
    // minimum instead of filling the block row.
    lui_gpui::style::register_class_style(
        "block-head-wrap",
        "",
        "flex flex-row flex-wrap items-center justify-between flex-1 w-full",
    );
    // .extensions__code-lang { display: none } — the language chip
    // lives in .code-block-actions on the web; the span is markup only.
    lui_gpui::style::register_class_style("extensions__code-lang", "", "hidden");
    // .extensions__code { width:100%; overflow:hidden;
    //                    border-radius:0.25rem }
    lui_gpui::style::register_class_style(
        "extensions__code",
        "width:100%; overflow:hidden; border-radius:4px",
        "",
    );
    // .page-reference .bracket { opacity: 0.3; display: inline-flex }
    lui_gpui::style::register_class_style("bracket", "opacity:0.3", "");
    // .page-ref { color: var(--ls-link-text-color) }
    lui_gpui::style::register_class_style(
        "page-ref",
        "color:var(--ls-link-text-color)",
        "",
    );
    // lui-core.css blockquote { padding:8px 16px; border-left:4px solid
    //   var(--ls-page-blockquote-border-color, var(--lx-gray-05-alpha));
    //   background-color: var(--ls-page-blockquote-bg-color,
    //   var(--lx-gray-04)); margin:1rem 0 } — block-body first-child
    // trims the margins to 8px. The --lx-gray fallbacks don't resolve
    // on gpui (dark + alpha steps are unset by design), so the bar/bg
    // bind to the theme-aware --ls-* semantic vars instead.
    lui_gpui::style::register_class_style(
        "ls-blockquote",
        "padding:8px 16px; \
         border-left:4px solid var(--ls-border-color); \
         background-color:var(--ls-tertiary-background-color); \
         margin-top:8px; margin-bottom:8px; width:100%",
        "",
    );
    // .ls-block-content-indent { padding-left:45px } — block properties
    // and other indented chrome under the block content row.
    lui_gpui::style::register_class_style(
        "ls-block-content-indent",
        "padding-left:45px",
        "",
    );
    // .ls-block .ls-properties-area.ls-block-properties { margin-top:2px;
    //   margin-left:7px }
    lui_gpui::style::register_class_style(
        "ls-block-properties",
        "margin-top:2px; margin-left:7px",
        "",
    );
    // .ls-properties-area .properties-panel { border-radius:6px;
    //   overflow:hidden }
    lui_gpui::style::register_class_style(
        "properties-panel",
        "border-radius:6px; overflow:hidden",
        "",
    );
    // resources/css/lui-overlay.css — modal scrim + dialog surface.
    // The web scrims are `color-mix(bg 90%/80%, transparent)`;
    // `--lui-c-*` vars have no gpui counterpart, so both layers resolve
    // through the `--ls-*` semantic table (theme-aware) with the same
    // alpha via the `/opacity` suffix.
    lui_gpui::style::register_class_style(
        "ui__dialog-overlay",
        "background:var(--ls-primary-background-color)/90",
        "",
    );
    lui_gpui::style::register_class_style(
        "ui__alert-dialog-overlay",
        "background:var(--ls-primary-background-color)/80",
        "",
    );
    lui_gpui::style::register_class_style(
        "ui__dialog-content",
        "background:var(--ls-primary-background-color); \
         border:1px solid var(--ls-border-color); border-radius:8px; \
         padding:24px; width:100%; max-width:672px; \
         max-height:80dvh; overflow:hidden; \
         position:relative",
        "",
    );
    lui_gpui::style::register_class_style(
        "ui__alert-dialog-content",
        "background:var(--ls-primary-background-color); \
         border:1px solid var(--ls-border-color); border-radius:8px; \
         padding:24px; width:100%; max-width:512px; \
         max-height:80dvh; overflow:hidden; \
         position:relative",
        "",
    );
    // .ui__dialog-content.ls-dialog-settings { max-width: 64rem }
    lui_gpui::style::register_class_style(
        "ls-dialog-settings",
        "max-width:1024px",
        "",
    );
    // .ui__dialog-main-content { min-height:0; overflow-y:auto }
    lui_gpui::style::register_class_style(
        "ui__dialog-main-content",
        "min-height:0",
        "w-full overflow-y-auto",
    );
    // .cp__theme-modes-options { display:flex; gap:12px } — the theme
    // mode tiles lay out horizontally, not as a stacked list.
    lui_gpui::style::register_class_style(
        "cp__theme-modes-options",
        "flex-direction:row",
        "",
    );
    // Theme mode tiles — web gives each .mode-* a preview fill + the
    // .mode-active accent ring.
    lui_gpui::style::register_class_style(
        "mode-light",
        "background:#f3f4f6; border:1px solid var(--ls-border-color); \
         border-radius:8px; height:56px",
        "",
    );
    lui_gpui::style::register_class_style(
        "mode-dark",
        "background:#191919; border:1px solid var(--ls-border-color); \
         border-radius:8px; height:56px",
        "",
    );
    lui_gpui::style::register_class_style(
        "mode-system",
        "background:#6b7280; border:1px solid var(--ls-border-color); \
         border-radius:8px; height:56px",
        "",
    );
    lui_gpui::style::register_class_style(
        "mode-active",
        "border:2px solid var(--ls-link-text-color)",
        "",
    );
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
    shared
        .extension_renderers
        .insert("logseq-iframe".to_string(), webview::render);
    // `icon ~name:(`app n)` falls through the built-in IconName set to
    // this resolver — every tabler name rasterizes instead of the
    // `[icon]` placeholder.

    register_class_styles();
}

/// Semantic `cp__*`/`ui__*`/`ls-*` classes the overlay layer needs on
/// gpui. Taffy anchors `position:absolute` to the nearest positioned
/// ancestor (always the direct parent here), so every link from
/// `.cp__overlays` down to a fixed-positioned leaf must be a
/// window-sized layer — `cp__overlays`/`cp__overlay-layer` fill the
/// window, `cp__dialog-shell` additionally centers abspos children via
/// flex alignment (the expressible form of the web's
/// `translate(-50%,-50%)` centering). `pointer-events` values steer
/// `deepest_hit`: inert layers are click-transparent while backdrop,
/// dialog, toast and menu leaves stay interactive. Web keeps its real
/// stylesheet for all of these — this table is gpui-only.
fn register_class_styles() {
    use lui_gpui::style::register_class_style as class;
    // Page-title cosmetics (lui-core.css): 36px title scale and radius —
    // cosmetic tokens that typed props don't cover. Layout for this
    // region (column centering, bottom gap) rides typed props in the
    // views (chrome.ml), so no cp__content-wrap/cp__main-content entries.
    class(
        "ls-page-title-container",
        "font-size:var(--ls-page-title-size);font-weight:500;\
         color:var(--ls-title-text-color, foreground)",
        "",
    );
    class("ls-page-title", "border-radius:4px", "");
    class("cp__overlays", "position:absolute;inset:0", "pointer-events-none");
    class("cp__overlay-layer", "position:absolute;inset:0", "pointer-events-none");
    class(
        "cp__dialog-shell",
        "position:absolute;inset:0;display:flex;flex-direction:column;\
         justify-content:center;align-items:center",
        "pointer-events-none",
    );
    class(
        "ui__dialog-overlay",
        "position:absolute;inset:0;display:flex;flex-direction:column;\
         justify-content:center;align-items:center",
        "pointer-events-auto",
    );
    class(
        "ui__alert-dialog-overlay",
        "position:absolute;inset:0;display:flex;flex-direction:column;\
         justify-content:center;align-items:center",
        "pointer-events-auto",
    );
    class(
        "ui__dialog-content",
        "position:absolute;width:100%;max-width:42rem;padding:24px;\
         border:1px solid border;border-radius:8px;\
         background:background;color:foreground",
        "pointer-events-auto",
    );
    class(
        "ui__alert-dialog-content",
        "position:absolute;width:100%;max-width:32rem",
        "pointer-events-auto",
    );
    // cljs dialog-confirm chrome (lui-overlay.css ~:1550): header/title/
    // main-content/footer rules the web twin carries. The gpui title is
    // an icon+heading row, so it joins flex here instead of block.
    class(
        "ui__alert-dialog-header",
        "display:flex;flex-direction:column;gap:8px;text-align:left",
        "",
    );
    class(
        "ui__alert-dialog-title",
        "display:flex;flex-direction:row;align-items:center;gap:8px;\
         font-size:18px;font-weight:600;line-height:28px",
        "",
    );
    class(
        "ui__alert-dialog-main-content",
        "padding-top:8px;padding-bottom:8px",
        "",
    );
    class(
        "ui__alert-dialog-footer",
        "display:flex;flex-direction:row;justify-content:flex-end;gap:8px",
        "",
    );
    // the inline style sets position:fixed + left/top + z-index (el attrs
    // win over class declarations, so only the paint rules live here).
    class("ls-dialog-cmdk", "width:90dvw;max-width:56rem;padding:0", "");
    class("ui__dialog-main-content", "width:100%", "");
    class("ls-font-sample", "font-size:14px;line-height:20px;font-weight:600", "");
    class("ls-font-name", "font-size:11.2px;line-height:16px", "");
    // ---- body-mounted popup chrome (resources/css/lui-overlay.css
    // .ui__popover-content et al. base rule): on web the stylesheet
    // paints the card — without it these surfaces render as bare text.
    let popup_chrome =
        "min-width:8rem;border:1px solid border;border-radius:6px;\
         background:popover";
    class(
        "ui__popover-content",
        popup_chrome,
        "pointer-events-auto overflow-y-auto overflow-x-hidden",
    );
    let menu_chrome = &format!("{popup_chrome};padding:4px");
    class(
        "ui__dropdown-menu-content",
        menu_chrome,
        "pointer-events-auto overflow-y-auto overflow-x-hidden",
    );
    class(
        "ui__dropdown-menu-sub-content",
        menu_chrome,
        "pointer-events-auto overflow-y-auto overflow-x-hidden",
    );
    class("ls-property-dialog", "", "pointer-events-auto");
    // ---- transparent popup backdrop (web .ls-popup-backdrop
    // position:fixed;inset:0): fills the window so outside presses
    // hit it and dismiss the anchored popup (appearance panel) ----
    class(
        "ls-popup-backdrop",
        "position:fixed;inset:0",
        "pointer-events-auto",
    );

    // ---- app shell (web .cp__header + groups) ----
    // macOS merges the header into a transparent titlebar, so the left
    // cluster sits clear of the traffic lights (Windows/Linux keep the
    // system titlebar and no inset).
    #[cfg(target_os = "macos")]
    let header_pl = "padding-left:78px";
    #[cfg(not(target_os = "macos"))]
    let header_pl = "";
    class(
        "cp__header",
        &format!(
            "display:flex;flex-direction:row;align-items:center;\
             justify-content:space-between;height:48px;flex-shrink:0;\
             border-bottom:1px solid border;background:background;{header_pl}"
        ),
        "",
    );
    class("cp__header-l", "display:flex;align-items:center", "");
    class(
        "cp__header-r",
        "display:flex;align-items:center;justify-content:flex-end",
        "",
    );
    // ---- left sidebar (web resources/css/lui-core.css #left-sidebar) ----
    // Web scopes these rules under .left-sidebar-inner / .sidebar-
    // content-group; the gpui dictionary is a flat token map, so each
    // registration keys a sidebar-specific class name only.
    class(
        "left-sidebar-inner",
        "border-right:1px solid border",
        "",
    );
    // .item — 32px nav rows (Journals/Flashcards/…). The web sheet is
    // scoped to the sidebar and `item` only appears there as a bare
    // token, so a global registration is safe.
    class(
        "item",
        "display:flex;flex-direction:row;align-items:center;\
         height:32px;padding-left:6px;padding-right:2px;\
         font-size:14px;font-weight:500;opacity:0.8;border-radius:6px",
        "",
    );
    // .item.active — current nav row, web fills it with solid gray-04
    // (lui-core.css `--lx-gray-04`, not the alpha step).
    class(
        "active",
        "background:var(--lx-gray-04, var(--ls-quaternary-background-color))",
        "",
    );
    // .hd — collapsible group headers (Favorites/Recent/Navigations).
    class(
        "hd",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:space-between;height:32px;\
         padding-left:8px;padding-right:4px;border-radius:6px",
        "",
    );
    // .hd .wrap-th — small muted section label.
    class("wrap-th", "font-size:12px;font-weight:500;opacity:0.5", "");
    // .hd .as-edit — the trailing filter-edit icon, softened.
    class("as-edit", "opacity:0.6", "");
    class(
        "sidebar-navigations",
        "display:flex;flex-direction:column;gap:2px;margin-top:4px",
        "",
    );
    // Web insets every sidebar row 12px via the two content containers.
    class(
        "sidebar-header-container",
        "display:flex;flex-direction:column;gap:4px;\
         padding:0 12px;margin-bottom:4px",
        "",
    );
    class(
        "sidebar-contents-container",
        "display:flex;flex-direction:column;gap:4px;\
         padding:4px 12px 0;overflow:hidden",
        "",
    );
    // .hd .more — the section disclosure chevron (web: opacity .8,
    // margins reproduce the cljs 20px icon slot).
    class("more", "opacity:0.8;margin-left:2.5px;margin-right:10.5px", "");
    // .keyboard-shortcut — web only reveals the shortcut chips on row
    // hover (opacity transition); hover states can't be expressed in
    // the flat dictionary, so keep the web's default state: hidden.
    class("keyboard-shortcut", "display:none", "");
    // .bd a.link-item — favorites/recents page rows.
    class(
        "link-item",
        "display:flex;flex-direction:row;align-items:center;\
         height:32px;padding-left:8px;padding-right:8px;\
         font-size:14px;opacity:0.8;border-radius:6px",
        "",
    );
    // ---- page/main-content column (lui-core.css .cp__sidebar-main-content
    // + .cp__content-wrap) — without the max-width + auto inline margins
    // the page column bleeds full-width and the -20px .ls-page-blocks
    // gutter clips text at the window edge.
    // No margin-inline:auto here — the parent row already centers via
    // justify-center (native/chrome.ml main-content-row ~main:`center);
    // an auto left margin absorbs all free space and anchors the column
    // to the right edge under taffy.
    class(
        "cp__sidebar-main-content",
        "width:100%;max-width:var(--ls-main-content-max-width,960px);\
         flex-grow:1",
        "",
    );
    // .cp__content-wrap { margin:0 auto; width:100%; padding-bottom:6rem }
    class(
        "cp__content-wrap",
        "margin-left:auto;margin-right:auto;width:100%;\
         padding-bottom:96px",
        "",
    );
    // .page-inner > .ls-page-blocks hangs the block control column 20px
    // into the left gutter (cljs page.cljs margin-left:-20 inline).
    class("ls-page-blocks", "margin-left:-20px;min-height:60px", "");
    // .cp__page-inner-wrap > .page-inner { padding-bottom:4rem }
    class("page-inner", "padding-bottom:64px", "");
    // #journals .journal-item — day separators + bottom breathing room.
    class(
        "journal-item",
        "min-height:250px;padding-bottom:102px;\
         border-bottom:1px solid var(--lx-gray-04, var(--ls-border-color))",
        "",
    );
    // .journal-last-item { border-style: none } — drops the separator on
    // the final day; registered after journal-item so it wins (0px,
    // `none` parses as no declaration).
    class("journal-last-item", "border-bottom:0px", "");
    // Block bullets (web resources/css/lui-core.css .bullet-*).
    class(
        "bullet-link-wrap",
        "display:flex;flex-direction:row;align-items:center",
        "",
    );
    class(
        "bullet-container",
        "display:flex;align-items:center;justify-content:center;\
         border-radius:9999px",
        "",
    );
    class(
        "bullet",
        "width:6px;height:6px;border-radius:9999px;opacity:0.8;\
         background:var(--lx-gray-08, var(--ls-block-bullet-color))",
        "",
    );
    // .bullet-closed — collapsed rows tint the bullet container with the
    // gray-04 halo (web lui-core.css `.bullet-closed`).
    class(
        "bullet-closed",
        "background:var(--lx-gray-04-alpha, var(--ls-block-bullet-border-color))",
        "",
    );
    // .block-control — the fold caret rides at 40% opacity on web and
    // occupies a fixed --ls-block-control-size slot (24px) even when the
    // caret glyph is hidden; without the slot the bullet column shrinks.
    class(
        "block-control",
        "width:24px;height:24px;flex-shrink:0;opacity:0.4",
        "",
    );

    // cmdk migrated to shared recipes (ui_components.ml) — gpui reads the
    // emitted typed props directly; descendant-hover dimming stays a
    // class rule
    class("cp__cmdk-hint-label", "opacity:0.6", "");
    class(
        "icon-cp-container",
        "display:flex;align-items:center;justify-content:center",
        "",
    );

    // ---- page surface ----
    // Title actions reveal on .block-content-wrapper:hover on web
    // (absolute at top:-1.25rem); the view drives the same reveal
    // through the opacity prop fed by pointer enter/leave. On gpui an
    // absolute row escapes the scroll viewport's clip, so it stays
    // in-flow above the title — the hidden row reserves the same strip
    // the web overlay covers.
    class("ls-page-title-actions", "", "");
    class("control-hide", "display:none", "");

    // ---- shared-OCaml block editor (resources/css/lui-core.css .ed-*) ----
    // The overlay paints selection rects over the .ed-line text runs;
    // the editor conduit paints the caret in the same frame as the text.
    // Each measured selection rect is an absolutely-positioned
    // .ed-pos wrapper whose bound padding pushes the bar to (x, y).
    class("block-editor", "position:relative", "");
    class("ed-line", "min-height:1.5rem", "");
    class("ed-delim", "color:var(--ls-secondary-text-color)", "");
    // .ed-hidden { display:none } — reveal-on-caret delimiters must not
    // reserve space: collapse the box (invisible() alone keeps the
    // delimiter's intrinsic width).
    class(
        "ed-hidden",
        "display:none;width:0;height:0;overflow:hidden",
        "",
    );
    class(
        "ed-pill",
        "background:var(--ls-tertiary-background-color);border-radius:4px;\
         padding:0 4px",
        "cursor-pointer",
    );
    class("ed-raw", "background:var(--ls-tertiary-background-color)", "");
    class("ed-overlay", "position:absolute;inset:0", "pointer-events-none");
    class("ed-pos", "position:absolute;left:0;top:0", "");
    class(
        "ed-sel",
        "background:var(--ls-block-highlight-color);border-radius:2px",
        "",
    );
    // .ls-block.selected — block-select (Esc / multi-block) highlight
    class(
        "selected",
        "background:var(--ls-block-highlight-color);border-radius:4px",
        "",
    );
    class("block-highlight", "background:var(--ls-block-highlight-color)", "");

    // ---- autocomplete menu rows (lui-overlay.css .menu-link*) ----
    class("menu-link-wrap", "display:block", "");
    class(
        "menu-link",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:space-between;padding:0.375rem 0.5rem;\
         font-size:0.875rem;color:muted-foreground;border-radius:4px",
        "",
    );
    class(
        "chosen",
        "background:var(--ls-menu-hover-color, var(--ls-tertiary-background-color))",
        "",
    );

    // ---- native block drag affordances (editor_keys drives the
    // gesture; web shows the same states via dnd-kit classes) ----
    class("block-dragging", "opacity:0.4", "");
    class("block-drag-over", "position:relative", "");
    class(
        "block-drag-over-top",
        "border-top:2px solid var(--ls-primary-color, var(--ls-link-text-color))",
        "",
    );
    class(
        "block-drag-over-sibling",
        "border-bottom:2px solid var(--ls-primary-color, var(--ls-link-text-color))",
        "",
    );
    class(
        "block-drag-over-nested",
        "border-left:2px solid var(--ls-primary-color, var(--ls-link-text-color))",
        "",
    );
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
