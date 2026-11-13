#!/usr/bin/env python3
"""Author reproducible, clean release inputs on a disposable CI runner only.

No application build, trust operation or native launch occurs in this module.
"""
import argparse
import json
import os
from pathlib import Path
import re

import private_update_https as https

VERSIONS = {"n1": "2.0.3-nsh-qualification.1", "n2": "2.0.3-nsh-qualification.2"}


def exact_revision(value):
    if re.fullmatch(r"[0-9a-f]{40}", value) is None:
        raise ValueError("Qualification sources require a full immutable commit")
    return value


def clean_revision(source):
    revision = exact_revision(https.run(["git", "rev-parse", "HEAD^{commit}"], directory=source))
    changes = https.run(["git", "status", "--porcelain", "--untracked-files=normal"], directory=source)
    if changes:
        raise ValueError("Qualification sources must have no tracked or untracked changes: "
                         + changes[:4096])
    return revision


def owned_root(output, runner, source):
    output = output.resolve()
    if (output == runner or not output.is_relative_to(runner)
            or output == source or output.is_relative_to(source)
            or source.is_relative_to(output)):
        raise ValueError("Qualification inputs need a private runner directory outside the source checkout")
    if output.exists():
        raise ValueError("Refusing to overwrite existing qualification inputs or evidence")
    return output


def commit_environment(epoch, ordinal):
    # Identical base/LUI pins and pair versions produce identical authored Git
    # commits in the independent broad-test and actual-upgrade jobs.
    return dict(os.environ, GIT_AUTHOR_NAME="Logseq qualification",
                GIT_AUTHOR_EMAIL="qualification@logseq.com",
                GIT_COMMITTER_NAME="Logseq qualification",
                GIT_COMMITTER_EMAIL="qualification@logseq.com",
                GIT_AUTHOR_DATE=f"{epoch + ordinal} +0000",
                GIT_COMMITTER_DATE=f"{epoch + ordinal} +0000")


def prepare(source, output, lui_revision):
    runner = https.require_disposable_ci(True)
    source = source.resolve(strict=True)
    base = clean_revision(source)
    lui_revision = exact_revision(lui_revision)
    output = owned_root(output, runner, source)
    output.mkdir(mode=0o700)
    (output / "sources").mkdir()
    (output / "evidence").mkdir()
    snapshot = {"base": base, "luiRevision": lui_revision, "sources": {}}
    # Preserve a failure record even if cloning/dependency setup never finishes.
    record = output / "source-snapshots.json"
    record.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    epoch = int(https.run(["git", "show", "-s", "--format=%ct", base], directory=source))
    for ordinal, (role, version) in enumerate(VERSIONS.items(), 1):
        destination = output / "sources" / role
        https.run(["git", "clone", "--no-hardlinks", "--no-checkout", source, destination])
        https.run(["git", "checkout", "--detach", base], directory=destination)
        package = destination / "resources/package.json"
        metadata = json.loads(package.read_text(encoding="utf-8"))
        metadata["version"] = version
        package.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        https.run(["git", "add", "resources/package.json"], directory=destination)
        https.run(["git", "-c", "commit.gpgsign=false", "commit", "--no-gpg-sign", "-m",
                   f"test: author {role.upper()} qualification release"], directory=destination,
                  environment=commit_environment(epoch, ordinal))
        snapshot["sources"][role] = {"root": str(destination), "version": version,
                                      "revision": clean_revision(destination)}
        record.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    lui = output / "sources/lui"
    https.run(["git", "clone", "--no-checkout", "https://github.com/logseq/lui.git", lui])
    https.run(["git", "checkout", "--detach", lui_revision], directory=lui)
    snapshot["sources"]["lui"] = {"root": str(lui), "revision": clean_revision(lui)}
    record.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    check(record)
    return record


def check(record):
    runner = https.require_disposable_ci(True)
    record = record.resolve(strict=True)
    if not record.is_relative_to(runner) or record.parent == runner:
        raise ValueError("Source snapshot must belong to the private runner root")
    snapshot = json.loads(record.read_text(encoding="utf-8"))
    base = exact_revision(snapshot["base"])
    for role in (*VERSIONS, "lui"):
        captured = snapshot["sources"][role]
        source = (record.parent / "sources" / role).resolve(strict=True)
        if str(source) != captured["root"] or clean_revision(source) != captured["revision"]:
            raise ValueError(f"Captured {role} source owner/revision changed")
        if role == "lui":
            if captured["revision"] != exact_revision(snapshot["luiRevision"]):
                raise ValueError("LUI provider differs from the shared immutable pin")
            continue
        if https.run(["git", "rev-parse", "HEAD^"], directory=source) != base:
            raise ValueError("Authored release must descend directly from the captured base")
        if https.run(["git", "diff", "--name-only", base, "HEAD"], directory=source) != "resources/package.json":
            raise ValueError("Authored qualification release may change only resources/package.json")
        package = json.loads(https.run(["git", "show", "HEAD:resources/package.json"], directory=source))
        if package["version"] != VERSIONS[role] or captured["version"] != VERSIONS[role]:
            raise ValueError("Authored release version differs from the shared qualification pair")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prepare_parser = commands.add_parser("prepare")
    prepare_parser.add_argument("--source", type=Path, required=True)
    prepare_parser.add_argument("--output", type=Path, required=True)
    prepare_parser.add_argument("--lui-revision", required=True)
    check_parser = commands.add_parser("check")
    check_parser.add_argument("record", type=Path)
    arguments = parser.parse_args()
    if arguments.command == "prepare":
        print(prepare(arguments.source, arguments.output, arguments.lui_revision))
    else:
        check(arguments.record)
