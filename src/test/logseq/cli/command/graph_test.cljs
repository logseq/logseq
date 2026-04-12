(ns logseq.cli.command.graph-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.commands :as commands]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.graph-dir :as graph-dir]
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
                               transport/invoke (fn [_ method _ args]
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

(deftest test-execute-graph-backup-create-invokes-worker-backup-api
  (async done
         (let [invoke-calls (atom [])
               data-dir (node-helper/create-tmp-dir "cli-backup-create-path")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (p/resolved {:path (second args)}))]
                 (p/let [result (commands/execute {:type :graph-backup-create
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :backup-name "demo-nightly-20260101T000000Z"}
                                                  {:data-dir data-dir})]
                   (is (= :ok (:status result)))
                   (is (= 1 (count @invoke-calls)))
                   (let [[method _ [repo backup-db-path]] (first @invoke-calls)
                         expected-segment (node-path/join
                                           (graph-dir/repo->encoded-graph-dir-name repo)
                                           "backup"
                                           (graph-dir/graph-dir-key->encoded-dir-name "demo-nightly-20260101T000000Z")
                                           "db.sqlite")]
                     (is (= :thread-api/backup-db-sqlite method))
                     (is (= "logseq_db_demo" repo))
                     (is (and (string? backup-db-path)
                              (string/includes? backup-db-path expected-segment))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-list-only-returns-current-graph-backups
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-backup-list-scope")
               demo-repo "logseq_db_demo"
               other-repo "logseq_db_other"
               demo-backup "demo-nightly"
               other-backup "other-nightly"
               demo-db-path (node-path/join data-dir
                                            (graph-dir/repo->encoded-graph-dir-name demo-repo)
                                            "backup"
                                            (graph-dir/graph-dir-key->encoded-dir-name demo-backup)
                                            "db.sqlite")
               other-db-path (node-path/join data-dir
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
                                                {:data-dir data-dir})
                       backup-names (mapv :name (get-in result [:data :backups]))]
                 (is (= :ok (:status result)))
                 (is (= [demo-backup] backup-names)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-restore-fails-when-source-backup-missing
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-backup-restore-missing")]
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
                                                  {:data-dir data-dir})]
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
                                                {:data-dir "/tmp/graphs"})]
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
               data-dir (node-helper/create-tmp-dir "cli-backup-restore-flow")
               backup-db-path (node-path/join data-dir
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
                                                      (js/Buffer.from "sqlite" "utf8"))
                               transport/invoke (fn [_ method _ args]
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
                                                  {:data-dir data-dir})]
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
                   (is (= [[:thread-api/import-db-base64 ["logseq_db_demo-restored" "c3FsaXRl"]]]
                          @invoke-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-backup-remove-fails-when-source-backup-missing
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-backup-remove-missing")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])]
                 (p/let [result (commands/execute {:type :graph-backup-remove
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :src "demo-nightly"}
                                                  {:data-dir data-dir})]
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
                               transport/invoke (fn [_ method _ _]
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
