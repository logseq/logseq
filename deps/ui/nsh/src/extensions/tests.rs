//! These tests run the actual native editor and the canonical exported app schema.
use super::*;
use lui_nsh::{
    extensions::{Extensions, Profile},
    render::{Event, Renderer},
    wire::Batch,
};
use nsh_core::{
    platform::{Idiom, Os},
    prelude::*,
};
use nsh_engine::{EngineConfig, EngineContext, Root};
use nsh_testing::Headless;
use serde_json::{Value, json};
use std::{
    cell::Cell,
    fmt::Write,
    rc::Rc,
    sync::{Arc, Mutex},
};

fn schema() -> Schema {
    serde_json::from_str::<Vec<Schema>>(include_str!("../../schemas.json"))
        .unwrap()
        .into_iter()
        .find(|schema| schema.identifier == "logseq-codemirror")
        .unwrap()
}
fn batch(generation: u64, ops: Value) -> Batch {
    Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
}
type Events = Arc<Mutex<Vec<serde_json::Map<String, Value>>>>;
#[derive(Clone)]
struct Fixture {
    query: bool,
    readonly: bool,
    horizontal_parent: bool,
    document: String,
    language: String,
    events: Events,
}
#[component]
fn CodeMirrorFixture() -> impl IntoElement {
    let fixture = engine_context::<Fixture>().unwrap();
    let registry = register_codemirror(Extensions::builder(), schema())
        .unwrap()
        .freeze(Profile {
            os: "linux".into(),
            host: "generic".into(),
        })
        .unwrap();
    let generation = Rc::new(Cell::new(1));
    let event_generation = generation.clone();
    let events = fixture.events.clone();
    let renderer = Renderer::with_extensions(registry, move |event, renderer| {
        if let Event::Extension { values, .. } = event {
            let input = values["name"] == "input";
            let value = values.get("value").cloned();
            events.lock().unwrap().push(values);
            if input {
                let next = event_generation.get() + 1;
                renderer.apply(batch(next,json!([
                    {"op":"set-extension-prop","id":1,"property":"value","value":value.unwrap()}
                ]))).unwrap();
                event_generation.set(next);
            }
        }
    });
    renderer.apply(batch(1,json!([
        {"op":"create-extension","id":1,"identifier":"logseq-codemirror","fingerprint":schema().fingerprint},
        {"op":"set-extension-prop","id":1,"property":"uuid","value":"first"},
        {"op":"set-extension-prop","id":1,"property":"source-role","value":if fixture.query {"query"} else {"block"}},
        {"op":"set-extension-prop","id":1,"property":"value","value":fixture.document},
        {"op":"set-extension-prop","id":1,"property":"lang","value":fixture.language},
        {"op":"set-extension-prop","id":1,"property":"read-only","value":fixture.readonly}
    ]))).unwrap();
    // Render.code_block places its extension directly in a grow Row. Keep
    // that canonical parent rather than relying on the outer fixture's
    // column/stretch to size a component whose own root is a keyed region.
    let root = if fixture.horizontal_parent {
        renderer
            .apply(batch(
                2,
                json!([
                    {"op":"create-node","id":2,"kind":"row"},
                    {"op":"set-prop","id":2,"property":"grow","value":1.0},
                    {"op":"set-prop","id":2,"property":"style-class","value":"code-editor"},
                    {"op":"insert-child","parent":2,"child":1,"index":0}
                ]),
            ))
            .unwrap();
        generation.set(2);
        2
    } else {
        1
    };
    renderer.set_root(root).unwrap();
    let action_renderer = renderer.clone();
    let action = move |label: &'static str, properties: Value| {
        let renderer = action_renderer.clone();
        let generation = generation.clone();
        nsh_base::button().child(text(label)).on_press(move || {
            let ops = properties
                .as_object()
                .unwrap()
                .iter()
                .map(|(property, value)| {
                    json!({
                        "op":"set-extension-prop","id":1,"property":property,"value":value
                    })
                })
                .collect::<Vec<_>>();
            let next = generation.get() + 1;
            renderer.apply(batch(next, json!(ops))).unwrap();
            generation.set(next);
        })
    };
    view()
        .w(px(640.0))
        .child(action("Remote source", json!({"value":"remote"})))
        .child(action(
            "Rebind source",
            json!({"uuid":"second","value":"replacement"}),
        ))
        .child(action("Change language", json!({"lang":"rust"})))
        .child(action("Use calc", json!({"lang":" CALC "})))
        .child(action("Use ordinary alias", json!({"lang":" CLJ "})))
        .child(renderer.element())
}
fn start(query: bool, readonly: bool) -> (Headless, Events) {
    start_with_parent(query, readonly, false)
}
fn start_with_parent(query: bool, readonly: bool, horizontal_parent: bool) -> (Headless, Events) {
    start_with_source(query, readonly, horizontal_parent, "initial", "edn", None)
}
fn start_with_source(
    query: bool,
    readonly: bool,
    horizontal_parent: bool,
    document: &str,
    language: &str,
    viewport: Option<Size<Points>>,
) -> (Headless, Events) {
    let events = Arc::new(Mutex::new(Vec::new()));
    let mut config = EngineConfig {
        context: EngineContext::default().with(Fixture {
            query,
            readonly,
            horizontal_parent,
            document: document.into(),
            language: language.into(),
            events: events.clone(),
        }),
        ..EngineConfig::new(Root::of::<CodeMirrorFixture>())
    };
    config.environment.os = Os::Linux;
    config.environment.idiom = Idiom::Desktop;
    if let Some(viewport) = viewport {
        config.viewport = viewport;
    }
    let mut app = Headless::start(config).unwrap();
    app.wait_for("id:lui-1").unwrap();
    (app, events)
}
fn native(app: &Headless) -> nsh_core::NodeId {
    app.screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some("lui-1"))
        .unwrap()
        .id
}

fn editor_height(app: &Headless) -> f32 {
    app.screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some("lui-1"))
        .unwrap()
        .bounds
        .size
        .height
        .0
}

fn code_geometry(app: &Headless) -> ([nsh_core::NodeId; 3], [f32; 3]) {
    let nodes = app.screen().layout_nodes();
    let editor = nodes
        .iter()
        .find(|node| node.test_id.as_deref() == Some("lui-1"))
        .expect("the actual native Editor root");
    let factory = nodes
        .iter()
        .find(|node| node.id == editor.parent)
        .expect("the existing factory measurement View surrounding the keyed Editor");
    let region = nodes
        .iter()
        .find(|node| node.test_id.as_deref() == Some("lui-2"))
        .expect("the actual canonical code-editor Row");
    assert_eq!(
        factory.parent, region.id,
        "measure the existing factory root, not a guessed ancestor"
    );
    (
        [editor.id, factory.id, region.id],
        [
            editor.bounds.size.height.0,
            factory.bounds.size.height.0,
            region.bounds.size.height.0,
        ],
    )
}

fn long_document(lines: usize) -> String {
    let mut value = String::with_capacity(lines * 24);
    for line in 0..lines {
        writeln!(value, "line {line:06} source").unwrap();
    }
    value
}

#[test]
fn ordinary_code_and_queries_keep_complete_large_documents_in_the_master_sized_viewport() {
    for query in [false, true] {
        let mut initial_witnesses = None;
        for lines in [1_000, 100_000] {
            let source = long_document(lines);
            let (mut app, events) = start_with_source(
                query,
                false,
                true,
                &source,
                "plaintext",
                Some(nsh_core::geometry::size(px(640.0), px(1600.0))),
            );
            assert_eq!(
                code_geometry(&app).1,
                [1024.0; 3],
                "the Editor viewport, existing factory measurement root and canonical Row must all be bounded"
            );
            let witness_count = app.screen().layout_nodes().len();
            if let Some(expected) = initial_witnesses {
                assert_eq!(
                    witness_count, expected,
                    "100k source must reuse the same viewport-sized native witness count as 1k"
                );
            } else {
                initial_witnesses = Some(witness_count);
            }
            let before = native(&app);
            app.type_text("id:lui-1", "").unwrap();
            app.press_key("ctrl+end").unwrap();
            let mut paste = nsh_core::PasteEvent::default();
            paste.text = "complete native document tail".into();
            app.paste("id:lui-1", &paste).unwrap();
            {
                let recorded = events.lock().unwrap();
                let value = recorded
                    .iter()
                    .rev()
                    .find(|event| event["name"] == "input")
                    .unwrap()["value"]
                    .as_str()
                    .unwrap();
                assert!(
                    value == format!("{source}{}", paste.text),
                    "native document-end paste must preserve every source line and its exact order"
                );
            }
            app.press_key("ctrl+z").unwrap();
            let recorded = events.lock().unwrap();
            let restored = recorded
                .iter()
                .rev()
                .find(|event| event["name"] == "input")
                .unwrap()["value"]
                .as_str()
                .unwrap();
            assert!(
                restored == source,
                "Undo must restore the full native document"
            );
            assert_eq!(native(&app), before);
            assert_eq!(code_geometry(&app).1, [1024.0; 3]);
        }
    }
}

#[test]
fn short_code_grows_naturally_and_calc_removes_the_cap_without_replacing_history_or_focus() {
    let (short, _) = start_with_parent(false, false, true);
    let short_height = editor_height(&short);
    assert!(
        (20.0..1024.0).contains(&short_height),
        "min_rows keeps one editable row; max-height must not become fixed height"
    );
    assert_eq!(
        code_geometry(&short).1,
        [short_height; 3],
        "the measurement root must not reserve a fixed maximum for short code"
    );
    drop(short);
    let source = long_document(1_000);
    let (mut app, events) = start_with_source(
        false,
        false,
        true,
        &source,
        "plaintext",
        Some(nsh_core::geometry::size(px(640.0), px(1600.0))),
    );
    let before = native(&app);
    let owners = code_geometry(&app).0;
    app.type_text("id:lui-1", "").unwrap();
    app.press_key("ctrl+end").unwrap();
    let mut paste = nsh_core::PasteEvent::default();
    paste.text = "unsaved native history".into();
    app.paste("id:lui-1", &paste).unwrap();
    events.lock().unwrap().clear();
    app.press("text:Use calc").unwrap();
    assert_eq!(native(&app), before);
    assert!(
        code_geometry(&app).1.iter().all(|height| *height > 1024.0),
        "normalized CALC removes both control bounds and keeps natural parent sizing"
    );
    assert_eq!(code_geometry(&app).0, owners);
    app.press("text:Use ordinary alias").unwrap();
    assert_eq!(native(&app), before);
    assert_eq!(code_geometry(&app).1, [1024.0; 3]);
    assert_eq!(code_geometry(&app).0, owners);
    app.press("text:Change language").unwrap();
    assert_eq!(native(&app), before);
    assert_eq!(code_geometry(&app).1, [1024.0; 3]);
    assert_eq!(code_geometry(&app).0, owners);
    assert!(
        !events
            .lock()
            .unwrap()
            .iter()
            .any(|event| event["name"] == "blur"),
        "reactive language/height updates must not retire the focused native Editor"
    );
    // No focus/type helper follows the property changes: the same focused
    // editor must still own this real key and its earlier document history.
    app.press_key("ctrl+z").unwrap();
    let recorded = events.lock().unwrap();
    let restored = recorded
        .iter()
        .rev()
        .find(|event| event["name"] == "input")
        .unwrap()["value"]
        .as_str()
        .unwrap();
    assert!(
        restored == source,
        "language changes must preserve the real Undo history"
    );
    assert_eq!(native(&app), before);
    assert_eq!(code_geometry(&app).0, owners);
}

#[test]
fn code_editor_fills_its_actual_canonical_row_parent_and_accepts_input() {
    let (mut app, events) = start_with_parent(false, false, true);
    let root = app
        .screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some("lui-1"))
        .expect("the actual native Editor root must be materialized inside its code-editor Row");
    assert!(
        root.bounds.size.width.0 > 600.0,
        "the Editor must fill its 640pt production Row, got {:?}",
        root.bounds
    );
    assert!(
        root.bounds.size.height.0 >= 20.0,
        "min_rows must keep a real editable row"
    );
    app.type_text("id:lui-1", " row edit").unwrap();
    assert!(events.lock().unwrap().iter().any(|event| {
        event["name"] == "input"
            && event["value"]
                .as_str()
                .is_some_and(|value| value.contains(" row edit"))
    }));
    assert_eq!(
        native(&app),
        root.id,
        "parent sizing must not remount the Editor on controlled echo"
    );
}

#[test]
fn code_editor_echo_and_language_updates_keep_native_identity_and_undo() {
    let (mut app, events) = start(false, false);
    let before = native(&app);
    app.type_text("id:lui-1", "你😀").unwrap();
    let draft = events
        .lock()
        .unwrap()
        .iter()
        .rev()
        .find(|event| event["name"] == "input")
        .unwrap()["value"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(draft.contains("你😀"));
    app.press("text:Change language").unwrap();
    assert_eq!(native(&app), before);
    app.type_text("id:lui-1", "").unwrap();
    app.press_key("ctrl+z").unwrap();
    assert_eq!(events.lock().unwrap().last().unwrap()["value"], "initial");
}

#[test]
fn source_rebinding_replaces_native_editor_but_plain_authoritative_updates_do_not() {
    let (mut app, _) = start_with_parent(false, false, true);
    let before = native(&app);
    let owners = code_geometry(&app).0;
    app.press("text:Remote source").unwrap();
    app.wait_for("text:remote").unwrap();
    assert_eq!(native(&app), before);
    assert_eq!(code_geometry(&app).0, owners);
    app.press("text:Rebind source").unwrap();
    app.wait_for("text:replacement").unwrap();
    assert_ne!(native(&app), before);
    let (after, heights) = code_geometry(&app);
    assert_eq!(
        after[1..],
        owners[1..],
        "source replacement retains the factory measurement root and Row"
    );
    assert_eq!(
        heights, [heights[0]; 3],
        "a replacement short source must not leave blank reserved document height"
    );
}

#[test]
fn readonly_editor_preserves_text_and_emits_no_input() {
    let (mut app, events) = start(false, true);
    let before = native(&app);
    let text_before = app
        .screen()
        .texts()
        .into_iter()
        .map(str::to_owned)
        .collect::<Vec<_>>();
    // A delivered edit may be refused without a driver error. Verify the native
    // document and application events, rather than the command's transport result.
    let _ = app.type_text("id:lui-1", "forbidden");
    assert_eq!(native(&app), before);
    assert_eq!(
        app.screen().texts(),
        text_before.iter().map(String::as_str).collect::<Vec<_>>()
    );
    assert!(
        !events
            .lock()
            .unwrap()
            .iter()
            .any(|event| event["name"] == "input")
    );
}

#[test]
fn query_enter_and_block_shift_enter_emit_existing_app_commands_without_newlines() {
    for (query, key, expected) in [
        (true, "enter", "Enter"),
        (false, "shift+enter", "Shift-Enter"),
    ] {
        let (mut app, events) = start(query, false);
        app.type_text("id:lui-1", "").unwrap();
        app.press_key(key).unwrap();
        let events = events.lock().unwrap();
        let command = events
            .iter()
            .find(|event| event.get("key") == Some(&Value::from(expected)))
            .unwrap();
        assert_eq!(command["name"], "key");
        assert_eq!(command["value"], "initial");
        assert!(!events.iter().any(|event| event["name"] == "input"));
    }
}

#[test]
fn focused_query_retains_draft_when_evaluation_snapshot_changes() {
    let (mut app, events) = start(true, false);
    app.type_text("id:lui-1", " draft").unwrap();
    let draft = events
        .lock()
        .unwrap()
        .iter()
        .rev()
        .find(|event| event["name"] == "input")
        .unwrap()["value"]
        .clone();
    app.press("text:Remote source").unwrap();
    app.press_key("enter").unwrap();
    let events = events.lock().unwrap();
    let command = events
        .iter()
        .rev()
        .find(|event| event.get("key") == Some(&Value::from("Enter")))
        .unwrap();
    assert_eq!(command["value"], draft);
}

#[test]
fn native_preedit_cancel_and_atomic_utf8_paste_preserve_the_query_document() {
    let (mut app, events) = start(true, false);
    let before = native(&app);
    app.compose("id:lui-1", "ni").unwrap();
    assert!(
        !events
            .lock()
            .unwrap()
            .iter()
            .any(|event| event["name"] == "input")
    );
    app.compose("id:lui-1", "").unwrap();
    app.wait_for("text:initial").unwrap();
    assert!(
        !events
            .lock()
            .unwrap()
            .iter()
            .any(|event| event["name"] == "input")
    );
    events.lock().unwrap().clear();
    // Headless type_text is one native edit per Unicode character. Paste is
    // one atomic native edit, so exactly one input is required for both scalars.
    let mut paste = nsh_core::PasteEvent::default();
    paste.text = "你😀".into();
    app.paste("id:lui-1", &paste).unwrap();
    let emitted = events.lock().unwrap();
    let inputs = emitted
        .iter()
        .filter(|event| event["name"] == "input")
        .collect::<Vec<_>>();
    assert_eq!(
        inputs.len(),
        1,
        "one atomic native edit must be forwarded exactly once"
    );
    let value = inputs[0]["value"].as_str().unwrap().to_owned();
    assert_eq!(value.matches("你😀").count(), 1);
    assert_eq!(
        value.replace("你😀", ""),
        "initial",
        "cancelled preedit leaked into the atomic edit"
    );
    assert!(
        !emitted
            .iter()
            .any(|event| event.get("key") == Some(&Value::from("Enter")))
    );
    drop(emitted);
    app.wait_for(&format!("text:{value}")).unwrap();
    assert_eq!(native(&app), before);
}
