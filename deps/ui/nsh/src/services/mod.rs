//! Application host operations; the LUI desktop pump owns all OCaml dispatch.
mod clipboard;
mod dom;
mod editor_geometry;
mod editor_text_geometry;
mod files;
pub(crate) mod keyboard;
mod menu;
mod natural_date;
pub(crate) mod resources;
mod secrets;
mod update_preparation;

use clipboard::ClipboardService;
use lui_nsh::{
    app::{ApplicationEvents, ApplicationMutations, ServiceResponse},
    application_icons::IconRegistry,
    application_theme::ThemeRegistry,
    render::Renderer,
    runtime::{PlatformEvent, PlatformRequest},
};
pub(crate) use menu::ApplicationMenu;
use nsh_core::{
    desktop::WindowAttributes,
    element::desktop::{current_window, title_bar},
    prelude::*,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{cell::Cell, rc::Rc};

pub struct Services {
    icons: IconRegistry,
    themes: ThemeRegistry,
    clipboard: ClipboardService,
    credentials: secrets::CredentialStore,
    connected: Cell<bool>,
    closing: Cell<bool>,
    resources: resources::Resources,
    menu: ApplicationMenu,
    keyboard: keyboard::GlobalKeyboard,
    admission: ApplicationMutations,
}
impl Services {
    pub fn new(icons: IconRegistry, themes: ThemeRegistry, menu: ApplicationMenu) -> Rc<Self> {
        Self::with_credentials(icons, themes, secrets::CredentialStore::Native, menu)
    }
    pub fn isolated(icons: IconRegistry, themes: ThemeRegistry, menu: ApplicationMenu) -> Rc<Self> {
        Self::with_credentials(icons, themes, secrets::CredentialStore::isolated(), menu)
    }
    fn with_credentials(
        icons: IconRegistry,
        themes: ThemeRegistry,
        credentials: secrets::CredentialStore,
        menu: ApplicationMenu,
    ) -> Rc<Self> {
        Rc::new(Self {
            icons,
            themes,
            clipboard: ClipboardService::new(),
            credentials,
            connected: Cell::new(false),
            closing: Cell::new(false),
            resources: resources::Resources::new(),
            menu,
            keyboard: use_context::<keyboard::GlobalKeyboard>()
                .expect("application keyboard owner"),
            admission: use_context::<ApplicationMutations>().expect("application mutation owner"),
        })
    }
    pub(crate) fn resources(&self) -> resources::Resources {
        self.resources
    }
    fn connect(self: &Rc<Self>, renderer: &Renderer) -> Result<ApplicationEvents, String> {
        let events =
            use_context::<ApplicationEvents>().ok_or("application event pump is missing")?;
        if !self.connected.replace(true) {
            self.keyboard.connect(events.clone(), renderer.clone());
            let failure = renderer.clone();
            let send = events.clone();
            effect(move || {
                let size = window();
                let bar = title_bar();
                for event in [
                    event(
                        "window-size",
                        json!({"width":size.width.0,"height":size.height.0}),
                    ),
                    event(
                        "window-titlebar",
                        json!({"height":bar.top.0,"left":bar.left.0,"right":bar.right.0}),
                    ),
                    event("appearance", json!({"dark":dark()})),
                ] {
                    if let Err(error) = send.send(event) {
                        failure.fail(error);
                    }
                }
            });
            let mut attributes = WindowAttributes::default();
            attributes.close_on_press = Some(false);
            current_window().set(attributes);
            let closing = self.clone();
            let failure = renderer.clone();
            let send = events.clone();
            current_window().on_close_press(move |_| {
                if !closing.closing.replace(true)
                    && let Err(error) = send.send(event("window-close-request", json!({})))
                {
                    closing.closing.set(false);
                    failure.fail(error);
                }
            });
        }
        Ok(events)
    }
    pub async fn handle(
        self: &Rc<Self>,
        request: PlatformRequest,
        renderer: Renderer,
    ) -> Result<ServiceResponse, String> {
        let events = self.connect(&renderer)?;
        if request.operation == "dom-op" {
            let (operation, payload) = request
                .payload
                .split_once('\n')
                .ok_or("dom-op requires an operation separator")?;
            if let Some(request) = files::capture(operation, payload)? {
                let admission = self.admission.clone();
                return Ok(ServiceResponse::AfterCommit(Box::pin(async move {
                    Ok(files::execute(request, admission).await)
                })));
            }
            let captured =
                dom::capture(operation, payload, &renderer, Some(self.admission.clone()))?;
            return Ok(ServiceResponse::AfterCommit(Box::pin(async move {
                dom::execute(captured, &renderer).await
            })));
        }
        let replies = match request.operation.as_str() {
            "natural-date-parse" => natural_date::handle(&request.payload),
            "native-keymap" => self.keyboard.replace(&request.payload).map(|()| Vec::new()),
            "app-icons" => {
                self.icons.replace_json(&request.payload)?;
                Ok(Vec::new())
            }
            "theme-snapshot" => {
                self.themes.install_snapshot_json(&request.payload)?;
                Ok(Vec::new())
            }
            "ui-state" => {
                let state: UiState = serde_json::from_str(&request.payload)
                    .map_err(|error| format!("ui-state: {error}"))?;
                if state.lang.is_empty() {
                    return Err("ui-state requires a language".into());
                }
                self.themes
                    .set_mode(state.data.get("theme").map(String::as_str).unwrap_or(""))?;
                Ok(Vec::new())
            }
            "update-preparation-result" => {
                self.menu.preparation_result(&request.payload)?;
                Ok(Vec::new())
            }
            "application-menu-labels" => {
                self.menu.install(&request.payload, events)?;
                Ok(Vec::new())
            }
            "application-update-check" => {
                self.menu.check_updates(&request.payload)?;
                Ok(Vec::new())
            }
            "clipboard" | "clipboard-write" | "clipboard-read" | "open-url" => {
                self.clipboard
                    .handle(&request.operation, &request.payload)
                    .await
            }
            "keychain" => {
                self.credentials
                    .handle(&request.operation, &request.payload)
                    .await
            }
            "resource-context" => {
                self.resources.install(&request.payload)?;
                Ok(Vec::new())
            }
            "window-close" => {
                if !self.closing.replace(true) {
                    events.send(event("window-close-request", json!({})))?;
                }
                Ok(Vec::new())
            }
            "window-close-result" => {
                let result: CloseResult = serde_json::from_str(&request.payload)
                    .map_err(|error| format!("window-close-result: {error}"))?;
                if !self.closing.replace(false) {
                    return Err("unsolicited window close result".into());
                }
                if result.ok {
                    current_window().close();
                } else {
                    return Err(format!(
                        "application save prevented closing: {}",
                        result.error.unwrap_or_default()
                    ));
                }
                Ok(Vec::new())
            }
            _ => Err(format!(
                "required native service is not implemented: {}",
                request.operation
            )),
        }?;
        Ok(ServiceResponse::Events(replies))
    }
}
fn event(operation: &str, payload: Value) -> PlatformEvent {
    PlatformEvent {
        operation: operation.into(),
        payload: payload.to_string(),
    }
}
#[derive(Deserialize)]
struct UiState {
    lang: String,
    data: std::collections::BTreeMap<String, String>,
}
#[derive(Deserialize)]
struct CloseResult {
    ok: bool,
    error: Option<String>,
}
