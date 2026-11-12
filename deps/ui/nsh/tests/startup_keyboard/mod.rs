//! Physical keystrokes through NSH's native keymap into the actual OCaml app.
use super::{Duration, Headless, startup_body, startup_rows::Agent, wait_for_chrome};
use serde_json::Value;
use std::cell::RefCell;

fn any_node(tree: &Value, predicate: impl Fn(&Value) -> bool) -> bool {
    let Some(roots) = tree.get("nodes").and_then(Value::as_array) else {
        return false;
    };
    let mut pending = roots.iter().collect::<Vec<_>>();
    while let Some(node) = pending.pop() {
        if predicate(node) {
            return true;
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            pending.extend(children)
        }
    }
    false
}
fn has_input(tree: &Value) -> bool {
    any_node(tree, |node| {
        node.pointer("/props/style-class")
            .and_then(Value::as_str)
            .is_some_and(|classes| {
                classes
                    .split_whitespace()
                    .any(|name| name == "cp__cmdk-search-input")
            })
    })
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
    for width in [1440_u64, 960] {
        app.press_key("t")?;
        app.press_key("w")?;
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            "native T W updates the retained reading width",
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => any_node(&tree, |node| {
                    node.pointer("/props/style-class").and_then(Value::as_str)
                        == Some("cp__sidebar-main-content")
                        && node.pointer("/props/max-width").and_then(Value::as_u64) == Some(width)
                }),
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    true
                }
            },
        )?;
        if let Some(error) = failure.into_inner() {
            return Err(error);
        }
    }
    app.press_key(&format!("{modifier}+k"))?;
    palette(
        app,
        &agent,
        true,
        "native Search reopens after closed global commands",
    )?;
    if any_node(&agent.tree()?, |node| {
        node.pointer("/props/text").and_then(Value::as_str) == Some("Search only:")
    }) {
        return Err("closed global commands persisted the forced command-palette filter".into());
    }
    app.press_key(&format!("{modifier}+k"))?;
    palette(
        app,
        &agent,
        false,
        "native Search closes without a forced filter",
    )?;
    eprintln!("PASS actual native global keyboard shortcuts, palette toggles and sequences");
    Ok(())
}
