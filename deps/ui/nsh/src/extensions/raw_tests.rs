//! Admission uses schemas exported by the actual linked OCaml application.
use crate::extensions::{raw, register_codemirror, register_editor, register_raw};
use lui_nsh::{
    extensions::{ExtensionEmitter, Extensions, Profile, Schema},
    render::{Event, Renderer},
    wire::Batch,
};
use nsh_core::prelude::*;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;
use serde_json::{Value, json};
use std::{cell::RefCell, rc::Rc, sync::Arc};

#[component]
fn ManagedAssets() -> impl IntoElement {
    use crate::services::resources::Resources;
    use lui_nsh::app::ApplicationMutations;
    let resources = Resources::new();
    let base = std::env::temp_dir().join("logseq-managed-asset-policy");
    let roots = |graph: &str| {
        json!({"graph":graph,"graph-dir":base,"asset-dir":base.join("assets")}).to_string()
    };
    resources.install(&roots("original")).unwrap();
    provide_context(resources);
    let held = signal(false);
    provide_context(ApplicationMutations::new(move || {
        if held.get_untracked() {
            Err("held for update".into())
        } else {
            Ok(())
        }
    }));
    let admission = use_context::<ApplicationMutations>().unwrap();
    let captured = Rc::new(RefCell::new(
        None::<(lui_nsh::extensions::ExtensionContext, Owner)>,
    ));
    let schemas = schemas();
    let fingerprint = schemas
        .iter()
        .find(|schema| schema.identifier == "logseq-a")
        .unwrap()
        .fingerprint
        .clone();
    let mut builder = Extensions::builder();
    for schema in schemas {
        builder = match schema.identifier.as_str() {
            "logseq-a" => {
                let capture = captured.clone();
                builder
                    .register(schema, move |context| {
                        *capture.borrow_mut() = Some((context.clone(), Owner::current()));
                        raw::element(context)
                    })
                    .unwrap()
                    .validate("logseq-a", raw::validate)
                    .unwrap()
                    .validate_themed("logseq-a", raw::validate_themed)
                    .unwrap()
            }
            "logseq-codemirror" => register_codemirror(builder, schema).unwrap(),
            "logseq-editor" => register_editor(builder, schema).unwrap(),
            _ => register_raw(builder, schema).unwrap(),
        };
    }
    let registry = builder
        .freeze(Profile {
            os: "macos".into(),
            host: "nsh".into(),
        })
        .unwrap();
    let renderer = Renderer::with_extensions(registry, |_, _| {});
    let attrs = json!({"data-asset-graph":"original","data-asset-file":"图 report.txt","href":"/stale/graph/report.txt"});
    renderer
        .apply(patch(
            1,
            json!([
                {"op":"create-extension","id":1,"identifier":"logseq-a","fingerprint":fingerprint},
                {"op":"set-extension-prop","id":1,"property":"text","value":"Report"},
                {"op":"set-extension-prop","id":1,"property":"attrs","value":attrs.to_string()}
            ]),
        ))
        .unwrap();
    renderer.set_root(1).unwrap();
    let disable = renderer.clone();
    let retire = renderer.clone();
    let switched = roots("different");
    view().child(renderer.element())
        .child(nsh_base::button().child(text("Hold assets")).on_press(move || held.set(true)))
        .child(nsh_base::button().child(text("Release assets")).on_press(move || held.set(false)))
        .child(nsh_base::button().child(text("Switch asset graph")).on_press(move || resources.install(&switched).unwrap()))
        .child(nsh_base::button().child(text("Close asset graph")).on_press(move || resources.install(r#"{"graph":"","graph-dir":"","asset-dir":""}"#).unwrap()))
        .child(nsh_base::button().child(text("Disable asset")).on_press(move || {
            let mut attrs=attrs.clone(); attrs["disabled"]=json!("");
            disable.apply(patch(2,json!([{"op":"set-extension-prop","id":1,"property":"attrs","value":attrs.to_string()}]))).unwrap();
        }))
        .child(nsh_base::button().child(text("Retire asset")).on_press(move || {
            retire.apply(patch(3,json!([{"op":"detach-subtree","id":1}]))).unwrap();
        }))
        .child(nsh_base::button().child(text("Try retained asset")).on_press(move || {
            let captured=captured.borrow(); let (context,owner)=captured.as_ref().unwrap();
            raw::activate_asset(context,*owner,Some(&admission),Some(resources),None);
        }))
        .child(text("asset-ready"))
}

#[test]
fn managed_asset_activation_uses_native_open_path_and_rejects_stale_or_held_views() {
    use nsh_core::file_dialog::FileRequest;
    let start = || {
        let mut config = EngineConfig::new(Root::of::<ManagedAssets>());
        config.environment.os = nsh_core::platform::Os::MacOs;
        let mut app = Headless::start(config).unwrap();
        // Headless defaults to no desktop file service. This public mock also
        // records OpenPath without opening or changing the requested file.
        app.on_pick_paths(Vec::new()).unwrap();
        app.wait_for("asset-ready").unwrap();
        app
    };
    let mut app = start();
    app.press("Report").unwrap();
    app.wait_for("asset-ready").unwrap();
    assert_eq!(
        app.screen().file_requests(),
        &[FileRequest::OpenPath(
            std::env::temp_dir().join("logseq-managed-asset-policy/assets/图 report.txt")
        )]
    );
    app.press("Hold assets").unwrap();
    app.press("Report").unwrap();
    assert_eq!(app.screen().file_requests().len(), 1);
    app.press("Release assets").unwrap();
    app.press("Report").unwrap();
    assert_eq!(app.screen().file_requests().len(), 2);
    app.press("Switch asset graph").unwrap();
    app.press("Report").unwrap();
    assert_eq!(app.screen().file_requests().len(), 2);
    app.press("Close asset graph").unwrap();
    app.press("Report").unwrap();
    assert_eq!(app.screen().file_requests().len(), 2);

    let mut app = start();
    app.press("Disable asset").unwrap();
    app.press("Try retained asset").unwrap();
    assert!(app.screen().file_requests().is_empty());
    let mut app = start();
    app.press("Retire asset").unwrap();
    app.press("Try retained asset").unwrap();
    assert!(app.screen().file_requests().is_empty());
}

fn schemas() -> Vec<Schema> {
    serde_json::from_str(include_str!("../../schemas.json")).unwrap()
}
fn patch(generation: u64, ops: Value) -> Batch {
    Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
}
#[component]
fn ActualRawContract() -> impl IntoElement {
    let schemas = schemas();
    let div = schemas
        .iter()
        .find(|schema| schema.identifier == "logseq-div")
        .unwrap();
    assert!(div.standard_children);
    assert!(
        div.properties
            .iter()
            .all(|property| property.default.is_none())
    );
    assert!(
        div.profiles.contains(&Profile {
            os: "macos".into(),
            host: "nsh".into()
        }),
        "the actual native export must admit NshHost"
    );
    let fingerprint = div.fingerprint.clone();
    let emitter = Rc::new(RefCell::new(None::<ExtensionEmitter>));
    let mut builder = Extensions::builder();
    for schema in schemas {
        if schema.identifier == "logseq-codemirror" {
            builder = register_codemirror(builder, schema).unwrap();
        } else if schema.identifier == "logseq-div" {
            let capture = emitter.clone();
            builder = builder
                .register(schema, move |context| {
                    *capture.borrow_mut() = Some(context.emitter.clone());
                    raw::element(context)
                })
                .unwrap()
                .validate("logseq-div", raw::validate)
                .unwrap()
                .validate_themed("logseq-div", raw::validate_themed)
                .unwrap();
        } else if schema.identifier.starts_with("logseq-") && schema.identifier != "logseq-editor" {
            builder = register_raw(builder, schema).unwrap();
        }
    }
    let registry = builder
        .freeze(Profile {
            os: "macos".into(),
            host: "nsh".into(),
        })
        .unwrap();
    let events = signal(Vec::<serde_json::Map<String, Value>>::new());
    let renderer = Renderer::with_extensions(registry, move |event, _| {
        if let Event::Extension {
            identifier,
            name,
            values,
            ..
        } = event
        {
            assert_eq!(identifier, "logseq-div");
            assert_eq!(name, "dom-event");
            events.update(|events| events.push(values));
        }
    });
    renderer
        .apply(patch(
            1,
            json!([
        {"op":"create-extension","id":1,"identifier":"logseq-div","fingerprint":fingerprint},
        {"op":"set-extension-prop","id":1,"property":"text","value":"Actual raw schema"},
        {"op":"set-extension-prop","id":1,"property":"width","value":"240px"},
        {"op":"set-extension-prop","id":1,"property":"font-size","value":16.0},
        {"op":"create-node","id":2,"kind":"text"},
        {"op":"set-prop","id":2,"property":"text","value":"Retained child"},
        {"op":"insert-child","parent":1,"child":2,"index":0}]),
        ))
        .unwrap();
    renderer.set_root(1).unwrap();
    let old = renderer.node_snapshot(1).unwrap();
    let child = renderer.node_snapshot(2).unwrap();
    let invalid = [
        json!([{"op":"create-extension","id":3,"identifier":"unknown-app-widget","fingerprint":""}]),
        json!([{"op":"create-extension","id":3,"identifier":"logseq-div","fingerprint":"mismatch"}]),
        json!([{"op":"set-extension-prop","id":1,"property":"font-size","value":16}]),
        json!([{"op":"set-extension-prop","id":1,"property":"width","value":240.0}]),
        json!([{"op":"set-extension-prop","id":1,"property":"unknown","value":"bad"}]),
        json!([{"op":"set-extension-prop","id":1,"property":"attrs","value":"not-json"}]),
        json!([{"op":"set-prop","id":1,"property":"width","value":240.0}]),
        json!([{"op":"create-node","id":3,"kind":"root"},{"op":"insert-child","parent":1,"child":3,"index":1}]),
    ];
    for ops in invalid {
        let mut transaction = vec![
            json!({"op":"set-extension-prop","id":1,"property":"text","value":"Must roll back"}),
        ];
        transaction.extend(ops.as_array().unwrap().iter().cloned());
        assert!(renderer.apply(patch(2, json!(transaction))).is_err());
        assert!(Arc::ptr_eq(&old, &renderer.node_snapshot(1).unwrap()));
        assert!(Arc::ptr_eq(&child, &renderer.node_snapshot(2).unwrap()));
    }
    renderer
        .apply(patch(
            2,
            json!([
        {"op":"set-extension-prop","id":1,"property":"text","value":"Actual raw schema"}]),
        ))
        .unwrap();
    let for_events = emitter.clone();
    let for_detach = renderer.clone();
    view()
        .child(renderer.element())
        .child(
            nsh_base::button()
                .child(text("Check raw events"))
                .on_press(move || {
                    let emitter = for_events.borrow();
                    let emitter = emitter.as_ref().unwrap();
                    assert!(
                        emitter
                            .try_emit(
                                "dom-event",
                                json!({"name":"click"}).as_object().unwrap().clone()
                            )
                            .unwrap()
                    );
                    assert!(
                        emitter
                            .try_emit(
                                "dom-event",
                                json!({"name":"input","payload":"{\"value\":\"actual\"}"})
                                    .as_object()
                                    .unwrap()
                                    .clone()
                            )
                            .unwrap()
                    );
                    for invalid in [
                        json!({}),
                        json!({"name":1}),
                        json!({"name":"click","extra":false}),
                        json!({"name":"input","payload":{}}),
                    ] {
                        assert!(
                            emitter
                                .try_emit("dom-event", invalid.as_object().unwrap().clone())
                                .is_err()
                        );
                    }
                    assert!(
                        emitter
                            .try_emit(
                                "undeclared",
                                json!({"name":"click"}).as_object().unwrap().clone()
                            )
                            .is_err()
                    );
                }),
        )
        .child(
            nsh_base::button()
                .child(text("Detach raw"))
                .on_press(move || {
                    for_detach
                        .apply(patch(3, json!([{"op":"detach-subtree","id":1}])))
                        .unwrap();
                    assert!(
                        !emitter
                            .borrow()
                            .as_ref()
                            .unwrap()
                            .try_emit(
                                "dom-event",
                                json!({"name":"click"}).as_object().unwrap().clone()
                            )
                            .unwrap()
                    );
                }),
        )
        .child(text(move || format!("Raw events: {}", events.get().len())))
        .child(text(move || {
            events
                .get()
                .iter()
                .map(|fields| {
                    let payload: Value = fields
                        .get("payload")
                        .and_then(Value::as_str)
                        .map(|payload| serde_json::from_str(payload).unwrap())
                        .unwrap_or(Value::Null);
                    format!(
                        "{}:{}",
                        fields["name"].as_str().unwrap(),
                        payload.get("buttons").unwrap_or(&Value::Null)
                    )
                })
                .collect::<Vec<_>>()
                .join(" ")
        }))
}
#[test]
fn actual_raw_schema_validates_atomically_and_guards_declared_events() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<ActualRawContract>())).unwrap();
    app.wait_for("Actual raw schema").unwrap();
    app.wait_for("Retained child").unwrap();
    app.press("Check raw events").unwrap();
    app.wait_for("Raw events: 2").unwrap();
    app.press("Detach raw").unwrap();
    assert!(!app.screen().shows("Actual raw schema"));
    assert!(!app.screen().shows("Retained child"));
    assert!(app.screen().shows("Raw events: 2"));
}

#[test]
fn actual_raw_content_press_starts_the_existing_primary_pointer_controller() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<ActualRawContract>())).unwrap();
    app.wait_for("Actual raw schema").unwrap();
    app.press("Actual raw schema").unwrap();
    app.wait_for("text:pointerdown:1 mousedown:1 click:0")
        .unwrap();
}
