#!/usr/bin/env node
// Performance regression probe for the OCaml db-worker against a real
// graph (default: the 4k-movies graph from logseq/db-benchmark-graphs).
//
// Spawns db-worker-node (or attaches to a running one via --attach) and
// measures the app-shaped calls the frontend issues through /v1/invoke:
// cold start, journals, table views (first + deep-offset windows), list
// views + row snapshots, page-tree traversal, and daily outliner ops
// (enter / indent / outdent / paste / delete).
//
// Results are REPORTED, never gated on wall-clock bounds — timings vary
// by machine and CI boxes are noisy. The probe only fails on endpoint
// errors, malformed responses, or leftover blocks after cleanup.
//
// Usage (from deps/db-worker):
//   node test/perf_4k_graph_probe.cjs --root-dir ~/bench-graphs
//   node test/perf_4k_graph_probe.cjs --attach 45987   # reuse a daemon
//
// If <graphs-dir>/<repo>/db.sqlite is missing it is downloaded from
// github.com/logseq/db-benchmark-graphs (Git LFS, ~190MB) unless
// --no-download is given.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const crypto = require("node:crypto");

const transit = require("transit-js");
const writer = transit.writer("json");
const reader = transit.reader("json");
const kw = transit.keyword;
const tmap = (...kvs) => transit.map(kvs);
const uuid = (s) => transit.uuid(s);

const REPO_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_BUNDLE = path.join(REPO_ROOT, "dist/db-worker-node.js");
const GRAPH_URL =
  "https://media.githubusercontent.com/media/logseq/db-benchmark-graphs/master/sqlite/logseq_db_4k%20movies_1744119718.sqlite";

// ---------- args ----------
const opts = {
  repo: "4k movies",
  rootDir: process.env.BENCH_ROOT || path.join(os.homedir(), "bench-graphs"),
  graphsDir: null,
  workerBundle: DEFAULT_BUNDLE,
  attach: null,
  iters: 3,
  download: true,
  keepDaemon: false,
  jsonOut: null,
  spawnTimeoutMs: 600000,
};
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  const next = () => {
    i += 1;
    if (i >= process.argv.length) throw new Error(`missing value for ${a}`);
    return process.argv[i];
  };
  switch (a) {
    case "--repo": opts.repo = next(); break;
    case "--root-dir": opts.rootDir = next(); break;
    case "--graphs-dir": opts.graphsDir = next(); break;
    case "--worker-bundle": opts.workerBundle = next(); break;
    case "--attach": opts.attach = Number(next()); break;
    case "--iters": opts.iters = Number(next()); break;
    case "--no-download": opts.download = false; break;
    case "--keep-daemon": opts.keepDaemon = true; break;
    case "--json": opts.jsonOut = next(); break;
    case "--spawn-timeout-ms": opts.spawnTimeoutMs = Number(next()); break;
    default: throw new Error(`unknown option ${a}`);
  }
}
opts.graphsDir = opts.graphsDir || path.join(opts.rootDir, "graphs");

// ---------- transit helpers ----------
const norm = (v) => {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v !== "object") return v;
  if ("_name" in v) return `:${v._name}`;
  if ("tag" in v && "rep" in v) return norm(v.rep);
  if ("high" in v && "low" in v) return String(v);
  if (v instanceof Map || "_entries" in v) {
    const o = {};
    v.forEach((val, key) => {
      const k = key && typeof key === "object" && "_name" in key ? key._name : String(key);
      o[k] = norm(val);
    });
    return o;
  }
  if ("size" in v && typeof v.forEach === "function") {
    const out = [];
    v.forEach((x) => out.push(norm(x)));
    return out;
  }
  return v;
};

// ---------- results ----------
const recs = []; // {name, calls:[{label, ms}]}
let failures = 0;
const fail = (msg) => { failures += 1; console.log(`FAIL ${msg}`); };
const check = (label, cond, extra) => { if (!cond) fail(`${label}${extra ? " :: " + extra : ""}`); };

const recorder = (name) => {
  const rec = { name, calls: [] };
  recs.push(rec);
  rec.run = async (label, fn) => {
    const t0 = performance.now();
    const r = await fn();
    rec.calls.push({ label, ms: performance.now() - t0 });
    return r;
  };
  return rec;
};

// ---------- http / daemon ----------
let port = opts.attach;
let daemon = null;

async function invoke(method, args) {
  const res = await fetch(`http://127.0.0.1:${port}/v1/invoke`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, argsTransit: writer.write(args) }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.ok === false) {
    const msg = body && body.error ? JSON.stringify(body.error) : `HTTP ${res.status}`;
    throw new Error(`${method}: ${msg}`);
  }
  return reader.read(body.resultTransit);
}

const q = (query, ...inputs) => invoke("thread-api/q", [opts.repo, [query, ...inputs]]);

// ---------- graph file ----------
async function ensureGraph() {
  const file = path.join(opts.graphsDir, opts.repo, "db.sqlite");
  if (fs.existsSync(file)) return file;
  if (!opts.download) throw new Error(`graph file missing: ${file} (and --no-download)`);
  if (opts.repo !== "4k movies") throw new Error(`graph file missing: ${file}`);
  console.log(`downloading graph -> ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const res = await fetch(GRAPH_URL);
  if (!res.ok) throw new Error(`graph download failed: HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

// ---------- daemon ----------
// The daemon binds port 0 and logs `db-worker-node-ready ... port=NNNNN`;
// discover the port by tailing its log file.
async function startDaemon() {
  if (!fs.existsSync(opts.workerBundle)) {
    throw new Error(
      `worker bundle missing: ${opts.workerBundle}\n` +
        "build it with `pnpm db-worker-node:compile:bundle` from the repo root",
    );
  }
  fs.mkdirSync(opts.rootDir, { recursive: true });
  const logFile = path.join(opts.rootDir, `perf-probe-${Date.now()}.log`);
  const out = fs.openSync(logFile, "a");
  daemon = spawn(
    process.execPath,
    [
      opts.workerBundle,
      "--repo", opts.repo,
      "--root-dir", opts.rootDir,
      "--graphs-dir", opts.graphsDir,
      "--owner-source", "bench",
    ],
    { detached: true, stdio: ["ignore", out, out] },
  );
  daemon.unref();
  fs.closeSync(out);
  const t0 = performance.now();
  let readyMs = null;
  while (readyMs == null) {
    if (daemon.exitCode != null) throw new Error(`daemon exited early; see ${logFile}`);
    if (fs.existsSync(logFile)) {
      const log = fs.readFileSync(logFile, "utf8");
      const m = log.match(/db-worker-node-ready.*?port=(\d+)/s);
      if (m) {
        port = Number(m[1]);
        readyMs = performance.now() - t0;
      }
    }
    if (readyMs == null && performance.now() - t0 > opts.spawnTimeoutMs) {
      throw new Error(`daemon did not become ready within ${opts.spawnTimeoutMs}ms; see ${logFile}`);
    }
    if (readyMs == null) await new Promise((r) => setTimeout(r, 250));
  }
  // confirm the HTTP surface is ready
  const ok = await fetch(`http://127.0.0.1:${port}/healthz`)
    .then((r) => r.ok)
    .catch(() => false);
  check("healthz ready after db-worker-node-ready", ok);
  return { readyMs, logFile };
}

async function stopDaemon() {
  if (!daemon || opts.keepDaemon) return;
  try { await fetch(`http://127.0.0.1:${port}/v1/shutdown`, { method: "POST" }); } catch {}
  try { process.kill(-daemon.pid, "SIGTERM"); } catch { try { daemon.kill("SIGTERM"); } catch {} }
}

// ---------- scenarios ----------

async function scenarioColdOpen(rec) {
  await rec.run("close-db", () => invoke("thread-api/close-db", [opts.repo]));
  const r = await rec.run("create-or-open-db", () =>
    invoke("thread-api/create-or-open-db", [opts.repo, tmap()]));
  check("reopen returns", r !== undefined);
}

async function discoverFixtures() {
  const tags = norm(await q("[:find ?t (count ?b) :where [?b :block/tags ?t]]"));
  // biggest tag that is not the builtin Page class
  const tag = tags.filter((t) => t[0] !== 135).sort((a, b) => b[1] - a[1])[0];
  const maxDay = norm(await q("[:find (max ?d) :where [?e :block/journal-day ?d]]"))[0][0];
  const je = norm(
    await q("[:find ?e ?u :in $ ?d :where [?e :block/journal-day ?d] [?e :block/uuid ?u]]", maxDay),
  )[0];
  // the builtin all-pages view = feature-type :all-pages with no
  // logseq.property.view/type override (a leftover bench view would carry one)
  const allPagesViews = norm(
    await q("[:find ?e ?t :where [?e :logseq.property.view/feature-type :all-pages] [?e :block/parent ?p] [?p :block/name \"$$$views\"] [(get-else $ ?e :logseq.property.view/type 0) ?t]]"),
  );
  const allPagesView = (allPagesViews.find((r) => !r[1]) || allPagesViews[0])[0];
  const viewsPage = norm(
    await q("[:find ?e ?u :where [?e :block/name \"$$$views\"] [?e :block/uuid ?u]]"),
  )[0];
  const blockPageProp = norm(await q("[:find ?e :where [?e :db/ident :block/page]]"))[0][0];
  const listTypeEnt = norm(
    await q("[:find ?e :where [?e :db/ident :logseq.property.view/type.list]]"),
  )[0][0];
  const parents = norm(
    await q("[:find ?p (count ?c) :where [?c :block/parent ?p] [?p :block/name ?n]]"),
  ).sort((a, b) => b[1] - a[1]);
  const heavyPage = parents[0][0];
  const heavyUuid = norm(
    await q("[:find ?u :in $ ?e :where [?e :block/uuid ?u]]", heavyPage),
  )[0][0];
  // last child of the journal page = insert target for outliner ops
  const jchildren = norm(
    await q("[:find ?u :in $ ?p :where [?c :block/parent ?p] [?c :block/uuid ?u]]", je[0]),
  ).map((r) => r[0]);
  return {
    tagEid: tag[0], tagCount: tag[1],
    journalDay: maxDay, journalUuid: je[1], journalEid: je[0],
    allPagesViewEid: allPagesView,
    viewsPageUuid: viewsPage[1], viewsPageEid: viewsPage[0],
    blockPagePropEid: blockPageProp, listTypeEid: listTypeEnt,
    heavyPageEid: heavyPage, heavyPageUuid: heavyUuid, heavyPageChildren: parents[0][1],
    journalChildUuids: jchildren,
  };
}

async function scenarioJournals(rec, fx) {
  const win = norm(await rec.run("journals-window", () =>
    invoke("thread-api/get-view-data", [opts.repo, null, tmap(kw("journals?"), true, kw("row-limit"), 30)])));
  check("journals-window count>0", win && win.count > 0, JSON.stringify(win).slice(0, 120));
  const snap = await rec.run("journal-children", () =>
    invoke("thread-api/get-render-snapshots", [
      opts.repo,
      tmap(kw("blocks"), [], kw("children"), [uuid(fx.journalUuid)], kw("resources"), []),
    ]));
  const slots = norm(snap).slots || {};
  const childItems = slots[`:children,${fx.journalUuid}`]?.items || [];
  check("journal children resolved", Array.isArray(childItems));
  const childUuids = childItems.map((i) => i[0]);
  if (childUuids.length > 0) {
    await rec.run("journal-children-render", () =>
      invoke("thread-api/get-render-snapshots", [
        opts.repo,
        tmap(kw("blocks"), childUuids.map(uuid), kw("children"), [], kw("resources"), []),
      ]));
  }
}

async function scenarioTableViews(rec, fx) {
  for (let i = 0; i < opts.iters; i += 1) {
    const first = norm(await rec.run("all-pages.window0", () =>
      invoke("thread-api/get-view-data", [
        opts.repo, fx.allPagesViewEid, tmap(kw("row-limit"), 200, kw("row-offset"), 0)])));
    check("all-pages window0 rows", Array.isArray(first.data) && first.data.length === 200);
    const deep = norm(await rec.run("all-pages.offset20000", () =>
      invoke("thread-api/get-view-data", [
        opts.repo, fx.allPagesViewEid, tmap(kw("row-limit"), 200, kw("row-offset"), 20000)])));
    check("all-pages deep rows", Array.isArray(deep.data) && deep.data.length === 200);
    const tagFirst = norm(await rec.run("tag-view.window0", () =>
      invoke("thread-api/get-view-data", [
        opts.repo, null,
        tmap(kw("view-feature-type"), kw("class-objects"),
          kw("view-for-id"), fx.tagEid, kw("row-limit"), 200)])));
    check("tag-view rows", Array.isArray(tagFirst.data) && tagFirst.data.length > 0);
    const deepOffset = Math.max(0, fx.tagCount - 400);
    const tagDeep = norm(await rec.run(`tag-view.offset${deepOffset}`, () =>
      invoke("thread-api/get-view-data", [
        opts.repo, null,
        tmap(kw("view-feature-type"), kw("class-objects"),
          kw("view-for-id"), fx.tagEid, kw("row-limit"), 200, kw("row-offset"), deepOffset)])));
    check("tag-view deep rows", Array.isArray(tagDeep.data) && tagDeep.data.length > 0);
  }
}

const eidsToUuids = async (eids) =>
  norm(await q("[:find ?u :in $ [?e ...] :where [?e :block/uuid ?u]]", eids)).map((r) => r[0]);

async function createView(fx, { title, featureType, viewTypeEid, groupByPropEid }) {
  const vu = uuid(crypto.randomUUID());
  const props = [
    kw("block/uuid"), vu,
    kw("block/title"), title,
    kw("logseq.property.view/feature-type"), kw(featureType),
  ];
  if (featureType === "all-pages") props.push(kw("logseq.property/view-for"), fx.viewsPageEid);
  else props.push(kw("logseq.property/view-for"), fx.tagEid);
  if (viewTypeEid) props.push(kw("logseq.property.view/type"), viewTypeEid);
  if (groupByPropEid) props.push(kw("logseq.property.view/group-by-property"), groupByPropEid);
  await invoke("thread-api/apply-outliner-ops", [
    opts.repo,
    [[kw("insert-blocks"), [
      [tmap(...props)],
      uuid(fx.viewsPageUuid),
      tmap(kw("sibling?"), false, kw("outliner-op"), kw("create-view"), kw("keep-uuid?"), true),
    ]]],
    tmap(),
  ]);
  const eid = norm(await q("[:find ?e :in $ ?u :where [?e :block/uuid ?u]]", vu))[0][0];
  return { eid, uuid: vu };
}

async function scenarioListViews(rec, fx) {
  // list-mode all-pages view (list flag on the view entity)
  const allPagesList = await createView(fx, {
    title: "perf-bench all-pages list",
    featureType: "all-pages",
    viewTypeEid: fx.listTypeEid,
  });
  // list-mode linked-references view of the biggest tag (nested groups —
  // the create-view! shape for linked-references: type=list +
  // group-by-property=block/page)
  const linkedList = await createView(fx, {
    title: "perf-bench linked list",
    featureType: "linked-references",
    viewTypeEid: fx.listTypeEid,
    groupByPropEid: fx.blockPagePropEid,
  });
  fx._createdBlocks.push(allPagesList.uuid, linkedList.uuid);

  for (let i = 0; i < opts.iters; i += 1) {
    const r0 = norm(await rec.run("list-view.all-pages.window0", () =>
      invoke("thread-api/get-view-data", [opts.repo, allPagesList.eid, tmap(kw("row-limit"), 200)])));
    check("list all-pages rows", Array.isArray(r0.data) && r0.data.length === 200);
    const rl = norm(await rec.run("list-view.linked.window0", () =>
      invoke("thread-api/get-view-data", [opts.repo, linkedList.eid, tmap(kw("row-limit"), 200)])));
    check("list linked response", rl && (Array.isArray(rl.data) || Array.isArray(rl.groups) || rl.count != null));
    if (i === 0) {
      const uuids25 = await eidsToUuids(r0.data.slice(0, 25));
      const uuids200 = await eidsToUuids(r0.data.slice(0, 200));
      await rec.run("list-view.snap.blocks25", () =>
        invoke("thread-api/get-render-snapshots", [
          opts.repo,
          tmap(kw("blocks"), uuids25.map(uuid), kw("children"), [], kw("resources"), []),
        ]));
      await rec.run("list-view.snap.blocks200", () =>
        invoke("thread-api/get-render-snapshots", [
          opts.repo,
          tmap(kw("blocks"), uuids200.map(uuid), kw("children"), [], kw("resources"), []),
        ]));
      await rec.run("list-view.snap.children25", () =>
        invoke("thread-api/get-render-snapshots", [
          opts.repo,
          tmap(kw("blocks"), [], kw("children"), uuids25.map(uuid), kw("resources"), []),
        ]));
    }
  }
}

async function scenarioPageTree(rec, fx) {
  for (let i = 0; i < opts.iters; i += 1) {
    const snap = norm(await rec.run("page-tree.children", () =>
      invoke("thread-api/get-render-snapshots", [
        opts.repo,
        tmap(kw("blocks"), [], kw("children"), [uuid(fx.heavyPageUuid)], kw("resources"), []),
      ])));
    const items = snap.slots?.[`:children,${fx.heavyPageUuid}`]?.items || [];
    check("page children>0", items.length > 0);
    const childUuids = items.map((x) => x[0]).slice(0, 25).map(uuid);
    if (childUuids.length > 0) {
      // expand each visible child (FE requests children per row)
      await rec.run("page-tree.grandchildren", () =>
        invoke("thread-api/get-render-snapshots", [
          opts.repo,
          tmap(kw("blocks"), [], kw("children"), childUuids, kw("resources"), []),
        ]));
      // then render the child blocks
      await rec.run("page-tree.blocks", () =>
        invoke("thread-api/get-render-snapshots", [
          opts.repo,
          tmap(kw("blocks"), childUuids, kw("children"), [], kw("resources"), []),
        ]));
    }
  }
}

async function scenarioOutliner(rec, fx) {
  const targetUuid = fx.journalChildUuids[0] || fx.journalUuid;
  const newBlock = uuid(crypto.randomUUID());
  fx._createdBlocks.push(newBlock);
  for (let i = 0; i < opts.iters; i += 1) {
    // enter: insert empty sibling after the last journal child
    await rec.run("op.enter", () =>
      invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("insert-blocks"), [
          [tmap(kw("block/uuid"), newBlock, kw("block/title"), "")],
          uuid(targetUuid),
          tmap(kw("sibling?"), true, kw("outliner-op"), kw("insert-blocks"), kw("keep-uuid?"), true),
        ]]],
        tmap(kw("outliner-op"), kw("insert-blocks"), kw("editor-row-uuids"), [uuid(targetUuid)]),
      ]));
    // indent under previous sibling
    await rec.run("op.indent", () =>
      invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("indent-outdent-blocks"), [[newBlock], true, tmap(kw("outliner-op"), kw("indent-blocks"))]]],
        tmap(kw("outliner-op"), kw("indent-blocks")),
      ]));
    // outdent back
    await rec.run("op.outdent", () =>
      invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("indent-outdent-blocks"), [[newBlock], false, tmap(kw("outliner-op"), kw("outdent-blocks"))]]],
        tmap(kw("outliner-op"), kw("outdent-blocks")),
      ]));
    // paste a 10-block nested tree (levels like the clipboard path produces)
    const levels = [1, 2, 2, 3, 3, 2, 1, 2, 3, 1];
    const puuids = levels.map(() => uuid(crypto.randomUUID()));
    fx._createdBlocks.push(...puuids);
    const pblocks = levels.map((lv, i) =>
      tmap(kw("block/uuid"), puuids[i], kw("block/title"), `bench paste ${i}`, kw("block/level"), lv));
    await rec.run("op.paste10", () =>
      invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("insert-blocks"), [
          pblocks, newBlock,
          tmap(kw("sibling?"), true, kw("outliner-op"), kw("paste"),
            kw("keep-uuid?"), true, kw("replace-empty-target?"), false),
        ]]],
        tmap(kw("outliner-op"), kw("paste")),
      ]));
    // delete pasted roots + the enter block
    const roots = puuids.filter((_, i) => levels[i] === 1);
    await rec.run("op.delete", () =>
      invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("delete-blocks"), [[newBlock, ...roots], tmap(kw("outliner-op"), kw("delete-blocks"))]]],
        tmap(kw("outliner-op"), kw("delete-blocks")),
      ]));
    // recreate the enter block for the next iteration / for cleanup
    if (i + 1 < opts.iters) {
      await invoke("thread-api/apply-outliner-ops", [
        opts.repo,
        [[kw("insert-blocks"), [
          [tmap(kw("block/uuid"), newBlock, kw("block/title"), "")],
          uuid(targetUuid),
          tmap(kw("sibling?"), true, kw("outliner-op"), kw("insert-blocks"), kw("keep-uuid?"), true),
        ]]],
        tmap(),
      ]);
    }
  }
}

async function cleanup(fx) {
  // delete every block the probe created (views + outliner ops leftovers)
  const created = fx._createdBlocks.filter(Boolean);
  if (created.length === 0) return;
  try {
    await invoke("thread-api/apply-outliner-ops", [
      opts.repo,
      [[kw("delete-blocks"), [created, tmap(kw("outliner-op"), kw("delete-blocks"))]]],
      tmap(kw("outliner-op"), kw("delete-blocks")),
    ]);
  } catch (e) {
    fail(`cleanup delete-blocks: ${e.message}`);
  }
  // leftover check: any of the created uuids still resolvable?
  const res = norm(
    await q("[:find ?e :in $ [?u ...] :where [?e :block/uuid ?u]]", created),
  );
  const left = Array.isArray(res) ? res.length : 0;
  check("cleanup leaves no blocks", left === 0, `${left} blocks left`);
}

// ---------- report ----------
function report(extra) {
  console.log("\n## db-worker perf — 4k movies graph\n");
  console.log(`bundle: ${opts.workerBundle}`);
  console.log(`repo: ${opts.repo} · graphs-dir: ${opts.graphsDir} · iters: ${opts.iters}`);
  for (const [k, v] of Object.entries(extra)) console.log(`${k}: ${v}`);
  console.log("\n| scenario | call | n | median ms | min ms | max ms |");
  console.log("|---|---|---|---|---|---|");
  const jsonRows = [];
  for (const rec of recs) {
    const byKey = new Map();
    for (const c of rec.calls) {
      if (!byKey.has(c.label)) byKey.set(c.label, []);
      byKey.get(c.label).push(c.ms);
    }
    for (const [label, times] of byKey) {
      const sorted = [...times].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      console.log(
        `| ${rec.name} | ${label} | ${times.length} | ${med.toFixed(1)} | ${sorted[0].toFixed(1)} | ${sorted[sorted.length - 1].toFixed(1)} |`,
      );
      jsonRows.push({
        scenario: rec.name, call: label, n: times.length,
        median_ms: med, min_ms: sorted[0], max_ms: sorted[sorted.length - 1],
      });
    }
  }
  if (opts.jsonOut) fs.writeFileSync(opts.jsonOut, JSON.stringify(jsonRows, null, 2));
  console.log(failures === 0 ? "\nPASS (timings reported; no wall-clock gates)" : `\n${failures} FAILURE(S)`);
  return failures === 0;
}

// ---------- main ----------
(async () => {
  await ensureGraph();
  let coldReady = null;
  let logFile = null;
  if (opts.attach) {
    port = opts.attach;
    const ok = await fetch(`http://127.0.0.1:${port}/healthz`)
      .then((r) => r.ok && r.json().then((j) => j.status === "ready"))
      .catch(() => false);
    if (!ok) throw new Error(`no ready daemon on port ${port}`);
  } else {
    const t = await startDaemon();
    coldReady = t.readyMs;
    logFile = t.logFile;
    console.log(`daemon ready on :${port} in ${(coldReady / 1000).toFixed(1)}s (log ${logFile})`);
  }

  const exitCode = await (async () => {
    const fx = { _createdBlocks: [] };
    try {
      const coldRec = recorder("cold-start");
      if (coldReady != null) coldRec.calls.push({ label: "daemon-ready", ms: coldReady });
      await scenarioColdOpen(coldRec);

      Object.assign(fx, await discoverFixtures());
      console.log(
        `fixtures: tag eid=${fx.tagEid} (${fx.tagCount} members) · ` +
          `journal day=${fx.journalDay} uuid=${fx.journalUuid} · ` +
          `all-pages view eid=${fx.allPagesViewEid} · ` +
          `heavy page eid=${fx.heavyPageEid} (${fx.heavyPageChildren} children)`,
      );

      await scenarioJournals(recorder("journals"), fx);
      await scenarioTableViews(recorder("table-views"), fx);
      await scenarioListViews(recorder("list-views"), fx);
      await scenarioPageTree(recorder("page-tree"), fx);
      await scenarioOutliner(recorder("outliner-ops"), fx);
      await cleanup(fx);
    } catch (e) {
      fail(e.stack || String(e));
      await cleanup(fx).catch(() => {});
    }
    return report({
      journal: `day ${fx.journalDay}`,
      "heavy page": `eid ${fx.heavyPageEid}`,
      "tag view": `eid ${fx.tagEid} (${fx.tagCount} objects)`,
      "daemon log": logFile || "(attached)",
    }) ? 0 : 1;
  })();

  await stopDaemon();
  process.exit(exitCode);
})().catch(async (e) => {
  console.log(`FAIL ${e.stack || e}`);
  await stopDaemon();
  process.exit(1);
});
