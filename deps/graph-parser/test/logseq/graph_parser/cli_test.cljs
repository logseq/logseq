(ns logseq.graph-parser.cli-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [clojure.string :as string]))

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-graph
  (let [graph-dir "test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        {:keys [conn files asts]} (gp-cli/parse-graph graph-dir)]

    (docs-graph-helper/docs-graph-assertions @conn files)

    (testing "Asts"
      (is (seq asts) "Asts returned are non-zero")
      (is (= files (map :file asts))
          "There's an ast returned for every file processed")
      (is (empty? (remove #(or
                            (seq (:ast %))
                            ;; logseq files don't have ast
                            ;; could also used gp-config but API isn't public yet
                            (string/includes? (:file %) (str graph-dir "/logseq/")))
                          asts))
          "Parsed files shouldn't have empty asts"))))
