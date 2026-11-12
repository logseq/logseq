//! Real graph -> daemon/SSE -> OCaml producers -> public NSH engine qualification.
//! Render bounds do not imply bounded graph data, worker memory, paint or IME.
use super::{Duration, Headless, Instant, Path, fs, request, wait_for_chrome};
use nsh_core::{
    MountItem, NodeId,
    element::NodeRef,
    geometry::{Points, point, px},
    prelude::*,
};
use nsh_engine::perf::{PerfMonitor, ProcessSampler};
use nsh_testing::Screen;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    io::{BufRead, BufReader, Read, Write},
    net::{SocketAddr, TcpStream},
    process::Command,
    sync::{Arc, Mutex},
};

#[derive(Clone, Default)]
pub(super) struct Jump(Arc<Mutex<Option<(NodeId, Points)>>>);

#[nsh_core::element::component]
pub(super) fn RowsApp() -> impl IntoElement {
    let jump = engine_context::<Jump>().expect("qualification jump context");
    on_key_with(
        "f8",
        KeyOptions {
            when: nsh_core::keymap::When::Always,
            ..Default::default()
        },
        move |_| {
            let (id, y) = (*jump.0.lock().unwrap()).expect("qualification jump request");
            NodeRef(id).scroll_to(point(px(0.0), y), false);
        },
    );
    nsh_app_logseq::App::element(nsh_app_logseq::AppProps {
        startup_preflight: true.into(),
    })
}
impl Jump {
    fn to(&self, app: &mut Headless, y: Points) -> Result<(), String> {
        *self.0.lock().unwrap() = Some((scroll_id(app.screen())?, y));
        app.press_key("f8")
    }
}

mod editor;

const PREFIX: &str = "NSH bounded row ";
const MAX_TREE: u64 = 32 * 1024 * 1024;
// A 900pt viewport of short single-line blocks plus overscan. The bounds are
// independent of business source size and deliberately include rich row parts.
const MAX_ROWS: usize = 128;
const MAX_ADDED_NODES: usize = 8_000;
fn uuid(index: usize) -> String {
    format!("23456789-1234-4abc-8def-{index:012}")
}
fn title(index: usize) -> String {
    format!("{PREFIX}{index} sentinel")
}
fn row_name(index: usize) -> String {
    format!("ls-block-{}", uuid(index))
}

#[derive(Default, Clone, Copy)]
struct Churn {
    created: u64,
    deleted: u64,
    items: u64,
}
struct Worker {
    port: u16,
    repo: String,
    page: String,
    count: usize,
}
impl Worker {
    fn call(&self, action: &str, text: Option<&str>) -> Result<Value, String> {
        let script = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/startup_rows/worker.mjs");
        let spec = json!({"port":self.port,"repo":self.repo,"page":self.page,"count":self.count,"action":action,"title":text});
        let output = Command::new(std::env::var_os("NODE_BINARY").unwrap_or_else(|| "node".into()))
            .arg(script)
            .arg(spec.to_string())
            .output()
            .map_err(|error| error.to_string())?;
        if !output.status.success() {
            return Err(format!(
                "real worker {action}: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }
        serde_json::from_slice(&output.stdout)
            .map_err(|error| format!("worker {action} receipt: {error}"))
    }
}
fn owned_worker(root: &Path, count: usize) -> Result<Worker, String> {
    let expected = fs::canonicalize(root).map_err(|error| error.to_string())?;
    let registry =
        fs::read_to_string(root.join("server-list")).map_err(|error| error.to_string())?;
    let mut owned = Vec::new();
    for line in registry.lines() {
        let fields: Vec<_> = line.split_whitespace().collect();
        if fields.len() != 2 {
            return Err("invalid private worker registry".into());
        }
        let port = fields[1]
            .parse::<u16>()
            .map_err(|error| error.to_string())?;
        let (status, body) = request(port, "GET", "/healthz")?;
        if status != 200 {
            return Err(format!("private worker not ready: {status}"));
        }
        let health: Value = serde_json::from_str(&body).map_err(|error| error.to_string())?;
        let actual = health
            .pointer("/storage/root")
            .and_then(Value::as_str)
            .ok_or("worker storage.root missing")?;
        if fs::canonicalize(actual).map_err(|error| error.to_string())? != expected {
            return Err("refusing graph writes outside this qualification's private root".into());
        }
        owned.push(Worker {
            port,
            repo: health
                .get("repo")
                .and_then(Value::as_str)
                .ok_or("worker repo missing")?
                .into(),
            page: String::new(),
            count,
        });
    }
    if owned.len() != 1 {
        return Err(format!(
            "expected one actual private worker, got {}",
            owned.len()
        ));
    }
    Ok(owned.remove(0))
}
/// Read the real private Journal after the production picker write/reload.
pub(super) fn persisted_journal_icon() -> Result<Value, String> {
    let root = std::env::var_os("LOGSEQ_ROOT_DIR").ok_or("private graph root missing")?;
    owned_worker(Path::new(&root), 0)?.call("journal-icon", None)
}

pub(super) struct Agent(SocketAddr);
impl Agent {
    pub(super) fn discover() -> Result<Self, String> {
        let transcript = std::env::var_os("LOGSEQ_NSH_PROBE_TRANSCRIPT")
            .ok_or("qualification transcript path missing")?;
        let log = fs::read_to_string(transcript).map_err(|error| error.to_string())?;
        const MARKER: &str = "lui-agent listening on ";
        // libtest can put its test-name prefix on the same stdout/stderr line.
        // Require one real announcement; do not guess a port or pick one of
        // multiple servers when qualification owns exactly one application.
        if log.matches(MARKER).count() != 1 {
            return Err("expected exactly one owned LUI agent address announcement".into());
        }
        let announced = log.split_once(MARKER).expect("counted address marker").1;
        let address = announced
            .lines()
            .next()
            .ok_or("empty LUI agent announcement")?
            .trim()
            .parse::<SocketAddr>()
            .map_err(|error| error.to_string())?;
        if !address.ip().is_loopback() || address.port() == 0 {
            return Err("invalid owned LUI agent address".into());
        }
        Ok(Self(address))
    }
    pub(super) fn tree(&self) -> Result<Value, String> {
        self.query("tree")
    }
    fn query(&self, operation: &str) -> Result<Value, String> {
        self.request(&json!({"op": operation}))
    }
    pub(super) fn document(&self, name: &str, payload: Value) -> Result<Value, String> {
        self.request(&json!({
            "op":"ext", "selector":"ext:logseq-dom", "identifier":"logseq-dom",
            "name":"dom-event", "fields":json!({"name":name,"payload":payload.to_string()}).to_string()
        }))
    }
    fn request(&self, request: &Value) -> Result<Value, String> {
        let operation = request
            .get("op")
            .and_then(Value::as_str)
            .ok_or("agent operation missing")?;
        let mut stream = TcpStream::connect_timeout(&self.0, Duration::from_secs(2))
            .map_err(|error| error.to_string())?;
        stream
            .set_read_timeout(Some(Duration::from_secs(60)))
            .map_err(|error| error.to_string())?;
        stream
            .set_write_timeout(Some(Duration::from_secs(2)))
            .map_err(|error| error.to_string())?;
        stream
            .write_all(format!("{request}\n").as_bytes())
            .map_err(|error| error.to_string())?;
        let mut reader = BufReader::new(stream).take(MAX_TREE + 1);
        let mut response = Vec::new();
        reader
            .read_until(b'\n', &mut response)
            .map_err(|error| error.to_string())?;
        if response.len() as u64 > MAX_TREE {
            return Err(
                "logical tree exceeds the bounded 32MiB qualification response limit".into(),
            );
        }
        let tree: Value = serde_json::from_slice(&response).map_err(|error| error.to_string())?;
        if tree.get("ok").and_then(Value::as_bool) != Some(true) {
            return Err(format!("actual LUI agent rejected {operation}: {tree}"));
        }
        Ok(tree)
    }
}
/// Check reported capacities from both real OCaml runtimes without a GC.
pub(super) fn qualify_minor_heaps() -> Result<(), String> {
    let words: u64 = std::env::var("LOGSEQ_NSH_EXPECTED_MINOR_HEAP_WORDS")
        .map_err(|error| error.to_string())?
        .parse::<u64>()
        .map_err(|error| error.to_string())?;
    let check = |owner: &str, gc: &Value| -> Result<(), String> {
        let word_bytes = gc
            .get("word-bytes")
            .and_then(Value::as_u64)
            .filter(|bytes| matches!(bytes, 4 | 8))
            .ok_or_else(|| format!("{owner}: missing OCaml machine-word size: {gc}"))?;
        let actual = gc
            .get("current-domain-minor-heap-limit-bytes")
            .and_then(Value::as_u64);
        if actual != Some(words * word_bytes) {
            return Err(format!("{owner}: expected {words} words, got {gc}"));
        }
        Ok(())
    };
    let ui = Agent::discover()?.query("gc-stats")?;
    check("UI", ui.get("gc").ok_or("UI heap diagnostics missing")?)?;
    let root = std::env::var_os("LOGSEQ_ROOT_DIR").ok_or("private root missing")?;
    let root = fs::canonicalize(root).map_err(|error| error.to_string())?;
    let registry =
        fs::read_to_string(root.join("server-list")).map_err(|error| error.to_string())?;
    let mut workers = 0;
    for line in registry.lines() {
        let fields: Vec<_> = line.split_whitespace().collect();
        if fields.len() != 2 {
            return Err("invalid private worker registry".into());
        }
        let port = fields[1]
            .parse::<u16>()
            .map_err(|error| error.to_string())?;
        let (status, body) = super::request(port, "GET", "/healthz")?;
        if status != 200 {
            return Err(format!("worker health status: {status}"));
        }
        let health: Value = serde_json::from_str(&body).map_err(|error| error.to_string())?;
        let storage = health
            .get("storage")
            .and_then(|storage| storage.get("root"))
            .and_then(Value::as_str)
            .ok_or("worker storage root missing")?;
        if fs::canonicalize(storage).map_err(|error| error.to_string())? != root {
            return Err("heap query resolved a different worker root".into());
        }
        check(
            "worker",
            health
                .get("native-gc")
                .ok_or("worker heap diagnostics missing")?,
        )?;
        workers += 1;
    }
    if workers != 1 {
        return Err(format!("expected one actual worker, found {workers}"));
    }
    Ok(())
}

#[derive(Default)]
struct Logical {
    nodes: usize,
    rows: BTreeMap<String, u64>,
    totals: Vec<u64>,
}
fn logical(tree: &Value) -> Result<Logical, String> {
    let roots = tree
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or("logical tree has no node array")?;
    let mut pending: Vec<_> = roots.iter().collect();
    let mut report = Logical::default();
    while let Some(node) = pending.pop() {
        report.nodes += 1;
        let props = node.get("props").ok_or("logical node has no props")?;
        if let Some(name) = props
            .get("accessibility-identifier")
            .and_then(Value::as_str)
            && name.starts_with("ls-block-23456789-1234-4abc-8def-")
        {
            report.rows.insert(
                name.into(),
                node.get("id")
                    .and_then(Value::as_u64)
                    .ok_or("logical row lacks id")?,
            );
        }
        if node.get("kind").and_then(Value::as_str) == Some("virtual-list")
            && let Some(total) = props.get("virtual-total-count").and_then(Value::as_u64)
        {
            if props.get("virtual-viewport").and_then(Value::as_str) != Some("parent") {
                return Err(
                    "production row source did not borrow its actual Scroll viewport".into(),
                );
            }
            report.totals.push(total);
        }
        pending.extend(
            node.get("children")
                .and_then(Value::as_array)
                .ok_or("logical node children missing")?,
        );
    }
    Ok(report)
}
fn native_row(screen: &Screen, index: usize) -> Result<NodeId, String> {
    let name = row_name(index);
    screen
        .layout_nodes()
        .iter()
        .find(|node| node.test_id.as_deref() == Some(name.as_str()))
        .map(|node| node.id)
        .ok_or_else(|| format!("production row {index} has no actual native root"))
}
fn scroll_id(screen: &Screen) -> Result<NodeId, String> {
    screen
        .layout_nodes()
        .iter()
        .find(|node| {
            node.test_id.as_deref() == Some("main-content-container") && node.scroll.is_some()
        })
        .map(|node| node.id)
        .ok_or("actual main Scroll is missing".into())
}
fn wait_text(app: &mut Headless, text: &str) -> Result<(), String> {
    wait_for_chrome(
        app,
        "actual seeded block content",
        Duration::from_secs(60),
        |screen| {
            let nodes = screen.layout_nodes();
            let Some(main) = nodes
                .iter()
                .find(|node| node.test_id.as_deref() == Some("main-content-container"))
            else {
                return false;
            };
            nodes.iter().any(|node| {
                !node.hidden
                    && node.bounds.size.width.0 > 0.0
                    && node.bounds.size.height.0 > 0.0
                    && node.bounds.intersects(&main.bounds)
                    && node
                        .text
                        .as_ref()
                        .is_some_and(|value| value.text.text.trim() == text)
            })
        },
    )
}
struct Measurements {
    agent: Agent,
    baseline: (usize, usize),
    monitor: Arc<PerfMonitor>,
    process: ProcessSampler,
    churn: Arc<Mutex<Churn>>,
}
impl Measurements {
    fn sample(&mut self, app: &Headless, expected: usize, stage: &str) -> Result<Logical, String> {
        let baseline = self.baseline;
        let logical = logical(&self.agent.tree()?)?;
        let native = app.screen().layout_nodes();
        if let Some(error) = native
            .iter()
            .find(|node| node.test_id.as_deref() == Some("lui-backend-error"))
        {
            return Err(format!("backend failure during {stage}: {:?}", error.text));
        }
        if logical.rows.len() > MAX_ROWS
            || logical.nodes > baseline.0 + MAX_ADDED_NODES
            || native.len() > baseline.1 + MAX_ADDED_NODES
        {
            return Err(format!(
                "unbounded production rendering at{stage}: logical={}, rowroots={}, native={} (baseline={baseline:?})",
                logical.nodes,
                logical.rows.len(),
                native.len()
            ));
        }
        if expected > 0 && !logical.totals.contains(&(expected as u64)) {
            return Err(format!(
                "source count {expected} missing from actual production virtual metadata at {stage}: {:?}",
                logical.totals
            ));
        }
        let perf = self.monitor.snapshot();
        let usage = self.process.sample();
        let churn = *self.churn.lock().unwrap();
        eprintln!(
            "NSH_PRODUCTION_ROWS {}",
            json!({"stage":stage,"sourceCount":expected,
        "logicalNodes":logical.nodes,"rowRoots":logical.rows.len(),"nativeNodes":native.len(),
        "coreNodesAfterIdleCollection":perf.memory.map(|memory|memory.nodes),
        "engineRecentLayoutP95Ms":perf.layout.p95.as_secs_f64()*1000.,
        "engineRecentAppP95Ms":perf.js.p95.as_secs_f64()*1000.,
        "uiProcessMemoryBytes":usage.memory,"uiProcessCpuPercent":usage.cpu,
        "nativeCreated":churn.created,"nativeDeleted":churn.deleted,"nativeMountItems":churn.items})
        );
        Ok(logical)
    }
    fn edit(
        &mut self,
        app: &mut Headless,
        worker: &Worker,
        text: &str,
        stage: &str,
    ) -> Result<(), String> {
        let untouched = native_row(app.screen(), 1)?;
        let changed = native_row(app.screen(), 0)?;
        let before = logical(&self.agent.tree()?)?;
        let before_changed = *before
            .rows
            .get(&row_name(0))
            .ok_or("edited row missing from the actual logical tree")?;
        let before_neighbor = *before
            .rows
            .get(&row_name(1))
            .ok_or("neighbor row missing from the actual logical tree")?;
        let before_churn = *self.churn.lock().unwrap();
        let started = Instant::now();
        let saved = worker.call("edit", Some(text))?;
        wait_text(app, text)?;
        let after = self.sample(app, worker.count, stage)?;
        if native_row(app.screen(), 0)? != changed
            || native_row(app.screen(), 1)? != untouched
            || after.rows.get(&row_name(0)) != Some(&before_changed)
            || after.rows.get(&row_name(1)) != Some(&before_neighbor)
        {
            return Err("one-row worker edit replaced a stable production UUID/native root".into());
        }
        let created = self.churn.lock().unwrap().created - before_churn.created;
        if created > 1_024 {
            return Err(format!("one-row edit created {created} native nodes"));
        }
        eprintln!(
            "NSH_PRODUCTION_ROWS {}",
            json!({"stage":stage,"sourceCount":worker.count,
        "worker":saved,"totalMs":started.elapsed().as_secs_f64()*1000.,"nativeCreated":created})
        );
        Ok(())
    }
}
fn far_and_back(
    app: &mut Headless,
    jump: &Jump,
    count: usize,
    first: &str,
    measurements: &mut Measurements,
    stage: &str,
) -> Result<(), String> {
    let distance = app
        .screen()
        .layout_nodes()
        .into_iter()
        .find(|node| node.test_id.as_deref() == Some("main-content-container"))
        .and_then(|node| node.scroll.and_then(|scroll| scroll.content_size))
        .ok_or("native main Scroll content size is unavailable")?
        .height;
    let started = Instant::now();
    jump.to(app, distance)?;
    wait_text(app, &title(count - 1))?;
    measurements.sample(app, count, stage)?;
    eprintln!(
        "NSH_PRODUCTION_ROWS {}",
        json!({"stage":"far-jump","sourceCount":count,"settleMs":started.elapsed().as_secs_f64()*1000.})
    );
    jump.to(app, px(0.0))?;
    wait_text(app, first)
}

pub(super) fn qualify(app: &mut Headless, jump: &Jump, count: usize) -> Result<(), String> {
    let root = std::env::var_os("LOGSEQ_ROOT_DIR").ok_or("private root missing")?;
    let agent = Agent::discover()?;
    let mut worker = owned_worker(Path::new(&root), count)?;
    let prepared = worker.call("prepare", None)?;
    worker.page = prepared
        .get("page")
        .and_then(Value::as_str)
        .ok_or("real journal UUID missing")?
        .into();
    let page_title = app
        .screen()
        .layout_nodes()
        .iter()
        .filter_map(|node| node.text.as_ref())
        .map(|text| text.text.text.as_str())
        .find(|title| super::startup_body::dated_title(title))
        .ok_or("actual startup journal title is missing")?
        .to_owned();
    let baseline = (
        logical(&agent.tree()?)?.nodes,
        app.screen().layout_nodes().len(),
    );
    let main = scroll_id(app.screen())?;
    let monitor = Arc::new(PerfMonitor::new());
    app.engine()
        .control()
        .set_perf_monitor(Some(monitor.clone()));
    let mut process = ProcessSampler::new();
    let _ = process.sample();
    let churn = Arc::new(Mutex::new(Churn::default()));
    let observe = churn.clone();
    app.observe(move |_, batch| {
        let mut counts = observe.lock().unwrap();
        counts.items += batch.items.len() as u64;
        for item in &batch.items {
            match item {
                MountItem::Create { .. } => counts.created += 1,
                MountItem::Delete { .. } => counts.deleted += 1,
                _ => {}
            }
        }
    });
    let mut measurements = Measurements {
        agent,
        baseline,
        monitor,
        process,
        churn,
    };
    let started = Instant::now();
    let seeded = worker.call("seed", None)?;
    wait_text(app, &title(0))?;
    eprintln!(
        "NSH_PRODUCTION_ROWS {}",
        json!({"stage":"seed-and-render","sourceCount":count,
        "worker":seeded,"totalMs":started.elapsed().as_secs_f64()*1000.})
    );
    editor::qualify(app, &measurements.agent)?;
    measurements.sample(app, count, "journal-initial")?;
    far_and_back(
        app,
        jump,
        count,
        &title(0),
        &mut measurements,
        "journal-distant",
    )?;
    measurements.sample(app, count, "journal-returned")?;
    let edited = "NSH one-row edit λ 😀 persisted";
    measurements.edit(app, &worker, edited, "journal-edited")?;
    // Use the existing journal title's real native click to navigate to Page.
    // No model injection, SDK callback or test-only route is installed.
    app.press(&format!("text:{page_title}"))?;
    wait_for_chrome(
        app,
        "actual Page route after journal title navigation",
        Duration::from_secs(60),
        |screen| screen.count("id:journals") == Ok(0) && screen.shows(edited),
    )?;
    if scroll_id(app.screen())? != main {
        return Err("Journal to Page navigation replaced the shared main Scroll".into());
    }
    measurements.sample(app, count, "page-initial")?;
    far_and_back(app, jump, count, edited, &mut measurements, "page-distant")?;
    measurements.sample(app, count, "page-returned")?;
    let page_edited = "NSH Page one-row edit β 😀 persisted";
    measurements.edit(app, &worker, page_edited, "page-edited")?;
    let started = Instant::now();
    let cleared = worker.call("clear", None)?;
    wait_for_chrome(
        app,
        "actual graph rows cleared",
        Duration::from_secs(60),
        |screen| {
            !screen.layout_nodes().iter().any(|node| {
                node.test_id
                    .as_deref()
                    .is_some_and(|name| name.starts_with("ls-block-23456789-1234-4abc-8def-"))
            })
        },
    )?;
    let empty = measurements.sample(app, 0, "cleared")?;
    if !empty.rows.is_empty() || app.screen().shows(page_edited) || scroll_id(app.screen())? != main
    {
        return Err("clearing the real graph left stale rows or replaced the main Scroll".into());
    }
    eprintln!(
        "NSH_PRODUCTION_ROWS {}",
        json!({"stage":"clear","sourceCount":count,
        "worker":cleared,"totalMs":started.elapsed().as_secs_f64()*1000.,
        "scope":"bounded render nodes; full graph/model/worker data memory is not bounded by this gate"})
    );
    Ok(())
}
