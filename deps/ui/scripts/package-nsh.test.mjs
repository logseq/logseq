// Exercise package ownership/freshness and installed launch paths without builds.
import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const receiptSource = path.resolve(process.env.LUI_SOURCE_ROOT ?? path.join(scripts, "../../../../lui"), "tooling/lui_build_receipt.mjs");
const portable = value => value.split(path.sep).join("/");
async function fixture() {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "logseq-nsh-package-")));
  const repo = path.join(root, "checkout");
  const output = path.join(repo, "deps/ui/_build/nsh");
  const resources = path.join(repo, "deps/ui/_build/Resources");
  const luiSource = path.join(root, "lui");
  const write = (file, content, executable = false) => {
    mkdirSync(path.dirname(file), {recursive:true});
    writeFileSync(file, content, executable ? {mode:0o755} : undefined);
  };
  const localScripts = path.join(repo, "deps/ui/scripts");
  mkdirSync(localScripts, {recursive:true});
  for (const file of ["package-nsh.mjs", "package-nsh.sh", "launch-nsh.sh"])
    copyFileSync(path.join(scripts, file), path.join(localScripts, file));
  mkdirSync(path.join(luiSource, "tooling"), {recursive:true});
  copyFileSync(receiptSource, path.join(luiSource, "tooling/lui_build_receipt.mjs"));
  const api = await import(pathToFileURL(path.join(luiSource, "tooling/lui_build_receipt.mjs")).href);
  const helper = await import(pathToFileURL(path.join(localScripts, "package-nsh.mjs")).href);
  const host = path.join(output, "logseq-nsh");
  const library = path.join(output, "liblogseq_ui.so");
  const source = path.join(repo, "deps/ui/nsh/src/lib.rs");
  write(host, "qualified native executable", true);
  write(library, "qualified OCaml library");
  write(source, "qualified application source");
  write(path.join(resources, "logseq-db-worker"), "qualified native worker", true);
  write(path.join(resources, "fonts/app.ttf"), "qualified font");
  write(path.join(resources, "maintained-backend-output.txt"), "must not enter NSH archive");
  const relative = file => portable(path.relative(root, file));
  const inputs = [library, path.dirname(source), path.join(resources, "logseq-db-worker"),
    path.join(resources, "fonts/app.ttf")].map(relative);
  const receiptFile = api.writeReceipt({artifact:host, root, inputs, command:"build qualified app"});
  const receipt = JSON.parse(readFileSync(receiptFile, "utf8"));
  receipt.ownedResources = ["logseq-db-worker", "fonts/app.ttf"];
  writeFileSync(receiptFile, JSON.stringify(receipt));
  const bin = path.join(root, "candidate/Logseq-NSH/bin");
  const destination = path.join(root, "candidate/Logseq-NSH/Resources");
  const snapshot = path.join(root, "candidate/snapshot.json");
  const options = {host, library, resources, bin, destination, snapshot, luiSource};
  return {root, output, repo, helper, api, options, source, receiptFile, write,
    close:() => rmSync(root, {recursive:true, force:true})};
}

test("packaging copies only qualified owned resources and records the final archive", async () => {
  const f = await fixture();
  try {
    await f.helper.stage(f.options);
    assert.equal(readFileSync(path.join(f.options.bin, "logseq-nsh"), "utf8"), "qualified native executable");
    assert.equal(readFileSync(path.join(f.options.destination, "liblogseq_ui.so"), "utf8"), "qualified OCaml library");
    assert.equal(readFileSync(path.join(f.options.destination, "fonts/app.ttf"), "utf8"), "qualified font");
    assert.equal(existsSync(path.join(f.options.destination, "maintained-backend-output.txt")), false);
    const manifest = JSON.parse(readFileSync(path.join(f.options.destination, "nsh-build.json"), "utf8"));
    assert.equal(manifest.sourceArtifactSha256, f.api.digestArtifact(f.options.host));
    const archive = path.join(f.root, "candidate/archive.tar.gz");
    const finalArchive = path.join(f.root, "packages/archive.tar.gz");
    f.write(archive, "final archive bytes after relocation and signing");
    await f.helper.finish({snapshot:f.options.snapshot, archive, finalArchive});
    mkdirSync(path.dirname(finalArchive));
    copyFileSync(archive, finalArchive);
    copyFileSync(`${archive}.lui-build.json`, `${finalArchive}.lui-build.json`);
    assert.equal(f.api.checkReceipt(finalArchive).fresh, true);
    f.write(finalArchive, "changed installed archive");
    assert.equal(f.api.checkReceipt(finalArchive).fresh, false);
  } finally { f.close(); }
});

test("stale qualified code and an unreceipted library cannot be packaged", async () => {
  const f = await fixture();
  try {
    const outside = path.join(f.output, "other-library.so");
    f.write(outside, "not qualified");
    await assert.rejects(f.helper.stage({...f.options, library:outside}), /not covered/);
    f.write(f.options.host, "changed native executable");
    await assert.rejects(f.helper.stage(f.options), /changed|stale/);
  } finally { f.close(); }
});

test("resource ownership cannot escape the qualified Resources directory", async () => {
  const f = await fixture();
  try {
    const receipt = JSON.parse(readFileSync(f.receiptFile, "utf8"));
    receipt.ownedResources.push("../../private-file");
    writeFileSync(f.receiptFile, JSON.stringify(receipt));
    await assert.rejects(f.helper.stage(f.options), /Invalid owned resource path/);
  } finally { f.close(); }
});

test("changed or newly added source refuses a receipt without replacing an older package", async () => {
  for (const addition of [false, true]) {
    const f = await fixture();
    try {
      await f.helper.stage(f.options);
      const archive = path.join(f.root, "candidate/archive.zip");
      const finalArchive = path.join(f.root, "packages/archive.zip");
      f.write(archive, "unpublished candidate");
      f.write(finalArchive, "previous verified package");
      f.write(addition ? path.join(path.dirname(f.source), "new.rs") : f.source, "new source");
      await assert.rejects(f.helper.finish({snapshot:f.options.snapshot, archive, finalArchive}), /stale|changed/i);
      assert.equal(readFileSync(finalArchive, "utf8"), "previous verified package");
      assert.equal(existsSync(`${archive}.lui-build.json`), false);
    } finally { f.close(); }
  }
});

test("installed launcher resolves private code, worker and resources outside a checkout", () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "logseq native archive ")));
  try {
    const bin = path.join(root, "installed app/bin");
    const elsewhere = path.join(root, "unrelated working directory");
    mkdirSync(bin, {recursive:true});
    mkdirSync(elsewhere);
    const launcher = path.join(bin, "logseq");
    copyFileSync(path.join(scripts, "launch-nsh.sh"), launcher);
    writeFileSync(path.join(bin, "logseq-nsh"), `#!${process.execPath}
console.log(JSON.stringify({library:process.env.LUI_OCAML_LIBRARY,assets:process.env.LOGSEQ_NATIVE_ASSET_DIR,worker:process.env.LOGSEQ_DB_WORKER_BIN,args:process.argv.slice(2)}));
`, {mode:0o755});
    const run = spawnSync("sh", [launcher, "--fixture", "Unicode 日本語"], {cwd:elsewhere, encoding:"utf8",
      env:{...process.env, LUI_OCAML_LIBRARY:"wrong", LOGSEQ_NATIVE_ASSET_DIR:"wrong", LOGSEQ_DB_WORKER_BIN:"wrong"}});
    assert.equal(run.status, 0, run.stderr);
    const actual = JSON.parse(run.stdout);
    const resources = path.join(bin, "../Resources");
    assert.equal(path.resolve(actual.assets), resources);
    assert.equal(path.resolve(actual.worker), path.join(resources, "logseq-db-worker"));
    assert.equal(path.resolve(actual.library), path.join(resources, process.platform === "darwin" ? "liblogseq_ui.dylib" : "liblogseq_ui.so"));
    assert.deepEqual(actual.args, ["--fixture", "Unicode 日本語"]);
  } finally { rmSync(root, {recursive:true, force:true}); }
});
