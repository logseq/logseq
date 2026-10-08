//! `logseq-iframe` host: real embedded web content via a native webview
//! overlay (WKWebView on macOS, WebView2 on Windows, WebKitGTK on
//! Linux/X11). gpui has no webview widget, so each iframe node gets a
//! `wry::WebView` — the engine behind upstream's `gpui-webview`
//! (published as `gpui-wry`) — parked as a child of the gpui window.
//! The rendered node itself is a styled `div` — the node's inline
//! styles (width / aspect-ratio / min-height) size it — and `sync`
//! (called from the UI tick) keeps the overlay's bounds aligned with
//! the node's recorded `shared.node_bounds` (scrolling included),
//! hiding it when fully clipped or when an overlay layer is up.
//!
//! Lifetime: slots keyed by node id in a thread-local registry populated
//! from `WANTED`, written on each render. `sync` removes overlays whose
//! node stopped rendering — unmounted or reconciled away.
//!
//! Wayland (cannot embed foreign surfaces) and non-desktop platforms
//! fall back to a labeled chip.

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

/// Labeled chip — the no-src and unsupported-platform fallback.
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

#[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
mod embed {
    use super::*;
    use lui_gpui::style;
    use lui_gpui::Shared;
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::time::Instant;
    use wry::Rect;

    #[cfg(target_os = "linux")]
    use wry::dpi::{PhysicalPosition, PhysicalSize};
    #[cfg(not(target_os = "linux"))]
    use wry::dpi::{LogicalPosition, LogicalSize};

    /// Mobile-Safari UA on WebKit engines: a desktop UA makes YouTube
    /// serve DASH/VP9/AV1 streams WebKit can't decode (player loads,
    /// then "Playback ID" errors) — iOS Safari gets H264 instead.
    /// WebView2 is real Chromium, so it keeps a desktop Chrome UA.
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    const USER_AGENT: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    #[cfg(target_os = "windows")]
    const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    /// The last state pushed to the native view. Platform calls
    /// (`set_bounds` / `set_visible` / `zoom`) only fire when the desired
    /// state differs — a static frame must not invalidate platform
    /// layout every tick.
    #[derive(Clone, Copy, PartialEq)]
    struct Applied {
        visible: bool,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        /// Linux reads this to re-derive device-pixel bounds and page
        /// zoom; kept on every platform so the comparison stays uniform.
        scale: f64,
    }

    /// A parked embed.
    struct Slot {
        webview: wry::WebView,
        url: String,
        seen: Instant,
        applied: Option<Applied>,
    }

    thread_local! {
        static SLOTS: RefCell<HashMap<i64, Slot>> = RefCell::new(HashMap::new());
        /// Node id → src for every logseq-iframe rendered this epoch.
        /// Written by `render`, consumed by `sync`.
        static WANTED: RefCell<HashMap<i64, (String, Option<String>)>> =
            RefCell::new(HashMap::new());
        /// `overlay_active` result keyed by the store generation it was
        /// computed against — the DFS is only re-run after a batch lands.
        static OVERLAY_CACHE: RefCell<(i64, bool)> = const { RefCell::new((-1, false)) };
    }

    /// Embed-capable window? Linux requires X11 — Wayland cannot host a
    /// foreign surface, so those nodes render the chip instead.
    #[cfg(target_os = "linux")]
    fn supported(window: &Window) -> bool {
        use wry::raw_window_handle::{HasWindowHandle, RawWindowHandle};
        matches!(
            HasWindowHandle::window_handle(window).map(|h| h.as_raw()),
            Ok(RawWindowHandle::Xcb(_) | RawWindowHandle::Xlib(_))
        )
    }

    #[cfg(not(target_os = "linux"))]
    fn supported(_window: &Window) -> bool {
        true
    }

    /// Embeds loaded as a top-level document 403/Error-15x without a
    /// Referer. A DOM iframe sends the embedding page's origin — the
    /// node's own `referer` attr is the same hint (cljs sets
    /// `https://logseq.com`); providers without it fall back to their
    /// own origin.
    fn provider_headers(url: &str, referer: Option<&str>) -> wry::http::HeaderMap {
        let mut headers = wry::http::HeaderMap::new();
        let origin = referer.map(str::to_string).or_else(|| {
            url.split("://")
                .nth(1)
                .and_then(|rest| rest.split('/').next())
                .map(|host| format!("https://{host}/"))
        });
        if let Some(origin) = origin {
            if let Ok(value) = wry::http::HeaderValue::from_str(&origin) {
                headers.insert(wry::http::header::REFERER, value);
            }
        }
        headers
    }

    // ------------------------------------------------------------------
    // Linux plumbing — the pieces `gpui-webview` keeps under
    // cfg(target_os = "linux"): the Xcb → Xlib parent translation, the
    // GTK main-loop pump, and the page zoom matching gpui's scale.
    // ------------------------------------------------------------------

    /// The GPUI window as the Xlib parent Wry requires; GPUI reports its
    /// X11 window through XCB.
    #[cfg(target_os = "linux")]
    struct X11Parent(wry::raw_window_handle::XlibWindowHandle);

    #[cfg(target_os = "linux")]
    impl X11Parent {
        fn new(window: &Window) -> wry::Result<Self> {
            use wry::raw_window_handle::{
                HasWindowHandle, RawWindowHandle, XlibWindowHandle,
            };
            let io_err = |e| wry::Error::Io(std::io::Error::other(e));
            match HasWindowHandle::window_handle(window)
                .map_err(io_err)?
                .as_raw()
            {
                RawWindowHandle::Xcb(h) => {
                    let mut xlib = XlibWindowHandle::new(h.window.get().into());
                    xlib.visual_id = h.visual_id.map_or(0, |id| id.get().into());
                    Ok(Self(xlib))
                }
                RawWindowHandle::Xlib(h) => Ok(Self(h)),
                _ => Err(io_err(
                    "WebView on Linux requires an X11 window; start the application with \
                     `gpui_kit::platform::linux(WindowingModes::X11)`",
                )),
            }
        }
    }

    #[cfg(target_os = "linux")]
    impl wry::raw_window_handle::HasWindowHandle for X11Parent {
        fn window_handle(
            &self,
        ) -> Result<wry::raw_window_handle::WindowHandle<'_>, wry::raw_window_handle::HandleError>
        {
            use wry::raw_window_handle::{RawWindowHandle, WindowHandle};
            // SAFETY: the X11 window outlives the webview, which is
            // destroyed with the GPUI window.
            Ok(unsafe { WindowHandle::borrow_raw(RawWindowHandle::Xlib(self.0)) })
        }
    }

    #[cfg(target_os = "linux")]
    thread_local! {
        static GTK_READY: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    }

    /// Wry panics without an initialized GTK on the calling thread;
    /// WebKitGTK must stay on the X11 backend.
    #[cfg(target_os = "linux")]
    fn ensure_gtk() -> wry::Result<()> {
        GTK_READY.with(|ready| {
            if ready.get() {
                return Ok(());
            }
            if !gtk::is_initialized_main_thread() {
                gtk::gdk::set_allowed_backends("x11");
                gtk::init().map_err(|e| wry::Error::Io(std::io::Error::other(e)))?;
            }
            ready.set(true);
            Ok(())
        })
    }

    /// WebKitGTK has no event loop of its own here — drain its pending
    /// events on the frame tick while any webview is alive.
    #[cfg(target_os = "linux")]
    fn pump_gtk() {
        GTK_READY.with(|ready| {
            if ready.get() {
                while gtk::events_pending() {
                    gtk::main_iteration_do(false);
                }
            }
        });
    }

    /// Zoom the page so its CSS pixels match gpui's scale; GDK only
    /// supports integer scales.
    #[cfg(target_os = "linux")]
    fn match_scale_factor(webview: &wry::WebView, scale_factor: f64) {
        use gtk::prelude::WidgetExt as _;
        use wry::WebViewExtUnix as _;
        let gdk_scale = webview.webview().scale_factor().max(1);
        let _ = webview.zoom(scale_factor / f64::from(gdk_scale));
    }

    /// Create the child webview for `node_id`'s slot.
    #[cfg(target_os = "linux")]
    fn create_webview(window: &Window, url: &str, referer: Option<&str>) -> wry::Result<wry::WebView> {
        ensure_gtk()?;
        let parent = X11Parent::new(window)?;
        wry::WebViewBuilder::new()
            .with_user_agent(USER_AGENT)
            .with_url_and_headers(url, provider_headers(url, referer))
            .build_as_child(&parent)
    }

    #[cfg(not(target_os = "linux"))]
    fn create_webview(window: &Window, url: &str, referer: Option<&str>) -> wry::Result<wry::WebView> {
        wry::WebViewBuilder::new()
            .with_user_agent(USER_AGENT)
            .with_url_and_headers(url, provider_headers(url, referer))
            .build_as_child(window)
    }

    /// Create or refresh the overlay for `node_id`; (re)loads the request
    /// when the url changed.
    fn ensure_slot(node_id: i64, url: &str, referer: Option<&str>, window: &Window) {
        SLOTS.with(|cell| {
            let mut slots = cell.borrow_mut();
            let mut needs_load = false;
            match slots.get_mut(&node_id) {
                Some(slot) => {
                    if slot.url != url {
                        slot.url = url.to_string();
                        needs_load = true;
                    }
                }
                None => match create_webview(window, url, referer) {
                    Ok(webview) => {
                        eprintln!("webview: create #{node_id} {url}");
                        slots.insert(
                            node_id,
                            Slot {
                                webview,
                                url: url.to_string(),
                                seen: Instant::now(),
                                applied: None,
                            },
                        );
                    }
                    Err(e) => eprintln!("webview: create #{node_id} failed: {e}"),
                },
            }
            if needs_load {
                if let Some(slot) = slots.get(&node_id) {
                    eprintln!("webview: load #{node_id} {url}");
                    let _ = slot
                        .webview
                        .load_url_with_headers(url, provider_headers(url, referer));
                }
            }
        });
    }

    /// Push visibility + bounds to the native view — only when the
    /// desired state differs from the last applied one.
    fn apply(slot: &mut Slot, desired: Option<(f64, f64, f64, f64)>, scale: f64) {
        let next = match desired {
            Some((x, y, w, h)) => Applied {
                visible: true,
                x,
                y,
                w,
                h,
                scale,
            },
            None => Applied {
                visible: false,
                x: 0.0,
                y: 0.0,
                w: 0.0,
                h: 0.0,
                scale,
            },
        };
        let prev = slot.applied.replace(next);
        if prev == Some(next) {
            return;
        }
        // A fresh webview starts visible; treat "no applied state" as
        // visible so a first-frame hide still reaches the platform.
        let was_visible = prev.map(|p| p.visible).unwrap_or(true);
        if next.visible {
            let rect_moved = prev
                .map(|p| (p.x, p.y, p.w, p.h) != (next.x, next.y, next.w, next.h))
                .unwrap_or(true);
            #[cfg(target_os = "linux")]
            let scale_moved = prev.map(|p| p.scale) != Some(next.scale);
            #[cfg(not(target_os = "linux"))]
            let scale_moved = false;
            if !was_visible || rect_moved || scale_moved {
                let _ = slot.webview.set_bounds(to_rect(next));
                #[cfg(target_os = "linux")]
                if scale_moved {
                    match_scale_factor(&slot.webview, next.scale);
                }
            }
            if !was_visible {
                let _ = slot.webview.set_visible(true);
            }
        } else if was_visible {
            let _ = slot.webview.set_visible(false);
        }
    }

    /// Window-space logical pixels → the units wry's `set_bounds`
    /// expects per platform. macOS/Windows take logical units (wry maps
    /// to AppKit points / WebView2 device pixels); on Linux wry scales
    /// by GDK's factor which ignores gpui's, so pass device pixels.
    fn to_rect(a: Applied) -> Rect {
        #[cfg(target_os = "linux")]
        {
            Rect {
                position: PhysicalPosition::new(a.x * a.scale, a.y * a.scale).into(),
                size: PhysicalSize::new(a.w * a.scale, a.h * a.scale).into(),
            }
        }
        #[cfg(not(target_os = "linux"))]
        {
            Rect {
                position: LogicalPosition::new(a.x, a.y).into(),
                size: LogicalSize::new(a.w, a.h).into(),
            }
        }
    }

    /// Native webviews sit above the gpui canvas — they can never be
    /// occluded by painted content, so when any overlay layer (dialog,
    /// menu, toast — anything under `.cp__overlays` besides its keyed
    /// placeholders) is up, the embeds must hide like the web DOM
    /// iframes occluded by the same layer.
    ///
    /// The DFS over the store runs once per store generation — batches
    /// bump `store.generation`, so an unchanged store reuses the cached
    /// answer instead of walking the tree every frame.
    fn overlay_active(shared: &Shared) -> bool {
        let store = shared.borrow();
        let generation = store.store.generation;
        if let Some(answer) = OVERLAY_CACHE.with(|cell| {
            let cache = cell.borrow();
            (cache.0 == generation).then_some(cache.1)
        }) {
            return answer;
        }
        let mut found = false;
        if let Some(root) = store.store.root {
            let mut stack = vec![root];
            while let Some(id) = stack.pop() {
                let Some(node) = store.store.node(id) else {
                    continue;
                };
                match node.identity.kind() {
                    Some(lui_core::NodeKind::Dialog) => {
                        found = true;
                        break;
                    }
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
                            found = true;
                            break;
                        }
                    }
                    _ => {}
                }
                stack.extend(node.children.iter().copied());
            }
        }
        OVERLAY_CACHE.with(|cell| *cell.borrow_mut() = (generation, found));
        found
    }

    /// Per-node body of `sync`: hide, align, or keep alive the slot for
    /// one wanted iframe node.
    fn sync_slot(
        shared: &Shared,
        window: &Window,
        node_id: i64,
        url: &str,
        referer: Option<&str>,
        overlays_up: bool,
        scale: f64,
        viewport: (f64, f64),
        snapshot: &HashMap<i64, gpui_kit::gpui::Bounds<gpui_kit::gpui::Pixels>>,
    ) {
        if overlays_up {
            // An overlay layer is covering the canvas — hide embeds
            // (they would float over the dialog) but keep them alive.
            SLOTS.with(|cell| {
                if let Some(slot) = cell.borrow_mut().get_mut(&node_id) {
                    slot.seen = Instant::now();
                    apply(slot, None, scale);
                }
            });
            return;
        }
        let Some(mut bounds) = snapshot.get(&node_id).copied() else {
            // Node rendered but not painted this frame (e.g. inside
            // a collapsed branch) — hide but keep.
            SLOTS.with(|cell| {
                if let Some(slot) = cell.borrow_mut().get_mut(&node_id) {
                    slot.seen = Instant::now();
                    apply(slot, None, scale);
                }
            });
            return;
        };
        // `width:100%` in an inline (shrink-to-fit) chain collapses
        // to 0 — CSS resolves the percentage against the containing
        // block, so borrow the nearest ancestor's definite width.
        if f32::from(bounds.size.width) < 8. {
            let store = shared.borrow();
            let mut cursor = store.store.node(node_id).and_then(|n| n.parent);
            for _ in 0..10 {
                let Some(pid) = cursor else { break };
                if let Some(ab) = snapshot.get(&pid) {
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
            f64::from(bounds.origin.x),
            f64::from(bounds.origin.y),
            f64::from(bounds.size.width),
            f64::from(bounds.size.height),
        );
        ensure_slot(node_id, url, referer, window);
        SLOTS.with(|cell| {
            let mut slots = cell.borrow_mut();
            let Some(slot) = slots.get_mut(&node_id) else {
                return;
            };
            slot.seen = Instant::now();
            // Fully clipped by the viewport → hide. A partially visible
            // rect is passed through un-clamped: the platform window
            // clips the overflow on every backend.
            let iw = (ex + ew).min(viewport.0) - ex.max(0.0);
            let ih = (ey + eh).min(viewport.1) - ey.max(0.0);
            if iw <= 1.0 || ih <= 1.0 {
                apply(slot, None, scale);
            } else {
                apply(slot, Some((ex, ey, ew, eh)), scale);
            }
        });
    }

    /// Tick-time overlay sync: park/remove webviews to match the
    /// recorded `node_bounds` of each iframe node this frame. `bounds`
    /// are window-space logical pixels (top-left origin on every
    /// platform); `to_rect` handles the per-platform unit conversion.
    pub fn sync(shared: &Shared, window: &Window) {
        // Nothing rendered and nothing parked — the whole sync is a
        // no-op, so skip even the cheap setup (store borrows, snapshot
        // clone, overlay DFS) instead of running it every frame.
        let wanted_empty = WANTED.with(|cell| cell.borrow().is_empty());
        let slots_empty = SLOTS.with(|cell| cell.borrow().is_empty());
        if wanted_empty && slots_empty {
            return;
        }
        #[cfg(target_os = "linux")]
        pump_gtk();

        // The overlay DFS only matters while embeds are (or could be)
        // visible; a stale-slot GC pass doesn't need it.
        let overlays_up = !wanted_empty && overlay_active(shared);
        let scale = window.scale_factor() as f64;
        let viewport = window.viewport_size();
        let viewport = (f64::from(viewport.width), f64::from(viewport.height));
        // Cloned only when the loop below actually iterates — an
        // empty-WANTED GC tick must not clone the whole bounds table.
        let bounds_snapshot = (!wanted_empty).then(|| shared.borrow().node_bounds.clone());

        WANTED.with(|wanted_cell| {
            if !wanted_empty {
                // Unmounted nodes linger in WANTED (render only writes);
                // drop them by store membership so their slots GC below.
                {
                    let store = shared.borrow();
                    wanted_cell
                        .borrow_mut()
                        .retain(|id, _| store.store.node(*id).is_some());
                }
                let snapshot = bounds_snapshot
                    .as_ref()
                    .expect("bounds snapshot cloned when wanted is non-empty");
                let wanted = wanted_cell.borrow();
                for (&node_id, (url, referer)) in wanted.iter() {
                    sync_slot(
                        shared,
                        window,
                        node_id,
                        url,
                        referer.as_deref(),
                        overlays_up,
                        scale,
                        viewport,
                        snapshot,
                    );
                }
            }
            // GC overlays whose node stopped rendering entirely.
            let stale: Vec<i64> = SLOTS.with(|cell| {
                let wanted = wanted_cell.borrow();
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
                    // Dropping the wry::WebView tears down the native
                    // child view on every platform.
                    cell.borrow_mut().remove(&id);
                });
            }
        });
    }

    pub fn render(
        _view: &mut LuiNodeView,
        node: &NodeSnapshot,
        window: &mut Window,
        cx: &mut Context<LuiNodeView>,
    ) -> AnyElement {
        let Some(url) = attr(node, "src").filter(|u| !u.is_empty()) else {
            return chip(node, cx);
        };
        if !supported(window) {
            return chip(node, cx);
        }
        WANTED.with(|cell| {
            cell.borrow_mut()
                .insert(node.id, (url, attr(node, "referer")));
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

#[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
pub fn render(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    embed::render(view, node, window, cx)
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
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
    #[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
    embed::sync(shared, window);
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    let _ = (shared, window);
}
