//! One standalone runner's captured launch and post-installation restart request.
//! The existing updater owns verification/replacement; this module owns no feed,
//! download worker or application preparation protocol.
use nsh_core::element::{
    AnyValue, Children, Component, IntoElement, NoEvent, PropError, PropSpec, Props, Root, Scope,
    Slot, TsTypes, provide_context,
};
use std::{
    ffi::{OsStr, OsString},
    path::PathBuf,
    process::{Command, ExitCode},
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

#[cfg(target_os = "windows")]
mod windows;

/// Test-target-only driver for actual Windows parent/child handoff processes.
#[cfg(all(test, target_os = "windows"))]
pub fn windows_handoff_fixture() -> ExitCode {
    windows::process_tests::run()
}

// Match the packaged-startup qualifier's artifact-loader exclusions. Profile,
// storage, credentials and the user's remaining environment stay unchanged.
const ARTIFACT_OVERRIDES: &[&str] = &[
    "LUI_OCAML_LIBRARY",
    "LOGSEQ_NATIVE_ASSET_DIR",
    "LOGSEQ_DB_WORKER_BIN",
    "NSH_RUNTIME",
    "NSH_RUNTIME_DIR",
    "LD_LIBRARY_PATH",
    "DYLD_LIBRARY_PATH",
    "DYLD_FALLBACK_LIBRARY_PATH",
    "DYLD_INSERT_LIBRARIES",
];

#[derive(Clone)]
pub(crate) struct Request(Arc<AtomicBool>);
impl PartialEq for Request {
    fn eq(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.0, &other.0)
    }
}
impl Request {
    pub(crate) fn schedule(&self) -> Result<(), String> {
        self.0
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| "this application runner already requested a restart")?;
        // Public quit stops the actual standalone engine. The main function
        // consumes this request only after run_app has returned.
        nsh_core::element::desktop::quit();
        Ok(())
    }
}

/// Captured before replacement and retained by the actual native main function.
/// Embedded/default App roots have no such runner and cannot issue this request.
pub struct Session {
    executable: PathBuf,
    arguments: Vec<OsString>,
    directory: PathBuf,
    environment: Vec<(OsString, OsString)>,
    request: Request,
}
impl Session {
    pub fn capture(arguments: Vec<OsString>) -> Result<Self, String> {
        let executable = std::env::current_exe().map_err(|error| error.to_string())?;
        let directory = std::env::current_dir().map_err(|error| error.to_string())?;
        if !executable.is_absolute() || !directory.is_absolute() {
            return Err("standalone restart requires absolute executable and working paths".into());
        }
        Ok(Self {
            executable,
            arguments,
            directory,
            environment: capture_environment(std::env::vars_os()),
            request: Request(Arc::new(AtomicBool::new(false))),
        })
    }
    pub fn root(&self, startup_preflight: bool) -> Root {
        let request = self.request.clone();
        Root::new::<Standalone>(move || StandaloneProps {
            request: Some(request.clone()),
            startup_preflight,
        })
    }
    fn command(&self, prefix: &[OsString]) -> Command {
        let mut command = Command::new(&self.executable);
        command
            .args(prefix)
            .args(&self.arguments)
            .current_dir(&self.directory)
            .env_clear()
            .envs(self.environment.iter().cloned());
        command
    }
    /// Consumes only this main function's request after native engine teardown.
    /// An error cannot thaw application state whose installed files changed.
    pub fn finish(self, status: ExitCode) -> Result<ExitCode, String> {
        if !self.request.0.load(Ordering::Acquire) {
            return Ok(status);
        }
        if status != ExitCode::SUCCESS {
            return Err("native application teardown failed before restart".into());
        }
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            // Atomic image replacement releases all old mappings and threads.
            // Resolve neither current_exe nor an executable through PATH here:
            // the running image may now be the updater's moved/deleted N1.
            let error = self.command(&[]).exec();
            Err(format!(
                "cannot execute installed Logseq after update: {error}"
            ))
        }
        #[cfg(target_os = "windows")]
        {
            windows::spawn_after_teardown(&self)?;
            Ok(ExitCode::SUCCESS)
        }
    }
}
fn artifact_override(key: &OsStr) -> bool {
    ARTIFACT_OVERRIDES.iter().any(|candidate| {
        if cfg!(target_os = "windows") {
            key.to_str()
                .is_some_and(|value| value.eq_ignore_ascii_case(candidate))
        } else {
            key == OsStr::new(candidate)
        }
    })
}
fn capture_environment(
    values: impl IntoIterator<Item = (OsString, OsString)>,
) -> Vec<(OsString, OsString)> {
    values
        .into_iter()
        .filter(|(key, _)| !artifact_override(key))
        .collect()
}

/// Process-start argument handling, before credential or worker initialization.
pub struct Startup {
    pub arguments: Vec<OsString>,
}
impl Startup {
    pub fn read() -> Result<Self, String> {
        let arguments: Vec<_> = std::env::args_os().skip(1).collect();
        #[cfg(target_os = "windows")]
        {
            Ok(Self {
                arguments: windows::wait_for_parent(arguments)?,
            })
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(Self { arguments })
        }
    }
}

// A Rust-only bootstrap component. Its captured session is not a JS prop and
// does not require serializing process handles or adding a LUI wire capability.
#[derive(Clone, PartialEq)]
struct StandaloneProps {
    request: Option<Request>,
    startup_preflight: bool,
}
impl Props for StandaloneProps {
    fn spec(_: &mut TsTypes) -> Vec<PropSpec> {
        Vec::new()
    }
    fn initial() -> Self {
        Self {
            request: None,
            startup_preflight: false,
        }
    }
    fn set(&mut self, name: &str, _: Option<AnyValue>) -> Result<bool, PropError> {
        Err(PropError(format!(
            "unknown standalone bootstrap prop `{name}`"
        )))
    }
    fn set_slot(&mut self, _: &str, _: Option<Slot>) -> bool {
        false
    }
    fn set_children(&mut self, _: Children) -> bool {
        false
    }
}
struct Standalone;
impl Component for Standalone {
    type Props = StandaloneProps;
    type Event = NoEvent;
    fn view(props: StandaloneProps, _: Scope<NoEvent>) -> impl IntoElement {
        if let Some(request) = props.request {
            provide_context(request);
        }
        crate::App::element(crate::AppProps {
            startup_preflight: props.startup_preflight.into(),
        })
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn failed_native_teardown_never_starts_the_installed_replacement() {
        use super::*;
        let session = Session::capture(vec![]).unwrap();
        session.request.0.store(true, Ordering::Release);
        assert!(matches!(session.finish(ExitCode::FAILURE), Err(error)
            if error == "native application teardown failed before restart"));
    }
    #[test]
    fn captured_restart_keeps_private_profile_argv_and_removes_only_artifact_overrides() {
        use super::*;
        let arguments = vec![
            "--startup-preflight".into(),
            "/private/profile with spaces".into(),
        ];
        let mut session = Session::capture(arguments.clone()).unwrap();
        session.environment = capture_environment(vec![
            ("LOGSEQ_ROOT_DIR".into(), "/private/root".into()),
            ("LOGSEQ_NO_LOGIN_DAEMON".into(), "1".into()),
            ("USER_APPLICATION_SETTING".into(), "unchanged".into()),
            (
                "LUI_OCAML_LIBRARY".into(),
                "/old/application/library".into(),
            ),
            (
                "LOGSEQ_DB_WORKER_BIN".into(),
                "/old/application/worker".into(),
            ),
            (
                "DYLD_INSERT_LIBRARIES".into(),
                "/old/injected/library".into(),
            ),
        ]);
        let command = session.command(&[]);
        assert_eq!(command.get_program(), session.executable.as_os_str());
        assert_eq!(
            command.get_args().collect::<Vec<_>>(),
            arguments
                .iter()
                .map(OsString::as_os_str)
                .collect::<Vec<_>>()
        );
        assert_eq!(command.get_current_dir(), Some(session.directory.as_path()));
        assert_eq!(command.get_envs().count(), 3);
        for key in ARTIFACT_OVERRIDES {
            assert!(artifact_override(OsStr::new(key)));
        }
        for key in [
            "HOME",
            "LOGSEQ_ROOT_DIR",
            "LOGSEQ_UI_STATE_DIR",
            "LOGSEQ_NO_LOGIN_DAEMON",
            "LUI_AGENT_LISTEN",
        ] {
            assert!(!artifact_override(OsStr::new(key)));
        }
        assert_eq!(
            session.finish(ExitCode::SUCCESS).unwrap(),
            ExitCode::SUCCESS
        );
    }
}
