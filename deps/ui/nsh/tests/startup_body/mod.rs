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
fn identity_layout(nodes: &[LayoutNode], shown: impl Fn(&str) -> bool) -> Option<(NodeId, NodeId)> {
    let named = |identifier| {
        nodes
            .iter()
            .find(|node| node.test_id.as_deref() == Some(identifier))
    };
    let space = named("nsh-right-split-space").filter(|node| measurable(node))?;
    let main =
        named("main-content-container").filter(|node| measurable(node) && node.scroll.is_some())?;
    let journals = named("journals").filter(|node| measurable(node))?;
    let index = nodes
        .iter()
        .map(|node| (node.id, node))
        .collect::<BTreeMap<_, _>>();
    if !descendant(main.id, space.id, &index) || !descendant(journals.id, main.id, &index) {
        return None;
    }
    let viewport = Bounds::new(point(px(0.0), px(0.0)), Size::new(px(1440.0), px(900.0)));
    if !space.bounds.intersects(&viewport) || !main.bounds.intersects(&viewport) {
        return None;
    }
    nodes
        .iter()
        .find(|node| {
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
        .map(|_| (main.id, journals.id))
}
fn ready_layout(nodes: &[LayoutNode], shown: impl Fn(&str) -> bool) -> bool {
    identity_layout(nodes, shown).is_some()
}
pub fn ready(screen: &Screen) -> bool {
    ready_layout(&screen.layout_nodes(), |value| screen.shows(value))
}
pub fn identity(screen: &Screen) -> Option<(NodeId, NodeId)> {
    identity_layout(&screen.layout_nodes(), |value| screen.shows(value))
}
fn is_pane(node: &LayoutNode) -> bool {
    node.test_id
        .as_deref()
        .is_some_and(|id| id.contains("-split-pane-"))
}
fn sidebar_layout(nodes: &[LayoutNode]) -> bool {
    let Some(sidebar) = nodes
        .iter()
        .find(|node| node.test_id.as_deref() == Some("left-sidebar") && measurable(node))
    else {
        return false;
    };
    let index = nodes
        .iter()
        .map(|node| (node.id, node))
        .collect::<BTreeMap<_, _>>();
    let mut parent = sidebar.parent;
    let mut pane = None;
    for _ in 0..nodes.len() {
        let Some(node) = index.get(&parent) else {
            break;
        };
        if is_pane(node) {
            pane = Some(*node);
            break;
        }
        parent = node.parent;
    }
    let Some(pane) = pane.filter(|node| measurable(node)) else {
        return false;
    };
    // One point tolerates independently snapped native edges, without
    // accepting a viewport-sized child overflowing its actual sidebar track.
    let matches = [
        (sidebar.bounds.origin.x.0, pane.bounds.origin.x.0),
        (sidebar.bounds.origin.y.0, pane.bounds.origin.y.0),
        (sidebar.bounds.size.width.0, pane.bounds.size.width.0),
        (sidebar.bounds.size.height.0, pane.bounds.size.height.0),
    ]
    .iter()
    .all(|(actual, expected)| (actual - expected).abs() <= 1.0);
    matches
        && !nodes
            .iter()
            .any(|node| is_pane(node) && descendant(node.id, sidebar.id, &index))
}
pub fn sidebar_ready(screen: &Screen) -> bool {
    sidebar_layout(&screen.layout_nodes())
}
pub fn window_width(screen: &Screen, width: f32) -> bool {
    screen.layout_nodes().iter().any(|node| {
        node.test_id.as_deref() == Some("app-container-wrapper")
            && measurable(node)
            && (node.bounds.size.width.0 - width).abs() <= 1.0
    })
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
        assert_eq!(identity_layout(&valid, |_| true), Some((2, 3)));
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
    #[test]
    fn sidebar_fills_its_single_native_pane_without_nested_resize_owners() {
        let mut valid = nodes();
        for (id, parent, identifier) in [(5, 1, "lui-10-split-pane-11"), (6, 5, "left-sidebar")] {
            let mut node = LayoutNode::default();
            node.id = id;
            node.parent = parent;
            node.test_id = Some(identifier.into());
            node.bounds = Bounds::new(point(px(0.0), px(48.0)), Size::new(px(246.0), px(852.0)));
            valid.push(node);
        }
        assert!(sidebar_layout(&valid));
        let mut overflow = valid.clone();
        overflow[5].bounds.size.width = px(460.0);
        assert!(
            !sidebar_layout(&overflow),
            "old viewport width must not overflow the native pane"
        );
        let mut reveal = valid.clone();
        let mut nested = LayoutNode::default();
        nested.id = 7;
        nested.parent = 6;
        nested.test_id = Some("lui-12-split-pane-13".into());
        nested.bounds = valid[5].bounds;
        reveal.push(nested);
        assert!(
            !sidebar_layout(&reveal),
            "the old reveal/shade split is a second size owner"
        );
    }
}
