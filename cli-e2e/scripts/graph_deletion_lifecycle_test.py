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
import threading
import time
import unittest
import urllib.request


PROJECT = Path(__file__).resolve().parents[2]
CLI = PROJECT / "static/logseq-cli.js"
WORKER = PROJECT / "static/db-worker-node.js"


def lifecycle_info(root, graph):
    result = subprocess.run(["node", "-e", """
const lifecycle = require('./deps/graph-lifecycle');
const path = require('node:path');
const storage = lifecycle.resolveStorage(process.argv[1], path.join(process.argv[1], 'graphs'));
const ctx = lifecycle.context(storage, process.argv[2]);
console.log(JSON.stringify({ctx, state: lifecycle.snapshot(storage, process.argv[2]), ownership: lifecycle.ownershipPath(ctx)}));
""", str(root), graph], cwd=PROJECT, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


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
        lock = lifecycle_info(root or self.root, graph or self.graph)["state"]["workers"][0]
        self.pids.add(lock["pid"])
        return lock

    def graph_path(self):
        return self.root / "graphs" / self.graph

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
        self.assertFalse(self.graph_path().exists())
        saved = self.root / "graphs" / "Unlinked graphs" / self.graph
        self.assertTrue((saved / "db.sqlite").is_file())
        self.assertTrue(Path(lifecycle_info(self.root, self.graph)["ownership"]).exists())
        self.assertNotIn(str(pid) + " ", (self.root / "server-list").read_text())

    def test_cli_owned_worker_and_explicit_recreate(self):
        lock = self.create()
        self.ok(self.cli("graph", "remove"))
        self.assert_removed(lock["pid"])
        result = self.cli("server", "start")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertFalse(self.graph_path().exists())
        next_lock = self.create()
        self.assertNotEqual(lock["generation"], next_lock["generation"])
        self.ok(self.cli("list", "page"))

    def test_cli_removes_desktop_owned_worker(self):
        initial = self.create()
        self.ok(self.cli("server", "stop"))
        until(lambda: not alive(initial["pid"]))
        worker, _ = self.direct_worker()
        threading.Thread(target=worker.wait, daemon=True).start()
        self.ok(self.cli("graph", "remove"))
        worker.wait(timeout=5)
        self.assert_removed(worker.pid)

    def test_changed_runtime_identity_is_rejected_before_shutdown(self):
        lock = self.create()
        info = lifecycle_info(self.root, self.graph)
        runtime_path = Path(info["ctx"]["dir"]) / f"runtime-{lock['ticket']}.json"
        original = runtime_path.read_text()
        changed = json.loads(original)
        changed["ownership-protocol"] = "unknown-protocol"
        runtime_path.write_text(json.dumps(changed))
        result = self.cli("server", "start")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertTrue(alive(lock["pid"]))
        runtime_path.write_text(original)
        self.ok(self.cli("graph", "remove"))
        self.assert_removed(lock["pid"])

    def test_missing_graph_orphan_cleanup_reports_absence(self):
        lock = self.create()
        saved = self.root / "graphs" / "Unlinked graphs" / self.graph
        saved.parent.mkdir()
        self.graph_path().rename(saved)
        result = self.cli("graph", "remove")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertFalse(alive(lock["pid"]), result.stdout)
        self.assertFalse(self.graph_path().exists())
        self.assertTrue(Path(lifecycle_info(self.root, self.graph)["ownership"]).exists())
        self.assertTrue((saved / "db.sqlite").is_file())

    def test_stopped_graph_removal_and_output_modes(self):
        for mode in ["human", "json", "edn"]:
            with self.subTest(mode=mode):
                lock = self.create()
                self.ok(self.cli("server", "stop"))
                until(lambda: not alive(lock["pid"]))
                self.ok(self.cli("graph", "remove", output=mode))
                self.assertFalse(self.graph_path().exists())

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

    def test_unregistered_sqlite_owner_prevents_move(self):
        lock = self.create()
        self.ok(self.cli("server", "stop"))
        until(lambda: not alive(lock["pid"]))
        child = subprocess.Popen(["node", "-e", """
const lifecycle = require('./deps/graph-lifecycle');
const path = require('node:path');
const storage = lifecycle.resolveStorage(process.argv[1], path.join(process.argv[1], 'graphs'));
const handle = lifecycle.acquireOwnership(lifecycle.context(storage, process.argv[2]));
console.log('owned');
setInterval(() => handle.assert(), 1000);
""", str(self.root), self.graph], cwd=PROJECT, stdout=subprocess.PIPE, text=True)
        self.children.append(child)
        self.assertEqual(child.stdout.readline().strip(), "owned")
        child.stdout.close()
        result = self.cli("graph", "remove")
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertTrue(self.graph_path().exists())
        self.assertTrue(alive(child.pid))


if __name__ == "__main__":
    unittest.main()
