//! Native implementations of the application's canonical extension schemas.
mod codemirror;
mod editor;
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
    let identifier = schema.identifier.clone();
    builder
        .register(schema, raw::element)?
        .validate(&identifier, raw::validate)
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

#[cfg(test)]
mod raw_tests;
