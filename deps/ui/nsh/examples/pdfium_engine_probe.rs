//! Explicit private engine qualification; this is not an App startup flag.
#[cfg(any(target_os = "linux", target_os = "windows"))]
#[path = "../src/extensions/pdf/portable/engine.rs"]
mod engine;

#[cfg(any(target_os = "linux", target_os = "windows"))]
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut arguments = std::env::args_os().skip(1);
    let library = arguments
        .next()
        .ok_or("expected absolute prepared PDFium library path")?;
    let document = arguments
        .next()
        .ok_or("expected absolute private authored PDF path")?;
    let expected = arguments
        .next()
        .ok_or("expected exact authored text/search marker")?;
    let expected = expected.to_str().ok_or("text marker must be UTF-8")?;
    let password = arguments.next();
    if arguments.next().is_some() {
        return Err("unexpected engine probe arguments".into());
    }
    let password = password
        .as_ref()
        .map(|value| value.to_str().ok_or("password must be UTF-8"))
        .transpose()?;
    let packaged = engine::packaged_library(&std::env::current_exe()?)?;
    let result = engine::with_document(
        std::path::Path::new(&library),
        std::path::Path::new(&document),
        password,
        |document| {
            let count = engine::page_count(document)?;
            if count == 0 {
                return Err(engine::Error::Failure(
                    "authored fixture must have a page".into(),
                ));
            }
            let info = engine::page_info(document, 1)?;
            let text = engine::page_text(document, 1, 512)?;
            let copied: String = text
                .glyphs
                .iter()
                .filter_map(|glyph| glyph.unicode)
                .collect();
            if expected.is_empty() || !copied.contains(expected) {
                return Err(engine::Error::Failure(
                    "authored text marker was not extracted in logical character order".into(),
                ));
            }
            let hits = engine::search(document, 1, 512, expected, true, false)?;
            if hits.is_empty() {
                return Err(engine::Error::Failure(
                    "authored text marker was not found by PDFium search".into(),
                ));
            }
            let marker: Vec<char> = expected.chars().collect();
            let indexed: Vec<_> = text
                .glyphs
                .iter()
                .filter_map(|glyph| glyph.unicode.map(|unicode| (glyph.index, unicode)))
                .collect();
            let start = indexed
                .windows(marker.len())
                .position(|window| {
                    window
                        .iter()
                        .zip(&marker)
                        .all(|(actual, expected)| actual.1 == *expected)
                })
                .ok_or_else(|| {
                    engine::Error::Failure("authored logical character range was not found".into())
                })?;
            let selection = engine::selection(
                document,
                1,
                512,
                indexed[start].0,
                indexed[start + marker.len() - 1].0 + 1,
            )?;
            if selection.text != expected || selection.rects.is_empty() {
                return Err(engine::Error::Failure(
                    "logical copy/highlight range changed the authored text".into(),
                ));
            }
            let full = engine::raster(
                document,
                1,
                512,
                engine::Tile {
                    x: 0,
                    y: 0,
                    width: 512,
                    height: text.height,
                },
            )?;
            let split = text.height / 2;
            let upper = engine::raster(
                document,
                1,
                512,
                engine::Tile {
                    x: 0,
                    y: 0,
                    width: 512,
                    height: split,
                },
            )?;
            let lower = engine::raster(
                document,
                1,
                512,
                engine::Tile {
                    x: 0,
                    y: split,
                    width: 512,
                    height: text.height - split,
                },
            )?;
            let png = engine::area_png(document, 1, 512, lower.tile)?;
            let mut decoded = png::Decoder::new(std::io::Cursor::new(&png))
                .read_info()
                .map_err(|error| engine::Error::Failure(error.to_string()))?;
            let length = decoded.output_buffer_size().ok_or_else(|| {
                engine::Error::Failure("area PNG has no bounded decode length".into())
            })?;
            let mut pixels = vec![0; length];
            decoded
                .next_frame(&mut pixels)
                .map_err(|error| engine::Error::Failure(error.to_string()))?;
            if pixels != lower.rgba {
                return Err(engine::Error::Failure(
                    "decoded area PNG differs from the selected crop pixels".into(),
                ));
            }
            let mut stitched = upper.rgba;
            stitched.extend(lower.rgba);
            if full.rgba != stitched {
                return Err(engine::Error::Failure(
                    "viewport strips differ from whole-page rendering".into(),
                ));
            }
            let non_white = full
                .rgba
                .chunks_exact(4)
                .filter(|pixel| pixel[..3] != [255, 255, 255])
                .count();
            if non_white == 0 {
                return Err(engine::Error::Failure(
                    "authored fixture rendered as blank paper".into(),
                ));
            }
            Ok(serde_json::json!({
                "pages": count, "page": info, "text": text, "hits": hits,
                "selection": selection, "areaPngBytes": png.len(), "areaPixelsMatch": true,
                "outline": engine::outline(document)?, "raster": {
                    "width": full.page_width, "height": full.page_height,
                    "tile": [full.tile.x, full.tile.y, full.tile.width, full.tile.height],
                    "bytes": full.rgba.len(), "nonWhitePixels": non_white,
                    "stripIdentity": true
                }
            }))
        },
    )?;
    println!(
        "{}",
        serde_json::json!({"engineProbe": result, "packagedPathProjection": packaged})
    );
    Ok(())
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn main() -> std::process::ExitCode {
    eprintln!("The portable PDFium probe runs on Linux/Windows; macOS retains PDFKit.");
    std::process::ExitCode::FAILURE
}
