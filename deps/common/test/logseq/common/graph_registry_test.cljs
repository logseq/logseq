(ns logseq.common.graph-registry-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.common.graph-registry :as registry]))

(deftest registry-normalizes-graph-name-whitespace
  (let [entries (registry/upsert-entry [] {:graph-id "graph-id"
                                         :repo " logseq_db_space name "
                                         :graph-name " space name "})]
    (is (= "logseq_db_space name" (:repo (first entries))))
    (is (= "space name" (:graph-name (first entries))))
    (doseq [identifier [" space name " " logseq_db_space name " "logseq_db_ space name "]]
      (is (= "graph-id" (:graph-id (registry/resolve-target entries {:graph-identifier identifier})))))))
