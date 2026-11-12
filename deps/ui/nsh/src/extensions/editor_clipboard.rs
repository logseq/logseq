//! Adapt the platform's paste-time snapshot to the existing shared clipboard event.
//! Images keep their captured bytes; copied files use the existing native path
//! snapshots and are read by the application's file channel, never here.
use base64::{Engine, engine::general_purpose::STANDARD};
use nsh_core::PasteEvent;
use serde_json::{Value, json};

pub(super) fn payload(node: u64, content: &PasteEvent) -> Result<Value, String> {
    let mut files = Vec::with_capacity(content.files.len() + content.uris.len());
    for file in &content.files {
        files.push(
            json!({"name":file.name,"type":file.mime,"size":file.data.len(),
            "data-b64":STANDARD.encode(&file.data)}),
        );
    }
    for uri in &content.uris {
        let url =
            url::Url::parse(uri).map_err(|error| format!("invalid pasted file URL: {error}"))?;
        let path = url
            .to_file_path()
            .map_err(|()| "pasted file requires a local file URL")?;
        if !path.is_absolute() {
            return Err("pasted file path must be absolute".into());
        }
        let name = path
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or("pasted file requires a UTF-8 filename")?;
        let metadata =
            std::fs::metadata(&path).map_err(|error| format!("pasted file metadata: {error}"))?;
        if !metadata.is_file() {
            return Err("pasted file must be a regular file".into());
        }
        files.push(json!({"name":name,"path":path,"type":"","size":metadata.len()}));
    }
    let mut types = Vec::new();
    let mut items = Vec::new();
    for (mime, present) in [
        ("text/plain", !content.text.is_empty()),
        ("text/html", !content.html.is_empty()),
    ] {
        if present {
            types.push(mime);
            items.push(json!({"kind":"string","type":mime}));
        }
    }
    if !files.is_empty() {
        types.push("Files");
        items.extend(
            files
                .iter()
                .map(|file| json!({"kind":"file","type":file["type"]})),
        );
    }
    Ok(json!({"nodeId":node,"clipboardData":{
        "text":content.text,"html":content.html,"types":types,"items":items,"files":files}}))
}
