//! The canonical extension protocol over a real retained NSH Input. The fixture's
//! tiny receiver stands in for OCaml only; actual OCaml/native IME is a separate gate.
use super::*;
use lui_nsh::{
    extensions::{Extensions, Profile, Schema},
    render::{Event, Renderer},
    wire::Batch,
};
use nsh_engine::{EngineConfig, EngineContext, Root};
use nsh_testing::Headless;
use serde_json::json;
use std::{
    cell::Cell,
    sync::{Arc, Mutex},
};

#[test]
fn utf16_ranges_reject_surrogates_and_preserve_byte_boundaries() {
    let source = "A😀中z";
    for (units, bytes) in [(0, 0), (1, 1), (3, 5), (4, 8), (5, 9)] {
        assert_eq!(utf16_to_byte(source, units), Some(bytes));
        assert_eq!(byte_to_utf16(source, bytes), Some(units));
    }
    assert_eq!(utf16_to_byte(source, 2), None);
    assert_eq!(utf16_to_byte(source, 6), None);
    assert_eq!(byte_to_utf16(source, 2), None);
    assert_eq!(byte_to_utf16(source, 10), None);
}
#[test]
fn native_replacements_preserve_selection_with_repeated_and_multibyte_text() {
    assert_eq!(
        replacement("aaaa", "aaaaa", (1, 1)),
        Some(Replacement {
            first: 1,
            last: 1,
            text: "a".into()
        })
    );
    assert_eq!(
        replacement("A😀中z", "AXz", (1, 8)),
        Some(Replacement {
            first: 1,
            last: 8,
            text: "X".into()
        })
    );
    assert_eq!(
        replacement("A😀中z", "A😀z", (8, 8)),
        Some(Replacement {
            first: 5,
            last: 8,
            text: "".into()
        })
    );
    assert_eq!(
        replacement("one two", "one three", (0, 0)),
        Some(Replacement {
            first: 5,
            last: 7,
            text: "hree".into()
        })
    );
    assert_eq!(replacement("unchanged", "unchanged", (0, 0)), None);
}
fn schema() -> Schema {
    serde_json::from_str::<Vec<Schema>>(include_str!("../../schemas.json"))
        .unwrap()
        .into_iter()
        .find(|schema| schema.identifier == "logseq-editor")
        .unwrap()
}
fn batch(generation: u64, ops: Value) -> Batch {
    Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
}
type RecordedEvents = Arc<Mutex<Vec<(String, Map<String, Value>)>>>;
#[derive(Clone)]
struct Fixture {
    events: RecordedEvents,
    model: Arc<Mutex<EditorSnapshot>>,
}
#[component]
fn EditorFixture() -> impl IntoElement {
    let fixture = engine_context::<Fixture>().unwrap();
    let model = fixture.model.clone();
    let reader: SnapshotReader = Rc::new(move |_| {
        let snapshot = model.lock().unwrap().clone();
        Box::pin(async move { Ok(Some(snapshot)) })
    });
    let registry = Extensions::builder()
        .register(schema(), move |context| {
            native_sink(context, "block-1".into(), reader.clone())
        })
        .unwrap()
        .validate("logseq-editor", validate)
        .unwrap()
        .freeze(Profile {
            os: "linux".into(),
            host: "generic".into(),
        })
        .unwrap();
    let generation = Rc::new(Cell::new(1_u64));
    let events = fixture.events.clone();
    let model = fixture.model.clone();
    let event_generation = generation.clone();
    let renderer = Renderer::with_extensions(registry, move |event, renderer| {
        if let Event::Extension { name, values, .. } = event {
            events.lock().unwrap().push((name.clone(), values.clone()));
            let mut model = model.lock().unwrap();
            match name.as_str() {
                "pointer" => {
                    let offset = values["offset"].as_u64().unwrap() as usize;
                    if !values
                        .get("extend")
                        .and_then(Value::as_bool)
                        .unwrap_or(false)
                    {
                        model.anchor = offset;
                    }
                    model.caret = offset;
                }
                "insert" => {
                    let (lo, hi) = ordered((model.anchor, model.caret));
                    let text = values["text"].as_str().unwrap();
                    model.source.replace_range(lo..hi, text);
                    model.caret = lo + text.len();
                    model.anchor = model.caret;
                }
                "delete" => {
                    let (lo, hi) = ordered((model.anchor, model.caret));
                    model.source.replace_range(lo..hi, "");
                    model.caret = lo;
                    model.anchor = lo;
                }
                _ => {}
            }
            let next = event_generation.get() + 1;
            let caret = model.caret;
            // Vary runs as the real model does without reconstructing source from it.
            let runs = format!("0,{},p", model.source.len());
            drop(model);
            renderer
                .apply(batch(
                    next,
                    json!([
                        {"op":"set-extension-prop","id":1,"property":"caret","value":caret},
                        {"op":"set-extension-prop","id":1,"property":"runs","value":runs}
                    ]),
                ))
                .unwrap();
            event_generation.set(next);
        }
    });
    renderer.apply(batch(1,json!([
        {"op":"create-extension","id":1,"identifier":"logseq-editor","fingerprint":schema().fingerprint},
        {"op":"set-extension-prop","id":1,"property":"block-id","value":"block-1"},
        {"op":"set-extension-prop","id":1,"property":"runs","value":"0,9,p"},
        {"op":"set-extension-prop","id":1,"property":"caret","value":9},
        {"op":"set-extension-prop","id":1,"property":"accessibility-identifier","value":"edit-block-1"}
    ]))).unwrap();
    renderer.set_root(1).unwrap();
    let replace = renderer.clone();
    let revision = generation.clone();
    let remote = fixture.model.clone();
    on_key_with(
        "f2",
        KeyOptions {
            when: When::Always,
            ..Default::default()
        },
        move |_| {
            *remote.lock().unwrap() = EditorSnapshot {
                source: "remote😀".into(),
                anchor: 6,
                caret: 10,
            };
            let next = revision.get() + 1;
            replace
                .apply(batch(
                    next,
                    json!([
                        {"op":"set-extension-prop","id":1,"property":"caret","value":10},
                        {"op":"set-extension-prop","id":1,"property":"runs","value":"0,10,p"}
                    ]),
                ))
                .unwrap();
            revision.set(next);
        },
    );
    let clear = renderer.clone();
    let clear_generation = generation.clone();
    on_key_with(
        "f3",
        KeyOptions {
            when: When::Always,
            ..Default::default()
        },
        move |_| {
            let next = clear_generation.get() + 1;
            clear.replace(batch(next, json!([]))).unwrap();
            clear_generation.set(next);
        },
    );
    renderer.element()
}
fn start() -> (Headless, Fixture) {
    let fixture = Fixture {
        events: Arc::new(Mutex::new(Vec::new())),
        model: Arc::new(Mutex::new(EditorSnapshot {
            source: "A😀中z".into(),
            anchor: 9,
            caret: 9,
        })),
    };
    let mut config = EngineConfig {
        context: EngineContext::default().with(fixture.clone()),
        ..EngineConfig::new(Root::of::<EditorFixture>())
    };
    config.environment.os = nsh_core::platform::Os::Linux;
    let mut app = Headless::start(config).unwrap();
    app.wait_for("text:A😀中z").unwrap();
    (app, fixture)
}
fn native(app: &Headless) -> nsh_core::NodeId {
    app.screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some("lui-1"))
        .unwrap()
        .id
}
#[test]
fn actual_native_input_inserts_unicode_once_and_metadata_refresh_keeps_identity() {
    let (mut app, fixture) = start();
    let before = native(&app);
    app.type_text("id:lui-1", "你").unwrap();
    assert_eq!(fixture.model.lock().unwrap().source, "A😀中z你");
    let events = fixture.events.lock().unwrap();
    assert_eq!(
        events.iter().filter(|(name, _)| name == "insert").count(),
        1
    );
    assert!(
        events
            .iter()
            .any(|(name, values)| name == "pointer" && values["offset"] == 9)
    );
    drop(events);
    assert_eq!(native(&app), before);
    app.press_key("f2").unwrap();
    app.wait_for("text:remote😀").unwrap();
    assert_eq!(native(&app), before);
}
#[test]
fn structural_keys_are_model_events_and_do_not_also_edit_the_native_buffer() {
    let (mut app, fixture) = start();
    app.type_text("id:lui-1", "").unwrap();
    fixture.events.lock().unwrap().clear();
    app.press_key("enter").unwrap();
    app.press_key("shift+tab").unwrap();
    let events = fixture.events.lock().unwrap();
    assert_eq!(
        events
            .iter()
            .filter(|(name, values)| name == "key" && values["key"] == "Enter")
            .count(),
        1
    );
    assert_eq!(
        events
            .iter()
            .filter(|(name, values)| name == "key"
                && values["key"] == "Tab"
                && values["shift"] == true)
            .count(),
        1
    );
    assert!(
        !events
            .iter()
            .any(|(name, _)| name == "insert" || name == "delete")
    );
    assert_eq!(fixture.model.lock().unwrap().source, "A😀中z");
}
#[test]
fn native_preedit_cancel_is_not_committed_and_removed_sink_releases_its_keys() {
    let (mut app, fixture) = start();
    app.compose("id:lui-1", "ni").unwrap();
    app.compose("id:lui-1", "").unwrap();
    let events = fixture.events.lock().unwrap();
    let states = events
        .iter()
        .filter(|(name, _)| name == "composition")
        .map(|(_, values)| values["state"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(states, ["start", "update", "cancel"]);
    assert!(!events.iter().any(|(name, _)| name == "insert"));
    drop(events);
    app.press_key("f3").unwrap();
    assert!(
        app.screen()
            .layout_nodes()
            .iter()
            .all(|node| node.test_id.as_deref() != Some("lui-1")),
        "the fixture must retire the native sink before probing stale key handlers"
    );
    let before = fixture.events.lock().unwrap().len();
    app.press_key("enter").unwrap();
    assert_eq!(fixture.events.lock().unwrap().len(), before);
}
