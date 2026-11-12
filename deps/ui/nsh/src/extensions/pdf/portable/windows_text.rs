//! Public generated COM TextPattern for the exact reader HWND and document epoch.
//! Providers/ranges retain weak state only; no engine, glyph cache or bitmap is
//! kept alive by an assistive-technology client after reader disposal.
use super::{
    engine::Bounds,
    text::Document,
    windows_window::{Handler, OwnedWindow},
};
use nsh_platform_windows::windows::{
    Win32::{
        Foundation::{E_INVALIDARG, HWND, LPARAM, LRESULT, POINT, RPC_E_WRONG_THREAD, WPARAM},
        Graphics::Gdi::{ClientToScreen, ScreenToClient},
        System::{Com::SAFEARRAY, Threading::GetCurrentThreadId, Variant::VARIANT},
        UI::{Accessibility::*, WindowsAndMessaging::WM_GETOBJECT},
    },
    core::{
        BOOL, BSTR, Error, HRESULT, IUnknown, IUnknownImpl, Interface, PCWSTR, Ref, Result,
        implement,
    },
};
use std::{
    cell::{Cell, RefCell},
    ops::Range,
    rc::{Rc, Weak},
    sync::Arc,
};
#[path = "windows_arrays.rs"]
mod arrays;
#[path = "windows_text_range.rs"]
mod range;

const OBJECT_BUDGET: usize = 512;
const VISIBLE_GLYPH_BUDGET: usize = 100_000;
pub enum Command {
    Select(Range<usize>),
    Scroll {
        range: Range<usize>,
        align_top: bool,
    },
}
pub struct GlyphRect {
    pub offset: usize,
    pub bounds: Bounds,
}
pub struct Scene {
    /// HWND-client physical pixels, already transformed/clipped by the reader.
    pub viewport: Bounds,
    pub glyphs: Vec<GlyphRect>,
    pub visible: Vec<Range<usize>>,
}
impl Default for Scene {
    fn default() -> Self {
        Self {
            viewport: Bounds {
                x1: 0.0,
                y1: 0.0,
                x2: 0.0,
                y2: 0.0,
            },
            glyphs: Vec::new(),
            visible: Vec::new(),
        }
    }
}
struct State {
    thread: u32,
    live: Cell<bool>,
    enabled: Cell<bool>,
    hwnd: Cell<Option<HWND>>,
    epoch: Cell<u64>,
    scene_revision: Cell<u64>,
    serial: Cell<u64>,
    objects: Cell<usize>,
    label: RefCell<String>,
    document: RefCell<Option<Arc<Document>>>,
    scene: RefCell<Scene>,
    selection: Cell<(usize, usize)>,
    callback: RefCell<Option<Rc<dyn Fn(Command) -> Result<()>>>>,
    provider: RefCell<Option<IRawElementProviderSimple>>,
}
/// HWND owner and text owner are retired together, including parent destruction.
/// All methods belong to NSH's OLE/UI apartment; no custom UI request queue.
pub struct TextHost {
    window: OwnedWindow,
    state: Rc<State>,
}
struct WindowHandler(Rc<State>);
impl Handler for WindowHandler {
    fn message(&self, hwnd: HWND, message: u32, wparam: WPARAM, lparam: LPARAM) -> Option<LRESULT> {
        if message != WM_GETOBJECT
            || lparam.0 as i32 != UiaRootObjectId
            || self.0.hwnd.get() != Some(hwnd)
        {
            return None;
        }
        match self.0.provider() {
            Ok(provider) => {
                // SAFETY: exact bound live HWND and generated COM interface.
                Some(unsafe { UiaReturnRawElementProvider(hwnd, wparam, lparam, &provider) })
            }
            Err(_) => Some(LRESULT(0)),
        }
    }
    fn retired(&self) {
        self.0.dispose();
    }
}
impl TextHost {
    pub fn new(
        label: String,
        epoch: u64,
        document: Arc<Document>,
        callback: impl Fn(Command) -> Result<()> + 'static,
    ) -> Result<Self> {
        if epoch == 0 || label.len() > 64 * 1024 {
            return Err(argument());
        }
        let state = Rc::new(State {
            // SAFETY: immutable owner-thread identity query.
            thread: unsafe { GetCurrentThreadId() },
            live: Cell::new(true),
            enabled: Cell::new(true),
            hwnd: Cell::new(None),
            epoch: Cell::new(epoch),
            scene_revision: Cell::new(0),
            serial: Cell::new(0),
            objects: Cell::new(0),
            label: RefCell::new(label),
            document: RefCell::new(Some(document)),
            scene: RefCell::new(Scene::default()),
            selection: Cell::new((0, 0)),
            callback: RefCell::new(Some(Rc::new(callback))),
            provider: RefCell::new(None),
        });
        let window = OwnedWindow::new(WindowHandler(state.clone()))?;
        state.hwnd.set(window.hwnd());
        Ok(Self { window, state })
    }
    pub fn hwnd(&self) -> Option<HWND> {
        self.window.hwnd()
    }
    pub fn provider(&self) -> Result<IRawElementProviderSimple> {
        self.state.provider()
    }
    pub fn set_enabled(&self, enabled: bool) -> Result<()> {
        let epoch = self.state.epoch.get();
        self.state.check(epoch)?;
        let previous = self.state.enabled.replace(enabled);
        if previous != enabled {
            let provider = self.state.provider.borrow().clone();
            if let Some(provider) = provider {
                // SAFETY: owned VARIANT values and this exact live provider.
                unsafe {
                    UiaRaiseAutomationPropertyChangedEvent(
                        &provider,
                        UIA_IsEnabledPropertyId,
                        &VARIANT::from(previous),
                        &VARIANT::from(enabled),
                    )?;
                }
            }
        }
        self.state.check(epoch)?;
        if self.state.enabled.get() != enabled {
            return Err(invalid_operation());
        }
        Ok(())
    }
    pub fn set_scene(&self, epoch: u64, revision: u64, scene: Scene) -> Result<bool> {
        self.state.check(epoch)?;
        if revision <= self.state.scene_revision.get() {
            return Ok(false);
        }
        let document = self.state.document()?;
        if scene.glyphs.len() > VISIBLE_GLYPH_BUDGET
            || scene.visible.len() > VISIBLE_GLYPH_BUDGET
            || !finite(&scene.viewport)
            || scene
                .glyphs
                .iter()
                .any(|glyph| glyph.offset >= document.len() || !finite(&glyph.bounds))
            || scene
                .glyphs
                .windows(2)
                .any(|pair| pair[0].offset >= pair[1].offset)
            || scene.visible.iter().any(|span| !document.valid(span))
            || scene
                .visible
                .windows(2)
                .any(|pair| pair[0].end > pair[1].start)
        {
            return Err(argument());
        }
        *self.state.scene.borrow_mut() = scene;
        self.state.scene_revision.set(revision);
        Ok(true)
    }
    pub fn set_selection(&self, epoch: u64, span: Range<usize>) -> Result<()> {
        self.state.check(epoch)?;
        if !self.state.document()?.valid(&span) {
            return Err(argument());
        }
        self.state.advance()?;
        let changed =
            self.state.selection.replace((span.start, span.end)) != (span.start, span.end);
        if changed {
            self.state.selection_event()?;
        }
        self.state.check(epoch)?;
        if self.state.selection.get() != (span.start, span.end) {
            return Err(invalid_operation());
        }
        Ok(())
    }
    pub fn replace_document(
        &self,
        label: String,
        epoch: u64,
        document: Arc<Document>,
    ) -> Result<()> {
        self.state.check(self.state.epoch.get())?;
        if epoch <= self.state.epoch.get() || label.len() > 64 * 1024 {
            return Err(argument());
        }
        self.state.advance()?;
        self.state.epoch.set(epoch);
        let previous_label = self.state.label.replace(label);
        self.state.scene_revision.set(0);
        let previous_document = self.state.document.replace(Some(document));
        *self.state.scene.borrow_mut() = Scene::default();
        self.state.selection.set((0, 0));
        let previous = self.state.provider.borrow_mut().take();
        if let Some(previous) = previous {
            // SAFETY: disconnect this exact cached old COM provider only.
            unsafe {
                UiaDisconnectProvider(&previous)?;
            }
        }
        let provider = self.state.provider()?;
        // SAFETY: notify for the newly published complete logical text stream.
        unsafe {
            UiaRaiseAutomationEvent(&provider, UIA_Text_TextChangedEventId)?;
        }
        self.state.check(epoch)?;
        // Building full Value variants is necessary only for actual listeners;
        // ordinary reader navigation does not allocate duplicate document BSTRs.
        if unsafe { UiaClientsAreListening() }.as_bool() {
            let current = self.state.document()?;
            let old_value = previous_document
                .as_ref()
                .map(|document| document.slice(0..document.len()).map(VARIANT::from))
                .transpose()
                .map_err(|_| argument())?
                .unwrap_or_default();
            let new_value = VARIANT::from(current.slice(0..current.len()).map_err(|_| argument())?);
            unsafe {
                UiaRaiseAutomationPropertyChangedEvent(
                    &provider,
                    UIA_ValueValuePropertyId,
                    &old_value,
                    &new_value,
                )?;
            }
            self.state.check(epoch)?;
            let current_label = self.state.label.borrow().clone();
            if previous_label != current_label {
                unsafe {
                    UiaRaiseAutomationPropertyChangedEvent(
                        &provider,
                        UIA_NamePropertyId,
                        &VARIANT::from(previous_label.as_str()),
                        &VARIANT::from(current_label.as_str()),
                    )?;
                }
            }
        }
        self.state.check(epoch)
    }
    pub fn close(&self) -> Result<()> {
        self.window.close()
    }
}
impl State {
    fn check(&self, epoch: u64) -> Result<()> {
        // SAFETY: plain query before touching UI-apartment mutable state.
        if unsafe { GetCurrentThreadId() } != self.thread {
            return Err(Error::from_hresult(RPC_E_WRONG_THREAD));
        }
        if !self.live.get() || self.epoch.get() != epoch || self.hwnd.get().is_none() {
            return Err(unavailable());
        }
        Ok(())
    }
    fn document(&self) -> Result<Arc<Document>> {
        self.document.borrow().clone().ok_or_else(unavailable)
    }
    fn advance(&self) -> Result<u64> {
        let serial = self
            .serial
            .get()
            .checked_add(1)
            .ok_or_else(invalid_operation)?;
        self.serial.set(serial);
        Ok(serial)
    }
    fn provider(self: &Rc<Self>) -> Result<IRawElementProviderSimple> {
        self.check(self.epoch.get())?;
        if let Some(provider) = self.provider.borrow().as_ref() {
            return Ok(provider.clone());
        }
        let provider: IRawElementProviderSimple = Provider {
            life: Life::new(self)?,
        }
        .into();
        *self.provider.borrow_mut() = Some(provider.clone());
        Ok(provider)
    }
    fn selection_event(self: &Rc<Self>) -> Result<()> {
        let cached = self.provider.borrow().clone();
        let provider = match cached {
            Some(provider) => provider,
            // SAFETY: simple UIA listener query, no application callback.
            None if unsafe { UiaClientsAreListening() }.as_bool() => self.provider()?,
            None => return Ok(()),
        };
        // SAFETY: current live UI-apartment generated provider.
        unsafe { UiaRaiseAutomationEvent(&provider, UIA_Text_TextSelectionChangedEventId) }
    }
    fn dispose(&self) {
        if !self.live.replace(false) {
            return;
        }
        self.hwnd.set(None);
        self.callback.borrow_mut().take();
        self.document.borrow_mut().take();
        *self.scene.borrow_mut() = Scene::default();
        let provider = self.provider.borrow_mut().take();
        if let Some(provider) = provider {
            // SAFETY: this owner's exact cached provider. Retirement is already
            // authoritative even if UIA has no remaining client connection.
            if let Err(error) = unsafe { UiaDisconnectProvider(&provider) } {
                eprintln!("native PDF UIA disconnect failed: {error}");
            }
        }
    }
    fn dispatch(self: &Rc<Self>, epoch: u64, command: Command) -> Result<()> {
        self.check(epoch)?;
        if !self.enabled.get() {
            return Err(not_enabled());
        }
        let range = match &command {
            Command::Select(range) | Command::Scroll { range, .. } => range,
        };
        if !self.document()?.valid(range) {
            return Err(argument());
        }
        let selection = matches!(&command, Command::Select(_)).then_some((range.start, range.end));
        let serial = self.advance()?;
        let callback = self.callback.borrow().clone().ok_or_else(unavailable)?;
        callback(command)?;
        self.check(epoch)?;
        if !self.enabled.get() {
            return Err(not_enabled());
        }
        if self.serial.get() != serial && selection != Some(self.selection.get()) {
            return Err(invalid_operation());
        }
        if let Some(selection) = selection {
            if self.selection.replace(selection) != selection {
                self.selection_event()?;
            }
        }
        self.check(epoch)?;
        if !self.enabled.get() {
            return Err(not_enabled());
        }
        if let Some(selection) = selection {
            if self.selection.get() != selection {
                return Err(invalid_operation());
            }
        }
        Ok(())
    }
    fn origin(&self) -> Result<(f64, f64)> {
        let hwnd = self.hwnd.get().ok_or_else(unavailable)?;
        let mut origin = POINT::default();
        // SAFETY: exact current bound HWND and an initialized output point.
        if !unsafe { ClientToScreen(hwnd, &mut origin) }.as_bool() {
            return Err(Error::from_thread());
        }
        Ok((f64::from(origin.x), f64::from(origin.y)))
    }
}
struct Life {
    owner: Weak<State>,
    thread: u32,
    epoch: u64,
}
impl Life {
    fn new(owner: &Rc<State>) -> Result<Self> {
        owner.check(owner.epoch.get())?;
        if owner.objects.get() >= OBJECT_BUDGET {
            return Err(invalid_operation());
        }
        owner.objects.set(owner.objects.get() + 1);
        Ok(Self {
            owner: Rc::downgrade(owner),
            thread: owner.thread,
            epoch: owner.epoch.get(),
        })
    }
    fn state(&self) -> Result<Rc<State>> {
        // SAFETY: check the plain captured thread id before upgrading Weak.
        if unsafe { GetCurrentThreadId() } != self.thread {
            return Err(Error::from_hresult(RPC_E_WRONG_THREAD));
        }
        let owner = self.owner.upgrade().ok_or_else(unavailable)?;
        owner.check(self.epoch)?;
        Ok(owner)
    }
}
impl Drop for Life {
    fn drop(&mut self) {
        // Non-agile COM objects must be released on their owning apartment.
        // A foreign unmarshal-free Release violates that ABI contract; do not
        // mutate Rc refcounts on the wrong thread and continue unsafely.
        assert_eq!(
            unsafe { GetCurrentThreadId() },
            self.thread,
            "non-agile reader provider must release on its UI apartment"
        );
        if let Some(owner) = self.owner.upgrade() {
            owner.objects.set(owner.objects.get() - 1);
        }
    }
}
fn finite(bounds: &Bounds) -> bool {
    [bounds.x1, bounds.y1, bounds.x2, bounds.y2]
        .iter()
        .all(|v| v.is_finite() && v.abs() <= f64::from(i32::MAX))
        && bounds.x2 >= bounds.x1
        && bounds.y2 >= bounds.y1
}
fn unavailable() -> Error {
    Error::from_hresult(HRESULT(UIA_E_ELEMENTNOTAVAILABLE as i32))
}
fn not_enabled() -> Error {
    Error::from_hresult(HRESULT(UIA_E_ELEMENTNOTENABLED as i32))
}
fn invalid_operation() -> Error {
    Error::from_hresult(HRESULT(UIA_E_INVALIDOPERATION as i32))
}
fn argument() -> Error {
    Error::from_hresult(E_INVALIDARG)
}
fn absent<T>() -> Result<T> {
    Err(Error::empty())
}

#[implement(
    IRawElementProviderSimple,
    ITextProvider,
    IValueProvider,
    Agile = false
)]
struct Provider {
    life: Life,
}
impl IRawElementProviderSimple_Impl for Provider_Impl {
    fn ProviderOptions(&self) -> Result<ProviderOptions> {
        self.life.state()?;
        Ok(ProviderOptions_ServerSideProvider | ProviderOptions_UseComThreading)
    }
    fn GetPatternProvider(&self, pattern: UIA_PATTERN_ID) -> Result<IUnknown> {
        self.life.state()?;
        if pattern == UIA_TextPatternId {
            self.to_interface::<ITextProvider>().cast()
        } else if pattern == UIA_ValuePatternId {
            self.to_interface::<IValueProvider>().cast()
        } else {
            absent()
        }
    }
    fn GetPropertyValue(&self, property: UIA_PROPERTY_ID) -> Result<VARIANT> {
        let state = self.life.state()?;
        Ok(if property == UIA_ControlTypePropertyId {
            VARIANT::from(UIA_DocumentControlTypeId.0)
        } else if property == UIA_NamePropertyId {
            VARIANT::from(state.label.borrow().as_str())
        } else if property == UIA_IsEnabledPropertyId {
            VARIANT::from(state.enabled.get())
        } else if property == UIA_IsControlElementPropertyId
            || property == UIA_IsContentElementPropertyId
            || property == UIA_IsTextPatternAvailablePropertyId
            || property == UIA_IsValuePatternAvailablePropertyId
        {
            VARIANT::from(true)
        } else if property == UIA_FrameworkIdPropertyId {
            VARIANT::from("Logseq")
        } else {
            VARIANT::default()
        })
    }
    fn HostRawElementProvider(&self) -> Result<IRawElementProviderSimple> {
        let state = self.life.state()?;
        // SAFETY: only this exact currently bound live HWND is queried.
        unsafe { UiaHostProviderFromHwnd(state.hwnd.get().ok_or_else(unavailable)?) }
    }
}
impl ITextProvider_Impl for Provider_Impl {
    fn DocumentRange(&self) -> Result<ITextRangeProvider> {
        let state = self.life.state()?;
        let len = state.document()?.len();
        range::make(&state, 0..len)
    }
    fn SupportedTextSelection(&self) -> Result<SupportedTextSelection> {
        self.life.state()?;
        Ok(SupportedTextSelection_Single)
    }
    fn GetSelection(&self) -> Result<*mut SAFEARRAY> {
        let state = self.life.state()?;
        let (start, end) = state.selection.get();
        arrays::ranges(&[range::make(&state, start..end)?])
    }
    fn GetVisibleRanges(&self) -> Result<*mut SAFEARRAY> {
        let state = self.life.state()?;
        let visible = state.scene.borrow().visible.clone();
        let ranges = visible
            .into_iter()
            .map(|span| range::make(&state, span))
            .collect::<Result<Vec<_>>>()?;
        arrays::ranges(&ranges)
    }
    fn RangeFromChild(&self, _: Ref<IRawElementProviderSimple>) -> Result<ITextRangeProvider> {
        self.life.state()?;
        Err(argument())
    }
    fn RangeFromPoint(&self, point: &UiaPoint) -> Result<ITextRangeProvider> {
        let state = self.life.state()?;
        if !point.x.is_finite()
            || !point.y.is_finite()
            || point.x < f64::from(i32::MIN)
            || point.x > f64::from(i32::MAX)
            || point.y < f64::from(i32::MIN)
            || point.y > f64::from(i32::MAX)
        {
            return Err(argument());
        }
        let mut client = POINT {
            x: point.x.round() as i32,
            y: point.y.round() as i32,
        };
        // SAFETY: validated screen point and this exact current reader HWND.
        if !unsafe { ScreenToClient(state.hwnd.get().ok_or_else(unavailable)?, &mut client) }
            .as_bool()
        {
            return Err(Error::from_thread());
        }
        let scene = state.scene.borrow();
        let offset = scene
            .glyphs
            .iter()
            .filter(|glyph| {
                glyph.bounds.x2 > scene.viewport.x1
                    && glyph.bounds.x1 < scene.viewport.x2
                    && glyph.bounds.y2 > scene.viewport.y1
                    && glyph.bounds.y1 < scene.viewport.y2
                    && glyph.bounds.x2 > glyph.bounds.x1
                    && glyph.bounds.y2 > glyph.bounds.y1
            })
            .map(|glyph| {
                let bounds = glyph.bounds;
                let x = f64::from(client.x);
                let y = f64::from(client.y);
                let dx = (bounds.x1 - x).max(0.0).max(x - bounds.x2);
                let dy = (bounds.y1 - y).max(0.0).max(y - bounds.y2);
                (glyph.offset, dx * dx + dy * dy)
            })
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(offset, _)| offset);
        drop(scene);
        self.life.state()?;
        match offset {
            Some(offset) => range::make(&state, offset..offset),
            None => absent(),
        }
    }
}
impl IValueProvider_Impl for Provider_Impl {
    fn SetValue(&self, _: &PCWSTR) -> Result<()> {
        self.life.state()?;
        Err(invalid_operation())
    }
    fn Value(&self) -> Result<BSTR> {
        let state = self.life.state()?;
        let document = state.document()?;
        Ok(BSTR::from_wide(
            &document
                .utf16(0..document.len(), None)
                .map_err(|_| argument())?,
        ))
    }
    fn IsReadOnly(&self) -> Result<BOOL> {
        self.life.state()?;
        Ok(true.into())
    }
}
#[cfg(test)]
#[path = "windows_text_tests.rs"]
mod tests;
