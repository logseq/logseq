#!/usr/bin/env python3
"""Exercise the real, already-built native row adapter without opening a window.

Build the actual native application libraries first. The installed lui.ppx
package supplies the driver; --ppx can select an existing driver explicitly.
This script never invokes Dune or creates build rules.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import shlex
import subprocess
import tempfile

from build_windows_dll import ARCHIVES, PACKAGES, UI


def run() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ppx", type=Path,
                        help="Existing native lui.ppx driver (default: installed lui.ppx package)")
    args = parser.parse_args()
    driver = args.ppx.resolve(strict=True) if args.ppx else None
    archives = [UI / "_build/default" / archive for archive in ARCHIVES]
    if missing := [str(archive) for archive in archives if not archive.is_file()]:
        raise SystemExit("Build the actual native application libraries first: " + ", ".join(missing))
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
    packages = PACKAGES if driver else PACKAGES + ",lui.ppx"
    compiler = [*prefix, "ocamlfind", "ocamlopt", "-thread", "-package", packages, *includes]
    ppx_arguments = []
    if driver:
        ppx_command = [str(driver), "--as-ppx"]
        ppx = subprocess.list2cmdline(ppx_command) if os.name == "nt" else shlex.join(ppx_command)
        ppx_arguments = ["-ppx", ppx]
    with tempfile.TemporaryDirectory(prefix="logseq-native-virtual-rows-") as temporary:
        stage = Path(temporary)
        bridge = stage / ("logseq_lui_bridge" + extension)
        subprocess.run([*prefix, "ocamlopt", "-c", "-o", str(bridge),
                        str(UI / "native/logseq_lui_bridge.c")], cwd=stage, check=True)
        source = stage / "virtual_rows_native.ml"
        source.write_bytes((UI / "nsh/tests/virtual_rows_native.ml").read_bytes())
        executable = stage / ("virtual-rows.exe" if os.name == "nt" else "virtual-rows")
        subprocess.run([*compiler, *ppx_arguments, "-linkall", "-linkpkg",
                        *map(str, archives), str(source), str(bridge),
                        "-o", str(executable)], cwd=stage, check=True)
        subprocess.run([str(executable)], cwd=stage, check=True, timeout=60)


if __name__ == "__main__":
    run()
