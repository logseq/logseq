//! Runs the Rust application directly on the machine's native backend.

#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
use nsh_platform_linux as platform;
#[cfg(target_os = "macos")]
use nsh_platform_macos as platform;
#[cfg(target_os = "windows")]
use nsh_platform_windows as platform;

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
const APP_ID: &str = "com.logseq.logseq";

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn main() -> impl std::process::Termination {
    env_logger::init();
    let qualification = match qualification(std::env::args_os().skip(1).collect(), |name| {
        std::env::var_os(name)
    }) {
        Ok(qualification) => qualification,
        Err(error) => {
            eprintln!("Logseq native arguments: {error}");
            return std::process::ExitCode::FAILURE;
        }
    };
    let startup_preflight = qualification.is_some();
    let data_dir = qualification.as_ref().map(|root| root.join("nsh-data"));
    let cache = qualification
        .as_ref()
        .map_or_else(Default::default, |root| {
            platform::CacheOptions::at(platform::CacheLocation::Dir(root.join("nsh-cache")))
        });
    let root = platform::Root::new::<nsh_app_logseq::App>(move || nsh_app_logseq::AppProps {
        startup_preflight: startup_preflight.into(),
    })
    .app_id(APP_ID);
    std::process::Termination::report(platform::run_app(
        platform::AppSource::Rust(root),
        platform::AppOptions {
            title: "Logseq".to_owned(),
            app_id: APP_ID.to_owned(),
            size: (1440, 900),
            data_dir,
            cache,
            #[cfg(target_os = "macos")]
            background: std::env::var("LUI_AGENT_BACKGROUND").is_ok_and(|value| value == "1"),
            ..Default::default()
        },
    ))
}

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn qualification(
    arguments: Vec<std::ffi::OsString>,
    environment: impl Fn(&str) -> Option<std::ffi::OsString>,
) -> Result<Option<std::path::PathBuf>, String> {
    if arguments.is_empty() {
        return Ok(None);
    }
    if arguments.len() != 2 || arguments[0] != "--startup-preflight" {
        return Err("expected no arguments or --startup-preflight <absolute-private-root>".into());
    }
    let root = std::path::PathBuf::from(&arguments[1]);
    if !root.is_absolute() {
        return Err("startup preflight root must be absolute".into());
    }
    let root = root
        .canonicalize()
        .map_err(|error| format!("startup preflight root: {error}"))?;
    if !root.is_dir() {
        return Err("startup preflight root must be an existing directory".into());
    }
    for name in [
        "HOME",
        "LOGSEQ_ROOT_DIR",
        "LOGSEQ_GRAPHS_DIR",
        "LOGSEQ_UI_STATE_DIR",
    ] {
        let path = environment(name)
            .map(std::path::PathBuf::from)
            .filter(|path| path.is_absolute())
            .ok_or_else(|| format!("startup preflight requires absolute {name} below its root"))?;
        let path = path
            .canonicalize()
            .map_err(|error| format!("startup preflight {name}: {error}"))?;
        if !path.is_dir() || !path.starts_with(&root) || path == root {
            return Err(format!(
                "startup preflight {name} must be a directory below its private root"
            ));
        }
    }
    if environment("LOGSEQ_NO_LOGIN_DAEMON").as_deref() != Some(std::ffi::OsStr::new("1")) {
        return Err("startup preflight requires LOGSEQ_NO_LOGIN_DAEMON=1".into());
    }
    Ok(Some(root))
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
compile_error!(
    "Run this desktop binary on macOS, Windows or Linux; mobile applications use the maintained LUI Apple/iOS and Android backends."
);

#[cfg(all(
    test,
    any(target_os = "linux", target_os = "macos", target_os = "windows")
))]
mod tests {
    use super::qualification;
    use std::{collections::BTreeMap, ffi::OsString, path::PathBuf};

    struct Fixture {
        root: PathBuf,
        environment: BTreeMap<String, OsString>,
    }
    impl Fixture {
        fn new() -> Self {
            let nonce = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir().join(format!(
                "logseq-native-options-{}-{nonce}",
                std::process::id()
            ));
            let mut environment = BTreeMap::new();
            for name in [
                "HOME",
                "LOGSEQ_ROOT_DIR",
                "LOGSEQ_GRAPHS_DIR",
                "LOGSEQ_UI_STATE_DIR",
            ] {
                let directory = root.join(name);
                std::fs::create_dir_all(&directory).unwrap();
                environment.insert(name.into(), directory.into_os_string());
            }
            environment.insert("LOGSEQ_NO_LOGIN_DAEMON".into(), "1".into());
            Self { root, environment }
        }
        fn arguments(&self) -> Vec<OsString> {
            vec![
                "--startup-preflight".into(),
                self.root.clone().into_os_string(),
            ]
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.root).unwrap();
        }
    }

    #[test]
    fn ordinary_launch_never_selects_qualification_from_environment() {
        assert_eq!(
            qualification(Vec::new(), |_| panic!(
                "ordinary launch must not read qualification environment"
            ))
            .unwrap(),
            None
        );
    }

    #[test]
    fn native_qualification_requires_explicit_flag_and_private_persistence_paths() {
        let mut fixture = Fixture::new();
        assert_eq!(
            qualification(fixture.arguments(), |name| fixture
                .environment
                .get(name)
                .cloned())
            .unwrap(),
            Some(fixture.root.canonicalize().unwrap())
        );
        fixture.environment.insert(
            "LOGSEQ_GRAPHS_DIR".into(),
            fixture.root.parent().unwrap().as_os_str().to_owned(),
        );
        assert!(
            qualification(fixture.arguments(), |name| fixture
                .environment
                .get(name)
                .cloned())
            .unwrap_err()
            .contains("LOGSEQ_GRAPHS_DIR")
        );
    }

    #[test]
    fn malformed_flags_and_login_daemon_opt_in_are_rejected_before_starting_app() {
        for arguments in [
            vec!["--startup-preflight".into()],
            vec!["--unknown".into()],
            vec!["--startup-preflight".into(), "relative".into()],
        ] {
            assert!(qualification(arguments, |_| None).is_err());
        }
        let mut fixture = Fixture::new();
        fixture.environment.remove("LOGSEQ_NO_LOGIN_DAEMON");
        assert!(
            qualification(fixture.arguments(), |name| fixture
                .environment
                .get(name)
                .cloned())
            .unwrap_err()
            .contains("LOGSEQ_NO_LOGIN_DAEMON")
        );
    }
}
