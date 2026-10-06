#!/usr/bin/env node
/**
 * File-parallel runner for the ocaml-e2e (Melange) test suite.
 *
 * Each compiled test file under `_build/default/test/test_node/test/*.js`
 * spawns its own browser/contexts and graphs, so files run safely in
 * parallel — except `test_rtc_*`, which share the same RTC backend account
 * and run on a limited lane (default concurrency 4 — higher values were
 * flaky under CPU oversubscription; keep rtc-concurrency <= -j).
 *
 * Big files are auto-sharded by test name (`--test-name-pattern`) so no
 * single file can dominate wall time. Two mega RTC tests (~5min each on
 * their own) are classified "slow" and skipped by default — they alone
 * exceed the ~3min budget. Use --include-slow to run them.
 *
 * Usage:
 *   node parallel-runner.mjs [options] [file-substring ...]
 *
 * Options:
 *   -j, --concurrency N   worker slots (default: min(8, nproc))
 *       --rtc-concurrency N  parallel slots for test_rtc_* (default: 4)
 *       --slow-mo MS      E2E_SLOW_MO for spawned tests (default: env or 30)
 *       --timeout SEC     per-file timeout (default: 1200)
 *       --shard FILE=N    split FILE into N name-pattern shards (repeatable)
 *       --shard-auto S    auto-shard files whose estimated duration > S secs
 *                         (default: 45; estimates from --timings / newest
 *                         timings.json / built-in table; 0 = off)
 *       --timings PATH    timings.json for shard estimates
 *                         (default: newest timings.json under .parallel-logs;
 *                         "none" to disable)
 *       --include-slow    also run SLOW_TESTS (skipped by default)
 *       --exclude SUB     skip files containing SUB (repeatable)
 *       --no-rtc          skip RTC files entirely
 *       --list            print the run plan and exit
 *       --log-dir DIR     per-file log dir (default: .parallel-logs/<ts>)
 *
 * Positional args filter to files whose name contains the arg (OR).
 * Exit code: 0 when every selected file passes.
 */
import { spawn } from "node:child_process";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const TEST_DIR = path.join(HERE, "_build/default/test/test_node/test");

// Tests too long to ever fit the ~3min wall budget: each alone exceeds it.
// Skipped unless --include-slow; they still get their own task entries so
// they run in parallel with everything else when enabled.
const SLOW_TESTS = new Set([
  "online-two-clients-undo-redo-stress-test",
  "rtc-task-blocks-test",
]);

// Built-in per-file serial estimates (seconds of test-body time, measured
// 2026-10-05). Used when no timings.json is available so --shard-auto works
// out of the box; a timings file refines packing with per-test times.
const DEFAULT_EST_SECS = {
  "test_assets_basic.js": 28.0,
  "test_bidirectional_properties.js": 16.2,
  "test_block_property_basic.js": 118.9,
  "test_cmdk_scroll_basic.js": 64.8,
  "test_commands_basic.js": 218.1,
  "test_editor_basic.js": 594.9,
  "test_export_basic.js": 17.8,
  "test_flashcards_basic.js": 19.7,
  "test_graph.js": 0.0,
  "test_graph_navigation_basic.js": 125.0,
  "test_import_basic.js": 12.6,
  "test_left_sidebar_basic.js": 12.8,
  "test_library_basic.js": 26.2,
  "test_multi_tabs.js": 73.2,
  "test_outliner_basic.js": 222.3,
  "test_plugins_basic.js": 78.2,
  "test_plugins_marketplace.js": 39.7,
  "test_property_basic.js": 47.6,
  "test_property_config_basic.js": 54.0,
  "test_property_scoped_choices.js": 42.5,
  "test_query_builder_basic.js": 25.5,
  "test_query_results_basic.js": 100.8,
  "test_reference_basic.js": 40.5,
  "test_right_sidebar.js": 23.8,
  "test_rtc_basic.js": 101.9,
  "test_rtc_extra.js": 762.6,
  "test_rtc_extra_part2.js": 568.8,
  "test_tag_basic.js": 33.8,
  "test_undo_redo.js": 32.8,
  "test_view_basic.js": 77.3,
};

const args = process.argv.slice(2);
const opt = {
  concurrency: Math.min(8, os.cpus().length),
  rtcConcurrency: 4,
  slowMo: process.env.E2E_SLOW_MO ?? "30",
  timeoutSec: 1200,
  slowTimeoutSec: 1800, // rtc slow shards legitimately run 500-1200s under -j8
  excludes: [],
  noRtc: false,
  includeSlow: false,
  listOnly: false,
  logDir: null,
  shards: {}, // file -> N
  shardAuto: 45, // seconds; 0 = off
  timings: "auto", // "auto" = newest .parallel-logs/*/timings.json
};
const filters = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const take = () => args[++i];
  if (a === "-j" || a === "--concurrency") opt.concurrency = +take();
  else if (a === "--rtc-concurrency") opt.rtcConcurrency = +take();
  else if (a === "--slow-mo") opt.slowMo = take();
  else if (a === "--timeout") opt.timeoutSec = +take();
  else if (a === "--slow-timeout") opt.slowTimeoutSec = +take();
  else if (a === "--exclude") opt.excludes.push(take());
  else if (a === "--shard") {
    const [f, n] = take().split("=");
    opt.shards[f.endsWith(".js") ? f : `${f}.js`] = +n;
  } else if (a === "--shard-auto") opt.shardAuto = +take();
  else if (a === "--timings") opt.timings = take();
  else if (a === "--no-rtc") opt.noRtc = true;
  else if (a === "--include-slow") opt.includeSlow = true;
  else if (a === "--list") opt.listOnly = true;
  else if (a === "--log-dir") opt.logDir = take();
  else if (a.startsWith("--concurrency=")) opt.concurrency = +a.split("=")[1];
  else if (a.startsWith("--rtc-concurrency=")) opt.rtcConcurrency = +a.split("=")[1];
  else if (a.startsWith("--slow-mo=")) opt.slowMo = a.split("=")[1];
  else if (a.startsWith("--timeout=")) opt.timeoutSec = +a.split("=")[1];
  else if (a.startsWith("-j")) opt.concurrency = +a.slice(2);
  else if (a === "-h" || a === "--help") {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1]);
    process.exit(0);
  } else if (a.startsWith("-")) {
    console.error(`unknown option: ${a}`);
    process.exit(2);
  } else filters.push(a);
}

const port = process.env.E2E_PORT ?? "3002";

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Test names appear in emitted JS as `Nodetest.test("name", ...)` — directly,
// or through one-letter helpers like `t("name", ...)` (test_editor_basic).
function extractNames(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const re = /(?:Nodetest\.test|[^A-Za-z0-9_$]t)\(\s*"([^"]+)"/g;
  const names = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(src))) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      names.push(m[1]);
    }
  }
  return names;
}

function allTimings() {
  const dir = path.join(HERE, ".parallel-logs");
  try {
    const found = [];
    for (const sub of fs.readdirSync(dir)) {
      const p = path.join(dir, sub, "timings.json");
      try {
        found.push({ p, mtime: fs.statSync(p).mtimeMs });
      } catch {}
    }
    return found.sort((a, b) => a.mtime - b.mtime).map((x) => x.p);
  } catch {
    return [];
  }
}

function loadEstimates() {
  const paths =
    opt.timings === "auto" ? allTimings() : opt.timings === "none" ? [] : [opt.timings];
  const byFile = {};
  for (const [file, secs] of Object.entries(DEFAULT_EST_SECS))
    byFile[file] = { tests: {}, secs };
  // Merge every timings file oldest→newest: a file's estimate comes from the
  // most recent run that covered it (partial runs don't poison the rest).
  for (const p of paths) {
    try {
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      // Aggregate shard entries of the same file before assigning.
      const perFile = {};
      for (const f of d.files ?? []) {
        const m = (perFile[f.file] ??= {});
        // Same name can appear twice (TAP + spec summary): keep the max.
        for (const t of f.tests ?? []) m[t.name] = Math.max(m[t.name] ?? 0, t.ms);
      }
      for (const [file, m] of Object.entries(perFile)) {
        const secs = Object.values(m).reduce((a, x) => a + x, 0) / 1000;
        byFile[file] = { tests: m, secs: secs || (byFile[file]?.secs ?? 0) };
      }
    } catch {}
  }
  return byFile;
}

// Split `names` into k roughly time-balanced groups (greedy LPT).
function packShards(names, estMs, k) {
  const bins = Array.from({ length: k }, () => ({ names: [], ms: 0 }));
  const sorted = [...names].sort((a, b) => (estMs[b] ?? 0) - (estMs[a] ?? 0));
  for (const n of sorted) {
    bins.sort((a, b) => a.ms - b.ms);
    bins[0].names.push(n);
    bins[0].ms += estMs[n] ?? 0;
  }
  return bins.filter((b) => b.names.length);
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function discover() {
  const all = fs
    .readdirSync(TEST_DIR)
    .filter((f) => /^test_.*\.js$/.test(f))
    .map((f) => {
      const p = path.join(TEST_DIR, f);
      return { file: f, path: p, rtc: f.startsWith("test_rtc_"), size: fs.statSync(p).size };
    });
  const picked = all
    .filter((t) => !(opt.noRtc && t.rtc))
    .filter((t) => !filters.length || filters.some((f) => t.file.includes(f)))
    .filter((t) => !opt.excludes.some((f) => t.file.includes(f)));
  const est = loadEstimates();
  const tasks = [];
  for (const t of picked) {
    const estSecs = est?.[t.file]?.secs ?? null;
    t.estSecs = estSecs;
    const names = extractNames(t.path);
    // Slow tests always get their own task so they can be skipped
    // independently; a file that is nothing but slow tests needs no shard.
    const slowNames = names.filter((n) => SLOW_TESTS.has(n));
    const normalNames = names.filter((n) => !SLOW_TESTS.has(n));
    for (const n of slowNames) {
      tasks.push({
        ...t,
        slow: true,
        shard: `slow:${n.slice(0, 20)}`,
        shardNames: [n],
        namePattern: `^${escRe(n)}$`,
        estSecs: (est?.[t.file]?.tests?.[n] ?? 0) / 1000 || null,
      });
    }
    if (!normalNames.length) continue; // file contained only slow tests
    if (names.length < 2) {
      tasks.push(t);
      continue;
    }
    const estMs = est?.[t.file]?.tests ?? {};
    const normalEstSecs =
      normalNames.reduce((a, n) => a + (estMs[n] ?? 0), 0) / 1000 ||
      (estSecs ?? 0) - slowNames.reduce((a, n) => a + (estMs[n] ?? 0), 0) / 1000 ||
      null;
    let k = opt.shards[t.file] ?? 1;
    if (
      k === 1 &&
      opt.shardAuto > 0 &&
      normalEstSecs != null &&
      normalEstSecs > opt.shardAuto
    )
      k = Math.max(2, Math.round(normalEstSecs / opt.shardAuto));
    if (slowNames.length && k === 1) k = 2; // mixed file: must shard to split slow out
    if (k <= 1) {
      tasks.push({ ...t, estSecs: normalEstSecs });
      continue;
    }
    if (slowNames.length && normalNames.length === 1) {
      // 1 normal + slow test(s): emit the normal test as its own task so the
      // slow test(s) stay excluded.
      const n = normalNames[0];
      tasks.push({
        ...t,
        shardNames: [n],
        namePattern: `^${escRe(n)}$`,
        estSecs: normalEstSecs,
      });
      continue;
    }
    k = Math.min(k, normalNames.length);
    const totalEstMs = Object.values(estMs).reduce((a, x) => a + x, 0);
    const meanMs =
      totalEstMs / Math.max(1, names.length) || (estSecs ?? 60) * 1000 / names.length;
    const bins = packShards(normalNames, new Proxy(estMs, { get: (o, n) => o[n] ?? meanMs }), k);
    bins.forEach((b, i) => {
      const frac =
        b.ms > 0 && totalEstMs > 0 ? b.ms / totalEstMs : b.names.length / normalNames.length;
      tasks.push({
        ...t,
        shard: `${i + 1}/${bins.length}`,
        shardNames: b.names,
        namePattern: `^(${b.names.map(escRe).join("|")})$`,
        estSecs: normalEstSecs != null ? normalEstSecs * frac : null,
        size: t.size * frac,
      });
    });
  }
  // Largest estimated cost first → decent LPT packing for the worker pool.
  // Estimated seconds when known (previous timings), else file size.
  return tasks.sort(
    (a, b) => (b.estSecs ?? b.size / 1000) - (a.estSecs ?? a.size / 1000),
  );
}

function parseTally(out) {
  const get = (k) => {
    const m = out.match(new RegExp(`^[\\u2139#] ${k} (\\d+)`, "m"));
    return m ? +m[1] : null;
  };
  return { tests: get("tests"), pass: get("pass"), fail: get("fail"), skipped: get("skipped") };
}

// Per-test durations: node --test prints `✔ name (12.3ms)` / `✖ name (...)`.
function parseTestTimes(out) {
  const rows = [];
  for (const line of out.split("\n")) {
    const m = line.match(/^[\u2714\u2716\u2718]\s+(?:\d+\s+-\s+)?(.+?)\s+\(([\d.]+)\s*ms\)\s*$/);
    if (m) rows.push({ name: m[1].trim(), ms: +m[2] });
  }
  return rows;
}

const logDir =
  opt.logDir ?? path.join(HERE, ".parallel-logs", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(logDir, { recursive: true });

async function runFile(t) {
  const label = t.shard ? `${t.file}#${t.shard}` : t.file;
  const log = path.join(
    logDir,
    t.file.replace(/\.js$/, t.shard ? `.shard${t.shard.replace("/", "-")}.log` : ".log"),
  );
  const stream = fs.createWriteStream(log);
  const started = Date.now();
  let outTail = "";
  let outFull = "";
  const args = t.namePattern
    ? ["--test", `--test-name-pattern=${t.namePattern}`, t.path]
    : ["--test", t.path];
  const result = await new Promise((resolve) => {
    const child = spawn("node", args, {
      cwd: HERE, // tests resolve ../clj-e2e resources relative to ocaml-e2e/
      env: { ...process.env, E2E_SLOW_MO: String(opt.slowMo) },
      detached: true, // own process group so timeout kills the browser too
      stdio: ["ignore", "pipe", "pipe"],
    });
    const onData = (d) => {
      stream.write(d);
      outFull += d;
      outTail = (outTail + d).split("\n").slice(-200).join("\n");
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    const timeoutSec = t.slow ? opt.slowTimeoutSec : opt.timeoutSec;
    const killer =
      timeoutSec > 0
        ? setTimeout(() => {
            try {
              process.kill(-child.pid, "SIGKILL");
            } catch {}
            resolve({ code: "timeout" });
          }, timeoutSec * 1000)
        : null;
    child.on("close", (code) => {
      clearTimeout(killer);
      resolve({ code: code === 0 ? 0 : code ?? -1 });
    });
    child.on("error", (e) => {
      clearTimeout(killer);
      resolve({ code: `spawn-error: ${e.message}` });
    });
  });
  const secs = (Date.now() - started) / 1000;
  stream.end();
  // node --test's TAP summary (# tests/# pass/# fail) is the tail of stdout;
  // outTail keeps the last 200 lines, which always covers it.
  const tally = parseTally(outFull);
  const testTimes = parseTestTimes(outFull);
  return { ...t, label, secs, result, tally, testTimes, log, tail: outTail };
}

const statusOf = (r) =>
  r.result.code === 0 ? "PASS" : r.result.code === "timeout" ? "TIMEOUT" : "FAIL";

async function main() {
  if (!fs.existsSync(TEST_DIR)) {
    console.error(`test dir missing: ${TEST_DIR}\nrun \`dune build\` in ocaml-e2e first`);
    process.exit(2);
  }
  const allTasks = discover();
  const skipped = opt.includeSlow ? [] : allTasks.filter((t) => t.slow);
  const tasks = allTasks.filter((t) => !t.slow || opt.includeSlow);
  if (!tasks.length) {
    console.error("no test files matched");
    process.exit(2);
  }
  console.log(
    `parallel-runner: ${tasks.length} tasks (${tasks.filter((t) => t.rtc).length} rtc` +
      `${skipped.length ? `, ${skipped.length} slow skipped` : ""}), ` +
      `concurrency=${opt.concurrency}, rtc-concurrency=${opt.rtcConcurrency}, ` +
      `E2E_SLOW_MO=${opt.slowMo}, timeout=${opt.timeoutSec}s, logs=${logDir}`,
  );
  if (opt.listOnly) {
    for (const t of tasks)
      console.log(
        `  ${t.rtc ? "[rtc]" : "     "} ${t.file}${t.shard ? `#${t.shard}` : ""}` +
          (t.estSecs != null ? `  (~${t.estSecs.toFixed(0)}s)` : ""),
      );
    for (const t of skipped)
      console.log(`  [skip] ${t.file} ${t.shardNames?.[0] ?? ""}  (slow — --include-slow to run)`);
    process.exit(0);
  }
  if (!(await checkServer())) {
    console.error(
      `\napp under test not reachable at http://localhost:${port}/\n` +
        `start it: python3 -m http.server ${port} -d static/  (from the repo root)`,
    );
    process.exit(2);
  }

  const queue = [...tasks];
  const results = [];
  let rtcRunning = 0;
  const workers = Array.from({ length: opt.concurrency }, async () => {
    for (;;) {
      const idx = queue.findIndex((t) => !t.rtc || rtcRunning < opt.rtcConcurrency);
      if (idx === -1) {
        // Either drained, or only rtc files remain and the rtc lane is full.
        if (!queue.length) return;
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      const [t] = queue.splice(idx, 1);
      if (t.rtc) rtcRunning++;
      const r = await runFile(t);
      if (t.rtc) rtcRunning--;
      results.push(r);
      const tally =
        r.tally.tests != null ? ` ${r.tally.pass}/${r.tally.tests} tests` : "";
      console.log(
        `${statusOf(r).padEnd(7)} ${r.label.padEnd(46)} ${r.secs.toFixed(1).padStart(7)}s${tally}`,
      );
    }
  });
  const t0 = Date.now();
  await Promise.all(workers);
  const wall = (Date.now() - t0) / 1000;

  results.sort((a, b) => b.secs - a.secs);
  const failures = results.filter((r) => r.result.code !== 0);
  if (skipped.length)
    console.log(
      `\nskipped slow tests (--include-slow to run):\n` +
        skipped.map((t) => `  ${t.file} ${t.shardNames?.[0]}`).join("\n"),
    );
  const sum = results.reduce((s, r) => s + r.secs, 0);
  let tests = 0,
    passed = 0;
  for (const r of results) {
    if (r.tally.tests != null) {
      tests += r.tally.tests;
      passed += r.tally.pass ?? 0;
    }
  }
  console.log("\n=== summary ===");
  console.log(`file                          result     wall-s    tests`);
  for (const r of results) {
    const tt = r.tally.tests != null ? `${r.tally.pass}/${r.tally.tests}` : "-";
    console.log(`${r.label.padEnd(32)}${statusOf(r).padEnd(10)}${r.secs.toFixed(1).padStart(8)}  ${tt.padStart(8)}`);
  }
  const allTests = results.flatMap((r) =>
    (r.testTimes ?? []).map((t) => ({ ...t, file: r.file })),
  );
  allTests.sort((a, b) => b.ms - a.ms);
  console.log("\n=== slowest tests ===");
  for (const t of allTests.slice(0, 25))
    console.log(`${(t.ms / 1000).toFixed(1).padStart(7)}s  ${t.file.padEnd(38)} ${t.name}`);
  const timingsPath = path.join(logDir, "timings.json");
  fs.writeFileSync(
    timingsPath,
    JSON.stringify(
      {
        wall_secs: wall,
        files: results.map(({ file, secs, result, tally, testTimes, log }) => ({
          file,
          secs,
          code: result.code,
          tally,
          tests: testTimes,
          log,
        })),
      },
      null,
      1,
    ),
  );
  console.log(`\nper-test timings: ${timingsPath}`);
  console.log(
    `\nfiles: ${results.length - failures.length}/${results.length} passed` +
      (tests ? `, tests: ${passed}/${tests} passed` : "") +
      `\nwall time: ${wall.toFixed(1)}s   (serial-equivalent Σ file times: ${sum.toFixed(1)}s, speedup ${(sum / wall).toFixed(1)}x)`,
  );
  for (const r of failures) {
    console.log(`\n--- last lines of ${r.label} (log: ${r.log}) ---`);
    console.log(r.tail.split("\n").slice(-25).join("\n"));
  }
  process.exit(failures.length ? 1 : 0);
}

main();
