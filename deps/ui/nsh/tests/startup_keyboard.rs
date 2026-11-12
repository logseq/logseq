//! Physical keystrokes through NSH's native keymap into the actual OCaml app.
use super::{Duration, Headless, startup_body, startup_rows::Agent, wait_for_chrome};
use serde_json::Value;
use std::cell::RefCell;

fn has_input(tree: &Value) -> bool {
    let Some(roots) = tree.get("nodes").and_then(Value::as_array) else {
        return false;
    };
    let mut pending = roots.iter().collect::<Vec<_>>();
    while let Some(node) = pending.pop() {
        if node
            .pointer("/props/style-class")
            .and_then(Value::as_str)
            .is_some_and(|classes| {
                classes
                    .split_whitespace()
                    .any(|name| name == "cp__cmdk-search-input")
            })
        {
            return true;
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            pending.extend(children)
        }
    }
    false
}
fn palette(app: &mut Headless, agent: &Agent, open: bool, step: &str) -> Result<(), String> {
    let failure = RefCell::new(None);
    wait_for_chrome(app, step, Duration::from_secs(10), |screen| {
        match agent.tree() {
            Ok(tree) => has_input(&tree) == open && (open || startup_body::ready(screen)),
            Err(error) => {
                *failure.borrow_mut() = Some(error);
                true
            }
        }
    })?;
    match failure.into_inner() {
        Some(error) => Err(format!("{step}: {error}")),
        None => Ok(()),
    }
}
pub(super) fn qualify(app: &mut Headless) -> Result<(), String> {
    let agent = Agent::discover()?;
    let modifier = if cfg!(target_os = "macos") {
        "meta"
    } else {
        "ctrl"
    };
    app.press_key(&format!("{modifier}+k"))?;
    palette(app, &agent, true, "native Cmd/Ctrl+K opens Search")?;
    app.press_key(&format!("{modifier}+k"))?;
    palette(app, &agent, false, "native Cmd/Ctrl+K closes Search")?;
    app.press_key(&format!("{modifier}+shift+p"))?;
    palette(app, &agent, true, "native command-palette shortcut")?;
    app.press_key(&format!("{modifier}+shift+p"))?;
    palette(
        app,
        &agent,
        false,
        "native command-palette shortcut toggles closed",
    )?;
    for closed in [true, false] {
        app.press_key("t")?;
        app.press_key("l")?;
        wait_for_chrome(
            app,
            "native T L sequence",
            Duration::from_secs(10),
            |screen| {
                (screen.count("id:left-sidebar") == Ok(0)) == closed && startup_body::ready(screen)
            },
        )?;
        agent.tree()?;
    }
    for open in [true, false] {
        app.press_key("t")?;
        app.press_key("r")?;
        wait_for_chrome(
            app,
            "native T R sequence",
            Duration::from_secs(10),
            |screen| {
                (screen
                    .count("id:right-sidebar-container")
                    .is_ok_and(|count| count > 0))
                    == open
            },
        )?;
        agent.tree()?;
    }
    eprintln!("PASS actual native global keyboard shortcuts, palette toggles and sequences");
    Ok(())
}
