#!/usr/bin/env bash
set -euo pipefail
nsh_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ui_root=$(cd "$nsh_root/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
output="$ui_root/_build/nsh"
resources="$ui_root/_build/Resources"
switch="${OPAMSWITCH:-5.5.1}"
lui_source=$(cd "${LUI_SOURCE_ROOT:-$repo_root/../lui}" && pwd -P)
export RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-1.97.0}"
export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-2}"
node_bin="${NODE_BINARY:-node}"
python_bin="${PYTHON_BINARY:-python3}"
command -v "$node_bin" >/dev/null || { printf 'Node.js is required for native build receipts.\n' >&2; exit 1; }
command -v "$python_bin" >/dev/null || { printf 'Python 3 is required for atomic native publication.\n' >&2; exit 1; }
receipt_tool="$lui_source/tooling/lui_build_receipt.mjs"
[[ -f $receipt_tool ]] || { printf 'LUI build receipt module is missing: %s\n' "$receipt_tool" >&2; exit 1; }
mkdir -p "$output"
staging=$(mktemp -d "$output/.publication.XXXXXX")
trap 'rm -rf "$staging"' EXIT
case "$(uname -s)" in
  Darwin) library="$output/liblogseq_ui.dylib"; link_flags=(-dynamiclib -Wl,-install_name,@rpath/liblogseq_ui.dylib) ;;
  Linux) library="$output/liblogseq_ui.so"; link_flags=(-shared "-Wl,-z,defs" -lpthread -ldl -lm) ;;
  *) printf 'Build the native OCaml host with a macOS or Linux toolchain.\n' >&2; exit 1 ;;
esac
if [[ $(uname -s) == Linux ]]; then
  system_archive=$(cc -print-file-name=librt.a)
  if [[ $system_archive != /* ]]; then
    printf 'The C toolchain cannot locate librt.a. Install libc development files.\n' >&2
    exit 1
  fi
  system_archive_dir=$(dirname "$system_archive")
  export OCAMLPARAM="${OCAMLPARAM:-_},cclib=-L$system_archive_dir"
fi
# Refuse stale canonical domains before compiling the application provider.
# Regeneration is an explicit source change, so a new enum case cannot reuse an
# old Rust contract that would hide its missing native implementation.
(cd "$lui_source" && OPAMSWITCH="$switch" "$python_bin" tooling/generate_nsh_contract.py --check) >&2
(cd "$lui_source" && opam exec --switch="$switch" -- dune build @install) >&2
(cd "$ui_root" && opam exec --switch="$switch" -- env \
  OCAMLPATH="$lui_source/_build/install/default/lib${OCAMLPATH:+:$OCAMLPATH}" \
  dune build native/native_embed.exe.o) >&2
(cd "$repo_root/deps/db-worker" && opam exec --switch="$switch" -- dune build bin/main.exe) >&2
mkdir -p "$output" "$resources/fonts" "$resources/img" "$resources/dicts"
# Link away from the published inode. A running process may still map the
# current dylib, executable or DB worker; overwriting a signed Mach-O kills it.
cc -o "$staging/$(basename "$library")" "$ui_root/_build/default/native/native_embed.exe.o" "${link_flags[@]}"
ocaml_where=$(opam exec --switch="$switch" -- ocamlc -where)
cc -I "$ocaml_where" -o "$staging/export-schemas" "$nsh_root/export_schemas.c" \
  "$ui_root/_build/default/native/native_embed.exe.o" -lpthread -lm
"$staging/export-schemas" > "$staging/schemas.json"
# Keep the canonical receipt reviewable. A change requires rebuilding this file,
# rather than accepting guessed schema fingerprints in the Rust adapter.
if ! cmp -s "$staging/schemas.json" "$nsh_root/schemas.json"; then
  cp "$staging/schemas.json" "$nsh_root/schemas.json"
fi
cp "$ui_root/assets/"*.json "$resources/"
cp "$ui_root/assets/fonts/"*.ttf "$resources/fonts/"
cp -R "$repo_root/resources/img/." "$resources/img/"
cp "$repo_root/resources/dicts/"*.edn "$resources/dicts/"
cargo build --locked --manifest-path "$nsh_root/Cargo.toml" --message-format=json \
  > "$output/cargo-build.jsonl"
"$python_bin" - "$output/cargo-build.jsonl" "$output/logseq-nsh" \
  "$staging/$(basename "$library")" "$library" \
  "$repo_root/deps/db-worker/_build/default/bin/main.exe" "$resources/logseq-db-worker" \
  "$staging/lui-rust-manifest" <<'BUILD_ARTIFACT'
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines()]
artifacts = [record["executable"] for record in records
             if record.get("reason") == "compiler-artifact" and record.get("executable")
             and record["target"]["name"] == "nsh-app-logseq"]
manifests = {record["manifest_path"] for record in records
             if record.get("reason") == "compiler-artifact"
             and record.get("target", {}).get("name") == "lui_nsh"}
if len(artifacts) != 1 or len(manifests) != 1:
    raise SystemExit("Expected exactly one Logseq executable and compiled LUI Rust package")

def atomic_copy(source, destination):
    destination = Path(destination)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{destination.name}.", dir=destination.parent)
    os.close(descriptor)
    try:
        # Preserve executable permissions, but never open the published inode
        # for writing (including a symlink's existing target).
        shutil.copy2(source, temporary)
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)

# Every replace stays within its destination filesystem. Existing mapped
# inodes and the processes using them are left alone.
os.replace(sys.argv[3], sys.argv[4])
atomic_copy(sys.argv[5], sys.argv[6])
atomic_copy(artifacts[0], sys.argv[2])
Path(sys.argv[7]).write_text(next(iter(manifests)))
BUILD_ARTIFACT
# Qualify the actual OCaml application in a fresh headless process before
# recording a successful build. This does not create or activate an OS window.
LUI_OCAML_LIBRARY="$library" \
LOGSEQ_NATIVE_ASSET_DIR="$resources" \
LOGSEQ_DB_WORKER_BIN="$resources/logseq-db-worker" \
cargo test --locked --manifest-path "$nsh_root/Cargo.toml" \
  --test startup_preflight -- --exact real_application_startup_preflight --nocapture >&2
"$node_bin" --input-type=module - "$receipt_tool" "$repo_root" "$lui_source" \
  "$staging/lui-rust-manifest" "$output/logseq-nsh" "$library" "$resources" <<'BUILD_RECEIPT'
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
const [tool, repo, ocamlLui, manifestFile, artifact, library, resources] = process.argv.slice(2);
const {writeReceipt} = await import(pathToFileURL(tool).href);
const rustManifest = readFileSync(manifestFile, "utf8");
const rustPackage = path.dirname(rustManifest);
const inputs = [];
function add(file, optional = false) {
  if (!existsSync(file)) {
    if (optional) return;
    throw new Error(`Missing native build receipt input: ${file}`);
  }
  inputs.push(path.resolve(file));
}
const app = (...segments) => path.join(repo, ...segments);
// Source scopes only: never walk the repository root, _build, target,
// node_modules or generated .nsh runner/cache trees.
for (const scope of ["src", "native", "subs", "shims", "tools", "assets"]) add(app("deps/ui", scope));
for (const file of ["dune-project", "dune-workspace"]) add(app("deps/ui", file), true);
add(app("deps/ui/nsh/src")); add(app("deps/ui/nsh/tests"));
for (const file of ["Cargo.toml", "Cargo.lock", "nsh.json", "schemas.json", "export_schemas.c", "build.sh", "run.sh"])
  add(app("deps/ui/nsh", file));
for (const scope of ["bin", "desktop", "lib", "runtime", "stubs", "vendor"]) add(app("deps/db-worker", scope));
for (const file of ["dune-project", "dune-workspace", "logseq-db-worker.opam"]) add(app("deps/db-worker", file));
add(app("resources/dicts")); add(app("resources/img")); add(app("resources/js/emoji-data.js"));
for (const scope of ["src", "ppx", "platform/bridge"]) add(path.join(ocamlLui, scope));
for (const file of ["dune-project", "dune-workspace", "lui.opam"]) add(path.join(ocamlLui, file), true);
add(rustManifest); add(path.join(rustPackage, "src"));
for (const file of ["Cargo.lock", "build.rs"]) add(path.join(rustPackage, file), true);
add(tool); add(library); add(resources);
// The OCaml and Rust LUI checkouts may differ. Both are recorded, and the
// Rust path comes from Cargo's actual compiler artifact, not a guessed sibling.
// Choose a non-Git ancestor so the existing receipt API's filesystem fallback
// includes ignored runtime artifacts and external checkouts as well. It walks
// only the explicit scopes above, not this common ancestor.
let root = path.resolve(repo);
while (!inputs.every(file => {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
})) root = path.dirname(root);
for (;;) {
  try { execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], {stdio:"ignore"}); }
  catch { break; }
  const parent = path.dirname(root);
  if (parent === root) throw new Error("Cannot choose an unambiguous receipt input root outside Git");
  root = parent;
}
const quote = value => "'" + value.replaceAll("'", "'\"'\"'") + "'";
const command = `LUI_SOURCE_ROOT=${quote(ocamlLui)} bash ${quote(app("deps/ui/nsh/build.sh"))}`;
const receipt = writeReceipt({artifact, command, root,
  inputs:[...new Set(inputs.map(file => path.relative(root, file)))].sort()});
process.stderr.write(`lui build receipt: ${receipt}\n`);
BUILD_RECEIPT
printf '%s\n' "$output/logseq-nsh"
