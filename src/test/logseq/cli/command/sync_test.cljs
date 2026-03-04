(ns logseq.cli.command.sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.config :as cli-config]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-build-action-validation
  (testing "sync status requires repo"
    (let [result (sync-command/build-action :sync-status {} [] nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "sync download requires repo"
    (let [result (sync-command/build-action :sync-download {} [] nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "sync download action requires missing local graph"
    (let [result (sync-command/build-action :sync-download {} [] "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (true? (get-in result [:action :allow-missing-graph])))
      (is (true? (get-in result [:action :require-missing-graph])))))

  (testing "sync config set requires name and value"
    (let [missing-both (sync-command/build-action :sync-config-set {} [] nil)
          missing-value (sync-command/build-action :sync-config-set {} ["auth-token"] nil)]
      (is (false? (:ok? missing-both)))
      (is (= :invalid-options (get-in missing-both [:error :code])))
      (is (false? (:ok? missing-value)))
      (is (= :invalid-options (get-in missing-value [:error :code])))))

  (testing "sync config accepts e2ee-password key"
    (let [result (sync-command/build-action :sync-config-set {} ["e2ee-password" "pw"] nil)]
      (is (true? (:ok? result)))
      (is (= :e2ee-password (get-in result [:action :config-key])))))

  (testing "sync grant-access requires graph-id and email"
    (let [missing-graph-id (sync-command/build-action :sync-grant-access {:email "user@example.com"} [] "logseq_db_demo")
          missing-email (sync-command/build-action :sync-grant-access {:graph-id "123"} [] "logseq_db_demo")]
      (is (false? (:ok? missing-graph-id)))
      (is (= :invalid-options (get-in missing-graph-id [:error :code])))
      (is (false? (:ok? missing-email)))
      (is (= :invalid-options (get-in missing-email [:error :code]))))))

(deftest test-execute-sync-start
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-start
                                           :repo "logseq_db_demo"}
                                          {:data-dir "/tmp"})]
            (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-start false ["logseq_db_demo"]]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-stop
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-stop
                                           :repo "logseq_db_demo"}
                                          {:data-dir "/tmp"})]
            (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-stop false []]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-upload
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-upload
                                           :repo "logseq_db_demo"}
                                          {:data-dir "/tmp"})]
            (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-upload-graph false ["logseq_db_demo"]]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-download
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (case method
                                 :thread-api/db-sync-list-remote-graphs
                                 (p/resolved [{:graph-id "remote-graph-id"
                                               :graph-name "demo"
                                               :graph-e2ee? true}])
                                 :thread-api/db-sync-download-graph-by-id
                                 (p/resolved {:ok true})
                                 (p/resolved nil))))
      (-> (p/let [_ (sync-command/execute {:type :sync-download
                                           :repo "logseq_db_demo"
                                           :graph "demo"}
                                          {:base-url "http://example"
                                           :data-dir "/tmp"})]
            (is (= [[{:base-url "http://example"
                      :data-dir "/tmp"}
                     "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-list-remote-graphs false []]
                    [:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-download-graph-by-id false ["logseq_db_demo" "remote-graph-id" true]]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-download-uses-graph-config-when-base-url-missing
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (case method
                                 :thread-api/db-sync-list-remote-graphs
                                 (p/resolved [{:graph-id "remote-graph-id"
                                               :graph-name "demo"
                                               :graph-e2ee? false}])
                                 :thread-api/db-sync-download-graph-by-id
                                 (p/resolved {:ok true})
                                 (p/resolved nil))))
      (-> (p/let [_ (sync-command/execute {:type :sync-download
                                           :repo "logseq_db_demo"
                                           :graph "demo"}
                                          {:graph "demo"
                                           :data-dir "/tmp"})]
            (is (= [[{:graph "demo"
                      :data-dir "/tmp"}
                     "logseq_db_demo"]
                    [{:graph "demo"
                      :data-dir "/tmp"}
                     "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-list-remote-graphs false []]
                    [:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-download-graph-by-id false ["logseq_db_demo" "remote-graph-id" false]]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-download-remote-graph-not-found
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config _repo]
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (case method
                                 :thread-api/db-sync-list-remote-graphs
                                 (p/resolved [{:graph-id "other-id"
                                               :graph-name "other-graph"}])
                                 :thread-api/db-sync-download-graph-by-id
                                 (p/resolved {:ok true})
                                 (p/resolved nil))))
      (-> (p/let [result (sync-command/execute {:type :sync-download
                                                :repo "logseq_db_demo"
                                                :graph "demo"}
                                               {:base-url "http://example"
                                                :data-dir "/tmp"})]
            (is (= :error (:status result)))
            (is (= :remote-graph-not-found (get-in result [:error :code])))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-list-remote-graphs false []]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-remote-graphs
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved [])))
      (-> (p/let [_ (sync-command/execute {:type :sync-remote-graphs}
                                          {:base-url "http://example"
                                           :http-base "https://sync.example.com"
                                           :ws-url "wss://sync.example.com/sync/%s"
                                           :auth-token "test-token"
                                           :e2ee-password "pw"
                                           :data-dir "/tmp"})]
            (is (= [] @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url "wss://sync.example.com/sync/%s"
                                                            :http-base "https://sync.example.com"
                                                            :auth-token "test-token"
                                                            :e2ee-password "pw"}]]
                    [:thread-api/db-sync-list-remote-graphs false []]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-ensure-keys
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-ensure-keys}
                                          {:base-url "http://example"
                                           :data-dir "/tmp"})]
            (is (= [] @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-ensure-user-rsa-keys false []]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-grant-access
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-grant-access
                                           :repo "logseq_db_demo"
                                           :graph-id "graph-uuid"
                                           :email "user@example.com"}
                                          {:data-dir "/tmp"})]
            (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                   @ensure-calls))
            (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                            :http-base nil
                                                            :auth-token nil
                                                            :e2ee-password nil}]]
                    [:thread-api/db-sync-grant-graph-access false ["logseq_db_demo" "graph-uuid" "user@example.com"]]]
                   @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-config-get
  (async done
    (let [orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          ensure-calls (atom [])
          invoke-calls (atom [])]
      (set! cli-server/ensure-server! (fn [config repo]
                                        (swap! ensure-calls conj [config repo])
                                        (p/resolved (assoc config :base-url "http://example"))))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved {:ok true})))
      (-> (p/let [_ (sync-command/execute {:type :sync-config-get
                                           :config-key :auth-token}
                                          {:base-url "http://example"
                                           :auth-token "abc"
                                           :data-dir "/tmp"})]
            (is (= [] @ensure-calls))
            (is (= [] @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (done)))))))

(deftest test-execute-sync-config-set
  (async done
    (let [orig-invoke transport/invoke
          orig-update-config! cli-config/update-config!
          invoke-calls (atom [])
          update-calls (atom [])]
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved nil))
      )
      (set! cli-config/update-config! (fn [config updates]
                                        (swap! update-calls conj [config updates])
                                        (merge {:ws-url "wss://old.example/sync/%s"} updates)))
      (-> (p/let [_ (sync-command/execute {:type :sync-config-set
                                           :config-key :auth-token
                                           :config-value "token-value"}
                                          {:base-url "http://example"
                                           :config-path "/tmp/cli.edn"
                                           :data-dir "/tmp"})]
            (is (= [[{:base-url "http://example"
                      :config-path "/tmp/cli.edn"
                      :data-dir "/tmp"}
                     {:auth-token "token-value"}]]
                   @update-calls))
            (is (= [] @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! transport/invoke orig-invoke)
                       (set! cli-config/update-config! orig-update-config!)
                       (done)))))))

(deftest test-execute-sync-config-unset
  (async done
    (let [orig-invoke transport/invoke
          orig-update-config! cli-config/update-config!
          invoke-calls (atom [])
          update-calls (atom [])]
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (p/resolved nil)))
      (set! cli-config/update-config! (fn [config updates]
                                        (swap! update-calls conj [config updates])
                                        (dissoc {:ws-url "wss://old.example/sync/%s"
                                                 :auth-token "token-value"}
                                                :auth-token)))
      (-> (p/let [_ (sync-command/execute {:type :sync-config-unset
                                           :config-key :auth-token}
                                          {:base-url "http://example"
                                           :config-path "/tmp/cli.edn"
                                           :data-dir "/tmp"})]
            (is (= [[{:base-url "http://example"
                      :config-path "/tmp/cli.edn"
                      :data-dir "/tmp"}
                     {:auth-token nil}]]
                   @update-calls))
            (is (= [] @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! transport/invoke orig-invoke)
                       (set! cli-config/update-config! orig-update-config!)
                       (done)))))))
