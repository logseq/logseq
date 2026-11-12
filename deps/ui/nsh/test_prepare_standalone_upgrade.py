"""Source/ownership guards only; no Git commands, apps, certificates or network."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "logseq_prepare_standalone_upgrade", Path(__file__).with_name("prepare_standalone_upgrade.py"))
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


class AuthoredUpgradeInputsTests(unittest.TestCase):
    def test_exact_commit_and_clean_tracked_and_untracked_sources_are_required(self):
        for value in ("main", "v0.5.0", "a" * 39, "A" * 40):
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, "immutable commit"):
                GATE.exact_revision(value)
        for dirty in (" M resources/package.json", "?? unreviewed-source.rs"):
            with self.subTest(dirty=dirty), patch.object(GATE.https, "run", side_effect=["a" * 40, dirty]):
                with self.assertRaisesRegex(ValueError, "tracked or untracked"):
                    GATE.clean_revision(Path("/authored/source"))

    def test_output_cannot_overlap_a_checkout_escape_the_runner_or_replace_old_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = Path(directory).resolve()
            source = runner / "checkout"
            source.mkdir()
            for output in (runner, source, source / "new", runner.parent / "elsewhere"):
                with self.subTest(output=output), self.assertRaisesRegex(ValueError, "outside the source"):
                    GATE.owned_root(output, runner, source)
            old = runner / "existing"
            old.mkdir()
            with self.assertRaisesRegex(ValueError, "overwrite"):
                GATE.owned_root(old, runner, source)
            self.assertEqual(GATE.owned_root(runner / "new", runner, source), runner / "new")

    def test_authored_commit_identity_and_dates_are_reproducible_across_jobs(self):
        with patch.dict(GATE.os.environ, {"GIT_AUTHOR_DATE": "unrelated host", "GIT_AUTHOR_NAME": "host"}):
            first = GATE.commit_environment(1700000000, 1)
            second = GATE.commit_environment(1700000000, 2)
        self.assertEqual(first["GIT_AUTHOR_DATE"], "1700000001 +0000")
        self.assertEqual(second["GIT_COMMITTER_DATE"], "1700000002 +0000")
        self.assertEqual(first["GIT_AUTHOR_NAME"], second["GIT_COMMITTER_NAME"])
        self.assertNotEqual(first["GIT_AUTHOR_NAME"], "host")

    def test_final_guard_rejects_changed_scope_revision_parent_version_or_extra_source(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = Path(directory).resolve()
            private = runner / "qualification"
            sources = private / "sources"
            sources.mkdir(parents=True)
            snapshot = {"base": "a" * 40, "luiRevision": "b" * 40, "sources": {}}
            for index, role in enumerate((*GATE.VERSIONS, "lui")):
                source = sources / role
                source.mkdir()
                captured = {"root": str(source), "revision": ("b" if role == "lui" else str(index + 1)) * 40}
                if role in GATE.VERSIONS:
                    captured["version"] = GATE.VERSIONS[role]
                snapshot["sources"][role] = captured
            record = private / "source-snapshots.json"
            overrides = {}
            def git(arguments, *, directory):
                role = directory.name
                operation = tuple(arguments[1:])
                if (role, operation) in overrides:
                    return overrides[role, operation]
                return {
                    ("rev-parse", "HEAD^{commit}"): snapshot["sources"][role]["revision"],
                    ("status", "--porcelain", "--untracked-files=normal"): "",
                    ("rev-parse", "HEAD^"): snapshot["base"],
                    ("diff", "--name-only", snapshot["base"], "HEAD"): "resources/package.json",
                    ("show", "HEAD:resources/package.json"): json.dumps({"version": GATE.VERSIONS.get(role)}),
                }[operation]
            record.write_text(json.dumps(snapshot), encoding="utf-8")
            with patch.object(GATE.https, "require_disposable_ci", return_value=runner), \
                    patch.object(GATE.https, "run", side_effect=git):
                GATE.check(record)
                cases = [
                    (("n1", ("rev-parse", "HEAD^{commit}")), "c" * 40, "owner/revision changed"),
                    (("n1", ("rev-parse", "HEAD^")), "c" * 40, "directly"),
                    (("n1", ("diff", "--name-only", snapshot["base"], "HEAD")),
                     "resources/package.json\ndeps/ui/nsh/src/main.rs", "only resources/package.json"),
                    (("n1", ("show", "HEAD:resources/package.json")), '{"version":"9.9.9"}', "release version"),
                ]
                for key, value, message in cases:
                    overrides[key] = value
                    with self.subTest(key=key), self.assertRaisesRegex(ValueError, message):
                        GATE.check(record)
                    overrides.clear()
                for mutate, message in (
                        (lambda value: value["sources"]["n1"].update(root=str(sources / "n2")), "owner/revision changed"),
                        (lambda value: value.update(luiRevision="c" * 40), "shared immutable pin")):
                    changed = copy.deepcopy(snapshot)
                    mutate(changed)
                    record.write_text(json.dumps(changed), encoding="utf-8")
                    with self.assertRaisesRegex(ValueError, message):
                        GATE.check(record)


if __name__ == "__main__":
    unittest.main()
