#!/usr/bin/env python3
"""Check literal presentation in the actual compiled NSH target before launch.

Native .cmt files select the real target modules, including generated/copied
sources. Public application encoders and LUI constructors produce the wire
values; the candidate's Rust provider validates them with its actual themes.
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path
import subprocess
import tempfile
from build_windows_dll import ARCHIVES, PACKAGES, UI


def command(arguments, *, cwd, stdout=None):
    subprocess.run(list(map(str, arguments)), cwd=cwd, check=True, stdout=stdout)


def validate(executable: Path, *, cmts=None):
    prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
    includes = []
    inputs = []
    archives = []
    for archive in ARCHIVES:
        path = UI / "_build/default" / archive
        if not path.is_file():
            raise ValueError(f"Build actual native archives before style preflight: {path}")
        archives.append(path)
        objects = path.parent / ("." + path.stem + ".objs")
        includes.extend(["-I", objects / "byte", "-I", objects / "native"])
        inputs.extend(sorted((objects / "byte").glob("*.cmt")))
    if cmts is not None:
        inputs = list(cmts)
    if not inputs:
        raise ValueError("Native style preflight has no actual target typedtrees")
    with tempfile.TemporaryDirectory(prefix="logseq-native-styles-") as temporary:
        stage = Path(temporary)
        suffix = ".exe" if os.name == "nt" else ""
        extractor = stage / ("static_style_sites" + suffix)
        source = stage / "static_style_sites.ml"
        source.write_bytes((UI / "nsh/static_style_sites.ml").read_bytes())
        command([*prefix, "ocamlfind", "ocamlopt", "-package", "compiler-libs.common", "-linkpkg",
                 source, "-o", extractor], cwd=stage)
        generated = stage / "probe.ml"
        with generated.open("wb") as output:
            output.write((UI / "nsh/static_style_probe.ml").read_bytes())
            command([extractor, *inputs], cwd=UI / "_build/default", stdout=output)
        probe = stage / ("probe" + suffix)
        extension = subprocess.check_output([*prefix, "ocamlopt", "-config-var", "ext_obj"], text=True).strip()
        if extension not in (".o", ".obj"):
            raise ValueError("Unsupported native OCaml object suffix: " + extension)
        bridge = stage / ("logseq_lui_bridge" + extension)
        command([*prefix, "ocamlopt", "-c", "-o", bridge, UI / "native/logseq_lui_bridge.c"], cwd=stage)
        command([*prefix, "ocamlfind", "ocamlopt", "-thread", "-package", PACKAGES,
                 *includes, "-linkall", "-linkpkg", *archives, generated, bridge,
                 "-o", probe], cwd=stage)
        manifest = stage / "styles.json"
        with manifest.open("wb") as output:
            command([probe], cwd=stage, stdout=output)
        command([executable.resolve(), "--validate-native-styles", manifest], cwd=stage)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("executable", type=Path)
    args = parser.parse_args()
    validate(args.executable)

if __name__ == "__main__":
    main()
