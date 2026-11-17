#!/usr/bin/env python3
"""Package the production Web frontend with the pinned LUI desktop host."""
import argparse
import hashlib
import json
import plistlib
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent


def run(*arguments, **kwargs):
    return subprocess.run([str(argument) for argument in arguments], check=True, **kwargs)


def revision(source):
    return run("git", "-C", source, "rev-parse", "HEAD", stdout=subprocess.PIPE, text=True).stdout.strip()


def pinned_revision():
    installer = (HERE.parent / "scripts/install-opam-deps.sh").read_text()
    return re.search(r"github.com/logseq/lui.git#([0-9a-f]{40})", installer).group(1)


def prepare_frontend(destination):
    static = ROOT / "static"
    native_js = ROOT / "_build/desktop-web/ui-js"
    marker = native_js / "desktop-build.json"
    if not marker.is_file() or json.loads(marker.read_text()) != {"database": "native-sqlite", "browser_worker": False}:
        raise ValueError("Build the native desktop frontend with vite --mode desktop first")
    for relative in ["index.html", "css/style.css"]:
        if not (static / relative).is_file():
            raise ValueError(f"Missing production asset: {relative}; build the Web frontend first")
    destination.mkdir(parents=True, exist_ok=False)
    for directory in ["css", "js", "img", "icons", "dicts", "templates", "docs"]:
        if (static / directory).is_dir():
            shutil.copytree(static / directory, destination / directory,
                ignore=shutil.ignore_patterns("*.map", "*.wasm", "db-worker.js", "main.js", "chunks", "assets", "w-*.js"))
    # System WebViews support WOFF2. Keep a single copy of the legacy
    # icon font instead of shipping its EOT, TTF and WOFF equivalents.
    font_css = destination / "css/tabler-icons.min.css"
    if font_css.exists():
        def woff2_only(match):
            face = match.group(0)
            source = re.search(r'url\([^)]+\.woff2[^)]*\)\s*format\([^)]+\)', face)
            if source is None:
                raise ValueError("Tabler icon font has no WOFF2 source")
            return re.sub(r"src:[^;}]+;?", "", face)[:-1].rstrip(";") + ";src:" + source.group(0) + "}"
        font_css.write_text(re.sub(r"@font-face\{[^}]+\}", woff2_only, font_css.read_text()))
        for suffix in ["eot", "ttf", "woff"]:
            (destination / f"css/fonts/tabler-icons.{suffix}").unlink(missing_ok=True)
    shutil.copytree(native_js, destination / "js", dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns("*.map"))
    html = (static / "index.html").read_text()
    scripts = []

    def externalize(match):
        attributes, body = match.group(1), match.group(2)
        if re.search(r"\bsrc\s*=", attributes, re.I) or not body.strip():
            return match.group(0)
        if re.search(r"\btype\s*=", attributes, re.I):
            raise ValueError("Inline scripts with a type attribute need an explicit packaging rule")
        name = f"js/logseq-bootstrap-{len(scripts)}.js"
        (destination / name).write_text(body)
        scripts.append(name)
        return f'<script{attributes} src="./{name}"></script>'

    html = re.sub(r"<script\b([^>]*)>(.*?)</script\s*>", externalize, html, flags=re.S | re.I)
    (destination / "index.html").write_text(html)
    for path in destination.rglob("*"):
        if path.is_file() and (path.suffix.lower() == ".wasm" or
            (path.suffix in {".js", ".mjs"} and re.search(
                r"sqlite3InitModule|OpfsSAHPool|sqlite3\.wasm|sqlite-wasm", path.read_text()))):
            raise ValueError(f"Browser SQLite/WASM is forbidden in desktop packages: {path}")
    return scripts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lui-source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--identity")
    parser.add_argument("--notary-profile")
    arguments = parser.parse_args()
    source = arguments.lui_source.resolve()
    if revision(source) != pinned_revision():
        raise ValueError("LUI source HEAD must match the pinned application dependency")
    if not (source / "tooling/desktop.py").is_file():
        raise ValueError("The pinned LUI source does not contain the desktop builder")
    output = arguments.output.resolve()
    if output.exists():
        raise ValueError("Choose a new output directory")
    scripts = prepare_frontend(output / "frontend")
    app = output / "Logseq.app"
    run("python3", source / "tooling/desktop.py", "build", "--config", HERE / "components.json",
        "--frontend", output / "frontend", "--output", app,
        "--ocaml-package", "re",
        "--ocaml-source", ROOT / "deps/db-worker/runtime/native/regexp.ml",
        "--ocaml-source", ROOT / "deps/db-worker/spec/platform/graph_dir.ml",
        "--ocaml-source", HERE.parent / "src/core/desktop_commands.ml",
        "--commands", HERE / "desktop_app.ml")
    binaries = app / "Contents/MacOS"
    shutil.copy2(ROOT / "resources/icons/logseq.icns", app / "Contents/Resources/logseq.icns")
    info = app / "Contents/Info.plist"
    metadata = plistlib.loads(info.read_bytes())
    metadata["CFBundleIconFile"] = "logseq.icns"
    info.write_bytes(plistlib.dumps(metadata))
    native = ROOT / "deps/db-worker/_build/default/bin"
    worker = binaries / "logseq-db-worker"
    shutil.copy2(native / "main.exe", worker)
    worker.chmod(worker.stat().st_mode | 0o200)
    run("strip", "-S", worker)
    run("dylibbundler", "-b", "-od", "-x", worker,
        "-d", app / "Contents/Frameworks", "-p", "@executable_path/../Frameworks/")
    if any("zvec" in path.name.lower() for path in app.rglob("*")):
        raise ValueError("Vector backend binaries are forbidden in desktop packages")
    for binary in [*binaries.iterdir(), *(app / "Contents/Frameworks").iterdir()]:
        if binary.is_file():
            sign = ["codesign", "--force", "--options", "runtime" if arguments.identity else "0",
                    "--sign", arguments.identity or "-"]
            if arguments.identity:
                sign.append("--timestamp")
            run(*sign, binary)
    package = ["python3", source / "tooling/desktop.py", "package", "--app", app, "--output", output / "packages"]
    if arguments.identity:
        package.extend(["--identity", arguments.identity])
    if arguments.notary_profile:
        package.extend(["--notary-profile", arguments.notary_profile])
    run(*package)
    with (app / "Contents/Resources/frontend/js/main.js").open("rb") as stream:
        frontend_hash = hashlib.file_digest(stream, "sha256").hexdigest()
    (output / "build-info.json").write_text(json.dumps({
        "logseq_revision": revision(ROOT), "lui_revision": revision(source),
        "frontend_sha256": frontend_hash, "externalized_bootstrap_scripts": scripts,
        "production_signed": arguments.identity is not None,
        "notarization_requested": arguments.notary_profile is not None,
    }, indent=2) + "\n")
    print(app)


if __name__ == "__main__":
    main()
