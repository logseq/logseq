use super::*;
use nsh_engine::{EngineConfig, EngineContext, Root};
use nsh_testing::Headless;
use serde_json::json;
use std::{
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

fn context(graph: &str, base: &Path) -> String {
    json!({"graph":graph,"graph-dir":base,"asset-dir":base.join("stored-assets")}).to_string()
}
fn resolved(graph: &Graph, source: &str, asset: Option<&str>) -> String {
    graph.resolve(classify(source, asset).unwrap()).unwrap()
}

#[test]
fn published_asset_roots_and_encoded_names_have_one_resolution_policy() {
    let root = std::env::temp_dir().join("logseq-image-policy");
    let graph = Graph::parse(&context("graph A", &root)).unwrap().unwrap();
    let asset = root
        .join("stored-assets")
        .join("图 image.png")
        .to_string_lossy()
        .into_owned();
    for source in [
        "assets/图%20image.png",
        "./assets/%E5%9B%BE%20image.png",
        "../assets/图 image.png",
    ] {
        assert_eq!(resolved(&graph, source, None), asset);
    }
    assert_eq!(
        resolved(&graph, "notes/./image.png", None),
        root.join("notes").join("image.png").to_string_lossy()
    );
    assert_eq!(
        resolved(&graph, "notes/a/../image.png", None),
        root.join("notes").join("image.png").to_string_lossy()
    );
    assert_eq!(
        resolved(&graph, "/stale/other-graph.png", Some("图 image.png")),
        asset
    );
    for source in [
        "https://example.invalid/a.png",
        "data:image/png;base64,AAAA",
    ] {
        assert_eq!(resolved(&graph, source, None), source);
    }
}

#[cfg(target_os = "windows")]
#[test]
fn windows_absolute_and_rooted_only_paths_remain_distinct() {
    let absolute = r"C:\Graph files\图 image.png";
    assert!(validate_source(absolute, None).is_ok());
    let graph = Graph::parse(&context("windows", Path::new(r"C:\Graph files")))
        .unwrap()
        .unwrap();
    assert_eq!(resolved(&graph, absolute, None), absolute);
    for source in [
        r"C:image.png",
        r"\Graph files\image.png",
        "/Graph/image.png",
    ] {
        assert!(validate_source(source, None).is_err(), "{source}");
        assert!(Graph::parse(&context("windows", Path::new(source))).is_err());
    }
}

#[test]
fn source_admission_rejects_escape_and_foreign_schemes_before_graph_lookup() {
    for source in [
        "../../other.png",
        "../assets/../../other.png",
        "assets/%2e%2e/%2e%2e/other.png",
        "assets/%2fother.png",
        "assets/x%5cy.png",
        "assets/x%00.png",
        "assets/%xy.png",
        "../outside.png",
        "notes/image.png?query",
        "notes/image.png#fragment",
        "//other/image.png",
        "javascript:alert(1)",
        "https://user:secret@example.invalid/a.png",
        "file://other-host/tmp/image.png",
        "data:text/plain;base64,AAAA",
    ] {
        assert!(validate_source(source, None).is_err(), "{source}");
    }
    for filename in [
        ".",
        "..",
        "../image.png",
        "sub/image.png",
        "sub\\image.png",
        "x\0.png",
    ] {
        assert!(
            validate_source("https://example.invalid/a.png", Some(filename)).is_err(),
            "{filename:?}"
        );
    }
    for metadata in [
        json!({}),
        json!({"graph":"x","graph-dir":"relative","asset-dir":"relative"}),
        json!({"graph":"","graph-dir":"retained","asset-dir":""}),
        json!({"graph":"","graph-dir":"","asset-dir":"","unused":"field"}),
    ] {
        assert!(Graph::parse(&metadata.to_string()).is_err(), "{metadata}");
    }
    assert!(
        Graph::parse(r#"{"graph":"","graph-dir":"","asset-dir":""}"#)
            .unwrap()
            .is_none()
    );
}

#[derive(Clone)]
struct Fixture {
    first: PathBuf,
    second: PathBuf,
    seen: Arc<Mutex<Vec<u8>>>,
}
#[component]
fn GraphSwitch() -> impl IntoElement {
    let fixture = engine_context::<Fixture>().unwrap();
    let resources = Resources::new();
    resources
        .install(&context("first", &fixture.first))
        .unwrap();
    let phase = signal(0_u8);
    let replacement = context("second", &fixture.second);
    on_key_with(
        "f2",
        KeyOptions {
            when: nsh_core::keymap::When::Always,
            ..Default::default()
        },
        move |_| {
            batch(|| {
                resources.install(&replacement).unwrap();
                phase.set(1);
            });
        },
    );
    on_key_with(
        "f3",
        KeyOptions {
            when: nsh_core::keymap::When::Always,
            ..Default::default()
        },
        move |_| {
            batch(|| {
                resources
                    .install(r#"{"graph":"","graph-dir":"","asset-dir":""}"#)
                    .unwrap();
                phase.set(2);
            });
        },
    );
    let first = fixture
        .first
        .join("stored-assets")
        .join("same.png")
        .to_string_lossy()
        .into_owned();
    let second = fixture
        .second
        .join("stored-assets")
        .join("same.png")
        .to_string_lossy()
        .into_owned();
    let seen = fixture.seen.clone();
    view()
        .child(
            image(move || {
                let actual = resources
                    .source("/stale-graph/same.png", Some("same.png"))
                    .unwrap();
                let phase = phase.get();
                let expected = match phase {
                    0 => first.as_str(),
                    1 => second.as_str(),
                    2 => "",
                    _ => unreachable!(),
                };
                assert_eq!(actual, ImageSrc::from(expected.to_owned()));
                assert_eq!(actual.is_empty(), phase == 2);
                seen.lock().unwrap().push(phase);
                actual
            })
            .w(px(40.0))
            .h(px(40.0))
            .test_id("owned-image"),
        )
        .child(text(move || format!("phase {}", phase.get())))
}

#[test]
fn graph_switch_and_close_update_the_existing_native_image_source() {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let root = std::env::temp_dir().join(format!(
        "logseq-graph-images-{}-{nonce}",
        std::process::id()
    ));
    let fixture = Fixture {
        first: root.join("graph-a"),
        second: root.join("graph-b"),
        seen: Arc::new(Mutex::new(Vec::new())),
    };
    let logo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../resources/img/logo.png");
    for graph in [&fixture.first, &fixture.second] {
        std::fs::create_dir_all(graph.join("stored-assets")).unwrap();
        std::fs::copy(&logo, graph.join("stored-assets").join("same.png")).unwrap();
    }
    let mut config = EngineConfig::new(Root::of::<GraphSwitch>());
    config.context = EngineContext::default().with(fixture.clone());
    let mut app = Headless::start(config).unwrap();
    app.wait_for("phase 0").unwrap();
    let identity = |app: &Headless| {
        app.screen()
            .layout_nodes()
            .into_iter()
            .find(|node| node.test_id.as_deref() == Some("owned-image"))
            .unwrap()
            .id
    };
    let image = identity(&app);
    app.press_key("f2").unwrap();
    assert!(app.screen().shows("phase 1"));
    assert_eq!(identity(&app), image);
    app.press_key("f3").unwrap();
    assert!(app.screen().shows("phase 2"));
    assert_eq!(identity(&app), image);
    let mut phases = fixture.seen.lock().unwrap().clone();
    phases.dedup();
    assert_eq!(phases, [0, 1, 2]);
    drop(app);
    std::fs::remove_dir_all(root).unwrap();
}
