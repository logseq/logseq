//! One acknowledged shutdown dispatch followed only by exact terminal evidence.
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant},
};

#[cfg(unix)]
use std::process::Command;

type Reply = Result<(u16, String), String>;
#[derive(Debug)]
struct Identity {
    pid: u32,
    runtime: PathBuf,
    lifecycle: PathBuf,
    fields: Value,
}
const IDENTITY_FIELDS: [&str; 9] = [
    "pid",
    "repo",
    "ticket",
    "generation",
    "owner",
    "root",
    "graphsDir",
    "lifecycleDir",
    "ownership-protocol",
];
fn string<'a>(value: &'a Value, key: &str) -> Result<&'a str, String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("worker identity is missing {key}"))
}
fn inside(path: &str, private: &Path) -> Result<PathBuf, String> {
    let path = fs::canonicalize(path).map_err(|error| error.to_string())?;
    if !path.starts_with(private) || path == private {
        return Err("worker storage escapes the exact private fixture".into());
    }
    Ok(path)
}
impl Identity {
    fn capture(root: &Path, pid: u32, port: u16, health: &Value) -> Result<Self, String> {
        let root = fs::canonicalize(root).map_err(|error| error.to_string())?;
        let private = root.parent().ok_or("isolated root has no private parent")?;
        if pid == 0
            || health["pid"].as_u64() != Some(u64::from(pid))
            || health["port"].as_u64() != Some(u64::from(port))
        {
            return Err("private worker registry and health identity disagree".into());
        }
        let storage = health.get("storage").ok_or("worker storage is missing")?;
        if fs::canonicalize(string(storage, "root")?).map_err(|error| error.to_string())? != root {
            return Err("refusing cleanup outside the exact isolated graph root".into());
        }
        if string(health, "ownership-protocol")? != "sqlite-v1" {
            return Err("unsupported worker ownership protocol".into());
        }
        // health keeps bound_repo; Graph_lifecycle.context records graph_name(repo).
        let bound_repo = string(health, "repo")?.trim();
        let repo = bound_repo
            .strip_prefix("logseq_db_")
            .unwrap_or(bound_repo)
            .trim();
        if repo.is_empty() {
            return Err("worker graph name is empty".into());
        }
        let graphs = inside(string(storage, "graphsDir")?, private)?;
        let lifecycle = inside(string(storage, "lifecycleDir")?, private)?;
        let ticket = string(health, "ticket")?;
        if !ticket
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"_-".contains(&byte))
        {
            return Err("invalid private worker admission ticket".into());
        }
        // Resolve an existing, uniquely named admission file, not a second graph-name encoder.
        let mut records = Vec::new();
        for entry in fs::read_dir(&lifecycle).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            if entry
                .file_type()
                .map_err(|error| error.to_string())?
                .is_dir()
            {
                let path = entry.path().join(format!("runtime-{ticket}.json"));
                if path.try_exists().map_err(|error| error.to_string())? {
                    records.push(path);
                }
            }
        }
        if records.len() != 1 {
            return Err("private worker has no unique captured admission record".into());
        }
        let identity = Self {
            pid,
            runtime: records.remove(0),
            lifecycle: lifecycle.clone(),
            fields: serde_json::json!({
            "pid":pid,"repo":repo,"ticket":ticket,"generation":string(health,"generation")?,
            "owner":string(health,"owner-source")?,"root":root,"graphsDir":graphs,"lifecycleDir":lifecycle,"ownership-protocol":"sqlite-v1"}),
        };
        identity.terminal()?;
        Ok(identity)
    }
    fn terminal(&self) -> Result<bool, String> {
        let path = fs::canonicalize(&self.runtime).map_err(|error| error.to_string())?;
        if !path.starts_with(&self.lifecycle) {
            return Err("worker runtime record escaped its captured lifecycle owner".into());
        }
        let record: Value =
            serde_json::from_str(&fs::read_to_string(path).map_err(|error| error.to_string())?)
                .map_err(|error| error.to_string())?;
        for key in IDENTITY_FIELDS {
            let changed = || {
                format!(
                    "captured worker runtime {key} changed: expected={}, actual={}",
                    bounded(self.fields.get(key)),
                    bounded(record.get(key))
                )
            };
            let same = if matches!(key, "root" | "graphsDir" | "lifecycleDir") {
                fs::canonicalize(
                    string(&record, key).map_err(|error| format!("{}; {error}", changed()))?,
                )
                .map_err(|error| format!("{}; {error}", changed()))?
                    == Path::new(string(&self.fields, key)?)
            } else {
                record.get(key) == self.fields.get(key)
            };
            if !same {
                return Err(changed());
            }
        }
        match record.get("phase").and_then(Value::as_str) {
            Some("closed") if record.get("error") == Some(&Value::Null) => Ok(true),
            Some("close-error") | Some("closed") => {
                Err("owned worker recorded an unsuccessful close".into())
            }
            _ => Ok(false),
        }
    }
}
fn bounded(value: Option<&Value>) -> String {
    value.map_or_else(
        || "<missing>".into(),
        |value| value.to_string().chars().take(240).collect(),
    )
}
fn acknowledge(reply: (u16, String)) -> Result<(), String> {
    let (status, body) = reply;
    let value: Value = serde_json::from_str(&body)
        .map_err(|error| format!("private shutdown ACK JSON: {error}"))?;
    if status != 200 || value != serde_json::json!({"ok":true}) {
        return Err("private daemon did not acknowledge shutdown".into());
    }
    Ok(())
}
fn stop_with<Process>(
    root: &Path,
    mut request: impl FnMut(u16, &str, &str) -> Reply,
    mut capture: impl FnMut(u32) -> Result<Process, String>,
    mut absent: impl FnMut(u32, Option<&Process>) -> Result<bool, String>,
) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(4);
    let registry = match fs::read_to_string(root.join("server-list")) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => String::new(),
        Err(error) => return Err(error.to_string()),
    };
    let mut owned = Vec::new();
    let mut pids = std::collections::BTreeSet::new();
    let mut ports = std::collections::BTreeSet::new();
    for line in registry.lines() {
        let fields = line.split_whitespace().collect::<Vec<_>>();
        if fields.len() != 2 {
            return Err("invalid private worker registry".into());
        }
        let pid = fields[0]
            .parse::<u32>()
            .map_err(|_| "invalid private worker PID")?;
        let port = fields[1]
            .parse::<u16>()
            .map_err(|_| "invalid private worker port")?;
        if pid == 0 || port == 0 {
            return Err("invalid private worker endpoint".into());
        }
        if !pids.insert(pid) || !ports.insert(port) {
            return Err("duplicate private worker endpoint".into());
        }
        if absent(pid, None)? {
            continue;
        }
        let (status, body) = request(port, "GET", "/healthz")
            .map_err(|error| format!("private worker health before shutdown: {error}"))?;
        if !matches!(status, 200 | 503) {
            return Err("private worker returned an invalid health response".into());
        }
        let health: Value = serde_json::from_str(&body)
            .map_err(|error| format!("private worker health JSON: {error}"))?;
        let identity = Identity::capture(root, pid, port, &health)?;
        let process = capture(pid)?;
        acknowledge(
            request(port, "POST", "/v1/shutdown")
                .map_err(|error| format!("private worker shutdown before ACK: {error}"))?,
        )?;
        owned.push((identity, process));
    }
    loop {
        let mut finished = true;
        for (worker, process) in &owned {
            if !(worker.terminal()? && absent(worker.pid, Some(process))?) {
                finished = false;
            }
        }
        if finished {
            for (worker, _) in &owned {
                eprintln!(
                    "NSH_PREFLIGHT_WORKER_TERMINAL {}",
                    serde_json::json!({
                    "identity":worker.fields,"runtime":worker.runtime,
                    "phase":"closed","error":null,"process":"absent","shutdownDispatches":1})
                );
            }
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("isolated worker terminal close and process exit are unproven".into());
        }
        thread::sleep(Duration::from_millis(20));
    }
}
#[cfg(unix)]
fn process_probe(pid: u32, group: Option<u32>) -> Result<bool, String> {
    let script = "import os,sys\npid=int(sys.argv[1]);group=int(sys.argv[2])\ntry:\n if group and os.getpgid(pid)!=group: raise RuntimeError('worker escaped the exact fixture process group')\n os.kill(pid,0)\nexcept ProcessLookupError: sys.exit(0)\nexcept Exception as error:\n print(str(error),file=sys.stderr);sys.exit(2)\nsys.exit(1)";
    let output =
        Command::new(std::env::var_os("PYTHON_BINARY").unwrap_or_else(|| "python3".into()))
            .args([
                "-c",
                script,
                &pid.to_string(),
                &group.unwrap_or(0).to_string(),
            ])
            .output()
            .map_err(|error| error.to_string())?;
    match output.status.code() {
        Some(0) => Ok(true),
        Some(1) => Ok(false),
        _ => Err(format!(
            "owned worker process probe: {}",
            String::from_utf8_lossy(&output.stderr)
        )),
    }
}
#[cfg(unix)]
fn capture_process(pid: u32, group: Option<u32>) -> Result<(), String> {
    if process_probe(
        pid,
        Some(group.ok_or("owned worker has no captured process group")?),
    )? {
        Err("private worker exited before shutdown admission".into())
    } else {
        Ok(())
    }
}
#[cfg(unix)]
fn process_absent(pid: u32, _: Option<&()>) -> Result<bool, String> {
    process_probe(pid, None)
}
#[cfg(windows)]
mod windows_process {
    use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle};
    use windows::{
        Win32::{
            Foundation::{ERROR_INVALID_PARAMETER, HANDLE, WAIT_OBJECT_0, WAIT_TIMEOUT},
            System::Threading::{
                GetExitCodeProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
                PROCESS_SYNCHRONIZE, WaitForSingleObject,
            },
        },
        core::HRESULT,
    };
    fn open(pid: u32) -> Result<Option<OwnedHandle>, String> {
        // SAFETY: non-inheritable query/synchronize only; never stops a process.
        match unsafe {
            OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_SYNCHRONIZE,
                false,
                pid,
            )
        } {
            // SAFETY: this call transferred one owned OS process handle.
            Ok(handle) => Ok(Some(unsafe { OwnedHandle::from_raw_handle(handle.0) })),
            Err(error) if error.code() == HRESULT::from_win32(ERROR_INVALID_PARAMETER.0) => {
                Ok(None)
            }
            Err(error) => Err(error.to_string()),
        }
    }
    pub(super) fn capture_process(pid: u32, _: Option<u32>) -> Result<OwnedHandle, String> {
        open(pid)?.ok_or_else(|| "private worker exited before shutdown admission".into())
    }
    pub(super) fn process_absent(pid: u32, captured: Option<&OwnedHandle>) -> Result<bool, String> {
        let temporary;
        let owned = match captured {
            Some(handle) => handle,
            None => {
                temporary = open(pid)?;
                let Some(handle) = temporary.as_ref() else {
                    return Ok(true);
                };
                handle
            }
        };
        let handle = HANDLE(owned.as_raw_handle());
        // SAFETY: the exact owned handle remains alive for this nonblocking observation.
        match unsafe { WaitForSingleObject(handle, 0) } {
            WAIT_TIMEOUT => Ok(false),
            WAIT_OBJECT_0 => {
                let mut code = 0;
                // SAFETY: live owned handle and initialized output; nonzero exits fail.
                unsafe { GetExitCodeProcess(handle, &mut code) }
                    .map_err(|error| error.to_string())?;
                if code == 0 {
                    Ok(true)
                } else {
                    Err(format!("owned worker exited unsuccessfully: {code}"))
                }
            }
            _ => Err("owned worker process wait failed".into()),
        }
    }
}
#[cfg(windows)]
use windows_process::{capture_process, process_absent};
pub(super) fn stop(
    root: &Path,
    group: Option<u32>,
    request: impl FnMut(u16, &str, &str) -> Reply,
) -> Result<(), String> {
    stop_with(
        root,
        request,
        |pid| capture_process(pid, group),
        process_absent,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    };
    struct Fixture {
        directory: PathBuf,
        root: PathBuf,
        runtime: PathBuf,
        health: Value,
        record: Value,
    }
    impl Fixture {
        fn new() -> Self {
            let nonce = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let directory = std::env::temp_dir().join(format!(
                "logseq-worker-cleanup-{}-{nonce}",
                std::process::id()
            ));
            let root = directory.join("root");
            let graphs = directory.join("graphs");
            let lifecycle = directory.join(".graph-lifecycle/test-store");
            for path in [&root, &graphs, &lifecycle.join("Demo")] {
                fs::create_dir_all(path).unwrap();
            }
            let root = fs::canonicalize(root).unwrap();
            let graphs = fs::canonicalize(graphs).unwrap();
            let lifecycle = fs::canonicalize(lifecycle).unwrap();
            let runtime = lifecycle.join("Demo/runtime-captured-ticket.json");
            let health = serde_json::json!({"pid":4242,"port":43210,"repo":"logseq_db_Demo","ticket":"captured-ticket","generation":"captured-generation","owner-source":"electron","ownership-protocol":"sqlite-v1","storage":{"root":root,"graphsDir":graphs,"lifecycleDir":lifecycle}});
            let record = serde_json::json!({"pid":4242,"repo":"Demo","ticket":"captured-ticket","generation":"captured-generation","owner":"electron","ownership-protocol":"sqlite-v1","root":root,"graphsDir":graphs,"lifecycleDir":lifecycle,"phase":"ready","error":null});
            fs::write(&runtime, record.to_string()).unwrap();
            fs::write(root.join("server-list"), "4242 43210\n").unwrap();
            Self {
                directory,
                root,
                runtime,
                health,
                record,
            }
        }
        fn record(&self, record: &Value) {
            let pending = self.runtime.with_extension("pending.json");
            fs::write(&pending, record.to_string()).unwrap();
            fs::rename(pending, &self.runtime).unwrap();
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.directory);
        }
    }
    #[test]
    fn one_shutdown_ack_waits_for_delayed_terminal_close_and_exit_without_post_ack_http() {
        let fixture = Fixture::new();
        let ack = Arc::new(AtomicBool::new(false));
        let exited = Arc::new(AtomicBool::new(false));
        let observed_ack = ack.clone();
        let finished = exited.clone();
        let file = fixture.runtime.clone();
        let mut record = fixture.record.clone();
        let writer = thread::spawn(move || {
            while !observed_ack.load(Ordering::SeqCst) {
                thread::yield_now();
            }
            // The former20ms loop would send another health/shutdown request during this drain.
            thread::sleep(Duration::from_millis(60));
            record["phase"] = Value::String("closed".into());
            let pending = file.with_extension("pending.json");
            fs::write(&pending, record.to_string()).unwrap();
            fs::rename(pending, file).unwrap();
            thread::sleep(Duration::from_millis(40));
            finished.store(true, Ordering::SeqCst);
        });
        let mut requests = Vec::new();
        let start = Instant::now();
        let result = stop_with(
            &fixture.root,
            |port, method, path| {
                requests.push((port, method.to_owned(), path.to_owned()));
                if ack.load(Ordering::SeqCst) {
                    return Err("unexpected network request after shutdown ACK".into());
                }
                if method == "GET" {
                    Ok((200, fixture.health.to_string()))
                } else {
                    ack.store(true, Ordering::SeqCst);
                    Ok((200, r#"{"ok":true}"#.into()))
                }
            },
            |pid| {
                if pid == 4242 {
                    Ok(())
                } else {
                    Err("wrong captured PID".into())
                }
            },
            |_, _| Ok(exited.load(Ordering::SeqCst)),
        );
        writer.join().unwrap();
        result.unwrap();
        assert!(start.elapsed() >= Duration::from_millis(100));
        assert_eq!(
            requests,
            [
                (43210, "GET".into(), "/healthz".into()),
                (43210, "POST".into(), "/v1/shutdown".into())
            ]
        );
        // The worker protocol intentionally retains its stale server-list tuple.
        assert_eq!(
            fs::read_to_string(fixture.root.join("server-list")).unwrap(),
            "4242 43210\n"
        );
    }
    #[test]
    fn wrong_runtime_identity_and_close_errors_never_prove_release() {
        for field in [
            "pid",
            "repo",
            "ticket",
            "generation",
            "owner",
            "root",
            "graphsDir",
            "lifecycleDir",
            "ownership-protocol",
        ] {
            let fixture = Fixture::new();
            let mut wrong = fixture.record.clone();
            wrong[field] = if field == "pid" {
                serde_json::json!(4243)
            } else {
                Value::String("wrong-owner".into())
            };
            fixture.record(&wrong);
            let mut posts = 0;
            let error = stop_with(
                &fixture.root,
                |_, method, _| {
                    if method == "POST" {
                        posts += 1;
                    }
                    Ok((200, fixture.health.to_string()))
                },
                |_| Ok(()),
                |_, _| Ok(false),
            )
            .unwrap_err();
            assert!(!error.is_empty());
            assert_eq!(
                posts, 0,
                "wrong identity must fail before shutdown dispatch: {field}"
            );
        }
        let fixture = Fixture::new();
        let mut record = fixture.record.clone();
        record["phase"] = serde_json::json!("close-error");
        record["error"] = serde_json::json!("SQLite close failed");
        fixture.record(&record);
        assert!(
            Identity::capture(&fixture.root, 4242, 43210, &fixture.health)
                .unwrap_err()
                .contains("unsuccessful close")
        );
    }
    #[test]
    fn missing_or_incomplete_shutdown_ack_never_accepts_a_terminal_record() {
        for reply in [
            Err("io: connection reset by peer".into()),
            Ok((200, r#"{"ok":false}"#.into())),
            Ok((503, r#"{"ok":true}"#.into())),
            Ok((200, r#"{"ok":true"#.into())),
        ] {
            let fixture = Fixture::new();
            let mut posted = false;
            let error = stop_with(
                &fixture.root,
                |_, method, _| {
                    if method == "GET" {
                        Ok((200, fixture.health.to_string()))
                    } else {
                        posted = true;
                        let mut closed = fixture.record.clone();
                        closed["phase"] = serde_json::json!("closed");
                        fixture.record(&closed);
                        reply.clone()
                    }
                },
                |_| Ok(()),
                |_, _| Ok(false),
            )
            .unwrap_err();
            assert!(posted);
            assert!(!error.is_empty());
        }
    }
    #[test]
    fn closed_record_still_requires_process_absence_and_probe_errors_are_not_ignored() {
        let fixture = Fixture::new();
        let posted = std::cell::Cell::new(false);
        let error = stop_with(
            &fixture.root,
            |_, method, _| {
                if method == "GET" {
                    Ok((200, fixture.health.to_string()))
                } else {
                    posted.set(true);
                    let mut closed = fixture.record.clone();
                    closed["phase"] = serde_json::json!("closed");
                    fixture.record(&closed);
                    Ok((200, r#"{"ok":true}"#.into()))
                }
            },
            |_| Ok(()),
            |_, _| {
                if posted.get() {
                    Err("exact process liveness could not be inspected".into())
                } else {
                    Ok(false)
                }
            },
        )
        .unwrap_err();
        assert!(error.contains("liveness could not be inspected"));
    }
    #[test]
    fn acknowledged_shutdown_still_rejects_terminal_close_errors() {
        for phase in ["closed", "close-error"] {
            let fixture = Fixture::new();
            let error = stop_with(
                &fixture.root,
                |_, method, _| {
                    if method == "GET" {
                        Ok((200, fixture.health.to_string()))
                    } else {
                        let mut failed = fixture.record.clone();
                        failed["phase"] = serde_json::json!(phase);
                        failed["error"] = serde_json::json!("durable close error");
                        fixture.record(&failed);
                        Ok((200, r#"{"ok":true}"#.into()))
                    }
                },
                |_| Ok(()),
                |_, _| Ok(false),
            )
            .unwrap_err();
            assert!(error.contains("unsuccessful close"));
        }
    }
    #[test]
    fn health_bound_repo_matches_the_runtime_normalized_graph_name() {
        let fixture = Fixture::new();
        assert_eq!(fixture.record["repo"], serde_json::json!("Demo"));
        for repo in ["logseq_db_Demo", "Demo", "  logseq_db_Demo  "] {
            let mut health = fixture.health.clone();
            health["repo"] = serde_json::json!(repo);
            assert!(Identity::capture(&fixture.root, 4242, 43210, &health).is_ok());
        }
        let mut wrong = fixture.health.clone();
        wrong["repo"] = serde_json::json!("logseq_db_Other");
        let error = Identity::capture(&fixture.root, 4242, 43210, &wrong).unwrap_err();
        assert!(error.contains("repo changed: expected=\"Other\", actual=\"Demo\""));
    }
    #[test]
    fn path_identity_uses_the_filesystem_for_valid_aliases_and_rejects_other_existing_paths() {
        let fixture = Fixture::new();
        let mut aliases = fixture.record.clone();
        for key in ["root", "graphsDir", "lifecycleDir"] {
            aliases[key] = Value::String(format!("{}/.", fixture.record[key].as_str().unwrap()));
        }
        fixture.record(&aliases);
        let captured = Identity::capture(&fixture.root, 4242, 43210, &fixture.health).unwrap();
        assert!(!captured.terminal().unwrap());
        aliases["phase"] = serde_json::json!("closed");
        fixture.record(&aliases);
        assert!(captured.terminal().unwrap());
        for key in ["root", "graphsDir", "lifecycleDir"] {
            let mut wrong = aliases.clone();
            wrong[key] = fixture.record[if key == "root" { "graphsDir" } else { "root" }].clone();
            fixture.record(&wrong);
            assert!(
                captured
                    .terminal()
                    .unwrap_err()
                    .contains(&format!("{key} changed"))
            );
        }
    }
    #[cfg(windows)]
    #[test]
    fn ordinary_windows_record_paths_match_their_captured_verbatim_paths() {
        let fixture = Fixture::new();
        let mut plain = fixture.record.clone();
        for key in ["root", "graphsDir", "lifecycleDir"] {
            let canonical = fixture.record[key].as_str().unwrap();
            // Test data models the other runtime's ordinary Win32 spelling.
            // Production equality below always resolves through the filesystem.
            plain[key] = Value::String(if let Some(unc) = canonical.strip_prefix(r"\\?\UNC\") {
                format!(r"\\{unc}")
            } else {
                canonical
                    .strip_prefix(r"\\?\")
                    .expect("canonical Windows verbatim path")
                    .to_owned()
            });
        }
        fixture.record(&plain);
        assert!(Identity::capture(&fixture.root, 4242, 43210, &fixture.health).is_ok());
    }
    #[test]
    fn existing_ticket_lookup_is_unique_without_reimplementing_graph_encoding() {
        let mut fixture = Fixture::new();
        let lifecycle = fixture.runtime.parent().unwrap().parent().unwrap();
        let duplicate = lifecycle.join("another-graph");
        fs::create_dir(&duplicate).unwrap();
        fs::write(
            duplicate.join("runtime-captured-ticket.json"),
            fixture.record.to_string(),
        )
        .unwrap();
        assert!(
            Identity::capture(&fixture.root, 4242, 43210, &fixture.health)
                .unwrap_err()
                .contains("no unique")
        );
        fs::remove_dir_all(duplicate).unwrap();
        let original = fixture.runtime.parent().unwrap().to_path_buf();
        let encoded = original.with_file_name("existing~E5~9B~BE graph");
        fs::rename(original, &encoded).unwrap();
        fixture.runtime = encoded.join("runtime-captured-ticket.json");
        assert_eq!(
            Identity::capture(&fixture.root, 4242, 43210, &fixture.health)
                .unwrap()
                .runtime,
            fixture.runtime
        );
    }
    #[test]
    fn runtime_storage_must_remain_inside_the_private_fixture() {
        let fixture = Fixture::new();
        let outside = Fixture::new();
        let mut health = fixture.health.clone();
        health["storage"]["lifecycleDir"] = outside.health["storage"]["lifecycleDir"].clone();
        assert!(
            Identity::capture(&fixture.root, 4242, 43210, &health)
                .unwrap_err()
                .contains("escapes the exact private fixture")
        );
    }
}
