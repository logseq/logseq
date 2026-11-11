#!/usr/bin/env node
// Source stability and receipts reuse LUI's existing scoped input scanner.
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

const read = file => JSON.parse(readFileSync(file, "utf8"));
const portable = file => file.split(path.sep).join("/");
const within = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
function sourceInputs(repo, ocamlLui, rustManifest, tool) {
  const inputs = [];
  const add = (file, optional = false) => {
    if (!existsSync(file)) {
      if (optional) return;
      throw new Error(`Missing native build source input: ${file}`);
    }
    inputs.push(path.resolve(file));
  };
  const app = (...segments) => path.join(repo, ...segments);
  for (const scope of ["src", "native", "subs", "shims", "tools", "assets"]) add(app("deps/ui", scope));
  for (const file of ["dune-project", "dune-workspace"]) add(app("deps/ui", file), true);
  add(app("deps/ui/nsh/src")); add(app("deps/ui/nsh/tests"));
  for (const file of ["Cargo.toml", "Cargo.lock", "nsh.json", "schemas.json", "export_schemas.c", "build.sh", "run.sh", "build_publication.mjs"])
    add(app("deps/ui/nsh", file));
  for (const scope of ["bin", "desktop", "lib", "runtime", "stubs", "vendor"]) add(app("deps/db-worker", scope));
  for (const file of ["dune-project", "dune-workspace", "logseq-db-worker.opam"]) add(app("deps/db-worker", file));
  add(app("resources/dicts")); add(app("resources/img")); add(app("resources/js/emoji-data.js"));
  for (const scope of ["src", "ppx", "platform/bridge"]) add(path.join(ocamlLui, scope));
  for (const file of ["dune-project", "dune-workspace", "lui.opam"]) add(path.join(ocamlLui, file), true);
  const rustPackage = path.dirname(rustManifest);
  add(rustManifest); add(path.join(rustPackage, "src"));
  add(path.join(rustPackage, "contract.json"));
  add(path.resolve(rustPackage, "../web/src/icons"));
  for (const file of ["Cargo.lock", "build.rs", "rust-toolchain.toml"]) add(path.join(rustPackage, file), true);
  add(tool);
  // A non-Git ancestor selects the receipt API's filesystem fallback, including
  // ignored local artifacts only when their explicit scopes are later added.
  let root = path.resolve(repo);
  while (!inputs.every(file => within(root, file))) root = path.dirname(root);
  for (;;) {
    try { execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], {stdio:"ignore"}); }
    catch { break; }
    const parent = path.dirname(root);
    if (parent === root) throw new Error("Cannot choose a receipt input root outside Git");
    root = parent;
  }
  return {root, inputs:[...new Set(inputs.map(file => portable(path.relative(root, file))))].sort()};
}
function sameFiles(before, after) {
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changed = names.filter(name => before[name] !== after[name]);
  if (changed.length) throw new Error(`Native sources changed during build; rebuild before publication: ${changed.slice(0, 8).join(", ")}`);
}
async function check(snapshot, compiledManifest) {
  const api = await import(pathToFileURL(snapshot.tool).href);
  if (compiledManifest && realpathSync(readFileSync(compiledManifest, "utf8")) !== realpathSync(snapshot.rustManifest))
    throw new Error("Compiled LUI Rust manifest differs from the snapshotted Cargo graph");
  sameFiles(snapshot.files, api.digestInputs(snapshot.root, snapshot.inputs));
  return api;
}
async function main() {
  const [operation, ...args] = process.argv.slice(2);
  if (operation === "snapshot") {
    const [tool, repo, ocamlLui, metadataFile, output] = args;
    const packages = read(metadataFile).packages.filter(pkg => pkg.name === "lui-nsh" && pkg.source == null);
    if (packages.length !== 1) throw new Error("Expected exactly one local LUI Rust package in Cargo metadata");
    const rustManifest = packages[0].manifest_path;
    const api = await import(pathToFileURL(tool).href);
    const scope = sourceInputs(repo, ocamlLui, rustManifest, tool);
    const quote = value => "'" + value.replaceAll("'", "'\"'\"'") + "'";
    const snapshot = {...scope, tool, rustManifest,
      command:`LUI_SOURCE_ROOT=${quote(ocamlLui)} bash ${quote(path.join(repo, "deps/ui/nsh/build.sh"))}`,
      files:api.digestInputs(scope.root, scope.inputs)};
    writeFileSync(output, JSON.stringify(snapshot));
  } else if (operation === "check") {
    await check(read(args[0]), args[1]);
  } else if (operation === "receipt") {
    const [snapshotFile, manifestFile, artifact, finalArtifact, library, finalLibrary, resources, finalResources] = args;
    const snapshot = read(snapshotFile);
    const api = await check(snapshot, manifestFile);
    const stagedInputs = [library, resources].map(file => portable(path.relative(snapshot.root, file)));
    const receiptFile = api.writeReceipt({artifact, command:snapshot.command, root:snapshot.root,
      inputs:[...snapshot.inputs, ...stagedInputs]});
    const receipt = read(receiptFile);
    const sourceFiles = Object.fromEntries(Object.entries(receipt.files).filter(([name]) =>
      ![library, resources].some(directory => within(directory, path.join(snapshot.root, name)))));
    sameFiles(snapshot.files, sourceFiles);
    const locations = [[artifact, finalArtifact], [library, finalLibrary], [resources, finalResources]];
    const relocate = file => {
      for (const [source, target] of locations) {
        if (within(source, file)) return path.join(target, path.relative(source, file));
      }
      return file;
    };
    receipt.artifact = path.resolve(finalArtifact);
    receipt.inputs = receipt.inputs.map(file => portable(path.relative(snapshot.root, relocate(path.resolve(snapshot.root, file)))));
    receipt.files = Object.fromEntries(Object.entries(receipt.files).map(([file, hash]) =>
      [portable(path.relative(snapshot.root, relocate(path.resolve(snapshot.root, file)))), hash]));
    // Relocation changes recorded paths only. Digests describe the tested staged
    // bytes, and original source hashes cannot certify edits made after build.
    writeFileSync(receiptFile, JSON.stringify(receipt, null, 1) + "\n");
  } else {
    throw new Error("Expected snapshot, check or receipt publication operation");
  }
}
main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
