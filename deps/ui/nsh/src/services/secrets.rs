//! Existing Logseq keychain request IDs/statuses over the OS credential store.
//! No command-line secret transport, logging of secret values, or file fallback.
use lui_nsh::runtime::PlatformEvent;
use nsh_core::prelude::blocking;
use serde::Deserialize;
use serde_json::{Value, json};

// Deliberately not Debug: this request can own an encryption credential.
#[derive(Deserialize)]
struct Request {
    #[serde(rename = "request-id")]
    id: String,
    operation: String,
    service: String,
    account: String,
    value: Option<String>,
}
impl Request {
    fn decode(payload: &str) -> Result<Self, String> {
        // Preserve the previous host's structured object contract. Error text
        // excludes the submitted JSON, service/account and secret value.
        let request: Self =
            serde_json::from_str(payload).map_err(|_| "invalid keychain request")?;
        if request.id.is_empty() || request.service.is_empty() || request.account.is_empty() {
            return Err("incomplete keychain request".into());
        }
        match request.operation.as_str() {
            "get" | "delete" => {}
            "set" if request.value.is_some() => {}
            "set" => return Err("keychain set requires a value".into()),
            _ => return Err("unknown keychain operation".into()),
        }
        Ok(request)
    }
}

pub async fn handle(operation: &str, payload: &str) -> Result<Vec<PlatformEvent>, String> {
    if operation != "keychain" {
        return Err(format!("unsupported credential operation: {operation}"));
    }
    let request = Request::decode(payload)?;
    // Reuse NSH's runtime blocking pool. Vault access can prompt/unlock or wait
    // for D-Bus and must hold neither the engine nor the OCaml runtime worker.
    let reply = blocking(move || execute(request))
        .await
        .map_err(|_| "native credential task failed".to_owned())?;
    Ok(vec![reply])
}

#[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
fn execute(request: Request) -> PlatformEvent {
    // Cargo must select the native target feature. The keyring mock/default
    // builder is never installed by this host.
    let result = keyring::Entry::new(&request.service, &request.account).and_then(|entry| {
        match request.operation.as_str() {
            "get" => entry.get_secret().map(Some),
            "set" => entry
                .set_secret(
                    request
                        .value
                        .as_deref()
                        .expect("validated keychain set")
                        .as_bytes(),
                )
                .map(|()| None),
            "delete" => entry.delete_credential().map(|()| None),
            _ => unreachable!("validated keychain operation"),
        }
    });
    native_result(&request.id, result)
}
#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn execute(request: Request) -> PlatformEvent {
    result(&request.id, "unsupported", None)
}
#[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
fn native_result(id: &str, value: Result<Option<Vec<u8>>, keyring::Error>) -> PlatformEvent {
    match value {
        Ok(Some(value)) => match String::from_utf8(value) {
            Ok(value) => result(id, "ok", Some(value)),
            Err(_) => result(id, "invalid-data", None),
        },
        Ok(None) => result(id, "ok", None),
        Err(keyring::Error::NoEntry) => result(id, "not-found", None),
        Err(keyring::Error::BadEncoding(_)) => result(id, "invalid-data", None),
        // Locked/unavailable vaults, ambiguity and backend/permission failures
        // are real errors, never successful empty credentials or plaintext stores.
        Err(_) => result(id, "error", None),
    }
}
fn result(id: &str, status: &str, value: Option<String>) -> PlatformEvent {
    let mut payload = json!({"request-id":id,"status":status});
    if let Some(value) = value {
        payload["value"] = Value::String(value);
    }
    PlatformEvent {
        operation: "keychain-result".into(),
        payload: payload.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn credential_requests_preserve_existing_validation_and_allow_empty_secret() {
        let request = Request::decode(r#"{"request-id":"17","operation":"set","service":"Logseq E2EE","account":"test","value":""}"#).unwrap();
        assert_eq!(request.value.as_deref(), Some(""));
        for payload in [
            r#"{"request-id":"","operation":"get","service":"s","account":"a"}"#,
            r#"{"request-id":"1","operation":"get","service":"","account":"a"}"#,
            r#"{"request-id":"1","operation":"set","service":"s","account":"a"}"#,
            r#"{"request-id":"1","operation":"other","service":"s","account":"a"}"#,
            r#"[]"#,
        ] {
            assert!(Request::decode(payload).is_err());
        }
        let malformed = Request::decode("{\"secret\":\"must-not-appear-in-error\"")
            .err()
            .unwrap();
        assert_eq!(malformed, "invalid keychain request");
    }
    #[test]
    #[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
    fn credential_results_keep_ids_statuses_and_utf8_without_leaking_backend_details() {
        let check = |reply: PlatformEvent, expected: Value| {
            assert_eq!(reply.operation, "keychain-result");
            assert_eq!(
                serde_json::from_str::<Value>(&reply.payload).unwrap(),
                expected
            );
        };
        check(
            native_result("17", Ok(Some("A\0中".as_bytes().to_vec()))),
            json!({"request-id":"17","status":"ok","value":"A\0中"}),
        );
        check(
            native_result("18", Ok(None)),
            json!({"request-id":"18","status":"ok"}),
        );
        check(
            native_result("19", Err(keyring::Error::NoEntry)),
            json!({"request-id":"19","status":"not-found"}),
        );
        check(
            native_result("20", Ok(Some(vec![255]))),
            json!({"request-id":"20","status":"invalid-data"}),
        );
        check(
            native_result("21", Err(keyring::Error::BadEncoding(vec![255]))),
            json!({"request-id":"21","status":"invalid-data"}),
        );
        check(
            native_result(
                "22",
                Err(keyring::Error::NoStorageAccess(Box::new(
                    std::io::Error::other("sensitive backend detail"),
                ))),
            ),
            json!({"request-id":"22","status":"error"}),
        );
        assert_eq!(
            serde_json::from_str::<Value>(&result("23", "unsupported", None).payload).unwrap(),
            json!({"request-id":"23","status":"unsupported"})
        );
    }
}
