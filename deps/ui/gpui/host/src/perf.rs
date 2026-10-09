//! Opt-in interaction and frame tracing without debugger breakpoints.

use gpui_kit::gpui::{
    AnyElement, App, Bounds, Context, Element, ElementId, Entity, GlobalElementId,
    InspectorElementId, IntoElement, LayoutId, Pixels, Render, Window,
};
use lui_gpui::LuiRootView;
use std::sync::OnceLock;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

#[cfg(test)]
mod native_profile;

pub fn enabled() -> bool {
    *OnceLock::get_or_init(&ENABLED, || std::env::var_os("LOGSEQ_GPUI_PERF").is_some())
}

static ENABLED: OnceLock<bool> = OnceLock::new();

pub fn record(kind: &str, fields: serde_json::Value) {
    if enabled() {
        eprintln!(
            "GPUI_PERF {}",
            serde_json::json!({
                "time_ms": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs_f64() * 1000.,
                "kind": kind,
                "data": fields,
            })
        );
    }
}

pub struct TracedView(pub Entity<LuiRootView>);

impl Render for TracedView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        let inner = self.0.clone().into_any_element();
        if enabled() {
            TracedElement {
                inner,
                started: Instant::now(),
                layout_ms: 0.,
                prepaint_ms: 0.,
            }
            .into_any_element()
        } else {
            inner
        }
    }
}

struct TracedElement {
    inner: AnyElement,
    started: Instant,
    layout_ms: f64,
    prepaint_ms: f64,
}

impl IntoElement for TracedElement {
    type Element = Self;
    fn into_element(self) -> Self {
        self
    }
}

impl Element for TracedElement {
    type RequestLayoutState = ();
    type PrepaintState = ();

    fn id(&self) -> Option<ElementId> {
        None
    }
    fn source_location(&self) -> Option<&'static std::panic::Location<'static>> {
        None
    }

    fn request_layout(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        window: &mut Window,
        cx: &mut App,
    ) -> (LayoutId, ()) {
        self.started = Instant::now();
        Element::request_layout(&mut self.inner, id, inspector, window, cx)
    }

    fn prepaint(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        state: &mut (),
        window: &mut Window,
        cx: &mut App,
    ) {
        self.layout_ms = self.started.elapsed().as_secs_f64() * 1000.;
        let started = Instant::now();
        Element::prepaint(&mut self.inner, id, inspector, bounds, state, window, cx);
        self.prepaint_ms = started.elapsed().as_secs_f64() * 1000.;
    }

    fn paint(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        state: &mut (),
        prepaint: &mut (),
        window: &mut Window,
        cx: &mut App,
    ) {
        let started = Instant::now();
        Element::paint(
            &mut self.inner,
            id,
            inspector,
            bounds,
            state,
            prepaint,
            window,
            cx,
        );
        record(
            "frame",
            serde_json::json!({
                "total_ms": self.started.elapsed().as_secs_f64() * 1000.,
                "render_layout_ms": self.layout_ms,
                "prepaint_ms": self.prepaint_ms,
                "paint_ms": started.elapsed().as_secs_f64() * 1000.,
            }),
        );
    }
}
