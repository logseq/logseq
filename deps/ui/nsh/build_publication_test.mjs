// Exercise the real publication script with fake compilers, never Cargo/Dune.
import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const source = path.dirname(fileURLToPath(import.meta.url));
const receiptModule = path.resolve(process.env.LUI_SOURCE_ROOT ?? path.join(source, "../../../../lui"), "tooling/lui_build_receipt.mjs");
function fixture() {
  const temporary = mkdtempSync(path.join(os.tmpdir(), "logseq-publication test-"));
  const repo = path.join(temporary, "repo");
  const lui = path.join(temporary, "lui");
  const host = path.join(repo, "deps/ui/nsh");
  const output = path.join(repo, "deps/ui/_build/nsh");
  const resources = path.join(repo, "deps/ui/_build/Resources");
  const tools = path.join(temporary, "tools");
  const write = (file, contents, executable = false) => {
    mkdirSync(path.dirname(file), {recursive:true});
    writeFileSync(file, contents, executable ? {mode:0o755} : undefined);
  };
  for (const name of ["src", "native", "subs", "shims", "tools", "assets/fonts"])
    mkdirSync(path.join(repo, "deps/ui", name), {recursive:true});
  for (const name of ["bin", "desktop", "lib", "runtime", "stubs", "vendor"])
    mkdirSync(path.join(repo, "deps/db-worker", name), {recursive:true});
  for (const name of ["dune-project", "dune-workspace", "logseq-db-worker.opam"])
    write(path.join(repo, "deps/db-worker", name), "source");
  for (const file of ["Cargo.toml", "Cargo.lock", "nsh.json", "export_schemas.c", "run.sh", "src/lib.rs", "tests/startup_preflight.rs"])
    write(path.join(host, file), "source");
  write(path.join(host, "schemas.json"), "[]\n");
  write(path.join(repo, "deps/ui/native/logseq_lui_bridge.c"), "fake-seven-argument-bridge-with-sparse-feedback");
  // Model only the native-export guard interface and loader boundary. Candidate
  // bytes below are deliberately not a shared library; real loading is covered
  // by the actual platform build, never by this publication plumbing fixture.
  write(path.join(host, "build_windows_dll.py"), `import ctypes,os,pathlib
root=pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])
def record(event):
 with (root/'calls').open('a') as stream: stream.write(event+'\\n')
def bridge_exports(source):
 assert source=='fake-seven-argument-bridge-with-sparse-feedback'
 record('abi-source')
 return ['lui_ocaml_virtual_window']
def load(candidate):
 candidate=pathlib.Path(candidate)
 assert '.publication.' in str(candidate) and candidate.read_text()=='new-library'
 record('abi-load')
 class Library: pass
 library=Library()
 if os.environ.get('PUBLICATION_FAILURE')!='abi': library.lui_ocaml_virtual_window=object()
 return library
ctypes.CDLL=load
`);
  // These compiler/target guards have separate actual-provider coverage. The
  // shell fixture records their real invocation boundaries without compiling.
  write(path.join(host, "validate_primitive_signatures.py"), `import os,pathlib
with (pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])/'calls').open('a') as stream:
 stream.write('primitive-signatures\\n')
`);
  write(path.join(host, "validate_static_styles.py"), `import os,pathlib,sys
candidate=pathlib.Path(sys.argv[1])
assert '.publication.' in str(candidate) and candidate.read_text()=='new-executable'
with (pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])/'calls').open('a') as stream:
 stream.write('static-styles\\n')
`);
  for (const file of ["assets/catalog.json", "assets/fonts/app.ttf"])
    write(path.join(repo, "deps/ui", file), "new-resource");
  write(path.join(repo, "resources/img/logo.svg"), "new-icon");
  write(path.join(repo, "resources/dicts/en.edn"), "new-dict");
  write(path.join(repo, "resources/js/emoji-data.js"), "emoji");
  for (const file of ["resources/css/theme/base.css", "package.json", "pnpm-lock.yaml", "resources/package.json", "scripts/generate-ui-theme.mjs", "scripts/generate-ui-radix.mjs", "node_modules/tailwindcss/theme.css"])
    write(path.join(repo, file), "theme-source");
  for (const name of ["src", "ppx", "platform/bridge"])
    mkdirSync(path.join(lui, name), {recursive:true});
  write(path.join(lui, "platform/nsh/Cargo.toml"), "manifest");
  write(path.join(lui, "platform/nsh/src/lib.rs"), "rust-source");
  write(path.join(lui, "platform/nsh/contract.json"), "{}");
  write(path.join(lui, "platform/web/src/icons/check.svg"), "source-icon");
  write(path.join(lui, "tooling/generate_nsh_contract.py"), "# fake canonical check\n");
  write(path.join(lui, "tooling/lui_build_receipt.mjs"), readFileSync(receiptModule));
  for (const file of ["build.sh", "build_publication.mjs"])
    copyFileSync(path.join(source, file), path.join(host, file));
  write(path.join(temporary, "candidate"), "new-executable", true);
  write(path.join(repo, "deps/db-worker/_build/default/bin/main.exe"), "new-worker", true);
  write(path.join(tools, "uname"), "#!/bin/sh\nprintf 'Linux\\n'\n", true);
  write(path.join(tools, "opam"), `#!/usr/bin/env python3
import json,os,pathlib,sys
with (pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])/'profiles.jsonl').open('a') as stream:
 stream.write(json.dumps({'tool':'opam','args':sys.argv[1:],'dune':os.environ.get('DUNE_PROFILE')})+'\\n')
if 'ocamlc' in sys.argv and '-where' in sys.argv: print('/tmp')
`, true);
  write(path.join(tools, "cc"), `#!/usr/bin/env python3
import os,pathlib,sys
if sys.argv[1]=='-print-file-name=librt.a':
 print('/tmp/librt.a'); sys.exit(0)
out=pathlib.Path(sys.argv[sys.argv.index('-o')+1])
if out.name=='export-schemas':
 out.write_text("#!/usr/bin/env python3\\nimport os,pathlib\\nwith (pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])/'calls').open('a') as stream: stream.write('schemas\\\\n')\\nprint('[]')\\n")
 out.chmod(0o755)
else: out.write_text('new-library')
`, true);
  write(path.join(tools, "cargo"), `#!/usr/bin/env python3
import json,os,pathlib,sys
root=pathlib.Path(os.environ['PUBLICATION_TEST_ROOT'])
repo=root/'repo'; lui=root/'lui'
with (root/'profiles.jsonl').open('a') as stream:
 stream.write(json.dumps({'tool':'cargo','args':sys.argv[1:],'dune':os.environ.get('DUNE_PROFILE')})+'\\n')
if sys.argv[1]=='metadata':
 print(json.dumps({'packages':[{'name':'lui-nsh','source':None,'manifest_path':str(lui/'platform/nsh/Cargo.toml')}]}))
elif sys.argv[1]=='build':
 if os.environ.get('PUBLICATION_FAILURE')=='source':
  (lui/'platform/web/src/icons/check.svg').write_text('changed-during-build')
 print(json.dumps({'reason':'compiler-artifact','executable':str(root/'candidate'),'target':{'name':'nsh-app-logseq'}}))
 print(json.dumps({'reason':'compiler-artifact','manifest_path':str(lui/'platform/nsh/Cargo.toml'),'target':{'name':'lui_nsh'}}))
elif sys.argv[1]=='test':
 with (root/'calls').open('a') as stream: stream.write('gate\\n')
 library=pathlib.Path(os.environ['LUI_OCAML_LIBRARY'])
 resources=pathlib.Path(os.environ['LOGSEQ_NATIVE_ASSET_DIR'])
 worker=pathlib.Path(os.environ['LOGSEQ_DB_WORKER_BIN'])
 assert '.publication.' in str(library) and '.publication.' in str(resources)
 assert library.read_text()=='new-library' and worker.read_text()=='new-worker'
 assert (resources/'catalog.json').read_text()=='new-resource'
 if os.environ.get('PUBLICATION_FAILURE')=='gate': sys.exit(7)
 if os.environ.get('PUBLICATION_FAILURE')=='after-gate':
  (lui/'platform/nsh/contract.json').write_text('changed-during-qualification')
else: sys.exit('unexpected Cargo operation')
`, true);
  const old = new Map([
    [path.join(output, "logseq-nsh"), "previous-executable"],
    [path.join(output, "liblogseq_ui.so"), "previous-library"],
    [path.join(output, "logseq-nsh.lui-build.json"), JSON.stringify({ownedResources:["old-resource.json"]})],
    [path.join(resources, "old-resource.json"), "previous-resource"],
    [path.join(resources, "apple-unrelated-resource.json"), "maintained-backend-resource"],
    [path.join(resources, "logseq-db-worker"), "previous-worker"],
  ]);
  for (const [file, contents] of old) write(file, contents);
  return {temporary, repo, lui, host, output, resources, old,
    calls:() => existsSync(path.join(temporary, "calls")) ? readFileSync(path.join(temporary, "calls"), "utf8").trim().split("\n") : [],
    run(failure = "", arguments_ = []) {
    // Qualify macOS against its supported system Bash 3.2 even when PATH
    // contains Homebrew Bash. Linux keeps the runner's installed Bash.
    return spawnSync(process.platform === "darwin" ? "/bin/bash" : "bash", [path.join(host, "build.sh"), ...arguments_], {encoding:"utf8", timeout:15000,
      env:{...process.env, PATH:`${tools}${path.delimiter}${process.env.PATH}`,
        LUI_SOURCE_ROOT:lui, PUBLICATION_TEST_ROOT:temporary, PUBLICATION_FAILURE:failure,
        NODE_BINARY:process.execPath, PYTHON_BINARY:process.env.PYTHON_BINARY ?? "python3"}});
  }};
}
function assertCargoArguments(app, profile) {
  const calls = readFileSync(path.join(app.temporary, "profiles.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  assert.ok(calls.some(call => call.tool === "opam" && call.args.includes("dune")));
  assert.ok(calls.every(call => call.dune === profile));
  const common = [...(profile === "release" ? ["--release"] : []),
    "--locked", "--manifest-path", path.join(app.host, "Cargo.toml")];
  for (const [operation, trailing] of [
    ["build", ["--message-format=json-render-diagnostics"]],
    ["test", ["--test", "startup_preflight", "--", "--exact", "real_application_startup_preflight", "--nocapture"]],
  ]) {
    const matches = calls.filter(call => call.tool === "cargo" && call.args[0] === operation);
    assert.equal(matches.length, 1, operation);
    assert.deepEqual(matches[0].args, [operation, ...common, ...trailing]);
  }
}
for (const failure of ["abi", "gate", "source", "after-gate"]) {
  test(`candidate ${failure} failure leaves the complete published set and receipt untouched`, () => {
    const app = fixture();
    try {
      const result = app.run(failure);
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      if (failure === "abi") {
        assert.match(result.stderr, /missing exports: lui_ocaml_virtual_window/);
        assert.deepEqual(app.calls(), ["abi-source", "primitive-signatures", "abi-source", "abi-load"]);
      } else if (failure !== "gate") assert.match(result.stderr, /sources changed during build/);
      for (const [file, contents] of app.old) assert.equal(readFileSync(file, "utf8"), contents);
      assert.equal(existsSync(path.join(app.resources, "catalog.json")), false);
    } finally { rmSync(app.temporary, {recursive:true, force:true}); }
  });
}
test("qualified publication preserves shared outputs, retires owned resources and records tested digests", async () => {
  const app = fixture();
  try {
    const result = app.run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assertCargoArguments(app, "dev");
    assert.deepEqual(app.calls(), ["abi-source", "primitive-signatures", "abi-source", "abi-load", "schemas", "static-styles", "gate"]);
    const artifact = path.join(app.output, "logseq-nsh");
    assert.equal(readFileSync(artifact, "utf8"), "new-executable");
    assert.equal(readFileSync(path.join(app.resources, "logseq-db-worker"), "utf8"), "new-worker");
    assert.equal(existsSync(path.join(app.resources, "old-resource.json")), false);
    assert.equal(readFileSync(path.join(app.resources, "apple-unrelated-resource.json"), "utf8"), "maintained-backend-resource");
    const receipt = JSON.parse(readFileSync(artifact + ".lui-build.json", "utf8"));
    assert.equal(receipt.artifact, artifact);
    assert.ok(receipt.ownedResources.includes("logseq-db-worker"));
    assert.ok(!receipt.ownedResources.includes("apple-unrelated-resource.json"));
    assert.ok(Object.keys(receipt.files).some(file => file.endsWith("platform/web/src/icons/check.svg")));
    assert.ok(Object.keys(receipt.files).some(file => file.endsWith("platform/nsh/contract.json")));
    for (const source of ["resources/css/theme/base.css", "scripts/generate-ui-theme.mjs", "node_modules/tailwindcss/theme.css", "pnpm-lock.yaml"])
      assert.ok(Object.keys(receipt.files).some(file => file.endsWith(source)), source);
    assert.ok(Object.keys(receipt.files).every(file => !file.includes(".publication.")));
    const {checkReceipt} = await import(pathToFileURL(receiptModule).href);
    assert.equal(checkReceipt(artifact).fresh, true);
  } finally { rmSync(app.temporary, {recursive:true, force:true}); }
});

// Use the actual receipt implementation for Windows relocation; fake bytes
// establish bookkeeping only, not PE loading or Windows startup.
test("Windows receipt binds scoped build scripts, command and installed root DLLs", async () => {
  const app = fixture();
  try {
    for (const name of ["build_windows.py", "build_windows_dll.py", "windows_dependencies.py"])
      writeFileSync(path.join(app.host, name), "windows-build-source");
    const candidate = path.join(app.output, ".windows-candidate");
    const resources = path.join(candidate, "Resources");
    mkdirSync(resources, {recursive:true});
    const artifact = path.join(candidate, "logseq-nsh.exe");
    const installed = path.join(app.output, "logseq-nsh.exe");
    const library = path.join(resources, "logseq_ui.dll");
    const runtime = path.join(candidate, "native.dll");
    writeFileSync(artifact, "qualified-host");
    writeFileSync(library, "qualified-ocaml");
    writeFileSync(runtime, "qualified-runtime");
    const metadata = path.join(app.temporary, "metadata.json");
    const manifest = path.join(app.temporary, "manifest.txt");
    const snapshot = path.join(app.temporary, "snapshot.json");
    const extra = path.join(app.temporary, "extra.json");
    const rustManifest = path.join(app.lui, "platform/nsh/Cargo.toml");
    writeFileSync(metadata, JSON.stringify({packages:[{name:"lui-nsh",source:null,manifest_path:rustManifest}]}));
    writeFileSync(manifest, rustManifest);
    const run = (...args) => spawnSync(process.execPath, [path.join(app.host, "build_publication.mjs"), ...args], {encoding:"utf8"});
    const command = "py -3 build_windows.py --dll-root C:\\trusted";
    let result = run("snapshot", path.join(app.lui, "tooling/lui_build_receipt.mjs"), app.repo, app.lui, metadata, snapshot, command);
    assert.equal(result.status, 0, result.stderr);
    const finalResources = path.join(app.output, "Resources");
    mkdirSync(finalResources, {recursive:true});
    const finalLibrary = path.join(finalResources, "logseq_ui.dll");
    const finalRuntime = path.join(app.output, "native.dll");
    writeFileSync(extra, JSON.stringify([{source:runtime,target:finalRuntime}]));
    result = run("receipt", snapshot, manifest, artifact, installed, library, finalLibrary, resources, finalResources, extra);
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(readFileSync(artifact + ".lui-build.json", "utf8"));
    assert.equal(receipt.command, command);
    assert.deepEqual(receipt.ownedCode, ["native.dll"]);
    assert.deepEqual(receipt.ownedResources, ["logseq_ui.dll"]);
    for (const name of ["build_windows.py", "build_windows_dll.py", "windows_dependencies.py"])
      assert.ok(Object.keys(receipt.files).some(file => file.endsWith(name)), name);
    assert.ok(Object.keys(receipt.files).every(file => !file.includes(".windows-candidate")));
    copyFileSync(artifact, installed);
    copyFileSync(library, finalLibrary);
    copyFileSync(runtime, finalRuntime);
    copyFileSync(artifact + ".lui-build.json", installed + ".lui-build.json");
    const {checkReceipt} = await import(pathToFileURL(receiptModule).href);
    assert.equal(checkReceipt(installed).fresh, true);
    writeFileSync(finalRuntime, "unqualified-runtime");
    assert.equal(checkReceipt(installed).fresh, false);
    writeFileSync(extra, JSON.stringify([{source:runtime,target:path.join(app.temporary, "escaped.dll")}]));
    result = run("receipt", snapshot, manifest, artifact, installed, library, finalLibrary, resources, finalResources, extra);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /inside its final application root/);
  } finally { rmSync(app.temporary, {recursive:true, force:true}); }
});


test("release qualification uses both optimized toolchains and preserves development artifacts", () => {
  const app = fixture();
  try {
    const result = app.run("", ["--release"]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const artifact = path.join(app.repo, "deps/ui/_build/nsh-release/bin/logseq-nsh");
    assert.equal(result.stdout.trim(), artifact);
    const receipt = JSON.parse(readFileSync(artifact + ".lui-build.json", "utf8"));
    assert.equal(receipt.buildProfile, "release");
    assert.equal(receipt.duneProfile, "release");
    assert.match(receipt.command, / --release$/);
    assertCargoArguments(app, "release");
    for (const [file, contents] of app.old) assert.equal(readFileSync(file, "utf8"), contents);
  } finally { rmSync(app.temporary, {recursive:true, force:true}); }
});

for (const arguments_ of [[""], ["--debug"], ["--release", "extra"]]) {
  test(`invalid build arguments fail before invoking any tool: ${JSON.stringify(arguments_)}`, () => {
    const app = fixture();
    try {
      const result = app.run("", arguments_);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Usage: build\.sh \[--release\]/);
      assert.equal(existsSync(path.join(app.temporary, "profiles.jsonl")), false);
      for (const [file, contents] of app.old) assert.equal(readFileSync(file, "utf8"), contents);
    } finally { rmSync(app.temporary, {recursive:true, force:true}); }
  });
}
