//! Real macOS Image transport/decoding, without activating the application.
//! Run with a fresh evidence directory. This does not qualify image pixels.
#[cfg(not(target_os = "macos"))]
fn main() -> std::process::ExitCode {
    eprintln!("native Image transport qualification currently requires macOS");
    std::process::ExitCode::FAILURE
}

#[cfg(target_os = "macos")]
fn main() -> std::process::ExitCode {
    macos::run()
}

#[cfg(target_os = "macos")]
mod macos {
    use lui_nsh::{
        render::{Event, Renderer},
        wire::Batch,
    };
    use nsh_core::prelude::*;
    use nsh_platform_macos as platform;
    use serde_json::{Value, json};
    use std::{
        cell::{Cell, RefCell},
        io::{Read, Write},
        net::{TcpListener, TcpStream},
        path::PathBuf,
        rc::Rc,
        sync::{
            Arc, Mutex, OnceLock,
            atomic::{AtomicU8, Ordering},
        },
        time::{Duration, Instant},
    };

    static STATUS: AtomicU8 = AtomicU8::new(0);
    static PROBE: OnceLock<Arc<Probe>> = OnceLock::new();
    // A deterministic 16x8 RGBA fixture produced from owned solid-color pixels.
    const PNG: &[u8] = &[
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 16, 0, 0, 0, 8, 8,
        6, 0, 0, 0, 240, 118, 127, 151, 0, 0, 0, 21, 73, 68, 65, 84, 120, 156, 99, 16, 169, 184,
        244, 159, 18, 204, 48, 106, 192, 112, 48, 0, 0, 135, 54, 46, 144, 164, 13, 159, 231, 0, 0,
        0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];

    struct Probe {
        directory: PathBuf,
        origin: String,
        requests: Arc<Mutex<Vec<Value>>>,
    }

    fn fail(error: impl ToString) {
        if STATUS
            .compare_exchange(0, 2, Ordering::AcqRel, Ordering::Acquire)
            .is_ok()
        {
            eprintln!("{}", json!({"ok":false,"error":error.to_string()}));
            platform::quit_app();
        }
    }

    fn batch(generation: u64, ops: Value) -> Result<Batch, String> {
        Batch::decode(&json!({"generation":generation,"ops":ops}).to_string())
    }

    #[component]
    fn Qualification() -> impl IntoElement {
        let probe = PROBE
            .get()
            .expect("one process-owned qualification")
            .clone();
        let observed = probe.clone();
        let first_native = Rc::new(RefCell::new(None));
        let loads = Cell::new(0_u8);
        let renderer = Renderer::new(move |event, renderer| {
            if !matches!(event, Event::Load(2)) || STATUS.load(Ordering::Acquire) != 0 {
                return;
            }
            if loads.get() >= 2 {
                fail("duplicate native Image Load");
                return;
            }
            loads.set(loads.get() + 1);
            let Some(node) = renderer.node_snapshot(2) else {
                fail("loaded Image was retired");
                return;
            };
            let Some(reference) = renderer.native_reference(2, node.incarnation) else {
                fail("loaded Image has no native reference");
                return;
            };
            let Some(native) = reference.node() else {
                fail("loaded Image is not mounted");
                return;
            };
            if first_native.borrow().is_none() {
                *first_native.borrow_mut() = Some(native);
                if let Err(error) = batch(
                    2,
                    json!([
                        {"op":"set-prop","id":2,"property":"url",
                         "value":format!("{}/second.png", observed.origin)}
                    ]),
                )
                .and_then(|patch| renderer.apply(patch))
                {
                    fail(error);
                }
                return;
            }
            if first_native.borrow().as_ref() != Some(&native) {
                fail("source replacement recreated the native Image");
                return;
            }
            if node.string("url") != format!("{}/second.png", observed.origin) {
                fail("stale first-source Load reached the current Image");
                return;
            }
            let probe = observed.clone();
            spawn(async move {
                let result = async {
                    lui_nsh::app::wait_for_commit().await?;
                    let bounds = reference
                        .measure()
                        .await
                        .ok_or("loaded Image has no bounds")?;
                    if bounds.frame.size.width <= px(0.0) || bounds.frame.size.height <= px(0.0) {
                        return Err("loaded Image has empty bounds".to_owned());
                    }
                    let requests = probe.requests.lock().map_err(|e| e.to_string())?.clone();
                    let paths: Vec<_> =
                        requests.iter().filter_map(|r| r["path"].as_str()).collect();
                    if paths != ["/redirect", "/first.png", "/second.png"] {
                        return Err(format!("unexpected native requests: {requests:?}"));
                    }
                    let result = json!({"ok":true,"qualification":"native-image-http",
                        "background":true,"transport":"NSH macOS installed transport",
                        "checks":["redirect","no-referer-on-every-hop","two-native-loads",
                            "source-replacement","retained-native-image","nonempty-bounds"],
                        "requests":requests,"nativeImage":format!("{native:?}"),
                        "unqualified":["pixels","OCaml-gallery-interaction","Linux","Windows"]});
                    std::fs::write(
                        probe.directory.join("result.json"),
                        serde_json::to_vec_pretty(&result).map_err(|e| e.to_string())?,
                    )
                    .map_err(|e| e.to_string())?;
                    println!("{result}");
                    STATUS.store(1, Ordering::Release);
                    platform::quit_app();
                    Ok::<(), String>(())
                }
                .await;
                if let Err(error) = result {
                    fail(error);
                }
            });
        });
        let element = renderer.element();
        let result = batch(1,json!([
            {"op":"create-node","id":1,"kind":"column"},
            {"op":"create-node","id":2,"kind":"image"},
            {"op":"set-prop","id":2,"property":"url","value":format!("{}/redirect",probe.origin)},
            {"op":"set-prop","id":2,"property":"width","value":128},
            {"op":"set-prop","id":2,"property":"height","value":64},
            {"op":"set-prop","id":2,"property":"image-fit","value":"fit"},
            {"op":"insert-child","parent":1,"child":2,"index":0}
        ])).and_then(|patch|renderer.apply(patch)).and_then(|()|renderer.set_root(1));
        if let Err(error) = result {
            fail(error);
        }
        element
    }

    fn serve(mut stream: TcpStream, requests: &Mutex<Vec<Value>>) -> Result<(), String> {
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|e| e.to_string())?;
        let mut header = Vec::new();
        let mut byte = [0];
        while !header.ends_with(b"\r\n\r\n") {
            if header.len() >= 16384 || stream.read(&mut byte).map_err(|e| e.to_string())? == 0 {
                return Err("incomplete or oversized HTTP request".into());
            }
            header.push(byte[0]);
        }
        let header = String::from_utf8(header).map_err(|e| e.to_string())?;
        let mut lines = header.split("\r\n");
        let first = lines.next().ok_or("missing request line")?;
        let path = first
            .split_whitespace()
            .nth(1)
            .ok_or("missing request path")?;
        let mut headers = serde_json::Map::new();
        for line in lines.filter(|line| !line.is_empty()) {
            let (name, value) = line.split_once(':').ok_or("malformed request header")?;
            if name.eq_ignore_ascii_case("referer") {
                return Err(format!("native request leaked Referer: {line}"));
            }
            headers.insert(name.to_ascii_lowercase(), json!(value.trim()));
        }
        requests
            .lock()
            .map_err(|e| e.to_string())?
            .push(json!({"path":path,"headers":headers}));
        if path == "/redirect" {
            stream.write_all(b"HTTP/1.1 302 Found\r\nLocation: /first.png\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                .map_err(|e|e.to_string())?;
        } else if matches!(path, "/first.png" | "/second.png") {
            write!(stream,"HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",PNG.len()).map_err(|e|e.to_string())?;
            stream.write_all(PNG).map_err(|e| e.to_string())?;
        } else {
            return Err(format!("unexpected path {path}"));
        }
        Ok(())
    }

    pub fn run() -> std::process::ExitCode {
        let result = (|| -> Result<(), String> {
            let directory = PathBuf::from(
                std::env::args_os()
                    .nth(1)
                    .ok_or("provide a fresh evidence directory")?,
            );
            std::fs::create_dir(&directory)
                .map_err(|e| format!("fresh evidence directory: {e}"))?;
            let directory = directory.canonicalize().map_err(|e| e.to_string())?;
            let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
            listener.set_nonblocking(true).map_err(|e| e.to_string())?;
            let origin = format!(
                "http://{}",
                listener.local_addr().map_err(|e| e.to_string())?
            );
            let requests = Arc::new(Mutex::new(Vec::new()));
            let recorded = requests.clone();
            let server = std::thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(45);
                while STATUS.load(Ordering::Acquire) == 0 && Instant::now() < deadline {
                    match listener.accept() {
                        Ok((stream, _)) => {
                            if let Err(error) = serve(stream, &recorded) {
                                fail(error);
                                break;
                            }
                        }
                        Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                            std::thread::sleep(Duration::from_millis(10))
                        }
                        Err(error) => {
                            fail(error);
                            break;
                        }
                    }
                }
                if STATUS.load(Ordering::Acquire) == 0 {
                    fail("native Image HTTP deadline exceeded");
                }
            });
            std::thread::spawn(|| {
                std::thread::sleep(Duration::from_secs(55));
                eprintln!("native Image runner exceeded its hard deadline");
                std::process::exit(1);
            });
            let context = Arc::new(Probe {
                directory: directory.clone(),
                origin,
                requests,
            });
            PROBE
                .set(context)
                .map_err(|_| "qualification context initialized twice")?;
            let status = platform::run_app(
                platform::AppSource::Rust(platform::Root::of::<Qualification>()),
                platform::AppOptions {
                    background: true,
                    title: "Image transport qualification".into(),
                    size: (240, 160),
                    keep_size: true,
                    data_dir: Some(directory.join("native-data")),
                    cache: platform::CacheOptions::at(platform::CacheLocation::Dir(
                        directory.join("native-cache"),
                    )),
                    ..Default::default()
                },
            );
            server.join().map_err(|_| "HTTP recorder thread panicked")?;
            if status != std::process::ExitCode::SUCCESS || STATUS.load(Ordering::Acquire) != 1 {
                return Err("native Image transport qualification failed".into());
            }
            Ok(())
        })();
        match result {
            Ok(()) => std::process::ExitCode::SUCCESS,
            Err(error) => {
                eprintln!("{error}");
                std::process::ExitCode::FAILURE
            }
        }
    }
}
