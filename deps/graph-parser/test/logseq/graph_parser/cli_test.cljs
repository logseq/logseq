(ns logseq.graph-parser.cli-test
  (:require [cljs.test :refer [deftest]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]))

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-graph
  (let [graph-dir "test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        {:keys [conn files]} (gp-cli/parse-graph graph-dir)
        db @conn]

    (docs-graph-helper/docs-graph-assertions db files)))
