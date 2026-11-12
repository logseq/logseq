#!/usr/bin/env python3
"""Build and qualify the complete actual Logseq app on native Windows x86_64.

No package, signing or update qualification is implied. All compilers operate on
private candidates; actual startup must pass before per-file publication, with
the final build receipt published last. DLL searches never use the build PATH.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path, PureWindowsPath
import shutil
import subprocess
import sys
import tempfile

import build_windows_dll as ocaml
import windows_dependencies as dependencies

REPO = Path(__file__).resolve().parents[3]
UI = REPO / "deps/ui"
HOST = UI / "nsh"


def execute(command, *, cwd=REPO, environment=None, capture=False, timeout=None):
    result = subprocess.run(list(map(str, command)), cwd=cwd, env=environment, check=True,
                            text=True, encoding="utf-8", stdout=subprocess.PIPE if capture else sys.stderr, timeout=timeout)
    return result.stdout if capture else None


def artifact(records, target):
    matches = [record["executable"] for record in records
               if record.get("reason") == "compiler-artifact" and record.get("executable")
               and record.get("target", {}).get("name") == target]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one compiled {target} executable")
    return Path(matches[0]).resolve(strict=True)


def clean_environment(environment, system_root):
    cleaned = environment.copy()
    for name in ("LUI_OCAML_LIBRARY", "LOGSEQ_NATIVE_ASSET_DIR", "LOGSEQ_DB_WORKER_BIN",
                 "NSH_RUNTIME", "NSH_RUNTIME_DIR", "OCAMLPATH", "CAML_LD_LIBRARY_PATH"):
        cleaned.pop(name, None)
    # Native executables/OCaml DLLs must find their declared dependencies inside
    # the candidate, not in opam/MinGW/MSVC development folders.
    cleaned["PATH"] = os.pathsep.join(map(str, (system_root / "System32", system_root)))
    return cleaned


def atomic_copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{target.name}.", dir=target.parent)
    os.close(descriptor)
    try:
        shutil.copy2(source, temporary)
        os.replace(temporary, target)
    finally:
        Path(temporary).unlink(missing_ok=True)


def publish(candidate, output, *, verify):
    """Publish only a fully verified candidate; a RED gate never reaches here."""
    verify()
    executable = candidate / "logseq-nsh.exe"
    receipt_path = Path(str(executable) + ".lui-build.json")
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    resources = receipt["ownedResources"]
    code = receipt.get("ownedCode", [])
    previous_file = output / receipt_path.name
    previous = json.loads(previous_file.read_text(encoding="utf-8")) if previous_file.exists() else {}
    old_resources = previous.get("ownedResources", [])
    old_code = previous.get("ownedCode", [])
    for name in [*resources, *code, *old_resources, *old_code]:
        relative = Path(name)
        if (relative.is_absolute() or PureWindowsPath(name).drive or not name or "\\" in name
                or any(part in ("", ".", "..") for part in name.split("/"))):
            raise ValueError("Invalid candidate-owned file")
    # This is a backend-owned output directory, separate from shared Resources.
    for name in resources:
        atomic_copy(candidate / "Resources" / name, output / "Resources" / name)
    for name in code:
        atomic_copy(candidate / name, output / name)
    for name in set(old_resources) - set(resources):
        (output / "Resources" / name).unlink(missing_ok=True)
    for name in set(old_code) - set(code):
        (output / name).unlink(missing_ok=True)
    atomic_copy(executable, output / executable.name)
    atomic_copy(receipt_path, output / receipt_path.name)
    return output / executable.name


def build(*, output, lui_source, dll_roots, dumpbin):
    compiler = ocaml.native_config()  # Refuse WSL/Cygwin/foreign architectures first.
    system_root = Path(os.environ["SystemRoot"]).resolve(strict=True)
    environment = os.environ.copy()
    environment.setdefault("RUSTUP_TOOLCHAIN", "1.97.0")
    environment.setdefault("CARGO_BUILD_JOBS", "2")
    environment["OCAMLPATH"] = str(lui_source / "_build/install/default/lib") + (
        os.pathsep + environment["OCAMLPATH"] if environment.get("OCAMLPATH") else "")
    tool = lui_source / "tooling/lui_build_receipt.mjs"
    publication = HOST / "build_publication.mjs"
    node = shutil.which("node")
    if not node:
        raise ValueError("Node.js is required for existing native source receipts")
    spec = importlib.util.spec_from_file_location("lui_delivery", lui_source / "tooling/nsh_delivery.py")
    delivery = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(delivery)
    inspect = dependencies.inspector(dumpbin, delivery.architectures)
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".publication-", dir=output) as temporary:
        stage = Path(temporary)
        metadata = stage / "cargo-metadata.json"
        metadata.write_text(execute(["cargo", "metadata", "--locked", "--format-version=1",
            "--manifest-path", HOST / "Cargo.toml"], environment=environment, capture=True), encoding="utf-8")
        snapshot = stage / "sources.json"
        rebuild = [sys.executable, Path(__file__).resolve(), "--output", output,
                   "--lui-source", lui_source, "--dumpbin", Path(dumpbin).resolve()]
        for root in dll_roots:
            rebuild.extend(("--dll-root", Path(root).resolve()))
        execute([node, publication, "snapshot", tool, REPO, lui_source, metadata, snapshot,
                 subprocess.list2cmdline(list(map(str, rebuild)))], environment=environment)
        ocaml.validate_runtime_exports((UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8"),
                                       json.loads(metadata.read_text(encoding="utf-8")))
        execute([sys.executable, lui_source / "tooling/generate_nsh_contract.py", "--check"],
                cwd=lui_source, environment=environment)
        execute(["opam", "exec", "--", "dune", "build", "@install"], cwd=lui_source, environment=environment)
        library = ocaml.build(stage / "ocaml", environment=environment)
        # The DLL builder has exported/compared the real extension schemas before
        # Rust's include_str!(schemas.json) is compiled.
        execute(["opam", "exec", "--", "dune", "build", "bin/main.exe"],
                cwd=REPO / "deps/db-worker", environment=environment)
        records = execute(["cargo", "build", "--locked", "--manifest-path", HOST / "Cargo.toml",
                           "--message-format=json"], environment=environment, capture=True)
        records = [json.loads(line) for line in records.splitlines() if line.strip()]
        compiled_manifests = {record["manifest_path"] for record in records
                              if record.get("reason") == "compiler-artifact"
                              and record.get("target", {}).get("name") == "lui_nsh"}
        if len(compiled_manifests) != 1:
            raise ValueError("Expected exactly one compiled LUI Rust package")
        manifest = stage / "lui-rust-manifest"
        manifest.write_text(next(iter(compiled_manifests)), encoding="utf-8")
        candidate = stage / "application"
        resources = candidate / "Resources"
        resources.mkdir(parents=True)
        shutil.copy2(artifact(records, "nsh-app-logseq"), candidate / "logseq-nsh.exe")
        execute(["opam", "exec", "--", sys.executable, HOST / "validate_static_styles.py",
                 candidate / "logseq-nsh.exe"], environment=environment)
        shutil.copy2(library, resources / "logseq_ui.dll")
        shutil.copy2(REPO / "deps/db-worker/_build/default/bin/main.exe", resources / "logseq-db-worker.exe")
        for pattern, source, destination in (("*.json", UI / "assets", resources),
                ("*.ttf", UI / "assets/fonts", resources / "fonts"),
                ("*.edn", REPO / "resources/dicts", resources / "dicts")):
            destination.mkdir(parents=True, exist_ok=True)
            for file in source.glob(pattern):
                shutil.copy2(file, destination / file.name)
        shutil.copytree(REPO / "resources/img", resources / "img")
        gate_records = execute(["cargo", "test", "--locked", "--manifest-path", HOST / "Cargo.toml",
            "--test", "startup_preflight", "--no-run", "--message-format=json"], environment=environment, capture=True)
        gate_records = [json.loads(line) for line in gate_records.splitlines() if line.strip()]
        gate = stage / "gate/startup_preflight.exe"
        gate.parent.mkdir()
        shutil.copy2(artifact(gate_records, "startup_preflight"), gate)
        closed = dependencies.collect([(candidate / "logseq-nsh.exe", candidate),
            (resources / "logseq_ui.dll", resources), (resources / "logseq-db-worker.exe", resources),
            (gate, gate.parent)], roots=dll_roots, system_directory=system_root / "System32", inspect=inspect)
        dependencies.copy(closed)
        shipped = [item for item in closed if item["destination"].is_relative_to(candidate)]
        (resources / "windows-dependencies.json").write_text(json.dumps({
            "qualification":"PE import closure; real startup is checked before publication",
            "compiler":compiler,
            "files":[{"source":str(item["source"]),
                      "destination":item["destination"].relative_to(candidate).as_posix(),
                      "sha256":item["sha256"]} for item in shipped]}, indent=2) + "\n", encoding="utf-8")
        execute([node, publication, "check", snapshot, manifest], environment=environment)
        gate_environment = clean_environment(environment, system_root)
        gate_environment.update(LUI_OCAML_LIBRARY=str(resources / "logseq_ui.dll"),
            LOGSEQ_NATIVE_ASSET_DIR=str(resources), LOGSEQ_DB_WORKER_BIN=str(resources / "logseq-db-worker.exe"))
        execute([gate, "--exact", "real_application_startup_preflight", "--nocapture", "--test-threads=1"],
                cwd=stage, environment=gate_environment, timeout=240)
        dependencies.verify_sources(closed)
        extra = stage / "extra-code.json"
        extra.write_text(json.dumps([{"source":str(item["destination"]),
            "target":str(output / item["destination"].name)} for item in shipped
            if item["destination"].parent == candidate]), encoding="utf-8")
        execute([node, publication, "receipt", snapshot, manifest,
            candidate / "logseq-nsh.exe", output / "logseq-nsh.exe", resources / "logseq_ui.dll",
            output / "Resources/logseq_ui.dll", resources, output / "Resources", extra], environment=environment)
        def verify():
            execute([node, publication, "check", snapshot, manifest], environment=environment)
            dependencies.verify_sources(closed)
        return publish(candidate, output, verify=verify)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=UI / "_build/nsh-windows")
    parser.add_argument("--lui-source", type=Path, default=Path(os.environ.get("LUI_SOURCE_ROOT", REPO.parent / "lui")))
    parser.add_argument("--dll-root", type=Path, action="append", default=[])
    parser.add_argument("--dumpbin", type=Path, default=shutil.which("dumpbin"))
    args = parser.parse_args()
    if args.dumpbin is None:
        parser.error("Use an x64 Visual Studio tools shell or pass --dumpbin explicitly")
    try:
        print(build(output=args.output, lui_source=args.lui_source.resolve(strict=True),
                    dll_roots=args.dll_root, dumpbin=args.dumpbin))
    except (OSError, ValueError, subprocess.SubprocessError, RuntimeError) as error:
        parser.exit(1, f"Actual Windows native build failed: {error}\n")


if __name__ == "__main__":
    main()
