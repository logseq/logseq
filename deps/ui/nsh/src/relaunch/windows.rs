//! Exact-parent/event handoff before the replacement starts application services.
use super::Session;
use ::windows::Win32::{
    Foundation::{
        DUPLICATE_HANDLE_OPTIONS, DuplicateHandle, FILETIME, HANDLE, WAIT_OBJECT_0, WAIT_TIMEOUT,
    },
    System::Threading::{
        CreateEventW, EVENT_MODIFY_STATE, GetCurrentProcess, GetProcessTimes, OpenProcess,
        PROCESS_DUP_HANDLE, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_SYNCHRONIZE, SetEvent,
        WaitForMultipleObjects, WaitForSingleObject,
    },
};
use std::{
    ffi::{OsStr, OsString},
    num::NonZeroUsize,
    os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle},
    process::Child,
};

const FLAG: &str = "--nsh-restart-after";
const WAIT_MILLIS: u32 = 30_000;

fn birth(handle: HANDLE) -> Result<u64, String> {
    let (mut created, mut exited, mut kernel, mut user) = (
        FILETIME::default(),
        FILETIME::default(),
        FILETIME::default(),
        FILETIME::default(),
    );
    // SAFETY: exact process handle and four distinct initialized outputs.
    unsafe { GetProcessTimes(handle, &mut created, &mut exited, &mut kernel, &mut user) }
        .map_err(|error| error.to_string())?;
    Ok((u64::from(created.dwHighDateTime) << 32) | u64::from(created.dwLowDateTime))
}
fn number<T: std::str::FromStr + ToString>(value: &OsStr) -> Result<T, String> {
    let value = value
        .to_str()
        .ok_or("restart identity must be decimal UTF-8")?;
    let parsed = value.parse::<T>().map_err(|_| "invalid restart identity")?;
    if parsed.to_string() != value || value == "0" {
        return Err("restart identity must be nonzero canonical decimal".into());
    }
    Ok(parsed)
}
fn capture_parent(pid: u32, expected_birth: u64) -> Result<OwnedHandle, String> {
    // SAFETY: non-inheritable query/synchronize/duplicate handle only. The
    // parent stays alive until this exact child signals the owned ready event.
    let native = unsafe {
        OpenProcess(
            PROCESS_SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_DUP_HANDLE,
            false,
            pid,
        )
    }
    .map_err(|error| format!("capture restart parent: {error}"))?;
    // SAFETY: OpenProcess transferred this exact owned OS process handle.
    let parent = unsafe { OwnedHandle::from_raw_handle(native.0) };
    if birth(HANDLE(parent.as_raw_handle()))? != expected_birth {
        return Err("restart parent creation identity changed".into());
    }
    Ok(parent)
}

/// An opaque event value valid only in the verified source process. This type
/// owns no local handle: it is never dereferenced, adopted or closed locally.
struct RemoteEvent(NonZeroUsize);
impl RemoteEvent {
    fn parse(argument: &OsStr) -> Result<Self, String> {
        NonZeroUsize::new(number::<usize>(argument)?)
            .map(Self)
            .ok_or_else(|| "restart event must be nonzero".into())
    }
    fn duplicate(&self, parent: &OwnedHandle) -> Result<OwnedHandle, String> {
        // The documented DuplicateHandle contract consumes an object-handle
        // value in its source process, not an address in our process. Restore
        // only its opaque ABI value; Windows validates the source and rights.
        let remote = HANDLE(std::ptr::without_provenance_mut(self.0.get()));
        let mut local = HANDLE::default();
        // SAFETY: the still-live verified parent owns the remote event. Only
        // a new non-inheritable local handle with EVENT_MODIFY_STATE is returned.
        unsafe {
            DuplicateHandle(
                HANDLE(parent.as_raw_handle()),
                remote,
                GetCurrentProcess(),
                &mut local,
                EVENT_MODIFY_STATE.0,
                false,
                DUPLICATE_HANDLE_OPTIONS(0),
            )
        }
        .map_err(|error| format!("capture restart acknowledgement event: {error}"))?;
        // SAFETY: DuplicateHandle transferred exactly this owned local handle;
        // only this duplicate, never the remote value, receives CloseHandle.
        Ok(unsafe { OwnedHandle::from_raw_handle(local.0) })
    }
}
pub(super) fn wait_for_parent(arguments: Vec<OsString>) -> Result<Vec<OsString>, String> {
    if arguments.first().is_none_or(|value| value != FLAG) {
        return Ok(arguments);
    }
    if arguments.len() < 4 {
        return Err("restart requires exact parent and event identities".into());
    }
    let parent = capture_parent(number::<u32>(&arguments[1])?, number::<u64>(&arguments[2])?)?;
    let event = RemoteEvent::parse(&arguments[3])?.duplicate(&parent)?;
    // Wrong object types or rights are native errors, never accepted readiness.
    unsafe { SetEvent(HANDLE(event.as_raw_handle())) }.map_err(|error| error.to_string())?;
    // The exact parent HANDLE survives PID reuse. A timeout/failed wait never
    // permits credentials, installation admission, workers or windows to start.
    match unsafe { WaitForSingleObject(HANDLE(parent.as_raw_handle()), WAIT_MILLIS) } {
        WAIT_OBJECT_0 => Ok(arguments.into_iter().skip(4).collect()),
        WAIT_TIMEOUT => Err("previous Logseq process did not exit after handoff".into()),
        _ => Err(format!(
            "wait for restart parent: {}",
            ::windows::core::Error::from_thread()
        )),
    }
}
fn event() -> Result<OwnedHandle, String> {
    // SAFETY: unnamed, initially unsignalled and non-inheritable; not a global
    // object or inherited ambient handle that another child can retain.
    let native =
        unsafe { CreateEventW(None, true, false, None) }.map_err(|error| error.to_string())?;
    // SAFETY: CreateEventW transferred this exact owned OS event handle.
    Ok(unsafe { OwnedHandle::from_raw_handle(native.0) })
}
pub(super) fn spawn_after_teardown(session: &Session) -> Result<(), String> {
    let identity = birth(unsafe { GetCurrentProcess() })?;
    let ready_event = event()?;
    let prefix = vec![
        FLAG.into(),
        std::process::id().to_string().into(),
        identity.to_string().into(),
        ready_event.as_raw_handle().addr().to_string().into(),
    ];
    let mut child = session
        .command(&prefix)
        .spawn()
        .map_err(|error| format!("start installed Logseq after update: {error}"))?;
    let handles = [
        HANDLE(ready_event.as_raw_handle()),
        HANDLE(child.as_raw_handle()),
    ];
    // SAFETY: both exact owned handles remain live for this bounded OS wait.
    let result = unsafe { WaitForMultipleObjects(&handles, false, WAIT_MILLIS) };
    if result == WAIT_OBJECT_0 {
        return Ok(());
    }
    let error = if result.0 == WAIT_OBJECT_0.0 + 1 {
        "replacement exited before capturing its exact parent".into()
    } else if result == WAIT_TIMEOUT {
        "replacement did not capture its exact parent before deadline".into()
    } else {
        format!(
            "wait for replacement capture: {}",
            ::windows::core::Error::from_thread()
        )
    };
    match cleanup(&mut child) {
        Ok(()) => Err(error),
        Err(cleanup) => Err(format!("{error}; replacement cleanup failed: {cleanup}")),
    }
}
fn cleanup(child: &mut Child) -> Result<(), String> {
    // Only the exact child just spawned here can be terminated. It cannot
    // enter application services while this parent remains alive.
    if child
        .try_wait()
        .map_err(|error| error.to_string())?
        .is_none()
    {
        child.kill().map_err(|error| error.to_string())?;
    }
    child.wait().map_err(|error| error.to_string())?;
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn actual_parent_birth_and_restart_argument_validation() {
        let identity = birth(unsafe { GetCurrentProcess() }).unwrap();
        assert_ne!(identity, 0);
        assert!(capture_parent(std::process::id(), identity).is_ok());
        assert!(
            matches!(capture_parent(std::process::id(), identity + 1), Err(error) if error == "restart parent creation identity changed")
        );
        for value in ["0", "01", "-1", " 1", "1 ", "garbage"] {
            assert!(number::<u64>(OsStr::new(value)).is_err());
        }
    }
    #[test]
    fn duplicate_is_the_actual_unnamed_event_and_drop_preserves_the_source_owner() {
        let source = event().unwrap();
        let parent = capture_parent(
            std::process::id(),
            birth(unsafe { GetCurrentProcess() }).unwrap(),
        )
        .unwrap();
        let remote =
            RemoteEvent::parse(OsStr::new(&source.as_raw_handle().addr().to_string())).unwrap();
        assert_eq!(
            unsafe { WaitForSingleObject(HANDLE(source.as_raw_handle()), 0) },
            WAIT_TIMEOUT
        );
        let local = remote.duplicate(&parent).unwrap();
        unsafe { SetEvent(HANDLE(local.as_raw_handle())) }.unwrap();
        drop(local);
        assert_eq!(
            unsafe { WaitForSingleObject(HANDLE(source.as_raw_handle()), 0) },
            WAIT_OBJECT_0
        );
    }
}
