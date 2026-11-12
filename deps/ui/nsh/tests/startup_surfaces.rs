//! Conditional production surfaces mounted by the real compiled OCaml app.
//! This is native-engine contract coverage, not AppKit raster or hardware input.
use super::{Duration, Headless, startup_body, startup_rows::Agent, wait_for_chrome};
use serde_json::{Value, json};
use std::cell::RefCell;

fn healthy(agent: &Agent, step: &str) -> Result<Value, String> {
    let tree = agent.tree().map_err(|error| format!("{step}: {error}"))?;
    eprintln!("PASS actual conditional native surface: {step}");
    Ok(tree)
}

fn settings(app: &mut Headless, agent: &Agent) -> Result<(), String> {
    app.press("role:button[More]")?;
    wait_for_chrome(
        app,
        "Settings menu action",
        Duration::from_secs(10),
        |screen| screen.matches("role:menuitem[Settings]") == Ok(true),
    )?;
    app.press("role:menuitem[Settings]")?;
    wait_for_chrome(
        app,
        "actual Settings dialog",
        Duration::from_secs(10),
        |screen| screen.matches("id:settings") == Ok(true) && screen.shows("Current version"),
    )?;
    healthy(agent, "Settings / General")?;
    // Each press mounts the application's real deferred pane. The recording
    // host cannot admit a URL/style that the real NSH renderer rejects here.
    for (id, expected) in [
        ("editor", "Preferred date format"),
        ("keymap", "All"),
        ("advanced", "Developer mode"),
        ("features", "Plugins"),
        ("general", "Current version"),
    ] {
        app.press(&format!("id:{id}"))?;
        wait_for_chrome(
            app,
            &format!("Settings / {id}"),
            Duration::from_secs(10),
            |screen| screen.shows(expected),
        )?;
        healthy(agent, &format!("Settings / {id}"))?;
        if id == "advanced" {
            app.press("role:button[Logseq Sync]")?;
            wait_for_chrome(
                app,
                "nested sync URL editor",
                Duration::from_secs(10),
                |screen| screen.matches("id:sync-server-input") == Ok(true),
            )?;
            healthy(agent, "Settings / Advanced / sync URL dialog")?;
            app.press_key("escape")?;
            wait_for_chrome(
                app,
                "nested URL dialog dismissed",
                Duration::from_secs(10),
                |screen| {
                    screen.count("id:sync-server-input") == Ok(0)
                        && screen.matches("id:settings") == Ok(true)
                },
            )?;
            healthy(agent, "Settings parent retained after nested dialog")?;
        }
    }
    app.press_key("escape")?;
    wait_for_chrome(app, "Settings closed", Duration::from_secs(10), |screen| {
        screen.count("id:settings") == Ok(0) && startup_body::ready(screen)
    })?;
    healthy(agent, "Settings closed")?;
    Ok(())
}

fn input_selector(tree: &Value) -> Result<String, String> {
    let roots = tree
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or("actual search tree is missing nodes")?;
    let mut pending = roots.iter().collect::<Vec<_>>();
    let mut found = None;
    while let Some(node) = pending.pop() {
        let classes = node
            .pointer("/props/style-class")
            .and_then(Value::as_str)
            .unwrap_or("");
        if classes
            .split_whitespace()
            .any(|class| class == "cp__cmdk-search-input")
        {
            let id = node
                .get("id")
                .and_then(Value::as_u64)
                .ok_or("search input has no id")?;
            if found.replace(format!("id:lui-{id}")).is_some() {
                return Err("actual search has more than one input owner".into());
            }
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            pending.extend(children);
        }
    }
    found.ok_or("actual search input is missing".into())
}

fn search_and_commands(app: &mut Headless, agent: &Agent) -> Result<(), String> {
    app.press("role:button[Search]")?;
    let selected = RefCell::new(None::<String>);
    let failure = RefCell::new(None::<String>);
    let last_candidates = RefCell::new(String::new());
    let wait = wait_for_chrome(
        app,
        "actual positive native search input",
        Duration::from_secs(10),
        |screen| {
            let tree = match agent.tree() {
                Ok(tree) => tree,
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    return true;
                }
            };
            let selector = match input_selector(&tree) {
                Ok(selector) => selector,
                Err(error) => {
                    *last_candidates.borrow_mut() = error;
                    return false;
                }
            };
            let nodes = screen.layout_nodes();
            let native = nodes
                .iter()
                .find(|node| node.test_id.as_deref() == selector.strip_prefix("id:"));
            *last_candidates.borrow_mut() = format!(
                "canonical input={selector}; native={native:#?}; input kinds={:#?}",
                nodes
                    .iter()
                    .filter(|node| node.kind == nsh_core::ViewKind::Input)
                    .collect::<Vec<_>>()
            );
            if native.is_some_and(|node| {
                !node.hidden && node.bounds.size.width.0 > 0.0 && node.bounds.size.height.0 > 0.0
            }) {
                *selected.borrow_mut() = Some(selector);
                true
            } else {
                false
            }
        },
    );
    if let Some(error) = failure.into_inner() {
        return Err(format!("Search input agent barrier: {error}"));
    }
    wait.map_err(|error| format!("{error}\n{}", last_candidates.into_inner()))?;
    let selector = selected
        .into_inner()
        .ok_or("positive native search input was not captured")?;
    healthy(agent, "Search opened")?;
    app.type_text(&selector, "/")?;
    wait_for_chrome(
        app,
        "actual search filters",
        Duration::from_secs(10),
        |screen| screen.shows("Search only commands"),
    )?;
    healthy(agent, "Search filter list")?;
    app.press("text:Search only commands")?;
    wait_for_chrome(
        app,
        "actual Commands result group",
        Duration::from_secs(10),
        |screen| screen.shows("Commands"),
    )?;
    healthy(agent, "Commands filter")?;
    app.press_key("escape")?;
    // Escape first clears a forced filter; a second Escape closes the palette.
    if input_selector(&agent.tree()?).is_ok() {
        app.press_key("escape")?;
    }
    let failure = RefCell::new(None::<String>);
    wait_for_chrome(
        app,
        "Search dismissed",
        Duration::from_secs(10),
        |screen| match agent.tree() {
            Ok(tree) => input_selector(&tree).is_err() && startup_body::ready(screen),
            Err(error) => {
                *failure.borrow_mut() = Some(error);
                true
            }
        },
    )?;
    if let Some(error) = failure.into_inner() {
        return Err(format!("Search dismissal agent barrier: {error}"));
    }
    healthy(agent, "Search dismissed")?;
    Ok(())
}

fn sidebar_and_pages(app: &mut Headless, agent: &Agent) -> Result<(), String> {
    app.press("role:button[Toggle right sidebar]")?;
    wait_for_chrome(
        app,
        "actual right sidebar contents",
        Duration::from_secs(10),
        |screen| screen.matches("id:right-sidebar-container") == Ok(true),
    )?;
    healthy(agent, "Right sidebar opened")?;
    app.press("role:button[Toggle right sidebar]")?;
    wait_for_chrome(
        app,
        "right sidebar dismissed",
        Duration::from_secs(10),
        |screen| screen.count("id:right-sidebar-container") == Ok(0),
    )?;
    healthy(agent, "Right sidebar closed")?;
    app.press("text:Pages")?;
    wait_for_chrome(
        app,
        "actual Pages view",
        Duration::from_secs(20),
        |screen| screen.shows("All"),
    )?;
    healthy(agent, "Pages route")?;
    app.press("text:Journals")?;
    wait_for_chrome(
        app,
        "Journals restored",
        Duration::from_secs(20),
        startup_body::ready,
    )?;
    healthy(agent, "Journals restored after Pages")?;
    Ok(())
}

pub(super) fn qualify(app: &mut Headless) -> Result<(), String> {
    let agent = Agent::discover()?;
    healthy(&agent, "conditional surface entry")?;
    settings(app, &agent)?;
    search_and_commands(app, &agent)?;
    sidebar_and_pages(app, &agent)?;
    Ok(())
}

/// Separate owned children let one failed renderer reveal every independent
/// deferred body in the same publication attempt, rather than masking the rest.
pub(super) const CASE_ENV: &str = "LOGSEQ_NSH_CONDITIONAL_SURFACE";
pub(super) const DIALOG_CASES: &[&str] = &[
    "new-graph",
    "login",
    "import",
    "export",
    "sync-server",
    "publish-server",
    "graph-open",
    "graph-remove",
    "plugins",
    "quick-add",
    "rtc-collaborators",
];

fn selector_for_class(tree: &Value, class: &str) -> Result<String, String> {
    let mut pending = tree
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or("conditional tree has no nodes")?
        .iter()
        .collect::<Vec<_>>();
    let mut found = None;
    while let Some(node) = pending.pop() {
        if node
            .pointer("/props/style-class")
            .and_then(Value::as_str)
            .is_some_and(|classes| classes.split_whitespace().any(|word| word == class))
        {
            let id = node
                .get("id")
                .and_then(Value::as_u64)
                .ok_or("conditional node has no id")?;
            let identifier = node
                .pointer("/props/accessibility-identifier")
                .and_then(Value::as_str)
                .filter(|value| !value.is_empty())
                .map(str::to_owned)
                .unwrap_or_else(|| format!("lui-{id}"));
            if found.replace(format!("id:{identifier}")).is_some() {
                return Err(format!("conditional class {class} has multiple owners"));
            }
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            pending.extend(children);
        }
    }
    found.ok_or_else(|| format!("conditional class {class} is not mounted"))
}

pub(super) fn qualify_dialog(app: &mut Headless, name: &str) -> Result<(), String> {
    if !DIALOG_CASES.contains(&name) {
        return Err(format!("unknown conditional native dialog {name}"));
    }
    let agent = Agent::discover()?;
    // Existing document-event carrier and business entry: no production-only
    // testing endpoint or hand-built substitute for Dialogs_view is added.
    agent.document("ls:open-dialog", json!({"detail":{"name":name}}))?;
    let class = format!("ls-dialog-{name}");
    let failure = RefCell::new(None::<String>);
    let last = RefCell::new(String::new());
    let result = wait_for_chrome(
        app,
        &format!("native dialog {name}"),
        Duration::from_secs(20),
        |screen| {
            let tree = match agent.tree() {
                Ok(tree) => tree,
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    return true;
                }
            };
            let selector = match selector_for_class(&tree, &class) {
                Ok(selector) => selector,
                Err(error) => {
                    *last.borrow_mut() = error;
                    return false;
                }
            };
            let native = screen
                .layout_nodes()
                .into_iter()
                .find(|node| node.test_id.as_deref() == selector.strip_prefix("id:"));
            *last.borrow_mut() = format!("{selector}: {native:#?}");
            native.is_some_and(|node| {
                !node.hidden
                    && node.bounds.size.width.0 > 0.0
                    && node.bounds.size.height.0 > 0.0
                    && node.bounds.origin.x.0 < 1440.0
                    && node.bounds.origin.y.0 < 900.0
                    && node.bounds.origin.x.0 + node.bounds.size.width.0 > 0.0
                    && node.bounds.origin.y.0 + node.bounds.size.height.0 > 0.0
            })
        },
    );
    if let Some(error) = failure.into_inner() {
        return Err(format!("dialog {name}: {error}"));
    }
    result.map_err(|error| format!("{error}\n{}", last.into_inner()))?;
    healthy(&agent, &format!("dialog {name} native mount"))?;
    agent.document("ls:close-dialog", json!({}))?;
    let tree = healthy(&agent, &format!("dialog {name} closed"))?;
    if selector_for_class(&tree, &class).is_ok() {
        return Err(format!("dialog {name} retained its open model after close"));
    }
    Ok(())
}
