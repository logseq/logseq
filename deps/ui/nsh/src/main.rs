//! Runs the Rust application directly on the machine's native backend.

#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
use nsh_platform_linux as platform;
#[cfg(target_os = "macos")]
use nsh_platform_macos as platform;
#[cfg(target_os = "windows")]
use nsh_platform_windows as platform;

#[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
fn main() -> impl std::process::Termination {
    env_logger::init();
    platform::run_app(
        platform::AppSource::Rust(platform::Root::of::<nsh_app_logseq::App>()),
        platform::AppOptions {
            title: "Logseq".to_owned(),
            #[cfg(any(target_os = "linux", target_os = "windows"))]
            app_id: "com.logseq.logseq".to_owned(),
            size: (1440, 900),
            #[cfg(target_os = "macos")]
            background: std::env::var("LUI_AGENT_BACKGROUND").is_ok_and(|value| value == "1"),
            ..Default::default()
        },
    )
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
compile_error!(
    "Run this desktop binary on macOS, Windows or Linux; mobile applications use the maintained LUI Apple/iOS and Android backends."
);
