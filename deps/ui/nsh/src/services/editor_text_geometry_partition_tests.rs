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
fn WrappedHiddenMarkupGeometry() -> impl IntoElement {
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
    let body = "long 😀 wrapped 中文 text with enough words to create several visual lines";
    let suffix = " suffix";
    let close = 2 + body.len();
    let source = format!("**{body}**{suffix}");
    let source_len = source.len();
    let ops = json!([
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
        {"op":"set-prop","id":3,"property":"text","value":"**"},
        {"op":"set-prop","id":3,"property":"style-class","value":"ed-r ed-delim ed-hidden"},
        {"op":"set-prop","id":3,"property":"display","value":"none"},
        {"op":"set-prop","id":3,"property":"accessibility-identifier","value":"ls-editor-run-0"},
        {"op":"insert-child","parent":2,"child":3,"index":0},
        {"op":"create-node","id":4,"kind":"text"},
        {"op":"set-prop","id":4,"property":"text","value":body},
        {"op":"set-prop","id":4,"property":"style-class","value":"ed-r ed-bold"},
        {"op":"set-prop","id":4,"property":"font-weight","value":700},
        {"op":"set-prop","id":4,"property":"accessibility-identifier","value":"ls-editor-run-1"},
        {"op":"insert-child","parent":2,"child":4,"index":1},
        {"op":"create-node","id":5,"kind":"text"},
        {"op":"set-prop","id":5,"property":"text","value":"**"},
        {"op":"set-prop","id":5,"property":"style-class","value":"ed-r ed-delim ed-hidden"},
        {"op":"set-prop","id":5,"property":"display","value":"none"},
        {"op":"set-prop","id":5,"property":"accessibility-identifier","value":"ls-editor-run-2"},
        {"op":"insert-child","parent":2,"child":5,"index":2},
        {"op":"create-node","id":6,"kind":"text"},
        {"op":"set-prop","id":6,"property":"text","value":suffix},
        {"op":"set-prop","id":6,"property":"accessibility-identifier","value":"ls-editor-run-3"},
        {"op":"insert-child","parent":2,"child":6,"index":3},
        {"op":"create-node","id":7,"kind":"text"},
        {"op":"set-prop","id":7,"property":"text","value":"\u{200b}"},
        {"op":"set-prop","id":7,"property":"accessibility-identifier","value":"ls-editor-run-4"},
        {"op":"insert-child","parent":2,"child":7,"index":4},
        {"op":"create-extension","id":8,"identifier":"logseq-editor","fingerprint":fingerprint},
        {"op":"set-extension-prop","id":8,"property":"block-id","value":"wrapped-markup"},
        {"op":"set-extension-prop","id":8,"property":"source-version","value":1},
        {"op":"set-extension-prop","id":8,"property":"caret","value":source_len},
        {"op":"set-extension-prop","id":8,"property":"runs","value":format!(
            "0,2,d;2,{close},p;{close},{},d;{},{source_len},p;{source_len},{source_len},z",
            close + 2, close + 2)},
        {"op":"insert-child","parent":1,"child":8,"index":1}
    ]);
    renderer
        .apply(Batch::decode(&json!({"generation":1,"ops":ops}).to_string()).unwrap())
        .unwrap();
    renderer.set_root(1).unwrap();
    let status = signal("Waiting for wrapped markup geometry".to_owned());
    let tasks = Rc::new(RefCell::new(Vec::<nsh_core::element::Spawned<()>>::new()));
    view()
        .child(renderer.element())
        .child(
            nsh_base::button()
                .child(text("Query wrapped markup partitions"))
                .on_press(move || {
                    let renderer = renderer.clone();
                    let source = source.clone();
                    tasks.borrow_mut().push(spawn(async move {
                        let layout = Layout::read(renderer.node_snapshot(8).unwrap(), &renderer)
                            .await
                            .unwrap()
                            .unwrap();
                        let line = &layout.lines[0];
                        let TextGeometryResult::Lines(visual) = &line.layout.result else {
                            panic!("expected committed visual lines");
                        };
                        assert!(
                            visual.len() > 1,
                            "fixture must wrap in the real text engine"
                        );
                        assert_eq!(line.source_offset(visual[0].start, true), Some(2));
                        let request = Request::decode(
                            "line-ranges",
                            json!({"geometry-epoch":0}).as_object().unwrap(),
                        )
                        .unwrap();
                        let answer = layout.answer(&request).await.unwrap().unwrap();
                        let ranges = answer["ranges"]
                            .as_str()
                            .unwrap()
                            .split(';')
                            .map(|encoded| {
                                let (a, b) = encoded.split_once(',').unwrap();
                                (a.parse::<usize>().unwrap(), b.parse::<usize>().unwrap())
                            })
                            .collect::<Vec<_>>();
                        assert_eq!(ranges.len(), visual.len());
                        assert_eq!(ranges[0].0, 0, "include the hidden opening marker");
                        assert_eq!(ranges.last().unwrap().1, source_len);
                        for (i, &(a, b)) in ranges.iter().enumerate() {
                            assert!(a <= b && b <= source_len);
                            assert!(source.is_char_boundary(a) && source.is_char_boundary(b));
                            if i > 0 {
                                assert_eq!(
                                    ranges[i - 1].1,
                                    a,
                                    "source coverage must be contiguous"
                                );
                                assert_eq!(Some(a), line.source_offset(visual[i].start, false));
                            }
                        }
                        let request = Request::decode(
                            "offset-at",
                            json!({"geometry-epoch":0,"x":0,"y":0}).as_object().unwrap(),
                        )
                        .unwrap();
                        let hit = layout.answer(&request).await.unwrap().unwrap();
                        assert_eq!(
                            hit["offset"], 2,
                            "hidden markup remains excluded from clicks"
                        );
                        status.set("Wrapped markup source partitions passed".into());
                    }));
                }),
        )
        .child(text(move || status.get()))
}

#[test]
fn coretext_wrapped_lines_cover_hidden_leading_markup_without_changing_hits() {
    let mut app = Headless::start_with_text_engine(
        EngineConfig::new(Root::of::<WrappedHiddenMarkupGeometry>()),
        nsh_platform_macos::CoreTextEngine::default,
    )
    .unwrap();
    app.first_render().unwrap();
    app.press("Query wrapped markup partitions").unwrap();
    app.wait_for("Wrapped markup source partitions passed")
        .unwrap();
}
