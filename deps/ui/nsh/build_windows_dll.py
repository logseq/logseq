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
    "lui", "lui.plugin_fetch", "ocaml-signal", "melange-transit-core", "melange-transit-native",
    "melange-edn-core", "melange-edn-native", "yojson", "ptime", "uri", "unix",
    "threads.posix", "digestif.c", "str", "markup", "mtime.clock.os", "re", "re.pcre",
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


# Actual application contract, including optional generic-LUI capabilities that
# this application publishes and uses. Keep these required at build time rather
# than deferring a missing pointer export until the first real native press.
NSH_REQUIRED_EXPORTS = frozenset({
    "lui_ocaml_start", "lui_ocaml_register_current_thread", "lui_ocaml_stop",
    "lui_ocaml_resync", "lui_ocaml_root_node", "lui_ocaml_pump",
    "lui_ocaml_platform_event", "lui_ocaml_agent_utf8",
    "lui_ocaml_editor_snapshot_utf8", "lui_ocaml_extension_event_utf8",
    "lui_ocaml_document_event_utf8", "lui_ocaml_virtual_window",
    "lui_ocaml_press_ex", "lui_ocaml_long_press", "lui_ocaml_double_press",
    "lui_ocaml_pointer_enter", "lui_ocaml_pointer_leave",
    "lui_ocaml_text_changed_utf8", "lui_ocaml_submit", "lui_ocaml_dismiss",
    "lui_ocaml_navigate_previous", "lui_ocaml_navigate_next",
    "lui_ocaml_navigation_key_utf8", "lui_ocaml_toggle_changed",
    "lui_ocaml_toggle_changed_detail", "lui_ocaml_slider_changed",
    "lui_ocaml_focus_within_changed",
    "lui_ocaml_appear", "lui_ocaml_load", "lui_ocaml_radio_changed",
    "lui_ocaml_picked_utf8", "lui_ocaml_scroll_completed",
    "lui_ocaml_scroll_edges", "lui_ocaml_visible_range",
    *(f"lui_ocaml_{name}_utf8" for name in (
        "press_detail", "pointer_down", "pointer_up", "pointer_move",
        "pointer_cancel", "context_menu_press")),
})


def bridge_exports(source):
    source = re.sub(r"/\*.*?\*/|//[^\n]*", "", source, flags=re.DOTALL)
    exports = set(re.findall(r"LUI_EXPORT\s+\w+\s+(lui_ocaml_\w+)\s*\(", source))
    # This app's single, explicit export macro emits both typed byte-length and
    # maintained C-string functions. Ignore its parameterized definition and
    # inventory each concrete invocation before probing the actual library.
    invocations = re.findall(r"^LUI_POINTER_DETAIL_EXPORT\((lui_ocaml_\w+)\)\s*$",
                             source, flags=re.MULTILINE)
    if invocations and "LUI_EXPORT int32_t c_name##_utf8(" not in source:
        raise ValueError("The application source is missing its typed Logseq service ABI: "
                         "pointer macro must export byte-length UTF-8 functions")
    for name in invocations:
        exports.update((name, name + "_utf8"))
    missing = NSH_REQUIRED_EXPORTS - exports
    if missing:
        raise ValueError("The application source is missing its typed Logseq service ABI: "
                         + ", ".join(sorted(missing)))
    return sorted(exports)


def validate_runtime_exports(source, metadata):
    """Check the event ABI from the actual Cargo-selected LUI provider.

    This intentionally accepts only the runtime's bounded literal Exports
    initializer. A changed loader shape requires reviewing this build guard;
    the separate generic/logseq startup drivers are not event capabilities.
    """
    providers = [package for package in metadata.get("packages", [])
                 if package.get("name") == "lui-nsh" and package.get("source") is None]
    if len(providers) != 1:
        raise ValueError("Expected exactly one local LUI Rust package for the event ABI guard")
    manifest = Path(providers[0]["manifest_path"]).resolve(strict=True)
    runtime = manifest.parent / "src/runtime.rs"
    text = runtime.read_text(encoding="utf-8")
    starts = list(re.finditer(r"\blet\s+exports\s*=\s*Exports\s*\{", text))
    error = "LUI event ABI loader shape changed; review the bounded Exports build guard"
    if len(starts) != 1:
        raise ValueError(error)
    tail = text[starts[0].end():]
    end = re.search(r"\n\s*\};", tail)
    if end is None:
        raise ValueError(error)
    body = re.sub(r"/\*.*?\*/|//[^\n]*", "", tail[:end.start()], flags=re.DOTALL)
    if "{" in body or "}" in body:
        raise ValueError(error)
    calls = re.findall(r"\boptional\s*!\s*\(([^()]*)\)", body)
    if not calls or len(calls) != len(re.findall(r"\boptional\s*!", body)):
        raise ValueError(error)
    requested = set()
    for argument in calls:
        symbol = re.fullmatch(r'\s*"(lui_ocaml_\w+)"\s*', argument)
        if symbol is None:
            raise ValueError(error)
        requested.add(symbol[1])
    missing = requested - NSH_REQUIRED_EXPORTS
    if missing:
        raise ValueError("Cargo-selected LUI event ABI is missing from the required application inventory: "
                         + ", ".join(sorted(missing)))
    exports = set(bridge_exports(source))
    if missing := requested - exports:
        raise ValueError("Cargo-selected LUI event ABI is missing application exports: "
                         + ", ".join(sorted(missing)))
    return sorted(requested)


def build(output, *, environment=None):
    config = native_config()
    run = partial(execute, environment=environment)
    bridge = UI / "native/logseq_lui_bridge.c"
    exports = bridge_exports(bridge.read_text(encoding="utf-8"))
    run([sys.executable, UI / "nsh/validate_primitive_signatures.py"])
    # Build only libraries. The Unix native_embed executable object's _pic
    # runtime flag is deliberately not involved in this native DLL route.
    run(["opam", "exec", "--", "dune", "build", *ARCHIVES])
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".candidate-", dir=output) as temporary:
        stage = Path(temporary)
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
