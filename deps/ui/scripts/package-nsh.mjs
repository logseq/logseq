// Package only a qualified artifact and the resources owned by its receipt.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import semver from "semver";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scripts, "../../..");
const read = file => JSON.parse(readFileSync(file, "utf8"));
const sourceFiles = ["package-nsh.sh", "package-nsh.mjs", "launch-nsh.sh"].map(name => path.join(scripts, name));
sourceFiles.push(path.join(repo, "resources/package.json"), path.join(repo, "deps/ui/nsh/nsh.json"),
  path.join(repo, "package.json"), path.join(repo, "pnpm-lock.yaml"),
  path.join(repo, "deps/ui/nsh/package_windows.py"));
const digest = value => createHash("sha256").update(value).digest("hex");
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
export function releaseMetadata({platform, arch, updateUrl, updateKey}) {
  if (!["macos", "linux", "windows"].includes(platform) || !["aarch64", "x86_64"].includes(arch) || (platform === "windows" && arch !== "x86_64"))
    throw new Error("Unsupported native package platform or architecture");
  const config = read(path.join(repo, "deps/ui/nsh/nsh.json"));
  const version = read(path.join(repo, "resources/package.json")).version;
  if (config.id !== "com.logseq.logseq" || config.name !== "Logseq")
    throw new Error("The actual Logseq package identity must match the native application");
  if (typeof version !== "string" || semver.valid(version) !== version)
    throw new Error("resources/package.json must contain a canonical semantic version");
  if (config.version !== undefined && config.version !== version)
    throw new Error("The development nsh.json version conflicts with resources/package.json");
  if (!Number.isInteger(config.build) || config.build < 0 || config.build > 0xffffffff)
    throw new Error("nsh.json build must be an unsigned 32-bit integer");
  if (config.updater !== undefined)
    throw new Error("Configure release updates explicitly with --update-url and --update-public-key");
  if (Boolean(updateUrl) !== Boolean(updateKey))
    throw new Error("--update-url and --update-public-key must be supplied together");
  const application = {name:config.name, id:config.id, version, build:config.build};
  let updater;
  let keyInput;
  if (updateUrl) {
    const url = new URL(updateUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.hash)
      throw new Error("Production updates require an HTTPS manifest URL without credentials or fragment");
    if (statSync(updateKey).size > 4096) throw new Error("Update public key exceeds 4096 bytes");
    const publicKey = readFileSync(updateKey);
    if (publicKey.length > 4096) throw new Error("Update public key exceeds 4096 bytes");
    keyInput = {path:path.resolve(updateKey), sha256:digest(publicKey)};
    updater = {id:config.id, version, build:config.build, url:updateUrl,
      publicKey:publicKey.toString("utf8").trim()};
  }
  return {application, updater, keyInput, platform, arch,
    archiveName:`Logseq-NSH-${version}-${platform}-${arch}.${platform === "linux" ? "tar.gz" : "zip"}`};
}
export async function stage({host, library, resources, bin, destination, snapshot, luiSource,
  platform, arch, updateUrl, updateKey}) {
  const expectedResources = platform === "macos" ? path.resolve(bin, "../Resources") : path.join(bin, "Resources");
  if (path.resolve(destination) !== path.resolve(expectedResources))
    throw new Error("Resources must belong to the complete native application root");
  const api = await receiptApi(luiSource);
  const check = api.checkReceipt(host);
  if (!check.fresh) throw new Error(check.message);
  const receipt = read(api.receiptPath(host));
  if (!Array.isArray(receipt.ownedResources) || receipt.ownedResources.length === 0)
    throw new Error("The qualified NSH build must declare its ownedResources");
  const inputs = [...receipt.inputs];
  if (platform === "windows") {
    const hook = path.join(luiSource, "tooling/nsh_delivery.py");
    if (!within(receipt.root, hook)) throw new Error("Windows delivery hooks are outside the qualified receipt root");
    inputs.push(portable(path.relative(receipt.root, hook)));
  }
  for (const file of sourceFiles) {
    if (!within(receipt.root, file)) throw new Error("Package sources are outside the build receipt root");
    inputs.push(portable(path.relative(receipt.root, file)));
  }
  const files = api.digestInputs(receipt.root, inputs);
  // Snapshot the version/config sources before interpreting them. A concurrent
  // edit then fails the final source check instead of blessing mixed metadata.
  const release = releaseMetadata({platform, arch, updateUrl, updateKey});
  const metadataDirectory = platform === "macos" ? path.join(destination, "nsh") : path.join(bin, "nsh");
  if (!release.updater && existsSync(path.join(metadataDirectory, "assets/nsh-updater.json")))
    throw new Error("A candidate without update options must not contain an updater configuration");
  const metadata = [];
  const writeMetadata = (file, value) => {
    mkdirSync(path.dirname(file), {recursive:true});
    writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
    metadata.push({path:path.resolve(file), sha256:api.digestArtifact(file)});
  };
  if (release.updater) {
    const configuration = path.join(metadataDirectory, "assets/nsh-updater.json");
    writeMetadata(configuration, release.updater);
    // This mode only parses the canonical NSH/LUI configuration. It does not
    // mount an app, open an updater, create a cache or make a network request.
    const checked = spawnSync(host, ["--validate-update-config", configuration], {encoding:"utf8", timeout:30000});
    if (checked.error || checked.status !== 0)
      throw new Error(`Canonical updater configuration rejected: ${checked.error?.message ?? checked.stderr ?? checked.status}`);
  }
  writeMetadata(path.join(metadataDirectory, "app.json"), release.application);
  const releaseConfig = {...release.application, rust:".", root:"App"};
  if (release.updater) releaseConfig.updater = {url:release.updater.url, publicKey:release.updater.publicKey};
  writeMetadata(path.join(path.dirname(snapshot), "release-config/nsh.json"), releaseConfig);
  // The installed library must be one of the qualified receipt's code inputs.
  const libraryKey = portable(path.relative(receipt.root, library));
  if (!within(receipt.root, library) || !Object.hasOwn(receipt.files, libraryKey))
    throw new Error("The OCaml library is not covered by the qualified build receipt");
  mkdirSync(bin, {recursive:true});
  mkdirSync(destination, {recursive:true});
  const safeOwned = name => {
    if (typeof name !== "string" || !name || name.includes("\\") || path.isAbsolute(name)
        || /^[A-Za-z]:/.test(name) || name.split("/").some(part => !part || part === "." || part === "..")
        || (platform === "windows" && /[<>:"|?*\0]/.test(name)))
      throw new Error("Invalid owned resource path");
  };
  if (platform === "windows") {
    const provenance = "windows-dependencies.json";
    if (!receipt.ownedResources.includes(provenance)) throw new Error("Qualified Windows DLL provenance is required");
    const recorded = read(path.join(resources, provenance));
    if (!Array.isArray(recorded.files)) throw new Error("Invalid qualified Windows DLL provenance");
    const owned = new Set([...(receipt.ownedCode ?? []), ...receipt.ownedResources.map(name => `Resources/${name}`)]);
    for (const dependency of recorded.files) {
      safeOwned(dependency.destination);
      const key = portable(path.relative(receipt.root, path.join(path.dirname(host), dependency.destination)));
      if (!owned.has(dependency.destination) || !Object.hasOwn(receipt.files, key)
          || receipt.files[key] !== dependency.sha256)
        throw new Error(`Qualified Windows DLL closure is incomplete: ${dependency.destination}`);
    }
  }
  for (const name of receipt.ownedResources) {
    safeOwned(name);
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
  const worker = path.join(destination, platform === "windows" ? "logseq-db-worker.exe" : "logseq-db-worker");
  const executable = path.join(bin, platform === "windows" ? "logseq-nsh.exe" : "logseq-nsh");
  if (!existsSync(worker)) throw new Error("The qualified build has no native database worker");
  for (const name of receipt.ownedCode ?? []) {
    safeOwned(name);
    if (platform !== "windows" || !name.toLowerCase().endsWith(".dll") || name.includes("/"))
      throw new Error("Owned executable-adjacent code must be a Windows root DLL");
    const source = path.join(path.dirname(host), name);
    const relative = portable(path.relative(receipt.root, source));
    if (!Object.hasOwn(receipt.files, relative)) throw new Error(`Root DLL is not qualified: ${name}`);
    copyFileSync(source, path.join(bin, name));
    if (api.digestArtifact(path.join(bin, name)) !== receipt.files[relative])
      throw new Error(`Root DLL changed while packaging: ${name}`);
  }
  copyFileSync(host, executable);
  if (platform !== "windows" || !receipt.ownedResources.includes(path.basename(library)))
    copyFileSync(library, path.join(destination, path.basename(library)));
  if (api.digestArtifact(executable) !== receipt.artifactDigest
      || api.digestArtifact(path.join(destination, path.basename(library))) !== receipt.files[libraryKey])
    throw new Error("Qualified native code changed while packaging");
  chmodSync(executable, 0o755);
  chmodSync(worker, 0o755);
  writeFileSync(snapshot, JSON.stringify({root:receipt.root, inputs, files, host,
    artifactDigest:receipt.artifactDigest, luiSource, ...release, metadata,
    codeRoot:bin, codeFiles: platform === "windows" ? [executable,
      ...receipt.ownedResources.filter(name => /\.(?:exe|dll)$/i.test(name)).map(name => path.join(destination, name)),
      ...(receipt.ownedResources.includes(path.basename(library)) ? [] : [path.join(destination, path.basename(library))]),
      ...(receipt.ownedCode ?? []).map(name => path.join(bin, name))] : []}));
  const sourceDigest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
  writeFileSync(path.join(destination, "nsh-build.json"), JSON.stringify({version:1,
    sourceArtifactSha256:receipt.artifactDigest, sourceInputsSha256:sourceDigest}, null, 2));
}
export async function finish({snapshot, archive, finalArchive, delivery}) {
  const before = read(snapshot);
  const api = await receiptApi(before.luiSource);
  const check = api.checkReceipt(before.host);
  if (!check.fresh) throw new Error(check.message);
  if (api.digestArtifact(before.host) !== before.artifactDigest)
    throw new Error("The qualified executable changed during packaging");
  unchanged(before.files, api.digestInputs(before.root, before.inputs));
  if (before.keyInput && digest(readFileSync(before.keyInput.path)) !== before.keyInput.sha256)
    throw new Error("Update public key changed during packaging");
  for (const file of before.metadata)
    if (api.digestArtifact(file.path) !== file.sha256)
      throw new Error(`Release metadata changed during packaging: ${file.path}`);
  const quote = value => "'" + value.replaceAll("'", "'\"'\"'") + "'";
  const receiptFile = api.writeReceipt({artifact:archive, root:before.root, inputs:before.inputs,
    command:before.platform === "windows" ? `python deps/ui/nsh/package_windows.py --built-host "${before.host}"` : `cd ${quote(repo)} && pnpm ui:nsh:package`});
  try {
    const receipt = read(receiptFile);
    unchanged(before.files, receipt.files);
    receipt.artifact = path.resolve(finalArchive);
    receipt.application = before.application;
    if (before.platform === "windows") {
      if (!["unsigned", "authenticode"].includes(delivery?.signing)) throw new Error("Windows signing result is required");
      receipt.signing = delivery.signing;
      receipt.installedCodeSha256 = Object.fromEntries(before.codeFiles.map(file =>
        [portable(path.relative(before.codeRoot, file)), api.digestArtifact(file)]));
      if (delivery.installer) {
        const installer = path.resolve(delivery.installer);
        if (!within(path.dirname(snapshot), installer)
            || path.basename(installer) !== before.archiveName.replace(/\.zip$/, "-setup.exe"))
          throw new Error("Installer must belong to this Windows package candidate");
        receipt.installer = {name:path.basename(installer), sha256:api.digestArtifact(installer)};
      }
    }
    receipt.platform = `${before.platform}-${before.arch}`;
    receipt.updateConfigurationSha256 = before.metadata.find(file => portable(file.path).endsWith("/assets/nsh-updater.json"))?.sha256 ?? null;
    receipt.releaseConfigurationSha256 = before.metadata.find(file => portable(file.path).endsWith("/release-config/nsh.json")).sha256;
    writeFileSync(receiptFile, JSON.stringify(receipt, null, 1) + "\n");
  } catch (error) {
    rmSync(receiptFile, {force:true});
    throw error;
  }
}
export async function checkRelease({archive, luiSource}) {
  const api = await receiptApi(luiSource);
  const check = api.checkReceipt(archive);
  if (!check.fresh) throw new Error(check.message);
  const receipt = read(api.receiptPath(archive));
  const configuration = path.join(`${archive}.release`, "nsh.json");
  if (!receipt.releaseConfigurationSha256
      || api.digestArtifact(configuration) !== receipt.releaseConfigurationSha256)
    throw new Error("The release sidecar does not match its final archive receipt");
  const config = read(configuration);
  if (["name", "id", "version", "build"].some(field => config[field] !== receipt.application?.[field]))
    throw new Error("The release sidecar identity differs from its archive");
  if (!/^(?:(macos|linux)-(aarch64|x86_64)|windows-x86_64)$/.test(receipt.platform ?? ""))
    throw new Error("The release receipt has an unsupported platform");
  const extension = receipt.platform?.startsWith("linux-") ? "tar.gz" : "zip";
  if (path.basename(archive) !== `Logseq-NSH-${config.version}-${receipt.platform}.${extension}`)
    throw new Error("The release archive name differs from its recorded version/platform");
  if (receipt.installer) {
    const installer = receipt.installer;
    if (typeof installer.name !== "string" || path.basename(installer.name) !== installer.name
        || installer.name !== path.basename(archive).replace(/\.zip$/, "-setup.exe")
        || api.digestArtifact(path.join(path.dirname(archive), installer.name)) !== installer.sha256)
      throw new Error("Installer does not match its final archive receipt");
  }
  return {archive:path.resolve(archive), configuration:path.resolve(configuration),
    application:receipt.application, platform:receipt.platform};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "stage" && args.length === 12) {
    const [host, library, resources, bin, destination, snapshot, luiSource, launcher,
      platform, arch, updateUrl, updateKey] = args;
    await stage({host, library, resources, bin, destination, snapshot, luiSource,
      platform, arch, updateUrl, updateKey});
    copyFileSync(path.join(scripts, "launch-nsh.sh"), path.join(bin, launcher));
    chmodSync(path.join(bin, launcher), 0o755);
  } else if (mode === "finish" && (args.length === 3 || args.length === 4)) {
    const [snapshot, archive, finalArchive, deliveryFile] = args;
    await finish({snapshot, archive, finalArchive, delivery:deliveryFile ? read(deliveryFile) : undefined});
  } else if (mode === "stage-windows" && args.length === 9) {
    const [host, library, resources, bin, destination, snapshot, luiSource, updateUrl, updateKey] = args;
    await stage({host, library, resources, bin, destination, snapshot, luiSource,
      updateUrl, updateKey, platform:"windows", arch:"x86_64"});
  } else if (mode === "check-release-windows" && args.length === 2) {
    console.log(JSON.stringify(await checkRelease({archive:args[0], luiSource:args[1]})));
  } else if (mode === "check-release" && args.length === 1) {
    const luiSource = path.resolve(process.env.LUI_SOURCE_ROOT ?? path.join(repo, "../lui"));
    console.log(JSON.stringify(await checkRelease({archive:args[0], luiSource})));
  } else throw new Error("Expected stage, finish or check-release package arguments");
}
