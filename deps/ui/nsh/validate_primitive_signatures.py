#!/usr/bin/env python3
"""Compile the real bridge against C prototypes parsed from its OCaml callers."""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import tempfile


def validate(*, ui: Path | None = None, bridge: Path | None = None) -> None:
    ui = (ui or Path(__file__).resolve().parent.parent).resolve()
    bridge = (bridge or ui / "native/logseq_lui_bridge.c").resolve()
    prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
    with tempfile.TemporaryDirectory(prefix="logseq-primitive-signatures-") as temporary:
        stage = Path(temporary)
        extractor = stage / ("signatures.exe" if os.name == "nt" else "signatures")
        # Copy source so ocamlopt cannot write compilation outputs beside it.
        parser = stage / "primitive_signatures.ml"
        parser.write_bytes((ui / "nsh/primitive_signatures.ml").read_bytes())
        subprocess.run([*prefix, "ocamlfind", "ocamlopt", "-package", "compiler-libs.common",
                        "-linkpkg", str(parser), "-o", str(extractor)], cwd=stage, check=True)
        declarations = subprocess.check_output(
            [str(extractor), *map(str, sorted((ui / "native").rglob("*.ml")))],
            cwd=stage, text=True)
        # These declarations and the actual definitions share one translation
        # unit: conflicting C types are mandatory compiler errors, not warnings.
        source = stage / "primitive_contract.c"
        source.write_text(declarations + '#include "' + bridge.as_posix() + '"\n',
                          encoding="utf-8")
        suffix = subprocess.check_output([*prefix, "ocamlopt", "-config-var", "ext_obj"],
                                         cwd=stage, text=True).strip()
        subprocess.run([*prefix, "ocamlopt", "-c", "-o", str(stage / ("contract" + suffix)),
                        str(source)], cwd=stage, check=True)


if __name__ == "__main__":
    validate()
