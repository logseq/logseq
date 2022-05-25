(ns frontend.handler.repo-test
  (:require [cljs.test :refer [deftest use-fixtures is testing]]
            [frontend.handler.repo :as repo-handler]
            [frontend.test.helper :as test-helper]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [datascript.core :as d]
            [frontend.db.conn :as conn]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        files (docs-graph-helper/build-graph-files graph-dir)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false})
        db (conn/get-db test-helper/test-db)]

    #_:clj-kondo/ignore ;; buggy unresolved var
    (docs-graph-helper/docs-graph-assertions db files)

    (testing "Delete previous file data when re-parsing a file"
      (repo-handler/parse-files-and-load-to-db! test-helper/test-db
                                                (filter #(re-find #"pages/tutorial.md" (:file/path %))
                                                        files)
                                                {:re-render? false})
      (is (= 206 (count files)) "Correct file count")
      (is (= 40888 (count (d/datoms db :eavt))) "Correct datoms count")
      )))
