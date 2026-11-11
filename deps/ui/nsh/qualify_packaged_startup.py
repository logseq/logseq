#!/usr/bin/env python3
"""Qualify actual packaged OCaml/worker/resources with the real App Headless gate.

This does not launch the packaged native window or establish pixel/UX parity.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import platform
import subprocess
import tempfile

REPO = Path(__file__).resolve().parents[3]


def qualify(archive, evidence):
    archive = archive.resolve(strict=True)
    system = platform.system()
    if system not in ("Darwin", "Linux"):
        raise ValueError("Packaged App startup currently requires native macOS or Linux")
    with tempfile.TemporaryDirectory(prefix="logseq-nsh-package-") as directory:
        outside = Path(directory).resolve()
        if outside == REPO or REPO in outside.parents:
            raise ValueError("Package extraction must be outside the checkout; change TMPDIR")
        if system == "Darwin":
            subprocess.run(["ditto", "-x", "-k", str(archive), str(outside)], check=True)
            application = outside / "Logseq NSH.app"
            executable = application / "Contents/MacOS/logseq-nsh"
            resources = application / "Contents/Resources"
            library = resources / "liblogseq_ui.dylib"
            subprocess.run(["codesign", "--verify", "--deep", "--strict", str(application)], check=True)
        else:
            subprocess.run(["tar", "-xzf", str(archive), "-C", str(outside)], check=True)
            application = outside / "Logseq-NSH"
            executable = application / "bin/logseq-nsh"
            resources = application / "Resources"
            library = resources / "liblogseq_ui.so"
        worker = resources / "logseq-db-worker"
        for artifact in (executable, library, worker, resources / "dicts/en.edn"):
            if not artifact.is_file():
                raise ValueError(f"The actual package is missing {artifact.relative_to(outside)}")
        if not os.access(executable, os.X_OK) or not os.access(worker, os.X_OK):
            raise ValueError("Packaged native host/worker must retain executable permissions")
        environment = os.environ.copy()
        environment.update(LUI_OCAML_LIBRARY=str(library),
                           LOGSEQ_NATIVE_ASSET_DIR=str(resources), LOGSEQ_DB_WORKER_BIN=str(worker))
        subprocess.run(["cargo", "test", "--locked", "--manifest-path", "deps/ui/nsh/Cargo.toml",
                        "--test", "startup_preflight", "--", "--exact",
                        "real_application_startup_preflight", "--nocapture"],
                       cwd=REPO, env=environment, check=True)
        result = {
            "qualified": True, "archive": str(archive), "platform": system,
            "extractionDirectory": str(outside), "outsideCheckout": True,
            "boundary": "actual packaged OCaml library, worker and resources in real App Headless startup",
            "nativeWindowLaunch": "unqualified", "pixelAndUxParity": "unqualified",
        }
        evidence.parent.mkdir(parents=True, exist_ok=True)
        evidence.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--evidence", type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(qualify(args.archive, args.evidence)))
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Actual packaged App startup failed: {error}\n")


if __name__ == "__main__":
    main()
