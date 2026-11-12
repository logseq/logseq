//! Explicit private engine qualification; this is not an App startup flag.
#[cfg(any(target_os = "linux", target_os = "windows"))]
#[path = "../src/extensions/pdf/portable/engine.rs"]
mod engine;
#[cfg(all(target_os = "linux", test))]
#[path = "../src/extensions/pdf/portable/gtk_completion.rs"]
mod gtk_completion;
#[cfg(all(target_os = "linux", test))]
#[path = "../src/extensions/pdf/portable/gtk_page.rs"]
mod gtk_page;
#[cfg(all(any(target_os = "linux", target_os = "windows"), test))]
#[path = "../src/extensions/pdf/portable/text.rs"]
mod text;
#[cfg(any(target_os = "linux", target_os = "windows"))]
#[path = "../src/extensions/pdf/portable/worker.rs"]
mod worker;

#[cfg(all(target_os = "windows", test))]
#[path = "../src/extensions/pdf/portable/windows_window.rs"]
mod windows_window;

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
        serde_json::json!({"engineProbe": result, "packagedPathProjection": packaged,
            "workerProbe": worker_probe(std::path::Path::new(&library), std::path::Path::new(&document), expected, password)?})
    );
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "windows"))]
fn worker_probe(
    library: &std::path::Path,
    document: &std::path::Path,
    marker: &str,
    password: Option<&str>,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let (sender, receiver) = std::sync::mpsc::channel();
    let worker = worker::Worker::new(library.to_owned(), move |event| {
        let _ = sender.send(event);
    })?;
    let epoch = worker.open(document.to_owned(), password.map(str::to_owned))?;
    let opened = worker_event(&receiver, epoch, "opened")?;
    if !private_file_open(document)? {
        return Err("worker Opened did not retain its exact document file".into());
    }
    let height = opened["geometry"][0]["height"]
        .as_f64()
        .ok_or("missing page height")?;
    let width = opened["geometry"][0]["width"]
        .as_f64()
        .ok_or("missing page width")?;
    let tile = engine::Tile {
        x: 0,
        y: 0,
        width: 512,
        height: (512.0 * height / width).round() as i32,
    };
    worker.viewport(worker::Viewport {
        epoch,
        revision: 1,
        page: 1,
        width: 512,
        tile,
    })?;
    let viewport = worker_event(&receiver, epoch, "viewport")?;
    let glyphs = viewport["text"]["glyphs"]
        .as_array()
        .ok_or("worker omitted glyph geometry")?;
    let indexed: Vec<_> = glyphs
        .iter()
        .filter_map(|glyph| {
            Some((
                glyph["index"].as_u64()? as usize,
                glyph["unicode"].as_str()?.chars().next()?,
            ))
        })
        .collect();
    let expected: Vec<char> = marker.chars().collect();
    let start = indexed
        .windows(expected.len())
        .position(|window| {
            window
                .iter()
                .zip(&expected)
                .all(|(actual, expected)| actual.1 == *expected)
        })
        .ok_or("worker text marker was not found")?;
    worker.select(
        epoch,
        1,
        512,
        indexed[start].0,
        indexed[start + expected.len() - 1].0 + 1,
    )?;
    let selection = worker_event(&receiver, epoch, "selected")?;
    if selection["selection"]["text"] != marker {
        return Err("worker copied another logical range".into());
    }
    worker.area(epoch, 1, 512, tile)?;
    let area = worker_event(&receiver, epoch, "area")?;
    worker.search(epoch, marker.to_owned(), 512, true, false)?;
    let search = worker_event(&receiver, epoch, "search")?;
    if search["hits"].as_array().is_none_or(Vec::is_empty) {
        return Err("worker search lost its text marker".into());
    }
    let upper = engine::Tile {
        height: tile.height / 2,
        ..tile
    };
    let lower = engine::Tile {
        y: upper.height,
        height: tile.height - upper.height,
        ..tile
    };
    worker.viewports(vec![
        worker::Viewport {
            epoch,
            revision: 2,
            page: 1,
            width: 512,
            tile: upper,
        },
        worker::Viewport {
            epoch,
            revision: 2,
            page: 1,
            width: 512,
            tile: lower,
        },
    ])?;
    let upper_result = worker_event(&receiver, epoch, "viewport")?;
    let lower_result = worker_event(&receiver, epoch, "viewport")?;
    if upper_result["revision"] != 2
        || lower_result["revision"] != 2
        || upper_result["tile"][1] != upper.y
        || lower_result["tile"][1] != lower.y
    {
        return Err("visible tile batch overwrote a page/strip under the same revision".into());
    }
    if worker
        .viewports(
            (0..9)
                .map(|_| worker::Viewport {
                    epoch,
                    revision: 3,
                    page: 1,
                    width: 512,
                    tile: upper,
                })
                .collect(),
        )
        .is_ok()
    {
        return Err("worker admitted an over-budget visible tile batch".into());
    }
    worker.outline(epoch)?;
    let outline = worker_event(&receiver, epoch, "outline")?;
    worker.close(epoch)?;
    let closed = worker_event(&receiver, epoch, "closed")?;
    if private_file_open(document)? {
        return Err("worker Closed preceded actual document-file release".into());
    }
    if worker.select(epoch, 1, 512, 0, 1).is_ok() {
        return Err("closing worker admitted another selection".into());
    }
    let reopened = worker.open(document.to_owned(), password.map(str::to_owned))?;
    if reopened <= epoch || worker.area(epoch, 1, 512, tile).is_ok() {
        return Err("replacement document accepted a retired epoch".into());
    }
    worker_event(&receiver, reopened, "opened")?;
    worker.close(reopened)?;
    worker_event(&receiver, reopened, "closed")?;
    worker
        .shutdown()
        .join()
        .map_err(|_| "exact owned PDF worker thread panicked")?;
    if private_file_open(document)? {
        return Err("worker thread exit retained the document file".into());
    }
    Ok(
        serde_json::json!({"opened": opened, "viewport": viewport, "selection": selection,
        "area": area, "search": search, "outline": outline, "closed": closed,
        "replacementEpoch": reopened, "visibleBatchTiles": [upper_result, lower_result], "fileReleased": true, "ownedThreadExited": true}),
    )
}

#[cfg(any(target_os = "linux", target_os = "windows"))]
fn worker_event(
    receiver: &std::sync::mpsc::Receiver<worker::Event>,
    epoch: u64,
    expected: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(20);
    loop {
        let event =
            receiver.recv_timeout(deadline.saturating_duration_since(std::time::Instant::now()))?;
        if event.epoch() != epoch {
            continue;
        }
        let value = match event {
            worker::Event::Failed {
                message,
                viewport_revision,
                search_revision,
                ..
            } => {
                return Err(format!("{message} (viewport revision {viewport_revision:?}, search revision {search_revision:?})").into());
            }
            worker::Event::PasswordRequired { .. } => {
                return Err("worker requires the private fixture password".into());
            }
            worker::Event::Opened { pages, .. } => {
                serde_json::json!({"kind":"opened","pages":pages.len(),"geometry":pages})
            }
            worker::Event::Viewport {
                revision,
                page,
                raster,
                text,
                ..
            } => {
                serde_json::json!({"kind":"viewport","revision":revision,"page":page,"rasterBytes":raster.rgba.len(),"tile":[raster.tile.x,raster.tile.y,raster.tile.width,raster.tile.height],"text":text.as_ref()})
            }
            worker::Event::Selected { selection, .. } => {
                serde_json::json!({"kind":"selected","selection":selection})
            }
            worker::Event::Area {
                page,
                width,
                tile,
                png,
                ..
            } => serde_json::json!({"kind":"area","page":page,
                "width":width,"tile":[tile.x,tile.y,tile.width,tile.height],"pngBytes":png.len()}),
            worker::Event::Search {
                revision,
                query,
                hits,
                ..
            } => serde_json::json!({"kind":"search","revision":revision,"query":query,"hits":hits}),
            worker::Event::Outline { entries, .. } => {
                serde_json::json!({"kind":"outline","entries":entries})
            }
            worker::Event::Closed { .. } => serde_json::json!({"kind":"closed"}),
        };
        if value["kind"] == expected {
            return Ok(value);
        }
    }
}

#[cfg(target_os = "linux")]
fn private_file_open(document: &std::path::Path) -> Result<bool, std::io::Error> {
    let document = document.canonicalize()?;
    for entry in std::fs::read_dir("/proc/self/fd")? {
        match std::fs::read_link(entry?.path()) {
            Ok(target) if target == document => return Ok(true),
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(error),
        }
    }
    Ok(false)
}
#[cfg(target_os = "windows")]
fn private_file_open(document: &std::path::Path) -> Result<bool, std::io::Error> {
    use std::os::windows::fs::OpenOptionsExt;
    match std::fs::OpenOptions::new()
        .read(true)
        .share_mode(0)
        .open(document)
    {
        Ok(_) => Ok(false),
        // Win32 ERROR_SHARING_VIOLATION: unrelated errors never prove closure.
        Err(error) if error.raw_os_error() == Some(32) => Ok(true),
        Err(error) => Err(error),
    }
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn main() -> std::process::ExitCode {
    eprintln!("The portable PDFium probe runs on Linux/Windows; macOS retains PDFKit.");
    std::process::ExitCode::FAILURE
}
