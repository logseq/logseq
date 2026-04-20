(ns frontend.worker.sync.crypt-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.util :as sync-util]
            [frontend.worker.ui-request :as ui-request]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private decrypt-snapshot-datoms-batch-orig sync-crypt/<decrypt-snapshot-datoms-batch)

(defn- <encrypt-text-for-snapshot
  [aes-key value]
  (p/let [encrypted (crypt/<encrypt-text aes-key (ldb/write-transit-str value))]
    (ldb/write-transit-str encrypted)))

(deftest cli-node-auth-token-reads-state-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :cli}})]
        (is (= "state-token" (sync-util/auth-token))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest cli-node-get-user-uuid-reads-state-token-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :cli}})
                    worker-util/parse-jwt (fn [token]
                                            (if (= token "state-token")
                                              {:sub "state-user-id"}
                                              {}))]
        (is (= "state-user-id" (#'sync-crypt/get-user-uuid))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest desktop-token-path-keeps-id-token-behavior-test
  (let [config-prev @worker-state/*db-sync-config
        state-prev @worker-state/*state]
    (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"})
    (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
    (try
      (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                   :owner-source :electron}})
                    worker-util/parse-jwt (fn [token]
                                            (if (= token "state-token")
                                              {:sub "state-user-id"}
                                              {}))]
        (is (= "state-token" (sync-util/auth-token)))
        (is (= "state-user-id" (#'sync-crypt/get-user-uuid))))
      (finally
        (reset! worker-state/*db-sync-config config-prev)
        (reset! worker-state/*state state-prev)))))

(deftest resolve-user-uuid-falls-back-to-resolved-token-test
  (async done
         (-> (p/with-redefs [sync-crypt/get-user-uuid (fn [] nil)
                             sync-auth/<resolve-ws-token (fn [] (p/resolved "fresh-token"))
                             worker-util/parse-jwt (fn [token]
                                                     (if (= token "fresh-token")
                                                       {:sub "fresh-user-id"}
                                                       {}))]
               (#'sync-crypt/<resolve-user-uuid))
             (p/then (fn [user-id]
                       (is (= "fresh-user-id" user-id))))
             (p/catch (fn [e]
                        (is false (str e))))
             (p/finally done))))

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

(deftest save-e2ee-password-uses-secret-storage-in-browser-runtime-test
  (async done
         (let [platform-map {:env {:runtime :browser}}
               state-prev @worker-state/*state
               secret-calls (atom [])
               file-calls (atom [])
               auth-read-calls (atom [])
               encrypt-calls (atom [])]
           (reset! worker-state/*state (assoc state-prev :auth/refresh-token "refresh-from-state"))
           (-> (p/with-redefs [crypt/<encrypt-text-by-text-password (fn [refresh-token password]
                                                                      (swap! encrypt-calls conj [refresh-token password])
                                                                      {:cipher "payload"})
                               platform/current (fn [] platform-map)
                               platform/read-text! (fn [platform' path]
                                                     (swap! auth-read-calls conj {:platform platform'
                                                                                  :path path})
                                                     (p/resolved "{\"refresh-token\":\"refresh-from-auth-file\"}"))
                               platform/save-secret-text! (fn [platform' key text]
                                                            (swap! secret-calls conj {:platform platform'
                                                                                      :key key
                                                                                      :text text})
                                                            (p/resolved nil))
                               platform/write-text! (fn [platform' path text]
                                                      (swap! file-calls conj {:platform platform'
                                                                              :path path
                                                                              :text text})
                                                      (p/resolved nil))]
                 (#'sync-crypt/<save-e2ee-password "password"))
               (p/then (fn [_]
                         (is (empty? @auth-read-calls))
                         (is (= [["refresh-from-state" "password"]] @encrypt-calls))
                         (is (= 1 (count @secret-calls)))
                         (is (= platform-map (:platform (first @secret-calls))))
                         (is (= "logseq-encrypted-password" (:key (first @secret-calls))))
                         (is (string? (:text (first @secret-calls))))
                         (is (empty? @file-calls))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn []
                            (reset! worker-state/*state state-prev)
                            (done)))))))

(deftest save-e2ee-password-uses-file-storage-in-node-runtime-test
  (async done
         (let [platform-map {:env {:runtime :node
                                   :owner-source :cli}}
               secret-calls (atom [])
               file-calls (atom [])
               auth-read-calls (atom [])
               encrypt-calls (atom [])]
           (-> (p/with-redefs [crypt/<encrypt-text-by-text-password (fn [refresh-token password]
                                                                      (swap! encrypt-calls conj [refresh-token password])
                                                                      {:cipher "payload"})
                               platform/current (fn [] platform-map)
                               platform/read-text! (fn [platform' path]
                                                     (swap! auth-read-calls conj {:platform platform'
                                                                                  :path path})
                                                     (p/resolved "{\"refresh-token\":\"refresh-from-auth-file\"}"))
                               platform/save-secret-text! (fn [platform' key text]
                                                            (swap! secret-calls conj {:platform platform'
                                                                                      :key key
                                                                                      :text text})
                                                            (p/resolved nil))
                               platform/write-text! (fn [platform' path text]
                                                      (swap! file-calls conj {:platform platform'
                                                                              :path path
                                                                              :text text})
                                                      (p/resolved nil))]
                 (#'sync-crypt/<save-e2ee-password "password"))
               (p/then (fn [_]
                         (is (= 1 (count @auth-read-calls)))
                         (is (= "~/logseq/auth.json" (:path (first @auth-read-calls))))
                         (is (= [["refresh-from-auth-file" "password"]] @encrypt-calls))
                         (is (= 1 (count @file-calls)))
                         (is (= platform-map (:platform (first @file-calls))))
                         (is (= "~/logseq/e2ee-password" (:path (first @file-calls))))
                         (is (string? (:text (first @file-calls))))
                         (is (empty? @secret-calls))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest save-e2ee-password-missing-refresh-token-in-auth-file-test
  (async done
         (let [platform-map {:env {:runtime :node
                                   :owner-source :cli}}
               encrypt-calls (atom 0)]
           (-> (p/with-redefs [platform/current (fn [] platform-map)
                               platform/read-text! (fn [_platform' _path]
                                                     (p/resolved "{\"refresh-token\":\"\"}"))
                               crypt/<encrypt-text-by-text-password (fn [_refresh-token _password]
                                                                      (swap! encrypt-calls inc)
                                                                      (p/rejected (ex-info "should-not-encrypt" {})))]
                 (#'sync-crypt/<save-e2ee-password "password"))
               (p/then (fn [_]
                         (is false "expected missing refresh-token failure")))
               (p/catch (fn [e]
                          (is (contains? #{:db-sync/missing-e2ee-password
                                           :missing-e2ee-password}
                                         (or (:code (ex-data e))
                                             (keyword (ex-message e)))))
                          (is (zero? @encrypt-calls))))
               (p/finally done)))))

(deftest read-e2ee-password-uses-secret-storage-in-browser-runtime-test
  (async done
         (let [platform-map {:env {:runtime :browser}}
               secret-calls (atom [])
               file-calls (atom [])]
           (-> (p/with-redefs [platform/current (fn [] platform-map)
                               platform/read-secret-text (fn [platform' key]
                                                           (swap! secret-calls conj {:platform platform'
                                                                                     :key key})
                                                           (p/resolved (ldb/write-transit-str {:cipher "payload"})))
                               platform/read-text! (fn [platform' path]
                                                     (swap! file-calls conj {:platform platform'
                                                                             :path path})
                                                     (p/resolved (ldb/write-transit-str {:cipher "legacy"})))
                               crypt/<decrypt-text-by-text-password (fn [_refresh-token _data]
                                                                      (p/resolved "decrypted-password"))]
                 (#'sync-crypt/<read-e2ee-password "refresh-token"))
               (p/then (fn [password]
                         (is (= "decrypted-password" password))
                         (is (= 1 (count @secret-calls)))
                         (is (= "logseq-encrypted-password" (:key (first @secret-calls))))
                         (is (empty? @file-calls))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest read-e2ee-password-browser-missing-secret-does-not-fallback-to-file-test
  (async done
         (let [platform-map {:env {:runtime :browser}}
               secret-read-calls (atom 0)
               file-read-calls (atom 0)]
           (-> (p/with-redefs [platform/current (fn [] platform-map)
                               platform/read-secret-text (fn [_platform' _key]
                                                           (swap! secret-read-calls inc)
                                                           (p/resolved nil))
                               platform/read-text! (fn [_platform' _path]
                                                     (swap! file-read-calls inc)
                                                     (p/resolved (ldb/write-transit-str {:cipher "legacy"})))
                               crypt/<decrypt-text-by-text-password (fn [_refresh-token _data]
                                                                      (p/rejected (ex-info "should-not-decrypt" {})))]
                 (#'sync-crypt/<read-e2ee-password "refresh-token"))
               (p/then (fn [_]
                         (is false "expected missing e2ee password failure")))
               (p/catch (fn [e]
                          (is (= 1 @secret-read-calls))
                          (is (zero? @file-read-calls))
                          (is (contains? #{:db-sync/missing-e2ee-password
                                           :missing-e2ee-password}
                                         (or (:code (ex-data e))
                                             (keyword (ex-message e)))))))
               (p/finally done)))))

(deftest verify-and-save-e2ee-password-verifies-before-write-test
  (async done
         (let [write-calls (atom [])
               decrypt-calls (atom [])]
           (-> (p/with-redefs [platform/current (fn [] {:env {:runtime :node
                                                              :owner-source :cli}})
                               ldb/read-transit-str (fn [value]
                                                      (if (= value "encrypted-private-key")
                                                        :encrypted-private-key-payload
                                                        value))
                               crypt/<decrypt-private-key (fn [password encrypted-private-key]
                                                            (swap! decrypt-calls conj [password encrypted-private-key])
                                                            (p/resolved :private-key))
                               platform/read-text! (fn [_platform' _path]
                                                     (p/resolved "{\"refresh-token\":\"refresh-token\"}"))
                               crypt/<encrypt-text-by-text-password (fn [_refresh-token _password]
                                                                      {:cipher "password-payload"})
                               platform/write-text! (fn [_platform' path text]
                                                      (swap! write-calls conj {:path path
                                                                               :text text})
                                                      (p/resolved nil))
                               platform/save-secret-text! (fn [& _]
                                                            (p/rejected (ex-info "should not use browser secret store" {})))]
                 (#'sync-crypt/<verify-and-save-e2ee-password! "new-password"
                                                               "encrypted-private-key"))
               (p/then (fn [_]
                         (is (= [["new-password" :encrypted-private-key-payload]] @decrypt-calls))
                         (is (= 1 (count @write-calls)))
                         (is (= "~/logseq/e2ee-password" (:path (first @write-calls))))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally done)))))

(deftest verify-and-save-e2ee-password-invalid-password-does-not-overwrite-test
  (async done
         (let [write-calls (atom 0)]
           (-> (p/with-redefs [platform/current (fn [] {:env {:runtime :node
                                                              :owner-source :cli}})
                               ldb/read-transit-str (fn [_] :encrypted-private-key-payload)
                               crypt/<decrypt-private-key (fn [_password _encrypted-private-key]
                                                            (p/rejected (ex-info "decrypt-private-key" {:code :invalid-password})))
                               platform/write-text! (fn [_platform' _path _text]
                                                      (swap! write-calls inc)
                                                      (p/resolved nil))]
                 (#'sync-crypt/<verify-and-save-e2ee-password! "wrong-password"
                                                               "encrypted-private-key"))
               (p/then (fn [_]
                         (is false "expected verify failure")))
               (p/catch (fn [e]
                          (is (= "decrypt-private-key" (ex-message e)))
                          (is (zero? @write-calls))))
               (p/finally done)))))

(deftest verify-and-save-e2ee-password-invalid-server-user-keys-shape-test
  (async done
         (-> (p/with-redefs [platform/current (fn [] {:env {:runtime :node
                                                            :owner-source :cli}})
                             sync-crypt/e2ee-base (fn [] "https://example.com")
                             sync-crypt/<resolve-user-uuid (fn [] (p/resolved "user-1"))
                             sync-crypt/<get-item (fn [_k] (p/resolved nil))
                             sync-crypt/<fetch-user-rsa-key-pair-raw (fn [_base]
                                                                       (p/resolved :public-key))
                             crypt/<decrypt-private-key (fn [_password _encrypted-private-key]
                                                          (p/rejected (ex-info "should-not-decrypt" {})))]
               (#'sync-crypt/<verify-and-save-e2ee-password-from-server! "password"))
             (p/then (fn [_]
                       (is false "expected missing-field failure")))
             (p/catch (fn [e]
                        (let [data (ex-data e)]
                          (is (contains? #{:db-sync/missing-field :missing-field}
                                         (or (:code data)
                                             (keyword (ex-message e)))))
                          (is (= :encrypted-private-key (:field data)))
                          (is (not= ":public-key is not ISeqable" (ex-message e))))))
             (p/finally done))))

(deftest decrypt-private-key-headless-ignores-config-e2ee-password-test
  (async done
         (let [old-sync-config @worker-state/*db-sync-config
               old-state @worker-state/*state]
           (reset! worker-state/*db-sync-config {:e2ee-password "legacy-config-password"
                                                 :auth-token "legacy-auth-token"})
           (swap! worker-state/*state assoc :auth/refresh-token nil)
           (-> (p/with-redefs [platform/current (fn [] {:env {:runtime :node
                                                              :owner-source :cli}})
                               ldb/read-transit-str (fn [_] :encrypted-private-key)
                               crypt/<decrypt-private-key (fn [_password _encrypted-private-key]
                                                            (p/rejected (ex-info "should-not-use-config-password" {})))
                               ui-request/<request (fn [_action _payload _opts]
                                                     (p/rejected (ex-info "should-not-request-ui-in-headless" {})))]
                 (#'sync-crypt/<decrypt-private-key "encrypted-private-key-str"))
               (p/then (fn [_]
                         (is false "expected missing e2ee password failure")))
               (p/catch (fn [e]
                          (is (contains? #{:db-sync/missing-e2ee-password
                                           :missing-e2ee-password}
                                         (or (:code (ex-data e))
                                             (keyword (ex-message e)))))))
               (p/finally (fn []
                            (reset! worker-state/*db-sync-config old-sync-config)
                            (reset! worker-state/*state old-state)
                            (done)))))))

(deftest decrypt-private-key-browser-fallback-does-not-log-missing-persisted-password-test
  (async done
         (let [old-state @worker-state/*state
               fail-calls (atom [])
               decrypt-calls (atom [])
               save-calls (atom [])]
           (reset! worker-state/*state (assoc old-state :auth/refresh-token "refresh-token"))
           (-> (p/with-redefs [platform/current (fn [] {:env {:runtime :browser}})
                               platform/read-secret-text (fn [_platform' _key]
                                                           (p/resolved nil))
                               platform/read-text! (fn [_platform' _path]
                                                     (p/rejected (ex-info "should-not-read-browser-file" {})))
                               ui-request/<request (fn [_action payload _opts]
                                                     (is (= {:reason :decrypt-user-rsa-private-key} payload))
                                                     (p/resolved {:password "ui-password"}))
                               sync-crypt/fail-missing-e2ee-password! (fn [data]
                                                                       (swap! fail-calls conj data)
                                                                       (throw (ex-info "missing-e2ee-password" data)))
                               ldb/read-transit-str (fn [_] :encrypted-private-key)
                               crypt/<decrypt-private-key (fn [password encrypted-private-key]
                                                            (swap! decrypt-calls conj [password encrypted-private-key])
                                                            (p/resolved :private-key))
                               crypt/<encrypt-text-by-text-password (fn [refresh-token password]
                                                                      (swap! save-calls conj [:encrypt refresh-token password])
                                                                      {:cipher "password-payload"})
                               platform/save-secret-text! (fn [_platform' key text]
                                                            (swap! save-calls conj [:save key text])
                                                            (p/resolved nil))]
                 (#'sync-crypt/<decrypt-private-key "encrypted-private-key-str"))
               (p/then (fn [private-key]
                         (is (= :private-key private-key))
                         (is (= [["ui-password" :encrypted-private-key]] @decrypt-calls))
                         (is (= 2 (count @save-calls)))
                         (is (empty? @fail-calls))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn []
                            (reset! worker-state/*state old-state)
                            (done)))))))

(deftest ensure-graph-aes-key-uses-platform-kv-adapters-test
  (async done
         (let [fetch-prev js/fetch
               state-prev @worker-state/*state
               graph-id (str (random-uuid))
               expected-key (str "rtc-encrypted-aes-key###" graph-id)
               platform-map {:runtime :test}
               current-calls (atom 0)
               kv-get-calls (atom [])
               kv-set-calls (atom [])]
           (reset! worker-state/*state (assoc state-prev :auth/id-token "token"))
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
                               sync-crypt/<decrypt-private-key (fn [_]
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
                            (reset! worker-state/*state state-prev)
                            (done)))))))

(deftest fetch-graph-aes-key-for-download-uses-platform-kv-clear-test
  (async done
         (let [fetch-prev js/fetch
               state-prev @worker-state/*state
               graph-id (str (random-uuid))
               expected-key (str "rtc-encrypted-aes-key###" graph-id)
               platform-map {:runtime :test}
               kv-set-calls (atom [])]
           (reset! worker-state/*state (assoc state-prev :auth/id-token "token"))
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
                               sync-crypt/<decrypt-private-key (fn [_]
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
                                                  (p/resolved nil))]
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
                            (reset! worker-state/*state state-prev)
                            (done)))))))

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

(deftest decrypt-text-value-legacy-plaintext-test
  (async done
         (-> (p/let [aes-key (crypt/<generate-aes-key)
                     plaintext "$$$favorites"
                     encrypted (crypt/<encrypt-uint8array aes-key (.encode (js/TextEncoder.) plaintext))
                     encrypted-str (ldb/write-transit-str encrypted)
                     decrypted (sync-crypt/<decrypt-text-value aes-key encrypted-str)]
               (is (= plaintext decrypted))
               (done))
             (p/catch (fn [e]
                        (is false (str e))
                        (done))))))
