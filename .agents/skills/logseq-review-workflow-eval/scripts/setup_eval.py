#!/usr/bin/env python3
"""Prepare isolated inputs for comparing logseq-review-workflow revisions."""

from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import shutil
import subprocess
import tarfile
from pathlib import Path


DEFAULT_SKILL_PATH = ".agents/skills/logseq-review-workflow"
DEFAULT_OUT_ROOT = ".tmp/logseq-review-workflow-eval"


def run(cmd: list[str], cwd: Path) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def repo_root() -> Path:
    result = run(["git", "rev-parse", "--show-toplevel"], Path.cwd())
    return Path(result.stdout.decode().strip())


def safe_extract(archive: bytes, dest: Path) -> None:
    dest_resolved = dest.resolve()
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:*") as tar:
        for member in tar.getmembers():
            member_path = (dest / member.name).resolve()
            if dest_resolved not in (member_path, *member_path.parents):
                raise RuntimeError(f"Refusing to extract unsafe archive path: {member.name}")
        tar.extractall(dest, filter="data")


def copy_from_git_ref(repo: Path, ref: str, rel_path: str, dest: Path) -> None:
    tmp = dest.parent / f".extract-{dest.name}"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    try:
        archive = run(["git", "archive", ref, "--", rel_path], repo).stdout
        safe_extract(archive, tmp)
        source = tmp / rel_path
        if not source.exists():
            raise RuntimeError(f"{rel_path} was not found in {ref}")
        shutil.copytree(source, dest)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def copy_from_worktree(repo: Path, rel_path: str, dest: Path) -> None:
    source = repo / rel_path
    if not source.exists():
        raise RuntimeError(f"{source} does not exist")
    shutil.copytree(source, dest, ignore=shutil.ignore_patterns(".git"))


def read_prompt(args: argparse.Namespace) -> str:
    if args.prompt_file:
        return Path(args.prompt_file).read_text(encoding="utf-8").strip()
    return args.prompt.strip()


def write_run_prompt(path: Path, snapshot: Path, review_prompt: str) -> None:
    path.write_text(
        "\n".join(
            [
                f"Use the logseq-review-workflow skill from this exact path: {snapshot}",
                "",
                "Run the review task below. Do not read any other evaluation snapshot, the other run output, or comparison notes.",
                "Return the normal logseq-review-workflow review result, including findings and verification summary.",
                "",
                "Review task:",
                "",
                review_prompt,
                "",
            ]
        ),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before-ref", required=True, help="Git ref containing the old skill revision.")
    parser.add_argument("--after-ref", help="Git ref containing the new skill revision. Defaults to the working tree.")
    parser.add_argument("--skill-path", default=DEFAULT_SKILL_PATH, help=f"Skill path to snapshot. Default: {DEFAULT_SKILL_PATH}")
    parser.add_argument("--case-name", default="review-case", help="Short name used in the output directory.")
    parser.add_argument("--out-root", default=DEFAULT_OUT_ROOT, help=f"Output root. Default: {DEFAULT_OUT_ROOT}")
    prompt_group = parser.add_mutually_exclusive_group(required=True)
    prompt_group.add_argument("--prompt-file", help="File containing the exact review prompt to reuse for both runs.")
    prompt_group.add_argument("--prompt", help="Exact review prompt to reuse for both runs.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo = repo_root()
    timestamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    case_slug = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in args.case_name).strip("-") or "review-case"
    out_dir = (repo / args.out_root / f"{timestamp}-{case_slug}").resolve()
    snapshots = out_dir / "snapshots"
    prompts = out_dir / "prompts"
    outputs = out_dir / "outputs"
    for directory in (snapshots, prompts, outputs):
        directory.mkdir(parents=True, exist_ok=True)

    before_snapshot = snapshots / "before-logseq-review-workflow"
    after_snapshot = snapshots / "after-logseq-review-workflow"
    copy_from_git_ref(repo, args.before_ref, args.skill_path, before_snapshot)
    if args.after_ref:
        copy_from_git_ref(repo, args.after_ref, args.skill_path, after_snapshot)
        after_source = args.after_ref
    else:
        copy_from_worktree(repo, args.skill_path, after_snapshot)
        after_source = "working-tree"

    review_prompt = read_prompt(args)
    (prompts / "original-review-prompt.md").write_text(review_prompt + "\n", encoding="utf-8")
    write_run_prompt(prompts / "run-before.md", before_snapshot, review_prompt)
    write_run_prompt(prompts / "run-after.md", after_snapshot, review_prompt)

    metadata = {
        "before_ref": args.before_ref,
        "after_ref": after_source,
        "skill_path": args.skill_path,
        "out_dir": str(out_dir),
        "before_snapshot": str(before_snapshot),
        "after_snapshot": str(after_snapshot),
        "before_prompt": str(prompts / "run-before.md"),
        "after_prompt": str(prompts / "run-after.md"),
        "before_output": str(outputs / "before.md"),
        "after_output": str(outputs / "after.md"),
        "comparison": str(out_dir / "comparison.md"),
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print(f"Created evaluation directory: {out_dir}")
    print(f"Before prompt: {prompts / 'run-before.md'}")
    print(f"After prompt:  {prompts / 'run-after.md'}")
    print(f"Save outputs to: {outputs / 'before.md'} and {outputs / 'after.md'}")


if __name__ == "__main__":
    main()
