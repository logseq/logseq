//! Correlated preparation on the existing application pump, never an installer.
use lui_nsh::{desktop_updates::InstallPreparation, runtime::PlatformEvent};
use serde::Deserialize;
use serde_json::json;
use std::{
    cell::{Cell, RefCell},
    future::poll_fn,
    rc::Rc,
    task::{Poll, Waker},
};

pub(super) type SendEvent = Rc<dyn Fn(PlatformEvent) -> Result<(), String>>;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Phase {
    Prepared,
    Released,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Response {
    id: String,
    phase: Phase,
    ok: bool,
    error: String,
}
struct Pending {
    id: u64,
    phase: Phase,
    response: Option<Result<(), String>>,
    waker: Option<Waker>,
    abandoned: bool,
}
pub(super) struct Preparation {
    next: Cell<u64>,
    closed: Cell<bool>,
    pending: RefCell<Option<Pending>>,
    changed: Box<dyn Fn(bool)>,
}
impl Preparation {
    pub(super) fn new(changed: impl Fn(bool) + 'static) -> Self {
        Self {
            next: Cell::new(0),
            closed: Cell::new(false),
            pending: RefCell::new(None),
            changed: Box::new(changed),
        }
    }
    pub(super) fn close(&self) {
        self.closed.set(true);
        (self.changed)(false);
        if let Some(mut pending) = self.pending.borrow_mut().take()
            && let Some(waker) = pending.waker.take()
        {
            waker.wake();
        }
    }
    pub(super) fn active(&self) -> bool {
        self.pending.borrow().is_some()
    }
    pub(super) fn response(&self, payload: &str) -> Result<(), String> {
        let response: Response = serde_json::from_str(payload)
            .map_err(|error| format!("update-preparation-result: {error}"))?;
        if response.ok != response.error.is_empty() {
            return Err("preparation response status and error do not agree".into());
        }
        let id = response
            .id
            .parse::<u64>()
            .map_err(|_| "invalid preparation response id")?;
        if id == 0 || id.to_string() != response.id || id > self.next.get() {
            return Err("unissued preparation response id".into());
        }
        let (waker, released) = {
            let mut slot = self.pending.borrow_mut();
            let Some(pending) = slot.as_mut() else {
                // Replies to a cancelled, already-issued request are inert.
                return Ok(());
            };
            if id < pending.id {
                return Ok(());
            }
            if response.phase == Phase::Prepared && pending.phase == Phase::Released {
                return Ok(()); // Save completion raced an already-requested abort.
            }
            if id != pending.id || response.phase != pending.phase {
                return Err("preparation response phase does not match the active request".into());
            }
            if pending.response.is_some() {
                if pending.abandoned
                    && response.phase == Phase::Released
                    && matches!(&pending.response, Some(Err(_)))
                {
                    // Recovery can fail more than once after the waiter was
                    // dropped. Keep its fence until a later successful retry.
                    if !response.ok {
                        return Ok(());
                    }
                } else {
                    return Err("duplicate preparation response".into());
                }
            }
            let released = response.phase == Phase::Released && response.ok && pending.abandoned;
            pending.response = Some(if response.ok {
                Ok(())
            } else {
                Err(response.error)
            });
            let waker = pending.waker.take();
            if released {
                slot.take();
            }
            (waker, released)
        };
        if released {
            (self.changed)(false);
        }
        if let Some(waker) = waker {
            waker.wake();
        }
        Ok(())
    }
    async fn wait(&self, id: u64) -> Result<(), String> {
        poll_fn(|context| {
            if self.closed.get() {
                return Poll::Ready(Err("application preparation owner retired".into()));
            }
            let mut pending = self.pending.borrow_mut();
            let Some(pending) = pending.as_mut().filter(|pending| pending.id == id) else {
                return Poll::Ready(Err("application preparation request retired".into()));
            };
            if let Some(response) = pending.response.take() {
                return Poll::Ready(response);
            }
            pending.waker = Some(context.waker().clone());
            Poll::Pending
        })
        .await
    }
    pub(super) fn refuse_after_save(
        self: &Rc<Self>,
        send: SendEvent,
        unavailable: String,
    ) -> InstallPreparation {
        let preparation = self.clone();
        Box::pin(async move {
            if preparation.closed.get() {
                return Err("application preparation owner retired".into());
            }
            if preparation.active() {
                return Err("application preparation is already active".into());
            }
            let id = preparation
                .next
                .get()
                .checked_add(1)
                .ok_or("preparation request ids exhausted")?;
            preparation.next.set(id);
            *preparation.pending.borrow_mut() = Some(Pending {
                id,
                phase: Phase::Prepared,
                response: None,
                waker: None,
                abandoned: false,
            });
            (preparation.changed)(true);
            let mut reservation = Reservation {
                preparation: preparation.clone(),
                send,
                id,
                active: true,
            };
            (reservation.send)(message("update-prepare", id))?;
            let saved = preparation.wait(id).await;
            // Installation is still unqualified. Even a successful save must
            // release admission and await the acknowledgement before refusal.
            if let Some(pending) = preparation.pending.borrow_mut().as_mut() {
                pending.phase = Phase::Released;
                pending.response = None;
            }
            (reservation.send)(message("update-abort", id))?;
            preparation.wait(id).await?;
            preparation.pending.borrow_mut().take();
            (preparation.changed)(false);
            reservation.active = false;
            match saved {
                Ok(()) => Err(unavailable),
                Err(error) => Err(error),
            }
        })
    }
}
fn message(operation: &str, id: u64) -> PlatformEvent {
    PlatformEvent {
        operation: operation.into(),
        payload: json!({"id":id.to_string()}).to_string(),
    }
}
struct Reservation {
    preparation: Rc<Preparation>,
    send: SendEvent,
    id: u64,
    active: bool,
}
impl Drop for Reservation {
    fn drop(&mut self) {
        if self.active && !self.preparation.closed.get() {
            {
                let mut slot = self.preparation.pending.borrow_mut();
                if let Some(pending) = slot.as_mut().filter(|pending| pending.id == self.id) {
                    pending.phase = Phase::Released;
                    pending.response = None;
                    pending.waker = None;
                    pending.abandoned = true;
                }
            }
            // Keep admission closed until the matching acknowledgement. A
            // failed send must not pretend that OCaml released its fence.
            if let Err(error) = (self.send)(message("update-abort", self.id)) {
                eprintln!("application update preparation cleanup: {error}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::task::Context;

    type Events = Rc<RefCell<Vec<PlatformEvent>>>;
    fn fixture() -> (Rc<Preparation>, SendEvent, Events) {
        let preparation = Rc::new(Preparation::new(|_| {}));
        let events = Rc::new(RefCell::new(Vec::new()));
        let record = events.clone();
        let send = Rc::new(move |event| {
            record.borrow_mut().push(event);
            Ok(())
        });
        (preparation, send, events)
    }
    fn poll(
        future: &mut InstallPreparation,
    ) -> Poll<Result<Option<lui_nsh::desktop_updates::InstallLease>, String>> {
        future
            .as_mut()
            .poll(&mut Context::from_waker(Waker::noop()))
    }
    fn answer(preparation: &Preparation, id: &str, phase: &str, ok: bool) -> Result<(), String> {
        preparation.response(
            &json!({"id":id,"phase":phase,"ok":ok,
            "error":if ok { "" } else { "save refused" }})
            .to_string(),
        )
    }
    fn expect_refused(future: &mut InstallPreparation, expected: &str) {
        match poll(future) {
            Poll::Ready(Err(error)) => assert_eq!(error, expected),
            _ => panic!("unqualified update must refuse without producing an install lease"),
        }
    }
    #[test]
    fn successful_save_waits_for_release_ack_before_translated_refusal() {
        let (preparation, send, events) = fixture();
        let mut future = preparation.refuse_after_save(send, "无法安全安装更新".into());
        assert!(poll(&mut future).is_pending());
        assert!(preparation.active());
        assert_eq!(events.borrow()[0].operation, "update-prepare");
        answer(&preparation, "1", "prepared", true).unwrap();
        assert!(poll(&mut future).is_pending());
        assert!(preparation.active());
        assert_eq!(events.borrow()[1].operation, "update-abort");
        answer(&preparation, "1", "released", true).unwrap();
        expect_refused(&mut future, "无法安全安装更新");
        assert!(!preparation.active());
        assert_eq!(events.borrow().len(), 2);
    }
    #[test]
    fn failed_save_still_releases_before_reporting_the_error() {
        let (preparation, send, _) = fixture();
        let mut future = preparation.refuse_after_save(send, "无法安全安装更新".into());
        assert!(poll(&mut future).is_pending());
        answer(&preparation, "1", "prepared", false).unwrap();
        assert!(poll(&mut future).is_pending());
        answer(&preparation, "1", "released", true).unwrap();
        expect_refused(&mut future, "save refused");
        assert!(!preparation.active());
    }
    #[test]
    fn cancelled_owner_waits_for_matching_abort_ack_and_old_replies_are_inert() {
        let (preparation, send, events) = fixture();
        let mut future = preparation.refuse_after_save(send.clone(), "unavailable".into());
        assert!(poll(&mut future).is_pending());
        drop(future);
        assert!(preparation.active());
        assert_eq!(events.borrow()[1].operation, "update-abort");
        answer(&preparation, "1", "prepared", true).unwrap();
        assert!(preparation.active());
        answer(&preparation, "1", "released", true).unwrap();
        assert!(!preparation.active());
        let mut next = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut next).is_pending());
        answer(&preparation, "1", "released", true).unwrap();
        assert!(preparation.active());
        assert!(poll(&mut next).is_pending());
        answer(&preparation, "2", "released", true).unwrap_err();
        answer(&preparation, "3", "prepared", true).unwrap_err();
    }
    #[test]
    fn lost_abort_transport_cannot_reopen_application_admission() {
        let (preparation, _, events) = fixture();
        let record = events.clone();
        let send = Rc::new(move |event: PlatformEvent| {
            let abort = event.operation == "update-abort";
            record.borrow_mut().push(event);
            if abort {
                Err("application queue unavailable".into())
            } else {
                Ok(())
            }
        });
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut future).is_pending());
        answer(&preparation, "1", "prepared", true).unwrap();
        expect_refused(&mut future, "application queue unavailable");
        assert!(preparation.active());
        assert_eq!(
            events
                .borrow()
                .iter()
                .filter(|event| event.operation == "update-abort")
                .count(),
            2
        );
    }
    #[test]
    fn abandoned_failed_release_keeps_the_fence_until_a_successful_retry() {
        let (preparation, send, _) = fixture();
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut future).is_pending());
        drop(future);
        answer(&preparation, "1", "released", false).unwrap();
        answer(&preparation, "1", "released", false).unwrap();
        assert!(preparation.active());
        answer(&preparation, "1", "prepared", true).unwrap();
        assert!(preparation.active());
        answer(&preparation, "2", "released", true).unwrap_err();
        answer(&preparation, "1", "released", true).unwrap();
        assert!(!preparation.active());
    }
    #[test]
    fn live_waiter_still_rejects_duplicate_failed_release() {
        let (preparation, send, _) = fixture();
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut future).is_pending());
        answer(&preparation, "1", "prepared", true).unwrap();
        assert!(poll(&mut future).is_pending());
        answer(&preparation, "1", "released", false).unwrap();
        answer(&preparation, "1", "released", false).unwrap_err();
        assert!(preparation.active());
        expect_refused(&mut future, "save refused");
        drop(future);
        answer(&preparation, "1", "released", false).unwrap();
        assert!(preparation.active());
        answer(&preparation, "1", "released", true).unwrap();
        assert!(!preparation.active());
    }
    #[test]
    fn retired_preparation_owner_cannot_begin_a_new_request() {
        let (preparation, send, events) = fixture();
        preparation.close();
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        expect_refused(&mut future, "application preparation owner retired");
        assert!(events.borrow().is_empty());
    }
    #[test]
    fn retired_owner_does_not_send_abort_from_a_dropped_waiter() {
        let (preparation, send, events) = fixture();
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut future).is_pending());
        assert_eq!(events.borrow().len(), 1);
        preparation.close();
        drop(future);
        assert_eq!(events.borrow().len(), 1);
        assert_eq!(events.borrow()[0].operation, "update-prepare");
        assert!(!preparation.active());
    }
}
