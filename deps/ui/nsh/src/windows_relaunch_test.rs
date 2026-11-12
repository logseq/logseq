//! A plain test-target main accepts the real private restart argument prefix.
//! libtest would reject that prefix before a child test function could run.
#[cfg(target_os = "windows")]
pub use nsh_app_logseq::{App, AppProps};
#[cfg(target_os = "windows")]
pub mod relaunch;

#[cfg(target_os = "windows")]
fn main() -> std::process::ExitCode {
    relaunch::windows_handoff_fixture()
}

#[cfg(not(target_os = "windows"))]
fn main() {
    println!("Windows relaunch process qualification is skipped on this target.");
}
