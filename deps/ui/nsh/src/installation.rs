//! Process-lifetime Windows admission for manual installation and removal.
//! Register activity before testing the installer's presence; the installer
//! registers its own presence before testing activity, closing the start race.

pub const PROTOCOL: &str = "com.logseq.logseq.nsh-installation-admission-v1";
const ACTIVE: &str = "Global\\com.logseq.logseq.nsh-active-v1";
const INSTALLER: &str = "Global\\com.logseq.logseq.nsh-installer-v1";

type Handle = *mut std::ffi::c_void;
#[link(name = "kernel32")]
unsafe extern "system" {
    fn CreateMutexW(attributes: *const std::ffi::c_void, owner: i32, name: *const u16) -> Handle;
    fn OpenMutexW(access: u32, inherit: i32, name: *const u16) -> Handle;
    fn CloseHandle(handle: Handle) -> i32;
    fn GetLastError() -> u32;
}

pub fn register() -> Result<(), String> {
    let directory = std::env::current_exe()
        .map_err(|error| error.to_string())?
        .parent()
        .ok_or("Native application has no installation directory")?
        .to_owned();
    if directory
        .join(".nsh-installing")
        .try_exists()
        .map_err(|error| error.to_string())?
    {
        return Err("Native installation is incomplete; repair it before starting Logseq".into());
    }
    let active: Vec<u16> = ACTIVE.encode_utf16().chain(Some(0)).collect();
    let installer: Vec<u16> = INSTALLER.encode_utf16().chain(Some(0)).collect();
    // SAFETY: exact kernel32 signatures, valid NUL-terminated names, no handle
    // inheritance or mutex ownership. Successful presence lasts until exit.
    unsafe {
        let presence = CreateMutexW(std::ptr::null(), 0, active.as_ptr());
        if presence.is_null() {
            return Err(format!("CreateMutexW(activity) failed: {}", GetLastError()));
        }
        let installing = OpenMutexW(0x0010_0000, 0, installer.as_ptr());
        let error = if installing.is_null() {
            GetLastError()
        } else {
            0
        };
        if !installing.is_null() || error != 2 {
            if !installing.is_null() {
                CloseHandle(installing);
            }
            CloseHandle(presence);
            return Err(format!(
                "Native installation is active or cannot be checked: {error}"
            ));
        }
        // Inno recommends retaining the presence until the process completely
        // terminates. Windows owns this one handle's final cleanup, including
        // unexpected exit; no task, worker table or shutdown callback is added.
    }
    Ok(())
}
