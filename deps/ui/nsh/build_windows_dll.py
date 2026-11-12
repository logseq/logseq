#!/usr/bin/env python3
"""Build a candidate actual Logseq OCaml DLL on native Windows.

This does not publish the application, supply its worker/assets, or qualify a
package. It links the real seven-argument bridge, never LUI's generic bridge.
"""
from __future__ import annotations

import argparse
import hashlib
from functools import partial
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[3]
UI = REPO / "deps/ui"
ARCHIVES = (
    "src/contracts/logseq_ui_contracts.cmxa",
    "src/shared/logseq_ui_shared.cmxa",
    "native/services/logseq_ui_native_services.cmxa",
    "native/logseq_ui_native.cmxa",
)
PACKAGES = ",".join((
    "lui.plugin_fetch", "ocaml-signal", "melange-transit-core", "melange-transit-native",
    "melange-edn-core", "melange-edn-native", "yojson", "ptime", "uri", "unix",
    "threads.posix", "digestif", "str", "markup", "mtime.clock.os", "re", "re.pcre",
))


def execute(command, *, cwd=UI, capture=False, environment=None):
    result = subprocess.run(list(map(str, command)), cwd=cwd, check=True, text=True, encoding="utf-8",
                            stdout=subprocess.PIPE if capture else sys.stderr, env=environment)
    return result.stdout.strip() if capture else None


def native_config():
    if platform.system() != "Windows":
        raise ValueError("This builder requires native Windows, not WSL or cross-compilation")
    text = execute(["opam", "exec", "--", "ocamlopt", "-config"], capture=True)
    config = dict(line.split(":", 1) for line in text.splitlines() if ":" in line)
    config = {name: value.strip() for name, value in config.items()}
    if (config.get("os_type"), config.get("ext_dll"), config.get("architecture")) != ("Win32", ".dll", "amd64"):
        raise ValueError("The active compiler must target native Windows x86_64")
    if config.get("version") != "5.5.1" or config.get("ext_obj") not in (".o", ".obj"):
        raise ValueError("The native DLL route requires OCaml 5.5.1 and its configured object suffix")
    return config


def bridge_exports(source):
    exports = sorted(set(re.findall(r"LUI_EXPORT\s+\w+\s+(lui_ocaml_\w+)\s*\(", source)))
    required = {"lui_ocaml_start", "lui_ocaml_pump", "lui_ocaml_platform_event",
                "lui_ocaml_editor_snapshot_utf8", "lui_ocaml_extension_event_utf8"}
    if not required.issubset(exports):
        raise ValueError("The application source is missing its typed Logseq service ABI")
    return exports


def build(output, *, environment=None):
    config = native_config()
    run = partial(execute, environment=environment)
    # Build only libraries. The Unix native_embed executable object's _pic
    # runtime flag is deliberately not involved in this native DLL route.
    run(["opam", "exec", "--", "dune", "build", *ARCHIVES])
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".candidate-", dir=output) as temporary:
        stage = Path(temporary)
        bridge = UI / "native/logseq_lui_bridge.c"
        exports = bridge_exports(bridge.read_text(encoding="utf-8"))
        c_object = stage / ("logseq_lui_bridge" + config["ext_obj"])
        run(["opam", "exec", "--", "ocamlopt", "-c", "-o", c_object, bridge], cwd=stage)
        includes = []
        for archive in ARCHIVES:
            archive = Path(archive)
            objects = UI / "_build/default" / archive.parent / f".{archive.stem}.objs"
            for kind in ("byte", "native"):
                includes.extend(("-I", objects / kind))
        compiler = ["opam", "exec", "--", "ocamlfind", "ocamlopt", "-thread", "-package", PACKAGES, *includes]
        embed = stage / "native_embed.cmx"
        run([*compiler, "-c", "-o", embed, UI / "native/native_embed.ml"], cwd=stage)
        library = stage / "logseq_ui.dll"
        run([*compiler, "-linkall", "-linkpkg",
                 *(UI / "_build/default" / archive for archive in ARCHIVES), embed, c_object,
                 "-output-complete-obj", "-o", library], cwd=stage)
        # Reuse the typed OCaml exporter from the same compiled module; unlike
        # the Unix object route, this needs no _pic object or external C linker.
        schema_source = stage / "export_schemas.ml"
        schema_source.write_text("let () = print_endline (Native_embed.extension_schemas ())\n",
                                 encoding="utf-8")
        schema_program = stage / "export_schemas.exe"
        run([*compiler, "-linkall", "-linkpkg",
                 *(UI / "_build/default" / archive for archive in ARCHIVES),
                 embed, c_object, schema_source, "-o", schema_program], cwd=stage)
        schemas = json.loads(run([schema_program], cwd=stage, capture=True))
        expected = json.loads((UI / "nsh/schemas.json").read_text(encoding="utf-8"))
        if schemas != expected:
            raise ValueError("The actual compiled Windows schemas differ from nsh/schemas.json; regenerate and qualify the source receipt")
        schema_file = stage / "schemas.json"
        schema_file.write_text(json.dumps(schemas, indent=2) + "\n", encoding="utf-8")
        # A child checks PE dependencies/exports and exits before the candidate
        # DLL is renamed. Windows locks a loaded DLL. No lui_ocaml_* is called;
        # loader/CRT initializers may run, as with any native library load.
        probe = "import ctypes,json,sys; lib=ctypes.CDLL(sys.argv[1]); names=json.loads(sys.argv[2]); missing=[name for name in names if not hasattr(lib,name)]; assert not missing, missing"
        run(["opam", "exec", "--", sys.executable, "-c", probe, library, json.dumps(exports)], cwd=stage)
        target = output / library.name
        digest = hashlib.sha256(library.read_bytes()).hexdigest()
        receipt = {
            "qualification": "candidate DLL load and exports only; actual worker, application startup and package remain unqualified",
            "bridge": "Logseq seven-argument startup with ordered host-service channel",
            "compiler": config, "exports": exports, "artifactSha256": digest,
            "schemasSha256": hashlib.sha256(schema_file.read_bytes()).hexdigest(),
            "sources": {str(path.relative_to(REPO)): hashlib.sha256(path.read_bytes()).hexdigest()
                        for path in (Path(__file__).resolve(), bridge, UI / "native/native_embed.ml")},
            "archiveSha256": {archive: hashlib.sha256((UI / "_build/default" / archive).read_bytes()).hexdigest()
                              for archive in ARCHIVES},
        }
        receipt_file = stage / "ocaml-toolchain.json"
        receipt_file.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        os.replace(library, target)
        os.replace(schema_file, output / schema_file.name)
        os.replace(receipt_file, output / receipt_file.name)
        return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=UI / "_build/nsh-windows-candidate")
    args = parser.parse_args()
    try:
        print(build(args.output))
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Actual Windows OCaml DLL build failed: {error}\n")


if __name__ == "__main__":
    main()
