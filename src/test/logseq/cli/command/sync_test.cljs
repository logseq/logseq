(ns logseq.cli.command.sync-test
  (:require ["crypto" :as crypto]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.common :as cli-common]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(defn- execute-with-runtime-auth
  [action config]
  (sync-command/execute action (assoc config :id-token "runtime-token")))

(def ^:private sync-asset-repo "logseq_db_demo")
(def ^:private sync-asset-uuid "11111111-1111-1111-1111-111111111111")
(def ^:private sync-asset-type "txt")

(defn- temp-root-dir
  []
  (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-sync-asset-test-")))

(defn- remove-dir!
  [path]
  (when (and (seq path) (fs/existsSync path))
    (fs/rmSync path #js {:recursive true :force true})))

(defn- sha256
  [payload]
  (-> (.createHash crypto "sha256")
      (.update payload)
      (.digest "hex")))

(defn- graph-assets-dir
  [root-dir repo]
  (node-path/join (cli-server/graphs-dir {:root-dir root-dir})
                  (graph-dir/repo->encoded-graph-dir-name repo)
                  "assets"))

(defn- write-local-asset!
  [root-dir repo asset-uuid asset-type payload]
  (let [assets-dir (graph-assets-dir root-dir repo)
        asset-path (node-path/join assets-dir (str asset-uuid "." asset-type))]
    (fs/mkdirSync assets-dir #js {:recursive true})
    (fs/writeFileSync asset-path payload)
    asset-path))

(defn- remote-asset
  [checksum]
  {:db/id 123
   :block/uuid sync-asset-uuid
   :block/tags [{:db/ident :logseq.class/Asset}]
   :logseq.property.asset/type sync-asset-type
   :logseq.property.asset/checksum checksum
   :logseq.property.asset/remote-metadata {:checksum checksum
                                           :type sync-asset-type}})

(defn- active-sync-status
  []
  {:repo sync-asset-repo
   :graph-id "graph-id"
   :ws-state :open
   :pending-local 0
   :pending-asset 0
   :pending-server 0})

(defn- sync-asset-download-action
  []
  {:type :sync-asset-download
   :repo sync-asset-repo
   :graph "demo"
   :id 123})

(defn- run-sync-asset-download-scenario
  [{:keys [asset status local-payload action config]
    :or {status (active-sync-status)
         action (sync-asset-download-action)}}]
  (let [root-dir (temp-root-dir)
        calls (atom [])
        config' (merge {:root-dir root-dir
                        :http-base "https://api.logseq.io"}
                       config)]
    (when (some? local-payload)
      (write-local-asset! root-dir
                          (:repo action)
                          (or (:block/uuid asset) sync-asset-uuid)
                          (or (:logseq.property.asset/type asset) sync-asset-type)
                          local-payload))
    (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                    (swap! calls conj [:ensure-server repo])
                                                    (p/resolved (assoc config :base-url "http://example")))
                        transport/invoke (fn [_ method args]
                                           (swap! calls conj [method args])
                                           (case method
                                             :thread-api/pull
                                             (p/resolved asset)

                                             :thread-api/db-sync-status
                                             (p/resolved status)

                                             :thread-api/db-sync-request-asset-download
                                             (p/resolved nil)

                                             (p/resolved nil)))]
          (p/let [result (execute-with-runtime-auth action config')]
            {:result result
             :calls @calls}))
        (p/finally (fn []
                     (remove-dir! root-dir))))))

(defn- called-method?
  [calls method]
  (boolean (some #(= method (first %)) calls)))

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

  (testing "sync config rejects e2ee-password key"
    (let [set-result (sync-command/build-action :sync-config-set {} ["e2ee-password" "pw"] nil)
          get-result (sync-command/build-action :sync-config-get {} ["e2ee-password"] nil)
          unset-result (sync-command/build-action :sync-config-unset {} ["e2ee-password"] nil)]
      (is (false? (:ok? set-result)))
      (is (= :invalid-options (get-in set-result [:error :code])))
      (is (false? (:ok? get-result)))
      (is (= :invalid-options (get-in get-result [:error :code])))
      (is (false? (:ok? unset-result)))
      (is (= :invalid-options (get-in unset-result [:error :code])))))

  (testing "sync start, upload, download and ensure-keys actions carry e2ee-password option"
    (let [start-result (sync-command/build-action :sync-start {:e2ee-password "pw"} [] "logseq_db_demo")
          upload-result (sync-command/build-action :sync-upload {:e2ee-password "pw"} [] "logseq_db_demo")
          download-result (sync-command/build-action :sync-download {:e2ee-password "pw"} [] "logseq_db_demo")
          ensure-keys-result (sync-command/build-action :sync-ensure-keys {:e2ee-password "pw"
                                                                            :upload-keys true} [] nil)]
      (is (true? (:ok? start-result)))
      (is (= "pw" (get-in start-result [:action :e2ee-password])))
      (is (true? (:ok? upload-result)))
      (is (= "pw" (get-in upload-result [:action :e2ee-password])))
      (is (true? (:ok? download-result)))
      (is (= "pw" (get-in download-result [:action :e2ee-password])))
      (is (true? (:ok? ensure-keys-result)))
      (is (= "pw" (get-in ensure-keys-result [:action :e2ee-password])))
      (is (= true (get-in ensure-keys-result [:action :upload-keys])))))

  (testing "sync grant-access requires graph-id and email"
    (let [missing-graph-id (sync-command/build-action :sync-grant-access {:email "user@example.com"} [] "logseq_db_demo")
          missing-email (sync-command/build-action :sync-grant-access {:graph-id "123"} [] "logseq_db_demo")]
      (is (false? (:ok? missing-graph-id)))
      (is (= :invalid-options (get-in missing-graph-id [:error :code])))
      (is (false? (:ok? missing-email)))
      (is (= :invalid-options (get-in missing-email [:error :code]))))))

(deftest test-build-sync-asset-download-action-validation
  (testing "sync asset download builds action with db id selector"
    (let [result (sync-command/build-action :sync-asset-download {:id 123} [] "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :sync-asset-download
              :repo "logseq_db_demo"
              :graph "demo"
              :id 123}
             (:action result)))))

  (testing "sync asset download builds action with uuid selector"
    (let [result (sync-command/build-action :sync-asset-download {:uuid sync-asset-uuid} [] "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :sync-asset-download
              :repo "logseq_db_demo"
              :graph "demo"
              :uuid sync-asset-uuid}
             (:action result)))))

  (testing "sync asset download requires repo"
    (let [result (sync-command/build-action :sync-asset-download {:id 123} [] nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "sync asset download requires one selector"
    (let [result (sync-command/build-action :sync-asset-download {} [] "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "sync asset download rejects conflicting selectors"
    (let [result (sync-command/build-action :sync-asset-download {:id 123
                                                                  :uuid sync-asset-uuid}
                                            []
                                            "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-execute-sync-asset-download-uses-uuid-lookup-value
  (async done
         (let [checksum (sha256 "remote asset payload")
               action {:type :sync-asset-download
                       :repo sync-asset-repo
                       :graph "demo"
                       :uuid sync-asset-uuid}]
           (-> (run-sync-asset-download-scenario {:asset (remote-asset checksum)
                                                  :action action})
               (p/then (fn [{:keys [calls]}]
                         (is (some #(and (= :thread-api/pull (first %))
                                         (= [:block/uuid (uuid sync-asset-uuid)]
                                            (get-in % [1 2])))
                                   calls))
                         (is (some #(= [:thread-api/db-sync-request-asset-download
                                        [sync-asset-repo sync-asset-uuid]]
                                      %)
                                   calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-asset-download-requests-missing-local-file
  (async done
         (let [checksum (sha256 "remote asset payload")]
           (-> (run-sync-asset-download-scenario {:asset (remote-asset checksum)})
               (p/then (fn [{:keys [result calls]}]
                         (is (= :ok (:status result)))
                         (is (= {:asset-id 123
                                 :asset-uuid sync-asset-uuid
                                 :asset-type sync-asset-type
                                 :download-requested? true
                                 :checksum-status :missing}
                                (:data result)))
                         (is (called-method? calls :thread-api/sync-app-state))
                         (is (called-method? calls :thread-api/set-db-sync-config))
                         (is (called-method? calls :thread-api/pull))
                         (is (called-method? calls :thread-api/db-sync-status))
                         (is (some #(= [:thread-api/db-sync-request-asset-download
                                        [sync-asset-repo sync-asset-uuid]]
                                      %)
                                   calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-asset-download-skips-matching-local-file
  (async done
         (let [payload "local asset payload"
               checksum (sha256 payload)]
           (-> (run-sync-asset-download-scenario {:asset (remote-asset checksum)
                                                  :local-payload payload})
               (p/then (fn [{:keys [result calls]}]
                         (is (= :ok (:status result)))
                         (is (= {:asset-id 123
                                 :asset-uuid sync-asset-uuid
                                 :asset-type sync-asset-type
                                 :download-requested? false
                                 :checksum-status :match
                                 :skipped-reason :already-downloaded}
                                (:data result)))
                         (is (not (contains? (:data result) :local-path)))
                         (is (not (called-method? calls :thread-api/db-sync-request-asset-download)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-asset-download-requests-mismatched-local-file
  (async done
         (let [checksum (sha256 "remote asset payload")]
           (-> (run-sync-asset-download-scenario {:asset (remote-asset checksum)
                                                  :local-payload "corrupted local payload"})
               (p/then (fn [{:keys [result calls]}]
                         (is (= :ok (:status result)))
                         (is (= 123 (get-in result [:data :asset-id])))
                         (is (= sync-asset-uuid (get-in result [:data :asset-uuid])))
                         (is (= sync-asset-type (get-in result [:data :asset-type])))
                         (is (= true (get-in result [:data :download-requested?])))
                         (is (= :mismatch (get-in result [:data :checksum-status])))
                         (let [hint (get-in result [:data :hint])]
                           (is (string? hint))
                           (is (boolean (when (string? hint)
                                          (re-find #"checksum" hint)))))
                         (is (not (contains? (:data result) :local-path)))
                         (is (some #(= [:thread-api/db-sync-request-asset-download
                                        [sync-asset-repo sync-asset-uuid]]
                                      %)
                                   calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-asset-download-requires-active-sync
  (async done
         (let [checksum (sha256 "remote asset payload")]
           (-> (run-sync-asset-download-scenario {:asset (remote-asset checksum)
                                                  :status {:repo sync-asset-repo
                                                           :graph-id "graph-id"
                                                           :ws-state :stopped}})
               (p/then (fn [{:keys [result calls]}]
                         (is (= :error (:status result)))
                         (is (= :sync-not-started (get-in result [:error :code])))
                         (is (= "Run logseq sync start --graph demo first."
                                (get-in result [:error :hint])))
                         (is (not (called-method? calls :thread-api/db-sync-request-asset-download)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-asset-download-validates-asset-metadata
  (async done
         (let [checksum (sha256 "remote asset payload")
               base-asset (remote-asset checksum)
               cases [{:label "missing asset"
                       :asset nil
                       :code :asset-not-found}
                      {:label "non asset"
                       :asset (assoc base-asset :block/tags [])
                       :code :not-asset}
                      {:label "missing uuid"
                       :asset (dissoc base-asset :block/uuid)
                       :code :asset-uuid-missing}
                      {:label "missing type"
                       :asset (dissoc base-asset :logseq.property.asset/type)
                       :code :asset-type-missing}
                      {:label "missing checksum"
                       :asset (dissoc base-asset :logseq.property.asset/checksum)
                       :code :asset-checksum-missing}
                      {:label "missing remote metadata"
                       :asset (dissoc base-asset :logseq.property.asset/remote-metadata)
                       :code :asset-not-remote}
                      {:label "external asset"
                       :asset (assoc base-asset :logseq.property.asset/external-url "https://example.com/a.txt")
                       :code :external-asset}]]
           (-> (reduce (fn [chain {:keys [label asset code]}]
                         (p/then chain
                                 (fn []
                                   (p/let [{:keys [result calls]} (run-sync-asset-download-scenario {:asset asset})]
                                     (is (= :error (:status result)) label)
                                     (is (= code (get-in result [:error :code])) label)
                                     (is (not (called-method? calls :thread-api/db-sync-request-asset-download)) label)))))
                       (p/resolved nil)
                       cases)
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])
               status-calls (atom 0)]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                      {:root-dir "/tmp"})
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

(deftest test-execute-sync-start-uses-default-ws-url-when-config-missing
  (async done
         (let [invoke-calls (atom [])
               worker-sync-config (atom {:ws-url nil})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/set-db-sync-config
                                                    (let [cfg (first args)]
                                                      (reset! worker-sync-config cfg)
                                                      (p/resolved nil))

                                                    :thread-api/db-sync-start
                                                    (p/resolved nil)

                                                    :thread-api/db-sync-status
                                                    (p/resolved {:repo "logseq_db_demo"
                                                                 :ws-state (if (seq (:ws-url @worker-sync-config)) :open :stopped)
                                                                 :pending-local 0
                                                                 :pending-asset 0
                                                                 :pending-server 0})

                                                    (p/resolved {:ok true})))]
                 (p/let [result (execute-with-runtime-auth {:type :sync-start
                                                            :repo "logseq_db_demo"
                                                            :wait-timeout-ms 20
                                                            :wait-poll-interval-ms 0}
                                                           {:root-dir "/tmp"})
                         set-config-calls (filter #(= :thread-api/set-db-sync-config (first %)) @invoke-calls)]
                   (is (= :ok (:status result)))
                   (is (seq set-config-calls))
                   (is (every? #(= "wss://api.logseq.io/sync/%s"
                                   (get-in % [1 0 :ws-url]))
                               set-config-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-verifies-and-persists-e2ee-password-when-provided
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/get-db-sync-config (p/resolved {:auth-token "worker-token"})
                                                    :thread-api/q (p/resolved true)
                                                    :thread-api/verify-and-save-e2ee-password (p/resolved nil)
                                                    :thread-api/db-sync-status (p/resolved {:repo "logseq_db_demo"
                                                                                            :ws-state :open
                                                                                            :pending-local 0
                                                                                            :pending-asset 0
                                                                                            :pending-server 0})
                                                    (p/resolved {:ok true})))]
                 (p/let [result (sync-command/execute {:type :sync-start
                                                       :repo "logseq_db_demo"
                                                       :e2ee-password "pw"
                                                       :wait-timeout-ms 50
                                                       :wait-poll-interval-ms 0}
                                                      {:root-dir "/tmp"
                                                       :refresh-token "refresh-token"
                                                       :id-token "runtime-token"})]
                   (is (= :ok (:status result)))
                   (is (some #(= [:thread-api/verify-and-save-e2ee-password ["refresh-token" "pw"]]
                                 %)
                             @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-timeout
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                      {:root-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :sync-start-timeout (get-in result [:error :code])))
                   (is (= "logseq_db_demo" (get-in result [:error :repo])))
                   (is (= :connecting (get-in result [:error :ws-state])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-retries-transient-stopped-state
  (async done
         (let [status-calls (atom 0)
               start-calls (atom 0)]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method _args]
                                                  (case method
                                                    :thread-api/db-sync-start
                                                    (do
                                                      (swap! start-calls inc)
                                                      (p/resolved nil))

                                                    :thread-api/db-sync-status
                                                    (let [idx (swap! status-calls inc)]
                                                      (p/resolved (if (= idx 1)
                                                                    {:repo "logseq_db_demo"
                                                                     :graph-id "graph-uuid"
                                                                     :ws-state :stopped
                                                                     :pending-local 0
                                                                     :pending-asset 0
                                                                     :pending-server 0}
                                                                    {:repo "logseq_db_demo"
                                                                     :graph-id "graph-uuid"
                                                                     :ws-state :open
                                                                     :pending-local 0
                                                                     :pending-asset 0
                                                                     :pending-server 0})))
                                                    (p/resolved {:ok true})))]
                 (p/let [result (execute-with-runtime-auth {:type :sync-start
                                                            :repo "logseq_db_demo"
                                                            :wait-timeout-ms 200
                                                            :wait-poll-interval-ms 0}
                                                           {:root-dir "/tmp"})]
                   (is (= :ok (:status result)))
                   (is (= :open (get-in result [:data :ws-state])))
                   (is (= 2 @status-calls))
                   (is (= 2 @start-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-missing-ws-url-is-error
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [result (sync-command/execute {:type :sync-start
                                                       :repo "logseq_db_demo"}
                                                      {:root-dir "/tmp"
                                                       :ws-url ""
                                                       :id-token "runtime-token"})]
                   (is (= :error (:status result)))
                   (is (= :missing-sync-config (get-in result [:error :code])))
                   (is (= :sync-start (get-in result [:error :action])))
                   (is (= [:ws-url] (get-in result [:error :missing-keys])))
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload-missing-http-base-is-error
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [result (sync-command/execute {:type :sync-upload
                                                       :repo "logseq_db_demo"}
                                                      {:root-dir "/tmp"
                                                       :http-base ""
                                                       :id-token "runtime-token"})]
                   (is (= :error (:status result)))
                   (is (= :missing-sync-config (get-in result [:error :code])))
                   (is (= :sync-upload (get-in result [:error :action])))
                   (is (= [:http-base] (get-in result [:error :missing-keys])))
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-missing-http-base-is-error
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved []))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :http-base ""
                                                       :id-token "runtime-token"})]
                   (is (= :error (:status result)))
                   (is (= :missing-sync-config (get-in result [:error :code])))
                   (is (= :sync-download (get-in result [:error :action])))
                   (is (= [:http-base] (get-in result [:error :missing-keys])))
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-missing-e2ee-password-for-e2ee-graph-is-error
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])
               stop-calls (atom [])
               unlink-calls (atom [])
               list-graphs-calls (atom 0)]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_config]
                                                        (let [idx (swap! list-graphs-calls inc)]
                                                          (if (= idx 1)
                                                            []
                                                            ["demo"])))
                               cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               cli-server/stop-server! (fn [config repo]
                                                         (swap! stop-calls conj [config repo])
                                                         (p/resolved {:ok? true}))
                               cli-common/unlink-graph! (fn [& args]
                                                          (swap! unlink-calls conj args)
                                                          "/tmp/unlinked-demo")
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/set-db-sync-config
                                                    (p/resolved nil)

                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])

                                                    :thread-api/get-e2ee-password
                                                    (p/rejected (ex-info "missing-e2ee-password"
                                                                         {:code :db-sync/missing-e2ee-password
                                                                          :field :e2ee-password}))

                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})

                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :http-base "https://api.logseq.io"
                                                       :id-token "runtime-token"
                                                       :refresh-token "refresh-token"})]
                   (is (= :error (:status result)))
                   (is (= :e2ee-password-not-found (get-in result [:error :code])))
                   (is (= "logseq_db_demo" (get-in result [:error :repo])))
                   (is (= ["logseq_db_demo"] (mapv second @stop-calls)))
                   (is (= ["logseq_db_demo"] (mapv last @unlink-calls)))
                   (is (not-any? (fn [[method _ _]]
                                   (= :thread-api/db-sync-download-graph-by-id method))
                                 @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-preserves-e2ee-error-when-cleanup-fails
  (async done
         (let [stop-calls (atom [])
               unlink-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_config]
                                                        [])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               cli-server/stop-server! (fn [config repo]
                                                         (swap! stop-calls conj [config repo])
                                                         (p/rejected (ex-info "stop failed"
                                                                              {:code :stop-failed})))
                               cli-common/unlink-graph! (fn [& args]
                                                          (swap! unlink-calls conj args)
                                                          "/tmp/unlinked-demo")
                               transport/invoke (fn [_ method _args]
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])

                                                    :thread-api/get-e2ee-password
                                                    (p/rejected (ex-info "missing-e2ee-password"
                                                                         {:code :db-sync/missing-e2ee-password}))

                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:ok true})

                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :http-base "https://api.logseq.io"
                                                       :id-token "runtime-token"
                                                       :refresh-token "refresh-token"})]
                   (is (= :error (:status result)))
                   (is (= :e2ee-password-not-found (get-in result [:error :code])))
                   (is (= ["logseq_db_demo"] (mapv second @stop-calls)))
                   (is (= [] @unlink-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-uses-persisted-e2ee-password-when-option-missing
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_config]
                                                        [])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])
                                                    :thread-api/get-e2ee-password
                                                    (p/resolved "persisted-password")
                                                    :thread-api/q
                                                    (p/resolved 0)
                                                    :thread-api/db-sync-download-graph-by-id
                                                    (p/resolved {:graph-id "remote-graph-id"
                                                                 :remote-tx 22})
                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :http-base "https://api.logseq.io"
                                                       :id-token "runtime-token"
                                                       :refresh-token "refresh-token"})]
                   (is (= :ok (:status result)))
                   (is (= "remote-graph-id" (get-in result [:data :graph-id])))
                   (is (some #(= [:thread-api/get-e2ee-password ["refresh-token"]]
                                 %)
                             @invoke-calls))
                   (is (not-any? #(= :thread-api/verify-and-save-e2ee-password (first %))
                                 @invoke-calls))
                   (is (some #(= [:thread-api/db-sync-download-graph-by-id ["logseq_db_demo" "remote-graph-id" true]]
                                 %)
                             @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-skips-cleanup-for-preexisting-graph
  (async done
         (let [stop-calls (atom [])
               unlink-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_config]
                                                        ["demo"])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               cli-server/stop-server! (fn [config repo]
                                                         (swap! stop-calls conj [config repo])
                                                         (p/resolved {:ok? true}))
                               cli-common/unlink-graph! (fn [& args]
                                                          (swap! unlink-calls conj args)
                                                          "/tmp/unlinked-demo")
                               transport/invoke (fn [_ method _args]
                                                  (case method
                                                    :thread-api/db-sync-list-remote-graphs
                                                    (p/resolved [{:graph-id "remote-graph-id"
                                                                  :graph-name "demo"
                                                                  :graph-e2ee? true}])

                                                    :thread-api/get-e2ee-password
                                                    (p/rejected (ex-info "missing-e2ee-password"
                                                                         {:code :db-sync/missing-e2ee-password}))

                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :http-base "https://api.logseq.io"
                                                       :id-token "runtime-token"
                                                       :refresh-token "refresh-token"})]
                   (is (= :error (:status result)))
                   (is (= :e2ee-password-not-found (get-in result [:error :code])))
                   (is (= [] @stop-calls))
                   (is (= [] @unlink-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-start-runtime-error-after-open
  (async done
         (let [status-calls (atom 0)]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method _args]
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
                                                      {:root-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :sync-start-runtime-error (get-in result [:error :code])))
                   (is (= :decrypt-aes-key (get-in result [:error :last-error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-stop-syncs-non-auth-config-only
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/db-sync-stop (p/resolved {:ok true})
                                                    (p/resolved nil)))]
                 (p/let [_ (sync-command/execute {:type :sync-stop
                                                  :repo "logseq_db_demo"}
                                                 {:root-dir "/tmp"})]
                   (is (= [[{:root-dir "/tmp"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [[:thread-api/set-db-sync-config [{:ws-url nil
                                                                   :http-base nil}]]
                           [:thread-api/db-sync-stop []]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-status-syncs-non-auth-config-only
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/db-sync-status (p/resolved {:repo "logseq_db_demo"
                                                                                            :ws-state :open
                                                                                            :pending-local 0
                                                                                            :pending-asset 0
                                                                                            :pending-server 0})
                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-status
                                                       :repo "logseq_db_demo"}
                                                      {:root-dir "/tmp"})]
                   (is (= :ok (:status result)))
                   (is (= :open (get-in result [:data :ws-state])))
                   (is (= [[{:root-dir "/tmp"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= [:thread-api/set-db-sync-config
                           :thread-api/db-sync-status]
                          (mapv first @invoke-calls)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])
               invoke-timeouts (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [cfg method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (swap! invoke-timeouts conj [method (:timeout-ms cfg)])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (execute-with-runtime-auth {:type :sync-upload
                                                  :repo "logseq_db_demo"}
                                                 {:root-dir "/tmp"
                                                  :timeout-ms 10000})]
                   (is (= [[{:root-dir "/tmp"
                             :timeout-ms 10000
                             :id-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= :thread-api/sync-app-state (ffirst @invoke-calls)))
                   (is (= "runtime-token"
                          (get-in (first @invoke-calls) [1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                   :http-base nil}]]
                          (second @invoke-calls)))
                   (is (= [:thread-api/db-sync-upload-graph ["logseq_db_demo"]]
                          (nth @invoke-calls 2)))
                   (is (= [:thread-api/db-sync-upload-graph 1800000]
                          (nth @invoke-timeouts 2)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload-verifies-and-persists-e2ee-password-when-provided
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (case method
                                                    :thread-api/verify-and-save-e2ee-password
                                                    (p/resolved nil)

                                                    :thread-api/db-sync-upload-graph
                                                    (p/resolved {:graph-id "graph-1"})

                                                    (p/resolved nil)))]
                 (p/let [result (sync-command/execute {:type :sync-upload
                                                       :repo "logseq_db_demo"
                                                       :e2ee-password "pw"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :refresh-token "refresh-token"
                                                       :id-token "runtime-token"})]
                   (is (= :ok (:status result)))
                   (is (some #(= [:thread-api/verify-and-save-e2ee-password ["refresh-token" "pw"]]
                                 %)
                             @invoke-calls))
                   (is (some #(= [:thread-api/db-sync-upload-graph ["logseq_db_demo"]]
                                 %)
                             @invoke-calls))
                   (let [method-index (fn [method]
                                        (first (keep-indexed (fn [idx [method' _args]]
                                                              (when (= method method')
                                                                idx))
                                                            @invoke-calls)))]
                     (is (< (method-index :thread-api/verify-and-save-e2ee-password)
                            (method-index :thread-api/db-sync-upload-graph))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-upload-propagates-worker-error
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _args]
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
                                                    {:root-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :snapshot-upload-failed (get-in result [:error :code])))
                 (is (= 500 (get-in result [:error :context :status])))
                 (is (= "graph-1" (get-in result [:error :context :graph-id])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-upload-surfaces-missing-e2ee-password-hint
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _args]
                                                (case method
                                                  :thread-api/set-db-sync-config
                                                  (p/resolved nil)

                                                  :thread-api/db-sync-upload-graph
                                                  (p/rejected (ex-info "missing-e2ee-password"
                                                                       {:code :db-sync/missing-e2ee-password
                                                                        :field :e2ee-password
                                                                        :reason :missing-persisted-password
                                                                        :hint "Provide --e2ee-password to persist it."}))

                                                  (p/resolved nil)))]
               (p/let [result (execute-with-runtime-auth {:type :sync-upload
                                                         :repo "logseq_db_demo"}
                                                        {:root-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :db-sync/missing-e2ee-password (get-in result [:error :code])))
                 (is (= "missing-e2ee-password" (get-in result [:error :message])))
                 (is (= "Provide --e2ee-password to persist it."
                        (get-in result [:error :context :hint])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-upload-surfaces-graph-already-exists-error
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _args]
                                                (case method
                                                  :thread-api/set-db-sync-config
                                                  (p/resolved nil)

                                                  :thread-api/db-sync-upload-graph
                                                  (p/rejected (ex-info "remote graph already exists; delete it before uploading again"
                                                                       {:code :db-sync/graph-already-exists
                                                                        :graph-id "graph-1"
                                                                        :graph-name "demo"}))

                                                  (p/resolved nil)))]
               (p/let [result (execute-with-runtime-auth {:type :sync-upload
                                                         :repo "logseq_db_demo"}
                                                        {:root-dir "/tmp"})]
                 (is (= :error (:status result)))
                 (is (= :db-sync/graph-already-exists (get-in result [:error :code])))
                 (is (= "remote graph already exists; delete it before uploading again"
                        (get-in result [:error :message])))
                 (is (= "graph-1" (get-in result [:error :context :graph-id])))
                 (is (= "demo" (get-in result [:error :context :graph-name])))))
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                  :graph "demo"
                                                  :e2ee-password "pw"}
                                                 {:base-url "http://example"
                                                  :root-dir "/tmp"
                                                  :refresh-token "refresh-token"})]
                   (is (= [[{:base-url "http://example"
                             :create-empty-db? true
                             :root-dir "/tmp"
                             :refresh-token "refresh-token"
                             :id-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                  :http-base nil}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-list-remote-graphs []]
                          (nth @invoke-calls 2)))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [3 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [3 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                  :http-base nil}]]
                          (nth @invoke-calls 4)))
                   (is (= [:thread-api/verify-and-save-e2ee-password ["refresh-token" "pw"]]
                          (nth @invoke-calls 5)))
                   (let [[method args] (nth @invoke-calls 6)]
                     (is (= :thread-api/q method))
                     (is (= "logseq_db_demo" (first args))))
                   (is (= [:thread-api/db-sync-download-graph-by-id ["logseq_db_demo" "remote-graph-id" true]]
                          (nth @invoke-calls 7)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-uses-long-timeout-only-for-download-invoke
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [cfg method args]
                                                  (swap! invoke-calls conj {:method method
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
                                                            :root-dir "/tmp"
                                                            :timeout-ms 10000})
                         [sync-app-state-before set-config-before list-remote-graphs sync-app-state-after set-config-after check-empty-db download]
                         @invoke-calls]
                   (is (= :ok (:status result)))
                   (is (= :thread-api/sync-app-state (:method sync-app-state-before)))
                   (is (= :thread-api/set-db-sync-config (:method set-config-before)))
                   (is (= :thread-api/db-sync-list-remote-graphs (:method list-remote-graphs)))
                   (is (= :thread-api/sync-app-state (:method sync-app-state-after)))
                   (is (= :thread-api/set-db-sync-config (:method set-config-after)))
                   (is (= :thread-api/q (:method check-empty-db)))
                   (is (= :thread-api/db-sync-download-graph-by-id (:method download)))
                   (is (= 10000 (:timeout-ms sync-app-state-before)))
                   (is (= 10000 (:timeout-ms set-config-before)))
                   (is (= 10000 (:timeout-ms list-remote-graphs)))
                   (is (= 10000 (:timeout-ms sync-app-state-after)))
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
                               transport/invoke (fn [_ method _args]
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
                                                       :root-dir "/tmp"
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
                                                       :root-dir "/tmp"
                                                       :output-format :json})
                         _ (is (= [] @subscribe-calls))
                         _ (is (= [] @printed-lines))
                         _ (is (= 0 @close-calls))
                         _ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress-explicit? false}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :output-format :edn})
                         _ (is (= [] @subscribe-calls))
                         _ (is (= [] @printed-lines))
                         _ (is (= 0 @close-calls))
                         _ (execute-with-runtime-auth {:type :sync-download
                                                       :repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :progress true
                                                       :progress-explicit? true}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
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
                                                       :root-dir "/tmp"
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                  :root-dir "/tmp"})]
                   (is (= [[{:graph "demo"
                             :create-empty-db? true
                             :root-dir "/tmp"
                             :id-token "runtime-token"}
                            "logseq_db_demo"]
                           [{:graph "demo"
                             :create-empty-db? true
                             :root-dir "/tmp"
                             :id-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                  :http-base nil}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-list-remote-graphs []]
                          (nth @invoke-calls 2)))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [3 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [3 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                  :http-base nil}]]
                          (nth @invoke-calls 4)))
                   (let [[method args] (nth @invoke-calls 5)]
                     (is (= :thread-api/q method))
                     (is (= "logseq_db_demo" (first args))))
                   (is (= [:thread-api/db-sync-download-graph-by-id ["logseq_db_demo" "remote-graph-id" false]]
                          (nth @invoke-calls 6)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-remote-graph-not-found
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                       :root-dir "/tmp"})]
                   (is (= :error (:status result)))
                   (is (= :remote-graph-not-found (get-in result [:error :code])))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                   :http-base nil}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-list-remote-graphs []]
                          (nth @invoke-calls 2)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-download-propagates-worker-error-code
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                         (p/resolved (assoc config :base-url "http://example")))
                             transport/invoke (fn [_ method _args]
                                                (case method
                                                  :thread-api/db-sync-list-remote-graphs
                                                  (p/resolved [{:graph-id "remote-graph-id"
                                                                :graph-name "demo"
                                                                :graph-e2ee? true}])
                                                  :thread-api/q
                                                  (p/resolved 0)
                                                  :thread-api/db-sync-download-graph-by-id
                                                  (p/rejected (ex-info "db-sync/snapshot-download-failed"
                                                                       {:code :db-sync/snapshot-download-failed
                                                                        :graph-id "remote-graph-id"
                                                                        :status 500}))
                                                  (p/resolved nil)))]
               (p/let [result (execute-with-runtime-auth {:type :sync-download
                                                     :repo "logseq_db_demo"
                                                     :graph "demo"
                                                     :e2ee-password "pw"}
                                                    {:base-url "http://example"
                                                     :root-dir "/tmp"
                                                     :refresh-token "refresh-token"})]
                 (is (= :error (:status result)))
                 (is (= :db-sync/snapshot-download-failed (get-in result [:error :code])))))
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
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
                                                       :graph "demo"
                                                       :e2ee-password "pw"}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"
                                                       :refresh-token "refresh-token"})]
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
           (-> (p/with-redefs [cli-auth/resolve-auth! (fn [config]
                                                        (swap! auth-calls conj config)
                                                        (p/resolved {:id-token "resolved-token"
                                                                     :refresh-token "refresh-token"}))
                               cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved []))]
                 (p/let [_ (sync-command/execute {:type :sync-remote-graphs}
                                                 {:base-url "http://example"
                                                  :http-base "https://sync.example.com"
                                                  :ws-url "wss://sync.example.com/sync/%s"
                                                  :e2ee-password "pw"
                                                  :root-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [{:base-url "http://example"
                            :http-base "https://sync.example.com"
                            :ws-url "wss://sync.example.com/sync/%s"
                            :e2ee-password "pw"
                            :root-dir "/tmp"}]
                          @auth-calls))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "resolved-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url "wss://sync.example.com/sync/%s"
                                                                   :http-base "https://sync.example.com"}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-list-remote-graphs []]
                          (nth @invoke-calls 2)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-remote-graphs-missing-auth
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [cli-auth/resolve-auth! (fn [_config]
                                                         (p/rejected (ex-info "missing auth"
                                                                              {:code :missing-auth
                                                                               :hint "Run logseq login first."})))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved []))]
                 (p/let [result (sync-command/execute {:type :sync-remote-graphs}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"})]
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (execute-with-runtime-auth {:type :sync-ensure-keys}
                                                      {:base-url "http://example"
                                                       :root-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                   :http-base nil}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-ensure-user-rsa-keys []]
                          (nth @invoke-calls 2)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-ensure-keys-verifies-and-persists-e2ee-password-when-provided
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-ensure-keys
                                                  :e2ee-password "pw"}
                                                 {:base-url "http://example"
                                                  :root-dir "/tmp"
                                                  :refresh-token "refresh-token"
                                                  :id-token "runtime-token"})]
                   (is (= [:thread-api/sync-app-state
                           :thread-api/set-db-sync-config
                           :thread-api/verify-and-save-e2ee-password
                           :thread-api/sync-app-state
                           :thread-api/set-db-sync-config
                           :thread-api/db-sync-ensure-user-rsa-keys]
                          (mapv first @invoke-calls)))
                   (is (some #(= [:thread-api/verify-and-save-e2ee-password ["refresh-token" "pw"]]
                                 %)
                             @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-ensure-keys-upload-keys-enables-server-upload-flow
  (async done
         (let [invoke-calls (atom [])]
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-ensure-keys
                                                  :upload-keys true
                                                  :e2ee-password "pw"}
                                                 {:base-url "http://example"
                                                  :root-dir "/tmp"
                                                  :refresh-token "refresh-token"
                                                  :id-token "runtime-token"})]
                   (is (= [:thread-api/sync-app-state
                           :thread-api/set-db-sync-config
                           :thread-api/db-sync-ensure-user-rsa-keys
                           :thread-api/sync-app-state
                           :thread-api/set-db-sync-config
                           :thread-api/verify-and-save-e2ee-password]
                          (mapv first @invoke-calls)))
                   (is (some #(= [:thread-api/db-sync-ensure-user-rsa-keys [{:ensure-server? true
                                                                                     :password "pw"}]]
                                 %)
                             @invoke-calls))
                   (is (some #(= [:thread-api/verify-and-save-e2ee-password ["refresh-token" "pw"]]
                                 %)
                             @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-grant-access-missing-http-base-is-error
  (async done
         (let [ensure-calls (atom [])
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                           (swap! ensure-calls conj [config repo])
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [result (sync-command/execute {:type :sync-grant-access
                                                       :repo "logseq_db_demo"
                                                       :graph-id "graph-uuid"
                                                       :email "user@example.com"}
                                                      {:root-dir "/tmp"
                                                       :http-base ""
                                                       :id-token "runtime-token"})]
                   (is (= :error (:status result)))
                   (is (= :missing-sync-config (get-in result [:error :code])))
                   (is (= :sync-grant-access (get-in result [:error :action])))
                   (is (= [:http-base] (get-in result [:error :missing-keys])))
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (execute-with-runtime-auth {:type :sync-grant-access
                                                  :repo "logseq_db_demo"
                                                  :graph-id "graph-uuid"
                                                  :email "user@example.com"}
                                                 {:root-dir "/tmp"})]
                   (is (= [[{:root-dir "/tmp"
                             :id-token "runtime-token"}
                            "logseq_db_demo"]]
                          @ensure-calls))
                   (is (= :thread-api/sync-app-state (get-in @invoke-calls [0 0])))
                   (is (= "runtime-token" (get-in @invoke-calls [0 1 0 :auth/id-token])))
                   (is (= [:thread-api/set-db-sync-config [{:ws-url nil
                                                                   :http-base nil}]]
                          (nth @invoke-calls 1)))
                   (is (= [:thread-api/db-sync-grant-graph-access ["logseq_db_demo" "graph-uuid" "user@example.com"]]
                          (nth @invoke-calls 2)))))
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
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [_ (sync-command/execute {:type :sync-config-get
                                                  :config-key :ws-url}
                                                 {:base-url "http://example"
                                                  :ws-url "wss://sync.example.com/sync/%s"
                                                  :root-dir "/tmp"})]
                   (is (= [] @ensure-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-sync-config-set
  (async done
         (let [invoke-calls (atom [])
               update-calls (atom [])]
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved nil))
                               cli-config/update-config! (fn [config updates]
                                                           (swap! update-calls conj [config updates])
                                                           (merge {:ws-url "wss://old.example/sync/%s"} updates))]
                 (p/let [_ (sync-command/execute {:type :sync-config-set
                                                  :config-key :ws-url
                                                  :config-value "wss://sync.example.com/sync/%s"}
                                                 {:base-url "http://example"
                                                  :config-path "/tmp/cli.edn"
                                                  :root-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :config-path "/tmp/cli.edn"
                             :root-dir "/tmp"}
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
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved nil))
                               cli-config/update-config! (fn [config updates]
                                                           (swap! update-calls conj [config updates])
                                                           (dissoc {:ws-url "wss://old.example/sync/%s"}
                                                                   :ws-url))]
                 (p/let [_ (sync-command/execute {:type :sync-config-unset
                                                  :config-key :ws-url}
                                                 {:base-url "http://example"
                                                  :config-path "/tmp/cli.edn"
                                                  :root-dir "/tmp"})]
                   (is (= [[{:base-url "http://example"
                             :config-path "/tmp/cli.edn"
                             :root-dir "/tmp"}
                            {:ws-url nil}]]
                          @update-calls))
                   (is (= [] @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
