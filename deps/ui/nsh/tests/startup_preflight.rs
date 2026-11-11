//! Build gate for the real OCaml application and native adapter, without an OS window.
//! Each run owns a fresh process, home/state/graph root and worker daemon.
use nsh_core::{
    platform::{Idiom, Os},
    prelude::*,
};
use nsh_engine::{EngineConfig, EngineContext, Root};
use nsh_testing::Headless;
use std::{
    cell::RefCell,
    fs::{self, File},
    path::Path,
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

mod startup_body;

const CHILD: &str = "LOGSEQ_NSH_STARTUP_PREFLIGHT_CHILD";
const TEST: &str = "real_application_startup_preflight";

#[test]
fn real_application_startup_preflight() -> Result<(), String> {
    require_artifacts()?;
    if std::env::var(CHILD).as_deref() == Ok("1") {
        return mount_actual_application();
    }
    isolated_process()
}

fn require_artifacts() -> Result<(), String> {
    for name in [
        "LUI_OCAML_LIBRARY",
        "LOGSEQ_NATIVE_ASSET_DIR",
        "LOGSEQ_DB_WORKER_BIN",
    ] {
        let path = std::env::var_os(name).filter(|value| !value.is_empty())
            .ok_or_else(|| format!("startup preflight requires {name}; run bash deps/ui/nsh/build.sh to build and qualify the actual native artifacts"))?;
        if !Path::new(&path).exists() {
            return Err(format!(
                "startup preflight {name} does not exist: {}",
                Path::new(&path).display()
            ));
        }
    }
    Ok(())
}

fn mount_actual_application() -> Result<(), String> {
    let mut config = EngineConfig::new(Root::of::<nsh_app_logseq::App>());
    config.context = EngineContext::default().with(nsh_app_logseq::StartupPreflight);
    config.viewport = Size::new(px(1440.0), px(900.0));
    config.environment.idiom = Idiom::Desktop;
    config.environment.os = if cfg!(target_os = "macos") {
        Os::MacOs
    } else if cfg!(target_os = "windows") {
        Os::Windows
    } else {
        Os::Linux
    };
    let mut app =
        Headless::start(config).map_err(|error| format!("real Logseq engine startup: {error}"))?;
    wait_for_chrome(
        &mut app,
        "native header controls",
        Duration::from_secs(15),
        |screen| {
            screen
                .matches("role:button[Search]")
                .expect("fixed search control selector")
                && screen
                    .matches("role:button[Toggle left sidebar]")
                    .expect("fixed sidebar control selector")
        },
    )?;
    // Model.initial follows ls-left-sidebar-open? and defaults to closed in
    // fresh state. Open it with the actual native control, not a model override.
    app.press("role:button[Toggle left sidebar]")
        .map_err(|error| {
            let header = app
                .screen()
                .layout_nodes()
                .into_iter()
                .filter(|node| node.bounds.origin.y.0 < 120.0 && node.bounds.origin.x.0 < 500.0)
                .take(40)
                .collect::<Vec<_>>();
            format!("{error}\nNative header layout: {header:#?}")
        })?;
    wait_for_chrome(
        &mut app,
        "actual Demo/Journals sidebar",
        Duration::from_secs(20),
        |screen| {
            screen.shows("Demo")
                && screen.shows("Journals")
                && screen
                    .matches("role:button[Search]")
                    .expect("fixed search control selector")
                && screen
                    .matches("role:button[Toggle left sidebar]")
                    .expect("fixed sidebar control selector")
        },
    )?;
    eprintln!(
        "Before journal-body wait:\n{}",
        startup_body::diagnostic(app.screen())
    );
    wait_for_chrome(
        &mut app,
        "visible dated journal in measured main split",
        Duration::from_secs(20),
        startup_body::ready,
    )?;
    wait_for_chrome(
        &mut app,
        "left sidebar fills exactly one native pane",
        Duration::from_secs(5),
        startup_body::sidebar_ready,
    )?;
    let body =
        startup_body::identity(app.screen()).ok_or("qualified journal identity is missing")?;
    // Resize and toggle through real public native input. The source graph,
    // Journals region and main scroll must remain mounted, with a dated title
    // still visible even if asynchronous page metadata repaints that text.
    app.set_viewport(Size::new(px(1280.0), px(900.0)))?;
    wait_for_chrome(
        &mut app,
        "native sidebar after viewport resize",
        Duration::from_secs(10),
        |screen| {
            startup_body::window_width(screen, 1280.0)
                && startup_body::sidebar_ready(screen)
                && startup_body::ready(screen)
        },
    )?;
    if startup_body::identity(app.screen()) != Some(body) {
        return Err("viewport resize remounted the journal body or main scroll".into());
    }
    app.press("role:button[Toggle left sidebar]")?;
    wait_for_chrome(
        &mut app,
        "collapsed native sidebar retains journal body",
        Duration::from_secs(10),
        |screen| screen.count("id:left-sidebar") == Ok(0) && startup_body::ready(screen),
    )?;
    if startup_body::identity(app.screen()) != Some(body) {
        return Err("sidebar collapse remounted the journal body or main scroll".into());
    }
    app.press("role:button[Toggle left sidebar]")?;
    wait_for_chrome(
        &mut app,
        "reopened single-owner native sidebar",
        Duration::from_secs(10),
        |screen| startup_body::sidebar_ready(screen) && startup_body::ready(screen),
    )?;
    if startup_body::identity(app.screen()) != Some(body) {
        return Err("sidebar reopening remounted the journal body or main scroll".into());
    }
    app.set_viewport(Size::new(px(1440.0), px(900.0)))?;
    wait_for_chrome(
        &mut app,
        "restored native window geometry",
        Duration::from_secs(10),
        |screen| {
            startup_body::window_width(screen, 1440.0)
                && startup_body::sidebar_ready(screen)
                && startup_body::ready(screen)
        },
    )?;
    if startup_body::identity(app.screen()) != Some(body) {
        return Err("restoring viewport remounted the journal body or main scroll".into());
    }
    // More must exercise the native Menu trigger and dismissal controller. A
    // generic semantic dismiss event would miss unsupported popup composition.
    let more_identity = |screen: &nsh_testing::Screen| {
        screen
            .layout_nodes()
            .into_iter()
            .find(|node| node.test_id.as_deref() == Some("toolbar-dots-btn"))
            .map(|node| node.id)
    };
    let more = more_identity(app.screen()).ok_or("native More trigger is not mounted")?;
    for _ in 0..2 {
        app.press("role:button[More]")?;
        wait_for_chrome(
            &mut app,
            "native More menu with Settings and Appearance",
            Duration::from_secs(10),
            |screen| {
                screen.matches("role:menuitem[Settings]") == Ok(true)
                    && screen.matches("role:menuitem[Appearance]") == Ok(true)
            },
        )?;
        if more_identity(app.screen()) != Some(more)
            || startup_body::identity(app.screen()) != Some(body)
        {
            return Err("opening More remounted its trigger or the journal body".into());
        }
        app.press_key("escape")?;
        wait_for_chrome(
            &mut app,
            "native Escape dismissal retains the journal body",
            Duration::from_secs(10),
            |screen| {
                screen.count("role:menuitem[Settings]") == Ok(0)
                    && screen.count("role:menuitem[Appearance]") == Ok(0)
                    && startup_body::ready(screen)
            },
        )?;
        if more_identity(app.screen()) != Some(more)
            || startup_body::identity(app.screen()) != Some(body)
        {
            return Err("dismissing More remounted its trigger or the journal body".into());
        }
    }
    // Headless owns and joins the engine thread on drop. The process boundary
    // also isolates OCaml's persistent worker from every other Rust test.
    drop(app);
    Ok(())
}

fn wait_for_chrome(
    app: &mut Headless,
    what: &str,
    timeout: Duration,
    ready: impl Fn(&nsh_testing::Screen) -> bool,
) -> Result<(), String> {
    let diagnostic = RefCell::new(None);
    app.wait_until(what, timeout, |screen| {
        // Renderer::fail publishes this public test ID. A known backend/style
        // error terminates the wait immediately, rather than timing out.
        if let Some(error) = screen
            .layout_nodes()
            .into_iter()
            .find(|node| node.test_id.as_deref() == Some("lui-backend-error"))
        {
            *diagnostic.borrow_mut() = Some(format!("{:?}", error.text));
            true
        } else {
            ready(screen)
        }
    })
    .map_err(|error| format!("{error}\n{}", startup_body::diagnostic(app.screen())))?;
    match diagnostic.into_inner() {
        Some(message) => Err(format!("real Logseq backend startup diagnostic: {message}")),
        None => Ok(()),
    }
}

fn isolated_process() -> Result<(), String> {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "logseq-nsh-preflight-{}-{nonce}",
        std::process::id()
    ));
    for name in ["home", "root", "graphs", "state", "data", "cache"] {
        fs::create_dir_all(directory.join(name)).map_err(|e| e.to_string())?;
    }
    let transcript = directory.join("startup.log");
    let mut process_group = None;
    let result = run_child(&directory, &transcript, &mut process_group);
    // Only the worker registered beneath our unguessable private root is
    // contacted, and its health response must confirm that exact root first.
    let graceful = stop_owned_workers(&directory.join("root"));
    // The OCaml prewarm domain can spawn its private child before publishing
    // server-list. Terminate our own descendant group too, so an early style
    // failure cannot leak a worker that registered after the health check.
    let cleanup = terminate_owned_group(process_group).and(graceful);
    let output = fs::read_to_string(&transcript).unwrap_or_default();
    let removal = fs::remove_dir_all(&directory).map_err(|e| e.to_string());
    match (result, cleanup, removal) {
        (Ok(()), Ok(()), Ok(())) => Ok(()),
        (result, cleanup, removal) => Err(format!(
            "startup preflight failed: child={result:?}; worker cleanup={cleanup:?}; temporary cleanup={removal:?}\n{output}"
        )),
    }
}

fn run_child(
    directory: &Path,
    transcript: &Path,
    process_group: &mut Option<u32>,
) -> Result<(), String> {
    let output = File::create(transcript).map_err(|e| e.to_string())?;
    let mut command = Command::new(std::env::current_exe().map_err(|e| e.to_string())?);
    command
        .args(["--exact", TEST, "--nocapture", "--test-threads=1"])
        .env(CHILD, "1")
        .env("HOME", directory.join("home"))
        .env("LOGSEQ_ROOT_DIR", directory.join("root"))
        .env("LOGSEQ_GRAPHS_DIR", directory.join("graphs"))
        .env("LOGSEQ_UI_STATE_DIR", directory.join("state"))
        .env("XDG_STATE_HOME", directory.join("state"))
        .env("XDG_DATA_HOME", directory.join("data"))
        .env("XDG_CACHE_HOME", directory.join("cache"))
        .env("LOGSEQ_NO_LOGIN_DAEMON", "1")
        .env("LUI_AGENT_LISTEN", "")
        .env("LUI_AGENT_BACKGROUND", "1")
        .stdin(Stdio::null())
        .stdout(output.try_clone().map_err(|e| e.to_string())?)
        .stderr(output);
    // Descendant workers belong only to this test's group; the regular path
    // still shuts them down through their private daemon protocol, not signals.
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    let mut child = command.spawn().map_err(|e| e.to_string())?;
    *process_group = Some(child.id());
    let deadline = Instant::now() + Duration::from_secs(110);
    loop {
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            return if status.success() {
                Ok(())
            } else {
                Err(format!("actual Logseq test process exited {status}"))
            };
        }
        if Instant::now() >= deadline {
            child.kill().map_err(|e| e.to_string())?;
            child.wait().map_err(|e| e.to_string())?;
            return Err("actual Logseq startup exceeded the isolated 110-second deadline".into());
        }
        thread::sleep(Duration::from_millis(20));
    }
}

#[cfg(unix)]
fn terminate_owned_group(group: Option<u32>) -> Result<(), String> {
    let Some(group) = group else {
        return Ok(());
    };
    // Python is already a build-script prerequisite. Command-scoped arguments
    // avoid unsafe global environment mutation and target only the new group
    // created by CommandExt::process_group(0), never a user application.
    let status =
        Command::new(std::env::var_os("PYTHON_BINARY").unwrap_or_else(|| "python3".into()))
            .args([
                "-c",
                "import os,signal,sys,time
pid=int(sys.argv[1])
try:
 os.killpg(pid,signal.SIGTERM)
except ProcessLookupError:
 sys.exit(0)
time.sleep(0.1)
try:
 os.killpg(pid,signal.SIGKILL)
except ProcessLookupError:
 pass",
                &group.to_string(),
            ])
            .status()
            .map_err(|error| format!("isolated worker process-group cleanup: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err("isolated worker process-group cleanup failed".into())
    }
}
#[cfg(not(unix))]
fn terminate_owned_group(_: Option<u32>) -> Result<(), String> {
    Ok(())
}

fn request(port: u16, method: &str, path: &str) -> Result<(u16, String), String> {
    // Reuse the already-pinned HTTP client so chunked health responses are
    // decoded before JSON parsing. Cleanup only contacts this loopback daemon.
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .proxy(None)
        .max_redirects(0)
        .timeout_global(Some(Duration::from_secs(1)))
        .http_status_as_error(false)
        .build()
        .into();
    let uri = format!("http://127.0.0.1:{port}{path}");
    let mut response = match method {
        "GET" => agent.get(&uri).call(),
        "POST" => agent.post(&uri).send_empty(),
        _ => return Err("unsupported private worker request method".into()),
    }
    .map_err(|error| error.to_string())?;
    let status = response.status().as_u16();
    let body = response
        .body_mut()
        .read_to_string()
        .map_err(|error| error.to_string())?;
    Ok((status, body))
}
fn stop_owned_workers(root: &Path) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(4);
    let expected = fs::canonicalize(root)
        .map_err(|error| format!("cannot resolve isolated graph root: {error}"))?;
    loop {
        let registry = fs::read_to_string(root.join("server-list")).unwrap_or_default();
        let mut active = false;
        for line in registry.lines() {
            let fields = line.split_whitespace().collect::<Vec<_>>();
            if fields.len() != 2 {
                return Err("invalid private worker registry".into());
            }
            let port = fields[1]
                .parse::<u16>()
                .map_err(|_| "invalid private worker port")?;
            let Ok((status, body)) = request(port, "GET", "/healthz") else {
                continue;
            };
            if !matches!(status, 200 | 503) {
                return Err("private worker returned an invalid health response".into());
            }
            let health: serde_json::Value = serde_json::from_str(&body)
                .map_err(|error| format!("invalid private worker health JSON: {error}"))?;
            let actual = health
                .get("storage")
                .and_then(|storage| storage.get("root"))
                .and_then(serde_json::Value::as_str)
                .ok_or("private worker health response has no storage.root")?;
            let actual = fs::canonicalize(actual)
                .map_err(|error| format!("cannot resolve worker graph root: {error}"))?;
            // macOS /var and /private/var can identify the same private root.
            // Compare filesystem identity, never a prefix or a JSON substring.
            if actual != expected {
                return Err("refusing cleanup of a daemon outside the isolated graph root".into());
            }
            active = true;
            let (status, _) = request(port, "POST", "/v1/shutdown")?;
            if status != 200 {
                return Err("private daemon refused shutdown".into());
            }
        }
        if !active {
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("isolated worker did not finish shutdown".into());
        }
        thread::sleep(Duration::from_millis(20));
    }
}
