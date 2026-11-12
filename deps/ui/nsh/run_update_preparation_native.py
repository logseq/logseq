#!/usr/bin/env python3
"""Run admission tests against already-built actual native OCaml app libraries.

No Dune invocation, application initialization, daemon or native window is used.
The executable recompiles the real Native_embed source because Dune's executable
interface intentionally hides its internals. Temporary artifacts are discarded.
"""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import tempfile

from build_windows_dll import ARCHIVES, PACKAGES, UI


def run() -> None:
    archives = [UI / "_build/default" / archive for archive in ARCHIVES]
    if missing := [str(archive) for archive in archives if not archive.is_file()]:
        raise SystemExit("Build the actual native application archives first: " + ", ".join(missing))
    prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
    extension = subprocess.check_output(
        [*prefix, "ocamlopt", "-config-var", "ext_obj"], text=True,
    ).strip()
    if extension not in (".o", ".obj"):
        raise SystemExit("Unsupported native OCaml object suffix: " + extension)
    includes = []
    for archive in ARCHIVES:
        relative = Path(archive)
        objects = UI / "_build/default" / relative.parent / f".{relative.stem}.objs"
        for kind in ("byte", "native"):
            includes.extend(("-I", str(objects / kind)))
    compiler = [*prefix, "ocamlfind", "ocamlopt", "-thread", "-package", PACKAGES, *includes]
    with tempfile.TemporaryDirectory(prefix="logseq-update-admission-") as temporary:
        stage = Path(temporary)
        bridge = stage / ("logseq_lui_bridge" + extension)
        subprocess.run([*prefix, "ocamlopt", "-c", "-o", str(bridge),
                        str(UI / "native/logseq_lui_bridge.c")], cwd=stage, check=True)
        event_probe = stage / ("platform_event_exception" + extension)
        subprocess.run([*prefix, "ocamlopt", "-c", "-o", str(event_probe),
                        str(UI / "nsh/tests/platform_event_exception.c")], cwd=stage, check=True)
        embed = stage / "native_embed.cmx"
        subprocess.run([*compiler, "-c", "-o", str(embed),
                        str(UI / "native/native_embed.ml")], cwd=stage, check=True)
        geometry = stage / "editor_geometry_affinity_native.ml"
        geometry.write_bytes((UI / "nsh/tests/editor_geometry_affinity_native.ml").read_bytes())
        clipboard = stage / "editor_clipboard_native.ml"
        clipboard.write_bytes((UI / "nsh/tests/editor_clipboard_native.ml").read_bytes())
        source = stage / "update_preparation_native.ml"
        source.write_bytes((UI / "nsh/tests/update_preparation_native.ml").read_bytes())
        executable = stage / ("admission.exe" if os.name == "nt" else "admission")
        subprocess.run([*compiler, "-I", str(stage), "-linkall", "-linkpkg",
                        *map(str, archives), str(embed), str(geometry), str(clipboard), str(source), str(bridge), str(event_probe),
                        "-o", str(executable)], cwd=stage, check=True)
        result = subprocess.run([str(executable)], cwd=stage, check=False, timeout=30,
                                capture_output=True, text=True)
        print(result.stdout, end="")
        print(result.stderr, end="", file=sys.stderr)
        result.check_returncode()
        expected = ('OCaml exception in lui_ocaml_platform_event: '
                    'Failure("platform-event-callback-regression")')
        expected_messages = [expected,
            'platform event window-titlebar failed: '
            'Invalid_argument("Invalid native window titlebar insets")',
            'OCaml exception in lui_ocaml_platform_event: '
            'Invalid_argument("Invalid native window titlebar insets")']
        for message in expected_messages:
            if message not in result.stderr:
                raise RuntimeError("Actual platform-event exception diagnostic was not retained: " + message)


if __name__ == "__main__":
    run()
