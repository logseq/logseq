"""Collect native PE imports from explicit toolchain directories, never PATH.

DUMPBIN /IMPORTS includes ordinary and delay imports. This is an import closure,
not discovery of application-chosen LoadLibrary/plugin paths. Native startup
with a clean PATH must qualify the completed candidate separately.
"""
from __future__ import annotations

from collections import deque
import hashlib
from pathlib import Path
import re
import shutil
import subprocess


REDISTRIBUTABLE = re.compile(r"^(?:vcruntime|msvcp|msvcr|concrt|vcomp|vccorlib)\d|^ucrtbased\.dll$", re.I)


def digest(path):
    with Path(path).open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def parse_imports(output):
    imports = {}
    for line in output.splitlines():
        name = line.strip()
        if line[:1].isspace() and name.lower().endswith(".dll"):
            if any(c in name for c in '\\/:*?"<>|\0'):
                raise ValueError(f"Invalid imported DLL name: {name}")
            imports[name.casefold()] = name
    return list(imports.values())


def inspector(dumpbin, architectures):
    dumpbin = Path(dumpbin).resolve(strict=True)
    def inspect(file):
        if architectures(file, "windows") != {"x86_64"}:
            raise ValueError(f"Expected native Windows x86_64 code: {file}")
        output = subprocess.run([str(dumpbin), "/NOLOGO", "/IMPORTS", str(file)],
                                check=True, text=True, capture_output=True, timeout=60).stdout
        return parse_imports(output)
    return inspect


def dll_files(directory):
    directory = Path(directory).resolve(strict=True)
    if not directory.is_dir():
        raise ValueError(f"DLL root is not a directory: {directory}")
    result = {}
    for file in directory.iterdir():
        if file.suffix.casefold() == ".dll" and file.is_file():
            resolved = file.resolve(strict=True)
            if not resolved.is_relative_to(directory):
                raise ValueError(f"DLL escapes its trusted root: {file}")
            result[file.name.casefold()] = resolved
    return result


def collect(seeds, *, roots, system_directory, inspect):
    """Return a byte-pinned closure beside each seed's actual load location."""
    trusted = {}
    for root in roots:
        for name, source in dll_files(root).items():
            if name in trusted and digest(trusted[name]) != digest(source):
                raise ValueError(f"Ambiguous DLL {name} in trusted toolchain roots")
            trusted[name] = source
    system = dll_files(system_directory)
    pending = deque((Path(source).resolve(strict=True), Path(destination).resolve())
                    for source, destination in seeds)
    visited = set()
    result = {}
    while pending:
        source, destination = pending.popleft()
        key = (source, destination)
        if key in visited:
            continue
        visited.add(key)
        for name in inspect(source):
            lower = name.casefold()
            # API-set contracts need not have files. VC redistributables are
            # shipped even when the developer's System32 happens to have them.
            if lower.startswith(("api-ms-", "ext-ms-")):
                continue
            if lower in system and not REDISTRIBUTABLE.search(lower):
                continue
            dependency = trusted.get(lower)
            if dependency is None:
                raise ValueError(f"{source.name} needs {name}; supply its trusted --dll-root")
            target = destination / name
            fingerprint = digest(dependency)
            if target in result and result[target]["sha256"] != fingerprint:
                raise ValueError(f"Conflicting native dependency destination: {target}")
            result[target] = {"source": dependency, "destination": target, "sha256": fingerprint}
            pending.append((dependency, destination))
    return list(result.values())


def verify_sources(dependencies):
    for item in dependencies:
        if digest(item["source"]) != item["sha256"]:
            raise ValueError(f"Native dependency changed: {item['source']}")


def copy(dependencies):
    verify_sources(dependencies)
    for item in dependencies:
        target = item["destination"]
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and digest(target) != item["sha256"]:
            raise ValueError(f"A dependency would overwrite different candidate code: {target}")
        shutil.copy2(item["source"], target)
        if digest(target) != item["sha256"]:
            raise ValueError(f"Native dependency changed while copying: {target}")
