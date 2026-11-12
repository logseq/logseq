//! A bounded per-reader completion queue. Only an attached Source may touch GTK.
//! MainContext::invoke is deliberately unsuitable: it may run inline when the
//! context is unowned, including after its GTK loop has stopped.
use super::worker::Event;
use nsh_platform_linux::gtk4::{gio, glib, prelude::*};
use std::{
    collections::VecDeque,
    sync::{Arc, Condvar, Mutex, Weak},
};

const CAPACITY: usize = 16;
const BYTE_BUDGET: usize = 128 * 1024 * 1024;
struct Pending {
    live: bool,
    epoch: u64,
    bytes: usize,
    events: VecDeque<(Event, usize)>,
    source: Option<glib::Source>,
}
struct Shared {
    context: glib::MainContext,
    target: glib::SendWeakRef<gio::SimpleAction>,
    pending: Mutex<Pending>,
    space: Condvar,
}
#[derive(Clone)]
pub struct Sender(Arc<Shared>);
/// Retain on the GTK owner, dispose before releasing its worker/widget state.
/// The action holds only the caller's explicitly weak owner callback.
pub struct Completion {
    action: gio::SimpleAction,
    shared: Arc<Shared>,
}
impl Completion {
    pub fn new(context: glib::MainContext, receive: impl Fn(Event) + 'static) -> Self {
        let action = gio::SimpleAction::new("pdf-completion", None);
        let shared = Arc::new(Shared {
            context,
            target: action.downgrade().into(),
            pending: Mutex::new(Pending {
                live: true,
                epoch: 0,
                bytes: 0,
                events: VecDeque::new(),
                source: None,
            }),
            space: Condvar::new(),
        });
        let weak = Arc::downgrade(&shared);
        action.connect_activate(move |_, _| {
            let Some(shared) = weak.upgrade() else { return };
            let events = {
                let mut pending = shared
                    .pending
                    .lock()
                    .expect("PDF completion queue poisoned");
                pending.source.take();
                pending.bytes = 0;
                std::mem::take(&mut pending.events)
            };
            shared.space.notify_all();
            for (event, _) in events {
                let admitted = {
                    let pending = shared
                        .pending
                        .lock()
                        .expect("PDF completion queue poisoned");
                    pending.live && pending.epoch == event.epoch()
                };
                if admitted {
                    // Recheck each event: the previous callback may dispose the
                    // owner or synchronously open a different document.
                    receive(event);
                }
            }
        });
        Self { action, shared }
    }
    pub fn sender(&self) -> Sender {
        Sender(self.shared.clone())
    }
    /// Called after Worker::open. An unusually fast worker may already have
    /// published that epoch; preserve its results instead of dropping Opened.
    pub fn set_epoch(&self, epoch: u64) {
        let mut pending = self
            .shared
            .pending
            .lock()
            .expect("PDF completion queue poisoned");
        assert!(
            epoch >= pending.epoch,
            "PDF owner cannot move to an older epoch"
        );
        if epoch > pending.epoch {
            pending.epoch = epoch;
            pending.events.clear();
            pending.bytes = 0;
        }
        self.shared.space.notify_all();
    }
    pub fn dispose(&self) {
        let source = {
            let mut pending = self
                .shared
                .pending
                .lock()
                .expect("PDF completion queue poisoned");
            pending.live = false;
            pending.events.clear();
            pending.bytes = 0;
            pending.source.take()
        };
        self.action.set_enabled(false);
        if let Some(source) = source {
            source.destroy();
        }
        self.shared.space.notify_all();
    }
}
impl Drop for Completion {
    fn drop(&mut self) {
        self.dispose();
    }
}
impl Sender {
    pub fn send(&self, mut event: Event) {
        let mut bytes = event_bytes(&event);
        if bytes > BYTE_BUDGET {
            let (viewport_revision, search_revision) = match &event {
                Event::Viewport { revision, .. } => (Some(*revision), None),
                Event::Search { revision, .. } => (None, Some(*revision)),
                Event::Failed {
                    viewport_revision,
                    search_revision,
                    ..
                } => (*viewport_revision, *search_revision),
                _ => (None, None),
            };
            event = Event::Failed {
                epoch: event.epoch(),
                message: "PDF completion exceeds its retained byte budget".into(),
                viewport_revision,
                search_revision,
            };
            bytes = event_bytes(&event);
        }
        let mut pending = self
            .0
            .pending
            .lock()
            .expect("PDF completion queue poisoned");
        loop {
            if !pending.live || event.epoch() < pending.epoch {
                return;
            }
            if event.epoch() > pending.epoch {
                pending.epoch = event.epoch();
                pending.events.clear();
                pending.bytes = 0;
            }
            if pending.events.len() < CAPACITY && pending.bytes + bytes <= BYTE_BUDGET {
                break;
            }
            pending = self
                .0
                .space
                .wait(pending)
                .expect("PDF completion queue poisoned");
        }
        pending.bytes += bytes;
        pending.events.push_back((event, bytes));
        if pending.source.is_some() {
            return;
        }
        let weak: Weak<Shared> = Arc::downgrade(&self.0);
        let source = glib::source::idle_source_new(
            Some("logseq-pdf-completion"),
            glib::Priority::DEFAULT,
            move || {
                let Some(shared) = weak.upgrade() else {
                    return glib::ControlFlow::Break;
                };
                // attach() never invokes inline. This upgrade runs only when the
                // captured GTK main context dispatches this exact event source.
                if let Some(action) = shared.target.upgrade() {
                    action.activate(None);
                }
                glib::ControlFlow::Break
            },
        );
        source.attach(Some(&self.0.context));
        pending.source = Some(source);
    }
}
fn event_bytes(event: &Event) -> usize {
    use std::mem::size_of;
    size_of::<Event>()
        + match event {
            Event::Opened { pages, .. } => pages.capacity() * size_of::<super::engine::PageInfo>(),
            Event::Viewport { raster, text, .. } => {
                raster.rgba.capacity() + text.glyphs.capacity() * size_of::<super::engine::Glyph>()
            }
            Event::Selected { selection, .. } => {
                selection.text.capacity()
                    + selection.rects.capacity() * size_of::<super::engine::Bounds>()
            }
            Event::Area { png, .. } => png.capacity(),
            Event::Search { query, hits, .. } => {
                query.capacity()
                    + hits.capacity() * size_of::<super::engine::SearchHit>()
                    + hits
                        .iter()
                        .map(|hit| hit.bounds.capacity() * size_of::<super::engine::Bounds>())
                        .sum::<usize>()
            }
            Event::Outline { entries, .. } => {
                entries.capacity() * size_of::<super::engine::OutlineEntry>()
                    + entries
                        .iter()
                        .filter_map(|entry| entry.title.as_ref())
                        .map(String::capacity)
                        .sum::<usize>()
            }
            Event::Failed { message, .. } => message.capacity(),
            Event::PasswordRequired { .. } | Event::Closed { .. } => 0,
        }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{cell::RefCell, rc::Rc, thread};

    #[test]
    fn completion_waits_for_owner_context_and_late_work_cannot_revive_it() {
        let context = glib::MainContext::new();
        let owner_thread = thread::current().id();
        let received = Rc::new(RefCell::new(Vec::new()));
        let observed = received.clone();
        let completion = Completion::new(context.clone(), move |event| {
            assert_eq!(thread::current().id(), owner_thread);
            observed.borrow_mut().push(event.epoch());
        });
        let sender = completion.sender();
        thread::spawn(move || sender.send(Event::Closed { epoch: 1 }))
            .join()
            .unwrap();
        completion.set_epoch(1);
        assert!(
            received.borrow().is_empty(),
            "unowned context must not run worker callback inline"
        );
        assert!(context.iteration(false));
        assert_eq!(&*received.borrow(), &[1]);
        let sender = completion.sender();
        thread::spawn(move || sender.send(Event::Closed { epoch: 2 }))
            .join()
            .unwrap();
        completion.set_epoch(2);
        completion.dispose();
        let sender = completion.sender();
        thread::spawn(move || sender.send(Event::Closed { epoch: 3 }))
            .join()
            .unwrap();
        while context.pending() {
            context.iteration(false);
        }
        assert_eq!(
            &*received.borrow(),
            &[1],
            "destroyed source and late producer cannot touch retired owner"
        );
    }

    #[test]
    fn newer_document_discards_queued_old_completions_without_losing_fast_open() {
        let context = glib::MainContext::new();
        let received = Rc::new(RefCell::new(Vec::new()));
        let observed = received.clone();
        let completion = Completion::new(context.clone(), move |event| {
            observed.borrow_mut().push(event.epoch())
        });
        let sender = completion.sender();
        thread::spawn(move || {
            sender.send(Event::Closed { epoch: 1 });
            sender.send(Event::Closed { epoch: 2 });
            sender.send(Event::Closed { epoch: 1 });
        })
        .join()
        .unwrap();
        completion.set_epoch(2);
        while context.pending() {
            context.iteration(false);
        }
        assert_eq!(&*received.borrow(), &[2]);
    }
}
