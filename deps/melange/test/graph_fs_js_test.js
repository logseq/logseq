const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const graphFsJsApiModulePath = path.resolve(
  process.cwd(),
  process.env.LOGSEQ_MELANGE_JS_API_GRAPH_FS,
);
const { GraphFs } = require(graphFsJsApiModulePath);

function forwardSlashes(value) {
  return value.replaceAll("\\", "/");
}

function createTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "melange-graph-fs-"));
  const outside = fs.mkdtempSync(
    path.join(os.tmpdir(), "melange-graph-fs-outside-"),
  );

  for (const directory of [
    "journals",
    "pages",
    ".hidden",
    "logseq/bak",
    "mirror/markdown/pages",
  ]) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }

  for (const [relativePath, content = ""] of [
    ["journals/2026_07_13.org"],
    ["pages/页面.md", "Unicode"],
    ["pages/ignored.txt"],
    [".hidden.md"],
    [".hidden/inside.md"],
    ["logseq/bak/backup.md"],
    ["mirror/markdown/pages/mirrored.md"],
  ]) {
    fs.writeFileSync(path.join(root, relativePath), content);
  }

  fs.writeFileSync(path.join(outside, "linked.md"), "linked");
  fs.symlinkSync(
    outside,
    path.join(root, "linked"),
    process.platform === "win32" ? "junction" : "dir",
  );

  return { outside, root };
}

test("node graph filesystem API exposes the complete synchronous surface", () => {
  for (const name of [
    "readdir",
    "readDirectories",
    "getFiles",
    "getDefaultGraphsDir",
    "expandHome",
    "getDbGraphsDir",
    "getDbBasedGraphs",
    "getDbBasedGraphsInDir",
  ]) {
    assert.equal(typeof GraphFs?.[name], "function", `${name} should be a function`);
  }
});

test("readdir recursively preserves visible non-symlink files and normalized paths", () => {
  const { outside, root } = createTree();
  try {
    assert.deepEqual(
      [...GraphFs.readdir(root)].sort(),
      [
        "journals/2026_07_13.org",
        "logseq/bak/backup.md",
        "mirror/markdown/pages/mirrored.md",
        "pages/ignored.txt",
        "pages/页面.md",
      ]
        .map((relativePath) => forwardSlashes(path.join(root, relativePath)))
        .sort(),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("readDirectories returns only visible non-symlink directory names", () => {
  const { outside, root } = createTree();
  try {
    assert.deepEqual(
      [...GraphFs.readDirectories(root)].sort(),
      ["journals", "logseq", "mirror", "pages"],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("getFiles applies graph ignored-path and recognized-extension policy", () => {
  const { outside, root } = createTree();
  try {
    assert.deepEqual(
      [...GraphFs.getFiles(root)].sort(),
      ["journals/2026_07_13.org", "pages/页面.md"]
        .map((relativePath) => forwardSlashes(path.join(root, relativePath)))
        .sort(),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("filesystem failures propagate with their original Node error", () => {
  const missing = path.join(
    os.tmpdir(),
    `melange-graph-fs-missing-${process.pid}-${Date.now()}`,
  );
  assert.throws(
    () => GraphFs.readdir(missing),
    (error) => error?.code === "ENOENT" && error?.path === missing,
  );
  assert.throws(
    () => GraphFs.readDirectories(missing),
    (error) => error?.code === "ENOENT" && error?.path === missing,
  );
});

test("default graph directory and home expansion preserve environment edge cases", () => {
  const key = "LOGSEQ_GRAPHS_DIR";
  const hadValue = Object.hasOwn(process.env, key);
  const previous = process.env[key];

  try {
    delete process.env[key];
    assert.equal(GraphFs.getDefaultGraphsDir(), "~/logseq/graphs");
    assert.equal(GraphFs.getDbGraphsDir(), path.join(os.homedir(), "/logseq/graphs"));

    process.env[key] = "";
    assert.equal(GraphFs.getDefaultGraphsDir(), "");

    process.env[key] = "/tmp/页面";
    assert.equal(GraphFs.getDefaultGraphsDir(), "/tmp/页面");
    assert.equal(GraphFs.getDbGraphsDir(), "/tmp/页面");

    assert.equal(GraphFs.expandHome("~"), os.homedir());
    assert.equal(GraphFs.expandHome("~/graphs"), path.join(os.homedir(), "/graphs"));
    assert.equal(GraphFs.expandHome("~other/graphs"), path.join(os.homedir(), "other/graphs"));
    assert.equal(GraphFs.expandHome("/tmp/graphs"), "/tmp/graphs");
    assert.equal(GraphFs.expandHome(""), "");
  } finally {
    if (hadValue) process.env[key] = previous;
    else delete process.env[key];
  }
});

test("DB graph discovery creates the root and returns stable canonical repos", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "melange-db-graphs-"));
  const graphsDir = path.join(parent, "graphs");
  try {
    assert.deepEqual(GraphFs.getDbBasedGraphsInDir(graphsDir), []);
    assert.equal(fs.statSync(graphsDir).isDirectory(), true);

    for (const directory of [
      "demo",
      "logseq_db_demo",
      "logseq_db_logseq_db_demo",
      "logseq_local_file-graph",
      "Unlinked graphs",
      "foo~2Fbar",
      "a~3Ab",
      "space name",
      "space~20name",
      "space%20name",
      "foo++bar",
      "a+3A+b",
      ".hidden",
    ]) {
      fs.mkdirSync(path.join(graphsDir, directory));
    }
    fs.writeFileSync(path.join(graphsDir, "not-a-directory"), "file");

    assert.deepEqual([...GraphFs.getDbBasedGraphsInDir(graphsDir)].sort(), [
      "logseq_db_a:b",
      "logseq_db_demo",
      "logseq_db_foo/bar",
      "logseq_db_space name",
    ]);

    const key = "LOGSEQ_GRAPHS_DIR";
    const hadValue = Object.hasOwn(process.env, key);
    const previous = process.env[key];
    try {
      process.env[key] = graphsDir;
      assert.deepEqual([...GraphFs.getDbBasedGraphs()].sort(), [
        "logseq_db_a:b",
        "logseq_db_demo",
        "logseq_db_foo/bar",
        "logseq_db_space name",
      ]);
    } finally {
      if (hadValue) process.env[key] = previous;
      else delete process.env[key];
    }
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
