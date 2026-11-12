use super::super::text::Builder;
use super::*;
use nsh_platform_windows::windows::Win32::{
    System::{
        Com::SAFEARRAY,
        Ole::{
            OleInitialize, OleUninitialize, SafeArrayDestroy, SafeArrayGetElement,
            SafeArrayGetLBound, SafeArrayGetUBound, SafeArrayGetVartype,
        },
        Variant::{VT_R8, VT_UNKNOWN},
    },
    UI::WindowsAndMessaging::{
        DestroyWindow, GWL_STYLE, GetWindowLongPtrW, SetParent, SetWindowLongPtrW, WS_CHILD,
        WS_CLIPSIBLINGS, WS_POPUP,
    },
};
struct Apartment;
impl Apartment {
    fn new() -> Self {
        // SAFETY: this private native test thread owns its OLE apartment.
        unsafe { OleInitialize(None) }.unwrap();
        Self
    }
}
impl Drop for Apartment {
    fn drop(&mut self) {
        unsafe {
            OleUninitialize();
        }
    }
}
struct Array(*mut SAFEARRAY);
impl Drop for Array {
    fn drop(&mut self) {
        unsafe { SafeArrayDestroy(self.0) }.unwrap();
    }
}
impl Array {
    fn count(&self) -> i32 {
        unsafe { SafeArrayGetUBound(self.0, 1) }.unwrap()
            - unsafe { SafeArrayGetLBound(self.0, 1) }.unwrap()
            + 1
    }
    fn doubles(&self) -> Vec<f64> {
        assert_eq!(unsafe { SafeArrayGetVartype(self.0) }.unwrap(), VT_R8);
        (0..self.count())
            .map(|index| {
                let mut value = 0.0_f64;
                // SAFETY: checked VT_R8 and an in-range scalar output of that type.
                unsafe {
                    SafeArrayGetElement(self.0, &index, std::ptr::from_mut(&mut value).cast())
                }
                .unwrap();
                value
            })
            .collect()
    }
}
fn document(first: &str, second: &str) -> Arc<Document> {
    let mut builder = Builder::default();
    builder.append(1, 42, first.chars()).unwrap();
    builder.append(2, 0, second.chars()).unwrap();
    Arc::new(builder.finish().unwrap())
}
fn text(provider: &IRawElementProviderSimple) -> ITextProvider {
    provider.cast().unwrap()
}
fn assert_code<T>(result: Result<T>, code: u32) {
    match result {
        Ok(_) => panic!("expected an actual COM failure"),
        Err(error) => assert_eq!(error.code(), HRESULT(code as i32)),
    }
}

#[test]
fn actual_generated_provider_exposes_complete_unicode_and_native_visible_geometry() {
    let _apartment = Apartment::new();
    let calls = Rc::new(RefCell::new(Vec::new()));
    let captured = calls.clone();
    let host = TextHost::new(
        "Authored PDF".into(),
        1,
        document("a😀e\u{301}", "Second"),
        move |command| {
            match command {
                Command::Select(span) => captured.borrow_mut().push(("select", span, false)),
                Command::Scroll { range, align_top } => {
                    captured.borrow_mut().push(("scroll", range, align_top))
                }
            }
            Ok(())
        },
    )
    .unwrap();
    let provider = host.provider().unwrap();
    let pattern = text(&provider);
    let full = unsafe { pattern.DocumentRange() }.unwrap();
    assert_eq!(
        String::try_from(unsafe { full.GetText(-1) }.unwrap()).unwrap(),
        "a😀e\u{301}\u{c}Second"
    );
    let readonly: IValueProvider = provider.cast().unwrap();
    assert!(unsafe { readonly.IsReadOnly() }.unwrap().as_bool());
    assert_eq!(
        String::try_from(unsafe { readonly.Value() }.unwrap()).unwrap(),
        "a😀e\u{301}\u{c}Second"
    );
    assert!(unsafe { readonly.SetValue(PCWSTR::null()) }.is_err());
    let emoji = range::make(&host.state, 1..2).unwrap();
    assert_eq!(
        String::try_from(unsafe { emoji.GetText(1) }.unwrap()).unwrap(),
        ""
    );
    assert_eq!(
        String::try_from(unsafe { emoji.GetText(2) }.unwrap()).unwrap(),
        "😀"
    );
    let combining = range::make(&host.state, 3..3).unwrap();
    unsafe { combining.ExpandToEnclosingUnit(TextUnit_Character) }.unwrap();
    assert_eq!(
        String::try_from(unsafe { combining.GetText(-1) }.unwrap()).unwrap(),
        "e\u{301}"
    );
    let found = unsafe { full.FindText(&BSTR::from("second"), false, true) }.unwrap();
    assert_eq!(
        String::try_from(unsafe { found.GetText(-1) }.unwrap()).unwrap(),
        "Second"
    );
    let clone = unsafe { emoji.Clone() }.unwrap();
    assert!(unsafe { clone.Compare(&emoji) }.unwrap().as_bool());
    assert_eq!(
        unsafe {
            clone.CompareEndpoints(
                TextPatternRangeEndpoint_Start,
                &emoji,
                TextPatternRangeEndpoint_End,
            )
        }
        .unwrap(),
        -1
    );
    unsafe { found.Select() }.unwrap();
    assert_eq!(host.state.selection.get(), (5, 11));
    let selected = Array(unsafe { pattern.GetSelection() }.unwrap());
    assert_eq!(
        unsafe { SafeArrayGetVartype(selected.0) }.unwrap(),
        VT_UNKNOWN
    );
    assert_eq!(selected.count(), 1);
    unsafe { found.ScrollIntoView(true) }.unwrap();
    assert_eq!(
        &*calls.borrow(),
        &[("select", 5..11, false), ("scroll", 5..11, true)]
    );
    assert!(
        host.set_scene(
            1,
            1,
            Scene {
                viewport: Bounds {
                    x1: 0.0,
                    y1: 0.0,
                    x2: 30.0,
                    y2: 10.0
                },
                glyphs: vec![
                    GlyphRect {
                        offset: 0,
                        bounds: Bounds {
                            x1: 0.0,
                            y1: 0.0,
                            x2: 10.0,
                            y2: 10.0
                        }
                    },
                    GlyphRect {
                        offset: 1,
                        bounds: Bounds {
                            x1: 10.0,
                            y1: 0.0,
                            x2: 20.0,
                            y2: 10.0
                        }
                    }
                ],
                visible: vec![0..2],
            }
        )
        .unwrap()
    );
    let visible = Array(unsafe { pattern.GetVisibleRanges() }.unwrap());
    assert_eq!(visible.count(), 1);
    let rectangles = Array(unsafe { emoji.GetBoundingRectangles() }.unwrap()).doubles();
    let origin = host.state.origin().unwrap();
    assert_eq!(rectangles, vec![origin.0 + 10.0, origin.1, 10.0, 10.0]);
    let point = unsafe {
        pattern.RangeFromPoint(UiaPoint {
            x: origin.0 + 15.0,
            y: origin.1 + 5.0,
        })
    }
    .unwrap();
    assert_eq!(
        unsafe {
            point.CompareEndpoints(
                TextPatternRangeEndpoint_Start,
                &emoji,
                TextPatternRangeEndpoint_Start,
            )
        }
        .unwrap(),
        0
    );
    host.set_enabled(false).unwrap();
    assert_code(unsafe { emoji.Select() }, UIA_E_ELEMENTNOTENABLED);
    assert_eq!(
        String::try_from(unsafe { emoji.GetText(-1) }.unwrap()).unwrap(),
        "😀",
        "disabled actions do not hide readable text"
    );
    host.set_enabled(true).unwrap();
    host.set_selection(1, 0..0).unwrap();
    host.close().unwrap();
    assert_code(unsafe { full.GetText(-1) }, UIA_E_ELEMENTNOTAVAILABLE);
}

#[test]
fn retained_provider_and_range_do_not_keep_replaced_or_closed_document_alive() {
    let _apartment = Apartment::new();
    let doc = document("Old", "Text");
    let old_doc = Arc::downgrade(&doc);
    let host = TextHost::new("Old PDF".into(), 7, doc, |_| Ok(())).unwrap();
    let old_provider = host.provider().unwrap();
    let old_text = text(&old_provider);
    let old_range = unsafe { old_text.DocumentRange() }.unwrap();
    host.replace_document("New PDF".into(), 8, document("New", "Document"))
        .unwrap();
    assert!(
        old_doc.upgrade().is_none(),
        "external UIA objects retain no old document snapshot"
    );
    assert_code(
        unsafe { old_text.DocumentRange() },
        UIA_E_ELEMENTNOTAVAILABLE,
    );
    assert_code(unsafe { old_range.GetText(-1) }, UIA_E_ELEMENTNOTAVAILABLE);
    let current_provider = host.provider().unwrap();
    let current_range = unsafe { text(&current_provider).DocumentRange() }.unwrap();
    assert_eq!(
        String::try_from(unsafe { current_range.GetText(-1) }.unwrap()).unwrap(),
        "New\u{c}Document"
    );
    let current_doc = Arc::downgrade(host.state.document.borrow().as_ref().unwrap());
    host.close().unwrap();
    assert!(current_doc.upgrade().is_none());
    assert_code(
        unsafe { current_range.GetText(-1) },
        UIA_E_ELEMENTNOTAVAILABLE,
    );
    assert_code(
        unsafe { current_provider.GetPropertyValue(UIA_NamePropertyId) },
        UIA_E_ELEMENTNOTAVAILABLE,
    );
    drop(host);
    assert_code(unsafe { old_range.Clone() }, UIA_E_ELEMENTNOTAVAILABLE);
}

#[test]
fn actual_parent_destroy_invalidates_ui_automation_without_explicit_reader_close() {
    let _apartment = Apartment::new();
    struct Empty;
    impl Handler for Empty {
        fn message(&self, _: HWND, _: u32, _: WPARAM, _: LPARAM) -> Option<LRESULT> {
            None
        }
    }
    let parent = OwnedWindow::new(Empty).unwrap();
    let host = TextHost::new("Private child".into(), 1, document("child", "text"), |_| {
        Ok(())
    })
    .unwrap();
    let provider = host.provider().unwrap();
    let retained = unsafe { text(&provider).DocumentRange() }.unwrap();
    let hwnd = host.hwnd().unwrap();
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
    assert!(host.hwnd().is_none());
    assert!(host.state.document.borrow().is_none());
    assert_code(unsafe { retained.GetText(-1) }, UIA_E_ELEMENTNOTAVAILABLE);
}

#[test]
fn reentrant_real_window_destruction_cannot_acknowledge_selection_for_closed_owner() {
    let _apartment = Apartment::new();
    let holder = Rc::new(RefCell::new(Weak::<State>::new()));
    let captured = holder.clone();
    let host = TextHost::new("Reentrant".into(), 1, document("one", "two"), move |_| {
        let state = captured.borrow().upgrade().unwrap();
        let hwnd = state.hwnd.get().unwrap();
        unsafe { DestroyWindow(hwnd) }.unwrap();
        Ok(())
    })
    .unwrap();
    *holder.borrow_mut() = Rc::downgrade(&host.state);
    let range = range::make(&host.state, 0..2).unwrap();
    assert_code(unsafe { range.Select() }, UIA_E_ELEMENTNOTAVAILABLE);
    assert!(host.hwnd().is_none());
    assert!(host.state.document.borrow().is_none());
    assert_eq!(host.state.selection.get(), (0, 0));
}

#[test]
fn reentrant_newer_selection_wins_and_cross_owner_ranges_are_rejected() {
    let _apartment = Apartment::new();
    let holder = Rc::new(RefCell::new(Weak::<State>::new()));
    let captured = holder.clone();
    let entered = Rc::new(Cell::new(false));
    let nested = entered.clone();
    let host = TextHost::new(
        "Reentrant selection".into(),
        1,
        document("one", "two"),
        move |_| {
            if !nested.replace(true) {
                captured
                    .borrow()
                    .upgrade()
                    .unwrap()
                    .dispatch(1, Command::Select(2..3))?;
            }
            Ok(())
        },
    )
    .unwrap();
    *holder.borrow_mut() = Rc::downgrade(&host.state);
    let older = range::make(&host.state, 0..1).unwrap();
    assert_code(unsafe { older.Select() }, UIA_E_INVALIDOPERATION);
    assert_eq!(host.state.selection.get(), (2, 3));
    let other =
        TextHost::new("Other".into(), 1, document("other", "document"), |_| Ok(())).unwrap();
    let foreign = range::make(&other.state, 0..1).unwrap();
    assert!(unsafe { older.Compare(&foreign) }.is_err());
    assert!(
        unsafe {
            older.MoveEndpointByRange(
                TextPatternRangeEndpoint_Start,
                &foreign,
                TextPatternRangeEndpoint_End,
            )
        }
        .is_err()
    );
}

#[test]
fn outstanding_com_objects_are_bounded_and_normal_drop_releases_the_budget() {
    let _apartment = Apartment::new();
    let host = TextHost::new("Bounded".into(), 1, document("one", "two"), |_| Ok(())).unwrap();
    let _provider = host.provider().unwrap();
    let mut ranges = Vec::new();
    for _ in 1..OBJECT_BUDGET {
        ranges.push(range::make(&host.state, 0..1).unwrap());
    }
    assert!(range::make(&host.state, 0..1).is_err());
    assert_eq!(host.state.objects.get(), OBJECT_BUDGET);
    drop(ranges);
    assert_eq!(host.state.objects.get(), 1);
    assert!(range::make(&host.state, 0..1).is_ok());
}

#[test]
fn unit_movement_and_single_selection_operations_keep_exact_logical_endpoints() {
    let _apartment = Apartment::new();
    let host = TextHost::new(
        "Range semantics".into(),
        1,
        document("one two", "three"),
        |_| Ok(()),
    )
    .unwrap();
    let span = range::make(&host.state, 1..6).unwrap();
    assert_eq!(unsafe { span.Move(TextUnit_Word, 0) }.unwrap(), 0);
    assert_eq!(
        String::try_from(unsafe { span.GetText(-1) }.unwrap()).unwrap(),
        "ne tw"
    );
    let whole = unsafe { text(&host.provider().unwrap()).DocumentRange() }.unwrap();
    let before = unsafe { whole.Clone() }.unwrap();
    assert_eq!(unsafe { whole.Move(TextUnit_Page, -1) }.unwrap(), 0);
    assert!(unsafe { whole.Compare(&before) }.unwrap().as_bool());
    unsafe { span.Select() }.unwrap();
    let caret = range::make(&host.state, 3..3).unwrap();
    unsafe { caret.AddToSelection() }.unwrap();
    assert_eq!(host.state.selection.get(), (3, 3));
    unsafe { span.Select() }.unwrap();
    unsafe { caret.RemoveFromSelection() }.unwrap();
    assert_eq!(host.state.selection.get(), (3, 3));
    let original = unsafe { span.Clone() }.unwrap();
    assert!(
        unsafe { span.MoveEndpointByUnit(TextPatternRangeEndpoint(99), TextUnit_Character, 1) }
            .is_err()
    );
    assert!(unsafe { span.Compare(&original) }.unwrap().as_bool());
    assert!(range::make(&host.state, 0..1000).is_err());
}
