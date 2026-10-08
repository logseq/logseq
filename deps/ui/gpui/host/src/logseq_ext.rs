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

/// App-registered icons with no tabler counterpart — mirror of
/// `src/core/icons.ml` `custom_icons` (full svg markup per name).
fn custom_svg(name: &str) -> Option<&'static str> {
    Some(match name {
        "rotating-arrow" => "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" \
            fill=\"currentColor\"><path fill-rule=\"evenodd\" \
            d=\"M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 \
            128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 \
            0 402.48 0 384.662z\"/></svg>",
        // the web rotates the caret 90° via .not-collapsed; there's no
        // element transform here, so the expanded state gets its own
        // pre-rotated svg.
        "rotating-arrow-down" => "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" \
            fill=\"currentColor\"><g transform=\"rotate(90 96 256)\"><path fill-rule=\"evenodd\" \
            d=\"M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 \
            128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 \
            0 402.48 0 384.662z\"/></g></svg>",
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
    // .ui__dialog-content.ls-dialog-settings { max-width: 64rem };
    // padding:0 pairs with the web .settings-modal margin:-1.5rem —
    // the settings body fills the card edge-to-edge
    lui_gpui::style::register_class_style(
        "ls-dialog-settings",
        "max-width:1024px;padding:0",
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
    // .ui__dialog-close { position:absolute; right/top:1rem; opacity:.7 }
    lui_gpui::style::register_class_style(
        "ui__dialog-close",
        "position:absolute; top:16px; right:16px; opacity:0.7",
        "cursor-pointer",
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
    shared.app_icon_svg = Some(Rc::new(|name| app_svg(name)));

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
    class("cp__overlays", "position:absolute;inset:0", "pointer-events-none");
    class("cp__overlay-layer", "position:absolute;inset:0", "pointer-events-none");
    class(
        "cp__dialog-shell",
        "position:absolute;inset:0;display:flex;flex-direction:column;\
         justify-content:center;align-items:center",
        "pointer-events-none",
    );
    class("cp__cmdk-dismiss", "position:absolute;inset:0", "pointer-events-auto");
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
    // cljs ui/tooltip: dark floating bubble anchored under the trigger;
    // the inline style sets position:fixed + left/top + z-index (el attrs
    // win over class declarations, so only the paint rules live here).
    class(
        "ui__tooltip-content",
        "background:#0f172a;color:#ffffff;font-size:12px;\
         padding:4px 8px;border-radius:6px",
        "pointer-events-none whitespace-nowrap",
    );
    class(
        "ui__tooltip-arrow",
        "position:absolute;width:8px;height:8px;background:#0f172a",
        "",
    );
    class(
        "ls-tooltip-keys",
        "display:inline-flex;gap:2px;margin-left:6px;opacity:0.7",
        "",
    );
    class("ls-dialog-cmdk", "width:90dvw;max-width:56rem;padding:0", "");
    class(
        "cp__cmdk__modal",
        "position:relative;width:100%;border-radius:8px;overflow:hidden",
        "",
    );
    class(
        "cp__cmdk",
        "position:relative;display:flex;flex-direction:column;\
         justify-content:flex-start;width:100%;height:100%;\
         border-radius:8px;background:background;color:foreground",
        "",
    );
    class("ui__dialog-main-content", "width:100%", "");
    class(
        "cp__cmdk-scroller",
        "width:100%;flex-grow:1;min-height:65dvh;max-height:65dvh;\
         padding-bottom:56px",
        "overflow-y-auto",
    );
    class(
        "cp__cmdk-search-input",
        "min-width:16rem;width:100%;font-size:20px;padding:12px",
        "",
    );
    class(
        "ui__dialog-close",
        "position:absolute;top:0.75rem;right:0.75rem",
        "",
    );
    class(
        "ui__toaster-viewport",
        "position:absolute;top:3rem;right:1rem;width:22.5rem",
        "pointer-events-none",
    );
    class(
        "ui__toast",
        "position:absolute;top:0;right:0;width:100%;border-width:1px;\
         border-radius:6px;background:background",
        "pointer-events-auto",
    );
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
    class(
        "ui__context-menu-content",
        menu_chrome,
        "pointer-events-auto overflow-y-auto overflow-x-hidden",
    );
    class(
        "ui__select-content",
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
    // The scroller's row wrapper (main-content-row) justify-centers the
    // column natively: auto margins don't center on this backend, so the
    // declarations carry the cap only and min-height keeps the column
    // top-aligned instead of vertically centered by the row.
    class(
        "cp__sidebar-main-content",
        "width:100%;max-width:960px;min-height:100%",
        "",
    );
    // is-full-width routes (all-pages) — native/chrome.ml emits the
    // token in place of the data-is-full-width attr the web CSS
    // selects on.
    class("cp__sidebar-main-content--full", "max-width:100vw", "");
    // .cp__content-wrap { margin:0 auto; width:100%; padding-bottom:6rem }
    class("cp__content-wrap", "width:100%;padding-bottom:96px", "");
    // .page-inner > .ls-page-blocks hangs the block control column 20px
    // into the left gutter (cljs page.cljs margin-left:-20 inline).
    class("ls-page-blocks", "margin-left:-20px;min-height:60px", "");
    // h1.title / .ls-page-title-container — 32px medium title
    // (var(--ls-page-title-size), line-height 1.38)
    class(
        "ls-page-title",
        "font-size:32px;font-weight:500;line-height:44px",
        "",
    );
    class(
        "ls-page-title-container",
        "font-size:32px;font-weight:500;line-height:44px",
        "",
    );
    class("title", "font-size:32px;font-weight:500;line-height:44px", "");
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

    // ---- cmdk palette (web resources/css/lui-overlay.css) ----
    class(
        "cp__cmdk-input-row",
        "display:flex;flex-direction:row;align-items:center;gap:8px;\
         height:54px;padding:0 12px;background:muted;\
         border-bottom:1px solid border",
        "",
    );
    class(
        "cp__cmdk-group",
        "display:flex;flex-direction:column;padding-bottom:4px;\
         border-bottom:1px solid border",
        "",
    );
    class(
        "cp__cmdk-group-header",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:space-between;gap:8px;height:32px;\
         padding:6px 12px;font-size:12px;background:muted",
        "",
    );
    class("cp__cmdk-group-title", "font-weight:700;padding-left:2px", "");
    class(
        "cp__cmdk-group-count",
        "padding-left:6px;font-size:11px",
        "",
    );
    class("cp__cmdk-group-spacer", "flex-grow:1", "");
    class("cp__cmdk-group-more", "opacity:0.5", "");
    class(
        "cp__cmdk-group-more-inner",
        "display:flex;flex-direction:row;align-items:center;gap:4px",
        "",
    );
    // web styles the row via [data-cmdk-item]; gpui keys classes, so
    // native/cmdk_view carries cp__cmdk-item (+ -hl while highlighted)
    class(
        "cp__cmdk-item",
        "display:flex;flex-direction:column;gap:2px;padding:6px 12px;\
         margin-left:2px;margin-right:2px;border-radius:8px;\
         font-size:14px",
        "",
    );
    class(
        "cp__cmdk-item-hl",
        "background:secondary;border-radius:8px",
        "",
    );
    class(
        "cmdk-item-header",
        "display:flex;flex-direction:row;align-items:center;gap:8px;\
         padding-left:32px;font-size:12px;white-space:nowrap;\
         color:muted-foreground",
        "",
    );
    class(
        "cmdk-item-main",
        "display:flex;flex-direction:row;align-items:flex-start;gap:12px",
        "",
    );
    class(
        "cmdk-item-icon",
        "display:flex;align-items:center;justify-content:center;\
         width:20px;height:20px;border-radius:4px;background:muted",
        "",
    );
    class(
        "cmdk-item-body",
        "display:flex;flex-direction:column;flex-grow:1",
        "",
    );
    class(
        "cp__cmdk-item-main-text",
        "display:flex;flex-direction:row;align-items:center;gap:4px;\
         font-weight:500;white-space:nowrap",
        "",
    );
    class(
        "cp__cmdk-item-info",
        "font-size:12px;color:muted-foreground",
        "",
    );
    class(
        "cp__cmdk-current-page-badge",
        "border-radius:9999px;border:1px solid border;font-size:12px;\
         font-weight:500;padding:2px 8px;color:muted-foreground;\
         background:secondary",
        "",
    );
    // web resources/css/shui.css: the box lives on the combo container or
    // on each key inside `separate`; the base key is unboxed.
    class(
        "shui-shortcut-key",
        "display:flex;align-items:center;justify-content:center;\
         height:20px;min-width:20px;padding:2px 4px;font-size:12px;\
         white-space:nowrap;color:var(--lx-gray-12, var(--rx-gray-12))",
        "",
    );
    class(
        "shui-key-boxed",
        "background:var(--lx-gray-06-alpha, var(--rx-gray-06-alpha));\
         border:1px solid var(--lx-gray-06-alpha, var(--rx-gray-06-alpha));border-radius:4px",
        "",
    );
    class(
        "shui-shortcut-combo",
        "display:flex;flex-direction:row;align-items:center;\
         background:var(--lx-gray-06-alpha, var(--rx-gray-06-alpha));\
         border:1px solid var(--lx-gray-06-alpha, var(--rx-gray-06-alpha));border-radius:4px",
        "",
    );
    class(
        "shui-shortcut-separate",
        "display:flex;flex-direction:row;align-items:center;gap:4px",
        "",
    );
    class(
        "shui-shortcut-separator",
        "width:1px;background:var(--lx-gray-07-alpha, var(--rx-gray-07-alpha))",
        "self-stretch",
    );
    class(
        "shui-shortcut-row",
        "display:flex;flex-direction:row;align-items:center;gap:4px;\
         height:20px;min-height:20px;max-height:20px",
        "",
    );
    class(
        "shui-shortcut-compact",
        "display:flex;flex-direction:row;align-items:center;gap:2px;\
         font-size:12px;color:muted-foreground",
        "",
    );
    class(
        "hints",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:space-between;width:100%;min-height:45px;\
         padding:8px 12px;gap:8px;background:muted;\
         border-top:1px solid border",
        "",
    );
    class(
        "cp__cmdk-hints",
        "display:flex;flex-direction:row;align-items:center;gap:8px",
        "",
    );
    class(
        "cp__cmdk-hints-inner",
        "display:flex;flex-direction:row;align-items:center;gap:4px;\
         font-size:14px",
        "",
    );
    class(
        "cp__cmdk-hints-row",
        "display:flex;flex-direction:row;align-items:center;gap:4px",
        "",
    );
    class("cp__cmdk-hints-label", "font-weight:500", "");
    class(
        "cp__cmdk-tip",
        "display:flex;flex-direction:row;align-items:center;gap:4px;\
         opacity:0.5",
        "",
    );
    class(
        "cp__cmdk-hint",
        "display:flex;flex-direction:row;align-items:center;gap:6px;\
         font-size:12px;color:muted-foreground;opacity:0.4;\
         height:28px;padding:0 4px",
        "",
    );
    class("cp__cmdk-hint-label", "opacity:0.6", "");
    class(
        "cp__cmdk-search-only",
        "display:flex;flex-direction:column;padding:4px 12px;\
         opacity:0.7;font-size:12px;font-weight:500",
        "",
    );
    class(
        "cp__cmdk-search-only-row",
        "display:flex;flex-direction:row;align-items:center;gap:4px",
        "",
    );
    class("cp__cmdk-search-only-name", "font-weight:500;padding-left:4px", "");
    class("cp__cmdk-search-only-clear", "padding:4px", "");
    class("cp__cmdk-empty", "padding:16px;opacity:0.5", "");
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
    // The overlay paints the selection rects and caret bar over the
    // .ed-line text runs; each measured rect is an absolutely-positioned
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
    class(
        "ed-caret",
        "background:var(--ls-caret-color, var(--ls-primary-text-color))",
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
    class(
        "menu-links-wrapper",
        "display:flex;flex-direction:column;padding:4px",
        "",
    );
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

    // ---- settings dialog (resources/css/lui-overlay.css .cp__settings-*
    // + .it/.ls-* helpers). The web `.it` row is grid-cols-3 with the
    // control spanning 2 columns; taffy has no grid templates, so the
    // label column takes flex-grow:1 and every control column
    // flex-grow:2 to land the same 1:2 split.
    // .settings-modal cancels the dialog-content padding on web via
    // margin:-1.5rem — the gpui twin zeroes it on the dialog class
    // instead (ls-dialog-settings padding:0 above).
    class("settings-modal", "", "");
    class(
        "cp__settings-inner",
        "display:flex;flex-direction:row;min-height:55dvh;max-height:75dvh;\
         width:100%;align-items:stretch",
        "",
    );
    // cljs settings.css aside: bg-gray-03-alpha p-4 (natural width);
    // justify-start pins menu flow to the top (gpui columns otherwise
    // center children vertically in a stretched box)
    class(
        "settings-aside",
        "background:secondary;padding:16px;align-self:stretch;\
         justify-content:flex-start",
        "",
    );
    class(
        "cp__settings-header",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:flex-start;gap:8px;height:40px;padding:8px 0",
        "",
    );
    class(
        "cp__settings-modal-title",
        "font-size:24px;font-weight:600",
        "",
    );
    class("cp__settings-category-title", "font-size:20px", "");
    class("settings-menu", "margin-top:16px;gap:8px", "");
    class(
        "settings-menu-item",
        "width:100%;padding:4px 8px;border-radius:4px;font-size:16px;\
         line-height:24px;font-weight:400;gap:4px;\
         justify-content:flex-start;text-align:left",
        "",
    );
    class(
        "settings-article",
        "padding:16px;flex-grow:1;min-height:192px;justify-content:flex-start",
        "",
    );
    class(
        "panel-wrap",
        "padding:4px;display:flex;flex-direction:column;gap:16px",
        "",
    );
    class(
        "it",
        "display:flex;flex-direction:row;align-items:center;gap:16px;\
         width:100%",
        "",
    );
    class("ls-it-top", "align-items:flex-start", "");
    class(
        "ls-it-label-col",
        "display:flex;flex-direction:column;flex-grow:1",
        "",
    );
    // .it label — the 1fr grid column (flex-grow:1); outside .it rows
    // .ls-label only appears inside ls-it-label-col where vertical grow
    // is inert on content-height columns.
    class(
        "ls-label",
        "display:block;font-size:14px;font-weight:500;line-height:20px;\
         opacity:0.7;flex-grow:1",
        "",
    );
    class(
        "ls-it-value",
        "display:flex;flex-direction:column;flex-grow:2;\
         min-height:24px;border-radius:6px",
        "",
    );
    class(
        "ls-it-value-col",
        "display:flex;flex-direction:column;flex-grow:2",
        "",
    );
    class(
        "ls-it-actions",
        "display:flex;flex-direction:row;flex-grow:2;gap:8px;\
         align-items:center;min-height:24px",
        "",
    );
    class(
        "ls-it-side",
        "display:flex;font-size:14px;align-items:center",
        "",
    );
    class(
        "ls-it-desc",
        "font-size:12px;color:muted-foreground",
        "",
    );
    class("ls-switch-wrap", "display:flex;gap:16px;align-items:center;border-radius:6px", "");
    class("ls-switch-narrow", "max-width:320px", "");
    class("ls-kbd-cell", "text-align:right", "");
    class("ctls", "display:flex;align-items:center", "");
    class(
        "ls-ver-wrap",
        "display:flex;gap:16px;align-items:center;flex-wrap:wrap",
        "",
    );
    class("ls-ver-text", "font-size:14px", "");
    class(
        "fade-link",
        "font-size:14px;text-decoration:underline;opacity:0.7",
        "",
    );
    class("cp__settings-app-updater", "min-height:20px;position:relative;margin-bottom:-5px", "");
    class("ls-row-gap", "display:flex;gap:8px", "");
    class("ls-desc", "font-size:14px;opacity:0.7", "");
    class("ls-select-md", "width:256px;height:32px", "");
    class("ls-select-wrap", "max-width:320px;border-radius:6px", "");
    class("ls-font-global", "padding-top:12px", "");
    class(
        "ls-check-row",
        "display:flex;align-items:center;width:100%;gap:4px",
        "cursor-pointer",
    );
    class("ls-check-label", "padding-left:4px;font-size:14px;opacity:0.7", "");
    class("ls-check-cell", "display:flex;align-items:center", "");
    class("ls-btn-label", "padding-right:4px", "");
    class("ls-kbd-label", "padding:0 4px", "");
    class("ls-th-strong", "font-weight:600", "");
    class("ls-icon-sm", "width:16px;height:16px", "");
    // accent swatch grid — web grid-cols-8; flex-wrap rows land the
    // same 20px cells 8 per ~250px row
    class(
        "cp__accent-colors-list-wrap",
        "display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;\
         max-width:250px",
        "",
    );
    class("ls-swatch-cell", "display:flex;align-items:center", "");
    class(
        "ls-swatch",
        "width:20px;height:20px;border-radius:9999px;\
         display:flex;justify-content:center;align-items:center",
        "",
    );
    class("ls-swatch-dot", "width:8px;height:8px;border-radius:9999px", "");
    class("ls-swatch-none", "height:2px;width:100%;background:#b91c1c", "");
    class(
        "cp__settings-appearance-dialog-inner",
        "display:flex;flex-direction:column",
        "",
    );
    class("appearance-popup", "position:absolute", "pointer-events-auto");

    // ---- theme mode cards (lui-overlay.css .cp__theme-modes-options) —
    // the web cards are screenshot thumbnails (img/light-theme.png etc.);
    // gpui can't paint background images so the boxes carry the theme's
    // approximate fill + the active ring (exception in the audit doc)
    class(
        "cp__theme-modes-options",
        "display:flex;flex-direction:row;align-items:center;gap:12px",
        "",
    );
    class(
        "mode-light",
        "width:92px;height:63px;border-radius:4px;background:#f4f4f4;\
         border:1px solid border",
        "",
    );
    class(
        "mode-dark",
        "width:92px;height:63px;border-radius:4px;background:#1a1a1a;\
         border:1px solid border",
        "",
    );
    class(
        "mode-system",
        "width:92px;height:63px;border-radius:4px;background:#63676b;\
         border:1px solid border",
        "",
    );
    class(
        "mode-active",
        "border:2px solid var(--ls-link-text-color, var(--ls-primary-color))",
        "",
    );

    // ---- select trigger + button variants (lui-overlay.css ----
    // .ui__select-trigger, .ui__button.as-*) ----
    class(
        "ui__select-trigger",
        "display:flex;flex-direction:row;align-items:center;\
         justify-content:space-between;width:100%;height:40px;\
         padding:8px 12px;border:1px solid border;border-radius:6px;\
         background:background;font-size:14px;text-align:left",
        "cursor-pointer",
    );
    class("form-select", "", "");
    class(
        "as-solid",
        "background:primary;color:var(--ls-primary-background-color)",
        "",
    );
    class("as-secondary", "background:secondary;color:secondary-foreground", "");
    class(
        "as-outline",
        "border:1px solid border;background:background",
        "",
    );
    class("as-text", "background:transparent", "");
    class(
        "ls-btn-sm",
        "height:28px;padding:4px 12px;border-radius:4px;font-size:14px",
        "",
    );
    class(
        "ls-font-btn",
        "height:40px;font-size:14px;padding:0 16px",
        "",
    );
    class(
        "ls-active",
        "border:2px solid var(--ls-link-text-color, var(--ls-primary-color))",
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
