//! The application's native menu. OCaml owns translated labels and business commands;
//! NSH owns platform edit/window/application roles and shortcut dispatch.
use super::update_preparation::{Preparation, SendEvent};
use lui_nsh::{
    app::{ApplicationEvents, ApplicationMutations},
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
    send: SendEvent,
}
impl PartialEq for Installed {
    fn eq(&self, other: &Self) -> bool {
        self.labels == other.labels && Rc::ptr_eq(&self.command, &other.command)
    }
}

/// One application menu owner. Update phases contribute to this same menu;
/// no second controller, worker, menu owner or polling loop is mounted.
#[derive(Clone)]
pub struct ApplicationMenu {
    owner: Owner,
    installed: Signal<Option<Installed>>,
    preparation: Rc<Preparation>,
    updates: UpdateActions,
}
impl ApplicationMenu {
    pub fn mount() -> Self {
        let installed = signal(None::<Installed>);
        let owner = Owner::current();
        let preparing = signal(false);
        let preparation = Rc::new(Preparation::new(move |active| {
            if owner.is_live() {
                preparing.set(active);
            }
        }));
        provide_context(ApplicationMutations::new(move || {
            if preparing.get() {
                Err("application update preparation is active".into())
            } else {
                Ok(())
            }
        }));
        let cleanup_preparation = preparation.clone();
        cleanup(move || cleanup_preparation.close());
        let lifecycle: Rc<dyn UpdateLifecycle> = match use_context::<crate::relaunch::Request>() {
            Some(relaunch) => Rc::new(StandaloneInstallation {
                installed,
                preparation: preparation.clone(),
                relaunch,
            }),
            None => Rc::new(InstallationUnavailable {
                installed,
                preparation: preparation.clone(),
            }),
        };
        let updates = UpdateActions::installed(lifecycle);
        let menu_updates = updates.clone();
        effect(move || {
            if let Some(current) = installed.get() {
                let contribution = menu_updates.menu_items(current.labels.updates.clone());
                let state = PlatformEvent {
                    operation: "application-updater-state".into(),
                    payload: json!({"configured":menu_updates.is_configured(),
                        "busy":menu_updates.is_busy() || preparing.get()})
                    .to_string(),
                };
                if let Err(error) = (current.send)(state) {
                    eprintln!("application updater state: {error}");
                }
                set_application_menu(items(
                    current.labels,
                    os() == Os::MacOs,
                    current.command,
                    contribution,
                    preparing.get(),
                ));
            }
        });
        cleanup(|| set_application_menu(None));
        Self {
            owner: Owner::current(),
            installed,
            preparation,
            updates,
        }
    }
    pub(super) fn preparation_result(&self, payload: &str) -> Result<(), String> {
        self.preparation.response(payload)
    }
    pub(super) fn check_updates(&self, payload: &str) -> Result<(), String> {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct CheckRequest {}
        let _: CheckRequest = serde_json::from_str(payload)
            .map_err(|error| format!("application-update-check: {error}"))?;
        if !self.owner.is_live() || self.preparation.active() {
            return Ok(());
        }
        let current = self
            .installed
            .get_untracked()
            .ok_or("application update requires installed menu labels")?;
        self.updates.check_for_updates(current.labels.updates)?;
        Ok(())
    }
    pub fn install(&self, payload: &str, events: ApplicationEvents) -> Result<(), String> {
        if !self.owner.is_live() {
            return Err("application menu owner is retired".into());
        }
        let labels = Labels::parse(payload)?;
        let owner = self.owner;
        let preparation = self.preparation.clone();
        let send: SendEvent = Rc::new(move |event| events.send(event));
        let command_events = send.clone();
        let command = Rc::new(move |name: &'static str| {
            if !owner.is_live() || preparation.active() {
                return;
            }
            if let Err(error) = command_events(PlatformEvent {
                operation: "application-menu-command".into(),
                payload: json!({"detail":{"command":name}}).to_string(),
            }) {
                eprintln!("application menu {name}: {error}");
            }
        });
        self.installed.set(Some(Installed {
            labels,
            command,
            send,
        }));
        Ok(())
    }
}

// Embedded/default roots have no process owner to restart. Their existing
// save/refusal path releases preparation and waits for its acknowledgement.
struct InstallationUnavailable {
    installed: Signal<Option<Installed>>,
    preparation: Rc<Preparation>,
}
impl UpdateLifecycle for InstallationUnavailable {
    fn prepare(&self) -> InstallPreparation {
        let current = self
            .installed
            .get_untracked()
            .expect("update actions require installed translated menu labels");
        self.preparation.refuse_after_save(
            current.send,
            current.labels.installation_unavailable_description,
        )
    }
}

struct StandaloneInstallation {
    installed: Signal<Option<Installed>>,
    preparation: Rc<Preparation>,
    relaunch: crate::relaunch::Request,
}
impl UpdateLifecycle for StandaloneInstallation {
    fn prepare(&self) -> InstallPreparation {
        let current = self
            .installed
            .get_untracked()
            .expect("standalone update requires installed translated menu labels");
        let relaunch = self.relaunch.clone();
        self.preparation
            .prepare_install(current.send, move || relaunch.schedule())
    }
}

type Command = Rc<dyn Fn(&'static str)>;
fn items(
    labels: Labels,
    mac: bool,
    command: Command,
    mut updates: Vec<MenuItem>,
    preparing: bool,
) -> Vec<MenuItem> {
    if preparing {
        updates = updates
            .into_iter()
            .map(|item| item.disabled(true))
            .collect();
    }
    let role = |role| MenuItem::role(role).disabled(preparing);
    let mut menus = Vec::with_capacity(6);
    if mac {
        let mut application = vec![role(MenuRole::About), MenuItem::separator()];
        if !updates.is_empty() {
            application.append(&mut updates);
            application.push(MenuItem::separator());
        }
        application.extend([
            role(MenuRole::Hide),
            role(MenuRole::HideOthers),
            role(MenuRole::ShowAll),
            MenuItem::separator(),
            role(MenuRole::Quit),
        ]);
        menus.push(MenuItem::submenu("Logseq", application));
    }
    let mut file = vec![role(MenuRole::Close)];
    if !mac {
        if !updates.is_empty() {
            file.push(MenuItem::separator());
            file.append(&mut updates);
        }
        file.extend([MenuItem::separator(), role(MenuRole::Quit)]);
    }
    menus.push(MenuItem::submenu(labels.file, file));
    menus.push(MenuItem::submenu(
        labels.edit,
        [
            role(MenuRole::Undo),
            role(MenuRole::Redo),
            MenuItem::separator(),
            role(MenuRole::Cut),
            role(MenuRole::Copy),
            role(MenuRole::Paste),
            role(MenuRole::SelectAll),
        ],
    ));
    let reload = command.clone();
    let sidebar = command.clone();
    menus.push(MenuItem::submenu(
        labels.view,
        [
            MenuItem::new(labels.reload)
                .disabled(preparing)
                .shortcut("mod+r")
                .on_select(move || reload("reload")),
            role(MenuRole::ToggleFullScreen),
            MenuItem::separator(),
            MenuItem::new(labels.toggle_left_sidebar)
                .disabled(preparing)
                .on_select(move || sidebar("toggle-left-sidebar")),
        ],
    ));
    menus.push(MenuItem::submenu(
        labels.window,
        [role(MenuRole::Minimize), role(MenuRole::Zoom)],
    ));
    menus.push(MenuItem::submenu(
        labels.help,
        [MenuItem::new(labels.documentation)
            .disabled(preparing)
            .on_select(move || command("documentation"))],
    ));
    menus
        .into_iter()
        .map(|menu| menu.disabled(preparing))
        .collect()
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
            false,
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
    #[component]
    fn PreparingMenuFixture() -> impl IntoElement {
        let preparing = signal(false);
        let commands = signal(0_u32);
        effect(move || {
            set_application_menu(items(
                Labels::parse(&labels()).unwrap(),
                false,
                Rc::new(move |_| commands.set(commands.get_untracked() + 1)),
                Vec::new(),
                preparing.get(),
            ));
        });
        for (key, value) in [("f2", true), ("f3", false)] {
            on_key_with(
                key,
                KeyOptions {
                    when: nsh_core::keymap::When::Always,
                    ..Default::default()
                },
                move |_| preparing.set(value),
            );
        }
        cleanup(|| set_application_menu(None));
        text(move || format!("Commands executed:{}", commands.get()))
    }
    #[test]
    fn preparation_disables_actual_global_menu_roles_and_shortcuts_then_restores_them() {
        use nsh_core::{
            Command,
            desktop::{DesktopCommand, MenuItem as NativeMenuItem},
        };
        fn disabled(item: &NativeMenuItem) -> bool {
            match item {
                NativeMenuItem::Separator => true,
                NativeMenuItem::Action(action) => !action.enabled,
                NativeMenuItem::Submenu { enabled, items, .. } => {
                    !enabled && items.iter().all(disabled)
                }
            }
        }
        let mut config = EngineConfig::new(Root::of::<PreparingMenuFixture>());
        config.environment.os = Os::Linux;
        config.environment.idiom = nsh_core::platform::Idiom::Desktop;
        let mut app = Headless::start(config).unwrap();
        app.wait_for("text:Commands executed:0").unwrap();
        app.press_key("ctrl+r").unwrap();
        app.wait_for("text:Commands executed:1").unwrap();
        app.press_key("f2").unwrap();
        let menu = app
            .screen()
            .commands()
            .iter()
            .rev()
            .find_map(|(_, command)| match command {
                Command::Desktop(command) => match &**command {
                    DesktopCommand::SetMenu(Some(items)) => Some(items),
                    _ => None,
                },
                _ => None,
            })
            .expect("actual installed native menu");
        assert!(menu.iter().all(disabled));
        app.press_key("ctrl+r").unwrap();
        app.wait_for("text:Commands executed:1").unwrap();
        app.press_key("f3").unwrap();
        app.press_key("ctrl+r").unwrap();
        app.wait_for("text:Commands executed:2").unwrap();
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
        let preparation = Rc::new(Preparation::new(|_| {}));
        let answer = preparation.clone();
        let lifecycle = InstallationUnavailable {
            installed: signal(Some(Installed {
                labels,
                command: Rc::new(|_| ()),
                send: Rc::new(move |event| {
                    let request: serde_json::Value = serde_json::from_str(&event.payload).unwrap();
                    answer.response(&json!({
                        "id":request["id"],
                        "phase":if event.operation == "update-prepare" { "prepared" } else { "released" },
                        "ok":true,"error":""
                    }).to_string())
                }),
            })),
            preparation,
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
