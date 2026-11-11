//! The real Logseq OCaml application rendered by the NSH desktop backend.
pub mod extensions;
mod services;

use lui_nsh::{
    app::ApplicationServices,
    application_icons::IconRegistry,
    application_theme::ThemeRegistry,
    extensions::{Extensions, Profile, Schema},
    runtime::BridgeConfig,
};
use nsh_core::prelude::*;

/// Supply through `EngineConfig::context` for headless startup qualification.
/// The app then owns a fresh in-memory credential store, never the OS keychain.
/// The native runner provides no environment switch for this test dependency.
pub struct StartupPreflight;

#[native_module("logseq/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// Shared application root for the native runner and public NSH tests.
#[component]
pub fn App() -> impl IntoElement {
    let icons = IconRegistry::new();
    let themes = ThemeRegistry::new();
    provide_context(icons);
    provide_context(themes);
    let native_base = tokens();
    let native_themes = themes;
    effect(
        move || match native_themes.native_tokens(&native_base, dark(), reduce_motion()) {
            Ok(tokens) => set_tokens(tokens),
            Err(error) => eprintln!("Logseq native theme: {error}"),
        },
    );
    let services = if engine_context::<StartupPreflight>().is_some() {
        services::Services::isolated(icons, themes)
    } else {
        services::Services::new(icons, themes)
    };
    provide_context(ApplicationServices::new(move |request, renderer| {
        let services = services.clone();
        Box::pin(async move { services.handle(request, renderer).await })
    }));
    provide_context(BridgeConfig::Logseq {
        payload: r#"{"paintsCaret":false}"#.into(),
    });
    match registrations() {
        Ok(extensions) => {
            provide_context(extensions);
            lui_nsh::app::desktop()
                .library(library_path())
                .into_element()
        }
        Err(error) => {
            eprintln!("Logseq native registration: {error}");
            text(error).into_element()
        }
    }
}
fn registrations() -> Result<Extensions, String> {
    let schemas: Vec<Schema> = serde_json::from_str(include_str!("../schemas.json"))
        .map_err(|error| format!("canonical schema receipt: {error}"))?;
    let mut builder = Extensions::builder();
    for schema in schemas {
        builder = match schema.identifier.as_str() {
            "logseq-codemirror" => extensions::register_codemirror(builder, schema)?,
            "logseq-editor" => extensions::register_editor(builder, schema)?,
            _ => extensions::register_raw(builder, schema)?,
        };
    }
    builder.freeze(Profile {
        os: std::env::consts::OS.into(),
        host: "nsh".into(),
    })
}
fn library_path() -> String {
    if let Some(path) = std::env::var_os("LUI_OCAML_LIBRARY") {
        return path.to_string_lossy().into_owned();
    }
    let filename = if cfg!(target_os = "macos") {
        "liblogseq_ui.dylib"
    } else if cfg!(target_os = "windows") {
        "logseq_ui.dll"
    } else {
        "liblogseq_ui.so"
    };
    std::env::current_exe()
        .expect("application executable path")
        .parent()
        .expect("application executable directory")
        .join("../Resources")
        .join(filename)
        .to_string_lossy()
        .into_owned()
}
