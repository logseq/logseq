#!/usr/bin/env python3
"""Prepare a hash-pinned PDFium runtime in a new build-owned directory.

This stages bytes and their licenses; it never loads the library, installs it,
changes trust, or searches the developer's system for another engine.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import tarfile
import urllib.parse
import urllib.request

MANIFEST = Path(__file__).with_name("pdfium-artifacts.json")
MAX_EXPANDED_BYTES = 64 * 1024 * 1024


def sha256(payload):
    return hashlib.sha256(payload).hexdigest()


def stage_archive(payload, artifact, target, manifest, destination):
    """Validate completely before creating the exclusively owned output."""
    destination = Path(destination)
    if destination.exists() or destination.is_symlink():
        raise ValueError("PDFium output must be a new directory")
    if len(payload) != artifact["bytes"] or sha256(payload) != artifact["sha256"]:
        raise ValueError("PDFium archive does not match the pinned size and SHA-256")
    entries = {}
    expanded = 0
    with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as archive:
        for member in archive:
            name = PurePosixPath(member.name)
            if name.is_absolute() or ".." in name.parts or "\\" in member.name:
                raise ValueError("PDFium archive contains an unsafe path")
            if member.isdir():
                continue
            if not member.isfile() or not name.parts:
                raise ValueError("PDFium archive contains a link or special file")
            normalized = str(name)
            if normalized in entries:
                raise ValueError("PDFium archive contains duplicate files")
            expanded += member.size
            if expanded > MAX_EXPANDED_BYTES:
                raise ValueError("PDFium archive exceeds its expanded-size budget")
            stream = archive.extractfile(member)
            if stream is None:
                raise ValueError("PDFium archive file is unreadable")
            data = stream.read(member.size + 1)
            if len(data) != member.size:
                raise ValueError("PDFium archive file has an invalid size")
            entries[normalized] = data
    for required in [artifact["library"], "LICENSE", "licenses/pdfium.txt", "args.gn"]:
        if not entries.get(required):
            raise ValueError(f"PDFium archive is missing {required}")
    args = entries["args.gn"].decode("utf-8")
    for flag in ["pdf_enable_v8", "pdf_enable_xfa", "is_debug"]:
        if re.search(rf"(?m)^\s*{flag}\s*=\s*false\s*$", args) is None:
            raise ValueError(f"PDFium build must explicitly disable {flag}")
    runtime = {Path(artifact["library"]).name: entries[artifact["library"]]}
    runtime.update({name: data for name, data in entries.items()
                    if name == "LICENSE" or name == "args.gn" or name.startswith("licenses/")})
    receipt = {
        "schema": 1,
        "release": manifest["release"],
        "buildRecipeCommit": manifest["buildRecipeCommit"],
        "wrapperCommit": manifest["wrapperCommit"],
        "bindingsFeature": manifest["bindingsFeature"],
        "target": target,
        "assetId": artifact["assetId"],
        "archiveSha256": artifact["sha256"],
        "library": Path(artifact["library"]).name,
        "files": {name: sha256(data) for name, data in sorted(runtime.items())},
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.mkdir()
    try:
        for name, data in runtime.items():
            path = destination / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        # The receipt is the readiness marker; no consumer accepts a partial
        # directory left by an interrupted preparation.
        (destination / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    except BaseException:
        shutil.rmtree(destination)
        raise
    return receipt


def prepare(target, destination):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    artifact = manifest["artifacts"][target]
    url = f'{manifest["repository"]}/releases/download/{manifest["release"]}/{artifact["name"]}'
    request = urllib.request.Request(url, headers={"User-Agent": "Logseq-PDFium-preparer"})
    with urllib.request.urlopen(request, timeout=60) as response:
        final = urllib.parse.urlparse(response.geturl())
        if final.scheme != "https" or final.hostname not in {
            "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"
        }:
            raise ValueError("PDFium artifact redirected outside its HTTPS release provider")
        payload = response.read(artifact["bytes"] + 1)
    return stage_archive(payload, artifact, target, manifest, destination)


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", required=True, choices=sorted(manifest["artifacts"]))
    parser.add_argument("--output", type=Path,
                        help="new build/package staging directory; never an installed system library")
    args = parser.parse_args()
    output = args.output or Path(__file__).resolve().parent.parent / "_build/native-pdfium" / args.target
    print(json.dumps(prepare(args.target, output), indent=2))


if __name__ == "__main__":
    main()
