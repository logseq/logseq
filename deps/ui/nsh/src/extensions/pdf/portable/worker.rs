//! One document owner thread with a coalesced viewport and bounded finite jobs.
//! No PDFium handle crosses the thread; every result carries its captured epoch.
use super::engine::{
    self, Error, OutlineEntry, PageInfo, PageText, Raster, SearchHit, Selection, Tile,
};
use std::{
    collections::VecDeque,
    path::PathBuf,
    sync::{
        Arc, Condvar, Mutex,
        atomic::{AtomicBool, AtomicU64, Ordering},
    },
    thread::{self, JoinHandle},
};

pub enum Event {
    Opened {
        epoch: u64,
        pages: Vec<PageInfo>,
    },
    PasswordRequired {
        epoch: u64,
    },
    Failed {
        epoch: u64,
        message: String,
        viewport_revision: Option<u64>,
        search_revision: Option<u64>,
    },
    Viewport {
        epoch: u64,
        revision: u64,
        page: usize,
        raster: Raster,
        text: Arc<PageText>,
    },
    Selected {
        epoch: u64,
        selection: Selection,
    },
    Area {
        epoch: u64,
        page: usize,
        width: i32,
        tile: Tile,
        png: Vec<u8>,
    },
    Search {
        epoch: u64,
        revision: u64,
        query: String,
        hits: Vec<SearchHit>,
    },
    Outline {
        epoch: u64,
        entries: Vec<OutlineEntry>,
    },
    Closed {
        epoch: u64,
    },
}
impl Event {
    pub fn epoch(&self) -> u64 {
        match self {
            Self::Opened { epoch, .. }
            | Self::PasswordRequired { epoch }
            | Self::Failed { epoch, .. }
            | Self::Viewport { epoch, .. }
            | Self::Selected { epoch, .. }
            | Self::Area { epoch, .. }
            | Self::Search { epoch, .. }
            | Self::Outline { epoch, .. }
            | Self::Closed { epoch } => *epoch,
        }
    }
}
#[derive(Clone)]
pub struct Viewport {
    pub epoch: u64,
    pub revision: u64,
    pub page: usize,
    pub width: i32,
    pub tile: Tile,
}
struct Open {
    epoch: u64,
    path: PathBuf,
    password: Option<String>,
}
enum Command {
    Open(Open),
    Close(u64),
    Viewport(Vec<Viewport>),
    Select {
        epoch: u64,
        page: usize,
        width: i32,
        start: usize,
        end: usize,
    },
    Area {
        epoch: u64,
        page: usize,
        width: i32,
        tile: Tile,
    },
    Search {
        epoch: u64,
        revision: u64,
        query: String,
        width: i32,
        match_case: bool,
        whole_word: bool,
    },
    Outline(u64),
    Stop,
}
impl Command {
    fn epoch(&self) -> Option<u64> {
        match self {
            Self::Open(open) => Some(open.epoch),
            Self::Viewport(viewports) => viewports.first().map(|viewport| viewport.epoch),
            Self::Close(epoch)
            | Self::Outline(epoch)
            | Self::Select { epoch, .. }
            | Self::Area { epoch, .. }
            | Self::Search { epoch, .. } => Some(*epoch),
            Self::Stop => None,
        }
    }
}
#[derive(Default)]
struct Pending {
    finite: VecDeque<Command>,
    viewport: Option<Vec<Viewport>>,
}
struct State {
    pending: Mutex<Pending>,
    wake: Condvar,
    epoch: AtomicU64,
    revision: AtomicU64,
    search_revision: AtomicU64,
    stopped: AtomicBool,
    closing: AtomicBool,
}
impl State {
    fn current(&self, epoch: u64) -> bool {
        !self.stopped.load(Ordering::Acquire) && self.epoch.load(Ordering::Acquire) == epoch
    }
    fn emit(&self, event: Event, output: &dyn Fn(Event)) {
        if self.current(event.epoch())
            && (!self.closing.load(Ordering::Acquire) || matches!(event, Event::Closed { .. }))
        {
            output(event);
        }
    }
    fn next(&self) -> Command {
        let mut pending = self.pending.lock().expect("PDF worker mailbox poisoned");
        loop {
            if self.stopped.load(Ordering::Acquire) {
                return Command::Stop;
            }
            if let Some(command) = pending.finite.pop_front() {
                return command;
            }
            if let Some(viewport) = pending.viewport.take() {
                return Command::Viewport(viewport);
            }
            pending = self
                .wake
                .wait(pending)
                .expect("PDF worker mailbox poisoned");
        }
    }
    fn failure(&self, epoch: u64, error: Error, output: &dyn Fn(Event)) {
        self.failure_for(epoch, error, None, None, output);
    }
    fn failure_for(
        &self,
        epoch: u64,
        error: Error,
        viewport_revision: Option<u64>,
        search_revision: Option<u64>,
        output: &dyn Fn(Event),
    ) {
        self.emit(
            match error {
                Error::Password => Event::PasswordRequired { epoch },
                error => Event::Failed {
                    epoch,
                    message: error.to_string(),
                    viewport_revision,
                    search_revision,
                },
            },
            output,
        );
    }
}

pub struct Worker {
    state: Arc<State>,
    thread: Option<JoinHandle<()>>,
}
impl Worker {
    pub fn new(
        library: PathBuf,
        output: impl Fn(Event) + Send + Sync + 'static,
    ) -> Result<Self, Error> {
        if !library.is_absolute() {
            return Err(Error::Failure(
                "PDF worker library path must be absolute".into(),
            ));
        }
        let state = Arc::new(State {
            pending: Mutex::new(Pending::default()),
            wake: Condvar::new(),
            epoch: AtomicU64::new(0),
            revision: AtomicU64::new(0),
            search_revision: AtomicU64::new(0),
            stopped: AtomicBool::new(false),
            closing: AtomicBool::new(false),
        });
        let worker = state.clone();
        let thread = thread::Builder::new()
            .name("logseq-pdf".into())
            .spawn(move || run(&worker, &library, &output))
            .map_err(|error| Error::Failure(error.to_string()))?;
        Ok(Self {
            state,
            thread: Some(thread),
        })
    }
    pub fn open(&self, path: PathBuf, password: Option<String>) -> Result<u64, Error> {
        if !path.is_absolute() {
            return Err(Error::Failure(
                "PDF worker document path must be absolute".into(),
            ));
        }
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        if self.state.stopped.load(Ordering::Acquire) {
            return Err(Error::Failure("PDF worker is stopped".into()));
        }
        let previous = self.state.epoch.load(Ordering::Acquire);
        let epoch = previous
            .checked_add(1)
            .ok_or_else(|| Error::Failure("PDF owner epoch is exhausted".into()))?;
        self.state.epoch.store(epoch, Ordering::Release);
        self.state.revision.store(0, Ordering::Release);
        self.state.closing.store(false, Ordering::Release);
        pending.finite.clear();
        pending.viewport = None;
        pending.finite.push_back(Command::Open(Open {
            epoch,
            path,
            password,
        }));
        self.state.wake.notify_one();
        Ok(epoch)
    }
    fn submit(&self, command: Command) -> Result<(), Error> {
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        if !command
            .epoch()
            .is_some_and(|epoch| self.state.current(epoch))
            || self.state.closing.load(Ordering::Acquire)
        {
            return Err(Error::Failure(
                "PDF request belongs to a retired or closing document".into(),
            ));
        }
        if pending.finite.len() >= 8 {
            return Err(Error::Failure("PDF finite-work mailbox is busy".into()));
        }
        pending.finite.push_back(command);
        self.state.wake.notify_one();
        Ok(())
    }
    pub fn viewport(&self, viewport: Viewport) -> Result<(), Error> {
        self.viewports(vec![viewport])
    }
    /// One revision contains only the visible page tiles, with a shared pixel
    /// budget. Scrolling replaces the whole batch, never an individual page.
    pub fn viewports(&self, viewports: Vec<Viewport>) -> Result<(), Error> {
        let first = viewports.first().ok_or_else(|| {
            Error::Failure("PDF viewport batch must contain a visible tile".into())
        })?;
        let epoch = first.epoch;
        let revision = first.revision;
        let mut pixels = 0_i64;
        for viewport in &viewports {
            if viewport.epoch != epoch
                || viewport.revision != revision
                || viewport.page == 0
                || viewport.width <= 0
                || viewport.tile.x < 0
                || viewport.tile.y < 0
                || viewport.tile.width <= 0
                || viewport.tile.height <= 0
            {
                return Err(Error::Failure(
                    "PDF viewport batch has inconsistent owner or geometry".into(),
                ));
            }
            pixels = pixels
                .checked_add(i64::from(viewport.tile.width) * i64::from(viewport.tile.height))
                .ok_or_else(|| Error::Failure("PDF viewport pixel budget overflowed".into()))?;
        }
        if viewports.len() > 8 || pixels > 8 * 1024 * 1024 {
            return Err(Error::Failure(
                "PDF visible viewport exceeds its tile/pixel budget".into(),
            ));
        }
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        if !self.state.current(epoch) || self.state.closing.load(Ordering::Acquire) {
            return Err(Error::Failure(
                "PDF viewport belongs to a retired or closing document".into(),
            ));
        }
        if revision <= self.state.revision.load(Ordering::Acquire) {
            return Err(Error::Failure(
                "PDF viewport revision is not newer than its owner state".into(),
            ));
        }
        self.state.revision.store(revision, Ordering::Release);
        pending.viewport = Some(viewports);
        self.state.wake.notify_one();
        Ok(())
    }
    pub fn select(
        &self,
        epoch: u64,
        page: usize,
        width: i32,
        start: usize,
        end: usize,
    ) -> Result<(), Error> {
        self.submit(Command::Select {
            epoch,
            page,
            width,
            start,
            end,
        })
    }
    pub fn area(&self, epoch: u64, page: usize, width: i32, tile: Tile) -> Result<(), Error> {
        self.submit(Command::Area {
            epoch,
            page,
            width,
            tile,
        })
    }
    pub fn search(
        &self,
        epoch: u64,
        query: String,
        width: i32,
        match_case: bool,
        whole_word: bool,
    ) -> Result<(), Error> {
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        if !self.state.current(epoch) || self.state.closing.load(Ordering::Acquire) {
            return Err(Error::Failure(
                "PDF search belongs to a retired or closing document".into(),
            ));
        }
        pending
            .finite
            .retain(|command| !matches!(command, Command::Search { .. }));
        if pending.finite.len() >= 8 {
            return Err(Error::Failure("PDF finite-work mailbox is busy".into()));
        }
        let revision = self
            .state
            .search_revision
            .load(Ordering::Acquire)
            .checked_add(1)
            .ok_or_else(|| Error::Failure("PDF search revision is exhausted".into()))?;
        self.state
            .search_revision
            .store(revision, Ordering::Release);
        pending.finite.push_back(Command::Search {
            epoch,
            revision,
            query,
            width,
            match_case,
            whole_word,
        });
        self.state.wake.notify_one();
        Ok(())
    }
    pub fn outline(&self, epoch: u64) -> Result<(), Error> {
        self.submit(Command::Outline(epoch))
    }
    pub fn close(&self, epoch: u64) -> Result<(), Error> {
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        if !self.state.current(epoch) {
            return Err(Error::Failure(
                "PDF close belongs to a retired document".into(),
            ));
        }
        if self.state.closing.load(Ordering::Acquire) {
            return Ok(());
        }
        self.state.closing.store(true, Ordering::Release);
        pending.finite.clear();
        pending.viewport = None;
        pending.finite.push_front(Command::Close(epoch));
        self.state.wake.notify_one();
        Ok(())
    }
    /// Join off the UI thread when independent exact-owner exit proof is needed.
    /// Closed is emitted only after the document/file scope has actually dropped.
    pub fn shutdown(mut self) -> JoinHandle<()> {
        self.stop();
        self.thread.take().expect("owned PDF worker thread")
    }
    fn stop(&self) {
        self.state.stopped.store(true, Ordering::Release);
        let mut pending = self
            .state
            .pending
            .lock()
            .expect("PDF worker mailbox poisoned");
        pending.finite.clear();
        pending.viewport = None;
        self.state.wake.notify_one();
    }
}
impl Drop for Worker {
    fn drop(&mut self) {
        // A forced native-widget disposal cannot join a blocking engine call on
        // the UI thread. Stop invalidates results; the thread still owns every
        // PDF object until its current call returns and drops the document.
        self.stop();
    }
}

enum DocumentExit {
    Open(Open),
    Close,
    Stop,
    Yield,
}
fn run(state: &State, library: &std::path::Path, output: &dyn Fn(Event)) {
    let mut next = None;
    loop {
        let open = match next
            .take()
            .map(Command::Open)
            .unwrap_or_else(|| state.next())
        {
            Command::Open(open) if state.current(open.epoch) => open,
            Command::Stop => return,
            Command::Close(epoch) => {
                state.emit(Event::Closed { epoch }, output);
                continue;
            }
            _ => continue,
        };
        let epoch = open.epoch;
        let result =
            engine::with_document(library, &open.path, open.password.as_deref(), |document| {
                let mut text_cache = VecDeque::new();
                let count = engine::page_count(document)?;
                if count == 0 || count > 100_000 {
                    return Err(Error::Failure(
                        "PDF page count exceeds its geometry budget".into(),
                    ));
                }
                let mut pages = Vec::with_capacity(count);
                for page in 1..=count {
                    if !state.current(epoch) || state.closing.load(Ordering::Acquire) {
                        return Ok(DocumentExit::Yield);
                    }
                    pages.push(engine::page_info(document, page)?);
                }
                state.emit(Event::Opened { epoch, pages }, output);
                loop {
                    let command = state.next();
                    match command {
                        Command::Open(open) => return Ok(DocumentExit::Open(open)),
                        Command::Close(closing) if closing == epoch => {
                            return Ok(DocumentExit::Close);
                        }
                        Command::Stop => return Ok(DocumentExit::Stop),
                        command
                            if command.epoch() == Some(epoch)
                                && state.current(epoch)
                                && !state.closing.load(Ordering::Acquire) =>
                        {
                            let viewport_revision = match &command {
                                Command::Viewport(viewports) => {
                                    viewports.first().map(|viewport| viewport.revision)
                                }
                                _ => None,
                            };
                            let search_revision = match &command {
                                Command::Search { revision, .. } => Some(*revision),
                                _ => None,
                            };
                            if let Err(error) =
                                execute(state, document, command, &mut text_cache, output)
                            {
                                // An obsolete engine failure cannot replace a
                                // newer viewport/search with an error banner.
                                if viewport_revision.is_none_or(|revision| {
                                    state.revision.load(Ordering::Acquire) == revision
                                }) && search_revision.is_none_or(|revision| {
                                    state.search_revision.load(Ordering::Acquire) == revision
                                }) {
                                    state.failure_for(
                                        epoch,
                                        error,
                                        viewport_revision,
                                        search_revision,
                                        output,
                                    );
                                }
                            }
                        }
                        _ => {}
                    }
                }
            });
        // with_document has dropped both document and its file-backed reader.
        match result {
            Ok(DocumentExit::Open(open)) => next = Some(open),
            Ok(DocumentExit::Close) => state.emit(Event::Closed { epoch }, output),
            Ok(DocumentExit::Stop) => return,
            Ok(DocumentExit::Yield) => {}
            Err(error) => state.failure(epoch, error, output),
        }
    }
}
fn execute(
    state: &State,
    document: &pdfium_render::prelude::PdfDocument<'_>,
    command: Command,
    text_cache: &mut VecDeque<((usize, i32), Arc<PageText>)>,
    output: &dyn Fn(Event),
) -> Result<(), Error> {
    match command {
        Command::Viewport(viewports) => {
            let mut retained_text = Vec::<Arc<PageText>>::new();
            let mut retained_bytes = 0_usize;
            for viewport in viewports {
                if state.revision.load(Ordering::Acquire) != viewport.revision {
                    return Ok(());
                }
                let raster =
                    engine::raster(document, viewport.page, viewport.width, viewport.tile)?;
                if !state.current(viewport.epoch)
                    || state.revision.load(Ordering::Acquire) != viewport.revision
                    || state.closing.load(Ordering::Acquire)
                {
                    return Ok(());
                }
                let key = (viewport.page, viewport.width);
                let text =
                    if let Some(index) = text_cache.iter().position(|(cached, _)| *cached == key) {
                        let entry = text_cache
                            .remove(index)
                            .expect("known PDF text-cache position");
                        let text = entry.1.clone();
                        text_cache.push_back(entry);
                        text
                    } else {
                        let text =
                            Arc::new(engine::page_text(document, viewport.page, viewport.width)?);
                        let size = |text: &PageText| {
                            text.glyphs.capacity() * std::mem::size_of::<engine::Glyph>()
                                + std::mem::size_of::<PageText>()
                        };
                        let bytes = size(&text);
                        const BUDGET: usize = 64 * 1024 * 1024;
                        if bytes > BUDGET {
                            return Err(Error::Failure(
                                "PDF page text exceeds its retained byte budget".into(),
                            ));
                        }
                        while text_cache.len() >= 3
                            || text_cache.iter().map(|(_, text)| size(text)).sum::<usize>() + bytes
                                > BUDGET
                        {
                            text_cache.pop_front();
                        }
                        text_cache.push_back((key, text.clone()));
                        text
                    };
                if !retained_text.iter().any(|old| Arc::ptr_eq(old, &text)) {
                    retained_bytes += text.glyphs.capacity() * std::mem::size_of::<engine::Glyph>();
                    if retained_bytes > 64 * 1024 * 1024 {
                        return Err(Error::Failure(
                            "PDF visible text exceeds its retained byte budget".into(),
                        ));
                    }
                    retained_text.push(text.clone());
                }
                if state.revision.load(Ordering::Acquire) == viewport.revision {
                    state.emit(
                        Event::Viewport {
                            epoch: viewport.epoch,
                            revision: viewport.revision,
                            page: viewport.page,
                            raster,
                            text,
                        },
                        output,
                    );
                }
            }
        }
        Command::Select {
            epoch,
            page,
            width,
            start,
            end,
        } => {
            let selection = engine::selection(document, page, width, start, end)?;
            state.emit(Event::Selected { epoch, selection }, output);
        }
        Command::Area {
            epoch,
            page,
            width,
            tile,
        } => {
            let png = engine::area_png(document, page, width, tile)?;
            state.emit(
                Event::Area {
                    epoch,
                    page,
                    width,
                    tile,
                    png,
                },
                output,
            );
        }
        Command::Search {
            epoch,
            revision,
            query,
            width,
            match_case,
            whole_word,
        } => {
            let mut hits = Vec::new();
            let pages = if query.is_empty() {
                0
            } else {
                engine::page_count(document)?
            };
            for page in 1..=pages {
                if !state.current(epoch) || state.closing.load(Ordering::Acquire) {
                    return Ok(());
                }
                if state.search_revision.load(Ordering::Acquire) != revision {
                    return Ok(());
                }
                hits.extend(engine::search(
                    document, page, width, &query, match_case, whole_word,
                )?);
                if hits.len() > 20_000 {
                    return Err(Error::Failure(
                        "PDF document search exceeds its result budget".into(),
                    ));
                }
            }
            if state.search_revision.load(Ordering::Acquire) == revision {
                state.emit(
                    Event::Search {
                        epoch,
                        revision,
                        query,
                        hits,
                    },
                    output,
                );
            }
        }
        Command::Outline(epoch) => state.emit(
            Event::Outline {
                epoch,
                entries: engine::outline(document)?,
            },
            output,
        ),
        _ => {
            return Err(Error::Failure(
                "PDF work reached the wrong document operation".into(),
            ));
        }
    }
    Ok(())
}
