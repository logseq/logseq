from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace


MODULE_PATH = Path(__file__).resolve().parents[4] / "scripts" / "compare_graph_queries.py"
spec = importlib.util.spec_from_file_location("compare_graph_queries", MODULE_PATH)
compare_graph_queries = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(compare_graph_queries)


def test_parse_args_supports_repeated_queries(monkeypatch) -> None:
    monkeypatch.setattr(
        compare_graph_queries.sys,
        "argv",
        [
            "compare_graph_queries.py",
            "--cli",
            "/tmp/logseq-cli.js",
            "--graph",
            "demo",
            "--config-a",
            "/tmp/a.edn",
            "--root-dir-a",
            "/tmp/a",
            "--config-b",
            "/tmp/b.edn",
            "--root-dir-b",
            "/tmp/b",
            "--query",
            "[:find ?x]",
            "--query",
            "[:find ?y]",
        ],
    )

    args = compare_graph_queries.parse_args()

    assert args.root_dir_a == "/tmp/a"
    assert args.root_dir_b == "/tmp/b"
    assert args.query == ["[:find ?x]", "[:find ?y]"]


def test_main_batches_multiple_queries_in_one_process(tmp_path: Path) -> None:
    left_queries = []
    right_queries = []
    printed = []
    cli_path = tmp_path / "logseq-cli.js"
    cli_path.write_text("// mock cli\n")

    def fake_run_query(cli_path, config_path, root_dir, graph, query):
        record = {
            "cli_path": str(cli_path),
            "config_path": str(config_path),
            "root_dir": str(root_dir),
            "graph": graph,
            "query": query,
        }
        if str(config_path).endswith("a.edn"):
            left_queries.append(record)
        else:
            right_queries.append(record)
        return {
            "payload": {"status": "ok"},
            "result": [{"title": query}],
        }

    compare_graph_queries.run_query = fake_run_query
    compare_graph_queries.parse_args = lambda: SimpleNamespace(
        cli=str(cli_path),
        graph="demo",
        query=["[:find ?x]", "[:find ?y]"],
        config_a="/tmp/a.edn",
        root_dir_a="/tmp/a",
        config_b="/tmp/b.edn",
        root_dir_b="/tmp/b",
        require_result=False,
    )
    compare_graph_queries.print = lambda value, **kwargs: printed.append(json.loads(value))

    compare_graph_queries.main()

    assert [item["query"] for item in left_queries] == ["[:find ?x]", "[:find ?y]"]
    assert [item["query"] for item in right_queries] == ["[:find ?x]", "[:find ?y]"]
    assert printed == [
        {
            "status": "ok",
            "results": {
                "[:find ?x]": [{"title": "[:find ?x]"}],
                "[:find ?y]": [{"title": "[:find ?y]"}],
            },
        }
    ]
