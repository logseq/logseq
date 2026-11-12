// Exercise package ownership/freshness and installed launch paths without builds.
import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {createRequire, syncBuiltinESMExports} from "node:module";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const receiptSource = path.resolve(process.env.LUI_SOURCE_ROOT ?? path.join(scripts, "../../../../lui"), "tooling/lui_build_receipt.mjs");
const portable = value => value.split(path.sep).join("/");
const require = createRequire(import.meta.url);
async function fixture({validator = false, platform = "linux"} = {}) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "logseq-nsh-package-")));
  const repo = path.join(root, "checkout");
  const output = path.join(repo, "deps/ui/_build/nsh");
  const resources = platform === "windows" ? path.join(output, "Resources") : path.join(repo, "deps/ui/_build/Resources");
  const luiSource = path.join(root, "lui");
  const write = (file, content, executable = false) => {
    mkdirSync(path.dirname(file), {recursive:true});
    writeFileSync(file, content, executable ? {mode:0o755} : undefined);
  };
  const localScripts = path.join(repo, "deps/ui/scripts");
  mkdirSync(localScripts, {recursive:true});
  for (const file of ["package-nsh.mjs", "package-nsh.sh", "launch-nsh.sh"])
    copyFileSync(path.join(scripts, file), path.join(localScripts, file));
  mkdirSync(path.join(repo, "deps/ui/nsh"), {recursive:true});
  copyFileSync(path.join(scripts, "../nsh/package_windows.py"), path.join(repo, "deps/ui/nsh/package_windows.py"));
  write(path.join(repo, "resources/package.json"), JSON.stringify({version:"2.0.2"}));
  write(path.join(repo, "deps/ui/nsh/nsh.json"), JSON.stringify({name:"Logseq", id:"com.logseq.logseq", build:1}));
  write(path.join(repo, "package.json"), JSON.stringify({private:true}));
  write(path.join(repo, "pnpm-lock.yaml"), "qualified package lock");
  mkdirSync(path.join(repo, "node_modules"));
  cpSync(path.dirname(require.resolve("semver/package.json")), path.join(repo, "node_modules/semver"), {recursive:true});
  mkdirSync(path.join(luiSource, "tooling"), {recursive:true});
  copyFileSync(receiptSource, path.join(luiSource, "tooling/lui_build_receipt.mjs"));
  const api = await import(pathToFileURL(path.join(luiSource, "tooling/lui_build_receipt.mjs")).href);
  const helper = await import(pathToFileURL(path.join(localScripts, "package-nsh.mjs")).href);
  write(path.join(luiSource, "tooling/nsh_delivery.py"), "qualified LUI delivery hook source");
  const host = path.join(output, platform === "windows" ? "logseq-nsh.exe" : "logseq-nsh");
  const library = platform === "windows" ? path.join(resources, "logseq_ui.dll") : path.join(output, platform === "macos" ? "liblogseq_ui.dylib" : "liblogseq_ui.so");
  const workerName = platform === "windows" ? "logseq-db-worker.exe" : "logseq-db-worker";
  const source = path.join(repo, "deps/ui/nsh/src/lib.rs");
  write(host, validator ? `#!${process.execPath}
const fs = require("node:fs");
if (process.argv.length !== 4 || process.argv[2] !== "--validate-update-config") process.exit(1);
const config = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
fs.writeFileSync(${JSON.stringify(path.join(root, "validator-call.json"))}, JSON.stringify(config));
process.exit(config.publicKey === "fixture-public-key" ? 0 : 1);
` : "qualified native executable", true);
  write(library, "qualified OCaml library");
  write(source, "qualified application source");
  write(path.join(resources, workerName), "qualified native worker", true);
  write(path.join(resources, "fonts/app.ttf"), "qualified font");
  write(path.join(resources, "maintained-backend-output.txt"), "must not enter NSH archive");
  const relative = file => portable(path.relative(root, file));
  const inputs = [library, path.dirname(source), path.join(resources, workerName),
    path.join(resources, "fonts/app.ttf")].map(relative);
  if (platform === "windows") {
    for (const file of [path.join(output, "native.dll"), path.join(resources, "ocaml-dependency.dll")]) {
      write(file, "qualified native dependency");
      inputs.push(relative(file));
    }
  }
  if (platform === "windows") {
    const file = path.join(resources,"windows-dependencies.json");
    write(file,JSON.stringify({files:["native.dll","Resources/ocaml-dependency.dll"].map(destination =>
      ({destination,sha256:api.digestArtifact(path.join(output,destination))}))}));
    inputs.push(relative(file));
  }
  const receiptFile = api.writeReceipt({artifact:host, root, inputs, command:"build qualified app"});
  const receipt = JSON.parse(readFileSync(receiptFile, "utf8"));
  receipt.ownedResources = [workerName, "fonts/app.ttf"];
  if (platform === "windows") {
    receipt.ownedResources.push("ocaml-dependency.dll","windows-dependencies.json");
    receipt.ownedCode = ["native.dll"];
  }
  writeFileSync(receiptFile, JSON.stringify(receipt));
  const bin = path.join(root, platform === "macos" ? "candidate/Logseq NSH.app/Contents/MacOS" : "candidate/Logseq-NSH");
  const destination = path.join(bin, platform === "macos" ? "../Resources" : "Resources");
  const snapshot = path.join(root, "candidate/snapshot.json");
  const options = {host, library, resources, bin, destination, snapshot, luiSource,
    platform, arch:platform === "macos" ? "aarch64" : "x86_64"};
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
    const app = JSON.parse(readFileSync(path.join(f.options.bin, "nsh/app.json"), "utf8"));
    assert.deepEqual(app, {name:"Logseq", id:"com.logseq.logseq", version:"2.0.2", build:1});
    assert.equal(existsSync(path.join(f.options.bin, "nsh/assets/nsh-updater.json")), false);
    assert.equal(existsSync(path.join(f.root, "validator-call.json")), false);
    const candidate = JSON.parse(readFileSync(f.options.snapshot, "utf8"));
    assert.equal(candidate.archiveName, "Logseq-NSH-2.0.2-linux-x86_64.tar.gz");
    const archive = path.join(f.root, "candidate/archive.tar.gz");
    const finalArchive = path.join(f.root, "packages/archive.tar.gz");
    f.write(archive, "final archive bytes after relocation and signing");
    await f.helper.finish({snapshot:f.options.snapshot, archive, finalArchive});
    mkdirSync(path.dirname(finalArchive));
    copyFileSync(archive, finalArchive);
    copyFileSync(`${archive}.lui-build.json`, `${finalArchive}.lui-build.json`);
    assert.equal(f.api.checkReceipt(finalArchive).fresh, true);
    assert.deepEqual(JSON.parse(readFileSync(`${finalArchive}.lui-build.json`, "utf8")).application, app);
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

test("macOS metadata stays inside the bundle before distribution signing", async () => {
  const f = await fixture({platform:"macos"});
  try {
    await f.helper.stage(f.options);
    assert.equal(JSON.parse(readFileSync(path.join(f.options.destination, "nsh/app.json"), "utf8")).id, "com.logseq.logseq");
    assert.equal(existsSync(path.join(f.options.bin, "nsh/app.json")), false);
    assert.equal(JSON.parse(readFileSync(f.options.snapshot, "utf8")).archiveName,
      "Logseq-NSH-2.0.2-macos-aarch64.zip");
    assert.equal(existsSync(path.join(f.options.destination, "liblogseq_ui.dylib")), true);
    assert.equal(existsSync(path.join(f.options.destination, "logseq-db-worker")), true);
  } finally { f.close(); }
});

test("explicit whole-app configuration is checked by the qualified host before packaging", async () => {
  const f = await fixture({validator:true});
  try {
    const updateKey = path.join(f.root, "release.pub");
    f.write(updateKey, "fixture-public-key\n");
    const updateUrl = "https://updates.example.invalid/latest.json";
    await f.helper.stage({...f.options, updateUrl, updateKey});
    const config = {id:"com.logseq.logseq",version:"2.0.2",build:1,url:updateUrl,publicKey:"fixture-public-key"};
    assert.deepEqual(JSON.parse(readFileSync(path.join(f.root, "validator-call.json"), "utf8")), config);
    assert.deepEqual(JSON.parse(readFileSync(path.join(f.options.bin, "nsh/assets/nsh-updater.json"), "utf8")), config);
    const release = JSON.parse(readFileSync(path.join(path.dirname(f.options.snapshot), "release-config/nsh.json"), "utf8"));
    assert.equal(release.version, "2.0.2");
    assert.deepEqual(release.updater, {url:updateUrl,publicKey:"fixture-public-key"});
    await assert.rejects(f.helper.stage(f.options), /must not contain an updater configuration/);
    const archive = path.join(f.root, "candidate/release.tar.gz");
    f.write(archive, "final signed full application");
    await f.helper.finish({snapshot:f.options.snapshot,archive,finalArchive:path.join(f.root,"release.tar.gz")});
    const receipt = JSON.parse(readFileSync(`${archive}.lui-build.json`, "utf8"));
    assert.equal(receipt.updateConfigurationSha256,
      f.api.digestArtifact(path.join(f.options.bin, "nsh/assets/nsh-updater.json")));
    assert.equal(receipt.releaseConfigurationSha256,
      f.api.digestArtifact(path.join(path.dirname(f.options.snapshot), "release-config/nsh.json")));
    f.write(updateKey, "invalid-key");
    await assert.rejects(f.helper.stage({...f.options, updateUrl, updateKey}), /Canonical updater configuration rejected/);
  } finally { f.close(); }
});

test("invalid identity, versions, platforms and incomplete update options fail before code is copied", async () => {
  const f = await fixture();
  try {
    const metadata = overrides => f.helper.releaseMetadata({...f.options, ...overrides});
    for (const overrides of [{platform:"freebsd"},{platform:"windows",arch:"aarch64"},{arch:"arm64"},
      {updateUrl:"https://updates.example.invalid/latest.json"},{updateKey:"missing.pub"},
      {updateUrl:"http://updates.example.invalid/latest.json",updateKey:"missing.pub"},
      {updateUrl:"https://user:password@updates.example.invalid/latest.json",updateKey:"missing.pub"}])
      assert.throws(() => metadata(overrides));
    const configPath = path.join(f.repo, "deps/ui/nsh/nsh.json");
    for (const overrides of [{id:"another.application"},{version:"0.1.0"},{build:-1},{build:2**32},
      {updater:{url:"https://updates.example.invalid/latest.json"}}]) {
      f.write(configPath, JSON.stringify({name:"Logseq",id:"com.logseq.logseq",build:1,...overrides}));
      assert.throws(() => metadata({}));
    }
    f.write(configPath, JSON.stringify({name:"Logseq",id:"com.logseq.logseq",build:1}));
    f.write(path.join(f.repo, "resources/package.json"), JSON.stringify({version:"../../escape"}));
    assert.throws(() => metadata({}), /semantic version/);
    assert.equal(existsSync(path.join(f.options.bin, "logseq-nsh")), false);
  } finally { f.close(); }
});

test("metadata and public-key changes after validation prevent a release receipt", async () => {
  for (const change of ["key", "metadata", "version"]) {
    const f = await fixture({validator:true});
    try {
      const updateKey = path.join(f.root, "release.pub");
      f.write(updateKey, "fixture-public-key");
      await f.helper.stage({...f.options, updateKey, updateUrl:"https://updates.example.invalid/latest.json"});
      if (change === "key") f.write(updateKey, "replaced-public-key");
      else if (change === "metadata") f.write(path.join(f.options.bin, "nsh/app.json"), "{}");
      else f.write(path.join(f.repo, "resources/package.json"), JSON.stringify({version:"2.0.3"}));
      const archive = path.join(f.root, "candidate/new.tar.gz");
      f.write(archive, "signed candidate");
      await assert.rejects(f.helper.finish({snapshot:f.options.snapshot,archive,
        finalArchive:path.join(f.root, "published/new.tar.gz")}), /changed|stale/i);
      assert.equal(existsSync(`${archive}.lui-build.json`), false);
    } finally { f.close(); }
  }
});

test("Linux cannot stage the old bin-only update replacement root", async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.helper.stage({...f.options,bin:path.join(f.options.bin,"bin")}), /complete native application root/);
  } finally { f.close(); }
});

test("release validation binds the sidecar to final archive bytes and canonical archive naming", async () => {
  const f = await fixture();
  try {
    await f.helper.stage(f.options);
    const name = JSON.parse(readFileSync(f.options.snapshot, "utf8")).archiveName;
    const archive = path.join(f.root, "candidate", name);
    const finalArchive = path.join(f.root, "packages", name);
    f.write(archive, "final archive");
    await f.helper.finish({snapshot:f.options.snapshot,archive,finalArchive});
    f.write(finalArchive, readFileSync(archive));
    copyFileSync(`${archive}.lui-build.json`, `${finalArchive}.lui-build.json`);
    const config = `${finalArchive}.release/nsh.json`;
    const configuration = readFileSync(path.join(path.dirname(f.options.snapshot), "release-config/nsh.json"));
    f.write(config, configuration);
    const checked = await f.helper.checkRelease({archive:finalArchive,luiSource:f.options.luiSource});
    assert.equal(checked.configuration, config);
    assert.equal(checked.platform, "linux-x86_64");
    f.write(config, JSON.stringify({...JSON.parse(configuration),version:"2.0.3"}));
    assert.equal(f.api.checkReceipt(finalArchive).fresh, true, "generic artifact checks do not validate a release sidecar");
    await assert.rejects(f.helper.checkRelease({archive:finalArchive,luiSource:f.options.luiSource}), /sidecar/);
    f.write(config, configuration);
    const renamed = path.join(f.root, "packages", "old-version-last-linux-x64-2.0.2.tar.gz");
    f.write(renamed, readFileSync(finalArchive));
    copyFileSync(`${finalArchive}.lui-build.json`, `${renamed}.lui-build.json`);
    f.write(`${renamed}.release/nsh.json`, configuration);
    await assert.rejects(f.helper.checkRelease({archive:renamed,luiSource:f.options.luiSource}), /archive name/);
  } finally { f.close(); }
});

test("a late receipt publication error cannot leave a successful generic receipt", async () => {
  const f = await fixture();
  const fs = require("node:fs");
  const write = fs.writeFileSync;
  try {
    await f.helper.stage(f.options);
    const archive = path.join(f.root, "candidate/archive.tar.gz");
    f.write(archive, "final archive");
    const receipt = `${archive}.lui-build.json`;
    fs.writeFileSync = (target, ...args) => {
      if (target === receipt) throw new Error("fixture late receipt write failure");
      return write(target, ...args);
    };
    syncBuiltinESMExports();
    await assert.rejects(f.helper.finish({snapshot:f.options.snapshot,archive,
      finalArchive:path.join(f.root,"release.tar.gz")}), /late receipt write/);
    assert.equal(existsSync(receipt), false);
  } finally {
    fs.writeFileSync = write;
    syncBuiltinESMExports();
    f.close();
  }
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

test("installed launcher resolves the complete app-root Resources outside a checkout", () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "logseq native archive ")));
  try {
    const bin = path.join(root, process.platform === "darwin" ? "installed app/Contents/MacOS" : "installed app");
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
    const resources = path.join(bin, process.platform === "darwin" ? "../Resources" : "Resources");
    assert.equal(path.resolve(actual.assets), resources);
    assert.equal(path.resolve(actual.worker), path.join(resources, "logseq-db-worker"));
    assert.equal(path.resolve(actual.library), path.join(resources, process.platform === "darwin" ? "liblogseq_ui.dylib" : "liblogseq_ui.so"));
    assert.deepEqual(actual.args, ["--fixture", "Unicode 日本語"]);
  } finally { rmSync(root, {recursive:true, force:true}); }
});


test("Windows stages all qualified native code and binds final signed bytes plus installer", async () => {
  const f = await fixture({platform:"windows"});
  try {
    await f.helper.stage(f.options);
    for (const file of ["logseq-nsh.exe", "native.dll", "Resources/logseq_ui.dll", "Resources/logseq-db-worker.exe", "Resources/ocaml-dependency.dll"])
      assert.equal(existsSync(path.join(f.options.bin, file)), true, file);
    const before = JSON.parse(readFileSync(f.options.snapshot, "utf8"));
    assert.equal(before.archiveName, "Logseq-NSH-2.0.2-windows-x86_64.zip");
    const archive = path.join(f.root, "candidate", before.archiveName);
    const finalArchive = path.join(f.root, "packages", before.archiveName);
    const installer = archive.replace(/\.zip$/, "-setup.exe");
    f.write(archive, "archive after all signatures");
    f.write(installer, "signed installer fixture");
    f.write(path.join(f.options.bin, "native.dll"), "signed root DLL fixture");
    await f.helper.finish({snapshot:f.options.snapshot,archive,finalArchive,delivery:{signing:"authenticode",installer}});
    const receipt = JSON.parse(readFileSync(`${archive}.lui-build.json`, "utf8"));
    assert.equal(receipt.signing, "authenticode");
    assert.equal(receipt.installedCodeSha256["native.dll"], f.api.digestArtifact(path.join(f.options.bin,"native.dll")));
    assert.equal(Object.keys(receipt.installedCodeSha256).length, 5);
    f.write(finalArchive, readFileSync(archive));
    copyFileSync(`${archive}.lui-build.json`, `${finalArchive}.lui-build.json`);
    f.write(finalArchive.replace(/\.zip$/, "-setup.exe"), readFileSync(installer));
    f.write(`${finalArchive}.release/nsh.json`, readFileSync(path.join(path.dirname(f.options.snapshot),"release-config/nsh.json")));
    assert.equal((await f.helper.checkRelease({archive:finalArchive,luiSource:f.options.luiSource})).platform,"windows-x86_64");
    f.write(finalArchive.replace(/\.zip$/, "-setup.exe"), "tampered installer");
    await assert.rejects(f.helper.checkRelease({archive:finalArchive,luiSource:f.options.luiSource}), /Installer/);
  } finally { f.close(); }
});

test("Windows root dependency changes or unqualified ownership cannot enter a release", async () => {
  const f = await fixture({platform:"windows"});
  try {
    await f.helper.stage(f.options);
    const archive = path.join(f.root,"candidate/windows.zip");
    f.write(archive,"candidate");
    f.write(path.join(f.output,"native.dll"),"changed root DLL");
    await assert.rejects(f.helper.finish({snapshot:f.options.snapshot,archive,finalArchive:archive,delivery:{signing:"unsigned"}}), /stale|changed/);
    assert.equal(existsSync(`${archive}.lui-build.json`),false);
  } finally { f.close(); }
});

test("Windows cannot copy a root DLL omitted from the qualified code inputs", async () => {
  const f = await fixture({platform:"windows"});
  try {
    f.write(path.join(f.output,"foreign.dll"),"unqualified dependency");
    const receipt = JSON.parse(readFileSync(f.receiptFile,"utf8"));
    receipt.ownedCode.push("foreign.dll");
    writeFileSync(f.receiptFile,JSON.stringify(receipt));
    await assert.rejects(f.helper.stage(f.options), /Root DLL is not qualified/);
    assert.equal(existsSync(path.join(f.options.bin,"foreign.dll")),false);
  } finally { f.close(); }
});


test("Windows cannot omit a qualified root or Resources dependency from its owned payload", async () => {
  for (const root of [true,false]) {
    const f = await fixture({platform:"windows"});
    try {
      const receipt = JSON.parse(readFileSync(f.receiptFile,"utf8"));
      if (root) receipt.ownedCode=[];
      else receipt.ownedResources=receipt.ownedResources.filter(name=>name!=="ocaml-dependency.dll");
      writeFileSync(f.receiptFile,JSON.stringify(receipt));
      await assert.rejects(f.helper.stage(f.options), /DLL closure is incomplete/);
    } finally { f.close(); }
  }
});
