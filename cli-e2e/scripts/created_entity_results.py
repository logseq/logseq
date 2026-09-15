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

    def query(expression):
        return run("query", "--query", expression)["result"]

    def entity(entity_id):
        value = run("query", "--query",
                    "[:find (pull ?e [*]) . :in $ ?e :where [?e :block/uuid]]",
                    "--inputs", f"[{entity_id}]")["result"]
        assert value, entity_id
        return value

    def page(name):
        run("upsert", "page", "--page", name)
        return query(f'[:find ?e . :where [?e :block/title {json.dumps(name)}]]')

    def block_id(block_uuid):
        return query(f'[:find ?e . :where [?e :block/uuid #uuid "{block_uuid}"]]')

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

    def property_value(created):
        value = created.get(property_key)
        return entity(value["db/id"])["logseq.property/value"] if value else None

    run("upsert", "tag", "--name", "ResultTag")
    tag = query('[:find ?e . :where [?e :block/title "ResultTag"]]')

    for source in ("--blocks", "--blocks-file"):
        for output in ("json", "edn"):
            for refs in (False, True):
                uuids = [str(uuid.uuid4()) for _ in range(4)]
                new_page = "AutoReference" + uuid.uuid4().hex
                titles = [title + " " + uuids[0]
                          for title in ("Root", "Child", "Grandchild", "Sibling")]
                if refs:
                    titles = [title + f" [[ExistingReference]] [[{new_page}]] [[ExistingReference]]"
                              for title in titles]

                def block(index, children=""):
                    identity = ("" if source == "--blocks-file" and not refs
                                else f':block/uuid #uuid "{uuids[index]}"')
                    return (f'{{:block/title {json.dumps(titles[index])} '
                            f'{identity} {children}}}')

                tree = ("[" + block(0, ":block/children [" +
                        block(1, ":block/children [" + block(2) + "]") + "]") +
                        " " + block(3) + "]")
                value = tree
                if source == "--blocks-file":
                    path = pathlib.Path(args.root_dir) / "blocks.edn"
                    path.write_text(tree)
                    value = str(path)
                result = run("upsert", "block", "--target-page", "Home", source, value,
                             "--update-tags", '["ResultTag"]',
                             "--update-properties", '{"Result Note" 1}', output=output)
                ids = result if output == "edn" else result["result"]
                expected = ([query(f'[:find ?e . :where [?e :block/title {json.dumps(title)}]]')
                             for title in titles]
                            if source == "--blocks-file" and not refs
                            else [block_id(value) for value in uuids])
                print(f"{args.case} {source} {output} refs={refs}: {ids}; expected {expected}", flush=True)
                assert all(expected), expected
                assert entity(reference) == before, "Command metadata changed the reference page"
                for index, entity_id in enumerate(expected):
                    created = entity(entity_id)
                    is_root = index in (0, 3)
                    assert (property_value(created) == 1) == is_root, created
                    assert any(t["db/id"] == tag for t in created.get("block/tags", [])) == is_root, created
                if args.case == "metadata":
                    continue
                assert ids == expected, (ids, expected)
                reference_ids = [reference]
                if refs:
                    reference_ids.append(query(f'[:find ?e . :where [?e :block/title "{new_page}"]]'))
                snapshots = [entity(i) for i in reference_ids]
                for entity_id in ids:
                    run("upsert", "block", "--id", str(entity_id),
                        "--update-properties", f'{{:{property_key} 2}}')
                assert all(property_value(entity(i)) == 2 for i in expected)
                assert [entity(i) for i in reference_ids] == snapshots
                run("remove", "block", "--id", json.dumps([expected[0], reference]))
                assert entity(reference) == before, "Mixed block deletion changed the page"


if __name__ == "__main__":
    main()
