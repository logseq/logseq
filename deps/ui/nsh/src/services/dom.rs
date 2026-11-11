//! DOM service capabilities over retained native references, never a shadow document.
//! `set-value` and custom Editor selection require their authoritative typed owners;
//! native InsertText is a user edit and is deliberately not a substitute.
use lui_nsh::{render::Renderer, runtime::PlatformEvent, store::Node};
use nsh_core::{
    RevealOptions, ScrollAlignment,
    element::ElementRef,
    geometry::{Point, Points},
    prelude::*,
};
use serde_json::{Map, Value, json};
use std::{cell::RefCell, rc::Rc, sync::Arc};

#[derive(Clone)]
struct Target {
    node: Arc<Node>,
    reference: ElementRef,
}
impl Target {
    fn current(&self, renderer: &Renderer) -> bool {
        renderer
            .node_snapshot(self.node.id)
            .is_some_and(|node| node.incarnation == self.node.incarnation)
    }
}
fn object(payload: &str) -> Result<Map<String, Value>, String> {
    serde_json::from_str::<Value>(payload)
        .map_err(|error| format!("DOM request: {error}"))?
        .as_object()
        .cloned()
        .ok_or_else(|| "DOM request requires a JSON object".into())
}
fn resolve(reference: &Value, renderer: &Renderer) -> Result<Option<Arc<Node>>, String> {
    if reference.is_null() {
        return Ok(None);
    }
    let reference = reference
        .as_object()
        .ok_or("DOM ref requires an object or null")?;
    if let Some(id) = reference.get("node-id") {
        let id = id.as_i64().ok_or("DOM node-id requires an integer")?;
        if id != 0 {
            return Ok(u64::try_from(id)
                .ok()
                .and_then(|id| renderer.node_snapshot(id)));
        }
    }
    let mut identifier = reference
        .get("ref-id")
        .map(|id| id.as_str().ok_or("DOM ref-id requires a string"))
        .transpose()?;
    if let Some(root) = reference.get("#ref") {
        if root.as_i64().is_some_and(|root| root <= 0) {
            return Ok(renderer.root_id().and_then(|id| renderer.node_snapshot(id)));
        }
        identifier = Some(
            root.as_str()
                .ok_or("DOM #ref requires a nonpositive root integer or an identifier")?,
        );
    }
    Ok(identifier
        .filter(|id| !id.is_empty())
        .and_then(|id| renderer.find_by_identifier(id)))
}
async fn target(reference: &Value, renderer: &Renderer) -> Result<Option<Target>, String> {
    let Some(node) = resolve(reference, renderer)? else {
        return Ok(None);
    };
    let Some(mut native) = renderer.native_reference(node.id, node.incarnation) else {
        return Ok(None);
    };
    if native.node().is_none() {
        // A service can follow the creating patch before that native commit.
        // Wait once for mounting; never poll or redirect the identifier later.
        next_frame().await;
        if renderer
            .node_snapshot(node.id)
            .is_none_or(|live| live.incarnation != node.incarnation)
        {
            return Ok(None);
        }
        let Some(reference) = renderer.native_reference(node.id, node.incarnation) else {
            return Ok(None);
        };
        native = reference;
    }
    Ok(native.node().is_some().then_some(Target {
        node,
        reference: native,
    }))
}
fn reply(
    reference: Value,
    target: Option<&Target>,
    measurement: Option<nsh_core::Measurement>,
    renderer: &Renderer,
) -> Result<PlatformEvent, String> {
    let mut payload = json!({"ref":reference,"rect":null});
    if let (Some(target), Some(measurement)) = (target, measurement)
        && target.current(renderer)
    {
        let (left, top, width, height) = (
            measurement.page.x.0,
            measurement.page.y.0,
            measurement.frame.size.width.0,
            measurement.frame.size.height.0,
        );
        let right = left + width;
        let bottom = top + height;
        if ![left, top, width, height, right, bottom]
            .iter()
            .all(|value| value.is_finite())
            || width < 0.0
            || height < 0.0
        {
            return Err("native measurement has invalid geometry".into());
        }
        payload["nodeId"] = json!(target.node.id);
        payload["rect"] = json!({"left":left,"top":top,"right":right,"bottom":bottom,"width":width,"height":height});
    }
    Ok(PlatformEvent {
        operation: "node-rect".into(),
        payload: payload.to_string(),
    })
}
fn offset(request: &Map<String, Value>, name: &str) -> Result<u32, String> {
    let value = request
        .get(name)
        .and_then(Value::as_u64)
        .ok_or_else(|| format!("DOM {name} requires a nonnegative integer"))?;
    u32::try_from(value).map_err(|_| format!("DOM {name} exceeds native UTF-16 offsets"))
}
fn input_text(node: &Node) -> Result<String, String> {
    if matches!(
        node.kind.as_str(),
        "input" | "text-field" | "search-field" | "textarea"
    ) {
        return Ok(node.string("text").into());
    }
    let extension = node
        .extension
        .as_ref()
        .ok_or("selection requires a native text Input")?;
    if !matches!(
        extension.identifier.as_str(),
        "logseq-input" | "logseq-textarea"
    ) {
        return Err(
            "selection requires a native text Input; custom Editor selection uses its typed API"
                .into(),
        );
    }
    let attrs = extension
        .properties
        .get("attrs")
        .and_then(Value::as_str)
        .filter(|attrs| !attrs.is_empty())
        .map(serde_json::from_str::<Map<String, Value>>)
        .transpose()
        .map_err(|error| error.to_string())?
        .unwrap_or_default();
    if attrs.get("type").and_then(Value::as_str) == Some("checkbox") {
        return Err("checkboxes do not have a text selection".into());
    }
    Ok(attrs
        .get("value")
        .or_else(|| extension.properties.get("text"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .into())
}
struct WatchOwner(Owner);
impl Drop for WatchOwner {
    fn drop(&mut self) {
        self.0.dispose();
    }
}
async fn scroll_top(target: &Target, top: f32, renderer: &Renderer) -> Result<(), String> {
    if !matches!(
        target.node.kind.as_str(),
        "scroll" | "list" | "virtual-list"
    ) {
        return Err("set-scroll-top requires a native LUI Scroll/List; raw custom scrollers require a registered capability".into());
    }
    let sampled = Rc::new(RefCell::new(None::<Point<Points>>));
    let sample = sampled.clone();
    let reference = target.reference;
    let (owner, ()) = nsh_core::element::create_root(|| {
        watch_scroll(
            move || reference.node(),
            move |event| {
                *sample.borrow_mut() = Some(event.offset);
            },
        )
    });
    let _owner = WatchOwner(owner);
    // Measurement reaches the same native commit as the public initial scroll
    // observation. No permanent watcher, timer, offset cache or idle poll remains.
    let _ = target.reference.measure().await;
    if !target.current(renderer) {
        return Ok(());
    }
    let offset = sampled
        .borrow()
        .as_ref()
        .copied()
        .ok_or("native scroll position was unavailable after commit")?;
    target
        .reference
        .scroll_to(Point::new(offset.x, px(top.max(0.0))), false);
    Ok(())
}

/// Called after the request's creating patches have been published. Any awaited
/// native reply is checked against the captured canonical incarnation again.
pub async fn handle(
    operation: &str,
    payload: &str,
    renderer: &Renderer,
) -> Result<Vec<PlatformEvent>, String> {
    if !matches!(
        operation,
        "measure-node"
            | "focus"
            | "select"
            | "set-selection-range"
            | "set-scroll-top"
            | "scroll-into-view"
            | "scroll-to-node"
    ) {
        return Err(format!(
            "DOM operation {operation} is not implemented by the NSH host"
        ));
    }
    let request = object(payload)?;
    let reference = request.get("ref").cloned().unwrap_or(Value::Null);
    let selection = if operation == "set-selection-range" {
        Some((offset(&request, "start")?, offset(&request, "end")?))
    } else {
        None
    };
    let top = if operation == "set-scroll-top" {
        let top = request
            .get("top")
            .and_then(Value::as_f64)
            .ok_or("DOM top requires a finite number")?;
        if !top.is_finite() || top.abs() > f32::MAX as f64 {
            return Err("DOM top is outside native finite range".into());
        }
        Some(top as f32)
    } else {
        None
    };
    let target = target(&reference, renderer).await?;
    if operation == "measure-node" {
        let measurement = if let Some(target) = &target {
            target.reference.measure().await
        } else {
            None
        };
        return Ok(vec![reply(
            reference,
            target.as_ref(),
            measurement,
            renderer,
        )?]);
    }
    let Some(target) = target else {
        return Ok(Vec::new());
    };
    if !target.current(renderer) {
        return Ok(Vec::new());
    }
    match operation {
        "focus" => target.reference.focus(),
        "select" | "set-selection-range" => {
            let text = input_text(&target.node)?;
            let length = u32::try_from(text.encode_utf16().count())
                .map_err(|_| "native Input value exceeds UTF-16 selection range")?;
            let (start, end) = selection.unwrap_or((0, length));
            let end = end.min(length);
            let start = start.min(end);
            if operation == "select" {
                target.reference.focus();
            }
            target.reference.set_selection(start, end);
        }
        "set-scroll-top" => scroll_top(&target, top.expect("decoded top"), renderer).await?,
        "scroll-into-view" | "scroll-to-node" => target.reference.reveal(
            RevealOptions::default()
                .vertical(ScrollAlignment::Nearest)
                .horizontal(ScrollAlignment::Nearest)
                .animated(false),
        ),
        _ => unreachable!("operation preflight"),
    }
    Ok(Vec::new())
}

#[cfg(test)]
mod tests {
    use super::*;
    use lui_nsh::wire::Batch;
    use nsh_engine::{EngineConfig, Root};
    use nsh_testing::Headless;

    #[test]
    fn request_decoding_rejects_invalid_shapes_and_offsets_without_coercion() {
        for invalid in ["null", "[]", "42", "{", ""] {
            assert!(object(invalid).is_err());
        }
        assert!(object(r##"{"ref":{"#ref":"target","measurement-id":71}}"##).is_ok());
        for invalid in [
            json!({}),
            json!({"start":-1}),
            json!({"start":1.0}),
            json!({"start":"1"}),
            json!({"start":4294967296_u64}),
        ] {
            assert!(offset(invalid.as_object().unwrap(), "start").is_err());
        }
        assert_eq!(
            offset(json!({"start":4}).as_object().unwrap(), "start").unwrap(),
            4
        );
    }
    fn patch(generation: u64, ops: Value) -> Batch {
        Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
    }
    #[component]
    fn NativeDOM() -> impl IntoElement {
        let renderer = Renderer::new(|_, _| {});
        renderer
            .apply(patch(
                1,
                json!([
            {"op":"create-node","id":1,"kind":"box"},
            {"op":"set-prop","id":1,"property":"width","value":240},
            {"op":"set-prop","id":1,"property":"height","value":100},
            {"op":"set-prop","id":1,"property":"accessibility-identifier","value":"measured"}]),
            ))
            .unwrap();
        renderer.set_root(1).unwrap();
        let status = signal("Waiting".to_owned());
        let measuring = renderer.clone();
        let retiring = renderer.clone();
        let tasks = Rc::new(RefCell::new(Vec::<nsh_core::element::Spawned<()>>::new()));
        let retire_tasks = tasks.clone();
        view()
            .child(renderer.element())
            .child(
                nsh_base::button()
                    .child(text("Measure current"))
                    .on_press(move || {
                        let renderer = measuring.clone();
                        tasks.borrow_mut().push(spawn(async move {
                            let events = handle(
                                "measure-node",
                                r##"{"ref":{"#ref":"measured","measurement-id":71}}"##,
                                &renderer,
                            )
                            .await
                            .unwrap();
                            assert_eq!(events.len(), 1);
                            assert_eq!(events[0].operation, "node-rect");
                            let event: Value = serde_json::from_str(&events[0].payload).unwrap();
                            assert_eq!(
                                event["ref"],
                                json!({"#ref":"measured","measurement-id":71})
                            );
                            assert_eq!(event["nodeId"], 1);
                            assert_eq!(event["rect"]["width"], 240.0);
                            status.set("Measured current".into());
                        }));
                    }),
            )
            .child(
                nsh_base::button()
                    .child(text("Measure retired"))
                    .on_press(move || {
                        let node = retiring.node_snapshot(1).unwrap();
                        let reference = retiring.native_reference(1, node.incarnation).unwrap();
                        let target = Target { node, reference };
                        let pending = reference.measure();
                        retiring
                            .apply(patch(
                                2,
                                json!([
                    {"op":"drop-node","id":1},{"op":"create-node","id":1,"kind":"box"},
                    {"op":"set-prop","id":1,"property":"width","value":500}]),
                            ))
                            .unwrap();
                        retiring.set_root(1).unwrap();
                        let renderer = retiring.clone();
                        retire_tasks.borrow_mut().push(spawn(async move {
                            let event = reply(
                                json!({"node-id":1,"measurement-id":72}),
                                Some(&target),
                                pending.await,
                                &renderer,
                            )
                            .unwrap();
                            let value: Value = serde_json::from_str(&event.payload).unwrap();
                            assert!(value["rect"].is_null());
                            assert!(value.get("nodeId").is_none());
                            assert_eq!(value["ref"], json!({"node-id":1,"measurement-id":72}));
                            status.set("Retired measurement rejected".into());
                        }));
                    }),
            )
            .child(text(move || status.get()))
    }
    #[test]
    fn actual_native_measurement_echoes_identity_and_retired_reply_cannot_measure_replacement() {
        let mut app = Headless::start(EngineConfig::new(Root::of::<NativeDOM>())).unwrap();
        app.wait_for("id:measured").unwrap();
        app.press("Measure current").unwrap();
        app.wait_for("Measured current").unwrap();
        app.press("Measure retired").unwrap();
        app.wait_for("Retired measurement rejected").unwrap();
    }
}
