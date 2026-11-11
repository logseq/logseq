//! Native implementations of the application's canonical extension schemas.
mod codemirror;

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
