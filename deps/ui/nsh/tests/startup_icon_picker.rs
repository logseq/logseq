//! Complete production picker datasets, driven by actual native Scroll demand.
//! These are native-engine checks; AppKit raster/input qualification is separate.
use super::{Duration, Headless, startup_rows::Agent, wait_for_chrome};
use nsh_core::prelude::px;
use serde_json::Value;
use std::cell::RefCell;

fn nodes(root: &Value) -> Vec<&Value> {
    let mut pending = vec![root];
    let mut all = Vec::new();
    while let Some(node) = pending.pop() {
        all.push(node);
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            pending.extend(children.iter().rev());
        }
        if let Some(children) = node.get("nodes").and_then(Value::as_array) {
            pending.extend(children.iter().rev());
        }
    }
    all
}

fn class(node: &Value, name: &str) -> bool {
    node.pointer("/props/style-class")
        .and_then(Value::as_str)
        .is_some_and(|value| value.split_whitespace().any(|value| value == name))
}

fn selector(node: &Value) -> Result<String, String> {
    let id = node
        .get("id")
        .and_then(Value::as_u64)
        .ok_or("picker node has no id")?;
    Ok(format!(
        "id:{}",
        node.pointer("/props/accessibility-identifier")
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
            .unwrap_or_else(|| format!("lui-{id}"))
    ))
}

fn picker(tree: &Value) -> Result<&Value, String> {
    nodes(tree)
        .into_iter()
        .find(|node| class(node, "cp__emoji-icon-picker"))
        .ok_or("actual picker is not mounted".into())
}

fn cells<'a>(root: &'a Value, tab: &str) -> Vec<&'a Value> {
    let name = if tab == "Emojis" {
        "ls-emoji-preview"
    } else {
        "ls-emoji-cell"
    };
    nodes(root)
        .into_iter()
        .filter(|node| class(node, name))
        .collect()
}

fn bounded(app: &Headless, tree: &Value, tab: &str) -> Result<(), String> {
    let body = picker(tree)?;
    let cells = cells(body, tab).len();
    if cells > 180 || nodes(body).len() > 2_000 || app.screen().layout_nodes().len() > 12_000 {
        return Err(format!(
            "{tab} materialized source-sized picker: cells={cells}, canonical={}, native={}",
            nodes(body).len(),
            app.screen().layout_nodes().len()
        ));
    }
    let scroll = nodes(body)
        .into_iter()
        .find(|node| {
            node.pointer("/props/style-class")
                .and_then(Value::as_str)
                .is_some_and(|value| value.split_whitespace().any(|value| value == "bd"))
        })
        .ok_or("picker has no real body Scroll")?;
    let id = selector(scroll)?;
    let native = app
        .screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == id.strip_prefix("id:"))
        .ok_or("picker body Scroll has no native layout")?;
    if native.hidden
        || native.bounds.size.width.0 <= 0.0
        || native.bounds.size.height.0 <= 0.0
        || native.bounds.size.height.0 > 408.0
    {
        return Err(format!("{tab} has no finite picker viewport: {native:#?}"));
    }
    Ok(())
}

fn open(app: &mut Headless, agent: &Agent) -> Result<(), String> {
    let tree = agent.tree()?;
    // The fresh Journal exposes Add icon on title hover. Once a choice has
    // been persisted, the same page exposes its normal icon edit button.
    let action = nodes(&tree)
        .into_iter()
        .find(|node| class(node, "ls-page-icon-btn"))
        .or_else(|| {
            nodes(&tree).into_iter().find(|node| {
                node.pointer("/props/accessibility-label")
                    .and_then(Value::as_str)
                    == Some("Add icon")
                    && node
                        .pointer("/props/press-enabled")
                        .and_then(Value::as_bool)
                        == Some(true)
            })
        })
        .ok_or("actual Journal has no icon action")?;
    let action = selector(action)?;
    eprintln!("BEGIN actual picker icon action: {action}");
    app.hover(&action)?;
    app.press(&action)?;
    eprintln!("DONE actual picker icon action");
    let failure = RefCell::new(None);
    wait_for_chrome(
        app,
        "actual Journal icon picker",
        Duration::from_secs(10),
        |_| match agent.tree() {
            Ok(tree) => picker(&tree).is_ok(),
            Err(error) => {
                *failure.borrow_mut() = Some(error);
                true
            }
        },
    )?;
    if let Some(error) = failure.into_inner() {
        return Err(error);
    }
    Ok(())
}

pub(super) fn qualify(app: &mut Headless) -> Result<(), String> {
    let agent = Agent::discover()?;
    for (tab, minimum_rows) in [("Emojis", 100), ("Icons", 500)] {
        open(app, &agent)?;
        eprintln!("BEGIN actual complete {tab} tab activation");
        app.press(tab)?;
        eprintln!("DONE actual complete {tab} tab activation");
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            &format!("complete {tab} picker demand"),
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => picker(&tree).is_ok_and(|body| {
                    nodes(body).into_iter().any(|node| {
                        node.pointer("/props/virtual-total-count")
                            .and_then(Value::as_u64)
                            .is_some_and(|count| count >= minimum_rows)
                    })
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
        let tree = agent.tree()?;
        bounded(app, &tree, tab)?;
        let body = picker(&tree)?;
        let list = nodes(body)
            .into_iter()
            .find(|node| {
                node.pointer("/props/virtual-total-count")
                    .and_then(Value::as_u64)
                    .is_some_and(|count| count >= minimum_rows)
            })
            .ok_or("complete dataset has no native row source")?;
        let count = list
            .pointer("/props/virtual-total-count")
            .and_then(Value::as_u64)
            .unwrap();
        let scroll = nodes(body)
            .into_iter()
            .find(|node| class(node, "bd"))
            .ok_or("picker lost its body Scroll")?;
        let scroll = selector(scroll)?;
        // The public Scroll step clamps its target to the native content end
        // before advancing frames. A raw million-point drag would generate
        // 100,000 gesture frames, even after reaching that end. This case uses
        // a manual engine clock; no synthetic VirtualWindow is sent.
        eprintln!("BEGIN actual complete {tab} Scroll: rows={count}, owner={scroll}");
        app.scroll(&scroll, px(count as f32 * 44.0 + 408.0))?;
        eprintln!("DONE actual complete {tab} Scroll");
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            &format!("{tab} final source row"),
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => picker(&tree).is_ok_and(|body| {
                    nodes(body).into_iter().any(|node| {
                        node.pointer("/props/virtual-total-count")
                            .and_then(Value::as_u64)
                            == Some(count)
                            && node
                                .pointer("/props/virtual-indices")
                                .and_then(Value::as_str)
                                .and_then(|encoded| serde_json::from_str::<Vec<u64>>(encoded).ok())
                                .is_some_and(|indices| indices.last() == Some(&(count - 1)))
                    })
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
        let tree = agent.tree()?;
        bounded(app, &tree, tab)?;
        let body = picker(&tree)?;
        let last = cells(body, tab)
            .last()
            .copied()
            .ok_or("final picker row has no item")?;
        let last = selector(last)?;
        app.press(&last)?;
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            &format!("{tab} final item choice closes picker"),
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => picker(&tree).is_err(),
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    true
                }
            },
        )?;
        if let Some(error) = failure.into_inner() {
            return Err(error);
        }
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            "chosen Journal icon persisted",
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => nodes(&tree)
                    .into_iter()
                    .any(|node| class(node, "ls-page-icon-btn")),
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    true
                }
            },
        )?;
        if let Some(error) = failure.into_inner() {
            return Err(error);
        }
        eprintln!(
            "PASS actual complete {tab} picker: {count} rows, finite native Scroll, bounded cells, final item chosen and persisted"
        );
    }
    Ok(())
}
