(ns frontend.worker.worker-common-util-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]))

(deftest encode-decode-graph-dir-name-roundtrip
  (let [names ["Demo"
               "foo/bar"
               "a:b"
               "space name"
               "100% legit"
               "til~de"
               "mix/ed:chars%~"]
        encoded (map worker-util/encode-graph-dir-name names)]
    (doseq [[name enc] (map vector names encoded)]
      (is (= name (worker-util/decode-graph-dir-name enc))))
    (doseq [enc encoded]
      (is (not (string/includes? enc "/")))
      (is (not (string/includes? enc "\\")))))
  (is (nil? (worker-util/decode-graph-dir-name nil))))
