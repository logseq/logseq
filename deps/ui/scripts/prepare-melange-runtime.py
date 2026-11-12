#!/usr/bin/env python3
"""Emit the active opam compiler's CommonJS runtime for maintained Node tests.

Use installed CMJs and Dune's installed module metadata, rather than guessing an
npm runtime version from the compiler version or depending on an opam source cache.
This performs the same CMJ-to-JavaScript operation as Dune's melange.emit rules.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

LIBRARIES = ("melange", "melange.js", "melange.belt")


def command(*args):
    return subprocess.check_output(["opam", "exec", "--", *map(str, args)], text=True).strip()


def sexps(text):
    stack = [[]]
    for token in re.findall(r'\(|\)|"(?:\\.|[^"\\])*"|[^\s()]+', text):
        if token == "(":
            value = []
            stack[-1].append(value)
            stack.append(value)
        elif token == ")":
            if len(stack) == 1:
                raise ValueError("Unexpected closing parenthesis in installed dune-package")
            stack.pop()
        else:
            stack[-1].append(json.loads(token) if token.startswith('"') else token)
    if len(stack) != 1:
        raise ValueError("Unclosed list in installed dune-package")
    return stack[0]


def field(node, name):
    matches = [item[1:] for item in node if isinstance(item, list) and item and item[0] == name]
    if len(matches) > 1:
        raise ValueError(f"Duplicate installed metadata field: {name}")
    return matches[0] if matches else None


def module_records(node):
    if not isinstance(node, list):
        return
    obj_name = field(node, "obj_name")
    source = field(node, "source")
    if obj_name and source:
        implementation = field(source, "impl")
        if implementation:
            source_path = field(implementation, "path")
            if len(obj_name) != 1 or not source_path or len(source_path) != 1:
                raise ValueError("Unsupported installed Melange implementation metadata")
            yield obj_name[0], source_path[0]
        return
    for item in node:
        yield from module_records(item)


def runtime_modules(package_root, libraries):
    metadata = sexps((package_root / "dune-package").read_text(encoding="utf-8"))
    result = []
    for library, library_root in libraries.items():
        candidates = [item for item in metadata if isinstance(item, list) and item
                      and item[0] == "library" and field(item, "name") == [library]]
        if len(candidates) != 1:
            raise ValueError(f"Expected one installed metadata entry for {library}")
        records = list(module_records(candidates[0]))
        if not records:
            raise ValueError(f"No installed Melange implementation modules for {library}")
        outputs = set()
        for obj_name, source in records:
            cmjs = list(library_root.rglob(f"{obj_name}.cmj"))
            if len(cmjs) != 1:
                raise ValueError(f"Expected exactly one installed CMJ for {library}:{obj_name}")
            # Match Dune's public library output: source directory relative to the
            # library root, and the source filename before its first extension.
            relative = (package_root / source).relative_to(library_root)
            output = relative.with_name(relative.name.split(".", 1)[0] + ".js")
            if output in outputs or ".." in output.parts:
                raise ValueError(f"Invalid or duplicate runtime output: {library}/{output}")
            outputs.add(output)
            result.append((library, cmjs[0], output))
    return result


def prepare(destination):
    libraries = {name: Path(command("ocamlfind", "query", name)).resolve(strict=True)
                 for name in LIBRARIES}
    package_root = libraries["melange"]
    modules = runtime_modules(package_root, libraries)
    # Dependencies include the compiler's private mini stdlib. Supply every exact
    # installed CMJ directory, as Dune does for the dependency closure.
    includes = sorted({str(path.parent) for path in package_root.rglob("*.cmj")})
    if not includes:
        raise ValueError("The active Melange package contains no installed CMJs")
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".melange-runtime-", dir=destination) as temporary:
        candidate = Path(temporary) / "node_modules"
        for library in libraries:
            root = candidate / library
            root.mkdir(parents=True)
            (root / "package.json").write_text(
                json.dumps({"name": library, "type": "commonjs"}) + "\n", encoding="utf-8")
        for library, cmj, relative in modules:
            output = candidate / library / relative
            output.parent.mkdir(parents=True, exist_ok=True)
            arguments = ["melc", "--mel-module-type", "commonjs", "--mel-package-name", "melange"]
            for directory in includes:
                arguments.extend(("-I", directory))
            subprocess.run(["opam", "exec", "--", *arguments, "-o", str(output), str(cmj)], check=True)
        # Load every emitted module outside the checkout: neither existing local
        # node_modules nor a previous Dune emission can satisfy missing imports.
        with tempfile.TemporaryDirectory(prefix="logseq-melange-runtime-smoke-") as smoke:
            smoke_root = Path(smoke)
            isolated = smoke_root / "node_modules"
            shutil.copytree(candidate, isolated)
            environment = os.environ.copy()
            environment["NODE_PATH"] = str(isolated)
            probe = """
const fs = require('node:fs');
const path = require('node:path');
function load(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) load(file);
    else if (entry.name.endsWith('.js')) require(file);
  }
}
load(process.argv[1]);
"""
            subprocess.run(["node", "-e", probe, str(isolated)], cwd=smoke_root,
                           env=environment, check=True)
        published = destination / "node_modules"
        if published.exists():
            raise ValueError(f"Runtime destination already exists: {published}")
        candidate.rename(published)
    return published


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    print(prepare(args.destination))
