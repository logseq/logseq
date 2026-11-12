//! Project the committed NSH attributed layout onto the shared editor's byte runs.
//! No text is shaped here and no offscreen element is materialized for a query.
use lui_nsh::{render::Renderer, runtime::PlatformEvent, store::Node};
use nsh_core::{
    Affinity, Measurement, TextGeometry, TextGeometryQuery, TextGeometryResult, TextPosition,
    element::ElementRef,
    geometry::{Bounds, Point, Points, px},
};
use serde_json::{Map, Value, json};
use std::{collections::HashMap, sync::Arc};

#[derive(Clone, Copy)]
pub(super) enum Query {
    Caret(usize),
    Selection(usize, usize),
    Hit { x: i32, y: i32 },
    Lines,
    Height,
}
pub(super) struct Request {
    operation: String,
    epoch: u64,
    query: Query,
}
impl Request {
    pub(super) fn decode(operation: &str, fields: &Map<String, Value>) -> Result<Self, String> {
        let unsigned = |name: &str| {
            fields
                .get(name)
                .and_then(Value::as_u64)
                .ok_or_else(|| format!("editor {operation} requires a nonnegative integer {name}"))
        };
        let offset = |name| {
            usize::try_from(unsigned(name)?).map_err(|_| "editor offset is too large".to_owned())
        };
        let coordinate = |name| {
            fields
                .get(name)
                .and_then(Value::as_i64)
                .and_then(|n| i32::try_from(n).ok())
                .ok_or_else(|| format!("editor {operation} requires an integer {name}"))
        };
        let query = match operation {
            "caret-rect" => Query::Caret(offset("offset")?),
            "selection-rects" => {
                let (first, last) = (offset("first")?, offset("last")?);
                if first > last {
                    return Err("editor selection must be ordered".into());
                }
                Query::Selection(first, last)
            }
            "offset-at" => Query::Hit {
                x: coordinate("x")?,
                y: coordinate("y")?,
            },
            "line-ranges" => Query::Lines,
            "scroll-height" => Query::Height,
            _ => return Err(format!("unsupported editor geometry operation {operation}")),
        };
        Ok(Self {
            operation: operation.into(),
            epoch: unsigned("geometry-epoch")?,
            query,
        })
    }
}
#[derive(Clone, Debug)]
struct Span {
    first: usize,
    last: usize,
    tag: char,
}
fn spans(encoded: &str) -> Result<Vec<Span>, String> {
    let mut previous = 0;
    encoded
        .split(';')
        .map(|field| {
            let parts = field.split(',').collect::<Vec<_>>();
            if parts.len() != 3 {
                return Err("editor run requires first,last,kind".into());
            }
            let first = parts[0]
                .parse::<usize>()
                .map_err(|_| "invalid editor run start")?;
            let last = parts[1]
                .parse::<usize>()
                .map_err(|_| "invalid editor run end")?;
            let tag = match parts[2] {
                "p" => 'p',
                "d" => 'd',
                "a" => 'a',
                "r" => 'r',
                "z" => 'z',
                _ => return Err("invalid editor run kind".into()),
            };
            if first < previous || last < first || (tag == 'z' && first != last) {
                return Err("editor runs must be ordered byte ranges".into());
            }
            previous = last;
            Ok(Span { first, last, tag })
        })
        .collect()
}
fn class(node: &Node, expected: &str) -> bool {
    node.string("style-class")
        .split_whitespace()
        .any(|name| name == expected)
}
fn descendants(
    renderer: &Renderer,
    root: &Node,
    matches: impl Fn(&Node) -> bool,
) -> Vec<Arc<Node>> {
    let mut result = Vec::new();
    let mut pending = root.children.iter().rev().copied().collect::<Vec<_>>();
    while let Some(id) = pending.pop() {
        if let Some(node) = renderer.node_snapshot(id) {
            if matches(&node) {
                result.push(node)
            } else {
                pending.extend(node.children.iter().rev().copied());
            }
        }
    }
    result
}
fn revision_matches(before: &Node, after: &Node) -> bool {
    before.incarnation == after.incarnation
        && before
            .extension
            .as_ref()
            .zip(after.extension.as_ref())
            .is_some_and(|(before, after)| {
                ["block-id", "runs", "source-version", "composition"]
                    .iter()
                    .all(|name| before.properties.get(*name) == after.properties.get(*name))
            })
}
struct Run {
    source: Span,
    start: u32,
    end: u32,
    // Byte/UTF-16 character boundaries from this exact attributed span.
    positions: Vec<(usize, u32)>,
    hidden: bool,
}
impl Run {
    fn native_offset(&self, offset: usize) -> Option<u32> {
        if offset < self.source.first || offset > self.source.last {
            return None;
        }
        if self.source.tag == 'z' {
            return Some(self.start);
        }
        if self.source.tag == 'a' {
            return Some(if offset >= self.source.last {
                self.end
            } else {
                self.start
            });
        }
        let local = offset - self.source.first;
        let index = self
            .positions
            .binary_search_by_key(&local, |(byte, _)| *byte)
            .ok()?;
        Some(self.start + self.positions[index].1)
    }
    fn source_offset(&self, offset: u32, click: bool) -> Option<usize> {
        if self.source.tag == 'z' {
            return Some(self.source.first);
        }
        if self.source.tag == 'a' {
            // Shared Edit_model expands an atomic decoration on an interior hit.
            return Some(if click {
                self.source.last.min(self.source.first.saturating_add(1))
            } else if offset >= self.end {
                self.source.last
            } else {
                self.source.first
            });
        }
        let units = offset.clamp(self.start, self.end) - self.start;
        let index = self
            .positions
            .binary_search_by_key(&units, |(_, units)| *units)
            .ok()?;
        Some(self.source.first + self.positions[index].0)
    }
}
fn positions(text: &str) -> Vec<(usize, u32)> {
    let mut result = Vec::with_capacity(text.chars().count() + 1);
    let mut units = 0;
    for (byte, ch) in text.char_indices() {
        result.push((byte, units));
        units += ch.len_utf16() as u32;
    }
    result.push((text.len(), units));
    result
}
struct Line {
    reference: ElementRef,
    layout: TextGeometry,
    runs: Vec<Run>,
}
impl Line {
    fn current(&self, answer: &TextGeometry) -> bool {
        Arc::ptr_eq(&self.layout.text, &answer.text)
            && self.layout.measurement == answer.measurement
            && self.layout.content == answer.content
            && self.layout.page_scale == answer.page_scale
    }
    fn source_offset(&self, offset: u32, click: bool) -> Option<usize> {
        let end = self.runs.partition_point(|run| run.start <= offset);
        let candidates = &self.runs[..end];
        // Prefer the following visible run at a shared boundary, including a
        // zero-width landing pad. Binary search avoids scanning a long flow
        // again for every visual line during line-range conversion.
        let boundary = candidates.partition_point(|run| run.start < offset);
        let run = candidates[boundary..]
            .iter()
            .find(|run| !run.hidden && offset <= run.end)
            .or_else(|| {
                candidates
                    .iter()
                    .rev()
                    .find(|run| !run.hidden && run.start <= offset && offset <= run.end)
            })?;
        run.source_offset(offset, click)
    }
    fn root_rect(&self, bounds: Bounds<Points>, root: Measurement) -> Value {
        let scale = self.layout.page_scale;
        json!({"x":self.layout.measurement.page.x.0+(self.layout.content.origin.x.0+bounds.origin.x.0)*scale-root.page.x.0,
            "y":self.layout.measurement.page.y.0+(self.layout.content.origin.y.0+bounds.origin.y.0)*scale-root.page.y.0,
            "w":bounds.size.width.0*scale,"h":bounds.size.height.0*scale})
    }
}
struct Layout {
    sink: Arc<Node>,
    root_ref: ElementRef,
    root_measurement: Measurement,
    lines: Vec<Line>,
    guards: Vec<Arc<Node>>,
}
impl Layout {
    fn current(&self, renderer: &Renderer) -> bool {
        renderer
            .node_snapshot(self.sink.id)
            .is_some_and(|sink| revision_matches(&self.sink, &sink))
            && self.guards.iter().all(|before| {
                renderer
                    .node_snapshot(before.id)
                    .is_some_and(|after| Arc::ptr_eq(before, &after))
            })
    }
    async fn read(sink: Arc<Node>, renderer: &Renderer) -> Result<Option<Self>, String> {
        let Some(root) = sink
            .parent
            .and_then(|id| renderer.node_snapshot(id))
            .filter(|node| class(node, "block-editor"))
        else {
            return Ok(None);
        };
        let Some(root_ref) = renderer.native_reference(root.id, root.incarnation) else {
            return Ok(None);
        };
        let encoded = sink
            .extension
            .as_ref()
            .unwrap()
            .properties
            .get("runs")
            .and_then(Value::as_str)
            .ok_or("editor geometry requires its source-run metadata")?;
        let spans = spans(encoded)?;
        let nodes = descendants(renderer, &root, |node| class(node, "ed-line"));
        if nodes.is_empty() {
            return Ok(None);
        }
        let mut guards = vec![root.clone()];
        let mut cursor = 0;
        let mut pending = Vec::with_capacity(nodes.len());
        // All answers are requested before awaiting: root and logical lines are
        // observed in the same native layout commit, independent of display ticks.
        let root_pending = root_ref.measure();
        for node in nodes {
            let fragments = descendants(renderer, &node, |node| {
                node.string("accessibility-identifier")
                    .starts_with("ls-editor-run-")
            });
            let end = cursor + fragments.len();
            if end > spans.len() {
                return Err("editor fragment/source-run count mismatch".into());
            }
            let local = spans[cursor..end].to_vec();
            cursor = end;
            let Some(reference) = renderer.native_reference(node.id, node.incarnation) else {
                return Ok(None);
            };
            let answer = reference.text_geometry(TextGeometryQuery::Lines);
            guards.push(node.clone());
            guards.extend(fragments.iter().cloned());
            pending.push((node, reference, answer, fragments, local));
        }
        if cursor != spans.len() {
            return Err("editor source runs have no mounted fragment".into());
        }
        let Some(root_measurement) = root_pending.await else {
            return Ok(None);
        };
        let mut lines = Vec::with_capacity(pending.len());
        for (_node, reference, answer, fragments, spans) in pending {
            let Some(layout) = answer.await else {
                return Ok(None);
            };
            if !renderer
                .node_snapshot(sink.id)
                .is_some_and(|current| revision_matches(&sink, &current))
            {
                return Ok(None);
            }
            let mut runs = Vec::with_capacity(spans.len());
            let mut boundaries = vec![Some(0_usize)];
            for (byte, ch) in layout.text.text.char_indices() {
                if ch.len_utf16() == 2 {
                    boundaries.push(None);
                }
                boundaries.push(Some(byte + ch.len_utf8()));
            }
            let identities = layout
                .text
                .test_ids
                .iter()
                .map(|span| (span.test_id.as_ref(), span))
                .collect::<HashMap<_, _>>();
            for (fragment, source) in fragments.iter().zip(spans) {
                if !renderer
                    .node_snapshot(fragment.id)
                    .is_some_and(|after| Arc::ptr_eq(fragment, &after))
                {
                    return Ok(None);
                }
                let identifier = fragment.string("accessibility-identifier");
                let Some(span) = identities.get(identifier) else {
                    return Ok(None);
                };
                let (Some(first), Some(last)) = (
                    boundaries.get(span.start as usize).copied().flatten(),
                    boundaries.get(span.end as usize).copied().flatten(),
                ) else {
                    return Err("native attributed run splits a UTF-16 character".into());
                };
                let text = &layout.text.text[first..last];
                let hidden = class(fragment, "ed-hidden");
                if !hidden
                    && !matches!(source.tag, 'a' | 'z')
                    && text.len() != source.last - source.first
                {
                    return Err("editor source/display byte length mismatch".into());
                }
                runs.push(Run {
                    source,
                    start: span.start,
                    end: span.end,
                    positions: positions(text),
                    hidden,
                });
            }
            lines.push(Line {
                reference,
                layout,
                runs,
            });
        }
        let layout = Self {
            sink,
            root_ref,
            root_measurement,
            lines,
            guards,
        };
        Ok(layout.current(renderer).then_some(layout))
    }
    fn caret(&self, offset: usize) -> Option<(&Line, u32)> {
        if self.lines.iter().flat_map(|line| &line.runs).any(|run| {
            !run.hidden
                && !matches!(run.source.tag, 'a' | 'z')
                && run.source.first <= offset
                && offset <= run.source.last
                && run.native_offset(offset).is_none()
        }) {
            return None;
        }
        for line in self.lines.iter().rev() {
            for run in line.runs.iter().rev().filter(|run| !run.hidden) {
                if let Some(at) = run.native_offset(offset) {
                    return Some((line, at));
                }
            }
        }
        self.lines
            .iter()
            .flat_map(|line| line.runs.iter().map(move |run| (line, run)))
            .find(|(_, run)| !run.hidden && run.source.first >= offset)
            .map(|(line, run)| (line, run.start))
    }
    async fn answer(&self, request: &Request) -> Result<Option<Value>, String> {
        let mut payload = json!({"geometry-epoch":request.epoch});
        match request.query {
            Query::Caret(offset) => {
                let Some((line, at)) = self.caret(offset) else {
                    return Ok(None);
                };
                let Some(answer) = line
                    .reference
                    .text_geometry(TextGeometryQuery::Caret(TextPosition::new(
                        at,
                        Affinity::Downstream,
                    )))
                    .await
                else {
                    return Ok(None);
                };
                if !line.current(&answer) {
                    return Ok(None);
                }
                let TextGeometryResult::Caret(Some(rect)) = answer.result else {
                    return Ok(None);
                };
                let rect = line.root_rect(rect, self.root_measurement);
                payload["offset"] = json!(offset);
                payload["x"] = rect["x"].clone();
                payload["y"] = rect["y"].clone();
                payload["h"] = rect["h"].clone();
                payload["ox"] = json!(self.root_measurement.page.x.0);
                payload["oy"] = json!(self.root_measurement.page.y.0);
            }
            Query::Hit { x, y } => {
                let mut nearest = None;
                let mut distance = f32::INFINITY;
                for line in &self.lines {
                    let TextGeometryResult::Lines(visual) = &line.layout.result else {
                        return Err("native line query returned a different result".into());
                    };
                    for bounds in visual {
                        let top = line.layout.measurement.page.y.0
                            + (line.layout.content.origin.y.0 + bounds.y.0)
                                * line.layout.page_scale
                            - self.root_measurement.page.y.0;
                        let bottom = top + bounds.height.0 * line.layout.page_scale;
                        let delta = (top - y as f32).max(0.0) + (y as f32 - bottom).max(0.0);
                        if delta < distance {
                            distance = delta;
                            nearest = Some(line);
                        }
                    }
                }
                let Some(line) = nearest else { return Ok(None) };
                let point = Point::new(
                    px((x as f32 + self.root_measurement.page.x.0
                        - line.layout.measurement.page.x.0)
                        / line.layout.page_scale
                        - line.layout.content.origin.x.0),
                    px((y as f32 + self.root_measurement.page.y.0
                        - line.layout.measurement.page.y.0)
                        / line.layout.page_scale
                        - line.layout.content.origin.y.0),
                );
                let Some(answer) = line
                    .reference
                    .text_geometry(TextGeometryQuery::HitTest(point))
                    .await
                else {
                    return Ok(None);
                };
                if !line.current(&answer) {
                    return Ok(None);
                }
                let TextGeometryResult::HitTest(at) = answer.result else {
                    return Ok(None);
                };
                let Some(offset) = line.source_offset(at.offset, true) else {
                    return Ok(None);
                };
                payload["x"] = json!(x);
                payload["y"] = json!(y);
                payload["offset"] = json!(offset);
            }
            Query::Selection(first, last) => {
                let mut pending = Vec::new();
                for line in &self.lines {
                    let mut interval = None::<(u32, u32)>;
                    for run in line.runs.iter().filter(|run| {
                        !run.hidden
                            && run.source.tag != 'z'
                            && run.source.first < last
                            && first < run.source.last
                    }) {
                        let (Some(a), Some(b)) = (
                            run.native_offset(first.max(run.source.first)),
                            run.native_offset(last.min(run.source.last)),
                        ) else {
                            return Err("selection splits a source character".into());
                        };
                        let (a, b) = if run.source.tag == 'a' {
                            (run.start, run.end)
                        } else {
                            (a, b)
                        };
                        interval = Some(match interval {
                            Some((lo, hi)) => (lo.min(a), hi.max(b)),
                            None => (a, b),
                        });
                    }
                    if let Some((a, b)) = interval {
                        pending.push((
                            line,
                            line.reference.text_geometry(TextGeometryQuery::Range(a..b)),
                        ));
                    }
                }
                let mut rects = Vec::new();
                for (line, answer) in pending {
                    let Some(answer) = answer.await else {
                        return Ok(None);
                    };
                    if !line.current(&answer) {
                        return Ok(None);
                    }
                    let TextGeometryResult::Range(boxes) = answer.result else {
                        return Ok(None);
                    };
                    rects.extend(
                        boxes
                            .into_iter()
                            .map(|bounds| line.root_rect(bounds, self.root_measurement)),
                    );
                }
                payload["first"] = json!(first);
                payload["last"] = json!(last);
                payload["rects"] = json!(rects);
            }
            Query::Lines => {
                let mut ranges = Vec::new();
                for line in &self.lines {
                    let TextGeometryResult::Lines(visual) = &line.layout.result else {
                        return Err("native line query returned a different result".into());
                    };
                    for range in visual {
                        let (Some(a), Some(b)) = (
                            line.source_offset(range.start, false),
                            line.source_offset(range.end, false),
                        ) else {
                            return Ok(None);
                        };
                        if a > b || ranges.last().is_some_and(|&(_, previous)| a < previous) {
                            return Ok(None);
                        }
                        ranges.push((a, b));
                    }
                }
                payload["ranges"] = json!(
                    ranges
                        .iter()
                        .map(|(a, b)| format!("{a},{b}"))
                        .collect::<Vec<_>>()
                        .join(";")
                );
            }
            Query::Height => {
                let bottom = self
                    .lines
                    .iter()
                    .map(|line| {
                        line.layout.measurement.page.y.0
                            + (line.layout.content.origin.y.0 + line.layout.content.size.height.0)
                                * line.layout.page_scale
                            - self.root_measurement.page.y.0
                    })
                    .fold(0.0_f32, f32::max);
                payload["height"] = json!(bottom.max(self.root_measurement.frame.size.height.0));
            }
        }
        // A second native commit could move the editor while an individual
        // query was pending. Discard it instead of mixing scroll coordinate spaces.
        if self.root_ref.measure().await != Some(self.root_measurement) {
            return Ok(None);
        }
        Ok(Some(payload))
    }
}
pub(super) async fn execute(
    request: Request,
    sink: Arc<Node>,
    previous: Option<&Node>,
    renderer: &Renderer,
) -> Result<Vec<PlatformEvent>, String> {
    if previous.is_some_and(|previous| !revision_matches(previous, &sink)) {
        return Ok(Vec::new());
    }
    let Some(layout) = Layout::read(sink, renderer).await? else {
        return Ok(Vec::new());
    };
    let Some(mut payload) = layout.answer(&request).await? else {
        return Ok(Vec::new());
    };
    if !layout.current(renderer) {
        return Ok(Vec::new());
    }
    payload["block-id"] = layout.sink.extension.as_ref().unwrap().properties["block-id"].clone();
    Ok(vec![PlatformEvent {
        operation: request.operation,
        payload: payload.to_string(),
    }])
}

#[cfg(test)]
#[path = "editor_text_geometry_tests.rs"]
mod tests;
