#!/usr/bin/env python3
"""Build the experimental self-drawn OCaml desktop application."""

import argparse
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def run(*arguments, **kwargs):
    return subprocess.run([str(value) for value in arguments], check=True, **kwargs)


def build(output, lui_source=None):
    if sys.platform not in {"darwin", "linux"}:
        raise ValueError("The experimental application host supports macOS and Linux")
    build_environment = os.environ.copy()
    if lui_source is not None:
        lui_source = lui_source.resolve()
        run("opam", "exec", "--", "dune", "build", "--profile", "release", "lui.install", cwd=lui_source)
        libraries = lui_source / "_build/install/default/lib"
        build_environment["OCAMLPATH"] = str(libraries) + (
            os.pathsep + build_environment["OCAMLPATH"] if build_environment.get("OCAMLPATH") else "")
    run("opam", "exec", "--", "ocamlfind", "query", "lui.host", env=build_environment)
    run("opam", "exec", "--", "dune", "build", "--profile", "release", "bin/main.exe",
        cwd=ROOT / "deps/db-worker", env=build_environment)
    run("opam", "exec", "--", "dune", "build", "--profile", "release", "ocaml_host/logseq_native.exe",
        cwd=HERE.parent, env=build_environment)
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    destination = output / ("LogseqNative.app" if sys.platform == "darwin" else "logseq-native")
    if destination.exists():
        manifest = destination / ("Contents/Resources/native-build.json" if sys.platform == "darwin"
                                  else "Resources/native-build.json")
        if not manifest.is_file() or json.loads(manifest.read_text()).get("backend") != "experimental-ocaml-native":
            raise ValueError("Refusing to replace an output not created by this builder")
    with tempfile.TemporaryDirectory(prefix=".native-stage-", dir=output) as temporary:
        staged = Path(temporary) / destination.name
        contents = staged / "Contents" if sys.platform == "darwin" else staged
        binaries = contents / ("MacOS" if sys.platform == "darwin" else "bin")
        resources = contents / "Resources"
        binaries.mkdir(parents=True)
        resources.mkdir()
        host = binaries / "LogseqNative"
        worker = resources / "logseq-db-worker"
        shutil.copy2(HERE.parent / "_build/default/ocaml_host/logseq_native.exe", host)
        shutil.copy2(ROOT / "deps/db-worker/_build/default/bin/main.exe", worker)
        for path in (HERE.parent / "assets").glob("*.json"):
            shutil.copy2(path, resources / path.name)
        for source, name in [(HERE.parent / "assets/fonts", "fonts"),
                             (ROOT / "resources/img", "img"), (ROOT / "resources/dicts", "dicts")]:
            shutil.copytree(source, resources / name)
        info = {"backend": "experimental-ocaml-native", "experimental": True,
                "database": "native-sqlite",
                "logseq_revision": subprocess.check_output(
                    ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
                "logseq_dirty": bool(subprocess.check_output(
                    ["git", "status", "--porcelain"], cwd=ROOT, text=True))}
        if lui_source is not None:
            info["lui_revision"] = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=lui_source, text=True).strip()
            info["lui_dirty"] = bool(subprocess.check_output(
                ["git", "status", "--porcelain"], cwd=lui_source, text=True))
        (resources / "native-build.json").write_text(json.dumps(info, indent=2) + "\n")
        if any(path.suffix.lower() == ".wasm" or "zvec" in path.name.lower()
               for path in staged.rglob("*")):
            raise ValueError("SQLite WASM and zvec binaries are forbidden in desktop packages")
        if sys.platform == "darwin":
            metadata = plistlib.loads((HERE / "Info.plist").read_bytes())
            metadata["LUIBackendStability"] = "experimental"
            (contents / "Info.plist").write_bytes(plistlib.dumps(metadata))
            for binary in [host, worker]:
                binary.chmod(binary.stat().st_mode | 0o200)
                run("strip", "-S", binary)
            dynamic_libraries = []
            sdl2_library = Path(subprocess.check_output(
                ["pkg-config", "--variable=libdir", "sdl2"], text=True).strip()) / "libSDL2.dylib"
            if b"sdl2-compat:" in sdl2_library.read_bytes():
                # SDL2's compatibility layer loads SDL3 dynamically, beyond otool's dependency list.
                sdl3_library = Path(subprocess.check_output(
                    ["pkg-config", "--variable=libdir", "sdl3"], text=True).strip()) / "libSDL3.dylib"
                frameworks = contents / "Frameworks"
                frameworks.mkdir(exist_ok=True)
                bundled_sdl3 = frameworks / "libSDL3.dylib"
                shutil.copy2(sdl3_library, bundled_sdl3)
                bundled_sdl3.chmod(bundled_sdl3.stat().st_mode | 0o200)
                dynamic_libraries.extend(["-x", bundled_sdl3])
            run("dylibbundler", "-b", "-cd", "-x", host, "-x", worker, *dynamic_libraries,
                "-d", contents / "Frameworks", "-p", "@executable_path/../Frameworks/")
            # The worker lives under Resources, one level below Contents.
            run("codesign", "--force", "--deep", "--sign", "-", staged)
            run("codesign", "--verify", "--deep", "--strict", staged)
        if destination.exists():
            shutil.rmtree(destination)
        shutil.move(str(staged), str(destination))
    print(destination)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lui-source", type=Path, help="Build an isolated local LUI SDK without changing opam pins")
    parser.add_argument("--output", type=Path, default=HERE.parent / "_build/native-experimental")
    options = parser.parse_args()
    build(options.output, options.lui_source)


if __name__ == "__main__":
    main()
