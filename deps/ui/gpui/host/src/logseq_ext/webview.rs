//! `logseq-iframe` host: real embedded web content via a WKWebView
//! overlay (macOS). gpui has no webview widget, so each iframe node gets a
//! native `WKWebView` parked inside a clipping `NSView` subview of the
//! window's content view. The rendered node itself is a styled `div` —
//! the node's inline styles (width / aspect-ratio / min-height) size it —
//! and `sync` (called from the UI tick) keeps the overlay's frame aligned
//! with the node's recorded `shared.node_bounds` (scrolling included),
//! hiding it when fully clipped.
//!
//! Lifetime: slots keyed by node id in a thread-local registry populated
//! from `WANTED`, written on each render. `sync` removes overlays whose
//! node stopped rendering — unmounted or reconciled away.
//!
//! Non-macOS platforms fall back to a labeled chip.

use gpui_kit::component::theme::ActiveTheme;
use gpui_kit::gpui::{div, px, AnyElement, Context, IntoElement, ParentElement, Styled, Window};
use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};

/// The `attrs` prop is a JSON object — the web iframe's `src`/`allow`/…
/// live there, not in extension props.
fn attr(node: &NodeSnapshot, name: &str) -> Option<String> {
    let raw = node.extension_string_prop("attrs")?;
    let attrs: serde_json::Value = serde_json::from_str(raw).ok()?;
    attrs.get(name)?.as_str().map(str::to_string)
}

/// Labeled chip — the no-src and non-macOS fallback.
fn chip(node: &NodeSnapshot, cx: &mut Context<LuiNodeView>) -> AnyElement {
    let label = attr(node, "src")
        .or_else(|| attr(node, "title"))
        .unwrap_or_else(|| "iframe".to_string());
    div()
        .border_1()
        .border_color(cx.theme().border)
        .rounded_md()
        .px_2()
        .py_1()
        .text_xs()
        .text_color(cx.theme().muted_foreground)
        .child(format!("[iframe {label}]"))
        .into_any_element()
}

#[cfg(target_os = "macos")]
mod macos {
    use super::*;
    use lui_gpui::style;
    use lui_gpui::Shared;
    use objc2::rc::Retained;
    use objc2::MainThreadMarker;
    use objc2_app_kit::NSView;
    use objc2_foundation::{NSMutableURLRequest, NSPoint, NSRect, NSSize, NSString, NSURL};
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};
    use raw_window_handle::HasWindowHandle;
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::ffi::c_void;
    use std::ptr::NonNull;
    use std::time::Instant;

    /// A parked embed: `clip` is the clipping container subview, `web`
    /// the WKWebView inside it.
    struct Slot {
        clip: Retained<NSView>,
        web: Retained<WKWebView>,
        url: String,
        seen: Instant,
    }

    thread_local! {
        static SLOTS: RefCell<HashMap<i64, Slot>> = RefCell::new(HashMap::new());
        /// Node id → src for every logseq-iframe rendered this epoch.
        /// Written by `render`, consumed by `sync`.
        static WANTED: RefCell<HashMap<i64, String>> = RefCell::new(HashMap::new());
    }

    // The NSView gpui draws into, resolved once from the raw handle.
    thread_local! {
        static HOST_VIEW: RefCell<Option<Retained<NSView>>> = const { RefCell::new(None) };
    }

    fn host_view(window: &Window) -> Option<Retained<NSView>> {
        HOST_VIEW.with(|cell| {
            let mut cached = cell.borrow_mut();
            if cached.is_none() {
                // `window_handle()` also exists as an inherent method
                // (AnyWindowHandle) — call the trait impl explicitly.
                let Ok(handle) = HasWindowHandle::window_handle(window) else {
                    return None;
                };
                let raw_window_handle::RawWindowHandle::AppKit(appkit) = handle.as_raw() else {
                    return None;
                };
                let ptr: NonNull<c_void> = appkit.ns_view;
                // SAFETY: the raw-window-handle contract guarantees `ns_view`
                // is a live NSView while the window is alive. Retaining keeps
                // it (and its hierarchy) alive for overlay cleanup.
                *cached = Some(unsafe { Retained::retain(ptr.cast::<NSView>().as_ptr()) }?);
            }
            cached.clone()
        })
    }

    /// Create or refresh the overlay for `node_id`; (re)loads the request
    /// when the url changed.
    fn ensure_slot(node_id: i64, url: &str, parent: &NSView) {
        SLOTS.with(|cell| {
            let mut slots = cell.borrow_mut();
            let needs_load = match slots.get_mut(&node_id) {
                Some(slot) => {
                    if slot.url != url {
                        slot.url = url.to_string();
                        true
                    } else {
                        false
                    }
                }
                None => {
                    let mtm = unsafe { MainThreadMarker::new_unchecked() };
                    let clip = NSView::new(mtm);
                    clip.setWantsLayer(true);
                    if let Some(layer) = clip.layer() {
                        layer.setMasksToBounds(true);
                    }
                    let config = unsafe { WKWebViewConfiguration::new(mtm) };
                    let web = unsafe {
                        WKWebView::initWithFrame_configuration(
                            mtm.alloc::<WKWebView>(),
                            NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(100.0, 100.0)),
                            &config,
                        )
                    };
                    // Provider embeds (YouTube Error 153) reject the
                    // WKWebView default agent — present a stock Chrome
                    // agent instead.
                    let agent = NSString::from_str(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                    );
                    unsafe { web.setCustomUserAgent(Some(&agent)) };
                    clip.addSubview(&web);
                    parent.addSubview(&clip);
                    slots.insert(
                        node_id,
                        Slot {
                            clip,
                            web,
                            url: url.to_string(),
                            seen: Instant::now(),
                        },
                    );
                    true
                }
            };
            if !needs_load {
                return;
            }
            let Some(nsurl) = NSURL::URLWithString(&NSString::from_str(url)) else {
                eprintln!("webview: bad url {url}");
                return;
            };
            // YouTube embeds loaded as a top-level document 403/Error-153
            // without a Referer — send the provider's origin.
            let request = NSMutableURLRequest::requestWithURL(&nsurl);
            if let Some(host) = url
                .split("://")
                .nth(1)
                .and_then(|rest| rest.split('/').next())
            {
                let referer = format!("https://{host}/");
                request.setValue_forHTTPHeaderField(
                    Some(&NSString::from_str(&referer)),
                    &NSString::from_str("Referer"),
                );
            }
            if let Some(slot) = slots.get(&node_id) {
                eprintln!("webview: load #{node_id} {url}");
                unsafe { slot.web.loadRequest(&request) };
            }
        });
    }

    /// WKWebViews are NSView siblings above the gpui canvas — they can
    /// never be occluded by painted content, so when any overlay layer
    /// (dialog, menu, toast — anything under `.cp__overlays` besides its
    /// keyed placeholders) is up, the embeds must hide like the web
    /// DOM iframes occluded by the same layer.
    fn overlay_active(shared: &Shared) -> bool {
        let store = shared.borrow();
        let Some(root) = store.store.root else {
            return false;
        };
        let mut stack = vec![root];
        while let Some(id) = stack.pop() {
            let Some(node) = store.store.node(id) else {
                continue;
            };
            match node.identity.kind() {
                Some(lui_core::NodeKind::Dialog) => return true,
                Some(lui_core::NodeKind::Popover) => {
                    let classes = node
                        .string_prop(lui_core::Property::StyleClass)
                        .or_else(|| {
                            node.extension_props
                                .get("style-class")
                                .and_then(|v| v.as_str())
                        })
                        .unwrap_or("");
                    if !classes.split_whitespace().any(|c| c == "cp__overlays") {
                        return true;
                    }
                }
                _ => {}
            }
            stack.extend(node.children.iter().copied());
        }
        false
    }

    /// Tick-time overlay sync: park/remove WKWebViews to match the
    /// recorded `node_bounds` of each iframe node this frame. `bounds`
    /// are window-space pixels; the host view is AppKit (points,
    /// bottom-left origin).
    pub fn sync(shared: &Shared, window: &Window) {
        let Some(parent) = host_view(window) else {
            return;
        };
        let overlays_up = overlay_active(shared);
        let scale = window.scale_factor() as f64;
        let viewport = window.viewport_size();
        let (vw, vh) = (
            f64::from(viewport.width) / scale,
            f64::from(viewport.height) / scale,
        );
        let parent_h = parent.frame().size.height;
        let bounds_snapshot = shared.borrow().node_bounds.clone();

        WANTED.with(|wanted_cell| {
            // Unmounted nodes linger in WANTED (render only writes);
            // drop them by store membership so their slots GC below.
            {
                let store = shared.borrow();
                wanted_cell
                    .borrow_mut()
                    .retain(|id, _| store.store.node(*id).is_some());
            }
            let wanted = wanted_cell.borrow();
            for (&node_id, url) in wanted.iter() {
                SLOTS.with(|cell| {
                    let mut slots = cell.borrow_mut();
                    if overlays_up {
                        // An overlay layer is covering the canvas —
                        // hide embeds (they would float over the dialog)
                        // but keep them alive.
                        if let Some(slot) = slots.get_mut(&node_id) {
                            slot.clip.setHidden(true);
                            slot.seen = Instant::now();
                        }
                        return;
                    }
                    let Some(mut bounds) = bounds_snapshot.get(&node_id).copied() else {
                        // Node rendered but not painted this frame (e.g.
                        // inside a collapsed branch) — hide but keep.
                        if let Some(slot) = slots.get_mut(&node_id) {
                            slot.clip.setHidden(true);
                            slot.seen = Instant::now();
                        }
                        return;
                    };
                    // `width:100%` in an inline (shrink-to-fit) chain
                    // collapses to 0 — CSS resolves the percentage
                    // against the containing block, so borrow the
                    // nearest ancestor's definite width.
                    if f32::from(bounds.size.width) < 8. {
                        let store = shared.borrow();
                        let mut cursor = store.store.node(node_id).and_then(|n| n.parent);
                        for _ in 0..10 {
                            let Some(pid) = cursor else { break };
                            if let Some(ab) = bounds_snapshot.get(&pid) {
                                if f32::from(ab.size.width) >= 8. {
                                    bounds.origin.x = ab.origin.x;
                                    bounds.size.width = ab.size.width;
                                    break;
                                }
                            }
                            cursor = store.store.node(pid).and_then(|n| n.parent);
                        }
                    }
                    let (ex, ey, ew, eh) = (
                        f64::from(bounds.origin.x) / scale,
                        f64::from(bounds.origin.y) / scale,
                        f64::from(bounds.size.width) / scale,
                        f64::from(bounds.size.height) / scale,
                    );
                    let cx = ex.max(0.0);
                    let cy = ey.max(0.0);
                    let cw = (ex + ew).min(vw) - cx;
                    let ch = (ey + eh).min(vh) - cy;
                    drop(slots);
                    ensure_slot(node_id, url, &parent);
                    let mut slots = cell.borrow_mut();
                    let Some(slot) = slots.get_mut(&node_id) else {
                        return;
                    };
                    slot.seen = Instant::now();
                    if cw <= 1.0 || ch <= 1.0 {
                        slot.clip.setHidden(true);
                        return;
                    }
                    slot.clip.setHidden(false);
                    slot.clip.setFrame(NSRect::new(
                        NSPoint::new(cx, parent_h - cy - ch),
                        NSSize::new(cw, ch),
                    ));
                    // Element rect inside the clip container, bottom-left
                    // origin: the clip's visible region is offset
                    // (cx-ex, cy-ey) into the full element.
                    slot.web.setFrame(NSRect::new(
                        NSPoint::new(ex - cx, ch - (ey - cy) - eh),
                        NSSize::new(ew, eh),
                    ));
                });
            }
            // GC overlays whose node stopped rendering entirely.
            let stale: Vec<i64> = SLOTS.with(|cell| {
                let slots = cell.borrow();
                slots
                    .iter()
                    .filter(|(id, slot)| {
                        !wanted.contains_key(*id) && slot.seen.elapsed().as_millis() > 800
                    })
                    .map(|(id, _)| *id)
                    .collect()
            });
            for id in stale {
                SLOTS.with(|cell| {
                    if let Some(slot) = cell.borrow_mut().remove(&id) {
                        slot.clip.removeFromSuperview();
                    }
                });
            }
        });
    }

    pub fn render(
        _view: &mut LuiNodeView,
        node: &NodeSnapshot,
        _window: &mut Window,
        cx: &mut Context<LuiNodeView>,
    ) -> AnyElement {
        let Some(url) = attr(node, "src").filter(|u| !u.is_empty()) else {
            return chip(node, cx);
        };
        WANTED.with(|cell| {
            cell.borrow_mut().insert(node.id, url);
        });
        // A styled div filling its aspect-ratio shell: the node's inline
        // styles give it real bounds, recorded into node_bounds by the
        // parent's bounds_recorder and consumed by `sync`.
        let mut element = div().w_full().h_full().min_h(px(60.));
        // HTML `width`/`height` attributes are presentational — the inline
        // style wins when both are declared (style::all applies after).
        if let Some(w) = attr(node, "width").and_then(|v| v.parse::<f32>().ok()) {
            element = element.w(px(w));
        }
        if let Some(h) = attr(node, "height").and_then(|v| v.parse::<f32>().ok()) {
            element = element.h(px(h));
        }
        style::all(element, node, cx.theme()).into_any_element()
    }
}

#[cfg(target_os = "macos")]
pub fn render(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    macos::render(view, node, window, cx)
}

#[cfg(not(target_os = "macos"))]
pub fn render(
    _view: &mut LuiNodeView,
    node: &NodeSnapshot,
    _window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    chip(node, cx)
}

/// Tick-time overlay sync + GC — see module docs. Call from the host's
/// frame tick.
pub fn sweep(shared: &lui_gpui::Shared, window: &Window) {
    #[cfg(target_os = "macos")]
    macos::sync(shared, window);
    #[cfg(not(target_os = "macos"))]
    let _ = (shared, window);
}
