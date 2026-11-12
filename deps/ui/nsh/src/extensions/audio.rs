//! Owner-scoped streaming audio; the platform owns loading and decoding.
use super::{raw, raw_style};
use crate::services::resources::{AssetLocation, Resources, validate_asset_link};
use lui_nsh::{app::ApplicationMutations, extensions::ExtensionContext, store::Node};
use nsh_core::{
    audio::{AudioEvent, PlayerSettings},
    element::{AudioPlayer, audio_player},
    prelude::*,
};
use serde_json::json;
use std::{cell::RefCell, collections::BTreeMap, rc::Rc, sync::Arc, task::Poll, time::Duration};

#[derive(Clone, PartialEq, Eq)]
struct Model {
    graph: String,
    source: String,
    file: Option<String>,
    labels: BTreeMap<String, String>,
    disabled: bool,
}
impl Model {
    fn read(node: &Node) -> Result<Self, String> {
        let attrs = raw_style::attrs(node)?;
        let graph = attrs.get("data-asset-graph").cloned().unwrap_or_default();
        let source = attrs.get("src").cloned().unwrap_or_default();
        let file = attrs.get("data-asset-file").cloned();
        validate_asset_link(&graph, &source, file.as_deref())?;
        let labels: BTreeMap<String, String> = serde_json::from_str(
            attrs
                .get("labels")
                .ok_or("native audio requires localized control labels")?,
        )
        .map_err(|error| format!("native audio labels: {error}"))?;
        for key in ["play", "pause", "seek", "volume", "loading"] {
            if labels.get(key).is_none_or(|value| value.is_empty()) {
                return Err(format!("native audio requires its {key} label"));
            }
        }
        if attrs.contains_key("autoplay") {
            return Err("native audio does not autoplay; playback requires user activation".into());
        }
        Ok(Self {
            graph,
            source,
            file,
            labels,
            disabled: attrs.contains_key("disabled"),
        })
    }
    fn location(&self, resources: Resources) -> Option<String> {
        resources
            .asset_link(&self.graph, &self.source, self.file.as_deref())
            .expect("validated native audio source")
            .map(|location| match location {
                AssetLocation::Path(path) => path
                    .to_str()
                    .expect("validated UTF-8 asset path")
                    .to_owned(),
                AssetLocation::Url(url) => url,
            })
    }
}
pub(super) fn validate(node: &Node) -> Result<(), String> {
    Model::read(node).map(|_| ())
}

pub(super) fn element(context: ExtensionContext) -> AnyElement {
    let resources = use_context::<Resources>().expect("native audio resource owner");
    let source = context.clone();
    each(
        move || {
            Model::read(&source.node.get())
                .expect("validated native audio")
                .location(resources)
                .into_iter()
                .collect::<Vec<_>>()
        },
        Clone::clone,
        move |url, _| player(context.clone(), resources, url.get_untracked()),
    )
}

fn player(context: ExtensionContext, resources: Resources, source: String) -> AnyElement {
    let owner = Owner::current();
    let admission = use_context::<ApplicationMutations>().expect("native audio mutation owner");
    let model_context = context.clone();
    let model = computed(move || {
        Arc::new(Model::read(&model_context.node.get()).expect("validated native audio"))
    });
    let handle: Rc<RefCell<Option<AudioPlayer>>> = Rc::new(RefCell::new(Some(audio_player(
        &source,
        PlayerSettings::default(),
    ))));
    let cleanup_handle = handle.clone();
    cleanup(move || {
        cleanup_handle.borrow_mut().take();
    });
    let playing = signal(false);
    let loading = signal(false);
    let position = signal(0.0_f64);
    let duration = signal(0.0_f64);
    let volume = signal(1.0_f64);
    let error = signal(String::new());
    let events = handle.clone();
    spawn(async move {
        while let Some(event) = std::future::poll_fn(|cx| {
            let mut handle = events.borrow_mut();
            handle
                .as_mut()
                .map_or(Poll::Ready(None), |handle| handle.poll_next(cx))
        })
        .await
        {
            if !owner.is_live() {
                return;
            }
            match event {
                AudioEvent::Load { duration: total } => {
                    duration.set(total.map_or(0.0, |d| d.as_secs_f64()));
                    loading.set(false);
                }
                AudioEvent::Playing => {
                    playing.set(true);
                    loading.set(false);
                    error.set(String::new());
                }
                AudioEvent::Paused => playing.set(false),
                AudioEvent::Progress {
                    position: current,
                    duration: total,
                } => {
                    position.set(current.as_secs_f64());
                    duration.set(total.map_or(0.0, |d| d.as_secs_f64()));
                }
                AudioEvent::Buffer { buffering } => loading.set(buffering),
                AudioEvent::Ended => {
                    playing.set(false);
                    loading.set(false);
                }
                AudioEvent::Failed { message, .. } => {
                    playing.set(false);
                    loading.set(false);
                    error.set(message);
                }
                _ => {}
            }
        }
    });
    let guard_context = context.clone();
    let admitted: Rc<dyn Fn() -> bool> = Rc::new(move || {
        if !owner.is_live() || admission.check().is_err() {
            return false;
        }
        let current =
            Model::read(&guard_context.node.get_untracked()).expect("validated native audio");
        !current.disabled
            && current.location(resources).as_deref() == Some(source.as_str())
            && raw::try_emit_dom(&guard_context, owner, "click", json!({}))
    });
    let toggle_handle = handle.clone();
    let toggle_admitted = admitted.clone();
    let toggle = nsh_base::Button::element(nsh_base::ButtonProps {
        disabled: Prop::bind(move || model.get().disabled),
        accessibility_label: Prop::bind(move || {
            Some(
                model.get().labels[if playing.get() { "pause" } else { "play" }]
                    .clone()
                    .into(),
            )
        }),
        ..Default::default()
    })
    .on_event(move |event: &nsh_base::ButtonEvent| {
        if matches!(event, nsh_base::ButtonEvent::Press) && toggle_admitted() {
            if let Some(player) = toggle_handle.borrow().as_ref() {
                if playing.get_untracked() {
                    player.pause();
                } else {
                    if duration.get_untracked() > 0.0
                        && position.get_untracked() >= duration.get_untracked()
                    {
                        player.seek(Duration::ZERO);
                    }
                    loading.set(true);
                    player.play();
                }
            }
        }
    })
    .px_3()
    .py_1()
    .rounded(px(4.0))
    .hover(|style| style.bg(nsh_base::theme().muted))
    .focus_visible(|style| style.outline(px(2.0)).outline_color(nsh_base::theme().ring))
    .child(text(move || if playing.get() { "⏸" } else { "▶" }));
    let seek_handle = handle.clone();
    let seek_admitted = admitted.clone();
    let seek = slider(nsh_base::SliderProps {
        value: Prop::bind(move || Some(nsh_base::SliderValue::Single(position.get()))),
        max: Prop::bind(move || duration.get()),
        step: 0.1.into(),
        disabled: Prop::bind(move || model.get().disabled || duration.get() <= 0.0),
        accessibility_label: Prop::bind(move || Some(model.get().labels["seek"].clone().into())),
        ..Default::default()
    })
    .test_id("native-audio-seek")
    .on_event(move |event: &nsh_base::SliderEvent| {
        if let nsh_base::SliderEvent::Change(value) = event {
            if seek_admitted() {
                if let Some(player) = seek_handle.borrow().as_ref() {
                    player.seek(Duration::from_secs_f64(
                        value.start().clamp(0.0, duration.get_untracked()),
                    ));
                }
            }
        }
    });
    let volume_handle = handle;
    let volume_control = slider(nsh_base::SliderProps {
        value: Prop::bind(move || Some(nsh_base::SliderValue::Single(volume.get()))),
        max: 1.0.into(),
        step: 0.05.into(),
        disabled: Prop::bind(move || model.get().disabled),
        accessibility_label: Prop::bind(move || Some(model.get().labels["volume"].clone().into())),
        ..Default::default()
    })
    .test_id("native-audio-volume")
    .on_event(move |event: &nsh_base::SliderEvent| {
        if let nsh_base::SliderEvent::Change(value) = event {
            if admitted() {
                if let Some(player) = volume_handle.borrow().as_ref() {
                    let next = value.start().clamp(0.0, 1.0);
                    volume.set(next);
                    let mut settings = player.settings();
                    settings.volume = next as f32;
                    player.set_settings(settings);
                }
            }
        }
    });
    let style = context.clone();
    view()
        .element_ref(&context.reference)
        .state_inline_style(move || {
            raw_style::compile(&style.node.get(), "audio", |value| {
                style.resolve_text(value)
            })
            .expect("validated native audio style")
        })
        .flex_col()
        .gap_2()
        .p_2()
        .text_color(move || nsh_base::theme().foreground)
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(toggle)
                .child(seek)
                .child(text(move || {
                    format!("{} / {}", clock(position.get()), clock(duration.get()))
                })),
        )
        .child(volume_control)
        .child(text(move || {
            if loading.get() {
                model.get().labels["loading"].clone()
            } else {
                error.get()
            }
        }))
        .into_element()
}

fn clock(seconds: f64) -> String {
    let seconds = seconds.max(0.0) as u64;
    format!("{}:{:02}", seconds / 60, seconds % 60)
}
fn slider(props: nsh_base::SliderProps) -> ComponentElement<nsh_base::Slider> {
    nsh_base::Slider::element(nsh_base::SliderProps {
        track_class:Some("h-8 justify-center".into()).into(),
        indicator_class:Some("h-1.5 rounded-full bg-muted".into()).into(),
        range_class:Some("rounded-full bg-primary".into()).into(),
        thumb_class:Some("size-4 rounded-full bg-background border border-primary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50".into()).into(),
        ..props
    }).min_w_24().disabled_style(|style|style.opacity(0.5))
}

#[cfg(test)]
mod tests {
    use super::*;
    use lui_nsh::{
        extensions::{Extensions, Profile, Schema},
        render::Renderer,
        wire::Batch,
    };
    use nsh_engine::{EngineConfig, EngineContext, Root};
    use nsh_testing::Headless;
    use std::{
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    struct Wave(PathBuf);
    impl Wave {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "logseq-audio-{}-{}",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            std::fs::create_dir(&root).unwrap();
            // An authored 10ms mono 16-bit PCM WAV, without downloaded media.
            let samples = 80_u32;
            let mut wave = Vec::new();
            wave.extend(b"RIFF");
            wave.extend((36 + samples * 2).to_le_bytes());
            wave.extend(b"WAVEfmt ");
            wave.extend(16_u32.to_le_bytes());
            wave.extend(1_u16.to_le_bytes());
            wave.extend(1_u16.to_le_bytes());
            wave.extend(8000_u32.to_le_bytes());
            wave.extend(16000_u32.to_le_bytes());
            wave.extend(2_u16.to_le_bytes());
            wave.extend(16_u16.to_le_bytes());
            wave.extend(b"data");
            wave.extend((samples * 2).to_le_bytes());
            wave.resize(44 + samples as usize * 2, 0);
            std::fs::write(root.join("owned.wav"), wave).unwrap();
            std::fs::copy(root.join("owned.wav"), root.join("replacement.wav")).unwrap();
            Self(root)
        }
    }
    impl Drop for Wave {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.0).unwrap();
        }
    }
    #[derive(Clone)]
    struct Fixture {
        root: PathBuf,
    }
    fn batch(generation: u64, ops: serde_json::Value) -> Batch {
        Batch::decode(&json!({"generation":generation,"ops":ops}).to_string()).unwrap()
    }
    #[component]
    fn AudioAssets() -> impl IntoElement {
        let fixture = engine_context::<Fixture>().unwrap();
        let resources = Resources::new();
        resources
            .install(
                &json!({"graph":"audio","graph-dir":fixture.root,"asset-dir":fixture.root})
                    .to_string(),
            )
            .unwrap();
        provide_context(resources);
        let held = signal(false);
        provide_context(ApplicationMutations::new(move || {
            if held.get_untracked() {
                Err("held".into())
            } else {
                Ok(())
            }
        }));
        let schemas: Vec<Schema> =
            serde_json::from_str(include_str!("../../schemas.json")).unwrap();
        let fingerprint = schemas
            .iter()
            .find(|schema| schema.identifier == "logseq-audio")
            .unwrap()
            .fingerprint
            .clone();
        let mut builder = Extensions::builder();
        for schema in schemas {
            builder = match schema.identifier.as_str() {
                "logseq-codemirror" => super::super::register_codemirror(builder, schema).unwrap(),
                "logseq-editor" => super::super::register_editor(builder, schema).unwrap(),
                _ => super::super::register_raw(builder, schema).unwrap(),
            };
        }
        let registry = builder
            .freeze(Profile {
                os: "macos".into(),
                host: "nsh".into(),
            })
            .unwrap();
        let renderer = Renderer::with_extensions(registry, |_, _| {});
        let attrs = json!({"data-asset-graph":"audio","data-asset-file":"owned.wav","src":"/stale/owned.wav",
            "controls":"","labels":json!({"play":"Play audio","pause":"Pause audio","seek":"Audio position",
                "volume":"Audio volume","loading":"Loading audio"}).to_string()});
        renderer.apply(batch(1,json!([
            {"op":"create-extension","id":1,"identifier":"logseq-audio","fingerprint":fingerprint},
            {"op":"set-extension-prop","id":1,"property":"attrs","value":attrs.to_string()}
        ]))).unwrap();
        renderer.set_root(1).unwrap();
        let old = renderer.node_snapshot(1).unwrap();
        for invalid in [
            json!({"data-asset-graph":"audio","src":"javascript:alert(1)"}),
            json!({"data-asset-graph":"audio","src":"data:image/png;base64,AAAA"}),
            json!({"data-asset-graph":"audio","data-asset-file":"../outside.wav"}),
            json!({"data-asset-graph":"audio","data-asset-file":"owned.wav","labels":"{}"}),
        ] {
            assert!(renderer.apply(batch(2,json!([{"op":"set-extension-prop","id":1,"property":"attrs","value":invalid.to_string()}]))).is_err());
            assert!(Arc::ptr_eq(&old, &renderer.node_snapshot(1).unwrap()));
        }
        let retire = renderer.clone();
        let disable = renderer.clone();
        let replace = renderer.clone();
        let replacement_attrs = attrs.clone();
        let switched =
            json!({"graph":"different","graph-dir":fixture.root,"asset-dir":fixture.root})
                .to_string();
        view().child(renderer.element())
            .child(nsh_base::button().child(text("Hold audio")).on_press(move ||held.set(true)))
            .child(nsh_base::button().child(text("Release audio")).on_press(move ||held.set(false)))
            .child(nsh_base::button().child(text("Close audio graph")).on_press(move ||
                resources.install(r#"{"graph":"","graph-dir":"","asset-dir":""}"#).unwrap()))
            .child(nsh_base::button().child(text("Switch audio graph")).on_press(move || resources.install(&switched).unwrap()))
            .child(nsh_base::button().child(text("Replace audio source")).on_press(move || {
                let mut attrs=replacement_attrs.clone();attrs["data-asset-file"]=json!("replacement.wav");
                replace.apply(batch(2,json!([{"op":"set-extension-prop","id":1,"property":"attrs","value":attrs.to_string()}]))).unwrap();
            }))
            .child(nsh_base::button().child(text("Retire audio")).on_press(move ||
                retire.apply(batch(3,json!([{"op":"detach-subtree","id":1}]))).unwrap()))
            .child(nsh_base::button().child(text("Disable audio")).on_press(move || {
                let mut attrs=attrs.clone();attrs["disabled"]=json!("");
                disable.apply(batch(2,json!([{"op":"set-extension-prop","id":1,"property":"attrs","value":attrs.to_string()}]))).unwrap();
            })).child(text("audio-ready"))
    }
    #[test]
    fn native_audio_controls_stream_events_and_close_the_owned_player() {
        let wave = Wave::new();
        let start = || {
            let mut config = EngineConfig {
                context: EngineContext::default().with(Fixture {
                    root: wave.0.clone(),
                }),
                ..EngineConfig::new(Root::of::<AudioAssets>())
            };
            // Desktop Tab order includes buttons and slider thumbs; the
            // default phone environment does not enable that traversal.
            config.environment.os = nsh_core::platform::Os::MacOs;
            let mut app = Headless::start(config).unwrap();
            app.wait_for("audio-ready").unwrap();
            app
        };
        let mut app = start();
        let opened = app.audio_calls();
        assert_eq!(
            opened.iter().filter(|call| call.command == "open").count(),
            1
        );
        assert_eq!(opened[0].src, wave.0.join("owned.wav").to_string_lossy());
        assert!(
            !opened.iter().any(|call| call.command == "resume"),
            "mount never autoplays"
        );
        // A Headless press is a touch tap, not a desktop focus request.
        // Begin at the first real Tab stop and activate Play by keyboard so
        // the next Tab reaches the seek thumb, then the volume thumb.
        app.wait_for("label:Play audio").unwrap();
        app.press_key("tab").unwrap();
        app.press_key("space").unwrap();
        app.wait_for("0:00 / 1:00").unwrap();
        assert!(
            app.audio_calls()
                .iter()
                .any(|call| call.command == "resume")
        );
        app.press_key("tab").unwrap();
        app.press_key("right").unwrap();
        assert!(app.audio_calls().iter().any(
            |call| call.command == "seek" && call.position == Some(Duration::from_millis(100))
        ));
        app.press_key("tab").unwrap();
        app.press_key("left").unwrap();
        assert!(
            app.audio_calls()
                .iter()
                .any(|call| call.command == "set" && call.volume == Some(0.95))
        );
        app.press("label:Pause audio").unwrap();
        assert!(app.audio_calls().iter().any(|call| call.command == "pause"));
        let count = app.audio_calls().len();
        app.press("Hold audio").unwrap();
        app.press("label:Play audio").unwrap();
        assert_eq!(
            app.audio_calls().len(),
            count,
            "held application cannot resume audio"
        );
        app.press("Release audio").unwrap();
        app.press("label:Play audio").unwrap();
        app.end_audio().unwrap();
        app.wait_for("1:00 / 1:00").unwrap();
        app.press("Close audio graph").unwrap();
        assert_eq!(
            app.audio_calls()
                .iter()
                .filter(|call| call.command == "close")
                .count(),
            1
        );
        assert!(!app.shows("label:Play audio"));
        let mut app = start();
        app.press("Disable audio").unwrap();
        let _ = app.press("label:Play audio");
        assert!(
            !app.audio_calls()
                .iter()
                .any(|call| call.command == "resume")
        );
        app.press("Retire audio").unwrap();
        assert_eq!(
            app.audio_calls()
                .iter()
                .filter(|call| call.command == "close")
                .count(),
            1
        );
        let mut app = start();
        app.press("Replace audio source").unwrap();
        let calls = app.audio_calls();
        assert_eq!(
            calls.iter().filter(|call| call.command == "close").count(),
            1
        );
        assert_eq!(
            calls.iter().filter(|call| call.command == "open").count(),
            2
        );
        assert_eq!(
            calls
                .iter()
                .rfind(|call| call.command == "open")
                .unwrap()
                .src,
            wave.0.join("replacement.wav").to_string_lossy()
        );
        assert!(!calls.iter().any(|call| call.command == "resume"));
        let mut app = start();
        app.press("Switch audio graph").unwrap();
        assert_eq!(
            app.audio_calls()
                .iter()
                .filter(|call| call.command == "close")
                .count(),
            1
        );
    }
}
