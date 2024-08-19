(ns ^:node-only logseq.graph-parser.cli-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [clojure.string :as string]
            [datascript.core :as d]))

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-graph
  (let [graph-dir "test/resources/docs-0.10.9"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.10.9")
        {:keys [conn files asts]} (gp-cli/parse-graph graph-dir {:verbose false})]

    (docs-graph-helper/docs-graph-assertions @conn graph-dir files)

    (testing "Additional counts"
      (is (= 57882 (count (d/datoms @conn :eavt))) "Correct datoms count"))

    (testing "Asts"
      (is (seq asts) "Asts returned are non-zero")
      (is (= files (map :file asts))
          "There's an ast returned for every file processed")
      (is (empty? (remove #(or
                            (seq (:ast %))
                            ;; edn files don't have ast
                            (string/ends-with? (:file %) ".edn")
                            ;; logseq files don't have ast
                            ;; could also used common-config but API isn't public yet
                            (string/includes? (:file %) (str graph-dir "/logseq/")))
                          asts))
          "Parsed files shouldn't have empty asts"))))
