(ns frontend.handler.repo-test
  (:require [cljs.test :refer [deftest use-fixtures]]
            [frontend.handler.repo :as repo-handler]
            [frontend.test.helper :as test-helper]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [frontend.db.conn :as conn]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        files (gp-cli/build-graph-files graph-dir)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false})
        db (conn/get-db test-helper/test-db)]

    (docs-graph-helper/docs-graph-assertions db (map :file/path files))))
