#!/usr/bin/env python3

import argparse
import json
import subprocess


def main():
    parser = argparse.ArgumentParser()
    for name in ("cli", "root-dir", "config", "graph"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    command = ["node", args.cli, "--root-dir", args.root_dir,
               "--config", args.config, "--graph", args.graph, "--output", "json"]

    def run(*argv, error=None):
        result = subprocess.run(command + list(argv), text=True, capture_output=True)
        if error:
            assert result.returncode != 0, (argv, result.stdout, result.stderr)
            assert error in result.stdout + result.stderr, (argv, result.stdout, result.stderr)
            return
        assert result.returncode == 0, (argv, result.stdout, result.stderr)
        payload = json.loads(result.stdout)
        assert payload["status"] == "ok", payload
        return payload["data"]

    def query(expression):
        return run("query", "--query", expression)["result"]

    def page_state():
        return query(f"[:find (pull ?e [*]) . :where [?e :block/uuid {page_uuid}]]")

    run("upsert", "page", "--page", "Rename Original")
    page_id = query('[:find ?e . :where [?e :block/name "rename original"]]')
    original = query('[:find (pull ?e [*]) . :where [?e :block/name "rename original"]]')
    page_uuid = '#uuid "' + original["block/uuid"] + '"'
    run("upsert", "page", "--page", "References")
    run("upsert", "block", "--target-page", "References", "--content",
        "Existing [[Rename Original]]")

    run("upsert", "page", "--page", "Rename Original", "--rename", "Rename New",
        "--update-properties", '{:logseq.property/description "Renamed together"}')
    renamed = page_state()
    assert renamed["db/id"] == page_id, renamed
    assert renamed["block/title"] == "Rename New", renamed
    assert renamed["block/name"] == "rename new", renamed
    assert query(f"[:find ?value . :where [{page_id} :logseq.property/description ?ref] "
                 "[?ref :block/title ?value]]") == "Renamed together"
    assert query('[:find ?e . :where [?e :block/name "rename original"]]') is None

    run("upsert", "block", "--target-page", "References", "--content",
        "New [[Rename New]]")
    assert query('[:find (count ?e) . :where [?e :block/title "Rename New"]]') == 1
    assert query(f"[:find (count ?b) . :where [?b :block/refs {page_id}]]") == 2

    run("upsert", "page", "--id", str(page_id), "--rename", "Rename Final")
    assert page_state()["block/name"] == "rename final"
    assert page_state()["block/title"] == "Rename Final"
    assert query('[:find ?e . :where [?e :block/name "rename new"]]') is None
    run("upsert", "page", "--page", "Taken Name")
    before = page_state()

    for options, error in (
        (["--page", "Missing Name", "--rename", "Never Created"], "page-not-found"),
        (["--id", "999999999", "--rename", "Never Created"], "page-not-found"),
        (["--rename", "Never Created"], "--id or --page"),
        (["--id", str(page_id), "--page", "Rename Final", "--rename", "No"],
         "only one of --id or --page"),
        (["--id", str(page_id), "--rename", "  "], "non-empty"),
        (["--id", str(page_id), "--rename", "Taken Name", "--update-properties",
          '{:logseq.property/description "Must not commit"}'], "already exists"),
        (["--id", str(page_id), "--rename", "Unsafe", "--update-properties",
          '{:logseq.property/description 42}'], "validation"),
        (["--id", str(page_id), "--update-properties", '{:block/title "Unsafe"}'],
         "--rename"),
        (["--page", "Never Created", "--update-properties", '{:block/title "Unsafe"}'],
         "--rename"),
        (["--id", str(page_id), "--rename", "Unsafe", "--update-properties",
          '{:block/title "Also Unsafe"}'], "--rename"),
    ):
        run("upsert", "page", *options, error=error)
        assert page_state() == before, options
        assert query('[:find ?e . :where [?e :block/name "never created"]]') is None

    run("upsert", "tag", "--name", "Rename A")
    run("upsert", "tag", "--name", "Rename B")
    run("upsert", "page", "--id", str(page_id), "--update-tags", '["Rename A"]')
    run("upsert", "page", "--page", "Other Page", "--update-tags", '["Rename B"]')
    run("upsert", "page", "--page", "Other Page", "--rename", "Rename Final")
    before = page_state()
    run("upsert", "page", "--page", "Rename Final", "--rename", "Ambiguous",
        error="ambiguous-page-name")
    assert page_state() == before
    assert query('[:find (count ?e) . :where [?e :block/name "rename final"]]') == 2
    run("upsert", "page", "--id", str(page_id), "--rename", "Unique Final")
    before = page_state()
    assert before["block/name"] == "unique final"
    assert before["block/title"] == "Unique Final"

    run("server", "restart")
    assert page_state() == before
    assert query(f"[:find (count ?b) . :where [?b :block/refs {page_id}]]") == 2
    print("Page rename preserves identity, lookup names and references; rejected writes leave no changes.")


if __name__ == "__main__":
    main()
