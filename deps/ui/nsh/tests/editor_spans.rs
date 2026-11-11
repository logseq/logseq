//! The editor's producer policy over real LUI rendering and public native Text spans.
use lui_nsh::{render::Renderer, wire::Batch};
use nsh_core::prelude::*;
use nsh_engine::{EngineConfig, EngineContext, Root};
use nsh_testing::{Headless, LayoutNode};
use serde_json::{Value, json};
use std::{
    cell::Cell,
    rc::Rc,
    sync::{Arc, Mutex},
};

#[derive(Clone)]
struct Identities(Arc<Mutex<Vec<Vec<nsh_core::NodeId>>>>);
fn batch(generation: u64, ops: Value) -> Batch {
    Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
}
fn record(renderer: Renderer, identities: Identities) {
    after_answer(move || {
        identities.0.lock().unwrap().push(
            (1..=4)
                .map(|id| {
                    let node = renderer.node_snapshot(id).unwrap();
                    renderer
                        .native_reference(id, node.incarnation)
                        .unwrap()
                        .node()
                        .unwrap()
                })
                .collect(),
        );
    });
}
#[component]
fn EditorSpans() -> impl IntoElement {
    let identities = engine_context::<Identities>().unwrap();
    let renderer = Renderer::new(|_, _| {});
    renderer.apply(batch(1,json!([
        {"op":"create-node","id":1,"kind":"text"},
        {"op":"set-prop","id":1,"property":"accessibility-identifier","value":"editor-line"},
        {"op":"set-prop","id":1,"property":"font-size","value":"20px"},
        {"op":"set-prop","id":1,"property":"width","value":600},
        {"op":"set-prop","id":1,"property":"white-space","value":"pre-wrap"},
        {"op":"set-prop","id":1,"property":"display","value":"block"},
        {"op":"create-node","id":2,"kind":"text"},
        {"op":"set-prop","id":2,"property":"text","value":"left "},
        {"op":"insert-child","parent":1,"child":2,"index":0},
        {"op":"create-node","id":3,"kind":"text"},
        {"op":"set-prop","id":3,"property":"text","value":"**"},
        {"op":"set-prop","id":3,"property":"display","value":"block"},
        {"op":"insert-child","parent":1,"child":3,"index":1},
        {"op":"create-node","id":4,"kind":"text"},
        {"op":"set-prop","id":4,"property":"text","value":"code"},
        {"op":"set-prop","id":4,"property":"font-size","value":"1em"},
        {"op":"set-prop","id":4,"property":"font-family","value":"monospace"},
        {"op":"insert-child","parent":1,"child":4,"index":2}
    ]))).unwrap();
    renderer.set_root(1).unwrap();
    let generation = Rc::new(Cell::new(1));
    for (key, ops) in [
        (
            "f2",
            json!([{"op":"set-prop","id":3,"property":"display","value":"none"}]),
        ),
        (
            "f3",
            json!([{"op":"set-prop","id":3,"property":"display","value":"block"}]),
        ),
        (
            "f4",
            json!([{"op":"set-prop","id":1,"property":"font-size","value":"28px"}]),
        ),
    ] {
        let renderer = renderer.clone();
        let generation = generation.clone();
        let identities = identities.clone();
        on_key_with(
            key,
            KeyOptions {
                when: nsh_core::keymap::When::Always,
                ..Default::default()
            },
            move |_| {
                let next = generation.get() + 1;
                renderer.apply(batch(next, ops.clone())).unwrap();
                generation.set(next);
                record(renderer.clone(), identities.clone());
            },
        );
    }
    record(renderer.clone(), identities);
    renderer.element()
}
fn line(app: &Headless) -> LayoutNode {
    let text = app
        .screen()
        .layout_nodes()
        .into_iter()
        .filter(|node| node.text.is_some())
        .collect::<Vec<_>>();
    assert_eq!(
        text.len(),
        1,
        "nested editor Text must stay one native attributed text block"
    );
    assert_eq!(text[0].test_id.as_deref(), Some("editor-line"));
    text.into_iter().next().unwrap()
}
#[test]
fn editor_delimiter_block_is_a_retained_native_span_and_code_inherits_live_parent_size() {
    let identities = Identities(Arc::new(Mutex::new(Vec::new())));
    let mut app = Headless::start(EngineConfig {
        context: EngineContext::default().with(identities.clone()),
        ..EngineConfig::new(Root::of::<EditorSpans>())
    })
    .unwrap();
    app.wait_for("id:editor-line").unwrap();
    let first = line(&app);
    let text = first.text.unwrap().text;
    assert_eq!(text.text, "left **code");
    assert_eq!(
        text.test_ids
            .iter()
            .map(|span| (span.test_id.as_ref(), span.start, span.end))
            .collect::<Vec<_>>(),
        [("lui-2", 0, 5), ("lui-3", 5, 7), ("lui-4", 7, 11)]
    );
    assert_eq!(
        app.screen().span_style("id:lui-4").unwrap().font_size,
        px(20.0)
    );
    app.press_key("f2").unwrap();
    assert!(!line(&app).text.unwrap().text.visible_text().contains("**"));
    app.press_key("f3").unwrap();
    assert_eq!(line(&app).text.unwrap().text.visible_text(), "left **code");
    app.press_key("f4").unwrap();
    assert_eq!(
        app.screen().span_style("id:lui-4").unwrap().font_size,
        px(28.0)
    );
    assert_eq!(line(&app).id, first.id);
    let recorded = identities.0.lock().unwrap();
    assert_eq!(recorded.len(), 4);
    assert!(
        recorded.windows(2).all(|pair| pair[0] == pair[1]),
        "native Text/span IDs changed during reveal or inherited-font updates"
    );
}
