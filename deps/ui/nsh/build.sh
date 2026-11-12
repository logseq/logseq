#!/usr/bin/env bash
set -euo pipefail
nsh_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ui_root=$(cd "$nsh_root/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
build_profile=dev
# Bash 3.2 with nounset rejects an empty array expansion. Keep the shared
# Cargo arguments nonempty for both default/debug and release builds.
cargo_args=(--locked --manifest-path "$nsh_root/Cargo.toml")
if [[ ${1:-} == --release ]]; then
  build_profile=release
  cargo_args=(--release "${cargo_args[@]}")
  shift
fi
[[ $# -eq 0 ]] || { printf 'Usage: build.sh [--release]\n' >&2; exit 1; }
export DUNE_PROFILE="$build_profile"
if [[ $build_profile == release ]]; then
  # Keep the existing bin/../Resources contract without replacing dev artifacts.
  output="$ui_root/_build/nsh-release/bin"
  resources="$ui_root/_build/nsh-release/Resources"
else
  output="$ui_root/_build/nsh"
  resources="$ui_root/_build/Resources"
fi
printf 'NSH build profile: %s (DUNE_PROFILE=%s)\n' "$build_profile" "$DUNE_PROFILE" >&2
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
publication_tool="$nsh_root/build_publication.mjs"
cargo metadata --locked --format-version=1 --manifest-path "$nsh_root/Cargo.toml" \
  > "$staging/cargo-metadata.json"
"$node_bin" "$publication_tool" snapshot "$receipt_tool" "$repo_root" "$lui_source" \
  "$staging/cargo-metadata.json" "$staging/sources.json" "" "$build_profile"
# Refuse stale canonical domains before compiling the application provider.
# Regeneration is an explicit source change, so a new enum case cannot reuse an
# old Rust contract that would hide its missing native implementation.
(cd "$lui_source" && OPAMSWITCH="$switch" "$python_bin" tooling/generate_nsh_contract.py --check) >&2
# Validate the application-specific ABI before invoking native compilers.
"$python_bin" - "$nsh_root" "$ui_root/native/logseq_lui_bridge.c" <<'BRIDGE_SOURCE'
from pathlib import Path
import sys
sys.path.insert(0, sys.argv[1])
from build_windows_dll import bridge_exports
bridge_exports(Path(sys.argv[2]).read_text(encoding="utf-8"))
BRIDGE_SOURCE
OPAMSWITCH="$switch" "$python_bin" "$nsh_root/validate_primitive_signatures.py" >&2
(cd "$lui_source" && opam exec --switch="$switch" -- dune build @install) >&2
(cd "$ui_root" && opam exec --switch="$switch" -- env \
  OCAMLPATH="$lui_source/_build/install/default/lib${OCAMLPATH:+:$OCAMLPATH}" \
  dune build native/native_embed.exe.o) >&2
(cd "$repo_root/deps/db-worker" && opam exec --switch="$switch" -- dune build bin/main.exe) >&2
staged_resources="$staging/Resources"
mkdir -p "$staged_resources/fonts" "$staged_resources/img" "$staged_resources/dicts"
# All candidate code and resources stay private until qualification succeeds.
cc -o "$staging/$(basename "$library")" "$ui_root/_build/default/native/native_embed.exe.o" "${link_flags[@]}"
# Validate actual candidate symbols before schemas, startup or publication.
# Loading may run loader initializers; this child invokes no OCaml entry point.
"$python_bin" - "$nsh_root" "$staging/$(basename "$library")" "$ui_root/native/logseq_lui_bridge.c" <<'BRIDGE_EXPORTS'
import ctypes
from pathlib import Path
import sys

sys.path.insert(0, sys.argv[1])
from build_windows_dll import bridge_exports

required = bridge_exports(Path(sys.argv[3]).read_text(encoding="utf-8"))
library = ctypes.CDLL(sys.argv[2])
missing = [name for name in required if not hasattr(library, name)]
if missing:
    raise SystemExit("Candidate Logseq OCaml library is missing exports: " + ", ".join(missing))
BRIDGE_EXPORTS
ocaml_where=$(opam exec --switch="$switch" -- ocamlc -where)
cc -I "$ocaml_where" -o "$staging/export-schemas" "$nsh_root/export_schemas.c" \
  "$ui_root/_build/default/native/native_embed.exe.o" -lpthread -lm
"$staging/export-schemas" > "$staging/schemas.json"
# A regenerated schema is reviewable source. The stability check below rejects
# this build if it changed, so the next cached build compiles that exact receipt.
if ! cmp -s "$staging/schemas.json" "$nsh_root/schemas.json"; then
  cp "$staging/schemas.json" "$nsh_root/schemas.json"
fi
cp "$ui_root/assets/"*.json "$staged_resources/"
cp "$ui_root/assets/fonts/"*.ttf "$staged_resources/fonts/"
cp -R "$repo_root/resources/img/." "$staged_resources/img/"
cp "$repo_root/resources/dicts/"*.edn "$staged_resources/dicts/"
cargo build "${cargo_args[@]}" --message-format=json-render-diagnostics \
  > "$staging/cargo-build.jsonl"
"$python_bin" - "$staging/cargo-build.jsonl" "$staging/logseq-nsh" \
  "$repo_root/deps/db-worker/_build/default/bin/main.exe" "$staged_resources/logseq-db-worker" \
  "$staging/lui-rust-manifest" <<'BUILD_ARTIFACT'
import json
from pathlib import Path
import shutil
import sys

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines()]
artifacts = [record["executable"] for record in records
             if record.get("reason") == "compiler-artifact" and record.get("executable")
             and record["target"]["name"] == "nsh-app-logseq"]
manifests = {record["manifest_path"] for record in records
             if record.get("reason") == "compiler-artifact"
             and record.get("target", {}).get("name") == "lui_nsh"}
if len(artifacts) != 1 or len(manifests) != 1:
    raise SystemExit("Expected exactly one Logseq executable and compiled LUI Rust package")
shutil.copy2(artifacts[0], sys.argv[2])
shutil.copy2(sys.argv[3], sys.argv[4])
Path(sys.argv[5]).write_text(next(iter(manifests)))
BUILD_ARTIFACT
"$node_bin" "$publication_tool" check "$staging/sources.json" "$staging/lui-rust-manifest"
# Literal presentation in every actual native module is checked with the
# candidate provider before any application window or publication step.
OCAMLPATH="$lui_source/_build/install/default/lib${OCAMLPATH:+:$OCAMLPATH}" \
  "$python_bin" "$nsh_root/validate_static_styles.py" "$staging/logseq-nsh" >&2
# The real application gate loads only the complete candidate set. No published
# file or prior build receipt is changed when compilation or this gate fails.
LUI_OCAML_LIBRARY="$staging/$(basename "$library")" \
LOGSEQ_NATIVE_ASSET_DIR="$staged_resources" \
LOGSEQ_DB_WORKER_BIN="$staged_resources/logseq-db-worker" \
cargo test "${cargo_args[@]}" \
  --test startup_preflight -- --exact real_application_startup_preflight --nocapture >&2
# Recheck sources after qualification and prepare the final-location receipt
# from the tested staged bytes before any success-path publication starts.
"$node_bin" "$publication_tool" receipt "$staging/sources.json" "$staging/lui-rust-manifest" \
  "$staging/logseq-nsh" "$output/logseq-nsh" \
  "$staging/$(basename "$library")" "$library" "$staged_resources" "$resources"
"$python_bin" - "$staging/logseq-nsh" "$output/logseq-nsh" \
  "$staging/$(basename "$library")" "$library" "$staged_resources" "$resources" <<'PUBLISH'
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sys
import tempfile


def atomic_copy(source, destination):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{destination.name}.", dir=destination.parent)
    os.close(descriptor)
    try:
        # Do not truncate mapped code, including a symlink's existing target.
        shutil.copy2(source, temporary)
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)


source_resources, destination_resources = map(Path, sys.argv[5:7])
files = {file.relative_to(source_resources) for file in source_resources.rglob("*") if file.is_file()}
previous_receipt = Path(sys.argv[2] + ".lui-build.json")
try:
    previous = json.loads(previous_receipt.read_text())
except (OSError, json.JSONDecodeError):
    previous = {}
owned = previous.get("ownedResources", [])
if not isinstance(owned, list) or any(not isinstance(name, str) for name in owned):
    raise SystemExit("Invalid previous NSH resource ownership receipt")
for name in owned:
    relative = PurePosixPath(name)
    if not name or relative.is_absolute() or ".." in relative.parts:
        raise SystemExit("Invalid previous NSH resource ownership path")
for relative in sorted(files):
    atomic_copy(source_resources / relative, destination_resources / relative)
# Resources is shared with maintained backends. Retire only paths explicitly
# owned by a previous NSH receipt; a legacy receipt authorizes no deletion.
for name in owned:
    relative = Path(name)
    if relative not in files:
        destination = destination_resources / relative
        if destination.is_file() or destination.is_symlink():
            destination.unlink()
atomic_copy(sys.argv[3], sys.argv[4])
atomic_copy(sys.argv[1], sys.argv[2])
# Local publication is per-file atomic, not a multi-file transaction. Any copy
# failure stops here without issuing a successful receipt for a partial set.
atomic_copy(sys.argv[1] + ".lui-build.json", sys.argv[2] + ".lui-build.json")
PUBLISH
printf '%s\n' "$output/logseq-nsh"
