//! Native implementations of the application's canonical extension schemas.
mod audio;
mod codemirror;
mod editor;
mod pdf;
mod raw;
mod raw_style;

use lui_nsh::extensions::{ExtensionBuilder, ExtensionContext, Schema};

/// Registers a schema exported by the linked OCaml app without rebuilding its fingerprint.
/// The application composes its remaining factories before freezing the profile.
pub fn register_codemirror(
    builder: ExtensionBuilder,
    schema: Schema,
) -> Result<ExtensionBuilder, String> {
    if schema.identifier != "logseq-codemirror" {
        return Err("CodeMirror registration requires its canonical app schema".into());
    }
    builder
        .register(schema, codemirror::element)?
        .validate("logseq-codemirror", codemirror::validate)
}

/// Register a canonical raw-markup schema, including its pure capability checks.
pub fn register_raw(builder: ExtensionBuilder, schema: Schema) -> Result<ExtensionBuilder, String> {
    if !schema.identifier.starts_with("logseq-")
        || matches!(
            schema.identifier.as_str(),
            "logseq-editor" | "logseq-codemirror"
        )
    {
        return Err("raw registration requires a canonical logseq markup schema".into());
    }
    if schema.identifier == "logseq-pdf" {
        return builder
            .register(schema, pdf::element)?
            .validate("logseq-pdf", pdf::validate)?
            .validate_themed("logseq-pdf", pdf::validate_themed);
    }
    if schema.identifier == "logseq-audio" {
        return builder
            .register(schema, audio::element)?
            .validate("logseq-audio", audio::validate)?
            .validate_themed("logseq-audio", raw::validate_themed);
    }
    let identifier = schema.identifier.clone();
    builder
        .register(schema, raw::element)?
        .validate(&identifier, raw::validate)?
        .validate_themed(&identifier, raw::validate_themed)
}

/// Register the native input sink for the existing authoritative block editor.
pub fn register_editor(
    builder: ExtensionBuilder,
    schema: Schema,
) -> Result<ExtensionBuilder, String> {
    if schema.identifier != "logseq-editor" {
        return Err("block editor registration requires its canonical app schema".into());
    }
    builder
        .register(schema, editor::element)?
        .validate("logseq-editor", editor::validate)
}

fn string(context: &ExtensionContext, name: &str) -> String {
    context
        .property(name)
        .and_then(|value| value.as_str().map(str::to_owned))
        .unwrap_or_default()
}
fn boolean(context: &ExtensionContext, name: &str) -> bool {
    context
        .property(name)
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests;

/// Registers the actual PDFKit host before the native AppView is constructed.
#[cfg(target_os = "macos")]
pub use pdf::register as register_pdf;
