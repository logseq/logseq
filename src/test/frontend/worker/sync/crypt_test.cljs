(ns frontend.worker.sync.crypt-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.common.crypt :as crypt]
            [frontend.worker.sync.crypt :as sync-crypt]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <encrypt-text-for-snapshot
  [aes-key value]
  (p/let [encrypted (crypt/<encrypt-text aes-key (ldb/write-transit-str value))]
    (ldb/write-transit-str encrypted)))

;; bb dev:test -v frontend.worker.sync.crypt-test works, however bb dev:lint-and-test failed
(deftest ^:fix-me decrypt-snapshot-rows-test
  (async done
         (-> (p/let [aes-key (crypt/<generate-aes-key)
                     encrypted-title (<encrypt-text-for-snapshot aes-key "Title")
                     encrypted-name (<encrypt-text-for-snapshot aes-key "name")
                     raw-content (ldb/write-transit-str
                                  {:keys [[1 :block/title encrypted-title 1000]
                                          [1 :block/title encrypted-name 1000]]})
                     rows [["addr-1" raw-content nil]]
                     [[_ decrypted-content _]] (sync-crypt/<decrypt-snapshot-rows-batch aes-key rows)
                     keys (:keys (ldb/read-transit-str decrypted-content))]
               (is (= "Title" (nth (first keys) 2)))
               (is (= "name" (nth (second keys) 2)))
               (done))
             (p/catch (fn [e]
                        (is false (str e))
                        (done))))))
