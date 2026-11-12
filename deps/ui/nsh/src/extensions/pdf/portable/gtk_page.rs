//! Typed GTK page surface: pixels and native AccessibleText share one logical
//! character snapshot. This widget never owns or calls a PDFium handle.
use super::engine::{Bounds, Error, PageText, Raster, Tile};
use nsh_platform_linux::gtk::{self, gdk, glib, graphene, prelude::*, subclass::prelude::*};
use std::{
    cell::{Cell, RefCell},
    rc::Rc,
    sync::Arc,
};

#[derive(Debug, PartialEq)]
pub enum Action {
    Select {
        page: usize,
        width: i32,
        start: usize,
        end: usize,
    },
    Copy,
    Escape,
}
pub struct Mark {
    pub bounds: Bounds,
    pub color: gdk::RGBA,
}
struct Texture {
    tile: Tile,
    image: gdk::Texture,
    bytes: usize,
}
struct Page {
    epoch: u64,
    revision: u64,
    number: usize,
    width: i32,
    height: i32,
    pixels_per_point: f64,
    text: Option<Arc<PageText>>,
    textures: Vec<Texture>,
    marks: Vec<Mark>,
    anchor: usize,
    caret: usize,
}
mod imp {
    use super::*;
    #[derive(Default)]
    pub struct PageView {
        pub(super) page: RefCell<Option<Page>>,
        pub(super) action: RefCell<Option<Rc<dyn Fn(Action)>>>,
        pub(super) buffer: gtk::TextBuffer,
        pub(super) drag_start: Cell<Option<(usize, f64, f64)>>,
        pub(super) retired: Cell<bool>,
    }
    #[glib::object_subclass]
    impl ObjectSubclass for PageView {
        const NAME: &'static str = "LogseqPortablePdfPage";
        type Type = super::PageView;
        type ParentType = gtk::Widget;
        type Interfaces = (gtk::AccessibleText,);
        fn class_init(class: &mut Self::Class) {
            class.set_accessible_role(gtk::AccessibleRole::Document);
        }
    }
    impl ObjectImpl for PageView {
        fn constructed(&self) {
            self.parent_constructed();
            let obj = self.obj();
            obj.set_focusable(true);
            obj.set_overflow(gtk::Overflow::Hidden);
            obj.install_input();
        }
        fn dispose(&self) {
            self.retired.set(true);
            self.drag_start.set(None);
            self.action.borrow_mut().take();
            self.page.borrow_mut().take();
            self.buffer.set_text("");
        }
    }
    impl WidgetImpl for PageView {
        fn measure(&self, orientation: gtk::Orientation, _: i32) -> (i32, i32, i32, i32) {
            let value = self.page.borrow().as_ref().map_or(0, |page| {
                let pixels = if orientation == gtk::Orientation::Horizontal {
                    page.width
                } else {
                    page.height
                };
                (f64::from(pixels) / page.pixels_per_point).ceil() as i32
            });
            (value, value, -1, -1)
        }
        fn snapshot(&self, snapshot: &gtk::Snapshot) {
            let binding = self.page.borrow();
            let Some(page) = binding.as_ref() else { return };
            let scale = page.pixels_per_point as f32;
            let rect = |x, y, width, height| {
                graphene::Rect::new(x / scale, y / scale, width / scale, height / scale)
            };
            snapshot.append_color(
                &gdk::RGBA::WHITE,
                &rect(0.0, 0.0, page.width as f32, page.height as f32),
            );
            for texture in &page.textures {
                let tile = texture.tile;
                snapshot.append_texture(
                    &texture.image,
                    &rect(
                        tile.x as f32,
                        tile.y as f32,
                        tile.width as f32,
                        tile.height as f32,
                    ),
                );
            }
            let paint = |bounds: &Bounds, color: &gdk::RGBA| {
                snapshot.append_color(
                    color,
                    &rect(
                        bounds.x1 as f32,
                        bounds.y1 as f32,
                        (bounds.x2 - bounds.x1) as f32,
                        (bounds.y2 - bounds.y1) as f32,
                    ),
                );
            };
            for mark in &page.marks {
                paint(&mark.bounds, &mark.color);
            }
            let selection_color = gdk::RGBA::new(0.2, 0.45, 0.9, 0.35);
            let start = page.anchor.min(page.caret);
            let end = page.anchor.max(page.caret);
            if let Some(text) = &page.text {
                for glyph in &text.glyphs[start..end] {
                    if let Some(bounds) = &glyph.bounds {
                        paint(bounds, &selection_color);
                    }
                }
            }
        }
    }
    impl AccessibleTextImpl for PageView {
        fn caret_position(&self) -> u32 {
            self.buffer.cursor_position() as u32
        }
        fn contents(&self, start: u32, end: u32) -> Option<glib::Bytes> {
            let count = self.buffer.char_count() as u32;
            if start > count || end < start {
                return None;
            }
            let start = self.buffer.iter_at_offset(start as i32);
            let end = self.buffer.iter_at_offset(end.min(count) as i32);
            let mut text = self.buffer.text(&start, &end, true).as_bytes().to_vec();
            // GtkAccessibleText.get_contents requires a NUL-terminated result.
            text.push(0);
            Some(glib::Bytes::from_owned(text))
        }
        fn contents_at(
            &self,
            offset: u32,
            granularity: gtk::AccessibleTextGranularity,
        ) -> Option<(u32, u32, glib::Bytes)> {
            if offset >= self.buffer.char_count() as u32 {
                return None;
            }
            let mut start = self.buffer.iter_at_offset(offset as i32);
            let mut end = start;
            // GTK's TextIter uses native Unicode boundaries. No ASCII-only word
            // splitter or mismatched pixel-layout text engine is introduced.
            match granularity {
                gtk::AccessibleTextGranularity::Character => {
                    end.forward_char();
                }
                gtk::AccessibleTextGranularity::Word => {
                    if !start.starts_word() {
                        start.backward_word_start();
                    }
                    end.forward_word_end();
                }
                gtk::AccessibleTextGranularity::Sentence => {
                    if !start.starts_sentence() {
                        start.backward_sentence_start();
                    }
                    end.forward_sentence_end();
                }
                gtk::AccessibleTextGranularity::Line
                | gtk::AccessibleTextGranularity::Paragraph => {
                    start.set_line_offset(0);
                    end.forward_line();
                }
                _ => return None,
            }
            let text = self.buffer.text(&start, &end, true).as_bytes().to_vec();
            Some((
                start.offset() as u32,
                end.offset() as u32,
                glib::Bytes::from_owned(text),
            ))
        }
        fn selection(&self) -> Vec<gtk::AccessibleTextRange> {
            self.buffer
                .selection_bounds()
                .map(|(start, end)| {
                    gtk::AccessibleTextRange::new(
                        start.offset() as usize,
                        (end.offset() - start.offset()) as usize,
                    )
                })
                .into_iter()
                .collect()
        }
        fn attributes(
            &self,
            _: u32,
        ) -> Vec<(gtk::AccessibleTextRange, glib::GString, glib::GString)> {
            Vec::new()
        }
        fn default_attributes(&self) -> Vec<(glib::GString, glib::GString)> {
            vec![("editable".into(), "false".into())]
        }
    }
}
glib::wrapper! {
    pub struct PageView(ObjectSubclass<imp::PageView>) @extends gtk::Widget,
    @implements gtk::Accessible, gtk::AccessibleText, gtk::Buildable, gtk::ConstraintTarget;
}
impl Default for PageView {
    fn default() -> Self {
        glib::Object::new()
    }
}
impl PageView {
    pub fn set_action(&self, action: impl Fn(Action) + 'static) {
        assert!(
            !self.imp().retired.get(),
            "retired PDF widget cannot attach another handler"
        );
        *self.imp().action.borrow_mut() = Some(Rc::new(action));
    }
    /// Reset pixels before a new render generation; retained identity and native
    /// controllers stay intact. The owner has already validated this geometry.
    pub fn set_page(
        &self,
        epoch: u64,
        revision: u64,
        number: usize,
        width: i32,
        height: i32,
        pixels_per_point: f64,
    ) -> Result<(), Error> {
        if self.imp().retired.get()
            || epoch == 0
            || revision == 0
            || number == 0
            || width <= 0
            || height <= 0
            || !pixels_per_point.is_finite()
            || pixels_per_point < 1.0
            || f64::from(width) / pixels_per_point > f64::from(i32::MAX)
            || f64::from(height) / pixels_per_point > f64::from(i32::MAX)
        {
            return Err(Error::Failure(
                "PDF GTK page has invalid owner or geometry".into(),
            ));
        }
        let (anchor, caret) = self
            .imp()
            .page
            .borrow()
            .as_ref()
            .filter(|page| page.epoch == epoch && page.number == number)
            .map_or((0, 0), |page| (page.anchor, page.caret));
        self.imp().drag_start.set(None);
        *self.imp().page.borrow_mut() = Some(Page {
            epoch,
            revision,
            number,
            width,
            height,
            pixels_per_point,
            text: None,
            textures: Vec::new(),
            marks: Vec::new(),
            anchor,
            caret,
        });
        self.replace_text("");
        self.queue_resize();
        self.queue_draw();
        Ok(())
    }
    pub fn apply_tile(
        &self,
        epoch: u64,
        revision: u64,
        text: Arc<PageText>,
        raster: Raster,
    ) -> Result<bool, Error> {
        let mut binding = self.imp().page.borrow_mut();
        let Some(page) = binding.as_mut() else {
            return Ok(false);
        };
        if page.epoch != epoch || page.revision != revision || page.number != text.page {
            return Ok(false);
        }
        if page.width != text.width
            || page.height != text.height
            || raster.page_width != page.width
            || raster.page_height != page.height
            || raster.tile.x < 0
            || raster.tile.y < 0
            || raster.tile.width <= 0
            || raster.tile.height <= 0
            || i64::from(raster.tile.x) + i64::from(raster.tile.width) > i64::from(page.width)
            || i64::from(raster.tile.y) + i64::from(raster.tile.height) > i64::from(page.height)
        {
            return Err(Error::Failure(
                "PDF GTK tile does not match its captured page geometry".into(),
            ));
        }
        let bytes = (raster.tile.width as usize)
            .checked_mul(raster.tile.height as usize)
            .and_then(|pixels| pixels.checked_mul(4))
            .ok_or_else(|| Error::Failure("PDF GTK tile byte count overflowed".into()))?;
        if raster.rgba.len() != bytes {
            return Err(Error::Failure(
                "PDF GTK tile is not tightly packed RGBA".into(),
            ));
        }
        let replaced = page.textures.iter().position(|old| old.tile == raster.tile);
        let retained: usize = page
            .textures
            .iter()
            .enumerate()
            .filter(|(index, _)| Some(*index) != replaced)
            .map(|(_, texture)| texture.bytes)
            .sum();
        if retained + bytes > 32 * 1024 * 1024 || (replaced.is_none() && page.textures.len() >= 8) {
            return Err(Error::Failure(
                "PDF GTK page exceeds its visible texture budget".into(),
            ));
        }
        if text.glyphs.len() > 1_000_000 {
            return Err(Error::Failure(
                "PDF GTK text exceeds its character budget".into(),
            ));
        }
        let changed_text = page
            .text
            .as_ref()
            .is_none_or(|old| !Arc::ptr_eq(old, &text));
        let logical = changed_text.then(|| {
            text.glyphs
                .iter()
                .map(|glyph| glyph.unicode.unwrap_or(char::REPLACEMENT_CHARACTER))
                .collect::<String>()
        });
        page.anchor = page.anchor.min(text.glyphs.len());
        page.caret = page.caret.min(text.glyphs.len());
        let range = (page.anchor, page.caret);
        page.text = Some(text);
        let image = gdk::MemoryTexture::new(
            raster.tile.width,
            raster.tile.height,
            gdk::MemoryFormat::R8g8b8a8,
            &glib::Bytes::from_owned(raster.rgba),
            raster.tile.width as usize * 4,
        )
        .upcast();
        let texture = Texture {
            tile: raster.tile,
            image,
            bytes,
        };
        if let Some(index) = replaced {
            page.textures[index] = texture;
        } else {
            page.textures.push(texture);
        }
        drop(binding);
        if let Some(text) = logical {
            self.replace_text(&text);
            self.select(range.0, range.1, false);
        }
        self.queue_draw();
        Ok(true)
    }
    pub fn set_marks(&self, epoch: u64, marks: Vec<Mark>) -> Result<(), Error> {
        if marks.len() > 200_000
            || marks.iter().any(|mark| {
                let bounds = mark.bounds;
                ![bounds.x1, bounds.y1, bounds.x2, bounds.y2]
                    .iter()
                    .all(|v| v.is_finite())
                    || bounds.x2 < bounds.x1
                    || bounds.y2 < bounds.y1
                    || ![
                        mark.color.red(),
                        mark.color.green(),
                        mark.color.blue(),
                        mark.color.alpha(),
                    ]
                    .iter()
                    .all(|value| value.is_finite() && (0.0..=1.0).contains(value))
            })
        {
            return Err(Error::Failure(
                "PDF GTK highlight geometry exceeds its finite bounds".into(),
            ));
        }
        if let Some(page) = self
            .imp()
            .page
            .borrow_mut()
            .as_mut()
            .filter(|page| page.epoch == epoch)
        {
            page.marks = marks;
        }
        self.queue_draw();
        Ok(())
    }
    pub fn retire(&self) {
        self.imp().retired.set(true);
        self.imp().action.borrow_mut().take();
        self.imp().drag_start.set(None);
        self.imp().page.borrow_mut().take();
        self.replace_text("");
        self.set_focusable(false);
        self.queue_draw();
    }
    fn replace_text(&self, text: &str) {
        let old = self.imp().buffer.char_count() as u32;
        if old != 0 {
            self.update_contents(gtk::AccessibleTextContentChange::Remove, 0, old);
        }
        self.imp().buffer.set_text(text);
        let count = self.imp().buffer.char_count() as u32;
        if count != 0 {
            self.update_contents(gtk::AccessibleTextContentChange::Insert, 0, count);
        }
        self.update_caret_position();
        self.update_selection_bound();
    }
    fn emit(&self, action: Action) {
        let callback = self.imp().action.borrow().clone();
        if self.imp().page.borrow().is_some() && self.is_sensitive() {
            if let Some(callback) = callback {
                callback(action);
            }
        }
    }
    fn hit(&self, x: f64, y: f64) -> Option<usize> {
        if !self.is_sensitive() {
            return None;
        }
        let binding = self.imp().page.borrow();
        let page = binding.as_ref()?;
        let text = page.text.as_ref()?;
        let x = x * page.pixels_per_point;
        let y = y * page.pixels_per_point;
        if x < 0.0 || y < 0.0 || x > f64::from(page.width) || y > f64::from(page.height) {
            return None;
        }
        text.glyphs
            .iter()
            .enumerate()
            .filter_map(|(index, glyph)| {
                let bounds = glyph.bounds?;
                let dx = (bounds.x1 - x).max(0.0).max(x - bounds.x2);
                let dy = (bounds.y1 - y).max(0.0).max(y - bounds.y2);
                // Drag selection is a logical glyph range, not an assumed
                // left-to-right caret half. The same rule serves RTL/rotation.
                Some((index, dx * dx + dy * dy))
            })
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(offset, _)| offset)
    }
    fn select(&self, anchor: usize, caret: usize, publish: bool) {
        if !self.is_sensitive() {
            return;
        }
        let action = {
            let mut binding = self.imp().page.borrow_mut();
            let Some(page) = binding.as_mut() else { return };
            let Some(text) = &page.text else { return };
            page.anchor = anchor.min(text.glyphs.len());
            page.caret = caret.min(text.glyphs.len());
            let first = page.anchor.min(page.caret);
            let last = page.anchor.max(page.caret);
            let logical = |offset| {
                text.glyphs.get(offset).map_or_else(
                    || text.glyphs.last().map_or(0, |glyph| glyph.index + 1),
                    |glyph| glyph.index,
                )
            };
            self.imp().buffer.select_range(
                &self.imp().buffer.iter_at_offset(page.caret as i32),
                &self.imp().buffer.iter_at_offset(page.anchor as i32),
            );
            Action::Select {
                page: page.number,
                width: page.width,
                start: logical(first),
                end: logical(last),
            }
        };
        self.update_caret_position();
        self.update_selection_bound();
        self.queue_draw();
        if publish {
            self.emit(action);
        }
    }
    fn install_input(&self) {
        let drag = gtk::GestureDrag::new();
        drag.set_button(1);
        let weak = self.downgrade();
        drag.connect_drag_begin(move |_, x, y| {
            if let Some(view) = weak.upgrade() {
                view.imp().drag_start.set(None);
                if let Some(hit) = view.hit(x, y) {
                    view.grab_focus();
                    view.imp().drag_start.set(Some((hit, x, y)));
                    view.select(hit, hit, false);
                }
            }
        });
        let weak = self.downgrade();
        drag.connect_drag_update(move |_, dx, dy| {
            if let Some(view) = weak.upgrade() {
                if let Some((anchor, x, y)) = view.imp().drag_start.get() {
                    if dx * dx + dy * dy >= 9.0 {
                        if let Some(hit) = view.hit(x + dx, y + dy) {
                            if hit < anchor {
                                view.select(anchor + 1, hit, false);
                            } else {
                                view.select(anchor, hit + 1, false);
                            }
                        }
                    }
                }
            }
        });
        let weak = self.downgrade();
        drag.connect_drag_end(move |_, _, _| {
            if let Some(view) = weak.upgrade() {
                if view.imp().drag_start.take().is_some() {
                    let range = view
                        .imp()
                        .page
                        .borrow()
                        .as_ref()
                        .map(|page| (page.anchor, page.caret));
                    if let Some((anchor, caret)) = range {
                        view.select(anchor, caret, true);
                    }
                }
            }
        });
        self.add_controller(drag);
        let keys = gtk::EventControllerKey::new();
        let weak = self.downgrade();
        keys.connect_key_pressed(move |_, key, _, modifiers| {
            weak.upgrade()
                .is_some_and(|view| view.key(key, modifiers))
                .into()
        });
        self.add_controller(keys);
    }
    fn key(&self, key: gdk::Key, modifiers: gdk::ModifierType) -> bool {
        if !self.is_sensitive()
            || self
                .imp()
                .page
                .borrow()
                .as_ref()
                .is_none_or(|page| page.text.is_none())
        {
            return false;
        }
        let control =
            modifiers.intersects(gdk::ModifierType::CONTROL_MASK | gdk::ModifierType::META_MASK);
        if control && (key == gdk::Key::c || key == gdk::Key::C) {
            self.emit(Action::Copy);
            return true;
        }
        if key == gdk::Key::Escape {
            self.emit(Action::Escape);
            return true;
        }
        let range = self.imp().page.borrow().as_ref().and_then(|page| {
            page.text
                .as_ref()
                .map(|text| (page.anchor, page.caret, text.glyphs.len()))
        });
        let Some((anchor, caret, count)) = range else {
            return false;
        };
        if control && (key == gdk::Key::a || key == gdk::Key::A) {
            self.select(0, count, true);
            return true;
        }
        let mut iter = self.imp().buffer.iter_at_offset(caret as i32);
        match key {
            gdk::Key::Left => {
                if control {
                    iter.backward_word_start();
                } else {
                    iter.backward_cursor_position();
                }
            }
            gdk::Key::Right => {
                if control {
                    iter.forward_word_end();
                } else {
                    iter.forward_cursor_position();
                }
            }
            gdk::Key::Home => {
                if control {
                    iter = self.imp().buffer.start_iter();
                } else {
                    iter.set_line_offset(0);
                }
            }
            gdk::Key::End => {
                if control {
                    iter = self.imp().buffer.end_iter();
                } else {
                    iter.forward_to_line_end();
                }
            }
            _ => return false,
        }
        let caret = iter.offset() as usize;
        self.select(
            if modifiers.contains(gdk::ModifierType::SHIFT_MASK) {
                anchor
            } else {
                caret
            },
            caret,
            true,
        );
        true
    }
}

#[cfg(test)]
mod tests {
    use super::super::engine::Glyph;
    use super::*;

    fn sample() -> (Arc<PageText>, Raster) {
        let text = Arc::new(PageText {
            page: 2,
            width: 30,
            height: 10,
            glyphs: "aé中"
                .chars()
                .enumerate()
                .map(|(index, unicode)| Glyph {
                    index: index + 42,
                    unicode: Some(unicode),
                    bounds: Some(Bounds {
                        x1: (index * 10) as f64,
                        y1: 0.0,
                        x2: ((index + 1) * 10) as f64,
                        y2: 10.0,
                    }),
                })
                .collect(),
        });
        let raster = Raster {
            tile: Tile {
                x: 0,
                y: 0,
                width: 30,
                height: 10,
            },
            page_width: 30,
            page_height: 10,
            rgba: vec![255; 30 * 10 * 4],
        };
        (text, raster)
    }

    #[test]
    fn native_accessible_text_selection_and_retirement_share_one_page_owner() {
        gtk::init()
            .expect("the GTK page qualification target requires a real display (CI uses Xvfb)");
        let view = PageView::default();
        let actions = Rc::new(RefCell::new(Vec::new()));
        let captured = actions.clone();
        let weak = view.downgrade();
        view.set_action(move |action| {
            let retire = action == Action::Copy;
            captured.borrow_mut().push(action);
            if retire {
                weak.upgrade().unwrap().retire();
            }
        });
        view.set_page(1, 1, 2, 30, 10, 1.0).unwrap();
        let (text, raster) = sample();
        assert!(view.apply_tile(1, 1, text, raster).unwrap());
        assert_eq!(
            &*view.imp().contents(0, u32::MAX).unwrap(),
            "aé中\0".as_bytes()
        );
        let (start, end, contents) = view
            .imp()
            .contents_at(2, gtk::AccessibleTextGranularity::Character)
            .unwrap();
        assert_eq!((start, end), (2, 3));
        assert_eq!(
            &*contents,
            "中".as_bytes(),
            "native character offsets must not become UTF-8 byte offsets"
        );
        view.select(0, 3, true);
        let range = view.imp().selection()[0];
        assert_eq!((range.start(), range.length()), (0, 3));
        assert_eq!(view.imp().caret_position(), 3);
        view.set_page(1, 2, 2, 30, 10, 1.0).unwrap();
        let (text, raster) = sample();
        assert!(view.apply_tile(1, 2, text, raster).unwrap());
        assert_eq!(
            view.imp().caret_position(),
            3,
            "retained logical selection survives a render generation"
        );
        assert_eq!(
            &*actions.borrow(),
            &[Action::Select {
                page: 2,
                width: 30,
                start: 42,
                end: 45
            }]
        );
        view.set_marks(
            1,
            vec![Mark {
                bounds: Bounds {
                    x1: 0.0,
                    y1: 0.0,
                    x2: 10.0,
                    y2: 10.0,
                },
                color: gdk::RGBA::new(0.0, 0.2, 1.0, 0.3),
            }],
        )
        .unwrap();
        assert_eq!(
            view.imp().page.borrow().as_ref().unwrap().marks[0].color,
            gdk::RGBA::new(0.0, 0.2, 1.0, 0.3)
        );
        let (text, raster) = sample();
        assert!(
            !view.apply_tile(1, 1, text, raster).unwrap(),
            "late/other-render tiles cannot replace native pixels or text"
        );
        view.set_sensitive(false);
        view.select(1, 2, true);
        assert!(!view.key(gdk::Key::c, gdk::ModifierType::CONTROL_MASK));
        assert_eq!(actions.borrow().len(), 1);
        view.set_sensitive(true);
        assert!(view.key(gdk::Key::c, gdk::ModifierType::CONTROL_MASK));
        assert_eq!(actions.borrow().last(), Some(&Action::Copy));
        assert_eq!(
            view.imp().buffer.char_count(),
            0,
            "reentrant retirement clears native text and callback"
        );
        let (text, raster) = sample();
        assert!(!view.apply_tile(1, 1, text, raster).unwrap());
        assert!(!view.key(gdk::Key::Escape, gdk::ModifierType::empty()));
        assert_eq!(actions.borrow().len(), 2);
        assert!(
            view.set_page(2, 1, 2, 30, 10, 1.0).is_err(),
            "retirement cannot be reversed by a late open"
        );
    }
}
