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


def ensure_archive_typedtrees(prefix, extractor, archives):
    """Request exactly the CMT units declared by the native archive metadata.

    Release compilation may produce CMX without every CMT. Dune knows the CMT
    rules, but those targets must be requested explicitly. One batch preserves
    dependency ordering and the caller's profile/OCAMLPATH without changing rules.
    """
    filenames = subprocess.check_output(
        list(map(str, [extractor, "--cmt-targets", *archives])),
        cwd=UI / "_build/default", text=True).splitlines()
    if not filenames:
        raise ValueError("Actual native archives contain no typedtree units")
    build_root = (UI / "_build/default").resolve()
    targets = []
    for filename in filenames:
        path = Path(filename).resolve()
        if path.suffix != ".cmt":
            raise ValueError("Invalid native typedtree target: " + filename)
        targets.append(path.relative_to(build_root))
    command([*prefix, "dune", "build", *targets], cwd=UI)
    # Missing requested units are never replaced with another backend's output.
    missing = [filename for filename in filenames if not Path(filename).is_file()]
    if missing:
        raise ValueError("Dune did not produce actual native typedtrees: " + ", ".join(missing))


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
        # The extractor reads each archive's actual unit table. Directory
        # globs would include obsolete or another target's stale .cmt files.
        inputs.append(path)
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
        command([*prefix, "ocamlfind", "ocamlopt", "-package", "compiler-libs.optcomp", "-linkpkg",
                 source, "-o", extractor], cwd=stage)
        if cmts is None:
            ensure_archive_typedtrees(prefix, extractor, archives)
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
