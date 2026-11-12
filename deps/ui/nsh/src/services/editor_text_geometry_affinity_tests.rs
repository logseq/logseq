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

#[component]
fn WrappedCaretAffinity() -> impl IntoElement {
    let schema = serde_json::from_str::<Vec<Schema>>(include_str!("../../schemas.json"))
        .unwrap()
        .into_iter()
        .find(|schema| schema.identifier == "logseq-editor")
        .unwrap();
    let fingerprint = schema.fingerprint.clone();
    let registry = Extensions::builder()
        .register(schema, |_| view().into_element())
        .unwrap()
        .freeze(Profile {
            os: "macos".into(),
            host: "generic".into(),
        })
        .unwrap();
    let renderer = Renderer::with_extensions(registry, |_, _| {});
    // No spaces: the first native line's end is exactly the next line's
    // start, including multibyte source characters and UTF-16 surrogate pairs.
    let source = "中文😀中文😀中文😀中文😀中文😀中文😀中文😀中文😀";
    let operations = json!([
        {"op":"create-node","id":1,"kind":"column"},
        {"op":"set-prop","id":1,"property":"style-class","value":"block-editor"},
        {"op":"set-prop","id":1,"property":"width","value":120},
        {"op":"create-node","id":2,"kind":"text"},
        {"op":"set-prop","id":2,"property":"style-class","value":"ed-line"},
        {"op":"set-prop","id":2,"property":"white-space","value":"pre-wrap"},
        {"op":"set-prop","id":2,"property":"font-size","value":"20px"},
        {"op":"set-prop","id":2,"property":"display","value":"block"},
        {"op":"insert-child","parent":1,"child":2,"index":0},
        {"op":"create-node","id":3,"kind":"text"},
        {"op":"set-prop","id":3,"property":"text","value":source},
        {"op":"set-prop","id":3,"property":"accessibility-identifier","value":"ls-editor-run-0"},
        {"op":"insert-child","parent":2,"child":3,"index":0},
        {"op":"create-extension","id":4,"identifier":"logseq-editor","fingerprint":fingerprint},
        {"op":"set-extension-prop","id":4,"property":"block-id","value":"wrapped-affinity"},
        {"op":"set-extension-prop","id":4,"property":"source-version","value":1},
        {"op":"set-extension-prop","id":4,"property":"runs","value":format!("0,{},p", source.len())},
        {"op":"insert-child","parent":1,"child":4,"index":1}
    ]);
    renderer
        .apply(Batch::decode(&json!({"generation":1,"ops":operations}).to_string()).unwrap())
        .unwrap();
    renderer.set_root(1).unwrap();
    let status = signal("Waiting for wrapped caret affinity".to_owned());
    let tasks = Rc::new(RefCell::new(Vec::<nsh_core::element::Spawned<()>>::new()));
    view()
        .child(renderer.element())
        .child(
            nsh_base::button()
                .child(text("Query wrapped caret affinity"))
                .on_press(move || {
                    let renderer = renderer.clone();
                    tasks.borrow_mut().push(spawn(async move {
                        let layout = Layout::read(renderer.node_snapshot(4).unwrap(), &renderer)
                            .await
                            .unwrap()
                            .unwrap();
                        let line = &layout.lines[0];
                        let TextGeometryResult::Lines(visual) = &line.layout.result else {
                            panic!("expected native lines")
                        };
                        assert!(visual.len() > 1, "fixture must wrap in CoreText");
                        assert_eq!(visual[0].end, visual[1].start);
                        let first = &visual[0];
                        let y = line.layout.measurement.page.y.0
                            + (line.layout.content.origin.y.0 + first.y.0 + first.height.0 / 2.0)
                                * line.layout.page_scale
                            - layout.root_measurement.page.y.0;
                        let hit = Request::decode(
                            "offset-at",
                            json!({"geometry-epoch":7,"x":10000,"y":y.round() as i32})
                                .as_object()
                                .unwrap(),
                        )
                        .unwrap();
                        let hit = layout.answer(&hit).await.unwrap().unwrap();
                        assert_eq!(hit["affinity"], "upstream");
                        let offset = hit["offset"].as_u64().unwrap() as usize;
                        assert!(source.is_char_boundary(offset));
                        assert_eq!(Some(offset), line.source_offset(first.end, true));
                        let mut carets = Vec::new();
                        for affinity in ["upstream", "downstream"] {
                            let request = Request::decode(
                                "caret-rect",
                                json!({"geometry-epoch":7,"offset":offset,"affinity":affinity})
                                    .as_object()
                                    .unwrap(),
                            )
                            .unwrap();
                            let caret = layout.answer(&request).await.unwrap().unwrap();
                            assert_eq!(caret["offset"], offset);
                            assert_eq!(caret["affinity"], affinity);
                            carets.push(caret);
                        }
                        let upstream_y = carets[0]["y"].as_f64().unwrap();
                        let downstream_y = carets[1]["y"].as_f64().unwrap();
                        assert!(
                            upstream_y < downstream_y,
                            "the same byte offset must retain both native visual carets"
                        );
                        assert!(
                            upstream_y <= y as f64
                                && (y as f64) < upstream_y + carets[0]["h"].as_f64().unwrap()
                        );
                        status.set("Wrapped caret affinity passed".into());
                    }));
                }),
        )
        .child(text(move || status.get()))
}

#[test]
fn coretext_wrap_hit_roundtrips_upstream_caret_at_the_same_source_offset() {
    let mut app = Headless::start_with_text_engine(
        EngineConfig::new(Root::of::<WrappedCaretAffinity>()),
        nsh_platform_macos::CoreTextEngine::default,
    )
    .unwrap();
    app.first_render().unwrap();
    app.press("Query wrapped caret affinity").unwrap();
    app.wait_for("Wrapped caret affinity passed").unwrap();
}
