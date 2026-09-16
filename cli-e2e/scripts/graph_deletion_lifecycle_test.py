"""Real-process regression tests for local graph deletion.

Run against freshly staged artifacts with python3 -m unittest discover -s
cli-e2e/scripts -p graph_deletion_lifecycle_test.py -v.
"""

import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile
import time
import unittest
import urllib.request


PROJECT = Path(__file__).resolve().parents[2]
CLI = PROJECT / "static/logseq-cli.js"
WORKER = PROJECT / "static/db-worker-node.js"


def alive(pid):
    try:
        os.kill(pid, 0)
        state = subprocess.run(["ps", "-p", str(pid), "-o", "stat="],
                               capture_output=True, text=True, check=False)
        return bool(state.stdout.strip()) and not state.stdout.strip().startswith("Z")
    except ProcessLookupError:
        return False


def until(predicate, timeout=30):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        result = predicate()
        if result:
            return result
        time.sleep(0.05)
    raise AssertionError("Timed out waiting for runtime condition")


class GraphDeletionLifecycle(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="logseq-deletion-"))
        self.children = []
        self.pids = set()
        self.graph = "lifecycle"

    def tearDown(self):
        for root in [self.root, self.root / "other-root"]:
            listing = root / "server-list"
            if listing.exists():
                for line in listing.read_text().splitlines():
                    self.pids.add(int(line.split()[0]))
        for pid in self.pids:
            if alive(pid):
                os.kill(pid, signal.SIGKILL)
        for child in self.children:
            if child.poll() is None:
                child.kill()
            child.wait(timeout=5)
        shutil.rmtree(self.root)

    def cli(self, *args, root=None, graph=None, output="json"):
        return subprocess.run(
            ["node", str(CLI), "--root-dir", str(root or self.root),
             "--graph", graph or self.graph, "--output", output, *args],
            capture_output=True, text=True, timeout=45,
        )

    def ok(self, result):
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        return result

    def create(self, root=None, graph=None):
        self.ok(self.cli("graph", "create", root=root, graph=graph))
        self.ok(self.cli("server", "start", root=root, graph=graph))
        lock = json.loads(self.lock_path(root, graph).read_text())
        self.pids.add(lock["pid"])
        return lock

    def lock_path(self, root=None, graph=None):
        return (root or self.root) / "graphs" / (graph or self.graph) / "db-worker.lock"

    def servers(self):
        return json.loads(self.ok(self.cli("server", "list")).stdout)["data"]

    def direct_worker(self, owner="electron"):
        log = self.root / "direct-worker.log"
        with log.open("w") as output:
            child = subprocess.Popen(
                ["node", str(WORKER), "--root-dir", str(self.root),
                 "--repo", "logseq_db_" + self.graph, "--owner-source", owner],
                stdout=output, stderr=output,
            )
        self.children.append(child)
        self.pids.add(child.pid)
        def ready():
            if child.poll() is not None:
                raise AssertionError(log.read_text())
            listing = self.root / "server-list"
            if not listing.exists():
                return False
            for line in listing.read_text().splitlines():
                pid, port = map(int, line.split())
                if pid == child.pid:
                    try:
                        with urllib.request.urlopen(f"http://127.0.0.1:{port}/healthz", timeout=1) as response:
                            return json.load(response)
                    except OSError:
                        pass
            return False
        return child, until(ready)

    def assert_removed(self, pid):
        self.assertFalse(alive(pid), f"Worker {pid} survived successful deletion")
        self.assertFalse(self.lock_path().parent.exists())
        saved = self.root / "graphs" / "Unlinked graphs" / self.graph
        self.assertTrue((saved / "db.sqlite").is_file())
        self.assertFalse((saved / "db-worker.lock").exists())
        self.assertNotIn(str(pid) + " ", (self.root / "server-list").read_text())

    def test_cli_owned_worker_and_explicit_recreate(self):
        lock = self.create()
        self.ok(self.cli("graph", "remove"))
        self.assert_removed(lock["pid"])
        result = self.cli("server", "start")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertFalse(self.lock_path().parent.exists())
        next_lock = self.create()
        self.assertNotEqual(lock["lock-id"], next_lock["lock-id"])
        self.ok(self.cli("list", "page"))

    def test_cli_removes_desktop_owned_worker(self):
        initial = self.create()
        self.ok(self.cli("server", "stop"))
        until(lambda: not alive(initial["pid"]))
        worker, _ = self.direct_worker()
        self.ok(self.cli("graph", "remove"))
        worker.wait(timeout=5)
        self.assert_removed(worker.pid)

    def test_missing_lock_ready_endpoint_is_rejected_then_deleted(self):
        lock = self.create()
        self.lock_path().unlink()
        result = self.cli("server", "start")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.ok(self.cli("graph", "remove"))
        self.assert_removed(lock["pid"])

    def test_missing_graph_orphan_cleanup_reports_absence(self):
        lock = self.create()
        saved = self.root / "graphs" / "Unlinked graphs" / self.graph
        saved.parent.mkdir()
        self.lock_path().parent.rename(saved)
        result = self.cli("graph", "remove")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertFalse(alive(lock["pid"]), result.stdout)
        self.assertFalse(self.lock_path().parent.exists())
        self.assertFalse((saved / "db-worker.lock").exists())
        self.assertTrue((saved / "db.sqlite").is_file())

    def test_stopped_graph_removal_and_output_modes(self):
        for mode in ["human", "json", "edn"]:
            with self.subTest(mode=mode):
                lock = self.create()
                self.ok(self.cli("server", "stop"))
                until(lambda: not alive(lock["pid"]))
                self.ok(self.cli("graph", "remove", output=mode))
                self.assertFalse(self.lock_path().parent.exists())

    def test_other_graph_and_same_name_other_root_remain_available(self):
        removed = self.create()
        other = self.create(graph="unrelated")
        other_root = self.create(root=self.root / "other-root")
        self.ok(self.cli("graph", "remove"))
        self.assert_removed(removed["pid"])
        self.assertTrue(alive(other["pid"]))
        self.assertTrue(alive(other_root["pid"]))
        self.ok(self.cli("list", "page", graph="unrelated"))
        self.ok(self.cli("list", "page", root=self.root / "other-root"))

    def test_live_unknown_lock_owner_fails_without_moving(self):
        lock = self.create()
        self.ok(self.cli("server", "stop"))
        until(lambda: not alive(lock["pid"]))
        child = subprocess.Popen(["node", "-e", "setInterval(() => {}, 1000)"])
        self.children.append(child)
        self.lock_path().write_text(json.dumps({"repo": "logseq_db_" + self.graph,
                                               "pid": child.pid, "lock-id": "unknown"}))
        result = self.cli("graph", "remove")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertTrue(self.lock_path().exists())
        self.assertTrue(alive(child.pid))


if __name__ == "__main__":
    unittest.main()
