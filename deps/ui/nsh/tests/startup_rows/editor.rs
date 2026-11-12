//! Actual compiled OCaml view -> native pointer -> native Input -> edited view.
use super::*;
use std::cell::RefCell;

pub(super) fn qualify(app: &mut Headless, agent: &Agent) -> Result<(), String> {
    let uuid = uuid(0);
    let content = format!("id:block-content-{uuid}");
    let node = app
        .screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some(format!("block-content-{uuid}").as_str()))
        .ok_or("first actual block has no native content target")?;
    // Click trailing content space: native text hit testing must clamp to the
    // source end, then the shared pending-focus gate must release before typing.
    app.press_at(&content, point(px(node.bounds.size.width.0 - 2.0), px(8.0)))?;
    let sink = RefCell::new(None);
    wait_for_chrome(
        app,
        "actual clicked block editor and source caret",
        Duration::from_secs(20),
        |screen| {
            let Ok(tree) = agent.tree() else { return false };
            let Some(roots) = tree.get("nodes").and_then(Value::as_array) else {
                return false;
            };
            let mut pending = roots.iter().collect::<Vec<_>>();
            while let Some(node) = pending.pop() {
                if node.get("kind").and_then(Value::as_str) == Some("extension:logseq-editor")
                    && node.pointer("/props/block-id").and_then(Value::as_str)
                        == Some(uuid.as_str())
                {
                    let Some(id) = node.get("id").and_then(Value::as_u64) else {
                        return false;
                    };
                    let selector = format!("id:lui-{id}");
                    if screen.input_text(&selector).ok().flatten() == Some(title(0).as_str()) {
                        *sink.borrow_mut() = Some(selector);
                        return true;
                    }
                }
                if let Some(children) = node.get("children").and_then(Value::as_array) {
                    pending.extend(children);
                }
            }
            false
        },
    )?;
    // press_key uses the focus acquired from that actual content click. It does
    // not focus the input or move its selection as a test-only setup step.
    app.press_key("z")?;
    wait_for_chrome(
        app,
        "native key reaches the shared edited block",
        Duration::from_secs(20),
        |screen| screen.shows(&format!("{}z", title(0))),
    )?;
    let selector = sink
        .into_inner()
        .ok_or("clicked editor input was not captured")?;
    if app
        .screen()
        .input_text(&selector)?
        .is_none_or(|source| source != format!("{}z", title(0)))
    {
        return Err("native Input and shared rendered source disagree after click typing".into());
    }
    // Restore the fixture through the same native editing path before exiting,
    // so the existing production row/memory qualification keeps its seed data.
    app.press_key("backspace")?;
    wait_for_chrome(
        app,
        "native delete restores the shared source",
        Duration::from_secs(20),
        |screen| screen.input_text(&selector).ok().flatten() == Some(title(0).as_str()),
    )?;
    app.press_key("escape")?;
    wait_for_chrome(
        app,
        "typed block returns to display mode",
        Duration::from_secs(20),
        |screen| {
            screen.layout_nodes().iter().any(|node| {
                node.test_id.as_deref() == Some(format!("block-content-{uuid}").as_str())
            })
        },
    )?;
    Ok(())
}
