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

#[derive(Debug)]
enum Choice {
    Emoji(String),
    Icon { id: String, name: String },
}
impl Choice {
    fn from_cell(cell: &Value, tab: &str) -> Result<Self, String> {
        if tab == "Emojis" {
            Self::emoji_id(cell)
                .map(Self::Emoji)
                .ok_or("final Emoji cell has no production emoji identity".into())
        } else {
            let id = cell
                .pointer("/props/tooltip")
                .and_then(Value::as_str)
                .ok_or("final Icon cell has no production icon id")?;
            let name =
                Self::icon_name(cell).ok_or("final Icon cell has no production icon reference")?;
            Ok(Self::Icon {
                id: id.into(),
                name,
            })
        }
    }
    fn emoji_id(root: &Value) -> Option<String> {
        let emoji = nodes(root).into_iter().find(|node| {
            node.get("kind").and_then(Value::as_str) == Some("extension:logseq-em-emoji")
        })?;
        let attrs: Value = serde_json::from_str(emoji.pointer("/props/attrs")?.as_str()?).ok()?;
        attrs.get("id")?.as_str().map(str::to_owned)
    }
    fn icon_name(root: &Value) -> Option<String> {
        nodes(root)
            .into_iter()
            .find(|node| node.get("kind").and_then(Value::as_str) == Some("icon"))?
            .pointer("/props/name")?
            .as_str()
            .map(str::to_owned)
    }
    fn kind(&self) -> &str {
        match self {
            Self::Emoji(_) => "emoji",
            Self::Icon { .. } => "tabler-icon",
        }
    }
    fn id(&self) -> &str {
        match self {
            Self::Emoji(id) | Self::Icon { id, .. } => id,
        }
    }
    fn rendered_by(&self, button: &Value) -> bool {
        match self {
            Self::Emoji(id) => Self::emoji_id(button).as_deref() == Some(id.as_str()),
            Self::Icon { name, .. } => {
                Self::icon_name(button).as_deref() == Some(name.as_str())
                    && Self::emoji_id(button).is_none()
            }
        }
    }
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
    eprintln!(
        "BOUND actual {tab} picker: cells={cells}, canonical={}, native={}, viewport={:?}",
        nodes(body).len(),
        app.screen().layout_nodes().len(),
        native.bounds
    );
    Ok(())
}

fn wait_for_edge(
    app: &mut Headless,
    agent: &Agent,
    tab: &str,
    count: u64,
    final_row: bool,
) -> Result<(), String> {
    let failure = RefCell::new(None);
    wait_for_chrome(
        app,
        &format!(
            "{tab} {} source row",
            if final_row { "final" } else { "first" }
        ),
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
                            .is_some_and(|indices| {
                                if final_row {
                                    indices.last() == Some(&(count - 1))
                                } else {
                                    indices.first() == Some(&0)
                                }
                            })
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
    Ok(())
}

fn require_title_action_inside_cell(
    app: &Headless,
    tree: &Value,
    action: &Value,
) -> Result<(), String> {
    let action_id = action
        .get("id")
        .and_then(Value::as_u64)
        .ok_or("title action has no semantic identity")?;
    let layout = app.screen().layout_nodes();
    let native_bounds = |node: &Value| {
        let id = app.screen().id(&selector(node)?)?;
        layout
            .iter()
            .find(|node| node.id == id)
            .map(|node| node.bounds)
            .ok_or_else(|| "title action owner has no native layout".to_owned())
    };
    let action_bounds = native_bounds(action)?;
    for name in ["journal-item", "ls-virt-list"] {
        let owner = nodes(tree)
            .into_iter()
            .find(|node| {
                class(node, name)
                    && nodes(node)
                        .into_iter()
                        .any(|child| child.get("id").and_then(Value::as_u64) == Some(action_id))
            })
            .ok_or_else(|| format!("title action has no {name} owner"))?;
        let bounds = native_bounds(owner)?;
        // The native parent List clips its cells. Overflow visibility on a
        // descendant cannot make an out-of-cell toolbar paint or take input.
        if action_bounds.origin.x.0 < bounds.origin.x.0 - 0.5
            || action_bounds.origin.y.0 < bounds.origin.y.0 - 0.5
            || action_bounds.origin.x.0 + action_bounds.size.width.0
                > bounds.origin.x.0 + bounds.size.width.0 + 0.5
            || action_bounds.origin.y.0 + action_bounds.size.height.0
                > bounds.origin.y.0 + bounds.size.height.0 + 0.5
        {
            return Err(format!(
                "Journal title action {action_bounds:?} escapes {name} {bounds:?}"
            ));
        }
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
    if action
        .pointer("/props/accessibility-label")
        .and_then(Value::as_str)
        == Some("Add icon")
    {
        require_title_action_inside_cell(app, &tree, action)?;
    }
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
        wait_for_edge(app, &agent, tab, count, true)?;
        bounded(app, &agent.tree()?, tab)?;
        // Returning through the same controller exercises cell retirement and
        // rebinding in both directions, rather than only a one-way reveal.
        app.scroll(&scroll, px(-(count as f32 * 44.0 + 408.0)))?;
        wait_for_edge(app, &agent, tab, count, false)?;
        bounded(app, &agent.tree()?, tab)?;
        app.scroll(&scroll, px(count as f32 * 44.0 + 408.0))?;
        wait_for_edge(app, &agent, tab, count, true)?;
        let tree = agent.tree()?;
        bounded(app, &tree, tab)?;
        let body = picker(&tree)?;
        let retired_picker = selector(body)?;
        let last = cells(body, tab)
            .last()
            .copied()
            .ok_or("final picker row has no item")?;
        let expected = Choice::from_cell(last, tab)?;
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
        wait_for_chrome(
            app,
            &format!("{tab} native picker retired after choice"),
            Duration::from_secs(10),
            |screen| {
                !screen
                    .layout_nodes()
                    .into_iter()
                    .any(|node| node.test_id.as_deref() == retired_picker.strip_prefix("id:"))
            },
        )?;
        let failure = RefCell::new(None);
        wait_for_chrome(
            app,
            "chosen Journal icon persisted",
            Duration::from_secs(10),
            |_| match agent.tree() {
                Ok(tree) => nodes(&tree)
                    .into_iter()
                    .any(|node| class(node, "ls-page-icon-btn") && expected.rendered_by(node)),
                Err(error) => {
                    *failure.borrow_mut() = Some(error);
                    true
                }
            },
        )?;
        if let Some(error) = failure.into_inner() {
            return Err(error);
        }
        let persisted = super::startup_rows::persisted_journal_icon()?;
        if persisted.get("kind").and_then(Value::as_str) != Some(expected.kind())
            || persisted.get("id").and_then(Value::as_str) != Some(expected.id())
        {
            return Err(format!(
                "{tab} final source cell {expected:?} persisted as {persisted}"
            ));
        }
        eprintln!(
            "PASS actual complete {tab} picker: {count} rows, finite native Scroll, bounded round-trip cells, exact final item {expected:?} persisted, native picker retired"
        );
    }
    Ok(())
}
