//! Bounded English date parsing for the application's existing host task channel.
use chrono::{DateTime, Datelike, Local, TimeZone};
use interim::{Dialect, parse_date_string};
use lui_nsh::runtime::PlatformEvent;
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
struct Request {
    request_id: String,
    input: String,
    reference_ms: i64,
}

fn parse_at<Tz: TimeZone>(input: &str, reference: DateTime<Tz>) -> Option<i64> {
    parse_date_string(input, reference, Dialect::Us)
        .ok()
        .map(|date| date.timestamp_millis())
}

pub(super) fn handle(payload: &str) -> Result<Vec<PlatformEvent>, String> {
    let request: Request =
        serde_json::from_str(payload).map_err(|error| format!("natural-date-parse: {error}"))?;
    let id: u64 = request
        .request_id
        .parse()
        .map_err(|_| "invalid date request identity")?;
    if id == 0 || id.to_string() != request.request_id {
        return Err("invalid date request identity".into());
    }
    let result = if request.input.len() > 1024 {
        json!({"status":"error","error":"Natural date input exceeds 1024 bytes"})
    } else if let Some(reference) = DateTime::from_timestamp_millis(request.reference_ms)
        .filter(|reference| (1000..=9999).contains(&reference.year()))
    {
        match parse_at(request.input.trim(), reference.with_timezone(&Local)) {
            Some(value) => json!({"status":"parsed","epoch-ms":value}),
            None => json!({"status":"no-match"}),
        }
    } else {
        json!({"status":"error","error":"Natural date reference is out of range"})
    };
    let mut result = result;
    result["request-id"] = json!(request.request_id);
    Ok(vec![PlatformEvent {
        operation: "natural-date-result".into(),
        payload: result.to_string(),
    }])
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{FixedOffset, Utc};
    use serde_json::Value;

    #[test]
    fn english_dates_use_the_captured_reference_and_platform_timezone() {
        let zone = FixedOffset::east_opt(8 * 3600).unwrap();
        let reference = zone.with_ymd_and_hms(2026, 11, 13, 10, 20, 0).unwrap();
        for (input, expected) in [
            (
                "Next week",
                zone.with_ymd_and_hms(2026, 11, 20, 10, 20, 0).unwrap(),
            ),
            (
                "Tomorrow",
                zone.with_ymd_and_hms(2026, 11, 14, 10, 20, 0).unwrap(),
            ),
            (
                "April 5, 2026",
                zone.with_ymd_and_hms(2026, 4, 5, 0, 0, 0).unwrap(),
            ),
            (
                "next friday 8pm",
                zone.with_ymd_and_hms(2026, 11, 20, 20, 0, 0).unwrap(),
            ),
            (
                "2024-02-29",
                zone.with_ymd_and_hms(2024, 2, 29, 0, 0, 0).unwrap(),
            ),
        ] {
            assert_eq!(
                parse_at(input, reference),
                Some(expected.timestamp_millis()),
                "{input}"
            );
        }
        for input in ["", "not a date", "2024-02-30", "9999 January"] {
            assert_eq!(parse_at(input, reference), None, "{input}");
        }
    }

    #[test]
    fn host_results_separate_no_match_from_invalid_requests() {
        let reference = Utc.with_ymd_and_hms(2026, 11, 13, 10, 20, 0).unwrap();
        let request = |input: &str| {
            json!({"request-id":"7","input":input,
            "reference-ms":reference.timestamp_millis()})
            .to_string()
        };
        for (input, status) in [("Next week", "parsed"), ("not a date", "no-match")] {
            let events = handle(&request(input)).unwrap();
            assert_eq!(events.len(), 1);
            assert_eq!(events[0].operation, "natural-date-result");
            let result: Value = serde_json::from_str(&events[0].payload).unwrap();
            assert_eq!(result["request-id"], "7");
            assert_eq!(result["status"], status);
        }
        let too_long = handle(&request(&"a".repeat(1025))).unwrap();
        let result: Value = serde_json::from_str(&too_long[0].payload).unwrap();
        assert_eq!(result["status"], "error");
        for payload in [
            "{}",
            r#"{"request-id":"01","input":"today","reference-ms":0}"#,
            r#"{"request-id":"1","input":"today","reference-ms":0,"extra":true}"#,
        ] {
            assert!(handle(payload).is_err());
        }
    }
}
