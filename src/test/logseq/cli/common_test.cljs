(ns logseq.cli.common-test
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.common :as cli-common]
            [logseq.melange.bridge.common.api :as melange-common]))

(deftest unlink-graph-moves-to-unlinked-dir
  (let [graphs-dir (node-helper/create-tmp-dir "unlink-graph")
        graph-name "foo/bar"
        repo (str melange-common/db-version-prefix graph-name)
        encoded-graph-dir "foo~2Fbar"
        graph-path (node-path/join graphs-dir encoded-graph-dir)
        unlinked-path (node-path/join graphs-dir melange-common/unlinked-graphs-dir encoded-graph-dir)]
    (fs/mkdirSync graph-path #js {:recursive true})
    (fs/writeFileSync (node-path/join graph-path "db.sqlite") "test-data")
    (cli-common/unlink-graph! graphs-dir repo)
    (is (not (fs/existsSync graph-path))
        "Original graph directory should no longer exist")
    (is (fs/existsSync unlinked-path)
        "Graph directory should be moved to Unlinked graphs")
    (is (fs/existsSync (node-path/join unlinked-path "db.sqlite"))
        "Graph contents should be preserved after move")))

(deftest unlink-graph-moves-space-preserving-canonical-dir
  (let [graphs-dir (node-helper/create-tmp-dir "unlink-graph-space")
        graph-name "space name"
        repo (str melange-common/db-version-prefix graph-name)
        encoded-graph-dir "space name"
        graph-path (node-path/join graphs-dir encoded-graph-dir)
        unlinked-path (node-path/join graphs-dir melange-common/unlinked-graphs-dir encoded-graph-dir)]
    (fs/mkdirSync graph-path #js {:recursive true})
    (fs/writeFileSync (node-path/join graph-path "db.sqlite") "test-data")
    (cli-common/unlink-graph! graphs-dir repo)
    (is (not (fs/existsSync graph-path))
        "Original space-preserving graph directory should no longer exist")
    (is (fs/existsSync unlinked-path)
        "Space-preserving graph directory should be moved to Unlinked graphs")
    (is (fs/existsSync (node-path/join unlinked-path "db.sqlite"))
        "Graph contents should be preserved after move")))
