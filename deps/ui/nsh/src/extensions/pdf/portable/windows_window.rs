//! Narrow Win32 instance-data boundary for the reader's HWND/UIA host.
//! No PDFium/COM handle is reinterpreted and no process-global registry is used.
use nsh_platform_windows::windows::{
    Win32::{
        Foundation::{E_FAIL, HWND, LPARAM, LRESULT, WPARAM},
        System::Threading::GetCurrentThreadId,
        UI::{
            Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass},
            WindowsAndMessaging::{
                CreateWindowExW, DestroyWindow, WINDOW_EX_STYLE, WM_NCDESTROY, WS_CLIPCHILDREN,
                WS_POPUP,
            },
        },
    },
    core::{Error, Result, w},
};
use std::{cell::Cell, rc::Rc};

const SUBCLASS_ID: usize = 1;
pub trait Handler {
    fn message(&self, hwnd: HWND, message: u32, wparam: WPARAM, lparam: LPARAM) -> Option<LRESULT>;
}
struct State {
    thread: u32,
    hwnd: Cell<Option<HWND>>,
    live: Cell<bool>,
    handler: Rc<dyn Handler>,
}
#[derive(Clone, Copy, PartialEq)]
enum Transfer {
    Installing,
    WindowOwned,
    Destroyed,
}
struct Registration {
    state: Rc<State>,
    transfer: Cell<Transfer>,
}
/// Rc makes this owner !Send/!Sync. The public native-component host may borrow
/// its HWND for adoption, but cannot transfer instance-data ownership.
pub struct OwnedWindow(Rc<State>);
impl OwnedWindow {
    pub fn new(handler: impl Handler + 'static) -> Result<Self> {
        // SAFETY: a built-in Unicode class, no class registry or caller userdata;
        // creation and every subsequent operation stay on this UI thread.
        let hwnd = unsafe {
            CreateWindowExW(
                WINDOW_EX_STYLE(0),
                w!("STATIC"),
                w!(""),
                WS_POPUP | WS_CLIPCHILDREN,
                0,
                0,
                1,
                1,
                None,
                None,
                None,
                None,
            )?
        };
        let state = Rc::new(State {
            // SAFETY: plain identity query for the thread creating this HWND.
            thread: unsafe { GetCurrentThreadId() },
            hwnd: Cell::new(Some(hwnd)),
            live: Cell::new(true),
            handler: Rc::new(handler),
        });
        if let Err(error) = install(hwnd, state.clone()) {
            state.live.set(false);
            // SAFETY: this exact newly created window has no installed reader
            // callback; install already reclaimed its registration on failure.
            let cleanup = match state.hwnd.get() {
                Some(hwnd) => unsafe { DestroyWindow(hwnd) },
                None => Ok(()),
            };
            return match cleanup {
                Ok(()) => Err(error),
                Err(cleanup) => Err(Error::new(
                    E_FAIL,
                    format!("{error}; reader window cleanup failed: {cleanup}"),
                )),
            };
        }
        Ok(Self(state))
    }
    pub fn hwnd(&self) -> Option<HWND> {
        self.0.hwnd.get()
    }
    /// Retire before worker/provider disposal. Unknown late OS messages keep
    /// following the ordinary subclass chain without calling the retired owner.
    pub fn retire(&self) {
        self.0.live.set(false);
    }
    pub fn close(&self) -> Result<()> {
        // SAFETY: query only. Rc prevents moving this owner to another thread.
        assert_eq!(
            self.0.thread,
            unsafe { GetCurrentThreadId() },
            "reader HWND belongs to its creating UI thread"
        );
        self.retire();
        let Some(hwnd) = self.hwnd() else {
            return Ok(());
        };
        // SAFETY: exact current owned HWND; WM_NCDESTROY clears its state and
        // releases the registration. A returned error is not close proof.
        unsafe {
            DestroyWindow(hwnd)?;
        }
        if self.hwnd().is_some() {
            return Err(Error::new(
                E_FAIL,
                "reader destruction did not retire its exact subclass",
            ));
        }
        Ok(())
    }
}
impl Drop for OwnedWindow {
    fn drop(&mut self) {
        if let Err(error) = self.close() {
            eprintln!("native PDF reader window close failed: {error}");
        }
    }
}
fn install(hwnd: HWND, state: Rc<State>) -> Result<()> {
    let registration = Box::new(Registration {
        state,
        transfer: Cell::new(Transfer::Installing),
    });
    // SAFETY: DWORD_PTR is the documented reference-data slot for this exact
    // HWND/procedure/ID triple. This box remains owned here while installation
    // runs; a reentrant NCDESTROY marks it Destroyed without freeing our box.
    let installed = unsafe {
        SetWindowSubclass(
            hwnd,
            Some(window_proc),
            SUBCLASS_ID,
            (&*registration as *const Registration) as usize,
        )
        .as_bool()
    };
    if !installed || registration.transfer.get() == Transfer::Destroyed {
        return Err(Error::new(
            E_FAIL,
            "could not install a live reader window subclass",
        ));
    }
    registration.transfer.set(Transfer::WindowOwned);
    // No native call/reentrant dispatch occurs between transfer and into_raw.
    // Only the subsequent NCDESTROY callback may reclaim this exact box.
    let _ = Box::into_raw(registration);
    Ok(())
}
unsafe extern "system" fn window_proc(
    hwnd: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    id: usize,
    data: usize,
) -> LRESULT {
    // SAFETY: ComCtl32 supplied the reference data installed for this callback.
    // Clone before invoking application code: nested DestroyWindow may drop the
    // registration box while this stack frame must still own valid state.
    let (state, transfer) = unsafe {
        let registration = &*(data as *const Registration);
        let transfer = registration.transfer.get();
        if message == WM_NCDESTROY {
            registration.transfer.set(Transfer::Destroyed);
        }
        (registration.state.clone(), transfer)
    };
    if message == WM_NCDESTROY {
        state.live.set(false);
        state.hwnd.set(None);
        // SAFETY: remove the exact callback before releasing its transferred
        // box. During installation its caller still owns the box instead. No
        // Rust reference into either box survives this point.
        unsafe {
            assert!(
                RemoveWindowSubclass(hwnd, Some(window_proc), id).as_bool(),
                "owned reader subclass must remove its exact registration"
            );
            if transfer == Transfer::WindowOwned {
                drop(Box::from_raw(data as *mut Registration));
            }
            return DefSubclassProc(hwnd, message, wparam, lparam);
        }
    }
    if state.live.get() && state.hwnd.get() == Some(hwnd) {
        if let Some(result) = state.handler.message(hwnd, message, wparam, lparam) {
            return result;
        }
        if state.hwnd.get().is_none() {
            return LRESULT(0);
        }
    }
    // SAFETY: untouched messages continue down the documented subclass chain.
    unsafe { DefSubclassProc(hwnd, message, wparam, lparam) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsh_platform_windows::windows::Win32::UI::WindowsAndMessaging::{
        GWL_STYLE, GetWindowLongPtrW, IsWindow, SendMessageW, SetParent, SetWindowLongPtrW, WM_APP,
        WS_CHILD, WS_CLIPSIBLINGS,
    };
    struct Probe {
        calls: Rc<Cell<usize>>,
        drops: Rc<Cell<usize>>,
        reentrant: bool,
    }
    impl Handler for Probe {
        fn message(&self, hwnd: HWND, message: u32, _: WPARAM, _: LPARAM) -> Option<LRESULT> {
            if message != WM_APP + 31 {
                return None;
            }
            self.calls.set(self.calls.get() + 1);
            if self.reentrant {
                // SAFETY: the test's exact private window, on its owner thread.
                unsafe {
                    DestroyWindow(hwnd).unwrap();
                }
                assert_eq!(
                    self.drops.get(),
                    0,
                    "outer callback must retain its handler after nested NCDESTROY"
                );
            }
            Some(LRESULT(71))
        }
    }
    impl Drop for Probe {
        fn drop(&mut self) {
            self.drops.set(self.drops.get() + 1);
        }
    }
    fn probe(reentrant: bool) -> (Probe, Rc<Cell<usize>>, Rc<Cell<usize>>) {
        let calls = Rc::new(Cell::new(0));
        let drops = Rc::new(Cell::new(0));
        (
            Probe {
                calls: calls.clone(),
                drops: drops.clone(),
                reentrant,
            },
            calls,
            drops,
        )
    }
    #[test]
    fn real_window_registration_closes_once_and_retirement_stops_dispatch() {
        let (handler, calls, drops) = probe(false);
        let window = OwnedWindow::new(handler).unwrap();
        let hwnd = window.hwnd().unwrap();
        let weak = Rc::downgrade(&window.0);
        assert_eq!(
            Rc::strong_count(&window.0),
            2,
            "one owner plus one registration"
        );
        // SAFETY: synchronous dispatch to the test's exact hidden window.
        assert_eq!(
            unsafe { SendMessageW(hwnd, WM_APP + 31, None, None) },
            LRESULT(71)
        );
        window.retire();
        unsafe {
            SendMessageW(hwnd, WM_APP + 31, None, None);
        }
        assert_eq!(calls.get(), 1);
        window.close().unwrap();
        assert!(window.hwnd().is_none());
        assert!(!unsafe { IsWindow(Some(hwnd)) }.as_bool());
        assert_eq!(
            Rc::strong_count(&window.0),
            1,
            "NCDESTROY released its registration once"
        );
        window.close().unwrap();
        drop(window);
        assert!(weak.upgrade().is_none());
        assert_eq!(drops.get(), 1);
    }
    #[test]
    fn real_reentrant_destruction_keeps_outer_callback_valid() {
        let (handler, calls, drops) = probe(true);
        let window = OwnedWindow::new(handler).unwrap();
        let hwnd = window.hwnd().unwrap();
        assert_eq!(
            unsafe { SendMessageW(hwnd, WM_APP + 31, None, None) },
            LRESULT(71)
        );
        assert!(window.hwnd().is_none());
        assert_eq!(calls.get(), 1);
        assert_eq!(Rc::strong_count(&window.0), 1);
        drop(window);
        assert_eq!(drops.get(), 1);
    }
    #[test]
    fn real_parent_destruction_retires_adopted_child_registration() {
        let (handler, _, parent_drops) = probe(false);
        let parent = OwnedWindow::new(handler).unwrap();
        let (handler, _, child_drops) = probe(false);
        let child = OwnedWindow::new(handler).unwrap();
        let hwnd = child.hwnd().unwrap();
        // SAFETY: the same adoption/style transition as the pinned public native
        // component host, applied only to these private same-thread windows.
        unsafe {
            SetParent(hwnd, parent.hwnd()).unwrap();
            let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            SetWindowLongPtrW(
                hwnd,
                GWL_STYLE,
                ((style | WS_CHILD.0 | WS_CLIPSIBLINGS.0) & !WS_POPUP.0) as isize,
            );
        }
        parent.close().unwrap();
        assert!(child.hwnd().is_none());
        assert_eq!(Rc::strong_count(&child.0), 1);
        drop(child);
        drop(parent);
        assert_eq!((parent_drops.get(), child_drops.get()), (1, 1));
    }
    #[test]
    fn real_failed_install_does_not_leak_its_boxed_registration() {
        let (handler, _, drops) = probe(false);
        let window = OwnedWindow::new(handler).unwrap();
        let hwnd = window.hwnd().unwrap();
        window.close().unwrap();
        assert!(
            install(hwnd, window.0.clone()).is_err(),
            "the destroyed private HWND cannot accept a subclass"
        );
        assert_eq!(
            Rc::strong_count(&window.0),
            1,
            "failed install reclaimed the never-transferred box"
        );
        drop(window);
        assert_eq!(drops.get(), 1);
    }
}
