from __future__ import annotations

import importlib.util
from pathlib import Path
import sys


MODULE_PATH = Path(__file__).resolve().parents[4] / "scripts" / "random_bidirectional_block_ops.py"
spec = importlib.util.spec_from_file_location("random_bidirectional_block_ops", MODULE_PATH)
random_bidirectional_block_ops = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = random_bidirectional_block_ops
spec.loader.exec_module(random_bidirectional_block_ops)


def test_default_profile_is_faster_than_high_stress(monkeypatch) -> None:
    monkeypatch.setattr(
        random_bidirectional_block_ops.sys,
        "argv",
        [
            "random_bidirectional_block_ops.py",
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
            "--page",
            "Home",
        ],
    )
    default_args = random_bidirectional_block_ops.parse_args()

    monkeypatch.setattr(
        random_bidirectional_block_ops.sys,
        "argv",
        [
            "random_bidirectional_block_ops.py",
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
            "--page",
            "Home",
            "--profile",
            "high-stress",
        ],
    )
    high_stress_args = random_bidirectional_block_ops.parse_args()

    assert default_args.root_dir_a == "/tmp/a"
    assert default_args.root_dir_b == "/tmp/b"
    assert default_args.profile == "default"
    assert high_stress_args.profile == "high-stress"
    assert default_args.rounds_per_client < high_stress_args.rounds_per_client


def test_explicit_rounds_override_profile_default(monkeypatch) -> None:
    monkeypatch.setattr(
        random_bidirectional_block_ops.sys,
        "argv",
        [
            "random_bidirectional_block_ops.py",
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
            "--page",
            "Home",
            "--profile",
            "high-stress",
            "--rounds-per-client",
            "12",
        ],
    )

    args = random_bidirectional_block_ops.parse_args()

    assert args.profile == "high-stress"
    assert args.rounds_per_client == 12
