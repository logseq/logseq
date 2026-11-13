#!/usr/bin/env python3

import argparse
import datetime
import json
import subprocess


def main():
    parser = argparse.ArgumentParser()
    for name in ("cli", "root-dir", "config", "graph"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    command = ["node", args.cli, "--root-dir", args.root_dir,
               "--config", args.config, "--graph", args.graph, "--output", "json"]

    def run(*argv):
        result = subprocess.run(command + list(argv), text=True, capture_output=True)
        assert result.returncode == 0, (argv, result.stdout, result.stderr)
        payload = json.loads(result.stdout)
        assert payload["status"] == "ok", payload
        return payload["data"]

    def query(expression):
        return run("query", "--query", expression)["result"]

    def journal_refs(task_id):
        return sorted(query(f"[:find [?day ...] :where [{task_id} :block/refs ?journal] "
                            "[?journal :block/journal-day ?day]]"))

    for property_name in ("scheduled", "deadline"):
        property_ident = ":logseq.property/" + property_name
        task_id = run("upsert", "block", "--target-page", "Home", "--content",
                      "Repeating " + property_name)["result"][0]
        run("upsert", "task", "--id", str(task_id), "--status", "todo")
        initial_ms = int(datetime.datetime(2026, 11, 8, 12).timestamp() * 1000)
        for assignment in (
            f"{property_ident} {initial_ms}",
            ":logseq.property.repeat/repeated? true",
            ":logseq.property.repeat/recur-frequency 1",
            ":logseq.property.repeat/recur-unit :logseq.property.repeat/recur-unit.week",
            ":logseq.property.repeat/repeat-type :logseq.property.repeat/repeat-type.plus",
            f":logseq.property.repeat/temporal-property {property_ident}",
        ):
            run("upsert", "block", "--id", str(task_id),
                "--update-properties", "{" + assignment + "}")
        for day in (20261115, 20261122):
            run("upsert", "task", "--id", str(task_id), "--status", "done")
            value = query(f"[:find ?value . :where [{task_id} {property_ident} ?value]]")
            actual_day = int(datetime.datetime.fromtimestamp(value / 1000).strftime("%Y%m%d"))
            refs = journal_refs(task_id)
            print(f"{property_name}: date={actual_day}, journal refs={refs}", flush=True)
            assert actual_day == day, (property_name, actual_day, day)
            assert refs == [day], (property_name, refs, day)
            status = query(f"[:find ?ident . :where [{task_id} :logseq.property/status ?status] "
                           "[?status :db/ident ?ident]]")
            assert status == "logseq.property/status.todo", status
        run("server", "restart")
        assert journal_refs(task_id) == [20261122], "Refs must survive a worker restart"
    print("Repeating task journal refs follow both dates and survive restart")


if __name__ == "__main__":
    main()
