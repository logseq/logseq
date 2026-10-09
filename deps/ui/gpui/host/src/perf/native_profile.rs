//! Opt-in CPU frame benchmark of the linked native app, without a display.

use gpui_kit::component::Root;
use gpui_kit::gpui::{point, px, size, AppContext, Keystroke, Modifiers, VisualTestContext};
use lui_core::bridge;
use lui_gpui::{LuiRootView, LuiShared, Shared};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::time::{Duration, Instant};

extern "C" {
    fn lui_ocaml_stop() -> i32;
    fn caml_c_thread_unregister() -> i32;
}

struct NativePump {
    stop: Arc<AtomicBool>,
    thread: Option<std::thread::JoinHandle<()>>,
}

impl NativePump {
    fn start() -> Self {
        let stop = Arc::new(AtomicBool::new(false));
        let stopped = stop.clone();
        let thread = std::thread::spawn(move || {
            assert_ne!(unsafe { crate::lui_ocaml_register_current_thread() }, 0);
            while !stopped.load(Ordering::Acquire) {
                let _ = crate::pump_rx().recv_timeout(Duration::from_millis(16));
                if stopped.load(Ordering::Acquire) {
                    break;
                }
                assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
            }
            assert_ne!(unsafe { caml_c_thread_unregister() }, 0);
        });
        Self {
            stop,
            thread: Some(thread),
        }
    }
}

impl Drop for NativePump {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
        crate::request_pump();
        self.thread
            .take()
            .unwrap()
            .join()
            .expect("the native pump must shut down");
    }
}

fn current_editor(shared: &Shared) -> Option<i64> {
    shared
        .borrow()
        .store
        .nodes
        .values()
        .find(|node| {
            matches!(&node.identity, lui_core::store::NodeIdentity::Extension { identifier, .. }
            if identifier == "logseq-editor")
        })
        .map(|node| node.id)
}

fn assert_current_caret(cx: &mut VisualTestContext, shared: &Shared, text: &str, offset: usize) {
    cx.update(|window, _| {
        let guard = shared.borrow();
        let editor = current_editor(shared).expect("typing must keep the editor mounted");
        let sink = guard.store.node(editor).unwrap();
        assert_eq!(
            sink.extension_props
                .get("caret")
                .and_then(lui_core::wire::Value::as_int),
            Some(offset as i64)
        );
        let container = sink.parent.unwrap();
        let run = guard
            .store
            .nodes
            .values()
            .find(|node| {
                if node.string_prop(lui_core::Property::TextValue) != Some(text) {
                    return false;
                }
                let mut parent = node.parent;
                while let Some(id) = parent {
                    if id == container {
                        return true;
                    }
                    parent = guard.store.node(id).and_then(|node| node.parent);
                }
                false
            })
            .expect("the entered text must be rendered inside the editor");
        let glyph = guard.text_layouts[&run.id]
            .position_for_index(offset)
            .unwrap();
        let scale = window.scale_factor();
        assert!(
            window
                .painted_quads()
                .iter()
                .any(|quad| (quad.bounds.size.width.0 - 2. * scale).abs() < 0.1
                    && (quad.bounds.origin.x.0 - f32::from(glyph.x) * scale).abs() <= 0.51
                    && (quad.bounds.origin.y.0 - f32::from(glyph.y) * scale).abs() <= 0.51),
            "the native caret must paint at the current glyph for {text:?} byte {offset}"
        );
    });
}

fn dispatch_key(cx: &mut VisualTestContext, key: &str) {
    cx.update(|window, app| {
        window.dispatch_keystroke(Keystroke::parse(key).unwrap(), app);
        window.draw(app).clear(app);
    });
}

fn pump_and_draw(cx: &mut VisualTestContext, shared: &Shared) {
    cx.update(|window, app| {
        assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
        crate::pump_tick(shared, window, app);
        window.draw(app).clear(app);
    });
}

fn draw_samples(cx: &mut VisualTestContext, shared: &Shared, label: &str) -> f64 {
    let sample_count = std::env::var("LOGSEQ_GPUI_PROFILE_SAMPLES")
        .map(|value| {
            value
                .parse::<usize>()
                .expect("profile samples must be an integer")
        })
        .unwrap_or(120);
    assert!(sample_count > 0);
    let mut samples = Vec::with_capacity(sample_count);
    for step in 0..sample_count + 10 {
        let elapsed = cx.update(|window, app| {
            // The same full invalidation is used for both builds. Retained
            // leaf caches remain active; this exercises the container tree.
            let guard = shared.borrow();
            let root = guard
                .store
                .root
                .expect("the native root must remain mounted");
            app.notify(guard.views[&root].entity_id());
            drop(guard);
            let started = Instant::now();
            window.draw(app).clear(app);
            started.elapsed().as_secs_f64() * 1000.
        });
        if step >= 10 {
            samples.push(elapsed);
        }
    }
    samples.sort_by(f64::total_cmp);
    let median = samples[samples.len() / 2];
    let p95 = samples[samples.len() * 95 / 100];
    eprintln!(
        "NATIVE_FRAME_BENCH {label} nodes={} samples={} median_ms={median:.3} p95_ms={p95:.3}",
        shared.borrow().store.nodes.len(),
        samples.len()
    );
    p95
}

#[gpui_kit::test]
#[ignore = "Requires a populated graph and an isolated LOGSEQ_UI_STATE_DIR"]
fn native_journal_and_settings_frame_budget(cx: &mut gpui_kit::TestAppContext) {
    assert!(
        std::env::var_os("LOGSEQ_UI_STATE_DIR").is_some(),
        "use an isolated UI state directory for the benchmark"
    );
    assert!(
        std::env::var_os("LOGSEQ_ROOT_DIR").is_some(),
        "use an isolated graph snapshot for the benchmark"
    );
    cx.update(crate::init_theme);
    let shared = LuiShared::new();
    crate::editor::register(&shared);
    crate::logseq_ext::register(&shared);
    let accepted = unsafe {
        crate::lui_ocaml_start(
            Some(crate::patch_sink_cb),
            Some(crate::wakeup_cb),
            Some(crate::platform_request_cb),
            bridge::current_os(),
            bridge::HOST_GPUI,
            std::ptr::null(),
            0,
        )
    };
    assert_ne!(accepted, 0);
    // Production drains worker completions independently of UI frames.
    // A serialized test pump adds a whole draw to every RPC in a chain.
    let serial_pump = std::env::var_os("LOGSEQ_GPUI_PROFILE_SERIAL_PUMP").is_some();
    let pump = (!serial_pump).then(NativePump::start);
    eprintln!("NATIVE_PROFILE serial_pump={serial_pump}");
    let fixture = shared.clone();
    let (_, cx) = cx.add_window_view(move |window, cx| {
        crate::drain_patches(&fixture, cx);
        let root = unsafe { bridge::lui_ocaml_root_node() };
        assert!(root > 0 && fixture.borrow().store.node(root).is_some());
        fixture.borrow_mut().store.root = Some(root);
        let view = cx.new(|_| LuiRootView::new(fixture));
        Root::new(view, window, cx)
    });
    cx.simulate_resize(size(px(1280.), px(840.)));
    cx.simulate_scale_factor_change(2.);
    let deadline = Instant::now() + Duration::from_secs(15);
    loop {
        cx.update(|window, app| {
            assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
            crate::pump_tick(&shared, window, app);
            window.draw(app).clear(app);
        });
        if shared
            .borrow()
            .store
            .nodes
            .values()
            .filter(|node| {
                node.string_prop(lui_core::Property::StyleClass)
                    .or_else(|| {
                        node.extension_props
                            .get("style-class")
                            .and_then(lui_core::wire::Value::as_str)
                    })
                    .is_some_and(|classes| {
                        classes.split_whitespace().any(|class| class == "ls-block")
                    })
            })
            .count()
            >= 20
        {
            break;
        }
        if Instant::now() >= deadline {
            let guard = shared.borrow();
            let classes: Vec<_> = guard
                .store
                .nodes
                .values()
                .filter_map(|node| {
                    node.string_prop(lui_core::Property::StyleClass)
                        .or_else(|| {
                            node.extension_props
                                .get("style-class")
                                .and_then(lui_core::wire::Value::as_str)
                        })
                })
                .collect();
            panic!("the populated journal did not mount: nodes={} views={} bounds={} classes={classes:?}",
                guard.store.nodes.len(), guard.views.len(), guard.node_bounds.len());
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    // Let initial queries and font/layout caches finish before measurement.
    for _ in 0..25 {
        cx.update(|window, app| {
            assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
            crate::pump_tick(&shared, window, app);
            window.draw(app).clear(app);
        });
        std::thread::sleep(Duration::from_millis(20));
    }
    assert!(shared.borrow().last_errors.is_empty());
    let journal = draw_samples(cx, &shared, "journal");
    let settings = "menu-open-settings\n{}";
    let opened = Instant::now();
    cx.update(|window, app| {
        assert_ne!(
            unsafe {
                crate::lui_ocaml_platform_event(settings.as_ptr().cast(), settings.len() as i32)
            },
            0
        );
        assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
        crate::pump_tick(&shared, window, app);
    });
    assert!(shared.borrow().store.nodes.values().any(|node| node
        .string_prop(lui_core::Property::StyleClass)
        .is_some_and(|classes| classes
            .split_whitespace()
            .any(|class| class == "ls-dialog-layer"))));
    cx.update(|window, app| {
        window.draw(app).clear(app);
    });
    eprintln!(
        "NATIVE_DIALOG_BENCH settings_to_first_draw_ms={:.3}",
        opened.elapsed().as_secs_f64() * 1000.
    );
    let settings = draw_samples(cx, &shared, "settings");
    let layer = shared
        .borrow()
        .store
        .nodes
        .values()
        .find(|node| {
            node.string_prop(lui_core::Property::StyleClass)
                .is_some_and(|classes| {
                    classes
                        .split_whitespace()
                        .any(|class| class == "ls-dialog-layer")
                })
        })
        .unwrap()
        .id;
    cx.update(|window, app| {
        assert_ne!(unsafe { bridge::lui_ocaml_dismiss(layer) }, 0);
        crate::pump_tick(&shared, window, app);
        window.draw(app).clear(app);
    });
    let position = {
        let guard = shared.borrow();
        guard
            .store
            .nodes
            .values()
            .filter(|node| {
                node.string_prop(lui_core::Property::StyleClass) == Some("block-content inline")
            })
            .filter_map(|node| guard.node_bounds.get(&node.id))
            .find(|bounds| {
                bounds.size.height > px(0.)
                    && bounds.origin.y > px(100.)
                    && bounds.bottom() < px(800.)
            })
            .map(|bounds| {
                point(
                    bounds.origin.x + px(8.),
                    bounds.origin.y + bounds.size.height / 2.,
                )
            })
            .expect("a populated visible block must be available for input profiling")
    };
    let clicked = Instant::now();
    cx.simulate_click(position, Modifiers::none());
    let deadline = Instant::now() + Duration::from_secs(2);
    while current_editor(&shared).is_none() {
        cx.update(|window, app| {
            assert_ne!(unsafe { crate::lui_ocaml_pump() }, 0);
            crate::pump_tick(&shared, window, app);
            window.draw(app).clear(app);
        });
        assert!(
            Instant::now() < deadline,
            "clicking the block must mount its editor"
        );
        std::thread::sleep(Duration::from_millis(2));
    }
    eprintln!(
        "NATIVE_INPUT_BENCH click_to_editor_ms={:.3}",
        clicked.elapsed().as_secs_f64() * 1000.
    );
    dispatch_key(cx, "cmd-a");
    for (input, text) in [("g", "g"), ("o", "go"), ("o", "goo"), ("d", "good")] {
        let started = Instant::now();
        dispatch_key(cx, input);
        assert_current_caret(cx, &shared, text, text.len());
        eprintln!(
            "NATIVE_INPUT_BENCH input={input} dispatch_and_draw_ms={:.3}",
            started.elapsed().as_secs_f64() * 1000.
        );
    }
    for (key, text, offset) in [
        ("left", "good", 3),
        ("left", "good", 2),
        ("right", "good", 3),
        ("right", "good", 4),
        ("backspace", "goo", 3),
        ("home", "goo", 0),
        ("delete", "oo", 0),
        ("end", "oo", 2),
    ] {
        let started = Instant::now();
        dispatch_key(cx, key);
        assert_current_caret(cx, &shared, text, offset);
        eprintln!(
            "NATIVE_INPUT_BENCH key={key} dispatch_and_draw_ms={:.3}",
            started.elapsed().as_secs_f64() * 1000.
        );
    }
    let previous = current_editor(&shared).unwrap();
    let started = Instant::now();
    dispatch_key(cx, "enter");
    let deadline = Instant::now() + Duration::from_secs(2);
    while current_editor(&shared).is_none_or(|editor| editor == previous) {
        pump_and_draw(cx, &shared);
        assert!(
            Instant::now() < deadline,
            "Enter must mount the new block editor"
        );
        std::thread::sleep(Duration::from_millis(2));
    }
    eprintln!(
        "NATIVE_INPUT_BENCH enter_to_editor_ms={:.3}",
        started.elapsed().as_secs_f64() * 1000.
    );
    for (key, text) in [
        ("/", "/"),
        ("t", "/t"),
        ("o", "/to"),
        ("d", "/tod"),
        ("o", "/todo"),
    ] {
        dispatch_key(cx, key);
        assert_current_caret(cx, &shared, text, text.len());
    }
    let (row, task_uuid) = {
        let guard = shared.borrow();
        let mut id = current_editor(&shared).unwrap();
        let uuid = guard.store.node(id).unwrap().extension_props["block-id"]
            .as_str()
            .unwrap()
            .to_owned();
        loop {
            let node = guard.store.node(id).unwrap();
            if node
                .string_prop(lui_core::Property::AccessibilityIdentifier)
                .is_some_and(|name| name.starts_with("ls-block-"))
            {
                break (id, uuid);
            }
            id = node.parent.expect("the editor must belong to a block row");
        }
    };
    let started = Instant::now();
    dispatch_key(cx, "enter");
    let deadline = Instant::now() + Duration::from_secs(2);
    let mut first_tag = None;
    let mut first_icon = None;
    loop {
        pump_and_draw(cx, &shared);
        let (icon, tag) = {
            let guard = shared.borrow();
            let descendants: Vec<_> = guard
                .store
                .nodes
                .values()
                .filter(|node| {
                    let mut parent = node.parent;
                    while let Some(id) = parent {
                        if id == row {
                            return true;
                        }
                        parent = guard.store.node(id).and_then(|node| node.parent);
                    }
                    false
                })
                .collect();
            (
                descendants
                    .iter()
                    .any(|node| node.string_prop(lui_core::Property::IconName) == Some("app:todo")),
                descendants
                    .iter()
                    .any(|node| node.string_prop(lui_core::Property::TextValue) == Some("Task")),
            )
        };
        if icon && first_icon.is_none() {
            first_icon = Some(started.elapsed().as_secs_f64() * 1000.);
        }
        if tag && first_tag.is_none() {
            first_tag = Some(started.elapsed().as_secs_f64() * 1000.);
        }
        if icon && tag {
            break;
        }
        assert!(
            Instant::now() < deadline,
            "/todo must publish its Task tag and Todo status icon"
        );
        std::thread::sleep(Duration::from_millis(2));
    }
    let task_ms = started.elapsed().as_secs_f64() * 1000.;
    eprintln!(
        "NATIVE_INPUT_BENCH todo_to_tag_and_icon_ms={task_ms:.3} tag_ms={:.3} icon_ms={:.3}",
        first_tag.unwrap(),
        first_icon.unwrap()
    );
    let editing_uuid = {
        let guard = shared.borrow();
        current_editor(&shared)
            .and_then(|id| guard.store.node(id))
            .map(|node| {
                node.extension_props["block-id"]
                    .as_str()
                    .unwrap()
                    .to_owned()
            })
    };
    drop(pump);
    cx.update(|window, app| {
        assert_ne!(unsafe { lui_ocaml_stop() }, 0);
        crate::pump_tick(&shared, window, app);
    });
    assert!(shared.borrow().store.nodes.is_empty());
    assert_eq!(
        editing_uuid,
        Some(task_uuid),
        "autocomplete Enter must apply the task command without also splitting the block"
    );
    // Serial mode deliberately stalls worker completions during each draw
    // to exercise autocomplete while the preceding Enter is still pending.
    // Only the production pump mode is an interaction latency benchmark.
    if !serial_pump {
        assert!(
            task_ms < 100.,
            "explicit task commands must publish their tag and icon within 100ms: {task_ms:.3}ms"
        );
    }
    assert!(journal < 16.7 && settings < 16.7,
        "full redraw must fit a 60 Hz CPU frame budget: journal={journal:.3}ms settings={settings:.3}ms");
}
