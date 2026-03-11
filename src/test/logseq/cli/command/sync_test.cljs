(ns logseq.cli.command.sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(defn- execute-with-runtime-auth
  [action config]
  (sync-command/execute action (assoc config :auth-token "runtime-token")))

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

  (testing "sync download action keeps progress option and explicit flag"
    (let [default-result (sync-command/build-action :sync-download {} [] "logseq_db_demo")
          explicit-result (sync-command/build-action :sync-download {:progress false} [] "logseq_db_demo")]
      (is (true? (:ok? default-result)))
      (is (= false (get-in default-result [:action :progress-explicit?])))
      (is (true? (:ok? explicit-result)))
      (is (= false (get-in explicit-result [:action :progress])))
      (is (= true (get-in explicit-result [:action :progress-explicit?])))))

  (testing "sync config set requires name and value"
    (let [missing-both (sync-command/build-action :sync-config-set {} [] nil)
          missing-value (sync-command/build-action :sync-config-set {} ["ws-url"] nil)]
      (is (false? (:ok? missing-both)))
      (is (= :invalid-options (get-in missing-both [:error :code])))
      (is (false? (:ok? missing-value)))
      (is (= :invalid-options (get-in missing-value [:error :code])))))

  (testing "sync config rejects auth-token key"
    (let [set-result (sync-command/build-action :sync-config-set {} ["auth-token" "secret"] nil)
          get-result (sync-command/build-action :sync-config-get {} ["auth-token"] nil)
          unset-result (sync-command/build-action :sync-config-unset {} ["auth-token"] nil)]
      (is (false? (:ok? set-result)))
      (is (= :invalid-options (get-in set-result [:error :code])))
      (is (false? (:ok? get-result)))
      (is (= :invalid-options (get-in get-result [:error :code])))
      (is (false? (:ok? unset-result)))
      (is (= :invalid-options (get-in unset-result [:error :code])))))

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
                 (p/let [result (execute-with-runtime-auth {:type :sync-start
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
                 (p/let [result (execute-with-runtime-auth {:type :sync-start
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
               (p/let [result (execute-with-runtime-auth {:type :sync-start
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
                 (p/let [result (execute-with-runtime-auth {:type :sync-start
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
                   (is (= [[{:data-dir "/tmp"}
                            "logseq_db_demo"]]
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-upload
                                                  :repo "logseq_db_demo"}
                                                 {:data-dir "/tmp"})]
                   (is (= [[{:data-dir "/tmp"
                             :auth-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token "runtime-token"
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
               (p/let [result (execute-with-runtime-auth {:type :sync-upload
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-download
                                                  :repo "logseq_db_demo"
                                                  :graph "demo"}
                                                 {:base-url "http://example"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :create-empty-db? true
                             :data-dir "/tmp"
                             :auth-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token "runtime-token"
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 0)))
                   (is (= [:thread-api/db-sync-list-remote-graphs false []]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token "runtime-token"
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

(deftest test-execute-sync-download-uses-long-timeout-only-for-download-invoke
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [cfg method direct-pass? args]
                                                  (swap! invoke-calls conj {:method method
                                                                            :direct-pass? direct-pass?
                                                                            :args args
                                                                            :timeout-ms (:timeout-ms cfg)})
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
                 (p/let [result (execute-with-runtime-auth {:type :sync-download
                                                            :repo "logseq_db_demo"
                                                            :graph "demo"}
                                                           {:base-url "http://example"
                                                            :data-dir "/tmp"
                                                            :timeout-ms 10000})
                         [set-config-before list-remote-graphs set-config-after check-empty-db download]
                         @invoke-calls]
                   (is (= :ok (:status result)))
                   (is (= :thread-api/set-db-sync-config (:method set-config-before)))
                   (is (= :thread-api/db-sync-list-remote-graphs (:method list-remote-graphs)))
                   (is (= :thread-api/set-db-sync-config (:method set-config-after)))
                   (is (= :thread-api/q (:method check-empty-db)))
                   (is (= :thread-api/db-sync-download-graph-by-id (:method download)))
                   (is (= 10000 (:timeout-ms set-config-before)))
                   (is (= 10000 (:timeout-ms list-remote-graphs)))
                   (is (= 10000 (:timeout-ms set-config-after)))
                   (is (= 10000 (:timeout-ms check-empty-db)))
                   (is (= 1800000 (:timeout-ms download)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-progress-mode-behavior
  (async done
         (let [subscribe-calls (atom [])
               close-calls (atom 0)
               printed-lines (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/connect-events! (fn [cfg on-event]
                                                          (swap! subscribe-calls conj {:base-url (:base-url cfg)
                                                                                       :timeout-ms (:timeout-ms cfg)})
                                                          (on-event :rtc-log {:type :rtc.log/download
                                                                              :graph-uuid "remote-graph-id"
                                                                              :message "Preparing graph snapshot download"})
                                                          (on-event :rtc-log {:type :rtc.log/download
                                                                              :graph-uuid "other-graph-id"
                                                                              :message "should be filtered"})
                                                          {:close! (fn []
                                                                     (swap! close-calls inc))})
                               sync-command/print-progress-line! (fn [line]
                                                                   (swap! printed-lines conj line)
                                                                   nil)
                               transport/invoke (fn [_ method _direct-pass? _args]
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress-explicit? false}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"
                                                       :output-format nil})
                         _ (is (= 1 (count @subscribe-calls)))
                         _ (is (= ["Preparing graph snapshot download"] @printed-lines))
                         _ (is (= 1 @close-calls))
                         _ (reset! subscribe-calls [])
                         _ (reset! printed-lines [])
                         _ (reset! close-calls 0)
                         _ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress-explicit? false}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"
                                                       :output-format :json})
                         _ (is (= [] @subscribe-calls))
                         _ (is (= [] @printed-lines))
                         _ (is (= 0 @close-calls))
                         _ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress true
                                                       :progress-explicit? true}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"
                                                       :output-format :json})
                         _ (is (= 1 (count @subscribe-calls)))
                         _ (is (= ["Preparing graph snapshot download"] @printed-lines))
                         _ (is (= 1 @close-calls))
                         _ (reset! subscribe-calls [])
                         _ (reset! printed-lines [])
                         _ (reset! close-calls 0)
                         _ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress false
                                                       :progress-explicit? true}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"
                                                       :output-format nil})]
                   (is (= [] @subscribe-calls))
                   (is (= [] @printed-lines))
                   (is (= 0 @close-calls))))
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-download
                                                  :repo "logseq_db_demo"
                                                  :graph "demo"}
                                                 {:graph "demo"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:graph "demo"
                             :create-empty-db? true
                             :data-dir "/tmp"
                             :auth-token "runtime-token"}
                            "logseq_db_demo"]
                           [{:graph "demo"
                             :create-empty-db? true
                             :data-dir "/tmp"
                             :auth-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token "runtime-token"
                                                                  :e2ee-password nil}]]
                          (nth @invoke-calls 0)))
                   (is (= [:thread-api/db-sync-list-remote-graphs false []]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/set-db-sync-config false [{:ws-url nil
                                                                  :http-base nil
                                                                  :auth-token "runtime-token"
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
                 (p/let [result (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :remote-graph-not-found (get-in result [:error :code])))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token "runtime-token"
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
               (p/let [result (execute-with-runtime-auth {:type :sync-download
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
                 (p/let [result (execute-with-runtime-auth {:type :sync-download
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
               invoke-calls (atom [])
               auth-calls (atom [])]
           (-> (p/with-redefs [cli-auth/resolve-auth-token! (fn [config]
                                                              (swap! auth-calls conj config)
                                                              (p/resolved "resolved-token"))
                               cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved []))]
                 (p/let [_ (sync-command/execute {:type :sync-remote-graphs}
                                                 {:base-url "http://example"
                                                  :http-base "https://sync.example.com"
                                                  :ws-url "wss://sync.example.com/sync/%s"
                                                  :e2ee-password "pw"
                                                  :data-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [{:base-url "http://example"
                            :http-base "https://sync.example.com"
                            :ws-url "wss://sync.example.com/sync/%s"
                            :e2ee-password "pw"
                            :data-dir "/tmp"}]
                          @auth-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url "wss://sync.example.com/sync/%s"
                                                                   :http-base "https://sync.example.com"
                                                                   :auth-token "resolved-token"
                                                                   :e2ee-password "pw"}]]
                           [:thread-api/db-sync-list-remote-graphs false []]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-remote-graphs-missing-auth
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-auth/resolve-auth-token! (fn [_config]
                                                              (p/rejected (ex-info "missing auth"
                                                                                   {:code :missing-auth
                                                                                    :hint "Run logseq login first."})))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved []))]
                 (p/let [result (sync-command/execute {:type :sync-remote-graphs}
                                                      {:base-url "http://example"
                                                       :data-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :missing-auth (get-in result [:error :code])))
                   (is (= "Run logseq login first." (get-in result [:error :context :hint])))
                   (is (= [] @invoke-calls))))
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-ensure-keys}
                                                 {:base-url "http://example"
                                                  :data-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token "runtime-token"
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
                 (p/let [_ (execute-with-runtime-auth {:type :sync-grant-access
                                                  :repo "logseq_db_demo"
                                                  :graph-id "graph-uuid"
                                                  :email "user@example.com"}
                                                 {:data-dir "/tmp"})]
                   (is (= [[{:data-dir "/tmp"
                             :auth-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config false [{:ws-url nil
                                                                   :http-base nil
                                                                   :auth-token "runtime-token"
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
                                                  :config-key :ws-url}
                                                 {:base-url "http://example"
                                                  :ws-url "wss://sync.example.com/sync/%s"
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
                                                  :config-key :ws-url
                                                  :config-value "wss://sync.example.com/sync/%s"}
                                                 {:base-url "http://example"
                                                  :config-path "/tmp/cli.edn"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :config-path "/tmp/cli.edn"
                             :data-dir "/tmp"}
                            {:ws-url "wss://sync.example.com/sync/%s"}]]
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
                                                           (dissoc {:ws-url "wss://old.example/sync/%s"}
                                                                   :ws-url))]
                 (p/let [_ (sync-command/execute {:type :sync-config-unset
                                                  :config-key :ws-url}
                                                 {:base-url "http://example"
                                                  :config-path "/tmp/cli.edn"
                                                  :data-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :config-path "/tmp/cli.edn"
                             :data-dir "/tmp"}
                            {:ws-url nil}]]
                          @update-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))