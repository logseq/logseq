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
use std::sync::atomic::{AtomicBool, Ordering};

mod editor;

use gpui_kit::component::Root;
use gpui_kit::gpui::{point, px, size, Bounds, WindowBounds, WindowOptions};
use gpui_kit::*;
use lui_core::bridge;
use lui_gpui::{apply_batch_json, LuiRootView, LuiShared, Shared};

/// The logseq bridge's patch callback emits `[batch, batch, …]` — the
/// accumulated queue joined as one JSON array (native_embed's
/// take_patches) — while lui-gpui's drain_pending expects one batch
/// object per string. Unwrap the array and apply each batch in order.
fn drain_patches(shared: &Shared, cx: &mut gpui_kit::gpui::App) {
    let dump = std::env::var("LOGSEQ_GPUI_DUMP_PATCHES").is_ok();
    for json in bridge::take_patches() {
        if dump {
            let _ = std::fs::write("/tmp/gpui-patch.json", &json);
            eprintln!("logseq-gpui: dumped patch to /tmp/gpui-patch.json");
        }
        let batches: Vec<String> = match serde_json::from_str(&json) {
            Ok(serde_json::Value::Array(items)) => items
                .into_iter()
                .map(|item| item.to_string())
                .collect(),
            _ => vec![json],
        };
        for batch in batches {
            eprintln!(
                "logseq-gpui: apply batch {} bytes",
                batch.len()
            );
            if let Err(error) = apply_batch_json(shared, &batch, cx) {
                let message = error.to_string();
                eprintln!("logseq-gpui: rejected batch: {message}");
                shared.borrow_mut().last_errors.push(message);
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
}

/// Async completions run on OCaml worker systhreads; wakeup is the "go
/// drain the mailbox" poke. The bridge forbids calling back into OCaml
/// here, so just flag it — the pump tick on the UI thread does the rest.
static WAKE: AtomicBool = AtomicBool::new(false);

unsafe extern "C" fn wakeup_cb() {
    WAKE.store(true, Ordering::Release);
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
    }
}

/// Service one platform-request envelope. `dom-op` ops go through
/// `lui_gpui::domops` (measure/scroll/focus/dump on the rendered tree);
/// replies (e.g. `node-rect`) are fed back into OCaml as
/// `lui_ocaml_platform_event("name\njson")` envelopes.
fn handle_platform_request(
    envelope: &str,
    shared: &Shared,
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
                // dom-op handler.
                let replies = editor::handle_dom_op(op, body, shared, cx)
                    .unwrap_or_else(|| {
                        lui_gpui::domops::handle_dom_op(shared, op, body, cx)
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
        other => eprintln!("logseq-gpui: platform request {other}: {payload}"),
    }
}

fn pump_tick(shared: &Shared, cx: &mut gpui_kit::gpui::App) {
    if WAKE.swap(false, Ordering::Acquire) {
        // Pump the OCaml mailbox on the UI thread; new patches come back
        // through patch_sink synchronously.
        eprintln!("logseq-gpui: pump start");
        unsafe {
            lui_ocaml_pump();
        }
        eprintln!("logseq-gpui: pump done");
    }
    drain_patches(shared, cx);
    let requests = PENDING_REQUESTS
        .lock()
        .map(|mut queue| std::mem::take(&mut *queue))
        .unwrap_or_default();
    for envelope in requests {
        handle_platform_request(&envelope, shared, cx);
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
    eprintln!("logseq-gpui: OCaml init ok, pid {}", std::process::id());

    if let Ok(secs) = std::env::var("LOGSEQ_GPUI_START_DELAY") {
        std::thread::sleep(std::time::Duration::from_secs_f64(
            secs.parse().unwrap_or(0.),
        ));
    }

    let app = gpui_kit::application().with_assets(gpui_kit::assets::Assets);
    app.run(move |cx| {
        gpui_kit::init(cx);
        let shared = LuiShared::new();
        // The logseq-editor surface (input routing + text measurement)
        // is app-scoped: registered here so `logseq-editor` extension
        // nodes bypass the generic DOM-ish renderer.
        editor::register(&shared);

        cx.spawn({
            let shared = shared.clone();
            async move |cx| {
                let options = WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(Bounds::new(
                        point(px(80.), px(80.)),
                        size(px(1280.), px(840.)),
                    ))),
                    ..Default::default()
                };
                eprintln!("logseq-gpui: opening window");
                cx.open_window(options, |window, cx| {
                    eprintln!("logseq-gpui: window opened");
                    drain_patches(&shared, cx);
                    let root_id = unsafe { bridge::lui_ocaml_root_node() };
                    if root_id > 0 {
                        shared.borrow_mut().store.root = Some(root_id);
                    }
                    let view = cx.new(|_| LuiRootView::new(shared.clone()));
                    cx.new(|cx| Root::new(view, window, cx))
                })
                .expect("Failed to open window");
            }
        })
        .detach();

        // Pump OCaml's async mailbox + platform requests on a short tick.
        // wakeup_cb only flags WAKE; this loop is what actually calls
        // lui_ocaml_pump (must run on the OCaml-registered UI thread).
        cx.spawn({
            let shared = shared.clone();
            async move |cx| {
                loop {
                    cx.background_executor()
                        .timer(std::time::Duration::from_millis(16))
                        .await;
                    let _ = cx.update(|cx| pump_tick(&shared, cx));
                }
            }
        })
        .detach();
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
