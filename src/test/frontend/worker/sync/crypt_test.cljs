(ns frontend.worker.sync.crypt-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.common.crypt :as crypt]
            [frontend.worker.sync.crypt :as sync-crypt]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private decrypt-snapshot-datoms-batch-orig sync-crypt/<decrypt-snapshot-datoms-batch)

(defn- <encrypt-text-for-snapshot
  [aes-key value]
  (p/let [encrypted (crypt/<encrypt-text aes-key (ldb/write-transit-str value))]
    (ldb/write-transit-str encrypted)))

;; bb dev:test -v frontend.worker.sync.crypt-test works, however bb dev:lint-and-test failed
(deftest decrypt-snapshot-datoms-test
  (async done
         (set! sync-crypt/<decrypt-snapshot-datoms-batch decrypt-snapshot-datoms-batch-orig)
         (-> (p/let [aes-key (crypt/<generate-aes-key)
                     encrypted-title (<encrypt-text-for-snapshot aes-key "Title")
                     encrypted-name (<encrypt-text-for-snapshot aes-key "name")
                     datoms [{:e 1 :a :block/title :v encrypted-title :tx 1000 :added true}
                             {:e 1 :a :block/name :v encrypted-name :tx 1000 :added true}]
                     decrypted (sync-crypt/<decrypt-snapshot-datoms-batch aes-key datoms)]
               (is (= "Title" (:v (first decrypted))))
               (is (= "name" (:v (second decrypted))))
               (done))
             (p/catch (fn [e]
                        (is false (str e))
                        (done))))))

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

(deftest fetch-graph-aes-key-for-download-retries-with-fresh-rsa-key-pair-test
  (async done
         (let [clear-user-rsa-cache-calls* (atom 0)
               get-pair-calls* (atom 0)]
           (-> (p/with-redefs [sync-crypt/e2ee-base (fn [] "https://sync.example.test")
                               sync-crypt/get-user-uuid (fn [] "user-1")
                               sync-crypt/<clear-item! (fn [_] (p/resolved nil))
                               sync-crypt/<set-item! (fn [_ _] (p/resolved nil))
                               sync-crypt/<clear-user-rsa-key-pair-cache! (fn [_base _user-id]
                                                                            (swap! clear-user-rsa-cache-calls* inc)
                                                                            (p/resolved nil))
                               sync-crypt/<get-user-rsa-key-pair-raw (fn [_base]
                                                                       (swap! get-pair-calls* inc)
                                                                       (if (= 1 @get-pair-calls*)
                                                                         (p/resolved {:public-key "pk-old"
                                                                                      :encrypted-private-key "enc-old"})
                                                                         (p/resolved {:public-key "pk-new"
                                                                                      :encrypted-private-key "enc-new"})))
                               sync-crypt/<decrypt-private-key (fn [encrypted-private-key]
                                                                 (p/resolved
                                                                  (case encrypted-private-key
                                                                    "enc-old" :private-key-old
                                                                    "enc-new" :private-key-new
                                                                    :private-key-unknown)))
                               sync-crypt/<fetch-graph-encrypted-aes-key-raw (fn [_base _graph-id]
                                                                               (p/resolved {:encrypted-aes-key
                                                                                            (ldb/write-transit-str "encrypted-aes")}))
                               crypt/<decrypt-aes-key (fn [private-key encrypted-aes-key]
                                                        (if (= :private-key-old private-key)
                                                          (p/rejected (ex-info "decrypt-aes-key" {}))
                                                          (p/resolved [:aes-key private-key encrypted-aes-key])))]
                 (sync-crypt/<fetch-graph-aes-key-for-download "graph-1"))
               (p/then (fn [result]
                         (is (= [:aes-key :private-key-new "encrypted-aes"] result))
                         (is (= 1 @clear-user-rsa-cache-calls*))
                         (is (= 2 @get-pair-calls*))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest fetch-graph-aes-key-for-download-rethrows-without-user-id-test
  (async done
         (let [clear-user-rsa-cache-calls* (atom 0)]
           (-> (p/with-redefs [sync-crypt/e2ee-base (fn [] "https://sync.example.test")
                               sync-crypt/get-user-uuid (fn [] nil)
                               sync-crypt/<clear-item! (fn [_] (p/resolved nil))
                               sync-crypt/<set-item! (fn [_ _] (p/resolved nil))
                               sync-crypt/<clear-user-rsa-key-pair-cache! (fn [_base _user-id]
                                                                            (swap! clear-user-rsa-cache-calls* inc)
                                                                            (p/resolved nil))
                               sync-crypt/<get-user-rsa-key-pair-raw (fn [_base]
                                                                       (p/resolved {:public-key "pk-old"
                                                                                    :encrypted-private-key "enc-old"}))
                               sync-crypt/<decrypt-private-key (fn [_] (p/resolved :private-key-old))
                               sync-crypt/<fetch-graph-encrypted-aes-key-raw (fn [_base _graph-id]
                                                                               (p/resolved {:encrypted-aes-key
                                                                                            (ldb/write-transit-str "encrypted-aes")}))
                               crypt/<decrypt-aes-key (fn [_ _]
                                                        (p/rejected (ex-info "decrypt-aes-key" {})))]
                 (sync-crypt/<fetch-graph-aes-key-for-download "graph-1"))
               (p/then (fn [_]
                         (is false "expected decrypt-aes-key failure")
                         (done)))
               (p/catch (fn [e]
                          (is (= "decrypt-aes-key" (ex-message e)))
                          (is (zero? @clear-user-rsa-cache-calls*))
                          (done)))))))
