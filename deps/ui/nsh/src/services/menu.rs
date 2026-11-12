//! The application's native menu. OCaml owns translated labels and business commands;
//! NSH owns platform edit/window/application roles and shortcut dispatch.
use lui_nsh::{
    app::ApplicationEvents,
    desktop_updates::{InstallPreparation, UpdateActions, UpdateLabels, UpdateLifecycle},
    runtime::PlatformEvent,
};
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};
use serde::Deserialize;
use serde_json::json;
use std::rc::Rc;

#[derive(Clone, PartialEq, Deserialize)]
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
    updates: UpdateLabels,
    #[serde(rename = "installation-unavailable-description")]
    installation_unavailable_description: String,
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
            &labels.installation_unavailable_description,
        ]
        .into_iter()
        .any(|label| label.trim().is_empty())
        {
            return Err("application menu requires nonempty translated labels".into());
        }
        labels.updates.validate()?;
        Ok(labels)
    }
}

#[derive(Clone)]
struct Installed {
    labels: Labels,
    command: Command,
}
impl PartialEq for Installed {
    fn eq(&self, other: &Self) -> bool {
        self.labels == other.labels && Rc::ptr_eq(&self.command, &other.command)
    }
}

/// One application menu owner. Update phases contribute to this same menu;
/// no second controller, worker, menu owner or polling loop is mounted.
#[derive(Clone, Copy)]
pub struct ApplicationMenu {
    owner: Owner,
    installed: Signal<Option<Installed>>,
}
impl ApplicationMenu {
    pub fn mount() -> Self {
        let installed = signal(None::<Installed>);
        let updates = UpdateActions::installed(Rc::new(InstallationUnavailable { installed }));
        effect(move || {
            if let Some(current) = installed.get() {
                let contribution = updates.menu_items(current.labels.updates.clone());
                set_application_menu(items(
                    current.labels,
                    os() == Os::MacOs,
                    current.command,
                    contribution,
                ));
            }
        });
        cleanup(|| set_application_menu(None));
        Self {
            owner: Owner::current(),
            installed,
        }
    }
    pub fn install(&self, payload: &str, events: ApplicationEvents) -> Result<(), String> {
        if !self.owner.is_live() {
            return Err("application menu owner is retired".into());
        }
        let labels = Labels::parse(payload)?;
        let owner = self.owner;
        let command = Rc::new(move |name: &'static str| {
            if !owner.is_live() {
                return;
            }
            if let Err(error) = events.send(PlatformEvent {
                operation: "application-menu-command".into(),
                payload: json!({"detail":{"command":name}}).to_string(),
            }) {
                eprintln!("application menu {name}: {error}");
            }
        });
        self.installed.set(Some(Installed { labels, command }));
        Ok(())
    }
}

// Actual installation remains closed until the application supplies a verified
// save/quiesce, worker-ownership and relaunch lifecycle. Checks and downloads
// still use the existing updater; this policy never issues an installation lease.
struct InstallationUnavailable {
    installed: Signal<Option<Installed>>,
}
impl UpdateLifecycle for InstallationUnavailable {
    fn prepare(&self) -> InstallPreparation {
        let current = self
            .installed
            .get_untracked()
            .expect("update actions require installed translated menu labels");
        Box::pin(async move { Err(current.labels.installation_unavailable_description) })
    }
}

type Command = Rc<dyn Fn(&'static str)>;
fn items(labels: Labels, mac: bool, command: Command, mut updates: Vec<MenuItem>) -> Vec<MenuItem> {
    let mut menus = Vec::with_capacity(6);
    if mac {
        let mut application = vec![MenuItem::role(MenuRole::About), MenuItem::separator()];
        if !updates.is_empty() {
            application.append(&mut updates);
            application.push(MenuItem::separator());
        }
        application.extend([
            MenuItem::role(MenuRole::Hide),
            MenuItem::role(MenuRole::HideOthers),
            MenuItem::role(MenuRole::ShowAll),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Quit),
        ]);
        menus.push(MenuItem::submenu("Logseq", application));
    }
    let mut file = vec![MenuItem::role(MenuRole::Close)];
    if !mac {
        if !updates.is_empty() {
            file.push(MenuItem::separator());
            file.append(&mut updates);
        }
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
            "file":"File","edit":"Edit","view":"View","window":"Window","help":"Help","reload":"Reload",
            "installation-unavailable-description":"This update cannot be installed until Logseq can safely save and restart.",
            "updates":{"menu-check":"Check for Updates…",
            "menu-install":"Install and Restart…",
            "menu-checking":"Checking for Updates…",
            "menu-downloading":"Downloading Update…",
            "menu-prompt":"Update Available…",
            "menu-installing":"Installing Update…",
            "menu-cancelling":"Cancelling Update…",
            "menu-cancel":"Cancel Update",
            "menu-unavailable":"Updates Unavailable…",
            "current-title":"You're Up to Date",
            "current-description":"The latest version is installed.",
            "done":"OK",
            "available-title":"Update Available",
            "version-available":"Version {version} is available.",
            "version-notes":"Version {version} is available.\n\n{notes}",
            "later":"Later",
            "download":"Download",
            "open-download":"Open Download Page",
            "ready-title":"Update Ready",
            "ready-description":"The app will close and restart with the new version.",
            "install":"Install and Restart",
            "error-title":"Update Could Not Be Completed"}}).to_string()
    }
    #[component]
    fn MenuFixture() -> impl IntoElement {
        let command = signal(String::new());
        set_application_menu(items(
            Labels::parse(&labels()).unwrap(),
            false,
            Rc::new(move |name| command.set(name.into())),
            Vec::new(),
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
    }
    #[test]
    fn translated_menu_labels_are_required_before_native_menu_replacement() {
        let mut payload: serde_json::Value = serde_json::from_str(&labels()).unwrap();
        payload["file"] = "".into();
        assert!(Labels::parse(&payload.to_string()).is_err());
        payload["file"] = "文件".into();
        assert!(Labels::parse(&payload.to_string()).is_ok());
        let mut invalid_update: serde_json::Value = serde_json::from_str(&labels()).unwrap();
        invalid_update["updates"]["version-notes"] = "Missing required parameters".into();
        assert!(Labels::parse(&invalid_update.to_string()).is_err());
        invalid_update["updates"] = serde_json::Value::Null;
        assert!(Labels::parse(&invalid_update.to_string()).is_err());
        let mut unavailable: serde_json::Value = serde_json::from_str(&labels()).unwrap();
        unavailable["installation-unavailable-description"] = "".into();
        assert!(Labels::parse(&unavailable.to_string()).is_err());
        unavailable
            .as_object_mut()
            .unwrap()
            .remove("installation-unavailable-description");
        assert!(Labels::parse(&unavailable.to_string()).is_err());
        payload.as_object_mut().unwrap().remove("reload");
        assert!(Labels::parse(&payload.to_string()).is_err());
    }

    #[component]
    fn UnavailableInstallationFixture() -> impl IntoElement {
        let mut labels = Labels::parse(&labels()).unwrap();
        labels.installation_unavailable_description = "无法安全安装更新".into();
        let lifecycle = InstallationUnavailable {
            installed: signal(Some(Installed {
                labels,
                command: Rc::new(|_| ()),
            })),
        };
        let result = signal(String::new());
        spawn(async move {
            match lifecycle.prepare().await {
                Err(message) => result.set(message),
                Ok(_) => panic!("unqualified application installation must not issue a lease"),
            }
        });
        text(move || result.get())
    }

    #[test]
    fn unqualified_installation_returns_the_current_translated_explanation() {
        let mut app = Headless::start(EngineConfig::new(
            Root::of::<UnavailableInstallationFixture>(),
        ))
        .unwrap();
        app.wait_for("text:无法安全安装更新").unwrap();
    }
}
