//! Runs the Rust application directly on the machine's native backend.

#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
mod installation;

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
    let startup = match nsh_app_logseq::relaunch::Startup::read() {
        Ok(startup) => startup,
        Err(error) => {
            eprintln!("Logseq restart handoff: {error}");
            return std::process::ExitCode::FAILURE;
        }
    };
    let arguments = startup.arguments.clone();
    if arguments
        .first()
        .is_some_and(|argument| argument == "--validate-native-styles")
    {
        if arguments.len() != 2 {
            eprintln!("native style validation requires one manifest path");
            return std::process::ExitCode::FAILURE;
        }
        return match std::fs::read_to_string(&arguments[1])
            .map_err(|error| error.to_string())
            .and_then(|source| lui_nsh::preflight::validate_styles(&source))
        {
            Ok(report) => {
                println!("{report}");
                std::process::ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("{error}");
                std::process::ExitCode::FAILURE
            }
        };
    }
    let launch = match launch(arguments.clone(), |name| std::env::var_os(name)) {
        Ok(qualification) => qualification,
        Err(error) => {
            eprintln!("Logseq native arguments: {error}");
            return std::process::ExitCode::FAILURE;
        }
    };
    let qualification = match launch {
        #[cfg(target_os = "windows")]
        Launch::InstallationAdmission => {
            println!("{}", installation::PROTOCOL);
            return std::process::ExitCode::SUCCESS;
        }
        Launch::ValidateUpdateConfig(path) => {
            return match validate_update_config(&path) {
                Ok(()) => std::process::ExitCode::SUCCESS,
                Err(error) => {
                    eprintln!("Logseq update configuration: {error}");
                    std::process::ExitCode::FAILURE
                }
            };
        }
        Launch::Application(qualification) => qualification,
    };
    let session = match nsh_app_logseq::relaunch::Session::capture(arguments) {
        Ok(session) => session,
        Err(error) => {
            eprintln!("Logseq standalone launch identity: {error}");
            return std::process::ExitCode::FAILURE;
        }
    };
    #[cfg(target_os = "windows")]
    if let Err(error) = installation::register() {
        eprintln!("Logseq installation admission: {error}");
        return std::process::ExitCode::FAILURE;
    }
    env_logger::init();
    let startup_preflight = qualification.is_some();
    if startup_preflight {
        match startup_release_marker() {
            Ok(marker) => eprintln!("{marker}"),
            Err(error) => {
                eprintln!("Logseq compiled release identity: {error}");
                return std::process::ExitCode::FAILURE;
            }
        }
    }
    let data_dir = qualification.as_ref().map(|root| root.join("nsh-data"));
    let cache = qualification
        .as_ref()
        .map_or_else(Default::default, |root| {
            platform::CacheOptions::at(platform::CacheLocation::Dir(root.join("nsh-cache")))
        });
    let root = nsh_app_logseq::with_bundled_fonts(session.root(startup_preflight)).app_id(APP_ID);
    #[cfg(target_os = "macos")]
    let components = {
        let components = platform::Components::default();
        nsh_app_logseq::extensions::register_pdf(&components);
        components
    };
    let status = std::process::Termination::report(platform::run_app(
        platform::AppSource::Rust(root),
        platform::AppOptions {
            #[cfg(target_os = "macos")]
            components,
            title: "Logseq".to_owned(),
            app_id: APP_ID.to_owned(),
            size: (1440, 900),
            data_dir,
            cache,
            #[cfg(target_os = "macos")]
            background: std::env::var("LUI_AGENT_BACKGROUND").is_ok_and(|value| value == "1"),
            ..Default::default()
        },
    ));
    match session.finish(status) {
        Ok(status) => status,
        Err(error) => {
            eprintln!(
                "Logseq installed update restart failed; saved state remains closed: {error}"
            );
            std::process::ExitCode::FAILURE
        }
    }
}

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn startup_release_marker() -> Result<String, String> {
    #[derive(serde::Deserialize)]
    struct Release {
        version: String,
    }
    // Embed the authored release metadata in the Rust executable as well as
    // OCaml's existing Version.app. Runtime package metadata alone cannot prove
    // that an installed restart actually loaded the new native executable.
    let release: Release = serde_json::from_str(include_str!("../../../../resources/package.json"))
        .map_err(|error| error.to_string())?;
    if release.version.is_empty() {
        return Err("compiled application release version is empty".into());
    }
    Ok(
        serde_json::json!({"event":"logseq-native-start", "compiledVersion":release.version,
        "processId":std::process::id()})
        .to_string(),
    )
}

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
#[derive(Debug, PartialEq, Eq)]
enum Launch {
    #[cfg(target_os = "windows")]
    InstallationAdmission,
    Application(Option<std::path::PathBuf>),
    ValidateUpdateConfig(std::path::PathBuf),
}

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn launch(
    arguments: Vec<std::ffi::OsString>,
    environment: impl Fn(&str) -> Option<std::ffi::OsString>,
) -> Result<Launch, String> {
    #[cfg(target_os = "windows")]
    if arguments
        .first()
        .is_some_and(|flag| flag == "--installation-admission-protocol")
    {
        return if arguments.len() == 1 {
            Ok(Launch::InstallationAdmission)
        } else {
            Err("expected --installation-admission-protocol without arguments".into())
        };
    }
    if arguments
        .first()
        .is_some_and(|flag| flag == "--validate-update-config")
    {
        if arguments.len() != 2 {
            return Err("expected --validate-update-config <configuration-file>".into());
        }
        return Ok(Launch::ValidateUpdateConfig(arguments[1].clone().into()));
    }
    qualification(arguments, environment).map(Launch::Application)
}

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn validate_update_config(path: &std::path::Path) -> Result<(), String> {
    use std::io::Read;
    const LIMIT: u64 = 1 << 20;
    let mut bytes = Vec::new();
    std::fs::File::open(path)
        .map_err(|error| error.to_string())?
        .take(LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| error.to_string())?;
    if bytes.len() as u64 > LIMIT {
        return Err("configuration exceeds 1 MiB".into());
    }
    lui_nsh::update::validate_configuration(&bytes).map_err(|error| error.to_string())
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
    use super::{Launch, launch, qualification, validate_update_config};
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
    fn update_validation_selects_no_application_or_qualification_environment() {
        assert_eq!(
            launch(
                vec!["--validate-update-config".into(), "config.json".into()],
                |_| panic!("validation must not inspect launch environment")
            )
            .unwrap(),
            Launch::ValidateUpdateConfig("config.json".into())
        );
        assert!(launch(vec!["--validate-update-config".into()], |_| None).is_err());
        assert!(
            launch(
                vec!["--validate-update-config".into(), "a".into(), "b".into()],
                |_| None
            )
            .is_err()
        );
    }

    #[test]
    fn update_validation_checks_real_bytes_and_bounds_before_launch() {
        let fixture = Fixture::new();
        let file = fixture.root.join("update.json");
        std::fs::write(&file, br#"{"id":"com.logseq.logseq","version":"2.0.2","url":"https://updates.example.test/latest.json","publicKey":"iojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1w="}"#).unwrap();
        validate_update_config(&file).unwrap();
        std::fs::write(
            &file,
            br#"{"id":"com.logseq.logseq","version":"2.0.2","github":"logseq/logseq"}"#,
        )
        .unwrap();
        assert!(validate_update_config(&file).is_err());
        std::fs::write(&file, vec![b' '; (1 << 20) + 1]).unwrap();
        assert!(validate_update_config(&file).unwrap_err().contains("1 MiB"));
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

#[cfg(all(test, target_os = "windows"))]
mod installation_protocol_tests {
    use super::{Launch, launch};

    #[test]
    fn pure_installation_capability_does_not_read_application_environment() {
        assert_eq!(
            launch(
                vec!["--installation-admission-protocol".into()],
                |_| panic!("the capability probe must not initialize application state"),
            ),
            Ok(Launch::InstallationAdmission)
        );
        assert!(
            launch(
                vec!["--installation-admission-protocol".into(), "extra".into()],
                |_| panic!("invalid capability arguments must not read environment"),
            )
            .is_err()
        );
    }
}
