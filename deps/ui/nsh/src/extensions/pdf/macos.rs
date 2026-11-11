//! PDFKit is hosted through NSH's public native-component API on AppKit's thread.
use super::{Highlight, Model, NAME, Rect};
use block2::RcBlock;
use nsh_platform_macos::{
    ComponentContext, Components, NativeComponent,
    objc2::{AnyThread, MainThreadMarker, rc::Retained, runtime::ProtocolObject},
    objc2_app_kit::{NSColor, NSView},
    objc2_foundation::{
        NSNotification, NSNotificationCenter, NSObjectProtocol, NSOperationQueue, NSRect, NSString,
        NSURL,
    },
};
use objc2_foundation::NSUUID;
use objc2_pdf_kit::{
    PDFAnnotation, PDFAnnotationSubtypeHighlight, PDFAnnotationSubtypeSquare, PDFBorder,
    PDFBorderStyle, PDFDisplayBox, PDFDisplayMode, PDFDocument, PDFView,
    PDFViewPageChangedNotification, PDFViewScaleChangedNotification,
    PDFViewSelectionChangedNotification,
};
use serde_json::{Value, json};
use std::{
    cell::{Cell, RefCell},
    collections::BTreeMap,
    ptr::NonNull,
    rc::Rc,
    sync::Arc,
};

type Observer = Retained<ProtocolObject<dyn NSObjectProtocol>>;

pub fn register(components: &Components) {
    components.register(NAME, Rc::new(|context| Box::new(Component::new(context))));
}
struct Component {
    state: Rc<State>,
    observers: Vec<Observer>,
}
struct State {
    view: Retained<PDFView>,
    context: ComponentContext,
    model: RefCell<Option<Arc<Model>>>,
    updating: Cell<bool>,
    annotations: RefCell<Vec<Retained<PDFAnnotation>>>,
    needs_annotations: Cell<bool>,
    needs_reveal: Cell<bool>,
}
impl Component {
    fn new(context: ComponentContext) -> Self {
        let main =
            MainThreadMarker::new().expect("NSH makes AppKit native components on the main thread");
        // SAFETY: PDFView is allocated and used on AppKit's main thread.
        let view = unsafe { PDFView::new(main) };
        unsafe {
            view.setDisplayMode(PDFDisplayMode::SinglePageContinuous);
            view.setDisplaysPageBreaks(true);
            view.setAutoScales(true);
        }
        view.setPostsFrameChangedNotifications(true);
        let state = Rc::new(State {
            view,
            context,
            model: RefCell::new(None),
            updating: Cell::new(false),
            annotations: RefCell::new(Vec::new()),
            needs_annotations: Cell::new(true),
            needs_reveal: Cell::new(false),
        });
        let mut observers = Vec::new();
        // Each callback is restricted to this main-thread PDFView and delivered
        // on the main queue. Weak state avoids a NotificationCenter retain cycle.
        for (name, kind) in unsafe {
            [
                (PDFViewPageChangedNotification, 0),
                (PDFViewScaleChangedNotification, 1),
                (PDFViewSelectionChangedNotification, 2),
                (
                    nsh_platform_macos::objc2_app_kit::NSViewFrameDidChangeNotification,
                    3,
                ),
            ]
        } {
            let weak = dispatch2::MainThreadBound::new(Rc::downgrade(&state), main);
            let callback = RcBlock::new(move |_notification: NonNull<NSNotification>| {
                let main = MainThreadMarker::new()
                    .expect("PDF notifications are delivered on the main queue");
                let Some(state) = weak.get(main).upgrade() else {
                    return;
                };
                if state.updating.get() {
                    return;
                }
                match kind {
                    0 => state.page_changed(),
                    1 => state.scale_changed(),
                    2 => state.selection_changed(),
                    _ => {
                        state.updating.set(true);
                        state.apply_scale();
                        state.render_highlights();
                        state.reveal_pending();
                        state.updating.set(false);
                    }
                }
            });
            // SAFETY: the observed object is this PDFView. The main queue is
            // explicit, and every captured Rc/AppKit value is touched there only.
            observers.push(unsafe {
                NSNotificationCenter::defaultCenter().addObserverForName_object_queue_usingBlock(
                    Some(name),
                    Some(state.view.as_ref()),
                    Some(&NSOperationQueue::mainQueue()),
                    &callback,
                )
            });
        }
        Self { state, observers }
    }
}
impl NativeComponent for Component {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(self.state.view.clone())
    }
    fn set_prop(&mut self, name: &str, value: Option<&Value>) {
        if name != "model" {
            self.state
                .error(&format!("unsupported native PDF property {name}"));
            return;
        }
        let parsed = value
            .cloned()
            .ok_or_else(|| "PDF model was removed".to_owned())
            .and_then(|value| {
                serde_json::from_value::<Model>(value).map_err(|error| error.to_string())
            });
        let model = match parsed {
            Ok(model) => model,
            Err(error) => {
                self.state.error(&error);
                return;
            }
        };
        let model = Arc::new(model);
        let previous = self.state.model.replace(Some(model.clone()));
        self.state.updating.set(true);
        let result = self.state.apply(previous.as_deref(), &model);
        self.state.updating.set(false);
        match result {
            Ok(()) => self.state.emit("ready", json!({})),
            Err(error) => self.state.error(&error),
        }
    }
    fn command(&mut self, name: &str, _args: &Value) {
        // SAFETY: NSH forwards commands on the AppKit thread to the live view.
        unsafe {
            match name {
                "next-page" => self.state.view.goToNextPage(None),
                "previous-page" => self.state.view.goToPreviousPage(None),
                "zoom-in" => {
                    self.state.view.setAutoScales(false);
                    self.state.view.zoomIn(None);
                }
                "zoom-out" => {
                    self.state.view.setAutoScales(false);
                    self.state.view.zoomOut(None);
                }
                "auto-fit" => {
                    self.state.view.setAutoScales(true);
                    self.state.emit("pdf-scale", json!({"scale":"auto"}));
                }
                "copy-selection" => self.state.view.copy(None),
                "highlight-selection" => self.state.highlight_selection(),
                _ => self
                    .state
                    .error(&format!("unsupported native PDF command {name}")),
            }
        }
    }
}
impl Drop for Component {
    fn drop(&mut self) {
        // SAFETY: NSH disposes native components on the owning AppKit thread.
        for observer in &self.observers {
            unsafe {
                NSNotificationCenter::defaultCenter().removeObserver(observer.as_ref());
            }
        }
    }
}
impl State {
    fn emit(&self, name: &str, payload: Value) {
        if let Some(model) = self.model.borrow().as_ref() {
            self.context.emit(
                name,
                model.payload(payload.as_object().expect("PDF event object").clone()),
            );
        }
    }
    fn error(&self, message: &str) {
        self.emit("error", json!({"message":message}));
    }
    fn apply(&self, previous: Option<&Model>, model: &Model) -> Result<(), String> {
        let changed = previous.is_none_or(|previous| previous.path != model.path)
            // A failed native load must remain an error on later prop updates,
            // rather than treating a missing document as successfully mounted.
            || unsafe { self.view.document().is_none() };
        // SAFETY: all PDFKit objects are retained and used on AppKit's thread.
        unsafe {
            if changed {
                self.view.setDocument(None);
                self.annotations.borrow_mut().clear();
                let url = if model.path.starts_with("file:") {
                    NSURL::URLWithString(&NSString::from_str(&model.path))
                        .ok_or("invalid native PDF file URL")?
                } else {
                    NSURL::fileURLWithPath(&NSString::from_str(&model.path))
                };
                let document = PDFDocument::initWithURL(PDFDocument::alloc(), &url)
                    .ok_or("PDFKit could not open the document")?;
                if document.isLocked() {
                    return Err(
                        "PDF document is password protected; unlocking is not implemented".into(),
                    );
                }
                if document.pageCount() == 0 {
                    return Err("PDF document contains no pages".into());
                }
                self.view.setDocument(Some(&document));
            }
            if let Some(document) = self.view.document() {
                if model.page > document.pageCount() {
                    return Err("PDF page exceeds the document page count".into());
                }
                let current = self
                    .view
                    .currentPage()
                    .map(|page| document.indexForPage(&page) + 1);
                if current != Some(model.page)
                    && let Some(page) = document.pageAtIndex(model.page - 1)
                {
                    self.view.goToPage(&page);
                }
            }
            if model.theme == "light" {
                self.view.setBackgroundColor(&NSColor::whiteColor());
            } else {
                self.view
                    .setBackgroundColor(&NSColor::windowBackgroundColor());
            }
        }
        if changed || previous.is_none_or(|previous| previous.scale != model.scale) {
            self.apply_scale();
        }
        if changed
            || previous.is_none_or(|previous| {
                previous.highlights != model.highlights || previous.dashed != model.dashed
            })
        {
            self.needs_annotations.set(true);
            self.render_highlights();
        }
        if changed
            || previous.is_none_or(|previous| {
                previous.reference != model.reference || previous.highlights != model.highlights
            })
        {
            self.needs_reveal.set(!model.reference.is_empty());
        }
        self.reveal_pending();
        Ok(())
    }
    fn apply_scale(&self) {
        let scale = self
            .model
            .borrow()
            .as_ref()
            .map(|model| model.scale.clone());
        let Some(scale) = scale else { return };
        unsafe {
            match scale.as_str() {
                "auto" | "page-fit" => self.view.setAutoScales(true),
                "page-width" => {
                    if let Some(page) = self.view.currentPage() {
                        // PDFView's public conversion includes page rotation and
                        // the current zoom; raw crop-box width does not.
                        let width = self
                            .view
                            .convertRect_fromPage(page.boundsForBox(PDFDisplayBox::CropBox), &page)
                            .size
                            .width;
                        if width > 0.0 && self.view.bounds().size.width > 0.0 {
                            let factor =
                                self.view.scaleFactor() * self.view.bounds().size.width / width;
                            self.view.setAutoScales(false);
                            self.view.setScaleFactor(factor);
                        }
                    }
                }
                _ => {
                    self.view.setAutoScales(false);
                    self.view
                        .setScaleFactor(scale.parse().expect("validated PDF scale"));
                }
            }
        }
    }
    fn page_changed(&self) {
        unsafe {
            if let (Some(document), Some(page)) = (self.view.document(), self.view.currentPage()) {
                self.emit("pdf-page", json!({"page":document.indexForPage(&page)+1}));
            }
        }
    }
    fn scale_changed(&self) {
        // Automatic fitting follows native viewport changes and remains a mode;
        // persisting every fit's numeric value would accidentally disable it.
        unsafe {
            if !self.view.autoScales() {
                self.emit(
                    "pdf-scale",
                    json!({"scale":self.view.scaleFactor().to_string()}),
                );
            }
        }
    }
    fn selection_changed(&self) {
        unsafe {
            let selected = self
                .view
                .currentSelection()
                .and_then(|selection| selection.string())
                .is_some_and(|text| !text.to_string().trim().is_empty());
            self.emit("selection", json!({"selected":selected}));
        }
    }
    fn rectangle(&self, rect: NSRect, viewport: NSRect) -> Rect {
        let y = if self.view.isFlipped() {
            rect.origin.y - viewport.origin.y
        } else {
            viewport.origin.y + viewport.size.height - rect.origin.y - rect.size.height
        };
        Rect {
            x1: rect.origin.x - viewport.origin.x,
            y1: y,
            x2: rect.origin.x + rect.size.width - viewport.origin.x,
            y2: y + rect.size.height,
            w: viewport.size.width,
            h: viewport.size.height,
        }
    }
    fn native_rect(&self, rect: &Rect, viewport: NSRect) -> NSRect {
        let x = viewport.origin.x + rect.x1 / rect.w * viewport.size.width;
        let height = (rect.y2 - rect.y1) / rect.h * viewport.size.height;
        let top = rect.y1 / rect.h * viewport.size.height;
        let y = if self.view.isFlipped() {
            viewport.origin.y + top
        } else {
            viewport.origin.y + viewport.size.height - top - height
        };
        NSRect::new(
            nsh_platform_macos::objc2_foundation::NSPoint::new(x, y),
            nsh_platform_macos::objc2_foundation::NSSize::new(
                (rect.x2 - rect.x1) / rect.w * viewport.size.width,
                height,
            ),
        )
    }
    fn highlight_selection(&self) {
        unsafe {
            let (Some(selection), Some(document)) =
                (self.view.currentSelection(), self.view.document())
            else {
                return;
            };
            // Group each selected line once; do not filter the whole selection
            // again for every page in a long multi-page selection.
            let mut pages = BTreeMap::<usize, (Vec<Rect>, String)>::new();
            for line in selection.selectionsByLine().iter() {
                for page in line.pages().iter() {
                    let viewport = self
                        .view
                        .convertRect_fromPage(page.boundsForBox(PDFDisplayBox::CropBox), &page);
                    if viewport.size.width <= 0.0 || viewport.size.height <= 0.0 {
                        continue;
                    }
                    let rect = self.rectangle(
                        self.view
                            .convertRect_fromPage(line.boundsForPage(&page), &page),
                        viewport,
                    );
                    if rect.x2 <= rect.x1 || rect.y2 <= rect.y1 {
                        continue;
                    }
                    let group = pages.entry(document.indexForPage(&page) + 1).or_default();
                    group.0.push(rect);
                    if let Some(text) = line.string() {
                        if !group.1.is_empty() {
                            group.1.push('\n');
                        }
                        group.1.push_str(&text.to_string());
                    }
                }
            }
            for (page, (rects, text)) in pages {
                let Some(first) = rects.first() else { continue };
                let bounding = rects
                    .iter()
                    .skip(1)
                    .fold(first.clone(), |mut bounds, rect| {
                        bounds.x1 = bounds.x1.min(rect.x1);
                        bounds.y1 = bounds.y1.min(rect.y1);
                        bounds.x2 = bounds.x2.max(rect.x2);
                        bounds.y2 = bounds.y2.max(rect.y2);
                        bounds
                    });
                let id = NSUUID::UUID().UUIDString().to_string().to_lowercase();
                self.emit("pdf-hl-add",json!({"id":id,"page":page,"text":text,"bounding":bounding,"rects":rects,"color":"yellow"}));
            }
            self.view.clearSelection();
        }
    }
    fn render_highlights(&self) {
        if !self.needs_annotations.get() {
            return;
        }
        unsafe {
            let Some(document) = self.view.document() else {
                return;
            };
            if self.view.bounds().size.width <= 0.0 || self.view.bounds().size.height <= 0.0 {
                return;
            }
            for annotation in self.annotations.take() {
                if let Some(page) = annotation.page() {
                    page.removeAnnotation(&annotation);
                }
            }
            let model = self.model.borrow();
            let Some(model) = model.as_ref() else { return };
            let mut annotations = Vec::new();
            for highlight in &model.highlights {
                let Some(page) = document.pageAtIndex(highlight.page - 1) else {
                    continue;
                };
                let viewport = self
                    .view
                    .convertRect_fromPage(page.boundsForBox(PDFDisplayBox::CropBox), &page);
                if viewport.size.width <= 0.0 || viewport.size.height <= 0.0 {
                    continue;
                }
                let rects = if highlight.rects.is_empty() {
                    std::slice::from_ref(&highlight.bounding)
                } else {
                    &highlight.rects
                };
                for rect in rects {
                    let bounds = self
                        .view
                        .convertRect_toPage(self.native_rect(rect, viewport), &page);
                    let annotation = PDFAnnotation::initWithBounds_forType_withProperties(
                        PDFAnnotation::alloc(),
                        bounds,
                        if highlight.image.is_some() {
                            PDFAnnotationSubtypeSquare
                        } else {
                            PDFAnnotationSubtypeHighlight
                        },
                        None,
                    );
                    let color =
                        nsh_core::Color::parse(highlight.color.as_deref().unwrap_or("yellow"))
                            .expect("validated highlight color");
                    let (r, g, b, a) = color.to_f64();
                    annotation.setColor(&NSColor::colorWithSRGBRed_green_blue_alpha(
                        r,
                        g,
                        b,
                        a * 0.35,
                    ));
                    annotation.setUserName(Some(&NSString::from_str(&format!(
                        "logseq:{}",
                        highlight.id
                    ))));
                    // Projected annotations are model-owned; native form edits
                    // must not mutate a second persisted annotation model.
                    annotation.setReadOnly(true);
                    annotation.setContents(Some(&NSString::from_str(&highlight.text)));
                    if highlight.image.is_some() {
                        let border = PDFBorder::new();
                        border.setLineWidth(1.0);
                        if model.dashed {
                            border.setStyle(PDFBorderStyle::Dashed);
                        }
                        annotation.setBorder(Some(&border));
                    }
                    page.addAnnotation(&annotation);
                    annotations.push(annotation);
                }
            }
            self.annotations.replace(annotations);
            self.needs_annotations.set(false);
        }
    }
    fn reveal_pending(&self) {
        if !self.needs_reveal.replace(false) {
            return;
        }
        let model = self.model.borrow().as_ref().cloned();
        if let Some(model) = model
            && let Some(highlight) = model
                .highlights
                .iter()
                .find(|highlight| highlight.id == model.reference)
        {
            // One deferred request, retried by PDFView's own frame change;
            // no display-link wait, timer or repeated per-frame data scan.
            self.needs_reveal.set(!self.reveal(highlight));
        }
    }
    fn reveal(&self, highlight: &Highlight) -> bool {
        unsafe {
            if let Some(document) = self.view.document()
                && let Some(page) = document.pageAtIndex(highlight.page - 1)
            {
                self.view.goToPage(&page);
                let viewport = self
                    .view
                    .convertRect_fromPage(page.boundsForBox(PDFDisplayBox::CropBox), &page);
                if viewport.size.width > 0.0 && viewport.size.height > 0.0 {
                    self.view.goToRect_onPage(
                        self.view.convertRect_toPage(
                            self.native_rect(&highlight.bounding, viewport),
                            &page,
                        ),
                        &page,
                    );
                    return true;
                }
            }
        }
        false
    }
}
