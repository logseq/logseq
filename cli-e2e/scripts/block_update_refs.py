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

    def run(*argv, error=False):
        result = subprocess.run(command + list(argv), text=True, capture_output=True)
        if error:
            assert result.returncode != 0, (argv, result.stdout, result.stderr)
            return
        assert result.returncode == 0, (argv, result.stdout, result.stderr)
        payload = json.loads(result.stdout)
        assert payload["status"] == "ok", payload
        return payload["data"]

    def query(expression):
        return run("query", "--query", expression)["result"]

    def refs():
        return set(query(f"[:find [?title ...] :where [{block_id} :block/refs ?r] "
                         "[?r :block/title ?title]]"))

    def update(content, expected, selector="--id"):
        identity = str(block_id) if selector == "--id" else block_uuid
        run("upsert", "block", selector, identity, "--content", content)
        actual = refs()
        assert actual == set(expected), (content, expected, actual)

    for page in ("Home", "Alpha", "Beta"):
        run("upsert", "page", "--page", page)
    block_id = run("upsert", "block", "--target-page", "Home", "--content",
                   "Note on [[Alpha]] and [[Beta]]")["result"][0]
    block_uuid = query(f"[:find ?uuid . :where [{block_id} :block/uuid ?uuid]]")
    assert refs() == {"Alpha", "Beta"}

    update("Updated note on [[Alpha]] and [[Beta]]", ["Alpha", "Beta"])
    update("Updated note on [[Alpha]] and [[Beta]]", ["Alpha", "Beta"])
    update("Only [[Alpha]]", ["Alpha"], selector="--uuid")
    update("New [[Created from update]] and [[Namespace/Child]]",
           ["Created from update", "Child"])
    assert query('[:find (count ?e) . :where [?e :block/name "created from update"]]') == 1
    assert query('[:find (count ?e) . :where [?e :block/name "child"] '
                 '[?e :block/parent ?p] [?p :block/name "namespace"]]') == 1
    update("Again [[Created from update]] and [[Created from update]]",
           ["Created from update"])
    assert query('[:find (count ?e) . :where [?e :block/name "created from update"]]') == 1
    update("中文 [[参考页面]] and [[Alpha]]", ["参考页面", "Alpha"])

    alpha_uuid = query('[:find ?uuid . :where [?e :block/name "alpha"] [?e :block/uuid ?uuid]]')
    update(f"Mixed [[Beta]] and [[{alpha_uuid}]]", ["Alpha", "Beta"])
    update(f"Mixed again [[Beta]] and [[{alpha_uuid}]]", ["Alpha", "Beta"])
    update(f"UUID only [[{alpha_uuid}]]", ["Alpha"])
    update(f"UUID only [[{alpha_uuid}]]", ["Alpha"])
    update("Real [[Alpha]] and `[[Ignored code]]`", ["Alpha"])
    assert query('[:find ?e . :where [?e :block/name "ignored code"]]') is None
    # Deliberately match Desktop's current global conversion, including literals.
    update("Case [[aLpHa]] and `[[aLpHa]]` and \\[[aLpHa]]", ["Alpha"])
    stored_title = query(f"[:find ?title . :where [{block_id} :block/title ?title]]")
    assert stored_title == (f"Case [[{alpha_uuid}]] and `[[{alpha_uuid}]]` "
                            f"and \\[[{alpha_uuid}]]"), stored_title
    update("literal ` then [[Created after unmatched tick]]", ["Created after unmatched tick"])
    update("literal `` then [[Created after unmatched pair]]", ["Created after unmatched pair"])
    update("literal `\n\n[[Created in next paragraph]]\n\n`", ["Created in next paragraph"])
    update("Plain content", [])
    update("[[Alpha]]", ["Alpha"])
    update("", [])
    update("Persisted [[Alpha]] and [[Beta]]", ["Alpha", "Beta"])
    run("server", "restart")
    assert refs() == {"Alpha", "Beta"}

    run("upsert", "block", "--id", "999999999", "--content", "[[Missing source page]]", error=True)
    assert query('[:find ?e . :where [?e :block/name "missing source page"]]') is None
    run("upsert", "block", "--id", str(block_id), "--content", "[[Rollback page]]",
        "--update-properties", '{:logseq.property/description 999999999}', error=True)
    assert refs() == {"Alpha", "Beta"}
    assert query('[:find ?e . :where [?e :block/name "rollback page"] '
                 '(not [?e :logseq.property/deleted-at])]') is None
    # Fresh blocks avoid carrying an existing display-type into another case.
    for markup, raw, display, lang in (
        ("```clojure\n[[Alpha]]\n```", "[[Alpha]]", "code", "clojure"),
        ("$$E=mc^2$$", "E=mc^2", "math", None),
    ):
        created = run("upsert", "block", "--target-page", "Home", "--content", markup)["result"][0]
        assert query(f"[:find ?title . :where [{created} :block/title ?title]]") == raw
        assert query(f"[:find ?type . :where [{created} :logseq.property.node/display-type ?type]]") == display
        assert query(f"[:find ?lang . :where [{created} :logseq.property.code/lang ?lang]]") == lang
        assert query(f"[:find ?r . :where [{created} :block/refs ?r] [?r :block/name \"alpha\"]]") is None
    tagged = run("upsert", "block", "--target-page", "Home", "--content", "note #InlineTag")["result"][0]
    tag_uuid = query('[:find ?u . :where [?e :block/name "inlinetag"] [?e :block/uuid ?u]]')
    assert query(f"[:find ?title . :where [{tagged} :block/title ?title]]") == f"note #[[{tag_uuid}]]"
    assert query(f"[:find ?r . :where [{tagged} :block/tags ?r] [?r :block/name \"inlinetag\"]]") is not None
    heading = run("upsert", "block", "--target-page", "Home", "--content", "## Heading [[Alpha]]")["result"][0]
    assert query(f"[:find ?title . :where [{heading} :block/title ?title]]") == f"Heading [[{alpha_uuid}]]"
    assert query(f"[:find ?level . :where [{heading} :logseq.property/heading ?level]]") == 2
    print("block update page refs: passed")


if __name__ == "__main__":
    main()
