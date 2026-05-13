(ns logseq.cli.command.graph-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.commands :as commands]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db-worker.graph-backup :as graph-backup]
            [promesa.core :as p]))

(deftest test-graph-validate-result
  (let [graph-validate-result #'graph-command/graph-validate-result
        invalid-result (graph-validate-result {:errors [{:entity {:db/id 1}
                                                         :errors {:foo ["bad"]}}]})
        valid-result (graph-validate-result {:errors nil :datom-count 10})]
    (is (= :error (:status invalid-result)))
    (is (= :graph-validation-failed (get-in invalid-result [:error :code])))
    (is (string/includes? (get-in invalid-result [:error :message])
                          "Found 1 entity with errors:"))
    (is (= :ok (:status valid-result)))))

(deftest test-graph-validate-result-formats-large-error-count
  (let [graph-validate-result #'graph-command/graph-validate-result
        errors (mapv (fn [idx]
                       {:entity {:db/id idx}
                        :errors {:foo ["bad"]}})
                     (range 1234))
        invalid-result (graph-validate-result {:errors errors})]
    (is (= :error (:status invalid-result)))
    (is (string/includes? (get-in invalid-result [:error :message])
                          "Found 1,234 entities with errors:"))))

(deftest test-execute-graph-info-queries-kv-rows-with-thread-api-q
  (async done
         (let [invoke-calls* (atom [])
               action {:repo "demo-repo"
                       :graph "demo-graph"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _]
                                                           (p/resolved {:base-url "http://example"}))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls* conj [method args])
                                                  (p/resolved [[:logseq.kv/schema-version 7]
                                                               [:logseq.kv/graph-created-at 40000]
                                                               [:logseq.kv/db-type :sqlite]]))]
                 (p/let [result (graph-command/execute-graph-info action {})]
                   (is (= :ok (:status result)))
                   (is (= 1 (count @invoke-calls*)))
                   (let [[method [repo query-args]] (first @invoke-calls*)]
                     (is (= :thread-api/q method))
                     (is (= "demo-repo" repo))
                     (is (= 1 (count query-args)))
                     (is (string/includes? (pr-str (first query-args)) "logseq.kv")))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(defn- create-enable-sync-action
  ([]
   (create-enable-sync-action nil))
  ([e2ee-password]
   {:type :graph-create-enable-sync
    :command :graph-create
    :repo "logseq_db_demo"
    :graph "demo"
    :method :thread-api/create-or-open-db
    :args ["logseq_db_demo" {}]
    :allow-missing-graph true
    :require-missing-graph true
    :persist-repo "demo"
    :enable-sync true
    :e2ee-password e2ee-password}))

(deftest test-execute-graph-create-enable-sync-orchestrates-create-upload-start
  (async done
         (let [events* (atom [])
               action (create-enable-sync-action "pw")
               config {:base-url "http://example"
                       :refresh-token "refresh-token"
                       :http-base "http://sync.example"
                       :ws-url "ws://sync.example/sync/%s"}
               event-index (fn [needle]
                             (first (keep-indexed (fn [idx event]
                                                    (when (= needle event)
                                                      idx))
                                                  @events*)))]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               cli-server/ensure-server! (fn [cfg repo]
                                                           (swap! events* conj [:ensure-server repo])
                                                           (p/resolved cfg))
                               cli-config/update-config! (fn [_ updates]
                                                           (swap! events* conj [:persist updates])
                                                           nil)
                               transport/invoke (fn [_ method args]
                                                  (swap! events* conj [method args])
                                                  (case method
                                                    :thread-api/create-or-open-db
                                                    (p/resolved {:created? true})

                                                    :thread-api/sync-app-state
                                                    (p/resolved {:ok true})

                                                    :thread-api/set-db-sync-config
                                                    (p/resolved {:ok true})

                                                    :thread-api/verify-and-save-e2ee-password
                                                    (p/resolved {:ok true})

                                                    :thread-api/db-sync-upload-graph
                                                    (p/resolved {:graph-id "graph-uuid"})

                                                    :thread-api/q
                                                    (p/resolved false)

                                                    :thread-api/db-sync-start
                                                    (p/resolved {:started? true})

                                                    :thread-api/db-sync-status
                                                    (p/resolved {:repo "logseq_db_demo"
                                                                 :graph-id "graph-uuid"
                                                                 :ws-state :open
                                                                 :pending-local 0
                                                                 :pending-asset 0
                                                                 :pending-server 0})

                                                    (throw (ex-info "unexpected invoke method" {:method method
                                                                                                :args args}))))]
                 (p/let [result (commands/execute action config)
                         worker-methods (->> @events*
                                             (keep (fn [[event-type _args]]
                                                     (when (and (keyword? event-type)
                                                                (= "thread-api" (namespace event-type))
                                                                (not= :thread-api/sync-app-state event-type))
                                                       event-type)))
                                             vec)]
                   (is (= :ok (:status result)))
                   (is (= {:graph "demo"
                           :repo "logseq_db_demo"
                           :stages {:create {:result {:created? true}}
                                    :upload {:graph-id "graph-uuid"}
                                    :start {:repo "logseq_db_demo"
                                            :graph-id "graph-uuid"
                                            :ws-state :open
                                            :pending-local 0
                                            :pending-asset 0
                                            :pending-server 0}}}
                          (:data result)))
                   (is (= [:thread-api/create-or-open-db
                           :thread-api/set-db-sync-config
                           :thread-api/verify-and-save-e2ee-password
                           :thread-api/db-sync-upload-graph
                           :thread-api/set-db-sync-config
                           :thread-api/q
                           :thread-api/db-sync-start
                           :thread-api/set-db-sync-config
                           :thread-api/db-sync-status]
                          worker-methods))
                   (let [persist-index (event-index [:persist {:graph "demo"}])
                         upload-index (event-index [:thread-api/db-sync-upload-graph ["logseq_db_demo"]])]
                     (is (and (number? persist-index)
                              (number? upload-index)
                              (< persist-index upload-index))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-create-enable-sync-fails-before-create-when-graph-exists
  (async done
         (let [invoke-calls* (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [cfg _] (p/resolved cfg))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls* conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [result (commands/execute (create-enable-sync-action) {})]
                   (is (= :error (:status result)))
                   (is (= :graph-exists (get-in result [:error :code])))
                   (is (= [] @invoke-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-create-enable-sync-stops-before-start-when-upload-fails
  (async done
         (let [events* (atom [])
               config {:base-url "http://example"
                       :refresh-token "refresh-token"
                       :http-base "http://sync.example"
                       :ws-url "ws://sync.example/sync/%s"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               cli-server/ensure-server! (fn [cfg _] (p/resolved cfg))
                               cli-config/update-config! (fn [_ updates]
                                                           (swap! events* conj [:persist updates])
                                                           nil)
                               transport/invoke (fn [_ method args]
                                                  (swap! events* conj [method args])
                                                  (case method
                                                    :thread-api/create-or-open-db
                                                    (p/resolved {:created? true})
                                                    :thread-api/sync-app-state
                                                    (p/resolved {:ok true})
                                                    :thread-api/set-db-sync-config
                                                    (p/resolved {:ok true})
                                                    :thread-api/db-sync-upload-graph
                                                    (p/rejected (ex-info "remote graph already exists"
                                                                         {:code :graph-already-exists}))
                                                    (p/resolved nil)))]
                 (p/let [result (commands/execute (create-enable-sync-action) config)]
                   (is (= :error (:status result)))
                   (is (= :graph-already-exists (get-in result [:error :code])))
                   (is (some #(= [:thread-api/db-sync-upload-graph ["logseq_db_demo"]] %) @events*))
                   (is (not-any? #(= :thread-api/db-sync-start (first %)) @events*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-create-enable-sync-returns-sync-start-error
  (async done
         (let [events* (atom [])
               config {:base-url "http://example"
                       :refresh-token "refresh-token"
                       :http-base "http://sync.example"
                       :ws-url "ws://sync.example/sync/%s"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               cli-server/ensure-server! (fn [cfg _] (p/resolved cfg))
                               cli-config/update-config! (fn [_ updates]
                                                           (swap! events* conj [:persist updates])
                                                           nil)
                               transport/invoke (fn [_ method args]
                                                  (swap! events* conj [method args])
                                                  (case method
                                                    :thread-api/create-or-open-db
                                                    (p/resolved {:created? true})
                                                    :thread-api/sync-app-state
                                                    (p/resolved {:ok true})
                                                    :thread-api/set-db-sync-config
                                                    (p/resolved {:ok true})
                                                    :thread-api/db-sync-upload-graph
                                                    (p/resolved {:graph-id "graph-uuid"})
                                                    :thread-api/q
                                                    (p/resolved false)
                                                    :thread-api/db-sync-start
                                                    (p/rejected (ex-info "sync start failed"
                                                                         {:code :sync-start-failed}))
                                                    (p/resolved nil)))]
                 (p/let [result (commands/execute (create-enable-sync-action) config)]
                   (is (= :error (:status result)))
                   (is (= :sync-start-failed (get-in result [:error :code])))
                   (is (some #(= [:thread-api/db-sync-upload-graph ["logseq_db_demo"]] %) @events*))
                   (is (some #(= [:thread-api/db-sync-start ["logseq_db_demo"]] %) @events*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-create-invokes-worker-backup-api
  (async done
         (let [invoke-calls (atom [])
               root-dir (node-helper/create-tmp-dir "cli-backup-create-path")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (fs/writeFileSync (second args) "sqlite-copy" "utf8")
                                                  (p/resolved {:path (second args)}))]
                 (p/let [result (commands/execute {:type :graph-backup-create
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :backup-name "demo-nightly-20260101T000000Z"}
                                                  {:root-dir root-dir})]
                   (is (= :ok (:status result)))
                   (is (= 1 (count @invoke-calls)))
                   (let [[method [repo backup-db-path]] (first @invoke-calls)
                         final-db-path (graph-backup/backup-db-path
                                        (cli-server/graphs-dir {:root-dir root-dir})
                                        repo
                                        "demo-nightly-20260101T000000Z")
                         metadata-path (graph-backup/backup-metadata-path
                                        (cli-server/graphs-dir {:root-dir root-dir})
                                        repo
                                        "demo-nightly-20260101T000000Z")
                         metadata (reader/read-string (fs/readFileSync metadata-path "utf8"))]
                     (is (= :thread-api/backup-db-sqlite method))
                     (is (= "logseq_db_demo" repo))
                     (is (and (string? backup-db-path)
                              (string/starts-with? backup-db-path
                                                   (node-path/dirname final-db-path))))
                     (is (not= final-db-path backup-db-path))
                     (is (= final-db-path (get-in result [:data :path])))
                     (is (= "sqlite-copy" (fs/readFileSync final-db-path "utf8")))
                     (is (= :cli (:source metadata)))
                     (is (= "demo-nightly-20260101T000000Z" (:name metadata))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-create-cleans-reserved-target-after-worker-failure
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-backup-create-cleanup")
               graphs-dir (cli-server/graphs-dir {:root-dir root-dir})
               repo "logseq_db_demo"
               backup-name "demo-failure"
               backup-dir (graph-backup/backup-dir-path graphs-dir repo backup-name)
               invoke-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (fs/writeFileSync (second args) "partial" "utf8")
                                                  (p/rejected (ex-info "snapshot failed"
                                                                       {:code :snapshot-failed})))]
                 (graph-command/execute-graph-backup-create {:repo repo
                                                             :graph "demo"
                                                             :backup-name backup-name}
                                                            {:root-dir root-dir}))
               (p/then (fn [_]
                         (is false "expected graph backup create to fail")))
               (p/catch (fn [e]
                          (is (= :snapshot-failed (:code (ex-data e))))
                          (is (= 1 (count @invoke-calls)))
                          (is (not (fs/existsSync backup-dir)))))
               (p/finally done)))))

(deftest test-execute-graph-backup-list-only-returns-current-graph-backups
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-backup-list-scope")
               graphs-dir (cli-server/graphs-dir {:root-dir root-dir})
               demo-repo "logseq_db_demo"
               other-repo "logseq_db_other"
               demo-backup "demo-nightly"
               other-backup "other-nightly"
               demo-db-path (node-path/join graphs-dir
                                            (graph-dir/repo->encoded-graph-dir-name demo-repo)
                                            "backup"
                                            (graph-dir/graph-dir-key->encoded-dir-name demo-backup)
                                            "db.sqlite")
               other-db-path (node-path/join graphs-dir
                                             (graph-dir/repo->encoded-graph-dir-name other-repo)
                                             "backup"
                                             (graph-dir/graph-dir-key->encoded-dir-name other-backup)
                                             "db.sqlite")]
           (fs/mkdirSync (node-path/dirname demo-db-path) #js {:recursive true})
           (fs/mkdirSync (node-path/dirname other-db-path) #js {:recursive true})
           (fs/writeFileSync demo-db-path "demo")
           (fs/writeFileSync other-db-path "other")
           (-> (p/let [result (commands/execute {:type :graph-backup-list
                                                 :repo demo-repo
                                                 :graph "demo"}
                                                {:root-dir root-dir})
                       backup-names (mapv :name (get-in result [:data :backups]))]
                 (is (= :ok (:status result)))
                 (is (= [demo-backup] backup-names)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-restore-fails-when-source-backup-missing
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-backup-restore-missing")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])]
                 (p/let [result (commands/execute {:type :graph-backup-restore
                                                   :repo "logseq_db_demo-restored"
                                                   :graph "demo-restored"
                                                   :source-repo "logseq_db_demo"
                                                   :source-graph "demo"
                                                   :src "demo-nightly"
                                                   :dst "demo-restored"
                                                   :allow-missing-graph true
                                                   :require-missing-graph true}
                                                  {:root-dir root-dir})]
                   (is (= :error (:status result)))
                   (is (= :backup-not-found (get-in result [:error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-restore-fails-when-destination-graph-exists
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo-restored"])]
               (p/let [result (commands/execute {:type :graph-backup-restore
                                                 :repo "logseq_db_demo-restored"
                                                 :graph "demo-restored"
                                                 :source-repo "logseq_db_demo"
                                                 :source-graph "demo"
                                                 :src "demo-nightly"
                                                 :dst "demo-restored"
                                                 :allow-missing-graph true
                                                 :require-missing-graph true}
                                                {:root-dir "/tmp/graphs"})]
                 (is (= :error (:status result)))
                 (is (= :graph-exists (get-in result [:error :code])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-graph-backup-restore-reuses-sqlite-import-flow
  (async done
         (let [invoke-calls (atom [])
               read-calls (atom [])
               stop-calls (atom [])
               restart-calls (atom [])
               root-dir (node-helper/create-tmp-dir "cli-backup-restore-flow")
               graphs-dir (cli-server/graphs-dir {:root-dir root-dir})
               sqlite-payload (js/Buffer.from "sqlite" "utf8")
               backup-db-path (node-path/join graphs-dir
                                              (graph-dir/repo->encoded-graph-dir-name "logseq_db_demo")
                                              "backup"
                                              (graph-dir/graph-dir-key->encoded-dir-name "demo-nightly")
                                              "db.sqlite")]
           (fs/mkdirSync (node-path/dirname backup-db-path) #js {:recursive true})
           (fs/writeFileSync backup-db-path "seed")
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               cli-server/stop-server! (fn [_ repo]
                                                         (swap! stop-calls conj repo)
                                                         (p/resolved {:ok? true}))
                               cli-server/restart-server! (fn [_ repo]
                                                            (swap! restart-calls conj repo)
                                                            (p/resolved {:ok? true}))
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/read-input (fn [{:keys [format path]}]
                                                      (swap! read-calls conj [format path])
                                                      sqlite-payload)
                               transport/invoke (fn [_ method args]
                                                  (swap! invoke-calls conj [method args])
                                                  (p/resolved {:ok true}))]
                 (p/let [result (commands/execute {:type :graph-backup-restore
                                                   :repo "logseq_db_demo-restored"
                                                   :graph "demo-restored"
                                                   :source-repo "logseq_db_demo"
                                                   :source-graph "demo"
                                                   :src "demo-nightly"
                                                   :dst "demo-restored"
                                                   :allow-missing-graph true
                                                   :require-missing-graph true}
                                                  {:root-dir root-dir})]
                   (is (= :ok (:status result)))
                   (is (= true (get-in result [:data :new-graph?])))
                   (is (= ["logseq_db_demo-restored"] @stop-calls))
                   (is (= ["logseq_db_demo-restored"] @restart-calls))
                   (is (= 1 (count @read-calls)))
                   (let [[read-format read-path] (first @read-calls)
                         expected-segment (node-path/join
                                           (graph-dir/repo->encoded-graph-dir-name "logseq_db_demo")
                                           "backup"
                                           (graph-dir/graph-dir-key->encoded-dir-name "demo-nightly")
                                           "db.sqlite")]
                     (is (= :sqlite read-format))
                     (is (and (string? read-path)
                              (string/includes? read-path expected-segment))))
                   (is (= [[:thread-api/import-db-binary ["logseq_db_demo-restored" sqlite-payload]]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-remove-fails-when-source-backup-missing
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-backup-remove-missing")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])]
                 (p/let [result (commands/execute {:type :graph-backup-remove
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :src "demo-nightly"}
                                                  {:root-dir root-dir})]
                   (is (= :error (:status result)))
                   (is (= :backup-not-found (get-in result [:error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-info-preserves-summary-fields-and-builds-kv-map
  (async done
         (let [action {:repo "demo-repo"
                       :graph "demo-graph"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _]
                                                           (p/resolved {:base-url "http://example"}))
                               transport/invoke (fn [_ method _]
                                                  (case method
                                                    :thread-api/q
                                                    (p/resolved [[:logseq.kv/db-type :sqlite]
                                                                 [:logseq.kv/graph-created-at 40000]
                                                                 [:logseq.kv/schema-version 7]])
                                                    (throw (ex-info "unexpected invoke method" {:method method}))))]
                 (p/let [result (graph-command/execute-graph-info action {})]
                   (is (= :ok (:status result)))
                   (is (= "demo-graph" (get-in result [:data :graph])))
                   (is (= 40000 (get-in result [:data :logseq.kv/graph-created-at])))
                   (is (= 7 (get-in result [:data :logseq.kv/schema-version])))
                   (is (= {"logseq.kv/db-type" :sqlite
                           "logseq.kv/graph-created-at" 40000
                           "logseq.kv/schema-version" 7}
                          (get-in result [:data :kv])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
