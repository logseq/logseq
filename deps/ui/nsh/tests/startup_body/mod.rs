//! Positive journal-body evidence from public native layout, without model access.
use nsh_core::{
    NodeId,
    geometry::{Bounds, Size, point, px},
};
use nsh_testing::{LayoutNode, Screen};
use std::collections::{BTreeMap, BTreeSet};

fn text(node: &LayoutNode) -> Option<&str> {
    node.text.as_ref().map(|text| text.text.text.as_str())
}
fn measurable(node: &LayoutNode) -> bool {
    !node.hidden
        && [
            node.bounds.origin.x.0,
            node.bounds.origin.y.0,
            node.bounds.size.width.0,
            node.bounds.size.height.0,
        ]
        .iter()
        .all(|v| v.is_finite())
        && node.bounds.size.width.0 > 0.0
        && node.bounds.size.height.0 > 0.0
}
fn descendant(mut node: NodeId, ancestor: NodeId, nodes: &BTreeMap<NodeId, &LayoutNode>) -> bool {
    for _ in 0..nodes.len() {
        if node == ancestor {
            return true;
        }
        let Some(current) = nodes.get(&node) else {
            return false;
        };
        node = current.parent;
    }
    false
}
// Dates.journal_title_of emits a plain title in this shape. Do not hardcode
// today's day/year or introduce a competing timezone/calendar implementation.
fn dated_title(value: &str) -> bool {
    let Some((date, year)) = value.trim().split_once(", ") else {
        return false;
    };
    if year.len() != 4 || !year.bytes().all(|byte| byte.is_ascii_digit()) {
        return false;
    }
    let Some((month, ordinal)) = date.split_once(' ') else {
        return false;
    };
    if !matches!(
        month,
        "Jan"
            | "Feb"
            | "Mar"
            | "Apr"
            | "May"
            | "Jun"
            | "Jul"
            | "Aug"
            | "Sep"
            | "Oct"
            | "Nov"
            | "Dec"
    ) {
        return false;
    }
    ["st", "nd", "rd", "th"].into_iter().any(|suffix| {
        ordinal
            .strip_suffix(suffix)
            .and_then(|day| day.parse::<u8>().ok())
            .is_some_and(|day| (1..=31).contains(&day))
    })
}
fn ready_layout(nodes: &[LayoutNode], shown: impl Fn(&str) -> bool) -> bool {
    let named = |identifier| {
        nodes
            .iter()
            .find(|node| node.test_id.as_deref() == Some(identifier))
    };
    let Some(space) = named("nsh-right-split-space").filter(|node| measurable(node)) else {
        return false;
    };
    let Some(main) =
        named("main-content-container").filter(|node| measurable(node) && node.scroll.is_some())
    else {
        return false;
    };
    let Some(journals) = named("journals").filter(|node| measurable(node)) else {
        return false;
    };
    let index = nodes
        .iter()
        .map(|node| (node.id, node))
        .collect::<BTreeMap<_, _>>();
    if !descendant(main.id, space.id, &index) || !descendant(journals.id, main.id, &index) {
        return false;
    }
    let viewport = Bounds::new(point(px(0.0), px(0.0)), Size::new(px(1440.0), px(900.0)));
    if !space.bounds.intersects(&viewport) || !main.bounds.intersects(&viewport) {
        return false;
    }
    nodes.iter().any(|node| {
        measurable(node)
            && descendant(node.id, journals.id, &index)
            && node.text.as_ref().is_some_and(|text| {
                let value = text.text.text.trim();
                text.content.size.width.0 > 0.0
                    && text.content.size.height.0 > 0.0
                    && text.content.intersects(&main.bounds)
                    && text.content.intersects(&viewport)
                    && dated_title(value)
                    && shown(value)
            })
    })
}
pub fn ready(screen: &Screen) -> bool {
    ready_layout(&screen.layout_nodes(), |value| screen.shows(value))
}
fn describe(node: &LayoutNode) -> String {
    let text = text(node).map(|value| value.chars().take(120).collect::<String>());
    format!(
        "id={} parent={} test={:?} bounds={:?} hidden={} clips={} scroll={} text={text:?}",
        node.id,
        node.parent,
        node.test_id,
        node.bounds,
        node.hidden,
        node.clips,
        node.scroll.is_some()
    )
}
pub fn diagnostic(screen: &Screen) -> String {
    let nodes = screen.layout_nodes();
    let mut selected = nodes
        .iter()
        .filter(|node| {
            node.test_id.as_deref().is_some_and(|id| {
                id.contains("-split-pane-")
                    || matches!(
                        id,
                        "app-container-wrapper"
                            | "app-container"
                            | "head"
                            | "left-container"
                            | "main-content-container"
                            | "nsh-right-split-space"
                            | "journals"
                            | "today-queries"
                            | "lui-backend-error"
                    )
            })
        })
        .map(|node| node.id)
        .collect::<BTreeSet<_>>();
    // Public layout lists parents first. Include group/slot bounds around the
    // selected native panels without dumping the whole application tree.
    for _ in 0..2 {
        let parents = nodes
            .iter()
            .filter(|node| selected.contains(&node.id))
            .map(|node| node.parent)
            .collect::<Vec<_>>();
        selected.extend(parents);
    }
    let containers = nodes
        .iter()
        .filter(|node| selected.contains(&node.id))
        .take(32)
        .map(describe)
        .collect::<Vec<_>>();
    let dated = nodes
        .iter()
        .filter(|node| text(node).is_some_and(dated_title));
    let other_text = nodes.iter().filter(|node| {
        text(node).is_some_and(|text| !text.trim().is_empty() && !dated_title(text))
    });
    let texts = dated
        .chain(other_text)
        .take(16)
        .map(describe)
        .collect::<Vec<_>>();
    format!(
        "Native main/split layout (max32): {containers:#?}\nNative nonempty text layout (max16): {texts:#?}"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    fn nodes() -> Vec<LayoutNode> {
        let mut result = Vec::new();
        for (id, parent, identifier, x, y, width, height) in [
            (1, 0, "nsh-right-split-space", 0.0, 48.0, 1440.0, 852.0),
            (2, 1, "main-content-container", 246.0, 48.0, 1194.0, 852.0),
            (3, 2, "journals", 270.0, 80.0, 960.0, 600.0),
            (4, 3, "journal-title", 270.0, 80.0, 700.0, 44.0),
        ] {
            let mut node = LayoutNode::default();
            node.id = id;
            node.parent = parent;
            node.test_id = Some(identifier.into());
            node.bounds = Bounds::new(point(px(x), px(y)), Size::new(px(width), px(height)));
            result.push(node);
        }
        result[1].scroll = Some(nsh_testing::LayoutScroll::default());
        let mut text = nsh_testing::LayoutText::default();
        text.content = result[3].bounds;
        text.text = std::sync::Arc::new(nsh_core::AttributedText {
            text: "Nov 12th, 2026".into(),
            ..Default::default()
        });
        result[3].text = Some(text);
        result
    }
    #[test]
    fn body_requires_visible_dated_content_inside_measured_main_journals() {
        let valid = nodes();
        assert!(ready_layout(&valid, |_| true));
        assert!(!ready_layout(&valid, |_| false));
        let mut outside = nodes();
        outside[3].parent = 1;
        assert!(
            !ready_layout(&outside, |_| true),
            "sidebar/overlay text cannot qualify the body"
        );
        let mut collapsed = nodes();
        collapsed[1].bounds.size.width = px(0.0);
        assert!(!ready_layout(&collapsed, |_| true));
        let mut hidden = nodes();
        hidden[2].hidden = true;
        assert!(!ready_layout(&hidden, |_| true));
        let mut below_viewport = nodes();
        below_viewport[3].text.as_mut().unwrap().content.origin.y = px(950.0);
        assert!(!ready_layout(&below_viewport, |_| true));
        assert!(
            !ready_layout(&valid[..3], |_| true),
            "mounted empty containers cannot qualify the body"
        );
    }
    #[test]
    fn sidebar_labels_and_empty_or_invalid_dates_do_not_count_as_journal_titles() {
        for text in [
            "Demo",
            "Journals",
            "",
            "Nov 99th, 2026",
            "Nov 12th, unknown",
        ] {
            assert!(!dated_title(text));
        }
        for text in [
            "Jan 1st, 2027",
            "Mar 2nd, 2026",
            "Jul 3rd, 2026",
            "Nov 12th, 2026",
        ] {
            assert!(dated_title(text));
        }
    }
}
