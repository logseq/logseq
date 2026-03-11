(ns frontend.worker.graph-dir-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.graph-dir :as graph-dir]))

(deftest repo->graph-dir-key-strips-db-prefix
  (testing "db-prefixed repo is mapped to prefix-free graph dir key"
    (is (= "demo" (graph-dir/repo->graph-dir-key "logseq_db_demo")))))

(deftest repo->graph-dir-key-keeps-prefix-free-name
  (testing "prefix-free repo remains unchanged"
    (is (= "demo" (graph-dir/repo->graph-dir-key "demo")))))

(deftest repo->encoded-graph-dir-name-encodes-special-characters
  (testing "db-prefixed repos resolve to the encoded on-disk graph dir name"
    (is (= "foo~2Fbar"
           (graph-dir/repo->encoded-graph-dir-name "logseq_db_foo/bar")))))

(deftest decode-graph-dir-name-decodes-only-canonical-encoded-names
  (testing "encoded graph dirs decode back to the logical graph dir key"
    (is (= "foo/bar"
           (graph-dir/decode-graph-dir-name "foo~2Fbar"))))
  (testing "legacy graph-dir encodings are not accepted"
    (is (nil? (graph-dir/decode-graph-dir-name "foo++bar")))
    (is (nil? (graph-dir/decode-graph-dir-name "a+3A+b")))))
