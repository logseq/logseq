(ns logseq.cli.command.sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.config :as cli-config]
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
         (let [ensure-calls (atom [])
               invoke-calls (atom [])
               status-calls (atom 0)]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-status
                                                    (let [idx (swap! status-calls inc)]
                                                      (p/resolved {:repo "logseq_db_demo"
                                                                   :ws-state (if (= idx 1) :connecting :open)
                                                                   :pending-local 0
                                                                   :pending-asset 0
                                                                   :pending-server 0}))
                                                    (p/resolved {:ok true})))]
                 (p/let [result (sync-command/execute {:type :sync-start
                                                       :repo "logseq_db_demo"}
                                                      {:data-dir "/tmp"})
                         invoked-methods (map first @invoke-calls)]
                   (is (= :ok (:status result)))
                   (is (= :open (get-in result [:data :ws-state])))
                   (is (<= 1 (count @ensure-calls)))
                   (is (every? (fn [[_ repo]] (= "logseq_db_demo" repo)) @ensure-calls))
                   (is (= 1 (count (filter #(= :thread-api/db-sync-start %) invoked-methods))))
                   (is (<= 2 (count (filter #(= :thread-api/db-sync-status %) invoked-methods))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-timeout
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-status
                                                    (p/resolved {:repo "logseq_db_demo"
                                                                 :ws-state :connecting
                                                                 :pending-local 0
                                                                 :pending-asset 0
                                                                 :pending-server 0})
                                                    (p/resolved {:ok true})))]
                 (p/let [result (sync-command/execute {:type :sync-start
                                                       :repo "logseq_db_demo"
                                                       :wait-timeout-ms 20
                                                       :wait-poll-interval-ms 0}
                                                      {:data-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :sync-start-timeout (get-in result [:error :code])))
                   (is (= "logseq_db_demo" (get-in result [:error :repo])))
                   (is (= :connecting (get-in result [:error :ws-state])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-missing-ws-url-is-error
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _direct-pass? _args]
                                                (case method
                                                  :thread-api/db-sync-status
                                                  (p/resolved {:repo "logseq_db_demo"
                                                               :ws-state :inactive
                                                               :pending-local 0
                                                               :pending-asset 0
                                                               :pending-server 0})
                                                  (p/resolved {:ok true})))]
               (p/let [result (sync-command/execute {:type :sync-start
                                                     :repo "logseq_db_demo"
                                                     :wait-timeout-ms 20
                                                     :wait-poll-interval-ms 0}
                                                    {:data-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :sync-start-skipped (get-in result [:error :code])))
                 (is (= :inactive (get-in result [:error :ws-state])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-start-runtime-error-after-open
  (async done
         (let [status-calls (atom 0)]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method _direct-pass? _args]
                                                  (case method
                                                    :thread-api/db-sync-status
                                                    (let [idx (swap! status-calls inc)]
                                                      (p/resolved (if (= idx 1)
                                                                    {:repo "logseq_db_demo"
                                                                     :ws-state :connecting
                                                                     :pending-local 0
                                                                     :pending-asset 0
                                                                     :pending-server 0}
                                                                    {:repo "logseq_db_demo"
                                                                     :ws-state :open
                                                                     :pending-local 1
                                                                     :pending-asset 0
                                                                     :pending-server 2
                                                                     :last-error {:code :decrypt-aes-key
                                                                                  :message "decrypt-aes-key"}})))
                                                    (p/resolved {:ok true})))]
                 (p/let [result (sync-command/execute {:type :sync-start
                                                       :repo "logseq_db_demo"
                                                       :wait-timeout-ms 200
                                                       :wait-poll-interval-ms 0}
                                                      {:data-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :sync-start-runtime-error (get-in result [:error :code])))
                   (is (= :decrypt-aes-key (get-in result [:error :last-error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-stop
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-stop
                                                  :repo "logseq_db_demo"}
                                                 {:data-dir "/tmp"})]
                   (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token nil
                                                                   :e2ee-password nil}]]
                           [:thread-api/db-sync-stop false []]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-upload
                                                  :repo "logseq_db_demo"}
                                                 {:data-dir "/tmp"})]
                   (is (= [[{:data-dir "/tmp"} "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token nil
                                                                   :e2ee-password nil}]]
                           [:thread-api/db-sync-upload-graph false ["logseq_db_demo"]]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload-propagates-worker-error
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _direct-pass? _args]
                                                (case method
                                                  :thread-api/set-db-sync-config
                                                  (p/resolved nil)

                                                  :thread-api/db-sync-upload-graph
                                                  (p/rejected (ex-info "snapshot upload failed"
                                                                       {:code :snapshot-upload-failed
                                                                        :status 500
                                                                        :graph-id "graph-1"}))

                                                  (p/resolved nil)))]
               (p/let [result (sync-command/execute {:type :sync-upload
                                                     :repo "logseq_db_demo"}
                                                    {:data-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :snapshot-upload-failed (get-in result [:error :code])))
                 (is (= 500 (get-in result [:error :context :status])))
                 (is (= "graph-1" (get-in result [:error :context :graph-id])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-download
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])
                                                    :thread-api/q
                                                    (p/resolved 0)
                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})
                                                    (p/resolved nil)))]
                 (p/let [_ (sync-command/execute {:type :sync-download
                                                  :repo "logseq_db_demo"
                                                  :graph "demo"}
                                                 {:base-url "http://example"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :create-empty-db? true
                             :data-dir "/tmp"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token nil
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 0)))
                   (is (= [:thread-api/db-sync-list-remote-graphs false []]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token nil
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 2)))
                   (let [[method direct-pass? args] (nth @invoke-calls 3)]
                     (is (= :thread-api/q method))
                     (is (= false direct-pass?))
                     (is (= "logseq_db_demo" (first args))))
                   (is (= [:thread-api/db-sync-download-graph-by-id false ["logseq_db_demo" "remote-graph-id" true]]
                          (nth @invoke-calls 4)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-uses-graph-config-when-base-url-missing
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? false}])
                                                    :thread-api/q
                                                    (p/resolved 0)
                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})
                                                    (p/resolved nil)))]
                 (p/let [_ (sync-command/execute {:type :sync-download
                                                  :repo "logseq_db_demo"
                                                  :graph "demo"}
                                                 {:graph "demo"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:graph "demo"
                             :create-empty-db? true
                             :data-dir "/tmp"}
                            "logseq_db_demo"]
                           [{:graph "demo"
                             :create-empty-db? true
                             :data-dir "/tmp"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token nil
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 0)))
                   (is (= [:thread-api/db-sync-list-remote-graphs false []]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token nil
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 2)))
                   (let [[method direct-pass? args] (nth @invoke-calls 3)]
                     (is (= :thread-api/q method))
                     (is (= false direct-pass?))
                     (is (= "logseq_db_demo" (first args))))
                   (is (= [:thread-api/db-sync-download-graph-by-id false ["logseq_db_demo" "remote-graph-id" false]]
                          (nth @invoke-calls 4)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-remote-graph-not-found
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "other-id"
                                                                  :graph-name "other-graph"}])
                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})
                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
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
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-propagates-worker-error-code
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _direct-pass? _args]
                                                (case method
                                                  :thread-api/db-sync-list-remote-graphs
                                                  (p/resolved [{:graph-id "remote-graph-id"
                                                                :graph-name "demo"
                                                                :graph-e2ee? true}])
                                                  :thread-api/q
                                                  (p/resolved 0)
                                                  :thread-api/db-sync-download-graph-by-id
                                                  (p/rejected (ex-info "db-sync/incomplete-snapshot-frame"
                                                                       {:code :db-sync/incomplete-snapshot-frame
                                                                        :graph-id "remote-graph-id"}))
                                                  (p/resolved nil)))]
               (p/let [result (sync-command/execute {:type :sync-download
                                                     :repo "logseq_db_demo"
                                                     :graph "demo"}
                                                    {:base-url "http://example"
                                                     :data-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :db-sync/incomplete-snapshot-frame (get-in result [:error :code])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-download-fails-fast-when-db-is-not-empty
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (p/resolved (assoc config
                                                                              :repo repo
                                                                              :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])
                                                    :thread-api/q
                                                    (p/resolved 2)
                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})
                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:data-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :graph-db-not-empty (get-in result [:error :code])))
                   (is (= "logseq_db_demo" (get-in result [:error :repo])))
                   (is (= 2 (get-in result [:error :context :non-empty-entity-count])))
                   (is (not-any? (fn [[method _ _]]
                                   (= :thread-api/db-sync-download-graph-by-id method))
                                 @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-remote-graphs
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved []))]
                 (p/let [_ (sync-command/execute {:type :sync-remote-graphs}
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
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-ensure-keys
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-ensure-keys}
                                                 {:base-url "http://example"
                                                  :data-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token nil
                                                                   :e2ee-password nil}]]
                           [:thread-api/db-sync-ensure-user-rsa-keys false []]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-grant-access
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-grant-access
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
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-config-get
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-config-get
                                                  :config-key :auth-token}
                                                 {:base-url "http://example"
                                                  :auth-token "abc"
                                                  :data-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-config-set
  (async done
         (let [invoke-calls (atom [])
               update-calls (atom [])]
           (-> (p/with-redefs [transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved nil))
                               cli-config/update-config! (fn [config updates]
                                                           (swap! update-calls conj [config updates])
                                                           (merge {:ws-url "wss://old.example/sync/%s"} updates))]
                 (p/let [_ (sync-command/execute {:type :sync-config-set
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
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-config-unset
  (async done
         (let [invoke-calls (atom [])
               update-calls (atom [])]
           (-> (p/with-redefs [transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved nil))
                               cli-config/update-config! (fn [config updates]
                                                           (swap! update-calls conj [config updates])
                                                           (dissoc {:ws-url "wss://old.example/sync/%s"
                                                                    :auth-token "token-value"}
                                                                   :auth-token))]
                 (p/let [_ (sync-command/execute {:type :sync-config-unset
                                                  :config-key :auth-token}
                                                 {:base-url "http://example"
                                                  :config-path "/tmp/cli.edn"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :config-path "/tmp/cli.edn"
                             :data-dir "/tmp"}
                            {:auth-token nil}]]
                          @update-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))