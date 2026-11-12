use super::*;
use lui_nsh::{
    extensions::{Extensions, Profile, Schema},
    render::Renderer,
    wire::Batch,
};
use nsh_core::prelude::*;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;
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
fn query(operation: &str, fields: Value) -> Request {
    Request::decode(operation, fields.as_object().unwrap()).unwrap()
}
#[test]
fn source_mapping_preserves_multibyte_boundaries_and_atomic_reveal() {
    let run = Run {
        source: Span {
            first: 10,
            last: 19,
            tag: 'p',
        },
        start: 2,
        end: 7,
        positions: positions("A😀中z"),
        hidden: false,
    };
    assert_eq!(run.native_offset(15), Some(5));
    assert_eq!(run.native_offset(12), None);
    assert_eq!(run.source_offset(5, false), Some(15));
    assert_eq!(run.source_offset(4, false), None);
    let atom = Run {
        source: Span {
            first: 20,
            last: 30,
            tag: 'a',
        },
        start: 7,
        end: 12,
        positions: positions("Label"),
        hidden: false,
    };
    assert_eq!(atom.source_offset(9, true), Some(21));
    assert_eq!(atom.source_offset(12, false), Some(30));
    for encoded in ["1,0,p", "0,2,unknown", "0,2,z", "2,3,p;1,2,p"] {
        assert!(spans(encoded).is_err());
    }
    for fields in [
        json!({"geometry-epoch":0,"offset":-1}),
        json!({"geometry-epoch":0,"offset":1.5}),
        json!({"offset":0}),
        json!({"geometry-epoch":0,"offset":0,"affinity":"sideways"}),
        json!({"geometry-epoch":0,"offset":0,"affinity":true}),
    ] {
        assert!(Request::decode("caret-rect", fields.as_object().unwrap()).is_err());
    }
}
#[component]
fn CommittedEditorGeometry() -> impl IntoElement {
    let registry = Extensions::builder()
        .register(schema(), |_| view().into_element())
        .unwrap()
        .freeze(Profile {
            os: "linux".into(),
            host: "generic".into(),
        })
        .unwrap();
    let renderer = Renderer::with_extensions(registry, |_, _| {});
    renderer.apply(patch(1,json!([
        {"op":"create-node","id":1,"kind":"column"},
        {"op":"set-prop","id":1,"property":"style-class","value":"block-editor"},
        {"op":"set-prop","id":1,"property":"width","value":600},
        {"op":"create-node","id":2,"kind":"text"},
        {"op":"set-prop","id":2,"property":"style-class","value":"ed-line"},
        {"op":"set-prop","id":2,"property":"white-space","value":"pre-wrap"},
        {"op":"set-prop","id":2,"property":"font-size","value":"20px"},
        {"op":"set-prop","id":2,"property":"display","value":"block"},
        {"op":"insert-child","parent":1,"child":2,"index":0},
        {"op":"create-node","id":3,"kind":"text"},
        {"op":"set-prop","id":3,"property":"text","value":"A😀中z"},
        {"op":"set-prop","id":3,"property":"accessibility-identifier","value":"ls-editor-run-0"},
        {"op":"insert-child","parent":2,"child":3,"index":0},
        {"op":"create-node","id":4,"kind":"text"},
        {"op":"set-prop","id":4,"property":"text","value":"**"},
        {"op":"set-prop","id":4,"property":"style-class","value":"ed-r ed-delim ed-hidden"},
        {"op":"set-prop","id":4,"property":"display","value":"none"},
        {"op":"set-prop","id":4,"property":"accessibility-identifier","value":"ls-editor-run-1"},
        {"op":"insert-child","parent":2,"child":4,"index":1},
        {"op":"create-node","id":5,"kind":"text"},
        {"op":"set-prop","id":5,"property":"text","value":"Label"},
        {"op":"set-prop","id":5,"property":"accessibility-identifier","value":"ls-editor-run-2"},
        {"op":"insert-child","parent":2,"child":5,"index":2},
        {"op":"create-node","id":6,"kind":"text"},
        {"op":"set-prop","id":6,"property":"text","value":"\u{200b}"},
        {"op":"set-prop","id":6,"property":"accessibility-identifier","value":"ls-editor-run-3"},
        {"op":"insert-child","parent":2,"child":6,"index":3},
        {"op":"create-extension","id":7,"identifier":"logseq-editor","fingerprint":schema().fingerprint},
        {"op":"set-extension-prop","id":7,"property":"block-id","value":"geometry"},
        {"op":"set-extension-prop","id":7,"property":"source-version","value":1},
        {"op":"set-extension-prop","id":7,"property":"runs","value":"0,9,p;9,11,d;11,21,a;21,21,z"},
        {"op":"insert-child","parent":1,"child":7,"index":1}
    ]))).unwrap();
    renderer.set_root(1).unwrap();
    let status = signal("Waiting for geometry".to_owned());
    let tasks = Rc::new(RefCell::new(Vec::<nsh_core::element::Spawned<()>>::new()));
    let checking = renderer.clone();
    view()
        .child(renderer.element())
        .child(
            nsh_base::button()
                .child(text("Query committed editor"))
                .on_press(move || {
                    let renderer = checking.clone();
                    tasks.borrow_mut().push(spawn(async move {
                        let sink = renderer.node_snapshot(7).unwrap();
                        let layout = Layout::read(sink.clone(), &renderer)
                            .await
                            .unwrap()
                            .unwrap();
                        assert_eq!(layout.lines[0].runs[1].start, layout.lines[0].runs[1].end);
                        let caret = layout
                            .answer(&query("caret-rect", json!({"offset":5,"geometry-epoch":9})))
                            .await
                            .unwrap()
                            .unwrap();
                        assert!(caret["h"].as_f64().unwrap() > 0.0);
                        assert_eq!(caret["geometry-epoch"], 9);
                        let at = layout
                            .answer(&query("offset-at", json!({"x":0,"y":0,"geometry-epoch":9})))
                            .await
                            .unwrap()
                            .unwrap();
                        assert_eq!(at["offset"], 0);
                        let at = layout
                            .answer(&query(
                                "offset-at",
                                json!({"x":10000,"y":0,"geometry-epoch":9}),
                            ))
                            .await
                            .unwrap()
                            .unwrap();
                        assert_eq!(at["offset"], 21);
                        let selection = layout
                            .answer(&query(
                                "selection-rects",
                                json!({"first":1,"last":8,"geometry-epoch":9}),
                            ))
                            .await
                            .unwrap()
                            .unwrap();
                        assert!(!selection["rects"].as_array().unwrap().is_empty());
                        assert!(
                            layout
                                .answer(&query(
                                    "caret-rect",
                                    json!({"offset":2,"geometry-epoch":9})
                                ))
                                .await
                                .unwrap()
                                .is_none()
                        );
                        let lines = layout
                            .answer(&query("line-ranges", json!({"geometry-epoch":9})))
                            .await
                            .unwrap()
                            .unwrap();
                        assert_eq!(lines["ranges"], "0,21");
                        let height = layout
                            .answer(&query("scroll-height", json!({"geometry-epoch":9})))
                            .await
                            .unwrap()
                            .unwrap();
                        assert!(height["height"].as_f64().unwrap() > 0.0);
                        renderer.apply(patch(2,json!([
                    {"op":"set-prop","id":3,"property":"text","value":"B😀中z"},
                    {"op":"set-extension-prop","id":7,"property":"source-version","value":2}
                ]))).unwrap();
                        assert!(!layout.current(&renderer));
                        let current = renderer.node_snapshot(7).unwrap();
                        assert!(
                            execute(
                                query("offset-at", json!({"x":0,"y":0,"geometry-epoch":9})),
                                current,
                                Some(&sink),
                                &renderer
                            )
                            .await
                            .unwrap()
                            .is_empty()
                        );
                        status.set("Committed text geometry passed".into());
                    }));
                }),
        )
        .child(text(move || status.get()))
}
#[test]
fn actual_committed_layout_answers_source_geometry_and_rejects_stale_revision() {
    let config = EngineConfig::new(Root::of::<CommittedEditorGeometry>());
    #[cfg(target_os = "macos")]
    let mut app =
        Headless::start_with_text_engine(config, nsh_platform_macos::CoreTextEngine::default)
            .unwrap();
    #[cfg(not(target_os = "macos"))]
    let mut app = Headless::start(config).unwrap();
    app.first_render().unwrap();
    app.press("Query committed editor").unwrap();
    app.wait_for("Committed text geometry passed").unwrap();
}
