//! Real PDFKit API qualification, not proof of page pixels or complete UI.
//! Captures require visual review; a successful PNG alone is insufficient.
//! No OCaml library or user graph is opened.
//! Run on macOS: cargo run --example pdf_qualification -- <evidence-directory>
#[cfg(not(target_os = "macos"))]
fn main() -> std::process::ExitCode {
    eprintln!("PDFKit qualification requires native macOS; no PDF provider exists here");
    std::process::ExitCode::FAILURE
}

#[cfg(target_os = "macos")]
fn main() -> std::process::ExitCode {
    macos::run()
}

#[cfg(target_os = "macos")]
mod macos {
    use nsh_core::prelude::*;
    use nsh_platform_macos::{
        self as platform,
        objc2::{MainThreadMarker, rc::Retained, runtime::AnyObject},
        objc2_app_kit::{
            NSApplication, NSBitmapImageFileType, NSBitmapImageRepPropertyKey, NSView,
        },
        objc2_foundation::{NSDictionary, NSRange},
    };
    use objc2_pdf_kit::{PDFDisplayBox, PDFView};
    use serde_json::{Value, json};
    use std::{
        cell::{Cell, RefCell},
        future::poll_fn,
        path::{Path, PathBuf},
        rc::Rc,
        sync::{
            Arc, Mutex,
            atomic::{AtomicU8, Ordering},
        },
        task::{Poll, Waker},
        time::{Duration, SystemTime, UNIX_EPOCH},
    };

    static STATUS: AtomicU8 = AtomicU8::new(0);

    #[derive(Clone, PartialEq, Props)]
    struct QualificationProps {
        directory: Prop<String>,
    }

    struct Flow {
        phase: Cell<u8>,
        reference: ElementRef,
        model: Signal<Value>,
        directory: PathBuf,
        events: RefCell<Vec<Value>>,
        captures: RefCell<Vec<Value>>,
    }

    fn fail(message: impl ToString) {
        if STATUS
            .compare_exchange(0, 2, Ordering::AcqRel, Ordering::Acquire)
            .is_ok()
        {
            eprintln!(
                "{}",
                json!({"ok":false,"qualification":"native-pdfkit","error":message.to_string()})
            );
            platform::quit_app();
        }
    }

    fn require(condition: bool, message: &str) -> Result<(), String> {
        condition.then_some(()).ok_or_else(|| message.to_owned())
    }

    impl Flow {
        async fn capture(&self, name: &str) -> Result<(), String> {
            let own_view = self.directory.join(format!(
                "{}-own-view.png",
                name.strip_suffix(".png").unwrap_or(name)
            ));
            let drawing = inspect(Inspection::Drawing { own_view }).await?;
            let capture = lui_nsh::native_capture::screenshot().await?;
            std::fs::write(self.directory.join(name), capture.png)
                .map_err(|error| error.to_string())?;
            self.captures.borrow_mut().push(json!({
                "file":name,"width":capture.width,"height":capture.height,
                "drawing":drawing,"pixelQualification":"unqualified"
            }));
            Ok(())
        }

        fn event(self: &Rc<Self>, event: &NativeEvent) {
            if STATUS.load(Ordering::Acquire) != 0 {
                return;
            }
            let model = self.model.get_untracked();
            for key in ["repo", "identity", "instance"] {
                if event.data.get(key) != model.get(key) {
                    fail(format!("retired/missing {key} envelope: {:?}", event.data));
                    return;
                }
            }
            if self.events.borrow().len() >= 128 {
                fail("native event bound exceeded");
                return;
            }
            self.events
                .borrow_mut()
                .push(json!({"name":event.name.to_string(),"payload":event.data}));
            let flow = self.clone();
            let stage = self.phase.get();
            match (stage, &*event.name) {
                (0, "ready") => {
                    self.phase.set(1);
                    spawn(async move {
                        let result = async {
                            flow.reference
                                .measure()
                                .await
                                .ok_or("native PDF has no layout")?;
                            inspect(Inspection::Document {
                                expected: "Original page one".into(),
                                annotation: None,
                                fit: false,
                            })
                            .await?;
                            flow.capture("pdf-initial.png").await?;
                            flow.phase.set(2);
                            flow.reference.command("next-page", json!(null));
                            Ok::<_, String>(())
                        }
                        .await;
                        if let Err(error) = result {
                            fail(error);
                        }
                    });
                }
                (2, "pdf-page") if event.data.get("page").and_then(Value::as_u64) == Some(2) => {
                    self.phase.set(3);
                    let mut model = self.model.get_untracked();
                    model["page"] = json!(2);
                    model["scale"] = json!("page-width");
                    self.model.set(model);
                }
                (3, "ready") => {
                    self.phase.set(4);
                    spawn(async move {
                        match inspect(Inspection::Document {
                            expected: "Original page one".into(),
                            annotation: None,
                            fit: true,
                        })
                        .await
                        {
                            Ok(_) => flow.reference.command("zoom-in", json!(null)),
                            Err(error) => fail(error),
                        }
                    });
                }
                (4, "pdf-scale") => {
                    let factor = event
                        .data
                        .get("scale")
                        .and_then(Value::as_str)
                        .and_then(|v| v.parse::<f64>().ok());
                    if !factor.is_some_and(|factor| factor.is_finite() && factor > 0.0) {
                        fail("zoom did not emit a finite native scale");
                        return;
                    }
                    self.phase.set(5);
                    let mut model = self.model.get_untracked();
                    model["scale"] = event.data["scale"].clone();
                    self.model.set(model);
                    spawn(async move {
                        if let Err(error) = inspect(Inspection::Selection).await {
                            fail(error);
                        }
                    });
                }
                (5, "selection")
                    if event.data.get("selected").and_then(Value::as_bool) == Some(true) =>
                {
                    self.phase.set(6);
                    self.reference.command("highlight-selection", json!(null));
                }
                (6, "pdf-hl-add") => {
                    if let Err(error) = check_highlight(&event.data) {
                        fail(error);
                        return;
                    }
                    self.phase.set(7);
                    let mut model = self.model.get_untracked();
                    let mut highlight = event.data.clone();
                    for key in ["repo", "identity", "instance"] {
                        highlight.as_object_mut().unwrap().remove(key);
                    }
                    model["highlights"] = json!([highlight]);
                    self.model.set(model);
                }
                (7, "ready") => {
                    self.phase.set(8);
                    let id = event_id(self.model.get_untracked());
                    spawn(async move {
                        let result = async {
                            inspect(Inspection::Document {
                                expected: "Original page one".into(),
                                annotation: Some(id),
                                fit: false,
                            })
                            .await?;
                            flow.capture("pdf-highlight.png").await?;
                            flow.phase.set(9);
                            let mut model = flow.model.get_untracked();
                            model["path"] = json!(flow.directory.join("replacement.pdf"));
                            model["identity"] = json!("replacement-document");
                            model["instance"] = json!("replacement-instance");
                            model["page"] = json!(1);
                            model["highlights"] = json!([]);
                            flow.model.set(model);
                            Ok::<_, String>(())
                        }
                        .await;
                        if let Err(error) = result {
                            fail(error);
                        }
                    });
                }
                (9, "ready") => {
                    self.phase.set(10);
                    spawn(async move {
                        match inspect(Inspection::Document {
                            expected: "Replacement page one".into(),
                            annotation: None,
                            fit: false,
                        })
                        .await
                        {
                            Ok(_) => {
                                flow.phase.set(11);
                                let mut model = flow.model.get_untracked();
                                model["path"] = json!(flow.directory.join("does-not-exist.pdf"));
                                model["identity"] = json!("missing-document");
                                model["instance"] = json!("missing-instance");
                                flow.model.set(model);
                            }
                            Err(error) => fail(error),
                        }
                    });
                }
                (11, "error") => {
                    if !event
                        .data
                        .get("message")
                        .and_then(Value::as_str)
                        .is_some_and(|text| text.contains("could not open"))
                    {
                        fail("missing document did not report a real PDFKit load error");
                        return;
                    }
                    let evidence = json!({"ok":true,"qualification":"native-pdfkit",
                        "background":true,"evidenceDirectory":self.directory,
                        "qualificationScope":"native-api-checks",
                        "nativeApiChecks":["real-document","two-pages","rotated-page-width","native-zoom",
                            "actual-text-selection","highlight-event-envelope","projected-native-annotation",
                            "source-replacement","unreadable-document-error"],
                        "events":self.events.borrow().clone(),
                        "captures":self.captures.borrow().clone(),
                        "appContentPixels":{"status":"unqualified",
                            "reason":"AppKit cache output requires visual review; PDFKit page layers may be absent even when native API checks pass"},
                        "unqualified":["app-content-pixels","visible-page-text","hardware-pointer","keyboard-focus","OCaml-persistence","full-PDF-toolbar","Linux","Windows"]});
                    match std::fs::write(
                        self.directory.join("result.json"),
                        format!("{evidence}\n"),
                    ) {
                        Ok(()) => {
                            STATUS.store(1, Ordering::Release);
                            println!("{evidence}");
                            platform::quit_app();
                        }
                        Err(error) => fail(error),
                    }
                }
                (_, "error") => fail(format!("unexpected native PDF error: {}", event.data)),
                _ => {}
            }
        }
    }

    fn event_id(model: Value) -> String {
        model["highlights"][0]["id"]
            .as_str()
            .expect("checked highlight id")
            .to_owned()
    }

    fn check_highlight(data: &Value) -> Result<(), String> {
        let id = data
            .get("id")
            .and_then(Value::as_str)
            .ok_or("highlight has no id")?;
        require(
            id.len() == 36 && id.bytes().all(|b| b.is_ascii_hexdigit() || b == b'-'),
            "highlight is not a native UUID",
        )?;
        require(
            data.get("page").and_then(Value::as_u64) == Some(2),
            "selection highlight is on the wrong page",
        )?;
        require(
            data.get("text")
                .and_then(Value::as_str)
                .is_some_and(|text| text.contains("Rotated")),
            "native selected text was not preserved",
        )?;
        let rects = data
            .get("rects")
            .and_then(Value::as_array)
            .ok_or("highlight has no rectangles")?;
        require(
            !rects.is_empty(),
            "highlight has no native selection rectangles",
        )?;
        for rect in rects.iter().chain(std::iter::once(&data["bounding"])) {
            let number = |key: &str| {
                rect.get(key)
                    .and_then(Value::as_f64)
                    .filter(|value| value.is_finite())
                    .ok_or_else(|| format!("invalid highlight {key}"))
            };
            require(
                number("w")? > 0.0
                    && number("h")? > 0.0
                    && number("x2")? > number("x1")?
                    && number("y2")? > number("y1")?,
                "highlight geometry is empty",
            )?;
        }
        Ok(())
    }

    #[component]
    fn Qualification(props: QualificationProps) -> impl IntoElement {
        let directory = PathBuf::from(props.directory.get_untracked());
        let model = signal(
            json!({"path":directory.join("original.pdf"),"filename":"original.pdf",
            "repo":"private-pdf-qualification","identity":"original-document","instance":"original-instance",
            "page":1,"scale":"auto","highlights":[],"reference":"","theme":"","dashed":false,
            "automenu":false,"labels":{}}),
        );
        let reference = element_ref();
        let flow = Rc::new(Flow {
            phase: Cell::new(0),
            reference,
            model,
            directory,
            events: RefCell::new(Vec::new()),
            captures: RefCell::new(Vec::new()),
        });
        native("logseq.pdfkit")
            .element_ref(&reference)
            .prop("model", move || model.get())
            .on_native_event(move |event: &NativeEvent| flow.event(event))
            .w_full()
            .h_full()
    }

    enum Inspection {
        Document {
            expected: String,
            annotation: Option<String>,
            fit: bool,
        },
        Selection,
        Drawing {
            own_view: PathBuf,
        },
    }
    type MainReply = Arc<Mutex<(Option<Result<Value, String>>, Option<Waker>)>>;

    async fn inspect(action: Inspection) -> Result<Value, String> {
        let reply: MainReply = Arc::new(Mutex::new((None, None)));
        let sender = reply.clone();
        dispatch2::DispatchQueue::main().exec_async(move || {
            let result = inspect_main(action);
            let waker = {
                let mut reply = sender.lock().unwrap();
                reply.0 = Some(result);
                reply.1.take()
            };
            if let Some(waker) = waker {
                waker.wake();
            }
        });
        poll_fn(move |context| {
            let mut reply = reply.lock().unwrap();
            if let Some(result) = reply.0.take() {
                Poll::Ready(result)
            } else {
                reply.1 = Some(context.waker().clone());
                Poll::Pending
            }
        })
        .await
    }

    fn own_pdf() -> Result<Retained<PDFView>, String> {
        let main = MainThreadMarker::new().ok_or("PDF inspection is not on AppKit main thread")?;
        let application = NSApplication::sharedApplication(main);
        let mut pending: Vec<Retained<NSView>> = application
            .windows()
            .iter()
            .filter_map(|window| window.contentView())
            .collect();
        let mut found = None;
        let mut visited = 0;
        while let Some(view) = pending.pop() {
            visited += 1;
            require(
                visited <= 4096,
                "own native view inspection exceeded its bound",
            )?;
            if let Ok(pdf) = view.clone().downcast::<PDFView>() {
                require(found.is_none(), "qualification owns more than one PDFView")?;
                found = Some(pdf);
            } else {
                pending.extend(view.subviews().iter());
            }
        }
        found.ok_or_else(|| "own native PDFView is not attached".to_owned())
    }

    fn inspect_main(action: Inspection) -> Result<Value, String> {
        let view = own_pdf()?;
        // SAFETY: own_pdf verifies the main thread, and all retained PDFKit
        // values stay inside this main-queue call. No other app is inspected.
        unsafe {
            let document = view.document().ok_or("PDFView has no document")?;
            require(
                document.pageCount() == 2,
                "actual PDF document does not contain two pages",
            )?;
            match action {
                Inspection::Drawing { own_view } => {
                    let before = drawing_state(&view);
                    // Public AppKit drawing only: never substitute PDFPage's
                    // image/draw methods or change native layer hosting.
                    view.layoutDocumentView();
                    if let Some(content) = view.window().and_then(|window| window.contentView()) {
                        content.layoutSubtreeIfNeeded();
                    }
                    view.layoutSubtreeIfNeeded();
                    if let Some(document) = view.documentView() {
                        document.layoutSubtreeIfNeeded();
                        document.display();
                    }
                    view.display();
                    let own_view_cache = cache_pdf_view(&view, &own_view)?;
                    let layers = layer_tree(&view)?;
                    Ok(json!({"before":before,"after":drawing_state(&view),
                        "ownViewCache":own_view_cache,"pdfLayers":layers,
                        "preparation":["PDFView.layoutDocumentView","NSView.layoutSubtreeIfNeeded","NSView.display"],
                        "displayTickWait":false,"substitutedPageImage":false}))
                }
                Inspection::Document {
                    expected,
                    annotation,
                    fit,
                } => {
                    let page = document
                        .pageAtIndex(0)
                        .ok_or("document has no first page")?;
                    require(
                        page.string()
                            .is_some_and(|text| text.to_string().contains(&expected)),
                        "wrong native document content",
                    )?;
                    if fit {
                        let page = view.currentPage().ok_or("PDFView has no current page")?;
                        require(
                            document.indexForPage(&page) == 1 && page.rotation() == 90,
                            "rotated second page was not reached",
                        )?;
                        let width = view
                            .convertRect_fromPage(page.boundsForBox(PDFDisplayBox::CropBox), &page)
                            .size
                            .width;
                        require(
                            width > 0.0 && (width - view.bounds().size.width).abs() < 2.0,
                            "rotated page does not fit native view width",
                        )?;
                    }
                    if let Some(id) = annotation {
                        let page = document
                            .pageAtIndex(1)
                            .ok_or("document has no second page")?;
                        require(
                            page.annotations().iter().any(|annotation| {
                                annotation
                                    .userName()
                                    .is_some_and(|name| name.to_string() == format!("logseq:{id}"))
                            }),
                            "model-owned highlight did not reach a native PDFAnnotation",
                        )?;
                    }
                    Ok(json!({"pages":document.pageCount(),"scale":view.scaleFactor()}))
                }
                Inspection::Selection => {
                    let page = document
                        .pageAtIndex(1)
                        .ok_or("document has no second page")?;
                    let selection = page
                        .selectionForRange(NSRange::new(0, 7))
                        .ok_or("PDFKit could not select real page text")?;
                    require(
                        selection
                            .string()
                            .is_some_and(|text| text.to_string().contains("Rotated")),
                        "native selected range has wrong text",
                    )?;
                    view.setCurrentSelection(Some(&selection));
                    Ok(json!({"selected":true}))
                }
            }
        }
    }

    fn cache_pdf_view(view: &PDFView, path: &Path) -> Result<Value, String> {
        let bounds = view.bounds();
        let bitmap = view
            .bitmapImageRepForCachingDisplayInRect(bounds)
            .ok_or("could not allocate actual PDFView content cache")?;
        view.cacheDisplayInRect_toBitmapImageRep(bounds, &bitmap);
        let properties = NSDictionary::<NSBitmapImageRepPropertyKey, AnyObject>::new();
        // SAFETY: the real PDFView is cached on its AppKit main thread. This
        // is the view hierarchy, never PDFPage drawing or a replacement image.
        let png = unsafe {
            bitmap.representationUsingType_properties(NSBitmapImageFileType::PNG, &properties)
        }
        .ok_or("could not encode actual PDFView cache")?
        .to_vec();
        std::fs::write(path, png).map_err(|error| error.to_string())?;
        Ok(
            json!({"file":path,"width":bitmap.pixelsWide(),"height":bitmap.pixelsHigh(),
            "captureSource":"own-pdf-view-cache","pixelQualification":"unqualified"}),
        )
    }

    fn layer_tree(view: &PDFView) -> Result<Value, String> {
        // Only public runtime/CA getters, on the main queue. Reading a class
        // name does not call any private PDFKit method or change layer hosting.
        let mut pending = view
            .layer()
            .into_iter()
            .map(|layer| (None, layer))
            .collect::<Vec<_>>();
        let mut layers = Vec::new();
        while let Some((parent, layer)) = pending.pop() {
            require(
                layers.len() < 4096,
                "own PDF layer inspection exceeded its bound",
            )?;
            let index = layers.len();
            let classes = std::iter::successors(Some(layer.class()), |class| class.superclass())
                .map(|class| class.name().to_string_lossy().into_owned())
                .collect::<Vec<_>>();
            let bounds = layer.bounds();
            // SAFETY: retained layers belong to this PDFView and are read on
            // its main queue. The contents are only inspected, never replaced.
            let contents = unsafe { layer.contents() }
                .map(|contents| contents.class().name().to_string_lossy().into_owned());
            layers.push(json!({"index":index,"parent":parent,
                "isTiledLayer":classes.iter().any(|name|name=="CATiledLayer"),
                "classes":classes,"hidden":layer.isHidden(),"opacity":layer.opacity(),
                "masksToBounds":layer.masksToBounds(),"hasMask":layer.mask().is_some(),
                "bounds":{"x":bounds.origin.x,"y":bounds.origin.y,
                    "width":bounds.size.width,"height":bounds.size.height},
                "needsDisplay":layer.needsDisplay(),"drawsAsynchronously":layer.drawsAsynchronously(),
                "contentsScale":layer.contentsScale(),"contentsClass":contents}));
            if let Some(children) = unsafe { layer.sublayers() } {
                pending.extend(children.iter().map(|layer| (Some(index), layer)));
            }
        }
        Ok(json!({"layers":layers,
            "contentsReadIsNotTileReadinessProof":true,"layerMutation":false}))
    }

    fn rectangle(rect: platform::objc2_foundation::NSRect) -> Value {
        json!({"x":rect.origin.x,"y":rect.origin.y,
            "width":rect.size.width,"height":rect.size.height})
    }

    fn view_state(view: &NSView) -> Value {
        json!({"bounds":rectangle(view.bounds()),"frame":rectangle(view.frame()),
            "visibleRect":rectangle(view.visibleRect()),
            "hidden":view.isHiddenOrHasHiddenAncestor(),"needsLayout":view.needsLayout(),
            "needsDisplay":view.needsDisplay(),"wantsLayer":view.wantsLayer(),
            "hasLayer":view.layer().is_some(),"subviews":view.subviews().len()})
    }

    fn drawing_state(view: &PDFView) -> Value {
        // SAFETY: called only inside inspect_main on AppKit's main queue.
        unsafe {
            let main = MainThreadMarker::new().expect("main-queue inspection");
            json!({"applicationActive":NSApplication::sharedApplication(main).isActive(),
                "pdfView":view_state(view),
                "documentView":view.documentView().map(|view|view_state(&view)),
                "visiblePageCount":view.visiblePages().len(),
                "window":view.window().map(|window|json!({"visible":window.isVisible(),
                    "occlusionState":window.occlusionState().bits()}))})
        }
    }

    fn write_pdf(path: &Path, replacement: bool) -> Result<(), String> {
        let first = if replacement {
            "Replacement page one"
        } else {
            "Original page one"
        };
        let objects=[
            "<< /Type /Catalog /Pages 2 0 R >>".to_owned(),
            "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>".into(),
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>".into(),
            stream(first),
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Rotate 90 /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>".into(),
            stream("Rotated page two"),
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".into(),
        ];
        let mut pdf = String::from("%PDF-1.4\n");
        let mut offsets = vec![0];
        for (index, object) in objects.iter().enumerate() {
            offsets.push(pdf.len());
            pdf.push_str(&format!("{} 0 obj\n{object}\nendobj\n", index + 1));
        }
        let xref = pdf.len();
        pdf.push_str(&format!("xref\n0 {}\n0000000000 65535 f \n", offsets.len()));
        for offset in &offsets[1..] {
            pdf.push_str(&format!("{offset:010} 00000 n \n"));
        }
        pdf.push_str(&format!(
            "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n",
            offsets.len()
        ));
        std::fs::write(path, pdf).map_err(|error| error.to_string())
    }
    fn stream(text: &str) -> String {
        let stream = format!("BT /F1 18 Tf 72 700 Td ({text}) Tj ET\n");
        format!("<< /Length {} >>\nstream\n{stream}endstream", stream.len())
    }

    pub fn run() -> std::process::ExitCode {
        let result = (|| -> Result<(), String> {
            let directory = std::env::args_os()
                .nth(1)
                .map(PathBuf::from)
                .unwrap_or_else(|| {
                    let stamp = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_nanos();
                    std::env::temp_dir().join(format!(
                        "logseq-pdf-qualification-{}-{stamp}",
                        std::process::id()
                    ))
                });
            // A fresh private directory prevents clobbering any user file.
            std::fs::create_dir(&directory)
                .map_err(|error| format!("fresh evidence directory: {error}"))?;
            let directory = directory
                .canonicalize()
                .map_err(|error| error.to_string())?;
            write_pdf(&directory.join("original.pdf"), false)?;
            write_pdf(&directory.join("replacement.pdf"), true)?;
            let root_directory = directory.to_string_lossy().into_owned();
            let components = platform::Components::default();
            nsh_app_logseq::extensions::register_pdf(&components);
            // A test-only hard deadline protects even a blocked AppKit loop.
            std::thread::spawn(|| {
                std::thread::sleep(Duration::from_secs(55));
                if STATUS.load(Ordering::Acquire) == 0 {
                    fail("PDFKit qualification exceeded 55 seconds");
                }
                std::thread::sleep(Duration::from_secs(5));
                eprintln!(
                    "PDFKit qualification did not terminate its own runner within 60 seconds"
                );
                std::process::exit(1);
            });
            let result = platform::run_app(
                platform::AppSource::Rust(platform::Root::new::<Qualification>(move || {
                    QualificationProps {
                        directory: root_directory.clone().into(),
                    }
                })),
                platform::AppOptions {
                    app_id: "com.logseq.pdf-qualification".into(),
                    title: "PDF qualification".into(),
                    background: true,
                    keep_size: true,
                    size: (900, 700),
                    components,
                    data_dir: Some(directory.join("native-data")),
                    cache: platform::CacheOptions::at(platform::CacheLocation::Dir(
                        directory.join("native-cache"),
                    )),
                    ..Default::default()
                },
            );
            if result != std::process::ExitCode::SUCCESS {
                return Err("native PDFKit runner failed".into());
            }
            require(
                STATUS.load(Ordering::Acquire) == 1,
                "PDFKit runner exited before qualification completed",
            )
        })();
        match result {
            Ok(()) => std::process::ExitCode::SUCCESS,
            Err(error) => {
                eprintln!("PDFKit qualification: {error}");
                std::process::ExitCode::FAILURE
            }
        }
    }
}
