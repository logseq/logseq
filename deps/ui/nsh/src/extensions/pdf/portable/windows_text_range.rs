use super::super::text::Unit;
use super::*;
use nsh_platform_windows::windows::Win32::{
    Foundation::{ERROR_SUCCESS, GetLastError, SetLastError},
    Globalization::{
        FIND_FROMEND, FIND_FROMSTART, FindNLSStringEx, LOCALE_NAME_INVARIANT, NORM_IGNORECASE,
    },
};
#[implement(ITextRangeProvider, Agile = false)]
struct TextRange {
    life: Life,
    span: Cell<(usize, usize)>,
}
pub(super) fn make(state: &Rc<State>, span: Range<usize>) -> Result<ITextRangeProvider> {
    if !state.document()?.valid(&span) {
        return Err(argument());
    }
    Ok(TextRange {
        life: Life::new(state)?,
        span: Cell::new((span.start, span.end)),
    }
    .into())
}
fn unit(value: TextUnit) -> Result<Unit> {
    if value == TextUnit_Character {
        Ok(Unit::Character)
    } else if value == TextUnit_Word || value == TextUnit_Format {
        Ok(Unit::Word)
    } else if value == TextUnit_Line {
        Ok(Unit::Line)
    } else if value == TextUnit_Page || value == TextUnit_Paragraph {
        Ok(Unit::Page)
    } else if value == TextUnit_Document {
        Ok(Unit::Document)
    } else {
        Err(argument())
    }
}
fn endpoint(value: TextPatternRangeEndpoint, span: (usize, usize)) -> Result<usize> {
    if value == TextPatternRangeEndpoint_Start {
        Ok(span.0)
    } else if value == TextPatternRangeEndpoint_End {
        Ok(span.1)
    } else {
        Err(argument())
    }
}
impl TextRange_Impl {
    fn span(&self) -> Range<usize> {
        let (start, end) = self.span.get();
        start..end
    }
    fn peer(&self, range: Ref<ITextRangeProvider>) -> Result<(usize, usize)> {
        self.life.state()?;
        // Public, checked Rust/COM dynamic cast. A foreign implementation never
        // has its object memory interpreted as this private range type.
        let peer = range
            .ok()?
            .cast_object_ref::<TextRange>()
            .map_err(|_| argument())?;
        peer.life.state()?;
        if !Weak::ptr_eq(&self.life.owner, &peer.life.owner) || self.life.epoch != peer.life.epoch {
            return Err(argument());
        }
        Ok(peer.span.get())
    }
    fn set_endpoint(&self, which: TextPatternRangeEndpoint, offset: usize) -> Result<()> {
        let (mut start, mut end) = self.span.get();
        if which == TextPatternRangeEndpoint_Start {
            start = offset;
            end = end.max(start);
        } else if which == TextPatternRangeEndpoint_End {
            end = offset;
            start = start.min(end);
        } else {
            return Err(argument());
        }
        self.span.set((start, end));
        Ok(())
    }
}
impl ITextRangeProvider_Impl for TextRange_Impl {
    fn Clone(&self) -> Result<ITextRangeProvider> {
        make(&self.life.state()?, self.span())
    }
    fn Compare(&self, other: Ref<ITextRangeProvider>) -> Result<BOOL> {
        Ok((self.span.get() == self.peer(other)?).into())
    }
    fn CompareEndpoints(
        &self,
        own_endpoint: TextPatternRangeEndpoint,
        other: Ref<ITextRangeProvider>,
        other_endpoint: TextPatternRangeEndpoint,
    ) -> Result<i32> {
        let peer = self.peer(other)?;
        Ok(
            endpoint(own_endpoint, self.span.get())? as i32
                - endpoint(other_endpoint, peer)? as i32,
        )
    }
    fn ExpandToEnclosingUnit(&self, value: TextUnit) -> Result<()> {
        let state = self.life.state()?;
        let span = state.document()?.enclosing(self.span.get().0, unit(value)?);
        self.span.set((span.start, span.end));
        Ok(())
    }
    fn FindAttribute(
        &self,
        attribute: UIA_TEXTATTRIBUTE_ID,
        value: &VARIANT,
        backward: BOOL,
    ) -> Result<ITextRangeProvider> {
        let state = self.life.state()?;
        let expected = bool::try_from(value).map_err(|_| argument())?;
        if attribute == UIA_IsReadOnlyAttributeId {
            return if expected {
                make(&state, self.span())
            } else {
                absent()
            };
        }
        if attribute != UIA_IsHiddenAttributeId {
            return Err(Error::from_hresult(HRESULT(UIA_E_NOTSUPPORTED as i32)));
        }
        let span = self.span();
        let visible = state.scene.borrow().visible.clone();
        let mut portions = Vec::new();
        let mut position = span.start;
        for shown in visible {
            let start = shown.start.max(span.start);
            let end = shown.end.min(span.end);
            if start >= end {
                continue;
            }
            if expected && position < start {
                portions.push(position..start);
            }
            if !expected {
                portions.push(start..end);
            }
            position = position.max(end);
        }
        if expected && position < span.end {
            portions.push(position..span.end);
        }
        let found = if backward.as_bool() {
            portions.pop()
        } else {
            portions.into_iter().next()
        };
        match found {
            Some(found) => make(&state, found),
            None => absent(),
        }
    }
    fn FindText(
        &self,
        needle: &BSTR,
        backward: BOOL,
        ignore_case: BOOL,
    ) -> Result<ITextRangeProvider> {
        let state = self.life.state()?;
        if needle.is_empty() || needle.len() > 64 * 1024 || String::try_from(needle).is_err() {
            return Err(argument());
        }
        let document = state.document()?;
        let span = self.span();
        if !ignore_case.as_bool() {
            let needle = String::try_from(needle).map_err(|_| argument())?;
            let source = document.slice(span.clone()).map_err(|_| argument())?;
            let found = if backward.as_bool() {
                source.rfind(&needle)
            } else {
                source.find(&needle)
            };
            return match found {
                Some(byte) => {
                    let start = span.start + source[..byte].chars().count();
                    make(&state, start..start + needle.chars().count())
                }
                None => absent(),
            };
        }
        let source = document.utf16(span.clone(), None).map_err(|_| argument())?;
        let flags = (if backward.as_bool() {
            FIND_FROMEND
        } else {
            FIND_FROMSTART
        }) | if ignore_case.as_bool() {
            NORM_IGNORECASE.0
        } else {
            0
        };
        let mut length = 0;
        // SAFETY: bounded valid UTF-16 slices, initialized output length and no
        // custom sort callback. Windows supplies its real Unicode comparison.
        let found = unsafe {
            SetLastError(ERROR_SUCCESS);
            FindNLSStringEx(
                LOCALE_NAME_INVARIANT,
                flags,
                &source,
                needle,
                Some(&mut length),
                None,
                None,
                LPARAM(0),
            )
        };
        if found < 0 {
            let error = unsafe { GetLastError() };
            if error != ERROR_SUCCESS {
                return Err(Error::from_hresult(HRESULT::from_win32(error.0)));
            }
            return absent();
        }
        if length <= 0 || found as usize + length as usize > source.len() {
            return Err(argument());
        }
        let prefix = String::from_utf16(&source[..found as usize]).map_err(|_| argument())?;
        let matched = String::from_utf16(&source[found as usize..found as usize + length as usize])
            .map_err(|_| argument())?;
        let start = span.start + prefix.chars().count();
        let end = start + matched.chars().count();
        self.life.state()?;
        make(&state, start..end)
    }
    fn GetAttributeValue(&self, attribute: UIA_TEXTATTRIBUTE_ID) -> Result<VARIANT> {
        let state = self.life.state()?;
        if attribute == UIA_IsReadOnlyAttributeId {
            return Ok(VARIANT::from(true));
        }
        if attribute == UIA_IsHiddenAttributeId {
            let span = self.span();
            let scene = state.scene.borrow();
            if span.is_empty() {
                return Ok(VARIANT::from(
                    !scene
                        .visible
                        .iter()
                        .any(|shown| shown.start <= span.start && shown.end >= span.end),
                ));
            }
            let visible: usize = scene
                .visible
                .iter()
                .map(|shown| {
                    shown
                        .end
                        .min(span.end)
                        .saturating_sub(shown.start.max(span.start))
                })
                .sum();
            if visible == 0 {
                return Ok(VARIANT::from(true));
            }
            if visible == span.len() {
                return Ok(VARIANT::from(false));
            }
            // SAFETY: UIA's typed reserved value for an attribute varying across
            // this range; VARIANT::from owns the returned IUnknown normally.
            return Ok(VARIANT::from(unsafe {
                UiaGetReservedMixedAttributeValue()?
            }));
        }
        // SAFETY: standard reserved value, not invented font/format metadata.
        Ok(VARIANT::from(unsafe { UiaGetReservedNotSupportedValue()? }))
    }
    fn GetBoundingRectangles(&self) -> Result<*mut SAFEARRAY> {
        let state = self.life.state()?;
        let span = self.span();
        let (origin_x, origin_y) = state.origin()?;
        let mut rects: Vec<[f64; 4]> = Vec::new();
        {
            let scene = state.scene.borrow();
            for glyph in &scene.glyphs {
                if !span.contains(&glyph.offset) {
                    continue;
                }
                let bounds = Bounds {
                    x1: glyph.bounds.x1.max(scene.viewport.x1),
                    y1: glyph.bounds.y1.max(scene.viewport.y1),
                    x2: glyph.bounds.x2.min(scene.viewport.x2),
                    y2: glyph.bounds.y2.min(scene.viewport.y2),
                };
                if bounds.x1 >= bounds.x2 || bounds.y1 >= bounds.y2 {
                    continue;
                }
                let next = [
                    bounds.x1 + origin_x,
                    bounds.y1 + origin_y,
                    bounds.x2 - bounds.x1,
                    bounds.y2 - bounds.y1,
                ];
                if let Some(last) = rects.last_mut() {
                    let overlap = (last[1] + last[3]).min(next[1] + next[3]) - last[1].max(next[1]);
                    let gap = (last[0] - next[0] - next[2]).max(next[0] - last[0] - last[2]);
                    if overlap >= last[3].min(next[3]) * 0.5 && gap <= last[3].max(next[3]) * 2.0 {
                        let right = (last[0] + last[2]).max(next[0] + next[2]);
                        let bottom = (last[1] + last[3]).max(next[1] + next[3]);
                        last[0] = last[0].min(next[0]);
                        last[1] = last[1].min(next[1]);
                        last[2] = right - last[0];
                        last[3] = bottom - last[1];
                        continue;
                    }
                }
                rects.push(next);
            }
        }
        self.life.state()?;
        arrays::rectangles(&rects)
    }
    fn GetEnclosingElement(&self) -> Result<IRawElementProviderSimple> {
        self.life.state()?.provider()
    }
    fn GetText(&self, max_length: i32) -> Result<BSTR> {
        let state = self.life.state()?;
        if max_length < -1 {
            return Err(argument());
        }
        let text = state
            .document()?
            .utf16(
                self.span(),
                (max_length >= 0).then_some(max_length as usize),
            )
            .map_err(|_| argument())?;
        Ok(BSTR::from_wide(&text))
    }
    fn Move(&self, value: TextUnit, count: i32) -> Result<i32> {
        let state = self.life.state()?;
        let (span, moved) = state
            .document()?
            .move_range(self.span(), unit(value)?, count);
        self.span.set((span.start, span.end));
        Ok(moved)
    }
    fn MoveEndpointByUnit(
        &self,
        which: TextPatternRangeEndpoint,
        value: TextUnit,
        count: i32,
    ) -> Result<i32> {
        let state = self.life.state()?;
        let current = endpoint(which, self.span.get())?;
        let (offset, moved) = state
            .document()?
            .move_endpoint(current, unit(value)?, count);
        self.set_endpoint(which, offset)?;
        Ok(moved)
    }
    fn MoveEndpointByRange(
        &self,
        which: TextPatternRangeEndpoint,
        other: Ref<ITextRangeProvider>,
        other_endpoint: TextPatternRangeEndpoint,
    ) -> Result<()> {
        let peer = self.peer(other)?;
        self.set_endpoint(which, endpoint(other_endpoint, peer)?)
    }
    fn Select(&self) -> Result<()> {
        self.life
            .state()?
            .dispatch(self.life.epoch, Command::Select(self.span()))
    }
    fn AddToSelection(&self) -> Result<()> {
        let state = self.life.state()?;
        let span = self.span();
        let (start, end) = state.selection.get();
        if span.is_empty() {
            return state.dispatch(self.life.epoch, Command::Select(span));
        }
        if start != end && (span.end < start || span.start > end) {
            return Err(invalid_operation());
        }
        let span = if start == end {
            span
        } else {
            span.start.min(start)..span.end.max(end)
        };
        state.dispatch(self.life.epoch, Command::Select(span))
    }
    fn RemoveFromSelection(&self) -> Result<()> {
        let state = self.life.state()?;
        let span = self.span();
        let (start, end) = state.selection.get();
        if span.is_empty() {
            return state.dispatch(self.life.epoch, Command::Select(span));
        }
        if span.end <= start || span.start >= end {
            return Ok(());
        }
        let selection = if span.start <= start && span.end >= end {
            start..start
        } else if span.start <= start {
            span.end..end
        } else if span.end >= end {
            start..span.start
        } else {
            return Err(invalid_operation());
        };
        state.dispatch(self.life.epoch, Command::Select(selection))
    }
    fn ScrollIntoView(&self, align_top: BOOL) -> Result<()> {
        self.life.state()?.dispatch(
            self.life.epoch,
            Command::Scroll {
                range: self.span(),
                align_top: align_top.as_bool(),
            },
        )
    }
    fn GetChildren(&self) -> Result<*mut SAFEARRAY> {
        self.life.state()?;
        arrays::ranges(&[])
    }
}
