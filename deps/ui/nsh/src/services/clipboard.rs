//! Logseq's existing clipboard/URL host protocol over native desktop services.
use lui_nsh::runtime::PlatformEvent;
use nsh_core::prelude::{blocking, open_url};
use serde::Deserialize;
use serde_json::{Value, json};
use std::sync::{Arc, Mutex};

/// App-owned clipboard provider. Retain it until the app closes: Linux clipboard
/// ownership can end when its provider is dropped. No global clipboard cache.
#[derive(Clone, Default)]
pub struct ClipboardService {
    clipboard: Arc<Mutex<Option<arboard::Clipboard>>>,
}
impl ClipboardService {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn handle(
        &self,
        operation: &str,
        payload: &str,
    ) -> Result<Vec<PlatformEvent>, String> {
        match operation {
            "clipboard" => {
                let result = self.write(payload.to_owned()).await;
                Ok(operation_result(operation, result))
            }
            "clipboard-write" => {
                let request = WriteRequest::decode(payload)?;
                let result = self.write(request.text).await;
                Ok(vec![write_result(request.id, result)])
            }
            "clipboard-read" => {
                if !payload.is_empty() {
                    return Err("clipboard-read requires an empty payload".into());
                }
                let clipboard = self.clipboard.clone();
                let result = blocking(move || {
                    with_clipboard(&clipboard, |clipboard| match clipboard.get_text() {
                        Ok(text) => Ok(text),
                        Err(arboard::Error::ContentNotAvailable) => Ok(String::new()),
                        Err(error) => Err(error.to_string()),
                    })
                })
                .await
                .map_err(|error| format!("clipboard read task: {error}"))?;
                Ok(vec![read_result(result)])
            }
            "open-url" => {
                // This is the public NSH policy and native completion result,
                // including capability denial and no registered application.
                nsh_core::open_url::check_url(payload)?;
                let opened = open_url(payload.to_owned()).await;
                Ok(operation_result(
                    operation,
                    if opened {
                        Ok(())
                    } else {
                        Err("the native host did not open the external URL".into())
                    },
                ))
            }
            _ => Err(format!("unsupported clipboard/URL operation: {operation}")),
        }
    }

    async fn write(&self, text: String) -> Result<(), String> {
        let clipboard = self.clipboard.clone();
        blocking(move || {
            with_clipboard(&clipboard, |clipboard| {
                clipboard.set_text(text).map_err(|error| error.to_string())
            })
        })
        .await
        .map_err(|error| format!("clipboard write task: {error}"))?
    }
}
fn with_clipboard<R>(
    state: &Mutex<Option<arboard::Clipboard>>,
    work: impl FnOnce(&mut arboard::Clipboard) -> Result<R, String>,
) -> Result<R, String> {
    let mut clipboard = state
        .lock()
        .map_err(|_| "clipboard provider lock poisoned")?;
    if clipboard.is_none() {
        *clipboard = Some(arboard::Clipboard::new().map_err(|error| error.to_string())?);
    }
    work(clipboard.as_mut().expect("initialized native clipboard"))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WriteRequest {
    #[serde(rename = "request-id")]
    id: String,
    text: String,
}
impl WriteRequest {
    fn decode(payload: &str) -> Result<Self, String> {
        let request: Self = serde_json::from_str(payload)
            .map_err(|error| format!("invalid clipboard-write request: {error}"))?;
        let id = request
            .id
            .parse::<u64>()
            .map_err(|_| "invalid clipboard-write request identity")?;
        if id == 0 || id > i64::MAX as u64 || id.to_string() != request.id {
            return Err("invalid clipboard-write request identity".into());
        }
        Ok(request)
    }
}
fn event(operation: &str, payload: Value) -> PlatformEvent {
    PlatformEvent {
        operation: operation.into(),
        payload: payload.to_string(),
    }
}
fn operation_result(operation: &str, result: Result<(), String>) -> Vec<PlatformEvent> {
    match result {
        Ok(()) => Vec::new(),
        Err(message) => vec![event(
            "platform-error",
            json!({"operation":operation,"message":message}),
        )],
    }
}
fn write_result(id: String, result: Result<(), String>) -> PlatformEvent {
    event(
        "clipboard-write-result",
        match result {
            Ok(()) => json!({"request-id":id,"ok":true}),
            Err(error) => json!({"request-id":id,"ok":false,"error":error}),
        },
    )
}
fn read_result(result: Result<String, String>) -> PlatformEvent {
    event(
        "clipboard-read",
        match result {
            Ok(text) => json!({"text":text}),
            Err(error) => json!({"error":error}),
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn clipboard_requests_keep_canonical_ids_and_arbitrary_utf8_text() {
        let request =
            WriteRequest::decode(r#"{"request-id":"9223372036854775807","text":"A\u0000中"}"#)
                .unwrap();
        assert_eq!(request.text, "A\0中");
        for payload in [
            r#"{"request-id":"0","text":"x"}"#,
            r#"{"request-id":"01","text":"x"}"#,
            r#"{"request-id":"9223372036854775808","text":"x"}"#,
            r#"{"request-id":"1","request-id":"2","text":"x"}"#,
            r#"{"request-id":"1","text":"x","other":true}"#,
            r#"{"request-id":"1"}"#,
            r#"{"request-id":"1","text":"x"} {}"#,
        ] {
            assert!(WriteRequest::decode(payload).is_err(), "{payload}");
        }
    }
    #[test]
    fn clipboard_replies_preserve_acknowledgement_and_failure_instead_of_false_success() {
        let saved = write_result("9".into(), Ok(()));
        assert_eq!(saved.operation, "clipboard-write-result");
        assert_eq!(
            serde_json::from_str::<Value>(&saved.payload).unwrap(),
            json!({"request-id":"9","ok":true})
        );
        let failed = write_result("9".into(), Err("occupied".into()));
        assert_eq!(
            serde_json::from_str::<Value>(&failed.payload).unwrap(),
            json!({"request-id":"9","ok":false,"error":"occupied"})
        );
        assert_eq!(read_result(Ok(String::new())).payload, r#"{"text":""}"#);
        assert_eq!(
            read_result(Err("provider failed".into())).payload,
            r#"{"error":"provider failed"}"#
        );
        assert!(operation_result("clipboard", Ok(())).is_empty());
        assert_eq!(
            operation_result("open-url", Err("not opened".into()))[0].operation,
            "platform-error"
        );
    }
    #[test]
    fn external_urls_follow_the_actual_nsh_native_policy() {
        assert!(nsh_core::open_url::check_url("https://logseq.com/").is_ok());
        assert!(nsh_core::open_url::check_url("mailto:hello@logseq.com").is_ok());
        for url in ["/relative", "https://example.org/\n", "javascript:alert(1)"] {
            assert!(nsh_core::open_url::check_url(url).is_err());
        }
    }
}
