(ns frontend.worker.sync.crypt-test
  (:require [cljs.test :refer [deftest is async]]
            ["/frontend/idbkv" :as idb-keyval]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.common.file.opfs :as opfs]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.crypt :as sync-crypt]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <encrypt-text-for-snapshot
  [aes-key value]
  (p/let [encrypted (crypt/<encrypt-text aes-key (ldb/write-transit-str value))]
    (ldb/write-transit-str encrypted)))

(deftest cli-node-auth-token-prefers-sync-config-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:auth-token "cli-config-token"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :cli}})]
        (is (= "cli-config-token" (#'sync-crypt/auth-token))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest cli-node-get-user-uuid-reads-from-sync-config-token-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:auth-token "cli-config-token"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :cli}})
                    worker-util/parse-jwt (fn [token]
                                            (cond
                                              (= token "cli-config-token") {:sub "cli-user-id"}
                                              (= token "state-token") {:sub "state-user-id"}
                                              :else {}))]
        (is (= "cli-user-id" (#'sync-crypt/get-user-uuid))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest desktop-token-path-keeps-id-token-behavior-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:auth-token "cli-config-token"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :electron}})
                    worker-util/parse-jwt (fn [token]
                                            (cond
                                              (= token "cli-config-token") {:sub "cli-user-id"}
                                              (= token "state-token") {:sub "state-user-id"}
                                              :else {}))]
        (is (= "state-token" (#'sync-crypt/auth-token)))
        (is (= "state-user-id" (#'sync-crypt/get-user-uuid))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest get-item-preserves-uint8array-type-test
  (async done
         (let [expected (js/Uint8Array. #js [9 8 7])]
           (-> (p/with-redefs [platform/current (fn [] {:runtime :test})
                               platform/kv-get (fn [_platform' _k]
                                                 (p/resolved expected))]
                 (#'sync-crypt/<get-item "rtc-encrypted-aes-key###graph-1"))
               (p/then (fn [result]
                         (is (instance? js/Uint8Array result))
                         (is (= [9 8 7] (vec (js->clj result))))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest save-e2ee-password-uses-platform-write-text-when-not-native-test
  (async done
         (let [platform-map {:runtime :test}
               write-calls (atom [])]
           (-> (p/with-redefs [sync-crypt/native-worker? (fn [] false)
                               crypt/<encrypt-text-by-text-password (fn [_refresh-token _password]
                                                                      {:cipher "payload"})
                               platform/current (fn [] platform-map)
                               platform/write-text! (fn [platform' path text]
                                                      (swap! write-calls conj {:platform platform'
                                                                               :path path
                                                                               :text text})
                                                      nil)
                               opfs/<write-text! (fn [_path _text]
                                                   nil)]
                 (#'sync-crypt/<save-e2ee-password "refresh-token" "password"))
               (p/then (fn [_]
                         (is (= 1 (count @write-calls)))
                         (is (= platform-map (:platform (first @write-calls))))
                         (is (= "e2ee-password" (:path (first @write-calls))))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest read-e2ee-password-uses-platform-read-text-when-not-native-test
  (async done
         (let [platform-map {:runtime :test}
               read-calls (atom [])]
           (-> (p/with-redefs [sync-crypt/native-worker? (fn [] false)
                               platform/current (fn [] platform-map)
                               platform/read-text! (fn [platform' path]
                                                     (swap! read-calls conj {:platform platform'
                                                                             :path path})
                                                     (ldb/write-transit-str {:cipher "payload"}))
                               opfs/<read-text! (fn [_path]
                                                  (ldb/write-transit-str {:cipher "payload"}))
                               crypt/<decrypt-text-by-text-password (fn [_refresh-token _data]
                                                                      "decrypted-password")]
                 (#'sync-crypt/<read-e2ee-password "refresh-token"))
               (p/then (fn [password]
                         (is (= "decrypted-password" password))
                         (is (= 1 (count @read-calls)))
                         (is (= platform-map (:platform (first @read-calls))))
                         (is (= "e2ee-password" (:path (first @read-calls))))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest save-e2ee-password-native-fallback-uses-platform-write-text-test
  (async done
         (let [platform-map {:runtime :test}
               write-calls (atom [])]
           (-> (p/with-redefs [sync-crypt/native-worker? (fn [] true)
                               sync-crypt/<native-save-password-text! (fn [_text]
                                                                        (p/rejected (ex-info "native write failed" {})))
                               crypt/<encrypt-text-by-text-password (fn [_refresh-token _password]
                                                                      {:cipher "payload"})
                               platform/current (fn [] platform-map)
                               platform/write-text! (fn [platform' path text]
                                                      (swap! write-calls conj {:platform platform'
                                                                               :path path
                                                                               :text text})
                                                      nil)
                               opfs/<write-text! (fn [_path _text]
                                                   nil)]
                 (#'sync-crypt/<save-e2ee-password "refresh-token" "password"))
               (p/then (fn [_]
                         (is (= 1 (count @write-calls)))
                         (is (= platform-map (:platform (first @write-calls))))
                         (is (= "e2ee-password" (:path (first @write-calls))))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest ensure-graph-aes-key-uses-platform-kv-adapters-test
  (async done
         (let [fetch-prev js/fetch
               graph-id (str (random-uuid))
               expected-key (str "rtc-encrypted-aes-key###" graph-id)
               platform-map {:runtime :test}
               current-calls (atom 0)
               kv-get-calls (atom [])
               kv-set-calls (atom [])]
           (set! js/fetch
                 (fn [url _opts]
                   (cond
                     (string/includes? url "/e2ee/user-keys")
                     (js/Promise.resolve
                      #js {:ok true
                           :text (fn []
                                   (js/Promise.resolve
                                    "{\"public-key\":\"public-key\",\"encrypted-private-key\":\"encrypted-private-key\"}"))})

                     (string/includes? url (str "/e2ee/graphs/" graph-id "/aes-key"))
                     (js/Promise.resolve
                      #js {:ok true
                           :text (fn []
                                   (js/Promise.resolve
                                    "{\"encrypted-aes-key\":\"remote-encrypted\"}"))})

                     :else
                     (js/Promise.resolve
                      #js {:ok false
                           :status 404
                           :text (fn [] (js/Promise.resolve "{\"message\":\"not-found\"}"))}))))
           (-> (p/with-redefs [sync-crypt/graph-e2ee? (fn [_repo] true)
                               sync-crypt/e2ee-base (fn [] "https://example.com")
                               worker-state/get-id-token (fn [] "token")
                               worker-util/parse-jwt (fn [_] {:sub "user-1"})
                               worker-state/<invoke-main-thread (fn [_type _payload]
                                                                  (p/resolved :exported-private-key))
                               crypt/<import-private-key (fn [_]
                                                           (p/resolved :private-key))
                               crypt/<import-public-key (fn [_]
                                                          (p/resolved :public-key))
                               crypt/<decrypt-aes-key (fn [_private-key encrypted]
                                                        (p/resolved (str "aes:" encrypted)))
                               ldb/read-transit-str (fn [value] value)
                               platform/current (fn []
                                                  (swap! current-calls inc)
                                                  platform-map)
                               platform/kv-get (fn [platform' k]
                                                 (swap! kv-get-calls conj {:platform platform' :key k})
                                                 (p/resolved nil))
                               platform/kv-set! (fn [platform' k value]
                                                  (swap! kv-set-calls conj {:platform platform' :key k :value value})
                                                  (p/resolved nil))
                               idb-keyval/get (fn [_k _store]
                                                (p/resolved nil))
                               idb-keyval/set (fn [_k _v _store]
                                                (p/resolved nil))]
                 (sync-crypt/<ensure-graph-aes-key "repo-1" graph-id))
               (p/then (fn [aes-key]
                         (is (= "aes:remote-encrypted" aes-key))
                         (is (some #(= {:platform platform-map
                                        :key expected-key}
                                       %)
                                   @kv-get-calls))
                         (is (some #(= {:platform platform-map
                                        :key expected-key
                                        :value "remote-encrypted"}
                                       %)
                                   @kv-set-calls))
                         (is (pos? @current-calls))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn []
                            (set! js/fetch fetch-prev)
                            (done)))))))

(deftest fetch-graph-aes-key-for-download-uses-platform-kv-clear-test
  (async done
         (let [fetch-prev js/fetch
               graph-id (str (random-uuid))
               expected-key (str "rtc-encrypted-aes-key###" graph-id)
               platform-map {:runtime :test}
               kv-set-calls (atom [])]
           (set! js/fetch
                 (fn [url _opts]
                   (cond
                     (string/includes? url "/e2ee/user-keys")
                     (js/Promise.resolve
                      #js {:ok true
                           :text (fn []
                                   (js/Promise.resolve
                                    "{\"public-key\":\"public-key\",\"encrypted-private-key\":\"encrypted-private-key\"}"))})

                     (string/includes? url (str "/e2ee/graphs/" graph-id "/aes-key"))
                     (js/Promise.resolve
                      #js {:ok true
                           :text (fn []
                                   (js/Promise.resolve
                                    "{\"encrypted-aes-key\":\"remote-encrypted\"}"))})

                     :else
                     (js/Promise.resolve
                      #js {:ok false
                           :status 404
                           :text (fn [] (js/Promise.resolve "{\"message\":\"not-found\"}"))}))))
           (-> (p/with-redefs [sync-crypt/e2ee-base (fn [] "https://example.com")
                               worker-state/get-id-token (fn [] "token")
                               worker-util/parse-jwt (fn [_] {:sub "user-1"})
                               worker-state/<invoke-main-thread (fn [_type _payload]
                                                                  (p/resolved :exported-private-key))
                               crypt/<import-private-key (fn [_]
                                                           (p/resolved :private-key))
                               crypt/<decrypt-aes-key (fn [_private-key encrypted]
                                                        (p/resolved (str "aes:" encrypted)))
                               ldb/read-transit-str (fn [value] value)
                               platform/current (fn [] platform-map)
                               platform/kv-get (fn [_platform' _k]
                                                 (p/resolved nil))
                               platform/kv-set! (fn [platform' k value]
                                                  (swap! kv-set-calls conj {:platform platform'
                                                                            :key k
                                                                            :value value})
                                                  (p/resolved nil))
                               idb-keyval/del (fn [_k _store]
                                                (throw (ex-info "should not use idb-keyval/del" {})))]
                 (sync-crypt/<fetch-graph-aes-key-for-download graph-id))
               (p/then (fn [aes-key]
                         (is (= "aes:remote-encrypted" aes-key))
                         (is (= [{:platform platform-map :key expected-key :value nil}
                                 {:platform platform-map :key expected-key :value "remote-encrypted"}]
                                (filterv #(= expected-key (:key %)) @kv-set-calls)))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn []
                            (set! js/fetch fetch-prev)
                            (done)))))))

(deftest decrypt-private-key-falls-back-to-config-password-when-main-thread-unavailable-test
  (async done
         (let [old-sync-config @worker-state/*db-sync-config
               old-state @worker-state/*state]
           (reset! worker-state/*db-sync-config {:e2ee-password "headless-password"})
           (swap! worker-state/*state assoc :auth/refresh-token nil)
           (-> (p/with-redefs [ldb/read-transit-str (fn [_] :encrypted-private-key)
                               worker-state/<invoke-main-thread (fn [_qkw _payload]
                                                                  (p/rejected (ex-info "main-thread is not available in db-worker-node" {})))
                               crypt/<decrypt-private-key (fn [password encrypted-private-key]
                                                            (is (= "headless-password" password))
                                                            (is (= :encrypted-private-key encrypted-private-key))
                                                            (p/resolved :private-key))
                               crypt/<import-private-key (fn [_]
                                                           (p/rejected (ex-info "should not import in fallback" {})))]
                 (#'sync-crypt/<decrypt-private-key "encrypted-private-key-str"))
               (p/then (fn [private-key]
                         (is (= :private-key private-key))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn []
                            (reset! worker-state/*db-sync-config old-sync-config)
                            (reset! worker-state/*state old-state)
                            (done)))))))

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
