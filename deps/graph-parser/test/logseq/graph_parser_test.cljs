(ns logseq.graph-parser-test
  (:require [cljs.test :refer [deftest]]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]))


;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        files (docs-graph-helper/build-graph-files graph-dir)
        conn (gp-db/start-conn)
        _ (graph-parser/parse conn files)
        db @conn]

    (docs-graph-helper/docs-graph-assertions db files)))
