(ns frontend.worker.worker-common-util-test
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

(deftest encode-decode-graph-dir-name-roundtrip
  (let [cases [["Demo" "Demo"]
               ["foo/bar" "foo~2Fbar"]
               ["a:b" "a~3Ab"]
               ["space name" "space name"]
               ["100% legit" "100~25 legit"]
               ["til~x" "til~7Ex"]
               ["A B/C:D%~E" "A B~2FC~3AD~25~7EE"]]]
    (doseq [[name expected-encoded] cases]
      (let [encoded (melange-common/encode-graph-dir-name name)]
        (is (= expected-encoded encoded))
        (is (= name (melange-common/decode-graph-dir-name encoded)))
        (is (not (string/includes? encoded "/")))
        (is (not (string/includes? encoded "\\")))))
    (is (= "space name" (melange-common/decode-graph-dir-name "space~20name")))
    (is (= "space name" (melange-common/decode-graph-dir-name "space%20name"))))
  (is (nil? (melange-common/decode-graph-dir-name nil))))
