//! Safe, worker-local PDFium objects; only owned pixels/text/geometry leave a job.
//! No native handles or borrowed page/search objects cross the document scope.
use pdfium_render::prelude::*;
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug)]
pub enum Error {
    Password,
    Failure(String),
}
impl From<PdfiumError> for Error {
    fn from(error: PdfiumError) -> Self {
        match error {
            PdfiumError::PdfiumLibraryInternalError(PdfiumInternalError::PasswordError) => {
                Self::Password
            }
            error => Self::Failure(error.to_string()),
        }
    }
}
impl std::fmt::Display for Error {
    fn fmt(&self, output: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Password => output.write_str("PDF password is required or incorrect"),
            Self::Failure(message) => output.write_str(message),
        }
    }
}
impl std::error::Error for Error {}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
pub struct Bounds {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}
#[derive(Clone, Debug, Serialize)]
pub struct PageInfo {
    pub page: usize,
    pub width: f64,
    pub height: f64,
}
#[derive(Clone, Debug, Serialize)]
pub struct Glyph {
    pub index: usize,
    pub unicode: Option<char>,
    // Generated whitespace still belongs to logical text but paints no glyph.
    pub bounds: Option<Bounds>,
}
#[derive(Clone, Debug, Serialize)]
pub struct PageText {
    pub page: usize,
    pub width: i32,
    pub height: i32,
    pub glyphs: Vec<Glyph>,
}
#[derive(Clone, Debug, Serialize)]
pub struct SearchHit {
    pub page: usize,
    pub bounds: Vec<Bounds>,
}
#[derive(Clone, Debug, Serialize)]
pub struct Selection {
    pub page: usize,
    pub width: i32,
    pub height: i32,
    pub text: String,
    pub rects: Vec<Bounds>,
}
#[derive(Clone, Debug, Serialize)]
pub struct OutlineEntry {
    pub depth: usize,
    pub title: Option<String>,
    pub page: Option<usize>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Tile {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}
pub struct Raster {
    pub tile: Tile,
    pub page_width: i32,
    pub page_height: i32,
    pub rgba: Vec<u8>,
}

const MAX_TILE_PIXELS: i64 = 8 * 1024 * 1024;
const MAX_GLYPHS: usize = 1_000_000;
const MAX_SEARCH_HITS: usize = 20_000;
const MAX_OUTLINE_ENTRIES: usize = 100_000;

/// A packaged engine is resolved relative to the executable, never the current
/// directory, PATH, a system loader name or an application document URL.
pub fn packaged_library(executable: &Path) -> Result<PathBuf, Error> {
    if !executable.is_absolute() {
        return Err(Error::Failure(
            "PDF executable path must be absolute".into(),
        ));
    }
    let directory = executable
        .parent()
        .ok_or_else(|| Error::Failure("PDF executable has no directory".into()))?;
    Ok(directory
        .join("Resources/pdfium")
        .join(if cfg!(target_os = "windows") {
            "pdfium.dll"
        } else {
            "libpdfium.so"
        }))
}

/// Call on the document's worker. Every Pdfium borrow is dropped before its
/// instance; file-backed loading avoids an eager copy of the whole document.
pub fn with_document<T>(
    library: &Path,
    path: &Path,
    password: Option<&str>,
    use_document: impl FnOnce(&PdfDocument<'_>) -> Result<T, Error>,
) -> Result<T, Error> {
    if !library.is_absolute() || !path.is_absolute() {
        return Err(Error::Failure(
            "PDF engine and document paths must be absolute".into(),
        ));
    }
    let pdfium = match Pdfium::bind_to_library(library) {
        Ok(bindings) => Pdfium::new(bindings),
        // The reviewed wrapper's immutable OnceCell never resets. Its Default
        // returns an instance without loading any path in this exact branch;
        // no working-directory/system fallback can run after AlreadyInitialized.
        Err(PdfiumError::PdfiumLibraryBindingsAlreadyInitialized) => Pdfium::default(),
        Err(error) => return Err(error.into()),
    };
    let document = pdfium.load_pdf_from_file(path, password)?;
    use_document(&document)
}

pub fn page_count(document: &PdfDocument<'_>) -> Result<usize, Error> {
    usize::try_from(document.pages().len())
        .map_err(|_| Error::Failure("PDF page count is negative".into()))
}
fn page<'document>(
    document: &PdfDocument<'document>,
    number: usize,
) -> Result<PdfPage<'document>, Error> {
    let index = number
        .checked_sub(1)
        .and_then(|index| i32::try_from(index).ok())
        .ok_or_else(|| Error::Failure("PDF pages are numbered from one".into()))?;
    Ok(document.pages().get(index)?)
}
pub fn page_info(document: &PdfDocument<'_>, number: usize) -> Result<PageInfo, Error> {
    let page = page(document, number)?;
    let width = f64::from(page.width().value);
    let height = f64::from(page.height().value);
    if !width.is_finite() || !height.is_finite() || width <= 0.0 || height <= 0.0 {
        return Err(Error::Failure(
            "PDF page dimensions must be positive and finite".into(),
        ));
    }
    Ok(PageInfo {
        page: number,
        width,
        height,
    })
}
fn configuration(page: &PdfPage<'_>, width: i32) -> Result<(PdfRenderConfig, i32), Error> {
    let points_width = f64::from(page.width().value);
    let points_height = f64::from(page.height().value);
    if width <= 0
        || !points_width.is_finite()
        || !points_height.is_finite()
        || points_width <= 0.0
        || points_height <= 0.0
    {
        return Err(Error::Failure(
            "PDF page dimensions must be positive and finite".into(),
        ));
    }
    let height = (f64::from(width) * points_height / points_width).round();
    if !height.is_finite() || height < 1.0 || height > f64::from(i32::MAX) {
        return Err(Error::Failure(
            "PDF rendered page height exceeds its coordinate range".into(),
        ));
    }
    let height = height as i32;
    Ok((
        PdfRenderConfig::new()
            .set_fixed_size(width, height)
            .set_format(PdfBitmapFormat::BGRA)
            .limit_render_image_cache_size(true),
        height,
    ))
}
fn bounds(
    page: &PdfPage<'_>,
    rectangle: PdfRect,
    config: &PdfRenderConfig,
) -> Result<Bounds, Error> {
    let corners = [
        (rectangle.left(), rectangle.top()),
        (rectangle.right(), rectangle.top()),
        (rectangle.right(), rectangle.bottom()),
        (rectangle.left(), rectangle.bottom()),
    ];
    let mut result = Bounds {
        x1: f64::INFINITY,
        y1: f64::INFINITY,
        x2: f64::NEG_INFINITY,
        y2: f64::NEG_INFINITY,
    };
    for (x, y) in corners {
        let (x, y) = page.points_to_pixels(x, y, config)?;
        result.x1 = result.x1.min(f64::from(x));
        result.x2 = result.x2.max(f64::from(x));
        result.y1 = result.y1.min(f64::from(y));
        result.y2 = result.y2.max(f64::from(y));
    }
    Ok(result)
}

pub fn raster(
    document: &PdfDocument<'_>,
    number: usize,
    width: i32,
    tile: Tile,
) -> Result<Raster, Error> {
    let page = page(document, number)?;
    let (config, height) = configuration(&page, width)?;
    if tile.x < 0
        || tile.y < 0
        || tile.width <= 0
        || tile.height <= 0
        || i64::from(tile.x) + i64::from(tile.width) > i64::from(width)
        || i64::from(tile.y) + i64::from(tile.height) > i64::from(height)
        || i64::from(tile.width) * i64::from(tile.height) > MAX_TILE_PIXELS
    {
        return Err(Error::Failure(
            "PDF raster tile is outside its page or memory budget".into(),
        ));
    }
    let mut bitmap = PdfBitmap::empty(tile.width, tile.height, PdfBitmapFormat::BGRA)?;
    page.render_into_bitmap_with_config(&mut bitmap, &config.set_origin(-tile.x, -tile.y))?;
    let rgba = bitmap.as_rgba_bytes();
    let expected = usize::try_from(i64::from(tile.width) * i64::from(tile.height) * 4)
        .map_err(|_| Error::Failure("PDF raster byte count exceeds address space".into()))?;
    if rgba.len() != expected {
        return Err(Error::Failure(
            "PDF raster has an unexpected stride or length".into(),
        ));
    }
    Ok(Raster {
        tile,
        page_width: width,
        page_height: height,
        rgba,
    })
}

pub fn page_text(document: &PdfDocument<'_>, number: usize, width: i32) -> Result<PageText, Error> {
    let page = page(document, number)?;
    let (config, height) = configuration(&page, width)?;
    let text = page.text()?;
    if usize::try_from(text.len()).map_or(true, |length| length > MAX_GLYPHS) {
        return Err(Error::Failure(
            "PDF page text exceeds the owned snapshot budget".into(),
        ));
    }
    let chars = text.chars();
    let mut glyphs = Vec::with_capacity(chars.len());
    for character in chars.iter() {
        let unicode = character.unicode_char();
        let rectangle = if unicode.is_some_and(char::is_whitespace) {
            None
        } else {
            Some(bounds(&page, character.tight_bounds()?, &config)?)
        };
        glyphs.push(Glyph {
            index: character.index(),
            unicode,
            bounds: rectangle,
        });
    }
    Ok(PageText {
        page: number,
        width,
        height,
        glyphs,
    })
}

/// Search results come from PDFium's logical text search, not an approximation
/// that concatenates visual rectangle contents across unrelated columns.
pub fn search(
    document: &PdfDocument<'_>,
    number: usize,
    width: i32,
    query: &str,
    match_case: bool,
    whole_word: bool,
) -> Result<Vec<SearchHit>, Error> {
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let page = page(document, number)?;
    let (config, _) = configuration(&page, width)?;
    let text = page.text()?;
    let options = PdfSearchOptions::new()
        .match_case(match_case)
        .match_whole_word(whole_word);
    let search = text.search(query, &options)?;
    let mut hits = Vec::new();
    while let Some(result) = search.find_next() {
        if hits.len() >= MAX_SEARCH_HITS {
            return Err(Error::Failure(
                "PDF search exceeds its result budget".into(),
            ));
        }
        let mut rectangles = Vec::with_capacity(result.len());
        for segment in result.iter() {
            rectangles.push(bounds(&page, segment.bounds(), &config)?);
        }
        hits.push(SearchHit {
            page: number,
            bounds: rectangles,
        });
    }
    Ok(hits)
}

/// Copy uses logical character indices. PDFium supplies rectangles for that
/// exact range; extracting text from their union would include other columns.
pub fn selection(
    document: &PdfDocument<'_>,
    number: usize,
    width: i32,
    start: usize,
    end: usize,
) -> Result<Selection, Error> {
    let page = page(document, number)?;
    let (config, height) = configuration(&page, width)?;
    let page_text = page.text()?;
    if usize::try_from(page_text.len()).map_or(true, |length| length > MAX_GLYPHS) {
        return Err(Error::Failure(
            "PDF selection page exceeds the owned text budget".into(),
        ));
    }
    let chars = page_text.chars();
    if start >= end || end > chars.len() || end - start > MAX_GLYPHS {
        return Err(Error::Failure(
            "PDF selection is outside its logical character range".into(),
        ));
    }
    let mut text = String::new();
    for index in start..end {
        let character = chars.get(index)?;
        let unicode = character.unicode_char().ok_or_else(|| {
            Error::Failure("PDF selection contains a character without a Unicode mapping".into())
        })?;
        text.push(unicode);
    }
    let segments = page_text.segments_subset(start, end - start);
    let mut rects = Vec::with_capacity(segments.len());
    for segment in segments.iter() {
        rects.push(bounds(&page, segment.bounds(), &config)?);
    }
    Ok(Selection {
        page: number,
        width,
        height,
        text,
        rects,
    })
}

/// The existing OCaml PDF owner persists these PNG bytes as an asset. This
/// encoder creates no file and never rewrites the PDF or its annotations.
pub fn area_png(
    document: &PdfDocument<'_>,
    number: usize,
    width: i32,
    tile: Tile,
) -> Result<Vec<u8>, Error> {
    let raster = raster(document, number, width, tile)?;
    let mut bytes = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut bytes, tile.width as u32, tile.height as u32);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder
            .write_header()
            .map_err(|error| Error::Failure(error.to_string()))?;
        writer
            .write_image_data(&raster.rgba)
            .map_err(|error| Error::Failure(error.to_string()))?;
        writer
            .finish()
            .map_err(|error| Error::Failure(error.to_string()))?;
    }
    Ok(bytes)
}

pub fn outline(document: &PdfDocument<'_>) -> Result<Vec<OutlineEntry>, Error> {
    let bookmarks = document.bookmarks();
    let mut pending = Vec::new();
    if let Some(root) = bookmarks.root() {
        pending.push((root, 0));
    }
    let mut entries = Vec::new();
    while let Some((bookmark, depth)) = pending.pop() {
        if entries.len() >= MAX_OUTLINE_ENTRIES {
            return Err(Error::Failure(
                "PDF outline exceeds its entry budget".into(),
            ));
        }
        let page = bookmark
            .destination()
            .map(|destination| destination.page_index())
            .transpose()?
            .map(|page| usize::try_from(page).map(|page| page + 1))
            .transpose()
            .map_err(|_| Error::Failure("PDF outline page index is negative".into()))?;
        entries.push(OutlineEntry {
            depth,
            title: bookmark.title(),
            page,
        });
        if let Some(sibling) = bookmark.next_sibling() {
            pending.push((sibling, depth));
        }
        if let Some(child) = bookmark.first_child() {
            pending.push((child, depth + 1));
        }
    }
    Ok(entries)
}
