#![recursion_limit = "256"]
//! Logseq deps/ui GPUI host: embeds the OCaml app (`logseq_ui_gpui`,
//! linked as `native_embed.exe.o` via the logseq C bridge) inside a
//! gpui-kit window, rendered by the shared `lui-gpui` node-view engine.
//!
//! OCaml: `cd deps/ui && opam exec --switch=5.5.0 -- dune build gpui/native_embed.exe.o`
//! Host:  `cd deps/ui/gpui/host && cargo run`
//!
//! Env: LOGSEQ_GPUI_PLATFORM overrides the OS code (default: build host),
//! LOGSEQ_GPUI_HOST overrides the host code (default 6 = GPUIHost).

use std::os::raw::{c_char, c_int};
use std::sync::Mutex;
use std::time::Instant;

mod editor;
mod logseq_ext;

use gpui_kit::component::Root;
use gpui_kit::gpui::{point, px, size, Bounds, WindowBounds, WindowOptions};
use gpui_kit::*;
use lui_core::bridge;
use lui_gpui::{apply_batch_json, LuiRootView, LuiShared, Shared};

static BOOT_T0: std::sync::OnceLock<Instant> = std::sync::OnceLock::new();

fn boot_ms() -> f64 {
    BOOT_T0.get_or_init(Instant::now).elapsed().as_secs_f64() * 1000.0
}

/// The logseq bridge's patch callback emits `[batch, batch, …]` — the
/// accumulated queue joined as one JSON array (native_embed's
/// take_patches) — while lui-gpui's drain_pending expects one batch
/// object per string. Unwrap the array and apply each batch in order.
fn drain_patches(shared: &Shared, cx: &mut gpui_kit::gpui::App) {
    let dump = std::env::var("LOGSEQ_GPUI_DUMP_PATCHES").is_ok();
    for json in bridge::take_patches() {
        if dump {
            use std::io::Write;
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("/tmp/gpui-patches.jsonl")
            {
                let _ = f.write_all(json.as_bytes());
                let _ = f.write_all(b"\n");
            }
            eprintln!("logseq-gpui: dumped patch to /tmp/gpui-patches.jsonl");
        }
        let batches: Vec<String> = match serde_json::from_str(&json) {
            Ok(serde_json::Value::Array(items)) => items
                .into_iter()
                .map(|item| item.to_string())
                .collect(),
            _ => vec![json],
        };
        for batch in batches {
            if std::env::var("LOGSEQ_PERF").is_ok() {
                eprintln!(
                    "logseq-gpui: apply batch {} bytes t={:.1}ms",
                    batch.len(),
                    boot_ms()
                );
            }
            let t = Instant::now();
            if let Err(error) = apply_batch_json(shared, &batch, cx) {
                let message = error.to_string();
                eprintln!("logseq-gpui: rejected batch: {message}");
                shared.borrow_mut().last_errors.push(message);
            }
            if std::env::var("LOGSEQ_PERF").is_ok() {
                eprintln!(
                    "logseq-gpui: applied batch t={:.1}ms (+{:.1})",
                    boot_ms(),
                    t.elapsed().as_secs_f64() * 1000.0
                );
            }
        }
    }
}

// logseq_lui_bridge ABI — a superset of the gallery bridge: extra
// wakeup + platform_request callbacks and pump/platform_event entries.
// `lui_ocaml_start` takes the *logseq* signature here; lui-core's
// `bridge::start` (gallery arity) must not be used against this lib.
extern "C" {
    fn lui_ocaml_start(
        patch: Option<unsafe extern "C" fn(*const c_char)>,
        wakeup: Option<unsafe extern "C" fn()>,
        platform_request: Option<unsafe extern "C" fn(*const c_char, c_int)>,
        platform_code: c_int,
        host_code: c_int,
        payload: *const c_char,
        payload_length: c_int,
    ) -> c_int;
    fn lui_ocaml_pump() -> c_int;
    fn lui_ocaml_platform_event(data: *const c_char, length: c_int) -> c_int;
    fn lui_ocaml_register_current_thread() -> c_int;
}

/// Async completions run on OCaml worker systhreads; wakeup is the "go
/// drain the mailbox" poke. The bridge forbids calling back into OCaml
/// here, so just flag it — the dedicated pump thread does the rest.
///
/// The OCaml mailbox is drained on its own Rust thread, not the UI
/// thread: the pump calls `lui_ocaml_pump` whose C entry acquires the
/// OCaml domain lock, so UI frames (first paint, typing bursts) can
/// never starve OCaml progress. wakeup_cb posts into this channel; a
/// 16ms timeout keeps the periodic app clock (`Lui_app.flush` emits
/// boot progress even with an empty mailbox).
static PUMP_CH: std::sync::OnceLock<(
    flume::Sender<()>,
    flume::Receiver<()>,
)> = std::sync::OnceLock::new();

fn pump_tx() -> &'static flume::Sender<()> {
    &PUMP_CH.get_or_init(flume::unbounded).0
}

fn pump_rx() -> &'static flume::Receiver<()> {
    &PUMP_CH.get_or_init(flume::unbounded).1
}

fn request_pump() {
    let _ = pump_tx().send(());
}

unsafe extern "C" fn wakeup_cb() {
    request_pump();
}

/// "name\npayload" envelopes queued by OCaml (dom-op, clipboard,
/// open-url, ui-state, …). Drained on the UI thread by `pump_tick`.
static PENDING_REQUESTS: Mutex<Vec<String>> = Mutex::new(Vec::new());

unsafe extern "C" fn platform_request_cb(data: *const c_char, length: c_int) {
    if data.is_null() || length <= 0 {
        return;
    }
    let bytes =
        unsafe { std::slice::from_raw_parts(data.cast::<u8>(), length as usize) };
    if let Ok(text) = std::str::from_utf8(bytes) {
        if let Ok(mut queue) = PENDING_REQUESTS.lock() {
            queue.push(text.to_owned());
        }
        // requests can arrive from OCaml worker threads — wake the pump
        request_pump();
    }
}

/// Service one platform-request envelope. `dom-op` ops go through
/// `lui_gpui::domops` (measure/scroll/focus/dump on the rendered tree);
/// replies (e.g. `node-rect`) are fed back into OCaml as
/// `lui_ocaml_platform_event("name\njson")` envelopes.
fn handle_platform_request(
    envelope: &str,
    shared: &Shared,
    window: &mut gpui_kit::gpui::Window,
    cx: &mut gpui_kit::gpui::App,
) {
    let Some((name, payload)) = envelope.split_once('\n') else {
        eprintln!("logseq-gpui: malformed platform request: {envelope:?}");
        return;
    };
    match name {
        "dom-op" => {
            if let Some((op, body)) = payload.split_once('\n') {
                // The logseq-editor conduit claims its ops first
                // (caret-rect/offset-at/line-ranges/scroll-height/
                // set-input-focus); everything else goes to the generic
                // dom-op handler. The live window is passed down: during
                // this frame callback `cx.windows()` handles cannot be
                // re-entered, so ops needing a Window must use this one.
                let replies = editor::handle_dom_op(op, body, shared, window, cx)
                    .unwrap_or_else(|| {
                        lui_gpui::domops::handle_dom_op(shared, op, body, window, cx)
                    });
                for (name, json) in replies {
                    let envelope = format!("{name}\n{json}");
                    unsafe {
                        lui_ocaml_platform_event(
                            envelope.as_ptr().cast::<c_char>(),
                            envelope.len() as c_int,
                        )
                    };
                }
            }
        }
        "clipboard" => {
            cx.write_to_clipboard(gpui_kit::gpui::ClipboardItem::new_string(
                payload.to_owned(),
            ));
        }
        "open-url" => cx.open_url(payload),
        "ui-state" => {
            // {"lang","root-classes","body-classes","data":{"theme":..}}
            // — the host-facing bit is the app-chosen light/dark mode:
            // apply it through Theme::change so every window repaints.
            let dark = serde_json::from_str::<serde_json::Value>(payload)
                .ok()
                .and_then(|json| {
                    json.pointer("/data/theme")
                        .and_then(serde_json::Value::as_str)
                        .map(|theme| theme == "dark")
                        .or_else(|| {
                            json.get("body-classes")
                                .and_then(serde_json::Value::as_str)
                                .map(|classes| classes.contains("dark-theme"))
                        })
                });
            if let Some(dark) = dark {
                use gpui_kit::component::theme::{Theme, ThemeRegistry};
                // The frame-1 preset seeds `Theme::from(ThemeColor::light())`
                // with empty mode configs; `Theme::change` then applies an
                // empty `ThemeConfig` (whose default mode snaps the theme
                // back to light) instead of a real palette. Populate both
                // configs from the registry once it exists.
                if Theme::global(cx).dark_theme.name.is_empty()
                    || Theme::global(cx).light_theme.name.is_empty()
                {
                    let (light_cfg, dark_cfg) = {
                        let registry = ThemeRegistry::global(cx);
                        (
                            registry.default_light_theme().clone(),
                            registry.default_dark_theme().clone(),
                        )
                    };
                    Theme::update(cx, |theme| {
                        theme.light_theme = light_cfg;
                        theme.dark_theme = dark_cfg;
                    });
                }
                let mode = if dark {
                    gpui_kit::component::theme::ThemeMode::Dark
                } else {
                    gpui_kit::component::theme::ThemeMode::Light
                };
                Theme::change(mode, Some(window), cx);
            }
        }
        other => eprintln!("logseq-gpui: platform request {other}: {payload}"),
    }
}

/// Last viewport size pushed to OCaml as a `window-size` platform event —
/// `Host.set_window_size` feeds `Web_dom.win_inner_*`, which the emitters
/// use to anchor window-edge popups (help menu) and clamp popup flips.
static LAST_WIN_SIZE: Mutex<(f32, f32)> = Mutex::new((0., 0.));

fn push_window_size(window: &gpui_kit::gpui::Window) {
    let size = window.viewport_size();
    let w = f32::from(size.width);
    let h = f32::from(size.height);
    let mut last = match LAST_WIN_SIZE.lock() {
        Ok(g) => g,
        Err(e) => e.into_inner(),
    };
    if last.0 != w || last.1 != h {
        *last = (w, h);
        let envelope = format!("window-size\n{{\"width\":{w},\"height\":{h}}}");
        eprintln!("[win-size] push {envelope:?}");
        let r = unsafe {
            lui_ocaml_platform_event(envelope.as_ptr().cast::<c_char>(), envelope.len() as c_int)
        };
        eprintln!("[win-size] result={r}");
    }
}

/// UI-side tick: apply queued patches and service platform requests.
/// The OCaml mailbox itself is pumped on the dedicated pump thread, so
/// this stays light even while OCaml is mid-flush.
/// Host -> OCaml environment pushes (`platform_event` envelopes). The
/// OCaml side reads window-size for viewport math (`inner_width`/
/// `inner_height` drive the virtualizer) and appearance for
/// `prefers_dark` (system-theme resolution) — both default to stale
/// values (1440x900, light) unless the host pushes them.
fn push_window_env(window: &gpui_kit::gpui::Window) {
    use gpui_kit::gpui::WindowAppearance;
    static LAST: Mutex<(Option<bool>, Option<(f32, f32)>)> = Mutex::new((None, None));
    let dark = matches!(
        window.appearance(),
        WindowAppearance::Dark | WindowAppearance::VibrantDark
    );
    let size = window.viewport_size();
    let wh = (f32::from(size.width), f32::from(size.height));
    let (push_appearance, push_size) = {
        let mut last = LAST.lock().unwrap();
        let appearance = last.0 != Some(dark);
        let size = last.1 != Some(wh);
        if appearance {
            last.0 = Some(dark);
        }
        if size {
            last.1 = Some(wh);
        }
        (appearance, size)
    };
    for (name, json) in [
        push_appearance.then(|| ("appearance", format!("{{\"dark\":{dark}}}"))),
        push_size.then(|| {
            (
                "window-size",
                format!("{{\"width\":{},\"height\":{}}}", wh.0, wh.1),
            )
        }),
    ]
    .into_iter()
    .flatten()
    {
        let envelope = format!("{name}\n{json}");
        unsafe {
            lui_ocaml_platform_event(envelope.as_ptr().cast::<c_char>(), envelope.len() as c_int)
        };
    }
}

fn pump_tick(shared: &Shared, window: &mut gpui_kit::gpui::Window, cx: &mut gpui_kit::gpui::App) {
    push_window_env(window);
    drain_patches(shared, cx);
    drain_requests(shared, window, cx);
    editor::reconcile_stale_focus(shared, window, cx);
    push_window_size(window);
    lui_gpui::dom::fire_viewport_events(shared, window, cx);
}

/// vsync-driven tick scheduled from the window: `cx.spawn` +
/// `background_executor().timer` futures never resolve in this gpui-kit
/// version, so the UI tick rides the window's frame callbacks instead.
fn tick_frame(shared: Shared, window: &mut gpui_kit::gpui::Window, cx: &mut gpui_kit::gpui::App) {
    pump_tick(&shared, window, cx);
    window.on_next_frame(move |window, cx| {
        tick_frame(shared.clone(), window, cx);
    });
}

fn drain_requests(
    shared: &Shared,
    window: &mut gpui_kit::gpui::Window,
    cx: &mut gpui_kit::gpui::App,
) {
    // Sync parked WKWebView overlays with their iframe nodes' bounds.
    logseq_ext::webview::sweep(shared, window);
    // debug: LOGSEQ_GPUI_DUMP_TREE=<ms> dumps the store tree once after t
    static DUMPED: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
    if !DUMPED.load(std::sync::atomic::Ordering::Relaxed) {
        if let Ok(ms) = std::env::var("LOGSEQ_GPUI_DUMP_TREE") {
            if boot_ms() >= ms.parse::<f64>().unwrap_or(0.0) {
                DUMPED.store(true, std::sync::atomic::Ordering::Relaxed);
                eprintln!("logseq-gpui: dumping tree t={:.1}ms", boot_ms());
                lui_gpui::domops::handle_dom_op(shared, "dump-frames", "{}", window, cx);
            }
        }
    }
    // debug: LOGSEQ_GPUI_DUMP_EVERY=<ms> dumps the store tree every <ms>ms.
    static NEXT_DUMP: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    if let Ok(ms) = std::env::var("LOGSEQ_GPUI_DUMP_EVERY") {
        let period = ms.parse::<u64>().unwrap_or(0).max(100);
        let now = boot_ms() as u64;
        if now >= NEXT_DUMP.load(std::sync::atomic::Ordering::Relaxed) {
            NEXT_DUMP.store(now + period, std::sync::atomic::Ordering::Relaxed);
            eprintln!("logseq-gpui: dumping tree t={:.1}ms", boot_ms());
            lui_gpui::domops::handle_dom_op(shared, "dump-frames", "{}", window, cx);
        }
    }
    let requests = PENDING_REQUESTS
        .lock()
        .map(|mut queue| std::mem::take(&mut *queue))
        .unwrap_or_default();
    for envelope in requests {
        handle_platform_request(&envelope, shared, window, cx);
    }
}

// Debug: print a backtrace on SIGSEGV/SIGBUS so crashes outside lldb are
// diagnosable. backtrace_symbols_fd is provided by libSystem on macOS.
extern "C" {
    fn backtrace_symbols_fd(
        buffer: *const *const libc::c_void,
        size: libc::c_int,
        fd: libc::c_int,
    );
    fn backtrace(buffer: *mut *mut libc::c_void, size: libc::c_int) -> libc::c_int;
}

unsafe extern "C" fn crash_handler(_sig: libc::c_int) {
    let mut frames: [*mut libc::c_void; 128] = [std::ptr::null_mut(); 128];
    let n = unsafe { backtrace(frames.as_mut_ptr(), frames.len() as libc::c_int) };
    unsafe {
        backtrace_symbols_fd(frames.as_ptr().cast::<*const libc::c_void>(), n, 2)
    };
    unsafe { libc::_exit(139) };
}

fn main() {
    boot_ms();
    unsafe {
        libc::signal(libc::SIGSEGV, crash_handler as libc::sighandler_t);
        libc::signal(libc::SIGBUS, crash_handler as libc::sighandler_t);
    }
    let platform = std::env::var("LOGSEQ_GPUI_PLATFORM")
        .ok()
        .and_then(|value| value.parse::<i32>().ok())
        .unwrap_or_else(bridge::current_os);
    let host = std::env::var("LOGSEQ_GPUI_HOST")
        .ok()
        .and_then(|value| value.parse::<i32>().ok())
        .unwrap_or(bridge::HOST_GPUI);

    // The thread calling lui_ocaml_start registers with the OCaml runtime —
    // all event entry points must stay on it, so this must be main.
    let accepted = unsafe {
        lui_ocaml_start(
            Some(bridge::patch_sink),
            Some(wakeup_cb),
            Some(platform_request_cb),
            platform,
            host,
            std::ptr::null(),
            0,
        )
    };
    if accepted == 0 {
        eprintln!("logseq-gpui: OCaml app rejected init");
        std::process::exit(1);
    }
    eprintln!("logseq-gpui: OCaml init ok t={:.1}ms pid {}", boot_ms(), std::process::id());

    // Dedicated OCaml pump thread: drains the app mailbox so OCaml
    // progress never waits on UI-frame scheduling. The bridge's
    // leave/enter-blocking-section entries serialize this thread
    // against event entry points called on the UI thread.
    std::thread::spawn(|| {
        unsafe {
            lui_ocaml_register_current_thread();
        }
        loop {
            let _ = pump_rx().recv_timeout(std::time::Duration::from_millis(16));
            unsafe {
                lui_ocaml_pump();
            }
        }
    });

    if let Ok(secs) = std::env::var("LOGSEQ_GPUI_START_DELAY") {
        std::thread::sleep(std::time::Duration::from_secs_f64(
            secs.parse().unwrap_or(0.),
        ));
    }

    eprintln!("logseq-gpui: app() start t={:.1}ms", boot_ms());
    let app = gpui_kit::application().with_assets(gpui_kit::assets::Assets);
    eprintln!("logseq-gpui: app() done t={:.1}ms", boot_ms());
    app.run(move |cx| {
        eprintln!("logseq-gpui: run entry t={:.1}ms", boot_ms());
        // Frame-1 theme installed ahead of gpui_kit::init so Root::new
        // and cx.theme() consumers can render the first draw without
        // waiting on component init (~60ms, mostly the theme font
        // probe's installed-font enumeration). ThemeColor::light() is
        // the same JSON-baked palette Theme::change applies; init is
        // deferred to run right after open_window's synchronous first
        // draw, keeping everything on the UI thread.
        cx.set_global(gpui_kit::component::theme::Theme::from(
            &*gpui_kit::component::theme::ThemeColor::light(),
        ));
        eprintln!("logseq-gpui: theme preset t={:.1}ms", boot_ms());
        let shared = LuiShared::new();
        // The logseq-editor surface (input routing + text measurement)
        // is app-scoped: registered here so `logseq-editor` extension
        // nodes bypass the generic DOM-ish renderer.
        editor::register(&shared);
        // logseq-codemirror / logseq-katex / logseq-pdf native hosts
        // (+ the logseq-div/logseq-span latex-slot intercept) live in
        // this crate and plug in through the same override hook.
        logseq_ext::register(&shared);

        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::new(
                point(px(80.), px(80.)),
                size(px(1280.), px(840.)),
            ))),
            ..Default::default()
        };
        eprintln!("logseq-gpui: opening window t={:.1}ms", boot_ms());
        let window_handle = cx.open_window(options, |window, cx| {
            eprintln!("logseq-gpui: window opened t={:.1}ms", boot_ms());
            // bare binary launches come up inactive — without this
            // the window can't become macOS key window and keyboard
            // input never reaches it
            window.activate_window();
            drain_patches(&shared, cx);
            let root_id = unsafe { bridge::lui_ocaml_root_node() };
            if root_id > 0 {
                shared.borrow_mut().store.root = Some(root_id);
            }
            let view = cx.new(|_| LuiRootView::new(shared.clone()));
            // vsync-driven tick: drain queued patches + platform
            // requests on the UI thread (cx.spawn + timer never
            // resolves in this gpui-kit — see tick_frame)
            window.on_next_frame({
                let shared = shared.clone();
                move |window, cx| tick_frame(shared, window, cx)
            });
            cx.new(|cx| Root::new(view, window, cx))
        })
        .expect("Failed to open window");
        eprintln!("logseq-gpui: open_window returned t={:.1}ms", boot_ms());
        // bare binary launches come up inactive — without this the
        // window can't become macOS key window and keyboard input
        // never reaches it; deferred so it lands after app.run settles
        cx.defer(|cx| cx.activate(true));
        // The makeKey at open raced app activation (the process was not
        // yet active, so the NSWindow never took key status and keys
        // fall through to the previous app). Re-activate the window once
        // the app itself is active.
        cx.defer(move |cx| {
            let _ = window_handle.update(cx, |_view, window, _cx| {
                window.activate_window();
            });
        });
        // Component init (theme registry, widget setup, the ~40ms
        // font-probe enumeration) is deferred past open_window's
        // synchronous first draw so it no longer gates first paint;
        // it still runs on the UI thread before the next frame.
        cx.defer(|cx| {
            gpui_kit::init(cx);
            eprintln!("logseq-gpui: kit init done t={:.1}ms", boot_ms());
        });
    });
}

#[cfg(test)]
mod tests {
    // explicit imports only: a `use super::*` glob would re-import
    // gpui_kit's `test` proc-macro, and the #[test] this macro generates
    // would then resolve back to it and expand forever
    use super::{
        lui_ocaml_pump, lui_ocaml_start, platform_request_cb, pump_tick,
        wakeup_cb,
    };
    use lui_core::bridge;
    use lui_gpui::LuiShared;

    /// Headless boot smoke: start the linked OCaml `native_embed` object,
    /// pump its mailbox until the initial patch batches arrive, then apply
    /// them through the same `take_patches`/`drain_patches` path the
    /// windowed host uses — asserting every batch lands cleanly.
    ///
    /// `cargo test` links `native_embed.exe.o` automatically (see
    /// build.rs). Runs under `TestAppContext` — no display needed. The
    /// test body stays on one thread, which keeps every `lui_ocaml_*`
    /// entry point on the OCaml-registered thread.
    #[gpui_kit::test]
    fn ocaml_boot_smoke(cx: &mut gpui_kit::TestAppContext) {
        let platform = std::env::var("LOGSEQ_GPUI_PLATFORM")
            .ok()
            .and_then(|value| value.parse::<i32>().ok())
            .unwrap_or_else(bridge::current_os);
        let host = std::env::var("LOGSEQ_GPUI_HOST")
            .ok()
            .and_then(|value| value.parse::<i32>().ok())
            .unwrap_or(bridge::HOST_GPUI);
        let accepted = unsafe {
            lui_ocaml_start(
                Some(bridge::patch_sink),
                Some(wakeup_cb),
                Some(platform_request_cb),
                platform,
                host,
                std::ptr::null(),
                0,
            )
        };
        assert_ne!(accepted, 0, "OCaml app rejected init");

        let shared = LuiShared::new();
        // Boot work runs on OCaml worker systhreads; pump until the tree
        // materializes (bounded so a dead boot fails instead of hanging).
        let mut populated = false;
        for _ in 0..500 {
            cx.update(|app| {
                unsafe {
                    lui_ocaml_pump();
                }
                pump_tick(&shared, app);
            });
            if !shared.borrow().store.nodes.is_empty() {
                populated = true;
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(20));
        }
        assert!(
            populated,
            "no patch batches arrived within the smoke window"
        );
        let root = unsafe { bridge::lui_ocaml_root_node() };
        assert!(root > 0, "OCaml reported no root node");
        assert!(
            shared.borrow().store.node(root).is_some(),
            "root node {root} missing from the store"
        );
        assert!(
            shared.borrow().last_errors.is_empty(),
            "apply errors: {:?}",
            shared.borrow().last_errors
        );
    }
}
