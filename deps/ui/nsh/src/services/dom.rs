//! DOM service capabilities over retained native references, never a shadow document.
//! `set-value` and custom Editor selection require their authoritative typed owners;
//! native InsertText is a user edit and is deliberately not a substitute.
use lui_nsh::{app::ApplicationMutations, render::Renderer, runtime::PlatformEvent, store::Node};
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
async fn target(
    captured: Option<(u64, u64)>,
    renderer: &Renderer,
) -> Result<Option<Target>, String> {
    // None records absence when the request was captured, not permission to
    // resolve an identifier after later patches create a different owner.
    let resolved = captured.and_then(|(id, incarnation)| {
        renderer
            .node_snapshot(id)
            .filter(|node| node.incarnation == incarnation)
    });
    let Some(node) = resolved else {
        return Ok(None);
    };
    let Some(mut native) = renderer.native_reference(node.id, node.incarnation) else {
        return Ok(None);
    };
    if native.node().is_none() {
        // A service can follow the creating patch before that native commit.
        // Wait once for mounting, including while the screen is locked. Native
        // display frames can stop then; commits and measurement requests do not.
        // Never poll or redirect the identifier to a later incarnation.
        lui_nsh::app::wait_for_commit().await?;
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

fn scroll_owner(scroller: &Node, row: &Node, renderer: &Renderer) -> Result<(), String> {
    let mut parent = row.parent;
    while let Some(id) = parent {
        let node = renderer
            .node_snapshot(id)
            .ok_or("row scroll ancestor retired")?;
        let owns_scroll = matches!(node.kind.as_str(), "scroll" | "list")
            || (node.kind == "virtual-list" && node.string("virtual-viewport") != "parent");
        if owns_scroll {
            return if node.id == scroller.id
                && node.incarnation == scroller.incarnation
                && node.string("orientation") != "horizontal"
            {
                Ok(())
            } else {
                Err("row scroll requires its nearest vertical Scroll/List owner".into())
            };
        }
        parent = node.parent;
    }
    Err("row scroll target is outside the requested Scroll/List".into())
}

fn group_heading(row: &Node, renderer: &Renderer) -> Option<Arc<Node>> {
    let parent = renderer.node_snapshot(row.parent?)?;
    let group = renderer.node_snapshot(parent.parent?)?;
    let index = group.children.iter().position(|id| *id == parent.id)?;
    let heading = renderer.node_snapshot(*group.children.get(index.checked_sub(1)?)?)?;
    let is_heading = heading
        .string("style-class")
        .split_whitespace()
        .any(|class| class == "ui__ac-group-name");
    is_heading.then_some(heading)
}

async fn scroll_row(
    scroller: (u64, u64),
    row: (u64, u64),
    renderer: &Renderer,
) -> Result<Vec<PlatformEvent>, String> {
    let scroller = target(Some(scroller), renderer)
        .await?
        .ok_or("row scroll owner is missing, retired or unmounted")?;
    let row = target(Some(row), renderer)
        .await?
        .ok_or("row scroll target is missing, retired or unmounted")?;
    scroll_owner(&scroller.node, &row.node, renderer)?;
    let heading = if let Some(node) = group_heading(&row.node, renderer) {
        Some(
            target(Some((node.id, node.incarnation)), renderer)
                .await?
                .ok_or("row scroll group heading retired or unmounted")?,
        )
    } else {
        None
    };
    let sampled = Rc::new(RefCell::new(None::<Point<Points>>));
    let sample = sampled.clone();
    let reference = scroller.reference;
    let (owner, ()) = nsh_core::element::create_root(|| {
        watch_scroll(
            move || reference.node(),
            move |event| *sample.borrow_mut() = Some(event.offset),
        )
    });
    let _owner = WatchOwner(owner);
    // Queue the measurements together, so they share one native commit.
    let viewport = scroller.reference.measure();
    let item = row.reference.measure();
    let heading_measurement = heading.as_ref().map(|heading| heading.reference.measure());
    let viewport = viewport
        .await
        .ok_or("row scroll owner has no committed layout")?;
    let item = item
        .await
        .ok_or("row scroll target has no committed layout")?;
    let heading_top = if let Some(measurement) = heading_measurement {
        Some(
            measurement
                .await
                .ok_or("row scroll group heading has no committed layout")?
                .page
                .y
                .0,
        )
    } else {
        None
    };
    if !scroller.current(renderer)
        || !row.current(renderer)
        || heading
            .as_ref()
            .is_some_and(|heading| !heading.current(renderer))
    {
        return Err("row scroll identity retired while measuring".into());
    }
    let current = renderer
        .node_snapshot(row.node.id)
        .ok_or("row scroll target retired")?;
    scroll_owner(&scroller.node, &current, renderer)?;
    let offset = sampled
        .borrow()
        .as_ref()
        .copied()
        .ok_or("row scroll offset was unavailable after commit")?;
    let top = heading_top.unwrap_or(item.page.y.0) - viewport.page.y.0;
    let bottom = item.page.y.0 + item.frame.size.height.0 - viewport.page.y.0;
    let height = viewport.frame.size.height.0;
    if ![top, bottom, height, offset.x.0, offset.y.0]
        .iter()
        .all(|value| value.is_finite())
        || height <= 0.0
        || item.frame.size.height.0 <= 0.0
    {
        return Err("row scroll requires finite positive committed geometry".into());
    }
    let delta = if top < 0.0 {
        top
    } else if bottom > height {
        bottom - height
    } else {
        0.0
    };
    if delta != 0.0 {
        let top = offset.y.0 + delta;
        if !top.is_finite() {
            return Err("row scroll destination is outside finite native geometry".into());
        }
        scroller
            .reference
            .scroll_to(Point::new(offset.x, px(top.max(0.0))), false);
    }
    Ok(Vec::new())
}

/// An owned request deferred until its creating patches reach the native commit.
/// Existing targets retain their incarnation even if their identifier is renamed.
/// Missing generic targets stay absent; only EditorOwner permits row-owned mounting.
pub enum CapturedRequest {
    Click {
        node: (u64, u64),
        admission: Option<ApplicationMutations>,
    },
    ScrollRow {
        scroller: (u64, u64),
        row: (u64, u64),
    },
    Node {
        operation: String,
        payload: String,
        known: Option<(u64, u64)>,
    },
    Editor(super::editor_geometry::CapturedRequest),
}
pub fn capture(
    operation: &str,
    payload: &str,
    renderer: &Renderer,
    admission: Option<ApplicationMutations>,
) -> Result<CapturedRequest, String> {
    if operation == "click" {
        let request = object(payload)?;
        let node = resolve(
            request
                .get("ref")
                .ok_or("native click requires a target ref")?,
            renderer,
        )?
        .ok_or("native click target is missing or retired")?;
        return Ok(CapturedRequest::Click {
            node: (node.id, node.incarnation),
            admission,
        });
    }
    if operation == "scroll-row-into-view" {
        let request = object(payload)?;
        let resolve_field = |name| -> Result<Arc<Node>, String> {
            resolve(
                request
                    .get(name)
                    .ok_or_else(|| format!("row scroll requires {name}"))?,
                renderer,
            )?
            .ok_or_else(|| format!("row scroll {name} is missing or retired"))
        };
        let scroller = resolve_field("scroller")?;
        let row = resolve_field("row")?;
        scroll_owner(&scroller, &row, renderer)?;
        return Ok(CapturedRequest::ScrollRow {
            scroller: (scroller.id, scroller.incarnation),
            row: (row.id, row.incarnation),
        });
    }
    if super::editor_geometry::supported(operation) {
        return super::editor_geometry::capture(operation, payload, renderer)
            .map(CapturedRequest::Editor);
    }
    if !supported(operation) {
        return Err(format!(
            "DOM operation {operation} is not implemented by the NSH host"
        ));
    }
    let request = object(payload)?;
    let reference = request.get("ref").unwrap_or(&Value::Null);
    let known = resolve(reference, renderer)?.map(|node| (node.id, node.incarnation));
    Ok(CapturedRequest::Node {
        operation: operation.into(),
        payload: payload.into(),
        known,
    })
}
pub async fn execute(
    request: CapturedRequest,
    renderer: &Renderer,
) -> Result<Vec<PlatformEvent>, String> {
    match request {
        CapturedRequest::Click {
            node: (id, incarnation),
            admission,
        } => {
            if renderer
                .activate_native(id, incarnation, admission.as_ref())
                .await?
            {
                Ok(Vec::new())
            } else {
                Err("native click target has no accepting controller".into())
            }
        }
        CapturedRequest::ScrollRow { scroller, row } => scroll_row(scroller, row, renderer).await,
        CapturedRequest::Node {
            operation,
            payload,
            known,
        } => handle_inner(&operation, &payload, renderer, known).await,
        CapturedRequest::Editor(request) => {
            super::editor_geometry::execute(request, renderer).await
        }
    }
}
fn supported(operation: &str) -> bool {
    matches!(
        operation,
        "measure-node"
            | "focus"
            | "select"
            | "set-selection-range"
            | "set-scroll-top"
            | "scroll-into-view"
            | "scroll-to-node"
    )
}

async fn handle_inner(
    operation: &str,
    payload: &str,
    renderer: &Renderer,
    known: Option<(u64, u64)>,
) -> Result<Vec<PlatformEvent>, String> {
    if !supported(operation) {
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
    let target = target(known, renderer).await?;
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
    use nsh_engine::{EngineConfig, EngineContext, Root};
    use nsh_testing::Headless;

    fn capture(
        operation: &str,
        payload: &str,
        renderer: &Renderer,
    ) -> Result<CapturedRequest, String> {
        super::capture(operation, payload, renderer, None)
    }

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
        let before_mount = Rc::new(RefCell::new(Some(
            capture(
                "measure-node",
                r##"{"ref":{"#ref":"measured","measurement-id":71}}"##,
                &renderer,
            )
            .unwrap(),
        )));
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
                        let captured = before_mount
                            .borrow_mut()
                            .take()
                            .expect("one initial measurement");
                        tasks.borrow_mut().push(spawn(async move {
                            let events = execute(captured, &renderer).await.unwrap();
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
                        let captured = capture(
                            "measure-node",
                            r##"{"ref":{"#ref":"measured","measurement-id":73}}"##,
                            &retiring,
                        )
                        .unwrap();
                        let pending = reference.measure();
                        retiring
                            .apply(patch(
                                2,
                                json!([
                    {"op":"drop-node","id":1},{"op":"create-node","id":1,"kind":"box"},
                    {"op":"set-prop","id":1,"property":"width","value":500},
                    {"op":"set-prop","id":1,"property":"accessibility-identifier","value":"measured"}]),
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
                            let deferred = execute(captured, &renderer).await.unwrap();
                            let deferred: Value =
                                serde_json::from_str(&deferred[0].payload).unwrap();
                            assert!(deferred["rect"].is_null());
                            assert!(deferred.get("nodeId").is_none());
                            assert_eq!(
                                deferred["ref"],
                                json!({"#ref":"measured","measurement-id":73})
                            );
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

    #[component]
    fn CapturedDOMOwners() -> impl IntoElement {
        use lui_nsh::app::ServiceResponse;

        let renderer = Renderer::new(|_, _| {});
        renderer.apply(patch(1, json!([
            {"op":"create-node","id":1,"kind":"column"},
            {"op":"create-node","id":2,"kind":"box"},
            {"op":"set-prop","id":2,"property":"accessibility-identifier","value":"reused"},
            {"op":"insert-child","parent":1,"child":2,"index":0},
            {"op":"create-node","id":3,"kind":"box"},
            {"op":"set-prop","id":3,"property":"accessibility-identifier","value":"retired"},
            {"op":"insert-child","parent":1,"child":3,"index":1},
            {"op":"create-node","id":6,"kind":"box"},
            {"op":"set-prop","id":6,"property":"accessibility-identifier","value":"retained"},
            {"op":"set-prop","id":6,"property":"width","value":240},
            {"op":"set-prop","id":6,"property":"height","value":40},
            {"op":"insert-child","parent":1,"child":6,"index":2}
        ]))).unwrap();
        renderer.set_root(1).unwrap();
        let mut deferred = Vec::new();
        for (reference, expected) in [
            (json!({"#ref":"created-later"}), None),
            (json!({"node-id":4}), None),
            (json!({"#ref":"reused"}), None),
            (json!({"#ref":"retired"}), None),
            (json!({"#ref":"retained"}), Some(6)),
        ] {
            let payload = json!({"ref":reference}).to_string();
            let captured = capture("measure-node", &payload, &renderer).unwrap();
            let measuring = renderer.clone();
            deferred.push((
                reference,
                expected,
                ServiceResponse::AfterCommit(Box::pin(async move {
                    execute(captured, &measuring).await
                })),
            ));
        }
        let missing_select =
            capture("select", r##"{"ref":{"#ref":"created-later"}}"##, &renderer).unwrap();
        renderer.apply(patch(2, json!([
            {"op":"remove-child","parent":1,"child":2},
            {"op":"drop-node","id":2},
            {"op":"create-node","id":2,"kind":"box"},
            {"op":"set-prop","id":2,"property":"accessibility-identifier","value":"reused"},
            {"op":"insert-child","parent":1,"child":2,"index":0},
            {"op":"remove-child","parent":1,"child":3},
            {"op":"drop-node","id":3},
            {"op":"create-node","id":5,"kind":"box"},
            {"op":"set-prop","id":5,"property":"accessibility-identifier","value":"retired"},
            {"op":"insert-child","parent":1,"child":5,"index":1},
            {"op":"create-node","id":4,"kind":"box"},
            {"op":"set-prop","id":4,"property":"accessibility-identifier","value":"created-later"},
            {"op":"set-prop","id":4,"property":"width","value":500},
            {"op":"set-prop","id":4,"property":"height","value":40},
            {"op":"insert-child","parent":1,"child":4,"index":3},
            {"op":"set-prop","id":6,"property":"accessibility-identifier","value":"renamed"}
        ]))).unwrap();
        let status = signal("Waiting for captured DOM owners".to_owned());
        let executing = renderer.clone();
        spawn(async move {
            // Match the public desktop pump's AfterCommit ordering: all later
            // canonical patches exist before the native commit is acknowledged.
            lui_nsh::app::wait_for_commit().await.unwrap();
            for (reference, expected, response) in deferred {
                let ServiceResponse::AfterCommit(future) = response else {
                    panic!("DOM measurement must be deferred until commit")
                };
                let events = future.await.unwrap();
                assert_eq!(events.len(), 1);
                assert_eq!(events[0].operation, "node-rect");
                let value: Value = serde_json::from_str(&events[0].payload).unwrap();
                assert_eq!(value["ref"], reference);
                if let Some(id) = expected {
                    assert_eq!(value["nodeId"], id);
                    assert_eq!(value["rect"]["width"], 240.0);
                } else {
                    assert!(value["rect"].is_null(), "captured owner changed: {value}");
                    assert!(value.get("nodeId").is_none());
                }
            }
            // An absent generic command remains the normal empty result. It
            // must not select the newly mounted Box (which is not an Input).
            assert!(
                execute(missing_select, &executing)
                    .await
                    .unwrap()
                    .is_empty()
            );
            status.set("Captured DOM owners preserved".into());
        });
        view()
            .child(renderer.element())
            .child(text(move || status.get()))
    }

    #[test]
    fn after_commit_missing_targets_do_not_adopt_created_or_reused_identifiers() {
        let mut app = Headless::start(EngineConfig::new(Root::of::<CapturedDOMOwners>())).unwrap();
        app.wait_for("id:created-later").unwrap();
        app.wait_for("Captured DOM owners preserved").unwrap();
    }

    #[component]
    fn NativeRowScroll() -> impl IntoElement {
        let renderer = Renderer::new(|_, _| {});
        let mut ops = vec![
            json!({"op":"create-node","id":1,"kind":"scroll"}),
            json!({"op":"set-prop","id":1,"property":"width","value":320}),
            json!({"op":"set-prop","id":1,"property":"height","value":160}),
            json!({"op":"create-node","id":2,"kind":"column"}),
            json!({"op":"set-prop","id":2,"property":"height","value":700}),
            json!({"op":"set-prop","id":2,"property":"min-height","value":700}),
            json!({"op":"insert-child","parent":1,"child":2,"index":0}),
            json!({"op":"create-node","id":3,"kind":"scroll"}),
            json!({"op":"set-prop","id":3,"property":"height","value":100}),
            json!({"op":"set-prop","id":3,"property":"min-height","value":100}),
            json!({"op":"insert-child","parent":2,"child":3,"index":0}),
            json!({"op":"create-node","id":4,"kind":"column"}),
            json!({"op":"set-prop","id":4,"property":"height","value":640}),
            json!({"op":"set-prop","id":4,"property":"min-height","value":640}),
            json!({"op":"insert-child","parent":3,"child":4,"index":0}),
            json!({"op":"create-node","id":5,"kind":"spacer"}),
            json!({"op":"set-prop","id":5,"property":"height","value":600}),
            json!({"op":"insert-child","parent":2,"child":5,"index":1}),
        ];
        for index in 0..20 {
            let id = index + 100;
            ops.extend([
                json!({"op":"create-node","id":id,"kind":"text"}),
                json!({"op":"set-prop","id":id,"property":"text","value":format!("Choice {index}")}),
                json!({"op":"set-prop","id":id,"property":"height","value":32}),
                json!({"op":"insert-child","parent":4,"child":id,"index":index}),
            ]);
        }
        renderer.apply(patch(1, json!(ops))).unwrap();
        renderer.set_root(1).unwrap();
        for payload in [
            json!({"scroller":{"node-id":1},"row":{"node-id":119}}),
            json!({"scroller":{"node-id":3},"row":{"node-id":999}}),
            json!({"row":{"node-id":119}}),
        ] {
            assert!(capture("scroll-row-into-view", &payload.to_string(), &renderer).is_err());
        }
        let offsets = signal((0.0_f32, 0.0_f32));
        for (id, inner) in [(1, false), (3, true)] {
            let node = renderer.node_snapshot(id).unwrap();
            let reference = renderer.native_reference(id, node.incarnation).unwrap();
            watch_scroll(
                move || reference.node(),
                move |event| {
                    offsets.update(|offsets| {
                        if inner {
                            offsets.0 = event.offset.y.0
                        } else {
                            offsets.1 = event.offset.y.0
                        }
                    });
                },
            );
        }
        let status = signal("Waiting".to_owned());
        let responses = signal(0_u64);
        let generation = signal(1_u64);
        let scrolling = renderer.clone();
        let retiring = renderer.clone();
        view()
            .child(renderer.element())
            .child(
                nsh_base::button()
                    .child(text("Reveal last choice"))
                    .on_press(move || {
                        let request = capture(
                            "scroll-row-into-view",
                            r#"{"scroller":{"node-id":3},"row":{"node-id":119}}"#,
                            &scrolling,
                        )
                        .unwrap();
                        let renderer = scrolling.clone();
                        spawn(async move {
                            assert!(execute(request, &renderer).await.unwrap().is_empty());
                            responses.update(|count| *count += 1);
                            status.set(format!("Row revealed {}", responses.get_untracked()));
                        });
                    }),
            )
            .child(
                nsh_base::button()
                    .child(text("Reject replacement"))
                    .on_press(move || {
                        let request = capture(
                            "scroll-row-into-view",
                            r#"{"scroller":{"node-id":3},"row":{"node-id":119}}"#,
                            &retiring,
                        )
                        .unwrap();
                        generation.update(|current| *current += 1);
                        retiring.apply(patch(generation.get_untracked(), json!([
                    {"op":"remove-child","parent":4,"child":119},
                    {"op":"drop-node","id":119},
                    {"op":"create-node","id":119,"kind":"text"},
                    {"op":"set-prop","id":119,"property":"text","value":"Replacement choice"},
                    {"op":"set-prop","id":119,"property":"height","value":32},
                    {"op":"insert-child","parent":4,"child":119,"index":19}
                ]))).unwrap();
                        let renderer = retiring.clone();
                        spawn(async move {
                            assert!(execute(request, &renderer).await.is_err());
                            status.set("Replacement rejected".into());
                        });
                    }),
            )
            .child(text(move || status.get()))
            .child(text(move || {
                let (inner, outer) = offsets.get();
                format!("Offsets: {inner}, {outer}")
            }))
    }

    #[test]
    fn row_reveal_scrolls_only_its_explicit_owner_and_rejects_replacement() {
        let mut app = Headless::start(EngineConfig::new(Root::of::<NativeRowScroll>())).unwrap();
        app.wait_for("Reveal last choice").unwrap();
        app.press("Reveal last choice").unwrap();
        app.wait_for("Row revealed 1").unwrap();
        app.wait_for("Offsets: 540, 0").unwrap();
        app.press("Reveal last choice").unwrap();
        app.wait_for("Row revealed 2").unwrap();
        app.wait_for("Offsets: 540, 0").unwrap();
        app.press("Reject replacement").unwrap();
        app.wait_for("Replacement rejected").unwrap();
        app.wait_for("Offsets: 540, 0").unwrap();
    }

    #[derive(Clone, Copy, PartialEq)]
    enum ClickMode {
        Live,
        Disabled,
        Hidden,
        PointerExcluded,
        Reused,
        Preparing,
        PreparesOnPress,
        DismissesOnPress,
    }

    #[component]
    fn NativeClick() -> impl IntoElement {
        let mode = engine_context::<ClickMode>()
            .map(|mode| *mode)
            .unwrap_or(ClickMode::Live);
        let allowed = signal(mode != ClickMode::Preparing);
        let count = signal(0_u32);
        let renderer = Renderer::new(move |event, renderer| {
            if matches!(event, lui_nsh::render::Event::Press(2)) {
                count.update(|count| *count += 1);
                if mode == ClickMode::PreparesOnPress {
                    allowed.set(false);
                }
                if mode == ClickMode::DismissesOnPress {
                    renderer
                        .apply(patch(
                            2,
                            json!([
                                {"op":"remove-child","parent":1,"child":2},
                                {"op":"drop-node","id":2}
                            ]),
                        ))
                        .unwrap();
                }
            }
        });
        renderer.apply(patch(1, json!([
            {"op":"create-node","id":1,"kind":"box"},
            {"op":"set-prop","id":1,"property":"display","value":if mode==ClickMode::Hidden {"none"} else {"block"}},
            {"op":"set-prop","id":1,"property":"pointer-enabled","value":mode!=ClickMode::PointerExcluded},
            {"op":"create-node","id":2,"kind":"button"},
            {"op":"set-prop","id":2,"property":"text","value":"Domain action"},
            {"op":"set-prop","id":2,"property":"width","value":200},
            {"op":"set-prop","id":2,"property":"height","value":40},
            {"op":"set-prop","id":2,"property":"press-enabled","value":true},
            {"op":"set-prop","id":2,"property":"enabled","value":mode!=ClickMode::Disabled},
            {"op":"insert-child","parent":1,"child":2,"index":0}
        ]))).unwrap();
        renderer.set_root(1).unwrap();
        assert!(capture("click", r#"{"ref":{"node-id":999}}"#, &renderer).is_err());
        let admission = ApplicationMutations::new(move || {
            if allowed.get_untracked() {
                Ok(())
            } else {
                Err("application preparation is active".into())
            }
        });
        let request = super::capture(
            "click",
            r#"{"ref":{"node-id":2}}"#,
            &renderer,
            Some(admission),
        )
        .unwrap();
        if mode == ClickMode::Reused {
            renderer
                .apply(patch(
                    2,
                    json!([
                        {"op":"remove-child","parent":1,"child":2},
                        {"op":"drop-node","id":2},
                        {"op":"create-node","id":2,"kind":"button"},
                        {"op":"set-prop","id":2,"property":"text","value":"Replacement action"},
                        {"op":"set-prop","id":2,"property":"press-enabled","value":true},
                        {"op":"insert-child","parent":1,"child":2,"index":0}
                    ]),
                ))
                .unwrap();
        }
        let status = signal("Waiting for native click".to_owned());
        let activating = renderer.clone();
        spawn(async move {
            lui_nsh::app::wait_for_commit().await.unwrap();
            status.set(match execute(request, &activating).await {
                Ok(events) => {
                    assert!(events.is_empty());
                    "Accepted native click".into()
                }
                Err(error) => {
                    eprintln!("expected native click rejection: {error}");
                    "Rejected native click".into()
                }
            });
        });
        view()
            .child(renderer.element())
            .child(text(move || status.get()))
            .child(text(move || format!("Domain activations: {}", count.get())))
    }

    #[test]
    fn native_click_uses_one_controller_and_accepts_its_own_dismissal_or_preparation() {
        for mode in [
            ClickMode::Live,
            ClickMode::PreparesOnPress,
            ClickMode::DismissesOnPress,
        ] {
            let mut app = Headless::start(EngineConfig {
                context: EngineContext::default().with(mode),
                ..EngineConfig::new(Root::of::<NativeClick>())
            })
            .unwrap();
            app.wait_for("Accepted native click").unwrap();
            app.wait_for("Domain activations: 1").unwrap();
        }
    }

    #[test]
    fn native_click_rejects_disabled_hidden_pointer_excluded_reused_and_fenced_targets() {
        for mode in [
            ClickMode::Disabled,
            ClickMode::Hidden,
            ClickMode::PointerExcluded,
            ClickMode::Reused,
            ClickMode::Preparing,
        ] {
            let mut app = Headless::start(EngineConfig {
                context: EngineContext::default().with(mode),
                ..EngineConfig::new(Root::of::<NativeClick>())
            })
            .unwrap();
            app.wait_for("Rejected native click").unwrap();
            app.wait_for("Domain activations: 0").unwrap();
        }
    }
}
