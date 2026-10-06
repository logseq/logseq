//! `logseq-pdf` — hayro-based PDF page host.
//!
//! First-pass scope: one-page rendering, `page`/`scale` props, wheel zoom
//! (ctrl/cmd+scroll) and page flip (scroll), highlight rects as colored
//! overlays, plus the `pdf-page`/`pdf-scale`/`pdf-close` dom-events the
//! OCaml side already handles. Hit-testing for `pdf-hl-add`/`pdf-hl-area`
//! is stubbed by the data model (`PdfHl`) until the area-select gesture
//! lands.
//!
//! Attrs come through the `attrs` prop as JSON:
//!   {path, filename, hls, page, scale, ref_hl, theme, dashed, colored,
//!    automenu, hl_mode, area_mode}
//! `hls` is the OCaml-side highlight list:
//!   [{id, page, color, bounding:{x,y,w,h}, rects:[...], text, image}]
//! in viewer coordinates (unscaled page space) — same contract as web.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;

use gpui_kit::component::theme::ActiveTheme;
use gpui_kit::gpui::{
    div, img, px, rgb, AnyElement, App, Context, ElementId, ImageSource,
    InteractiveElement, IntoElement, ParentElement, RenderImage, Styled, WeakEntity, Window,
};
use lui_core::store::NodeIdentity;
use serde::Deserialize;

use lui_gpui::dom::dom_event;
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::style;

// ---------------------------------------------------------------------------
// Model

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PdfAttrs {
    /// Absolute path or file:// URL of the pdf on disk.
    pub path: Option<String>,
    pub filename: Option<String>,
    /// Highlight list JSON (see `PdfHl`).
    pub hls: Option<String>,
    /// Current page (1-based).
    pub page: Option<f64>,
    /// Zoom factor (1.0 = base).
    pub scale: Option<f64>,
    /// Highlight to flash/center.
    pub ref_hl: Option<String>,
    pub theme: Option<String>,
    pub dashed: Option<bool>,
    pub colored: Option<bool>,
    pub automenu: Option<bool>,
    pub hl_mode: Option<bool>,
    pub area_mode: Option<bool>,
}

impl Default for PdfAttrs {
    fn default() -> Self {
        PdfAttrs {
            path: None,
            filename: None,
            hls: None,
            page: None,
            scale: None,
            ref_hl: None,
            theme: None,
            dashed: None,
            colored: None,
            automenu: None,
            hl_mode: None,
            area_mode: None,
        }
    }
}

impl PdfAttrs {
    fn parse(node: &NodeSnapshot) -> Self {
        node.extension_string_prop("attrs")
            .and_then(|raw| serde_json::from_str(raw).ok())
            .unwrap_or_default()
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct PdfHlRect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PdfHl {
    pub id: String,
    pub page: u32,
    pub color: Option<String>,
    pub bounding: Option<PdfHlRect>,
    pub rects: Vec<PdfHlRect>,
    pub text: Option<String>,
    pub image: Option<String>,
}

impl Default for PdfHl {
    fn default() -> Self {
        PdfHl {
            id: String::new(),
            page: 0,
            color: None,
            bounding: None,
            rects: Vec::new(),
            text: None,
            image: None,
        }
    }
}

/// Per-node viewer state, shared into event closures via `Rc`.
#[derive(Default)]
pub struct PdfState {
    /// Loaded pdf bytes; `None` until `path` resolves to a readable file.
    pub data: Option<Arc<Vec<u8>>>,
    pub path: String,
    /// Base page dims at scale 1 (pdf points), 1:1 with `pages()`.
    pub page_dims: Vec<(f32, f32)>,
    /// 1-based current page.
    pub page: u32,
    /// Whether `page` follows the `page` prop (paged mode) or free scroll.
    pub page_mode: bool,
    pub scale: f32,
    pub hl_mode: bool,
    pub area_mode: bool,
    /// Rendered pages: (page, width bucket) -> gpu image.
    pub pages: HashMap<(u32, u32), Arc<RenderImage>>,
}


/// Fetch (or create) this node's `PdfState` inside `app_state`.
fn pdf_state(view: &mut LuiNodeView) -> Rc<RefCell<PdfState>> {
    if view.states.app_state.is_none() {
        view.states.app_state =
            Some(Rc::new(RefCell::new(PdfState::default())));
    }
    view.states
        .app_state
        .clone()
        .expect("app_state set")
        .downcast::<RefCell<PdfState>>()
        .expect("app_state belongs to logseq-pdf")
}

/// Decode page dimensions once per document.
fn open_doc(data: &Arc<Vec<u8>>) -> Option<Vec<(f32, f32)>> {
    let doc = hayro_syntax::Pdf::new(data.clone()).ok()?;
    Some(
        doc.pages()
            .iter()
            .map(|page| page.render_dimensions())
            .collect::<Vec<_>>(),
    )
}

/// Rasterize `page_index` at `scale` into a gpui image.
fn render_page(data: &Arc<Vec<u8>>, page_index: u32, scale: f32) -> Option<RenderImage> {
    let doc = hayro_syntax::Pdf::new(data.clone()).ok()?;
    let page = doc.pages().get(page_index as usize)?;
    let pixmap = hayro::render(
        &page,
        &hayro::RenderCache::new(),
        &hayro::hayro_interpret::InterpreterSettings::default(),
        &hayro::RenderSettings::default(),
        &hayro::PixmapSettings {
            x_scale: scale,
            y_scale: scale,
            ..Default::default()
        },
    );
    let (w, h) = (pixmap.width() as u32, pixmap.height() as u32);
    if w == 0 || h == 0 {
        return None;
    }
    // Premultiplied RGBA -> BGRA expected by the texture upload.
    let mut buf = pixmap.data_as_u8_slice().to_vec();
    for px in buf.chunks_exact_mut(4) {
        px.swap(0, 2);
    }
    let image = image::RgbaImage::from_raw(w, h, buf)?;
    Some(RenderImage::new([image::Frame::new(image)]))
}

// ---------------------------------------------------------------------------
// Events

fn has_event(node: &NodeSnapshot, kind: &str) -> bool {
    node.extension_string_prop("events")
        .map(|e| e.split_whitespace().any(|e| e == kind))
        .unwrap_or(false)
}

fn identifier_of(node: &NodeSnapshot) -> String {
    match &node.identity {
        NodeIdentity::Extension { identifier, .. } => identifier.clone(),
        _ => "logseq-pdf".to_string(),
    }
}

fn fire_pdf(
    shared: &lui_gpui::Shared,
    node_id: i64,
    identifier: &str,
    kind: &str,
    fields: serde_json::Value,
    cx: &mut App,
) {
    dom_event(shared, node_id, identifier, kind, fields, cx);
}

// ---------------------------------------------------------------------------
// Render

pub fn render(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let attrs = PdfAttrs::parse(node);
    let path = attrs.path.clone().unwrap_or_default();
    let wire_page = attrs.page.unwrap_or(1.).max(1.) as u32;
    let hls: Vec<PdfHl> = attrs
        .hls
        .as_deref()
        .and_then(|raw| serde_json::from_str(raw).ok())
        .unwrap_or_default();
    let identifier = identifier_of(node);
    let node_id = node.id;
    let shared = view.shared.clone();
    let state_rc = pdf_state(view);

    {
        let mut state = state_rc.borrow_mut();
        if state.path != path {
            // New document.
            state.path = path.clone();
            state.data = None;
            state.page_dims.clear();
            state.pages.clear();
        }
        state.page_mode = true;
        state.hl_mode = attrs.hl_mode.unwrap_or(false);
        state.area_mode = attrs.area_mode.unwrap_or(false);
        if let Some(scale) = attrs.scale {
            if scale > 0. && (scale as f32 - state.scale).abs() > f32::EPSILON {
                state.scale = scale as f32;
                state.pages.clear();
            }
        }
        if state.scale == 0. {
            state.scale = 1.;
        }
    }

    // First open of the current path.
    if state_rc.borrow().data.is_none() && !path.is_empty() {
        let disk_path = path.trim_start_matches("file://");
        if let Ok(bytes) = std::fs::read(disk_path) {
            let data = Arc::new(bytes);
            if let Some(dims) = open_doc(&data) {
                let count = dims.len() as u32;
                let mut state = state_rc.borrow_mut();
                state.data = Some(data);
                state.page_dims = dims;
                drop(state);
                fire_pdf(
                    &shared,
                    node_id,
                    &identifier,
                    "pdf-page",
                    serde_json::json!({ "page": wire_page, "pageCount": count }),
                    cx,
                );
            } else {
                return placeholder(node, "Failed to read pdf", cx);
            }
        } else {
            return placeholder(
                node,
                &attrs.filename.unwrap_or_else(|| disk_path.to_string()),
                cx,
            );
        }
    }

    // Prop -> current page.
    {
        let mut state = state_rc.borrow_mut();
        let count = state.page_dims.len() as u32;
        let clamped = wire_page.min(count.max(1)).max(1);
        if state.page == 0 || (state.page_mode && state.page != clamped) {
            state.page = clamped;
        }
    }

    let (data, page, scale, dims) = {
        let state = state_rc.borrow();
        (
            state.data.clone(),
            state.page,
            state.scale,
            state.page_dims.clone(),
        )
    };
    let Some(data) = data else {
        return placeholder(node, "", cx);
    };
    let Some(&(pw, ph)) = dims.get((page - 1) as usize) else {
        return placeholder(node, "", cx);
    };
    // Raster cache key: page + physical-width bucket (64px granularity
    // keeps the cache from churning on every wheel tick).
    let display_scale = window.scale_factor() * scale;
    let bucket = ((pw * display_scale) as u32 / 64).max(1);
    let image = {
        let mut state = state_rc.borrow_mut();
        match state.pages.entry((page, bucket)) {
            std::collections::hash_map::Entry::Occupied(e) => Some(e.get().clone()),
            std::collections::hash_map::Entry::Vacant(e) => {
                let raster_scale = bucket as f32 * 64. / pw;
                let rendered = render_page(&data, page - 1, raster_scale).map(Arc::new);
                if let Some(image) = &rendered {
                    e.insert(image.clone());
                }
                rendered
            }
        }
    };

    let mut page_el = div()
        .id(ElementId::Integer(node_id as u64))
        .w(px(pw * scale))
        .h(px(ph * scale))
        .relative()
        .bg(rgb(0xffffff));

    match image {
        Some(image) => {
            page_el = page_el.child(img(ImageSource::Render(image)).w_full().h_full());
        }
        None => {
            page_el = page_el.child(
                div()
                    .w_full()
                    .h_full()
                    .flex()
                    .items_center()
                    .justify_center()
                    .text_color(cx.theme().muted_foreground)
                    .child(format!("Page {}", page)),
            );
        }
    }

    // Highlight overlays — viewer coords scaled by `scale`.
    for hl in hls.iter().filter(|h| h.page == page) {
        let color = hl_color(hl.color.as_deref().unwrap_or("yellow"));
        let rects: Vec<PdfHlRect> = if hl.rects.is_empty() {
            hl.bounding.clone().into_iter().collect()
        } else {
            hl.rects.clone()
        };
        for rect in rects {
            page_el = page_el.child(
                div()
                    .absolute()
                    .left(px(rect.x as f32 * scale))
                    .top(px(rect.y as f32 * scale))
                    .w(px(rect.w as f32 * scale))
                    .h(px(rect.h as f32 * scale))
                    .bg(color),
            );
        }
    }

    // Wheel: ctrl/cmd+scroll zooms, plain scroll flips pages. Both report
    // back via pdf-scale / pdf-page so the OCaml model stays authoritative.
    if has_event(node, "pdf-page") || has_event(node, "pdf-scale") {
        let pdf_state = state_rc.clone();
        let view_entity = cx.weak_entity();
        let shared = shared.clone();
        let identifier = identifier.clone();
        page_el = page_el.on_scroll_wheel(move |event, _w, cx| {
            let dy: f32 = match event.delta {
                gpui_kit::gpui::ScrollDelta::Pixels(p) => p.y.into(),
                gpui_kit::gpui::ScrollDelta::Lines(p) => p.y * 20.,
            };
            let zoom = event.modifiers.control || event.modifiers.platform;
            let mut state = pdf_state.borrow_mut();
            if zoom {
                state.scale = (state.scale * (1. + dy / 400.)).clamp(0.25, 8.0);
                let scale = state.scale;
                drop(state);
                fire_pdf(
                    &shared,
                    node_id,
                    &identifier,
                    "pdf-scale",
                    serde_json::json!({ "scale": scale }),
                    cx,
                );
            } else if dy.abs() > 4. {
                let count = state.page_dims.len() as u32;
                let next = if dy < 0. {
                    (state.page + 1).min(count.max(1))
                } else {
                    state.page.saturating_sub(1).max(1)
                };
                if next != state.page {
                    state.page = next;
                    drop(state);
                    fire_pdf(
                        &shared,
                        node_id,
                        &identifier,
                        "pdf-page",
                        serde_json::json!({ "page": next, "pageCount": count }),
                        cx,
                    );
                } else {
                    drop(state);
                }
            } else {
                drop(state);
            }
            notify_view(&view_entity, cx);
        });
    }

    // Close on Escape when the viewer advertises pdf-close.
    if has_event(node, "pdf-close") {
        let shared = shared.clone();
        let identifier = identifier.clone();
        page_el = page_el.on_key_down(move |event, _w, cx| {
            if event.keystroke.key.as_str() == "escape" {
                fire_pdf(
                    &shared,
                    node_id,
                    &identifier,
                    "pdf-close",
                    serde_json::json!({}),
                    cx,
                );
            }
        });
    }

    style::all(
        div()
            .w_full()
            .flex()
            .flex_col()
            .items_center()
            .child(page_el),
        node,
    )
    .into_any_element()
}

fn notify_view(view: &WeakEntity<LuiNodeView>, cx: &mut App) {
    if let Some(view) = view.upgrade() {
        view.update(cx, |_, cx| cx.notify());
    }
}

fn placeholder(node: &NodeSnapshot, text: &str, cx: &mut Context<LuiNodeView>) -> AnyElement {
    style::all(
        div()
            .w_full()
            .h_full()
            .flex()
            .items_center()
            .justify_center()
            .text_color(cx.theme().muted_foreground)
            .child(text.to_string()),
        node,
    )
    .into_any_element()
}

fn hl_color(name: &str) -> gpui_kit::gpui::Rgba {
    let value = match name {
        "yellow" => 0xffcc00,
        "green" => 0x5ac26f,
        "blue" => 0x2cb8f5,
        "purple" => 0xb28af7,
        "pink" | "magenta" => 0xf2789f,
        "red" => 0xef5656,
        "orange" => 0xf7a224,
        "gray" | "grey" => 0xa5a5a5,
        _ => 0xffcc00,
    };
    let mut rgba = gpui_kit::gpui::Rgba::from(rgb(value));
    rgba.a = 0.35;
    rgba
}
