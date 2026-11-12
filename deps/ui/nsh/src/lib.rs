//! The real Logseq OCaml application rendered by the NSH desktop backend.
pub mod extensions;
mod fonts;
pub mod relaunch;
pub use fonts::with_bundled_fonts;
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
/// The native runner can select the same store through an explicit App prop,
/// never an environment switch for credentials.
pub struct StartupPreflight;

/// Initialization options shared by the native runner and default Headless root.
#[derive(Clone, PartialEq, Props)]
pub struct AppProps {
    /// Use an owner-local empty credential store for an explicit qualification
    /// launch. Read once at mount; ordinary app launches always default to false.
    #[prop(default)]
    pub startup_preflight: Prop<bool>,
}

#[native_module("logseq/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// Makes the PDF provider available in NSH-generated native/package runners.
#[cfg(target_os = "macos")]
#[native_components(macos)]
fn components(components: &nsh_platform_macos::Components) {
    extensions::register_pdf(components);
}

/// Shared application root for the native runner and public NSH tests.
#[component]
pub fn App(props: AppProps) -> impl IntoElement {
    #[cfg(target_os = "macos")]
    show_background_application();
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
    let application_menu = services::ApplicationMenu::mount();
    provide_context(services::keyboard::GlobalKeyboard::mount());
    let services = if props.startup_preflight.get_untracked()
        || engine_context::<StartupPreflight>().is_some()
    {
        services::Services::isolated(icons, themes, application_menu)
    } else {
        services::Services::new(icons, themes, application_menu)
    };
    provide_context(services.resources());
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

/// A bundled background process can inherit AppKit's hidden application state.
/// Restore only this app after its runner created the window, without activating.
#[cfg(target_os = "macos")]
fn show_background_application() {
    if !std::env::var("LUI_AGENT_BACKGROUND").is_ok_and(|value| value == "1") {
        return;
    }
    dispatch2::DispatchQueue::main().exec_async(|| {
        use nsh_platform_macos::{
            objc2::MainThreadMarker,
            objc2_app_kit::{NSApplication, NSApplicationActivationPolicy},
        };
        let main = MainThreadMarker::new().expect("main-queue background launch");
        let application = NSApplication::sharedApplication(main);
        if application.activationPolicy() == NSApplicationActivationPolicy::Prohibited {
            application.unhideWithoutActivation();
            eprintln!(
                "Logseq background window: active={}, hidden={}",
                application.isActive(),
                application.isHidden()
            );
        }
    });
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
        .join(if cfg!(target_os = "macos") {
            "../Resources"
        } else {
            "Resources"
        })
        .join(filename)
        .to_string_lossy()
        .into_owned()
}

#[cfg(test)]
mod qualification_tests {
    use super::*;

    #[test]
    fn default_app_props_keep_the_existing_headless_root_constructor() {
        // The public constructor requires AppProps: Default. No engine, OCaml
        // worker or native credential provider starts during this compile probe.
        let _root = nsh_core::element::Root::of::<App>();
    }
}
