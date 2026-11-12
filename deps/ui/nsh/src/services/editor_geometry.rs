//! Commands bound to the actual retained OCaml editor and its native conduit.
use lui_nsh::{render::Renderer, runtime::PlatformEvent, store::Node};
use serde_json::{Map, Value};
use std::sync::Arc;

pub(super) fn supported(operation: &str) -> bool {
    matches!(
        operation,
        "set-input-focus"
            | "caret-rect"
            | "selection-rects"
            | "offset-at"
            | "line-ranges"
            | "scroll-height"
    )
}

pub struct CapturedRequest {
    owner: EditorOwner,
    command: Command,
}
enum Command {
    Focus(bool),
    Geometry(super::editor_text_geometry::Request),
}

struct EditorOwner {
    block: String,
    sink: Option<Arc<Node>>,
    row: Option<Arc<Node>>,
}

fn sink(renderer: &Renderer, block: &str) -> Option<Arc<Node>> {
    let node = renderer.find_by_identifier(&format!("edit-block-{block}"))?;
    let extension = node.extension.as_ref()?;
    (extension.identifier == "logseq-editor"
        && extension.properties.get("block-id").and_then(Value::as_str) == Some(block))
    .then_some(node)
}

fn same_incarnation(renderer: &Renderer, node: &Node) -> bool {
    renderer
        .node_snapshot(node.id)
        .is_some_and(|current| current.incarnation == node.incarnation)
}

impl EditorOwner {
    fn capture(renderer: &Renderer, block: String) -> Self {
        Self {
            sink: sink(renderer, &block),
            row: renderer.find_by_identifier(&format!("ls-block-{block}")),
            block,
        }
    }

    fn resolve(&self, renderer: &Renderer, mounting: bool) -> Option<Arc<Node>> {
        if let Some(previous) = &self.sink {
            let current = renderer.node_snapshot(previous.id)?;
            return (current.incarnation == previous.incarnation
                && current.extension.as_ref().is_some_and(|extension| {
                    extension.identifier == "logseq-editor"
                        && extension.properties.get("block-id").and_then(Value::as_str)
                            == Some(self.block.as_str())
                }))
            .then_some(current);
        }
        if !mounting {
            return None;
        }
        // A click can request focus before its editor-creation batch. Bind that
        // request to the existing row, so a graph switch or replacement cannot
        // focus a later editor that merely reuses the same block identifier.
        let row = self.row.as_ref()?;
        if !same_incarnation(renderer, row) {
            return None;
        }
        let current = sink(renderer, &self.block)?;
        let mut parent = current.parent;
        while let Some(id) = parent {
            let ancestor = renderer.node_snapshot(id)?;
            if ancestor.id == row.id {
                return (ancestor.incarnation == row.incarnation).then_some(current);
            }
            parent = ancestor.parent;
        }
        None
    }
}

pub(super) fn capture(
    operation: &str,
    payload: &str,
    renderer: &Renderer,
) -> Result<CapturedRequest, String> {
    let request: Map<String, Value> =
        serde_json::from_str(payload).map_err(|error| format!("editor focus request: {error}"))?;
    let block = request
        .get("block-id")
        .and_then(Value::as_str)
        .filter(|block| !block.is_empty())
        .ok_or("editor focus requires a nonempty block-id")?;
    let command = if operation == "set-input-focus" {
        Command::Focus(
            request
                .get("focused")
                .and_then(Value::as_bool)
                .ok_or("editor focus requires a boolean focused value")?,
        )
    } else {
        Command::Geometry(super::editor_text_geometry::Request::decode(
            operation, &request,
        )?)
    };
    Ok(CapturedRequest {
        owner: EditorOwner::capture(renderer, block.into()),
        command,
    })
}

pub(super) async fn execute(
    request: CapturedRequest,
    renderer: &Renderer,
) -> Result<Vec<PlatformEvent>, String> {
    let Some(sink) = request
        .owner
        .resolve(renderer, !matches!(request.command, Command::Focus(false)))
    else {
        return Ok(Vec::new());
    };
    let focused = match request.command {
        Command::Focus(focused) => focused,
        Command::Geometry(query) => {
            return super::editor_text_geometry::execute(
                query,
                sink,
                request.owner.sink.as_deref(),
                renderer,
            )
            .await;
        }
    };
    let Some(reference) = renderer.native_reference(sink.id, sink.incarnation) else {
        return Ok(Vec::new());
    };
    if reference.node().is_some() {
        if focused {
            reference.focus();
        } else {
            reference.blur();
        }
    }
    Ok(Vec::new())
}

#[cfg(test)]
mod tests {
    use super::*;
    use lui_nsh::{
        extensions::{Extensions, Profile, Schema},
        render::Renderer,
        wire::Batch,
    };
    use nsh_core::{element::input, prelude::*};
    use nsh_engine::{EngineConfig, Root};
    use nsh_testing::Headless;
    use serde_json::json;
    use std::{cell::RefCell, rc::Rc};

    fn schema() -> Schema {
        serde_json::from_str::<Vec<Schema>>(include_str!("../../schemas.json"))
            .unwrap()
            .into_iter()
            .find(|schema| schema.identifier == "logseq-editor")
            .unwrap()
    }
    fn patch(generation: u64, ops: Value) -> Batch {
        Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
    }
    #[component]
    fn EditorFocus() -> impl IntoElement {
        let status = signal("Waiting".to_owned());
        let registry = Extensions::builder()
            .register(schema(), move |context| {
                input()
                    .element_ref(&context.reference)
                    .on_focus(move || status.set("Focus reached the mounted input".into()))
                    .into_element()
            })
            .unwrap()
            .freeze(Profile {
                os: "linux".into(),
                host: "generic".into(),
            })
            .unwrap();
        let renderer = Renderer::with_extensions(registry, |_, _| {});
        renderer.apply(patch(1, json!([
            {"op":"create-node","id":1,"kind":"column"},
            {"op":"set-prop","id":1,"property":"accessibility-identifier","value":"ls-block-first"}
        ]))).unwrap();
        renderer.set_root(1).unwrap();
        for invalid in [
            "null",
            "[]",
            "{}",
            r#"{"block-id":"first","focused":"true"}"#,
        ] {
            assert!(capture("set-input-focus", invalid, &renderer).is_err());
        }
        let captured = capture(
            "set-input-focus",
            r#"{"block-id":"first","focused":true}"#,
            &renderer,
        )
        .unwrap();
        renderer.apply(patch(2, json!([
            {"op":"create-extension","id":2,"identifier":"logseq-editor","fingerprint":schema().fingerprint},
            {"op":"set-extension-prop","id":2,"property":"block-id","value":"first"},
            {"op":"set-extension-prop","id":2,"property":"accessibility-identifier","value":"edit-block-first"},
            {"op":"insert-child","parent":1,"child":2,"index":0}
        ]))).unwrap();
        assert!(captured.owner.resolve(&renderer, true).is_some());
        let pending = Rc::new(RefCell::new(Some(captured)));
        let tasks = Rc::new(RefCell::new(Vec::<nsh_core::element::Spawned<()>>::new()));
        let focus_renderer = renderer.clone();
        let retire_renderer = renderer.clone();
        view().child(renderer.element())
            .child(nsh_base::button().child(text("Focus mounted editor")).on_press(move || {
                let captured = pending.borrow_mut().take().unwrap();
                let renderer = focus_renderer.clone();
                tasks.borrow_mut().push(spawn(async move {
                    assert!(execute(captured, &renderer).await.unwrap().is_empty());
                }));
            }))
            .child(nsh_base::button().child(text("Retire editor row")).on_press(move || {
                let retained = EditorOwner::capture(&retire_renderer, "first".into());
                retire_renderer.apply(patch(3, json!([
                    {"op":"drop-node","id":2}, {"op":"drop-node","id":1},
                    {"op":"create-node","id":1,"kind":"column"},
                    {"op":"set-prop","id":1,"property":"accessibility-identifier","value":"ls-block-first"}
                ]))).unwrap();
                retire_renderer.set_root(1).unwrap();
                assert!(retained.resolve(&retire_renderer, true).is_none());
                status.set("Retired editor cannot receive focus".into());
            }))
            .child(text(move || status.get()))
    }
    #[test]
    fn deferred_focus_reaches_actual_input_and_does_not_retarget_retired_owner() {
        let mut app = Headless::start(EngineConfig::new(Root::of::<EditorFocus>())).unwrap();
        app.first_render().unwrap();
        app.press("Focus mounted editor").unwrap();
        app.wait_for("Focus reached the mounted input").unwrap();
        app.press("Retire editor row").unwrap();
        app.wait_for("Retired editor cannot receive focus").unwrap();
    }
}
