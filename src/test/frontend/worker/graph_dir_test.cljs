(ns frontend.worker.graph-dir-test
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [cljs.test :refer [deftest is testing]]))

(deftest repo->graph-dir-key-strips-db-prefix
  (testing "db-prefixed repo is mapped to prefix-free graph dir key"
    (is (= "demo" (melange-common/repo-to-graph-dir-key "logseq_db_demo")))))

(deftest repo->graph-dir-key-keeps-prefix-free-name
  (testing "prefix-free repo remains unchanged"
    (is (= "demo" (melange-common/repo-to-graph-dir-key "demo")))))

(deftest repo->encoded-graph-dir-name-encodes-special-characters
  (testing "db-prefixed repos resolve to the encoded on-disk graph dir name"
    (is (= "foo~2Fbar"
           (melange-common/repo-to-encoded-graph-dir-name "logseq_db_foo/bar")))
    (is (= "space name"
           (melange-common/repo-to-encoded-graph-dir-name "logseq_db_space name")))))

(deftest decode-graph-dir-name-decodes-only-canonical-encoded-names
  (testing "encoded graph dirs decode back to the logical graph dir key"
    (is (= "foo/bar"
           (melange-common/decode-graph-dir-name "foo~2Fbar"))))
  (testing "legacy graph-dir encodings are not accepted"
    (is (nil? (melange-common/decode-graph-dir-name "foo++bar")))
    (is (nil? (melange-common/decode-graph-dir-name "a+3A+b")))))

(deftest decode-legacy-graph-dir-name-derives-only-legacy-compatible-names
  (testing "legacy token encoding decodes into graph name"
    (is (= "foo/bar"
           (melange-common/decode-legacy-graph-dir-name "foo++bar")))
    (is (= "a:b"
           (melange-common/decode-legacy-graph-dir-name "a+3A+b"))))
  (testing "legacy uri-encoded names decode when valid"
    (is (= "space name"
           (melange-common/decode-legacy-graph-dir-name "space%20name"))))
  (testing "invalid or canonical names are ignored"
    (is (nil? (melange-common/decode-legacy-graph-dir-name "foo~2Fbar")))
    (is (nil? (melange-common/decode-legacy-graph-dir-name "bad%ZZname")))))
