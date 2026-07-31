#!/usr/bin/env python3
"""Compare two raw logseq-review-workflow review outputs."""

from __future__ import annotations

import argparse
import collections
import difflib
import re
from pathlib import Path


FIELD_RE = re.compile(r"^\s*-\s+\*\*(Severity|Category|Location|Issue|Impact|Suggestion):\*\*\s*(.*)\s*$", re.I)
SEVERITIES = ("Blocking", "Important", "Minor", "Question")


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def word_count(text: str) -> int:
    return len(re.findall(r"\b\S+\b", text))


def parse_findings(text: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for line in text.splitlines():
        match = FIELD_RE.match(line)
        if not match:
            continue
        field = match.group(1).lower()
        value = match.group(2).strip()
        if field == "severity" and current:
            findings.append(current)
            current = {}
        current[field] = value
    if current:
        findings.append(current)
    return findings


def finding_key(finding: dict[str, str]) -> tuple[str, str, str, str]:
    return (
        normalize(finding.get("severity", "")),
        normalize(finding.get("category", "")),
        normalize(finding.get("location", "")),
        normalize(finding.get("issue", "")),
    )


def count_field(findings: list[dict[str, str]], field: str) -> collections.Counter[str]:
    values = [finding.get(field, "Unspecified") or "Unspecified" for finding in findings]
    return collections.Counter(values)


def format_counts(counter: collections.Counter[str]) -> str:
    if not counter:
        return "- None\n"
    return "".join(f"- {name}: {count}\n" for name, count in sorted(counter.items()))


def format_finding(finding: dict[str, str]) -> str:
    fields = ["severity", "category", "location", "issue", "impact", "suggestion"]
    lines = []
    for field in fields:
        if finding.get(field):
            lines.append(f"  - {field.title()}: {finding[field]}")
    return "\n".join(lines) if lines else "  - Unparsed finding"


def section_excerpt(text: str, heading_pattern: str, max_lines: int = 24) -> str:
    lines = text.splitlines()
    start = None
    pattern = re.compile(heading_pattern, re.I)
    for index, line in enumerate(lines):
        if pattern.search(line):
            start = index
            break
    if start is None:
        return "Not found."
    excerpt = []
    for line in lines[start : start + max_lines]:
        if excerpt and line.startswith("#"):
            break
        excerpt.append(line)
    return "\n".join(excerpt).strip() or "Not found."


def build_report(before_text: str, after_text: str, before_path: Path, after_path: Path) -> str:
    before_findings = parse_findings(before_text)
    after_findings = parse_findings(after_text)
    before_by_key = {finding_key(finding): finding for finding in before_findings}
    after_by_key = {finding_key(finding): finding for finding in after_findings}
    before_keys = set(before_by_key)
    after_keys = set(after_by_key)
    shared = before_keys & after_keys
    only_before = before_keys - after_keys
    only_after = after_keys - before_keys
    similarity = difflib.SequenceMatcher(None, before_text, after_text).ratio()

    lines = [
        "# Logseq Review Workflow Eval Comparison",
        "",
        "## Inputs",
        "",
        f"- Before output: `{before_path}`",
        f"- After output: `{after_path}`",
        "",
        "## Summary",
        "",
        f"- Before word count: {word_count(before_text)}",
        f"- After word count: {word_count(after_text)}",
        f"- Text similarity ratio: {similarity:.3f}",
        f"- Before parsed findings: {len(before_findings)}",
        f"- After parsed findings: {len(after_findings)}",
        f"- Shared exact parsed findings: {len(shared)}",
        f"- Findings only before: {len(only_before)}",
        f"- Findings only after: {len(only_after)}",
        "",
        "## Severity Counts",
        "",
        "### Before",
        "",
        format_counts(count_field(before_findings, "severity")).rstrip(),
        "",
        "### After",
        "",
        format_counts(count_field(after_findings, "severity")).rstrip(),
        "",
        "## Category Counts",
        "",
        "### Before",
        "",
        format_counts(count_field(before_findings, "category")).rstrip(),
        "",
        "### After",
        "",
        format_counts(count_field(after_findings, "category")).rstrip(),
        "",
        "## Findings Only Before",
        "",
    ]

    if only_before:
        for key in sorted(only_before):
            lines.append(format_finding(before_by_key[key]))
            lines.append("")
    else:
        lines.append("None.")
        lines.append("")

    lines.extend(["## Findings Only After", ""])
    if only_after:
        for key in sorted(only_after):
            lines.append(format_finding(after_by_key[key]))
            lines.append("")
    else:
        lines.append("None.")
        lines.append("")

    lines.extend(
        [
            "## Verification Summary Excerpts",
            "",
            "### Before",
            "",
            "```markdown",
            section_excerpt(before_text, r"verification"),
            "```",
            "",
            "### After",
            "",
            "```markdown",
            section_excerpt(after_text, r"verification"),
            "```",
            "",
            "## Manual Judgment Notes",
            "",
            "- Decide whether after-only findings are true improvements, false positives, or formatting drift.",
            "- Decide whether before-only findings were lost real issues or removed noise.",
            "- Check whether the after output improves rule routing, evidence quality, and honest verification.",
            "- Use `references/evaluation-rubric.md` for the final qualitative conclusion.",
            "",
        ]
    )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", required=True, help="Raw before-run output markdown.")
    parser.add_argument("--after", required=True, help="Raw after-run output markdown.")
    parser.add_argument("--out", help="Path to write comparison markdown. Prints to stdout when omitted.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    before_path = Path(args.before).resolve()
    after_path = Path(args.after).resolve()
    before_text = before_path.read_text(encoding="utf-8")
    after_text = after_path.read_text(encoding="utf-8")
    report = build_report(before_text, after_text, before_path, after_path)
    if args.out:
        out_path = Path(args.out).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(report + "\n", encoding="utf-8")
        print(out_path)
    else:
        print(report)


if __name__ == "__main__":
    main()
