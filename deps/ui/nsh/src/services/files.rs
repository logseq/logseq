//! Existing Logseq file requests over NSH's public desktop dialogs.
use lui_nsh::{app::ApplicationMutations, runtime::PlatformEvent};
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog, SaveDialog},
    prelude::{blocking, pick_paths, pick_save_path},
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::UNIX_EPOCH,
};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct OpenRequest {
    request: u64,
    multiple: bool,
    directory: bool,
    accept: Option<String>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct TextDownload {
    #[serde(rename = "request-id")]
    request: String,
    name: String,
    #[serde(rename = "mime")]
    _mime: String,
    text: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct BinaryDownload {
    #[serde(rename = "request-id")]
    request: String,
    name: String,
    #[serde(rename = "mime")]
    _mime: String,
    #[serde(rename = "data-b64")]
    data: String,
}
pub(super) enum Request {
    Open(OpenRequest, OpenDialog),
    Download {
        request: String,
        name: String,
        bytes: Vec<u8>,
    },
}

pub(super) fn capture(operation: &str, payload: &str) -> Result<Option<Request>, String> {
    let decode = |error| format!("native {operation} request: {error}");
    let request = match operation {
        "open-file-picker" => {
            let request: OpenRequest = serde_json::from_str(payload).map_err(decode)?;
            if request.request == 0 || request.request > 9_007_199_254_740_991 {
                return Err(
                    "file picker request requires an exact positive OCaml/JSON token".into(),
                );
            }
            let mut dialog = if request.directory {
                OpenDialog::folders()
            } else {
                OpenDialog::files()
            }
            .multiple(request.multiple);
            if !request.directory
                && let Some(accept) = request.accept.as_deref().filter(|value| !value.is_empty())
            {
                let extensions = accept.split(',').map(str::trim).map(|value| {
                    value.strip_prefix("*.").or_else(|| value.strip_prefix('.'))
                        .filter(|value| !value.is_empty()
                            && !value.contains(['/', '\\', '*'])
                            && !value.chars().any(char::is_whitespace))
                        .ok_or("native file filters require comma-separated extensions such as .md,.txt")
                }).collect::<Result<Vec<_>, _>>()?;
                dialog = dialog.filter(FileFilter::new(accept, extensions));
            }
            Request::Open(request, dialog)
        }
        "download-text" => {
            let request: TextDownload = serde_json::from_str(payload).map_err(decode)?;
            download(request.request, request.name, request.text.into_bytes())?
        }
        "download-binary" => {
            use base64::Engine;
            let request: BinaryDownload = serde_json::from_str(payload).map_err(decode)?;
            let bytes = base64::engine::general_purpose::STANDARD
                .decode(request.data)
                .map_err(|error| format!("native binary download: {error}"))?;
            download(request.request, request.name, bytes)?
        }
        _ => return Ok(None),
    };
    Ok(Some(request))
}

fn download(request: String, name: String, bytes: Vec<u8>) -> Result<Request, String> {
    if request
        .parse::<u64>()
        .ok()
        .filter(|value| *value > 0)
        .is_none_or(|value| value.to_string() != request)
    {
        return Err("native download requires a canonical positive request id".into());
    }
    if name.is_empty() || name.contains(['/', '\\', '\0']) || name == "." || name == ".." {
        return Err("native download requires a suggested file name, not a path".into());
    }
    Ok(Request::Download {
        request,
        name,
        bytes,
    })
}

fn event(operation: &str, payload: Value) -> PlatformEvent {
    PlatformEvent {
        operation: operation.into(),
        payload: payload.to_string(),
    }
}
fn picked(request: u64, result: Result<Vec<Value>, String>) -> Vec<PlatformEvent> {
    vec![event(
        "files-picked",
        match result {
            Ok(files) => json!({"request":request,"files":files}),
            Err(error) => json!({"request":request,"files":[],"error":error}),
        },
    )]
}
fn saved(request: String, result: Result<bool, String>) -> Vec<PlatformEvent> {
    vec![event(
        "file-download-result",
        match result {
            Ok(cancelled) => json!({"request-id":request,"cancelled":cancelled}),
            Err(error) => json!({"request-id":request,"error":error}),
        },
    )]
}

pub(super) async fn execute(
    request: Request,
    admission: ApplicationMutations,
) -> Result<Vec<PlatformEvent>, String> {
    match request {
        Request::Open(request, dialog) => {
            if admission.check().is_err() {
                return Ok(picked(request.request, Ok(Vec::new())));
            }
            let selected = pick_paths(dialog).await;
            if admission.check().is_err() {
                return Ok(picked(request.request, Ok(Vec::new())));
            }
            let files = match selected {
                Ok(Some(paths)) => blocking(move || snapshots(paths, request.directory))
                    .await
                    .map_err(|error| format!("file metadata task: {error}"))?,
                Ok(None) => Ok(Vec::new()),
                Err(error) => Err(error),
            };
            Ok(picked(request.request, files))
        }
        Request::Download {
            request,
            name,
            bytes,
        } => {
            if admission.check().is_err() {
                return Ok(saved(request, Ok(true)));
            }
            let selected = pick_save_path(SaveDialog::new().file_name(name)).await;
            if admission.check().is_err() {
                return Ok(saved(request, Ok(true)));
            }
            let result = match selected {
                Ok(Some(path)) => blocking(move || write_download(&path, &bytes))
                    .await
                    .map_err(|error| format!("file export task: {error}"))?
                    .map(|()| false),
                Ok(None) => Ok(true),
                Err(error) => Err(error),
            };
            Ok(saved(request, result))
        }
    }
}

fn utf8(path: &Path) -> Result<&str, String> {
    path.to_str()
        .ok_or_else(|| "native file path is not UTF-8".into())
}
fn snapshot(path: &Path, root: Option<&Path>) -> Result<Value, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("native selection is not a regular file".into());
    }
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or("native file name is not UTF-8")?;
    let mut result = json!({"name":name,"path":utf8(path)?});
    if metadata.len() <= 9_007_199_254_740_991 {
        result["size"] = json!(metadata.len());
    }
    if let Ok(modified) = metadata.modified().and_then(|time| {
        time.duration_since(UNIX_EPOCH)
            .map_err(std::io::Error::other)
    }) {
        result["last-modified"] = json!(modified.as_secs_f64() * 1_000.0);
    }
    if let Some(root) = root {
        let relative = path.strip_prefix(root).map_err(|error| error.to_string())?;
        let components = relative
            .components()
            .map(|part| match part {
                std::path::Component::Normal(name) => {
                    name.to_str().ok_or("native relative path is not UTF-8")
                }
                _ => Err("native directory selection has an invalid relative path"),
            })
            .collect::<Result<Vec<_>, _>>()?;
        result["relative-path"] = json!(components.join("/"));
    }
    Ok(result)
}
fn snapshots(paths: Vec<PathBuf>, directory: bool) -> Result<Vec<Value>, String> {
    let mut files = Vec::new();
    for root in paths {
        if !root.is_absolute() {
            return Err("native selection requires an absolute path".into());
        }
        if !directory {
            files.push(snapshot(&root, None)?);
            continue;
        }
        let mut pending = vec![root.clone()];
        while let Some(folder) = pending.pop() {
            let mut entries = fs::read_dir(folder)
                .map_err(|error| error.to_string())?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| error.to_string())?;
            entries.sort_by_key(std::fs::DirEntry::file_name);
            for entry in entries {
                let kind = entry.file_type().map_err(|error| error.to_string())?;
                if kind.is_dir() {
                    pending.push(entry.path());
                } else if kind.is_file() {
                    files.push(snapshot(&entry.path(), Some(&root))?);
                }
                // Do not follow directory links into cycles or another root.
            }
        }
    }
    Ok(files)
}

fn write_download(path: &Path, bytes: &[u8]) -> Result<(), String> {
    static NEXT: AtomicU64 = AtomicU64::new(0);
    if !path.is_absolute() {
        return Err("native save destination must be absolute".into());
    }
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or("native save destination has no UTF-8 file name")?;
    let temporary = path.with_file_name(format!(
        ".{name}.logseq-{}-{}.tmp",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|error| error.to_string())?;
    let result = (|| {
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporary, path)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result.map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsh_core::{file_dialog::FileRequest, prelude::*};
    use nsh_engine::{EngineConfig, EngineContext, Root};
    use nsh_testing::Headless;
    use std::sync::{Arc, Mutex};

    #[derive(Clone, Default)]
    struct Observed(Arc<Mutex<Vec<PlatformEvent>>>);

    #[component]
    fn NativeFiles() -> impl IntoElement {
        let observed = engine_context::<Observed>().unwrap().clone();
        let held = signal(false);
        let admission = ApplicationMutations::new(move || {
            if held.get() {
                Err("update preparation is active".into())
            } else {
                Ok(())
            }
        });
        let state = signal("Waiting");
        let mut buttons = Vec::new();
        for (label, operation, payload) in [
            (
                "Open",
                "open-file-picker",
                r#"{"request":41,"multiple":true,"directory":false,"accept":".md,.txt"}"#,
            ),
            (
                "Folder",
                "open-file-picker",
                r#"{"request":42,"multiple":false,"directory":true,"accept":".md"}"#,
            ),
            (
                "Save text",
                "download-text",
                r#"{"request-id":"43","name":"notes.md","mime":"text/plain","text":"hello 中"}"#,
            ),
            (
                "Save bytes",
                "download-binary",
                r#"{"request-id":"44","name":"data.bin","mime":"application/octet-stream","data-b64":"AP9BAA=="}"#,
            ),
        ] {
            let admission = admission.clone();
            let observed = observed.clone();
            buttons.push(
                nsh_base::button()
                    .child(text(label))
                    .on_press(move || {
                        let request = capture(operation, payload).unwrap().unwrap();
                        let admission = admission.clone();
                        let observed = observed.clone();
                        state.set("Working");
                        spawn(async move {
                            observed
                                .0
                                .lock()
                                .unwrap()
                                .extend(execute(request, admission).await.unwrap());
                            state.set("Done");
                        });
                    })
                    .into_element(),
            );
        }
        view()
            .children(buttons)
            .child(
                nsh_base::button()
                    .child(text("Fence"))
                    .on_press(move || held.set(true)),
            )
            .child(text(move || state.get()))
    }

    struct Directory(PathBuf);
    impl Directory {
        fn new() -> Self {
            static NEXT: AtomicU64 = AtomicU64::new(0);
            let path = std::env::temp_dir().join(format!(
                "logseq-native-files-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&path).unwrap();
            Self(path)
        }
    }
    impl Drop for Directory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn reply(observed: &Observed) -> Value {
        serde_json::from_str(&observed.0.lock().unwrap().last().unwrap().payload).unwrap()
    }

    #[test]
    fn requests_validate_correlations_filters_names_and_binary_bytes() {
        assert!(capture("focus", "{}").unwrap().is_none());
        for payload in [
            r#"{"request":0,"multiple":false,"directory":false}"#,
            r#"{"request":9007199254740992,"multiple":false,"directory":false}"#,
            r#"{"request":1,"multiple":false,"directory":false,"accept":"image/png"}"#,
            r#"{"request":1,"multiple":false,"directory":false,"unexpected":1}"#,
        ] {
            assert!(capture("open-file-picker", payload).is_err(), "{payload}");
        }
        for (operation, payload) in [
            (
                "download-text",
                r#"{"request-id":"01","name":"notes.md","mime":"text/plain","text":"x"}"#,
            ),
            (
                "download-text",
                r#"{"request-id":"1","name":"../notes.md","mime":"text/plain","text":"x"}"#,
            ),
            (
                "download-binary",
                r#"{"request-id":"1","name":"notes.bin","mime":"application/octet-stream","data-b64":"!bad!"}"#,
            ),
        ] {
            assert!(capture(operation, payload).is_err());
        }
    }

    #[test]
    fn native_dialogs_complete_selected_paths_directory_metadata_exports_and_cancellation() {
        let directory = Directory::new();
        let file = directory.0.join("notes-中文.md");
        fs::write(&file, "first").unwrap();
        fs::create_dir(directory.0.join("pages")).unwrap();
        fs::write(directory.0.join("pages/one.md"), "nested").unwrap();
        let observed = Observed::default();
        let mut app = Headless::start(EngineConfig {
            context: EngineContext::default().with(observed.clone()),
            ..EngineConfig::new(Root::of::<NativeFiles>())
        })
        .unwrap();
        app.on_pick_paths(vec![file.clone()]).unwrap();
        app.press("Open").unwrap();
        app.wait_for("Done").unwrap();
        let selected = reply(&observed);
        assert_eq!(selected["request"], 41);
        assert_eq!(selected["files"][0]["path"], file.to_str().unwrap());
        assert_eq!(selected["files"][0]["size"], 5);
        assert!(selected["files"][0].get("data-b64").is_none());
        let FileRequest::OpenDialog(dialog) = &app.screen().file_requests()[0] else {
            panic!("native open dialog")
        };
        assert!(dialog.multiple);
        assert_eq!(dialog.filters[0].extensions, ["md", "txt"]);

        app.on_pick_paths(vec![directory.0.clone()]).unwrap();
        app.press("Folder").unwrap();
        app.wait_for("Done").unwrap();
        let selected = reply(&observed);
        assert!(
            selected["files"]
                .as_array()
                .unwrap()
                .iter()
                .any(|file| file["relative-path"] == "pages/one.md")
        );
        app.on_pick_save_path(None).unwrap();
        app.press("Save text").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(
            reply(&observed),
            json!({"request-id":"43","cancelled":true})
        );
        let text_destination = directory.0.join("export.md");
        app.on_pick_save_path(Some(text_destination.clone()))
            .unwrap();
        app.press("Save text").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(fs::read_to_string(&text_destination).unwrap(), "hello 中");
        let destination = directory.0.join("export.bin");
        fs::write(&destination, "old export").unwrap();
        app.on_pick_save_path(Some(destination.clone())).unwrap();
        app.press("Save bytes").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(
            reply(&observed),
            json!({"request-id":"44","cancelled":false})
        );
        assert_eq!(fs::read(&destination).unwrap(), [0, 255, b'A', 0]);
        assert!(!fs::read_dir(&directory.0).unwrap().any(|entry| {
            entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .ends_with(".tmp")
        }));

        app.on_pick_paths(Vec::new()).unwrap();
        app.press("Open").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(reply(&observed), json!({"request":41,"files":[]}));
        app.on_pick_paths(vec![directory.0.join("missing.md")])
            .unwrap();
        app.press("Open").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(reply(&observed)["files"], json!([]));
        assert!(reply(&observed)["error"].is_string());

        let requests = app.screen().file_requests().len();
        app.press("Fence").unwrap();
        app.press("Open").unwrap();
        app.wait_for("Done").unwrap();
        assert_eq!(app.screen().file_requests().len(), requests);
        assert_eq!(reply(&observed), json!({"request":41,"files":[]}));
        assert_eq!(fs::read(&destination).unwrap(), [0, 255, b'A', 0]);
    }
}
