//! Test-target-only Windows processes exercising the unmodified restart protocol.
use super::*;
use ::windows::Win32::System::{
    JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, IsProcessInJob,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JobObjectExtendedLimitInformation, SetInformationJobObject,
    },
    Threading::GetExitCodeProcess,
};
use serde_json::{Value, json};
use std::{
    fs,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{ChildStdin, ExitCode, Stdio},
    sync::{
        atomic::Ordering,
        mpsc::{self, Receiver},
    },
    thread::JoinHandle,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const ROLE: &str = "LOGSEQ_RELAUNCH_FIXTURE_ROLE";
const ROOT: &str = "LOGSEQ_RELAUNCH_FIXTURE_ROOT";
const GATE: &str = "LOGSEQ_RELAUNCH_FIXTURE_GATE";
const DEADLINE: Duration = Duration::from_secs(45);

fn emit(event: &str, fields: Value) {
    println!("{}", json!({"event":event,"fields":fields}));
}
fn root() -> Result<PathBuf, String> {
    let root = PathBuf::from(std::env::var_os(ROOT).ok_or("fixture root is absent")?);
    if !root.is_absolute() || !root.is_dir() {
        return Err("fixture root is not an existing absolute directory".into());
    }
    Ok(root)
}
fn arguments(root: &Path) -> Vec<OsString> {
    vec![
        "--startup-preflight".into(),
        root.join("profile with spaces 图").into_os_string(),
        "quote\"and\\trailing\\".into(),
    ]
}
fn session(root: &Path, role: &str, gate: bool) -> Result<Session, String> {
    let mut session = Session::capture(arguments(root))?;
    session.environment.retain(|(key, _)| {
        ![ROLE, ROOT, GATE]
            .iter()
            .any(|name| key == OsStr::new(name))
    });
    session.environment.extend([
        (ROLE.into(), role.into()),
        (ROOT.into(), root.as_os_str().to_owned()),
        (GATE.into(), if gate { "1" } else { "0" }.into()),
    ]);
    Ok(session)
}
fn read_gate(expected: &str) -> Result<(), String> {
    let mut input = String::new();
    std::io::stdin()
        .read_line(&mut input)
        .map_err(|e| e.to_string())?;
    if input.trim_end() != expected {
        return Err(format!(
            "fixture expected owned input gate {expected:?}, got {input:?}"
        ));
    }
    Ok(())
}
fn wait(handle: HANDLE, millis: u32) -> Result<(), String> {
    // SAFETY: callers retain an exact owned process/event handle throughout this bounded wait.
    match unsafe { WaitForSingleObject(handle, millis) } {
        WAIT_OBJECT_0 => Ok(()),
        WAIT_TIMEOUT => Err("fixture native wait timed out".into()),
        _ => Err(::windows::core::Error::from_thread().to_string()),
    }
}
fn exit_code(handle: HANDLE) -> Result<u32, String> {
    let mut code = 0;
    // SAFETY: exact live process handle and one initialized writable output.
    unsafe { GetExitCodeProcess(handle, &mut code) }.map_err(|e| e.to_string())?;
    Ok(code)
}
fn job() -> Result<OwnedHandle, String> {
    // SAFETY: unnamed, non-inheritable job owned exclusively by this fixture case.
    let handle = unsafe { CreateJobObjectW(None, None) }.map_err(|e| e.to_string())?;
    // SAFETY: CreateJobObjectW transferred this one owned handle.
    let owned = unsafe { OwnedHandle::from_raw_handle(handle.0) };
    let mut info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
    info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    // SAFETY: documented exact structure/size for this information class; no object/type reinterpretation.
    unsafe {
        SetInformationJobObject(
            handle,
            JobObjectExtendedLimitInformation,
            std::ptr::from_ref(&info).cast(),
            u32::try_from(std::mem::size_of_val(&info)).map_err(|e| e.to_string())?,
        )
    }
    .map_err(|e| e.to_string())?;
    Ok(owned)
}

struct Process {
    job: Option<OwnedHandle>,
    child: Child,
    input: ChildStdin,
    messages: Receiver<Result<Value, String>>,
    reader: Option<JoinHandle<()>>,
    seen: Vec<Value>,
}
impl Process {
    fn start(mut command: std::process::Command) -> Result<Self, String> {
        let job = job()?;
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());
        let mut child = command.spawn().map_err(|e| e.to_string())?;
        // Every fixture entry waits for an owned stdin gate before it can launch
        // children or call Startup. Assignment therefore precedes all descendants.
        // SAFETY: both handles are exact owned objects, not PID/global-name lookups.
        if let Err(error) = unsafe {
            AssignProcessToJobObject(HANDLE(job.as_raw_handle()), HANDLE(child.as_raw_handle()))
        } {
            let _ = cleanup(&mut child);
            return Err(error.to_string());
        }
        let input = child.stdin.take().ok_or("owned fixture stdin is absent")?;
        let stdout = child
            .stdout
            .take()
            .ok_or("owned fixture stdout is absent")?;
        let (send, messages) = mpsc::channel();
        let reader = std::thread::spawn(move || {
            for line in BufReader::new(stdout).lines() {
                let message = line.map_err(|e| e.to_string()).and_then(|line| {
                    serde_json::from_str(&line).map_err(|e| format!("fixture stdout: {e}: {line}"))
                });
                if send.send(message).is_err() {
                    break;
                }
            }
        });
        Ok(Self {
            job: Some(job),
            child,
            input,
            messages,
            reader: Some(reader),
            seen: Vec::new(),
        })
    }
    fn gate(&mut self, value: &str) -> Result<(), String> {
        writeln!(self.input, "{value}").map_err(|e| e.to_string())?;
        self.input.flush().map_err(|e| e.to_string())
    }
    fn event(&mut self, event: &str) -> Result<Value, String> {
        if let Some(value) = self.seen.iter().find(|value| value["event"] == event) {
            return Ok(value.clone());
        }
        let deadline = Instant::now() + DEADLINE;
        loop {
            let value = self
                .messages
                .recv_timeout(deadline.saturating_duration_since(Instant::now()))
                .map_err(|e| format!("missing fixture event {event}: {e}"))??;
            emit("observed", value.clone());
            let matched = value["event"] == event;
            self.seen.push(value.clone());
            if matched {
                return Ok(value);
            }
        }
    }
    fn success(&mut self) -> Result<(), String> {
        wait(
            HANDLE(self.child.as_raw_handle()),
            u32::try_from(DEADLINE.as_millis()).map_err(|e| e.to_string())?,
        )?;
        let status = self.child.wait().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err(format!("owned fixture failed: {status}"));
        }
        Ok(())
    }
    fn captured_child(&mut self) -> Result<OwnedHandle, String> {
        // The identity arrives only over this case's inherited stdout pipe.
        // Independently prove job membership before observing the grandchild.
        let child = self.event("child-entered")?;
        let handle = capture_parent(
            child["fields"]["pid"]
                .as_u64()
                .and_then(|pid| u32::try_from(pid).ok())
                .ok_or("child pid absent")?,
            child["fields"]["birth"]
                .as_u64()
                .ok_or("child birth absent")?,
        )?;
        let mut belongs = ::windows::core::BOOL::default();
        // SAFETY: both exact handles remain owned and the output is initialized.
        unsafe {
            IsProcessInJob(
                HANDLE(handle.as_raw_handle()),
                Some(HANDLE(
                    self.job
                        .as_ref()
                        .ok_or("fixture job retired")?
                        .as_raw_handle(),
                )),
                &mut belongs,
            )
        }
        .map_err(|e| e.to_string())?;
        if !belongs.as_bool() {
            return Err("replacement is not in this case's owned job".into());
        }
        Ok(handle)
    }
}
impl Drop for Process {
    fn drop(&mut self) {
        // Only this case's assigned process and descendants can be terminated.
        drop(self.job.take());
        let _ = self.child.wait();
        if let Some(reader) = self.reader.take() {
            let _ = reader.join();
        }
    }
}
fn prefix(identity: u64, ready: &OwnedHandle) -> Vec<OsString> {
    vec![
        FLAG.into(),
        std::process::id().to_string().into(),
        identity.to_string().into(),
        ready.as_raw_handle().addr().to_string().into(),
    ]
}
fn child(role: &str, root: &Path) -> Result<(), String> {
    emit(
        "child-entered",
        json!({"pid":std::process::id(), "birth":birth(unsafe {GetCurrentProcess()})?}),
    );
    if std::env::var(GATE).is_ok_and(|value| value == "1") {
        read_gate("go")?;
    }
    if role == "exit-before-capture" {
        std::process::exit(17);
    }
    if role == "never-capture" {
        read_gate("never-released")?;
        return Err("uncaptured child unexpectedly resumed".into());
    }
    // This is the actual production startup barrier. Nothing representing
    // credentials, admission, workers or window initialization precedes it.
    let result = super::super::Startup::read();
    if role == "child-success" {
        let startup = result?;
        if startup.arguments != arguments(root) {
            return Err("restart arguments were changed".into());
        }
        fs::write(
            root.join("initialized.json"),
            json!({"pid":std::process::id(),"arguments":startup.arguments.iter()
                .map(|argument| argument.to_string_lossy().into_owned()).collect::<Vec<_>>()})
            .to_string(),
        )
        .map_err(|e| e.to_string())?;
        emit("child-initialized", json!({"pid":std::process::id()}));
        return Ok(());
    }
    let error = match result {
        Err(error) => error,
        Ok(_) => return Err("failed handoff reached application initialization".into()),
    };
    let expected = match role {
        "child-stale" => error == "restart parent creation identity changed",
        "child-timeout" => error == "previous Logseq process did not exit after handoff",
        "child-owner-exited" => {
            error.starts_with("capture restart parent:")
                || error.starts_with("capture restart acknowledgement event:")
        }
        _ => false,
    };
    if !expected {
        return Err(format!("unexpected refusal for {role}: {error}"));
    }
    if root.join("initialized.json").exists() {
        return Err("refused child published initialization".into());
    }
    emit("child-refused", json!({"reason":error}));
    Ok(())
}
fn parent(role: &str, root: &Path) -> Result<(), String> {
    read_gate("start")?;
    if role == "parent-early-exit" {
        let ready = event()?;
        let identity = birth(unsafe { GetCurrentProcess() })?;
        let mut child = session(root, "child-owner-exited", true)?
            .command(&prefix(identity, &ready))
            .spawn()
            .map_err(|e| e.to_string())?;
        emit(
            "parent-exiting",
            json!({"pid":std::process::id(),"child":child.id()}),
        );
        // Dropping Child does not terminate it; its gate remains in the driver's
        // inherited stdin pipe, and its job membership belongs to that driver.
        let _ = child.try_wait().map_err(|e| e.to_string())?;
        return Ok(());
    }
    if role == "parent-success" {
        let session = session(root, "child-success", false)?;
        session.request.0.store(true, Ordering::Release);
        if session.finish(ExitCode::SUCCESS)? != ExitCode::SUCCESS {
            return Err("restart capture failed".into());
        }
        if root.join("initialized.json").exists() {
            return Err("child initialized before its acknowledged parent exited".into());
        }
        emit("parent-captured", json!({"pid":std::process::id()}));
        read_gate("exit")?;
        return Ok(());
    }
    let child_role = match role {
        "parent-cleanup-exit" => "exit-before-capture",
        "parent-cleanup-timeout" => "never-capture",
        _ => return Err("unknown parent case".into()),
    };
    let mut sentinel =
        std::process::Command::new(std::env::current_exe().map_err(|e| e.to_string())?)
            .env(ROLE, "sentinel")
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .spawn()
            .map_err(|e| e.to_string())?;
    let error = spawn_after_teardown(&session(root, child_role, false)?)
        .err()
        .ok_or("uncaptured child was admitted")?;
    let expected = if role == "parent-cleanup-exit" {
        "replacement exited before capturing its exact parent"
    } else {
        "replacement did not capture its exact parent before deadline"
    };
    if error != expected || root.join("initialized.json").exists() {
        return Err(format!("incorrect owned cleanup outcome: {error}"));
    }
    if sentinel.try_wait().map_err(|e| e.to_string())?.is_some() {
        return Err("cleanup terminated a different owned sibling".into());
    }
    writeln!(
        sentinel.stdin.as_mut().ok_or("sentinel stdin absent")?,
        "done"
    )
    .map_err(|e| e.to_string())?;
    wait(HANDLE(sentinel.as_raw_handle()), 5000)?;
    if !sentinel.wait().map_err(|e| e.to_string())?.success() {
        return Err("unrelated sibling could not finish normally".into());
    }
    emit(
        "parent-cleanup-verified",
        json!({"reason":error,"siblingPreserved":true}),
    );
    Ok(())
}
fn case_root(root: &Path, name: &str) -> Result<PathBuf, String> {
    let path = root.join(name);
    fs::create_dir(&path).map_err(|e| e.to_string())?;
    Ok(path)
}
fn driver() -> Result<(), String> {
    let root = std::env::temp_dir().join(format!(
        "logseq-relaunch-processes-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos()
    ));
    fs::create_dir(&root).map_err(|e| e.to_string())?;
    emit("fixture-root", json!({"path":root}));
    {
        let root = case_root(&root, "acceptance")?;
        let mut process = Process::start(session(&root, "parent-success", false)?.command(&[]))?;
        process.gate("start")?;
        process.event("parent-captured")?;
        let handle = process.captured_child()?;
        // A condition-based native wait proves the acknowledged child remains
        // blocked while its exact parent is deliberately held alive.
        if unsafe { WaitForSingleObject(HANDLE(handle.as_raw_handle()), 1000) } != WAIT_TIMEOUT {
            return Err("replacement exited while its exact parent was held alive".into());
        }
        if process
            .child
            .try_wait()
            .map_err(|e| e.to_string())?
            .is_some()
            || root.join("initialized.json").exists()
        {
            return Err("child crossed the live-parent barrier".into());
        }
        process.gate("exit")?;
        process.success()?;
        process.event("child-initialized")?;
        wait(HANDLE(handle.as_raw_handle()), 5000)?;
        if exit_code(HANDLE(handle.as_raw_handle()))? != 0 {
            return Err("replacement failed after parent exit".into());
        }
        emit("accepted-after-exact-parent-exit", json!({"ok":true}));
    }
    for (name, role, stale) in [
        ("stale", "child-stale", true),
        ("parent-timeout", "child-timeout", false),
    ] {
        let root = case_root(&root, name)?;
        let ready = event()?;
        let identity = birth(unsafe { GetCurrentProcess() })?;
        let mut process = Process::start(
            session(&root, role, true)?
                .command(&prefix(if stale { identity + 1 } else { identity }, &ready)),
        )?;
        process.gate("go")?;
        if !stale {
            wait(HANDLE(ready.as_raw_handle()), 5000)?;
        }
        process.event("child-refused")?;
        process.success()?;
        if root.join("initialized.json").exists() {
            return Err("refused startup initialized".into());
        }
        if stale && unsafe { WaitForSingleObject(HANDLE(ready.as_raw_handle()), 0) } != WAIT_TIMEOUT
        {
            return Err("stale identity signalled readiness".into());
        }
    }
    {
        let root = case_root(&root, "owner-exit-before-capture")?;
        let mut process = Process::start(session(&root, "parent-early-exit", false)?.command(&[]))?;
        process.gate("start")?;
        process.event("parent-exiting")?;
        let handle = process.captured_child()?;
        process.success()?;
        process.gate("go")?;
        process.event("child-refused")?;
        wait(HANDLE(handle.as_raw_handle()), 5000)?;
        if exit_code(HANDLE(handle.as_raw_handle()))? != 0 {
            return Err("owner-exit refusal child failed".into());
        }
        if root.join("initialized.json").exists() {
            return Err("exited source owner was adopted".into());
        }
    }
    for (name, role) in [
        ("cleanup-exit", "parent-cleanup-exit"),
        ("cleanup-timeout", "parent-cleanup-timeout"),
    ] {
        let root = case_root(&root, name)?;
        let mut process = Process::start(session(&root, role, false)?.command(&[]))?;
        process.gate("start")?;
        process.event("parent-cleanup-verified")?;
        process.success()?;
    }
    emit(
        "windows-relaunch-processes-pass",
        json!({"cases":6,"realTimeoutMillis":WAIT_MILLIS,"evidence":root}),
    );
    Ok(())
}

pub(crate) fn run() -> ExitCode {
    let outcome = match std::env::var(ROLE).ok().as_deref() {
        None => driver(),
        Some("sentinel") => read_gate("done"),
        Some(role) if role.starts_with("parent-") => root().and_then(|root| parent(role, &root)),
        Some(role) => root().and_then(|root| child(role, &root)),
    };
    match outcome {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            emit("fixture-failed", json!({"error":error}));
            ExitCode::FAILURE
        }
    }
}
