import sqlite3
import tempfile
from pathlib import Path
import unittest

from native_profile_run import clone_graph, over_limit


class NativeProfileRunTest(unittest.TestCase):
    def test_limit_includes_gui_and_worker_for_both_accounting_views(self):
        for field in ("rss_bytes", "footprint_bytes"):
            row = {"processes": {"gui": {"rss_bytes": 10, "footprint_bytes": 10},
                                  "worker": {"rss_bytes": 10, "footprint_bytes": 10}}}
            row["processes"]["gui"][field] = 199_000_000
            row["processes"]["worker"][field] = 1_000_001
            self.assertTrue(over_limit(row))
            row["processes"]["worker"][field] -= 1
            self.assertFalse(over_limit(row))

    def test_clone_copies_committed_graph_and_omits_runtime_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory) / "source", Path(directory) / "target"
            source.mkdir()
            (source / "last-repo").write_text("logseq_db_demo")
            (source / "server-list").write_text("1234")
            (source / "runtime.json").write_text("unrelated ownership")
            names = ("graphs/demo/db.sqlite", "graphs/demo/client-ops-/db.sqlite",
                     "graphs/logseq_db_demo-search.sqlite")
            for name in names:
                path = source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                with sqlite3.connect(path) as connection:
                    connection.execute("create table sample (value text)")
                    connection.execute("insert into sample values ('original')")
            clone_graph(source, target)
            self.assertFalse((target / "runtime.json").exists())
            for name in names:
                with sqlite3.connect(target / name) as connection:
                    self.assertEqual([("original",)], connection.execute("select value from sample").fetchall())
                    connection.execute("delete from sample")
                with sqlite3.connect(source / name) as connection:
                    self.assertEqual(1, connection.execute("select count(*) from sample").fetchone()[0])
            with self.assertRaises(FileExistsError):
                clone_graph(source, target)


if __name__ == "__main__":
    unittest.main()
