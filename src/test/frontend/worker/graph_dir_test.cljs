(ns frontend.worker.graph-dir-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.graph-dir :as graph-dir]))

(deftest repo->graph-dir-key-strips-db-prefix
  (testing "db-prefixed repo is mapped to prefix-free graph dir key"
    (is (= "demo" (graph-dir/repo->graph-dir-key "logseq_db_demo")))))

(deftest repo->graph-dir-key-keeps-prefix-free-name
  (testing "prefix-free repo remains unchanged"
    (is (= "demo" (graph-dir/repo->graph-dir-key "demo")))))
