// Package only a qualified artifact and the resources owned by its receipt.
import {createHash} from "node:crypto";
import {chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scripts, "../../..");
const read = file => JSON.parse(readFileSync(file, "utf8"));
const sourceFiles = ["package-nsh.sh", "package-nsh.mjs", "launch-nsh.sh"].map(name => path.join(scripts, name));
const portable = value => value.split(path.sep).join("/");
const within = (root, name) => {
  const relative = path.relative(root, name);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
function unchanged(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [...keys].filter(key => before[key] !== after[key]);
  if (changed.length) throw new Error(`Package inputs changed: ${changed.slice(0, 8).join(", ")}`);
}
async function receiptApi(luiSource) {
  return import(pathToFileURL(path.join(luiSource, "tooling/lui_build_receipt.mjs")).href);
}
export async function stage({host, library, resources, bin, destination, snapshot, luiSource}) {
  const api = await receiptApi(luiSource);
  const check = api.checkReceipt(host);
  if (!check.fresh) throw new Error(check.message);
  const receipt = read(api.receiptPath(host));
  if (!Array.isArray(receipt.ownedResources) || receipt.ownedResources.length === 0)
    throw new Error("The qualified NSH build must declare its ownedResources");
  const inputs = [...receipt.inputs];
  for (const file of sourceFiles) {
    if (!within(receipt.root, file)) throw new Error("Package sources are outside the build receipt root");
    inputs.push(portable(path.relative(receipt.root, file)));
  }
  const files = api.digestInputs(receipt.root, inputs);
  // The installed library must be one of the qualified receipt's code inputs.
  const libraryKey = portable(path.relative(receipt.root, library));
  if (!within(receipt.root, library) || !Object.hasOwn(receipt.files, libraryKey))
    throw new Error("The OCaml library is not covered by the qualified build receipt");
  mkdirSync(bin, {recursive:true});
  mkdirSync(destination, {recursive:true});
  for (const name of receipt.ownedResources) {
    if (typeof name !== "string" || !name || name.includes("\\") || path.isAbsolute(name)
        || name.split("/").some(part => !part || part === "." || part === ".."))
      throw new Error("Invalid owned resource path");
    const source = path.resolve(resources, name);
    const relative = portable(path.relative(receipt.root, source));
    if (!within(resources, source) || !Object.hasOwn(receipt.files, relative))
      throw new Error(`Resource is not covered by the qualified build receipt: ${name}`);
    const target = path.join(destination, name);
    mkdirSync(path.dirname(target), {recursive:true});
    copyFileSync(source, target);
    if (api.digestArtifact(target) !== receipt.files[relative])
      throw new Error(`Resource changed while packaging: ${name}`);
  }
  const worker = path.join(destination, "logseq-db-worker");
  if (!existsSync(worker)) throw new Error("The qualified build has no native database worker");
  copyFileSync(host, path.join(bin, "logseq-nsh"));
  copyFileSync(library, path.join(destination, path.basename(library)));
  if (api.digestArtifact(path.join(bin, "logseq-nsh")) !== receipt.artifactDigest
      || api.digestArtifact(path.join(destination, path.basename(library))) !== receipt.files[libraryKey])
    throw new Error("Qualified native code changed while packaging");
  chmodSync(path.join(bin, "logseq-nsh"), 0o755);
  chmodSync(worker, 0o755);
  writeFileSync(snapshot, JSON.stringify({root:receipt.root, inputs, files, host,
    artifactDigest:receipt.artifactDigest, luiSource}));
  const sourceDigest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
  writeFileSync(path.join(destination, "nsh-build.json"), JSON.stringify({version:1,
    sourceArtifactSha256:receipt.artifactDigest, sourceInputsSha256:sourceDigest}, null, 2));
}
export async function finish({snapshot, archive, finalArchive}) {
  const before = read(snapshot);
  const api = await receiptApi(before.luiSource);
  const check = api.checkReceipt(before.host);
  if (!check.fresh) throw new Error(check.message);
  if (api.digestArtifact(before.host) !== before.artifactDigest)
    throw new Error("The qualified executable changed during packaging");
  unchanged(before.files, api.digestInputs(before.root, before.inputs));
  const quote = value => "'" + value.replaceAll("'", "'\"'\"'") + "'";
  const receiptFile = api.writeReceipt({artifact:archive, root:before.root, inputs:before.inputs,
    command:`cd ${quote(repo)} && pnpm ui:nsh:package`});
  const receipt = read(receiptFile);
  unchanged(before.files, receipt.files);
  receipt.artifact = path.resolve(finalArchive);
  writeFileSync(receiptFile, JSON.stringify(receipt, null, 1) + "\n");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "stage" && args.length === 8) {
    const [host, library, resources, bin, destination, snapshot, luiSource, launcher] = args;
    await stage({host, library, resources, bin, destination, snapshot, luiSource});
    copyFileSync(path.join(scripts, "launch-nsh.sh"), path.join(bin, launcher));
    chmodSync(path.join(bin, launcher), 0o755);
  } else if (mode === "finish" && args.length === 3) {
    const [snapshot, archive, finalArchive] = args;
    await finish({snapshot, archive, finalArchive});
  } else throw new Error("Expected stage or finish package arguments");
}
