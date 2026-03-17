(ns frontend.worker.worker-common-util-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]))

(deftest encode-decode-graph-dir-name-roundtrip
  (let [cases [["Demo" "Demo"]
               ["foo/bar" "foo~2Fbar"]
               ["a:b" "a~3Ab"]
               ["space name" "space name"]
               ["100% legit" "100~25 legit"]
               ["til~de" "til~7Ede"]
               ["A B/C:D%~E" "A B~2FC~3AD~25~7EE"]]]
    (doseq [[name expected-encoded] cases]
      (let [encoded (worker-util/encode-graph-dir-name name)]
        (is (= expected-encoded encoded))
        (is (= name (worker-util/decode-graph-dir-name encoded)))
        (is (not (string/includes? encoded "/")))
        (is (not (string/includes? encoded "\\")))))
    (is (= "space name" (worker-util/decode-graph-dir-name "space~20name")))
    (is (= "space name" (worker-util/decode-graph-dir-name "space%20name"))))
  (is (nil? (worker-util/decode-graph-dir-name nil))))
