//! The application's native menu. OCaml owns translated labels and business commands;
//! NSH owns platform edit/window/application roles and shortcut dispatch.
use lui_nsh::{app::ApplicationEvents, runtime::PlatformEvent};
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};
use serde::Deserialize;
use serde_json::json;
use std::rc::Rc;

#[derive(Clone, Deserialize)]
#[serde(deny_unknown_fields)]
struct Labels {
    #[serde(rename = "toggle-left-sidebar")]
    toggle_left_sidebar: String,
    documentation: String,
    file: String,
    edit: String,
    view: String,
    window: String,
    help: String,
    reload: String,
}
impl Labels {
    fn parse(payload: &str) -> Result<Self, String> {
        let labels: Self = serde_json::from_str(payload)
            .map_err(|error| format!("application menu labels: {error}"))?;
        if [
            &labels.toggle_left_sidebar,
            &labels.documentation,
            &labels.file,
            &labels.edit,
            &labels.view,
            &labels.window,
            &labels.help,
            &labels.reload,
        ]
        .into_iter()
        .any(|label| label.trim().is_empty())
        {
            return Err("application menu requires nonempty translated labels".into());
        }
        Ok(labels)
    }
}

pub fn install(payload: &str, events: ApplicationEvents) -> Result<(), String> {
    let labels = Labels::parse(payload)?;
    let command = Rc::new(move |name: &'static str| {
        if let Err(error) = events.send(PlatformEvent {
            operation: "application-menu-command".into(),
            payload: json!({"detail":{"command":name}}).to_string(),
        }) {
            eprintln!("application menu {name}: {error}");
        }
    });
    set_application_menu(items(labels, os() == Os::MacOs, command));
    Ok(())
}

type Command = Rc<dyn Fn(&'static str)>;
fn items(labels: Labels, mac: bool, command: Command) -> Vec<MenuItem> {
    let mut menus = Vec::with_capacity(6);
    if mac {
        menus.push(MenuItem::submenu(
            "Logseq",
            [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::role(MenuRole::ShowAll),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ],
        ));
    }
    let mut file = vec![MenuItem::role(MenuRole::Close)];
    if !mac {
        file.extend([MenuItem::separator(), MenuItem::role(MenuRole::Quit)]);
    }
    menus.push(MenuItem::submenu(labels.file, file));
    menus.push(MenuItem::submenu(
        labels.edit,
        [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
            MenuItem::role(MenuRole::SelectAll),
        ],
    ));
    let reload = command.clone();
    let sidebar = command.clone();
    menus.push(MenuItem::submenu(
        labels.view,
        [
            MenuItem::new(labels.reload)
                .shortcut("mod+r")
                .on_select(move || reload("reload")),
            MenuItem::role(MenuRole::ToggleFullScreen),
            MenuItem::separator(),
            MenuItem::new(labels.toggle_left_sidebar)
                .on_select(move || sidebar("toggle-left-sidebar")),
        ],
    ));
    menus.push(MenuItem::submenu(
        labels.window,
        [
            MenuItem::role(MenuRole::Minimize),
            MenuItem::role(MenuRole::Zoom),
        ],
    ));
    menus.push(MenuItem::submenu(
        labels.help,
        [MenuItem::new(labels.documentation).on_select(move || command("documentation"))],
    ));
    menus
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsh_engine::{EngineConfig, Root};
    use nsh_testing::Headless;

    fn labels() -> String {
        json!({"toggle-left-sidebar":"Toggle sidebar","documentation":"Documentation",
            "file":"File","edit":"Edit","view":"View","window":"Window","help":"Help","reload":"Reload"}).to_string()
    }
    #[component]
    fn MenuFixture() -> impl IntoElement {
        let command = signal(String::new());
        set_application_menu(items(
            Labels::parse(&labels()).unwrap(),
            false,
            Rc::new(move |name| command.set(name.into())),
        ));
        cleanup(|| set_application_menu(None));
        text(move || format!("Command: {}", command.get()))
    }
    #[test]
    fn native_application_shortcut_dispatches_the_existing_ocaml_command() {
        let mut config = EngineConfig::new(Root::of::<MenuFixture>());
        config.environment.os = Os::Linux;
        config.environment.idiom = nsh_core::platform::Idiom::Desktop;
        let mut app = Headless::start(config).unwrap();
        app.wait_for("text:Command:").unwrap();
        app.press_key("ctrl+r").unwrap();
        app.wait_for("text:Command: reload").unwrap();
        let menus = app.screen().app_menu().unwrap();
        assert_eq!(menus.len(), 5);
        assert!(
            matches!(&menus[0],nsh_core::desktop::MenuItem::Submenu{label,..} if label=="File")
        );
    }
    #[test]
    fn translated_menu_labels_are_required_before_native_menu_replacement() {
        let mut payload: serde_json::Value = serde_json::from_str(&labels()).unwrap();
        payload["file"] = "".into();
        assert!(Labels::parse(&payload.to_string()).is_err());
        payload["file"] = "文件".into();
        assert!(Labels::parse(&payload.to_string()).is_ok());
        payload.as_object_mut().unwrap().remove("reload");
        assert!(Labels::parse(&payload.to_string()).is_err());
    }
}
