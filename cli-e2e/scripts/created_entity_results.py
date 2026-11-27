#!/usr/bin/env python3

import argparse
import json
import pathlib
import re
import subprocess
import uuid


def main():
    parser = argparse.ArgumentParser()
    for name in ("cli", "root-dir", "config", "graph", "case"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    command = ["node", args.cli, "--root-dir", args.root_dir,
               "--config", args.config, "--graph", args.graph]

    def run(*argv, output="json"):
        result = subprocess.run(command + ["--output", output, *argv],
                                text=True, capture_output=True)
        assert result.returncode == 0, (argv, result.stdout, result.stderr)
        if output == "edn":
            assert ":status :ok" in result.stdout, result.stdout
            match = re.search(r":result\s+\[([\d\s,]*)\]", result.stdout)
            assert match, result.stdout
            return [int(value) for value in re.findall(r"\d+", match[1])]
        payload = json.loads(result.stdout)
        assert payload["status"] == "ok", payload
        return payload["data"]

    def query(expression, *options):
        return run("query", "--query", expression, *options)["result"]

    def entities(ids, pattern="[*]"):
        rows = query(f"[:find (pull ?e {pattern}) :in $ [?e ...] :where [?e :block/uuid]]",
                     "--inputs", json.dumps([ids]))
        by_id = {entity["db/id"]: entity for entity, in rows}
        assert set(by_id) == set(ids), (ids, rows)
        return by_id

    def entity(entity_id):
        value = run("query", "--query",
                    "[:find (pull ?e [*]) . :in $ ?e :where [?e :block/uuid]]",
                    "--inputs", f"[{entity_id}]")["result"]
        assert value, entity_id
        return value

    def page(name):
        run("upsert", "page", "--page", name)
        return query(f'[:find ?e . :where [?e :block/title {json.dumps(name)}]]')

    def title_id(title):
        return query(f'[:find ?e . :where [?e :block/title {json.dumps(title)}]]')

    page("Home")
    reference = page("ExistingReference")
    before = entity(reference)

    if args.case in ("task", "asset"):
        extra = ["--status", "todo"]
        if args.case == "asset":
            asset = pathlib.Path(args.root_dir) / "result.txt"
            asset.write_text("Created entity result fixture\n")
            extra = ["--path", str(asset)]
        ids = run("upsert", args.case, "--target-page", "Home", "--content",
                  "Requested [[ExistingReference]]", *extra)["result"]
        print(f"{args.case} create result: {ids}; reference: {reference}", flush=True)
        assert entity(reference) == before, "Creation changed the reference page"
        if args.case == "task":
            # Exercise an ordinary caller using every returned ID, even on a bad result.
            for entity_id in ids:
                run("upsert", "task", "--id", str(entity_id), "--status", "done")
            after = entity(reference)
            run("server", "restart")
            restarted = entity(reference)
            assert after == before and restarted == before, (before, after, restarted)
            assert all(entity(entity(i)["logseq.property/status"]["db/id"])["db/ident"]
                       == "logseq.property/status.done" for i in ids)
            # Explicitly converting a page to a task remains supported.
            explicit = page("ExplicitTaskPage")
            run("upsert", "task", "--id", str(explicit), "--status", "done")
            assert "logseq.property/status" in entity(explicit)
        assert len(ids) == 1 and ids[0] != reference, ids
        return

    run("upsert", "property", "--name", "Result Note", "--type", "number")
    property_ident = query('[:find ?ident . :where [?e :block/title "Result Note"] [?e :db/ident ?ident]]')
    property_key = property_ident.lstrip(":")

    block_pattern = f"[* {{:{property_key} [:block/uuid :logseq.property/value]}}]"

    def property_value(created):
        value = created.get(property_key)
        if value:
            assert "block/uuid" in value, value
            return value["logseq.property/value"]
        return None

    run("upsert", "tag", "--name", "ResultTag")
    tag = query('[:find ?e . :where [?e :block/title "ResultTag"]]')

    for source in ("--blocks", "--blocks-file"):
        for output in ("json", "edn"):
            for refs in (False, True):
                marker = uuid.uuid4().hex
                new_page = "AutoReference" + uuid.uuid4().hex
                titles = [title + " " + marker
                          for title in ("Root", "Child", "Grandchild", "Sibling")]
                if refs:
                    titles = [title + f" [[ExistingReference]] [[{new_page}]] [[ExistingReference]]"
                              for title in titles]

                tree = "\n".join((
                    f"- {titles[0]}",
                    f"  - {titles[1]}",
                    f"    - {titles[2]}",
                    f"- {titles[3]}",
                ))
                value = tree
                if source == "--blocks-file":
                    path = pathlib.Path(args.root_dir) / "blocks.md"
                    path.write_text(tree)
                    value = str(path)
                result = run("upsert", "block", "--target-page", "Home", source, value,
                             "--update-tags", '["ResultTag"]',
                             "--update-properties", '{"Result Note" 1}', output=output)
                ids = result if output == "edn" else result["result"]
                reference_after_create = entity(reference)
                assert reference_after_create == before, "Command metadata changed the reference page"
                reference_ids = [reference]
                snapshots = [reference_after_create]
                stored_titles = titles
                if refs:
                    new_page_id = title_id(new_page)
                    new_page_after_create = entity(new_page_id)
                    reference_ids.append(new_page_id)
                    snapshots.append(new_page_after_create)
                    existing_uuid = reference_after_create["block/uuid"]
                    new_uuid = new_page_after_create["block/uuid"]
                    stored_titles = [title.replace("[[ExistingReference]]", f"[[{existing_uuid}]]")
                                     .replace(f"[[{new_page}]]", f"[[{new_uuid}]]") for title in titles]
                prefixes = [title.split(" [[", 1)[0] for title in titles]
                matches = query('[:find ?prefix ?e :in $ [?prefix ...] :where [?e :block/title ?title] '
                                '[(clojure.string/starts-with? ?title ?prefix)]]',
                                "--inputs", json.dumps([prefixes]))
                by_prefix = dict(matches)
                assert len(matches) == len(by_prefix) and set(by_prefix) == set(prefixes), matches
                expected = [by_prefix[prefix] for prefix in prefixes]
                created_blocks = entities(expected, block_pattern)
                print(f"{args.case} {source} {output} refs={refs}: {ids}; expected {expected}", flush=True)
                for index, entity_id in enumerate(expected):
                    created = created_blocks[entity_id]
                    assert created["block/title"] == stored_titles[index], created
                    is_root = index in (0, 3)
                    assert (property_value(created) == 1) == is_root, created
                    assert any(t["db/id"] == tag for t in created.get("block/tags", [])) == is_root, created
                assert ids == expected, (ids, expected)
                for entity_id in ids:
                    run("upsert", "block", "--id", str(entity_id),
                        "--update-properties", f'{{:{property_key} 2}}')
                updated_blocks = entities(expected, block_pattern)
                assert all(property_value(updated_blocks[i]) == 2 for i in expected)
                updated_references = entities(reference_ids)
                assert [updated_references[i] for i in reference_ids] == snapshots
                run("remove", "block", "--id", json.dumps([expected[0], reference]))
                assert entity(reference) == before, "Mixed block deletion changed the page"


if __name__ == "__main__":
    main()
