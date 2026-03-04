(ns logseq.cli.command.graph-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.cli.command.graph :as graph-command]))

(deftest test-graph-validate-result
  (let [graph-validate-result #'graph-command/graph-validate-result
        invalid-result (graph-validate-result {:errors [{:entity {:db/id 1}
                                                        :errors {:foo ["bad"]}}]})
        valid-result (graph-validate-result {:errors nil :datom-count 10})]
    (is (= :error (:status invalid-result)))
    (is (= :graph-validation-failed (get-in invalid-result [:error :code])))
    (is (string/includes? (get-in invalid-result [:error :message])
                          "Found 1 entity with errors:"))
    (is (= :ok (:status valid-result)))))
