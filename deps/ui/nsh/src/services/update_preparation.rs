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
    fn reserve(self: &Rc<Self>, send: SendEvent) -> Result<Reservation, String> {
        if self.closed.get() {
            return Err("application preparation owner retired".into());
        }
        if self.active() {
            return Err("application preparation is already active".into());
        }
        let id = self
            .next
            .get()
            .checked_add(1)
            .ok_or("preparation request ids exhausted")?;
        self.next.set(id);
        *self.pending.borrow_mut() = Some(Pending {
            id,
            phase: Phase::Prepared,
            response: None,
            waker: None,
            abandoned: false,
        });
        (self.changed)(true);
        Ok(Reservation {
            preparation: self.clone(),
            send,
            id,
            active: true,
        })
    }
    // The application runner supplies its own captured post-teardown restart.
    // The same reservation owns preparation, cancellation and the final lease.
    pub(super) fn prepare_install(
        self: &Rc<Self>,
        send: SendEvent,
        relaunch: impl FnOnce() -> Result<(), String> + 'static,
    ) -> InstallPreparation {
        let preparation = self.clone();
        Box::pin(async move {
            let mut reservation = preparation.reserve(send)?;
            let id = reservation.id;
            (reservation.send)(message("update-prepare", id))?;
            if let Err(error) = preparation.wait(id).await {
                reservation.release().await?;
                return Err(error);
            }
            // The SDK alone decides whether abort is safe after dispatch. A
            // captured Drop guard must not resume writes when a committed
            // lease consumes its relaunch callback or is cancelled in flight.
            reservation.active = false;
            Ok(Some(lui_nsh::desktop_updates::InstallLease::new(
                move || reservation.abandon(),
                move || {
                    if preparation.closed.get()
                        || !preparation
                            .pending
                            .borrow()
                            .as_ref()
                            .is_some_and(|pending| {
                                pending.id == id && pending.phase == Phase::Prepared
                            })
                    {
                        return Err("application installation reservation retired".into());
                    }
                    relaunch()
                },
            )))
        })
    }
    pub(super) fn refuse_after_save(
        self: &Rc<Self>,
        send: SendEvent,
        unavailable: String,
    ) -> InstallPreparation {
        let preparation = self.clone();
        Box::pin(async move {
            let mut reservation = preparation.reserve(send)?;
            let id = reservation.id;
            (reservation.send)(message("update-prepare", id))?;
            let saved = preparation.wait(id).await;
            // A root without a standalone process owner still releases
            // admission and awaits acknowledgement before refusing.
            reservation.release().await?;
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
impl Reservation {
    async fn release(&mut self) -> Result<(), String> {
        if self.preparation.closed.get() {
            return Err("application preparation owner retired".into());
        }
        {
            let mut slot = self.preparation.pending.borrow_mut();
            let pending = slot
                .as_mut()
                .filter(|pending| pending.id == self.id)
                .ok_or("application preparation request retired")?;
            pending.phase = Phase::Released;
            pending.response = None;
        }
        (self.send)(message("update-abort", self.id))?;
        self.preparation.wait(self.id).await?;
        self.preparation.pending.borrow_mut().take();
        (self.preparation.changed)(false);
        self.active = false;
        Ok(())
    }
    fn abandon(&self) {
        if !self.preparation.closed.get() {
            {
                let mut slot = self.preparation.pending.borrow_mut();
                let Some(pending) = slot.as_mut().filter(|pending| pending.id == self.id) else {
                    return;
                };
                pending.phase = Phase::Released;
                pending.response = None;
                pending.waker = None;
                pending.abandoned = true;
            }
            // Keep admission closed until the matching acknowledgement. A
            // failed send must not pretend that OCaml released its fence.
            if let Err(error) = (self.send)(message("update-abort", self.id)) {
                eprintln!("application update preparation cleanup: {error}");
            }
        }
    }
}
impl Drop for Reservation {
    fn drop(&mut self) {
        if self.active {
            self.abandon();
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
    #[derive(Clone, Copy)]
    enum LeaseAction {
        Start,
        Prepared,
        DropLease,
        Released,
        DropWaiter,
        Retire,
        Refused,
        FailedRelease,
    }
    fn advance_lease(
        future: &RefCell<Option<InstallPreparation>>,
        lease: &RefCell<Option<lui_nsh::desktop_updates::InstallLease>>,
        status: nsh_core::prelude::Signal<String>,
    ) {
        let outcome = future.borrow_mut().as_mut().map(poll);
        match outcome {
            Some(Poll::Ready(Ok(Some(prepared)))) => {
                future.borrow_mut().take();
                *lease.borrow_mut() = Some(prepared);
                status.set("lease".into());
            }
            Some(Poll::Ready(Err(error))) => {
                future.borrow_mut().take();
                status.set(error);
            }
            Some(Poll::Ready(Ok(None))) => panic!("candidate unexpectedly cancelled"),
            Some(Poll::Pending) => status.set("waiting".into()),
            None => (),
        }
    }
    #[nsh_core::prelude::component]
    fn LeaseProbe() -> impl nsh_core::prelude::IntoElement {
        use nsh_core::prelude::*;
        let status = signal("idle".to_owned());
        let held = signal(false);
        let events = signal(Vec::<String>::new());
        let preparation = Rc::new(Preparation::new(move |value| held.set(value)));
        let send: SendEvent = Rc::new(move |event| {
            let mut observed = events.get_untracked();
            observed.push(event.operation);
            events.set(observed);
            Ok(())
        });
        let future = Rc::new(RefCell::new(None));
        let lease = Rc::new(RefCell::new(None));
        let (lease_owner, ()) = nsh_core::element::create_root(|| ());
        let retired_preparation = preparation.clone();
        cleanup(move || {
            retired_preparation.close();
            lease_owner.dispose();
        });
        for (key, action) in [
            ("f1", LeaseAction::Start),
            ("f2", LeaseAction::Prepared),
            ("f3", LeaseAction::DropLease),
            ("f4", LeaseAction::Released),
            ("f5", LeaseAction::DropWaiter),
            ("f6", LeaseAction::Retire),
            ("f7", LeaseAction::Refused),
            ("f8", LeaseAction::FailedRelease),
        ] {
            let preparation = preparation.clone();
            let send = send.clone();
            let future = future.clone();
            let lease = lease.clone();
            on_key_with(
                key,
                KeyOptions {
                    when: nsh_core::keymap::When::Always,
                    ..Default::default()
                },
                move |_| match action {
                    LeaseAction::Start => {
                        *future.borrow_mut() =
                            Some(preparation.prepare_install(send.clone(), || Ok(())));
                        lease_owner.run(|| advance_lease(&future, &lease, status));
                    }
                    LeaseAction::Prepared | LeaseAction::Refused => {
                        answer(
                            &preparation,
                            "1",
                            "prepared",
                            matches!(action, LeaseAction::Prepared),
                        )
                        .unwrap();
                        lease_owner.run(|| advance_lease(&future, &lease, status));
                    }
                    LeaseAction::DropLease => {
                        lease.borrow_mut().take();
                        status.set("dropped".into());
                    }
                    LeaseAction::Released => {
                        answer(&preparation, "1", "released", true).unwrap();
                        status.set("released".into());
                        lease_owner.run(|| advance_lease(&future, &lease, status));
                    }
                    LeaseAction::DropWaiter => {
                        future.borrow_mut().take();
                        status.set("cancelled".into());
                    }
                    LeaseAction::Retire => {
                        preparation.close();
                        lease_owner.dispose();
                        future.borrow_mut().take();
                        lease.borrow_mut().take();
                        status.set("retired".into());
                    }
                    LeaseAction::FailedRelease => {
                        answer(&preparation, "1", "released", false).unwrap();
                        status.set("release failed".into());
                    }
                },
            );
        }
        text(move || {
            format!(
                "status={};held={};events={}",
                status.get(),
                held.get(),
                events.get().join(",")
            )
        })
    }
    fn start_lease_probe() -> nsh_testing::Headless {
        let mut config = nsh_engine::EngineConfig::new(nsh_engine::Root::of::<LeaseProbe>());
        config.environment.os = nsh_core::platform::Os::Linux;
        config.environment.idiom = nsh_core::platform::Idiom::Desktop;
        let mut app = nsh_testing::Headless::start(config).unwrap();
        // Key input does not resolve a view selector, so wait for this owner's
        // actual first commit before sending its first preparation action.
        app.wait_for("text:status=idle;held=false;events=").unwrap();
        app
    }
    #[test]
    fn candidate_lease_keeps_admission_until_its_abort_is_acknowledged() {
        let mut app = start_lease_probe();
        app.press_key("f1").unwrap();
        app.wait_for("text:status=waiting;held=true;events=update-prepare")
            .unwrap();
        app.press_key("f2").unwrap();
        app.wait_for("text:status=lease;held=true;events=update-prepare")
            .unwrap();
        app.press_key("f3").unwrap();
        app.wait_for("text:status=dropped;held=true;events=update-prepare,update-abort")
            .unwrap();
        app.press_key("f8").unwrap();
        app.press_key("f8").unwrap();
        app.wait_for("text:status=release failed;held=true;events=update-prepare,update-abort")
            .unwrap();
        app.press_key("f4").unwrap();
        app.wait_for("text:status=released;held=false;events=update-prepare,update-abort")
            .unwrap();
    }
    #[test]
    fn candidate_preparation_failure_waits_for_release_without_issuing_a_lease() {
        let mut app = start_lease_probe();
        app.press_key("f1").unwrap();
        app.press_key("f7").unwrap();
        app.wait_for("text:status=waiting;held=true;events=update-prepare,update-abort")
            .unwrap();
        app.press_key("f4").unwrap();
        app.wait_for("text:status=save refused;held=false;events=update-prepare,update-abort")
            .unwrap();
    }
    #[test]
    fn candidate_waiter_cancellation_uses_existing_correlated_release() {
        let mut app = start_lease_probe();
        app.press_key("f1").unwrap();
        app.press_key("f5").unwrap();
        app.wait_for("text:status=cancelled;held=true;events=update-prepare,update-abort")
            .unwrap();
        app.press_key("f4").unwrap();
        app.wait_for("text:status=released;held=false;events=update-prepare,update-abort")
            .unwrap();
    }
    #[test]
    fn retired_candidate_lease_cannot_send_abort_into_a_new_application_owner() {
        let mut app = start_lease_probe();
        app.press_key("f1").unwrap();
        app.press_key("f2").unwrap();
        app.press_key("f6").unwrap();
        app.wait_for("text:status=retired;held=false;events=update-prepare")
            .unwrap();
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
    fn retired_owner_does_not_send_abort_when_a_waiter_is_polled_again() {
        let (preparation, send, events) = fixture();
        let mut future = preparation.refuse_after_save(send, "unavailable".into());
        assert!(poll(&mut future).is_pending());
        preparation.close();
        expect_refused(&mut future, "application preparation owner retired");
        drop(future);
        assert_eq!(events.borrow().len(), 1);
        assert_eq!(events.borrow()[0].operation, "update-prepare");
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
