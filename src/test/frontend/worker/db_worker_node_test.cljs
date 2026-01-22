(ns frontend.worker.db-worker-node-test
  (:require ["http" :as http]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.db-worker-node :as db-worker-node]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn- http-request
  [opts body]
  (p/create
   (fn [resolve reject]
     (let [req (.request http (clj->js opts)
                         (fn [^js res]
                           (let [chunks (array)]
                             (.on res "data" (fn [chunk] (.push chunks chunk)))
                             (.on res "end" (fn []
                                              (resolve {:status (.-statusCode res)
                                                        :body (.toString (js/Buffer.concat chunks) "utf8")}))))))
           finish! (fn []
                     (when body (.write req body))
                     (.end req))]
       (.on req "error" reject)
       (finish!)))))

(defn- http-get
  [host port path]
  (http-request {:hostname host
                 :port port
                 :path path
                 :method "GET"}
                nil))

(defn- invoke
  [host port method args]
  (let [payload (js/JSON.stringify
                 (clj->js {:method method
                           :directPass false
                           :argsTransit (ldb/write-transit-str args)}))]
    (p/let [{:keys [status body]}
            (http-request {:hostname host
                           :port port
                           :path "/v1/invoke"
                           :method "POST"
                           :headers {"Content-Type" "application/json"}}
                          payload)
            parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
      (when (not= 200 status)
        (println "[db-worker-node-test] invoke failed"
                 {:method method
                  :status status
                  :body body}))
      (is (= 200 status))
      (is (:ok parsed))
      (ldb/read-transit-str (:resultTransit parsed)))))

(defn- invoke-raw
  [host port method args]
  (let [payload (js/JSON.stringify
                 (clj->js {:method method
                           :directPass false
                           :argsTransit (ldb/write-transit-str args)}))]
    (http-request {:hostname host
                   :port port
                   :path "/v1/invoke"
                   :method "POST"
                   :headers {"Content-Type" "application/json"}}
                  payload)))

(defn- lock-path
  [data-dir repo]
  (let [repo-dir (node-path/join data-dir (worker-util/encode-graph-dir-name repo))]
    (node-path/join repo-dir "db-worker.lock")))

(defn- pad2
  [value]
  (if (< value 10)
    (str "0" value)
    (str value)))

(defn- yyyymmdd
  [^js date]
  (str (.getFullYear date)
       (pad2 (inc (.getMonth date)))
       (pad2 (.getDate date))))

(defn- log-path
  [data-dir repo]
  (let [repo-dir (node-path/join data-dir (worker-util/encode-graph-dir-name repo))
        date-str (yyyymmdd (js/Date.))]
    (node-path/join repo-dir (str "db-worker-node-" date-str ".log"))))

(deftest db-worker-node-creates-log-file
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-log")
          repo (str "logseq_db_log_" (subs (str (random-uuid)) 0 8))
          log-file (log-path data-dir repo)]
      (-> (p/let [{:keys [stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo})
                  _ (reset! daemon {:stop! stop!})
                  _ (p/delay 50)]
            (is (fs/existsSync log-file)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!) (p/finally (fn [] (done))))
                         (done))))))))

(deftest db-worker-node-log-file-has-entries
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-log-entries")
          repo (str "logseq_db_log_entries_" (subs (str (random-uuid)) 0 8))
          log-file (log-path data-dir repo)]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo})
                  _ (reset! daemon {:stop! stop!})
                  _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                  _ (p/delay 50)
                  contents (when (fs/existsSync log-file)
                             (.toString (fs/readFileSync log-file) "utf8"))]
            (is (fs/existsSync log-file))
            (is (pos? (count contents))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!) (p/finally (fn [] (done))))
                         (done))))))))

(deftest db-worker-node-log-retention
  (let [enforce-log-retention! #'db-worker-node/enforce-log-retention!
        data-dir (node-helper/create-tmp-dir "db-worker-log-retention")
        repo (str "logseq_db_log_retention_" (subs (str (random-uuid)) 0 8))
        repo-dir (node-path/join data-dir (worker-util/encode-graph-dir-name repo))
        days ["20240101" "20240102" "20240103" "20240104" "20240105"
              "20240106" "20240107" "20240108" "20240109"]
        make-log (fn [day]
                   (node-path/join repo-dir (str "db-worker-node-" day ".log")))]
    (fs/mkdirSync repo-dir #js {:recursive true})
    (doseq [day days]
      (fs/writeFileSync (make-log day) "log\n"))
    (enforce-log-retention! repo-dir)
    (let [remaining (->> (fs/readdirSync repo-dir)
                         (filter (fn [^js name]
                                   (re-matches #"db-worker-node-\d{8}\.log" name)))
                         (sort))]
      (is (= 7 (count remaining)))
      (is (= ["db-worker-node-20240103.log"
              "db-worker-node-20240104.log"
              "db-worker-node-20240105.log"
              "db-worker-node-20240106.log"
              "db-worker-node-20240107.log"
              "db-worker-node-20240108.log"
              "db-worker-node-20240109.log"]
             remaining)))))

(deftest db-worker-node-parse-args-ignores-host-and-port
  (let [parse-args #'db-worker-node/parse-args
        result (parse-args #js ["node" "db-worker-node.js"
                                "--host" "0.0.0.0"
                                "--port" "1234"
                                "--repo" "logseq_db_parse_args"
                                "--data-dir" "/tmp/db-worker"])]
    (is (nil? (:host result)))
    (is (nil? (:port result)))
    (is (= "logseq_db_parse_args" (:repo result)))
    (is (= "/tmp/db-worker" (:data-dir result)))))

(deftest db-worker-node-repo-error-handles-keyword-methods
  (let [repo-error #'db-worker-node/repo-error
        bound-repo "logseq_db_bound"]
    (is (nil? (repo-error :thread-api/list-db [] bound-repo)))
    (is (nil? (repo-error "thread-api/list-db" [] bound-repo)))
    (is (= {:status 400
            :error {:code :missing-repo
                    :message "repo is required"}}
           (repo-error :thread-api/create-or-open-db [] bound-repo)))
    (is (= {:status 409
            :error {:code :repo-mismatch
                    :message "repo does not match bound repo"
                    :repo "other"
                    :bound-repo bound-repo}}
           (repo-error :thread-api/create-or-open-db ["other"] bound-repo)))))

(deftest db-worker-node-daemon-smoke-test
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-daemon")
          repo (str "logseq_db_smoke_" (subs (str (random-uuid)) 0 8))
          now (js/Date.now)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon!
                   {:data-dir data-dir
                    :repo repo})
                  health (http-get host port "/healthz")
                  ready (http-get host port "/readyz")
                  _ (do
                      (reset! daemon {:host host :port port :stop! stop!})
                      (println "[db-worker-node-test] daemon started" {:host host :port port})
                      (println "[db-worker-node-test] /healthz" health)
                      (is (= 200 (:status health)))
                      (println "[db-worker-node-test] /readyz" ready)
                      (is (= 200 (:status ready)))
                      (println "[db-worker-node-test] repo" repo))
                  _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                  dbs (invoke host port "thread-api/list-db" [])
                  _ (do
                      (println "[db-worker-node-test] list-db" dbs)
                      (is (some #(= repo (:name %)) dbs)))
                  lock-file (lock-path data-dir repo)
                  _ (is (fs/existsSync lock-file))
                  lock-contents (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))
                  _ (is (= repo (gobj/get lock-contents "repo")))
                  _ (is (= host (gobj/get lock-contents "host")))
                  _ (invoke host port "thread-api/transact"
                            [repo
                             [{:block/uuid page-uuid
                               :block/title "Smoke Page"
                               :block/name "smoke-page"
                               :block/tags #{:logseq.class/Page}
                               :block/created-at now
                               :block/updated-at now}
                              {:block/uuid block-uuid
                               :block/title "Smoke Test"
                               :block/page [:block/uuid page-uuid]
                               :block/parent [:block/uuid page-uuid]
                               :block/order "a0"
                               :block/created-at now
                               :block/updated-at now}]
                             {}
                             nil])
                  result (invoke host port "thread-api/q"
                                 [repo
                                  ['[:find ?e
                                     :in $ ?uuid
                                     :where [?e :block/uuid ?uuid]]
                                   block-uuid]])]
            (println "[db-worker-node-test] q result" result)
            (is (seq result)))
          (p/catch (fn [e]
                     (println "[db-worker-node-test] e:" e)
                     (is false (str e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!)
                             (p/finally (fn []
                                          (is (not (fs/existsSync (lock-path data-dir repo))))
                                          (done))))
                         (done))))))))

(deftest db-worker-node-import-edn
  (async done
    (let [daemon-a (atom nil)
          daemon-b (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-import-edn")
          repo-a (str "logseq_db_import_edn_a_" (subs (str (random-uuid)) 0 8))
          repo-b (str "logseq_db_import_edn_b_" (subs (str (random-uuid)) 0 8))
          now (js/Date.now)
          page-uuid (random-uuid)]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo-a})
                  _ (reset! daemon-a {:stop! stop!})
                  _ (invoke host port "thread-api/create-or-open-db" [repo-a {}])
                  _ (invoke host port "thread-api/transact"
                            [repo-a
                             [{:block/uuid page-uuid
                               :block/title "Import Page"
                               :block/name "import-page"
                               :block/tags #{:logseq.class/Page}
                               :block/created-at now
                               :block/updated-at now}]
                             {}
                             nil])
                  export-edn (invoke host port "thread-api/export-edn" [repo-a {:export-type :graph}])]
            (is (map? export-edn))
            (p/let [_ ((:stop! @daemon-a))
                    {:keys [host port stop!]}
                    (db-worker-node/start-daemon! {:data-dir data-dir
                                                   :repo repo-b})
                    _ (reset! daemon-b {:stop! stop!})
                    _ (invoke host port "thread-api/create-or-open-db" [repo-b {}])
                    _ (invoke host port "thread-api/import-edn" [repo-b export-edn])
                    result (invoke host port "thread-api/q"
                                   [repo-b
                                    ['[:find ?e
                                       :in $ ?title
                                       :where [?e :block/title ?title]]
                                     "Import Page"]])]
              (is (seq result))))
          (p/catch (fn [e]
                     (println "[db-worker-node-test] import-edn error:" e)
                     (is false (str e))))
          (p/finally (fn []
                       (let [stop-a (:stop! @daemon-a)
                             stop-b (:stop! @daemon-b)]
                         (cond
                           (and stop-a stop-b)
                           (-> (stop-a)
                               (p/finally (fn [] (-> (stop-b) (p/finally (fn [] (done)))))))

                           stop-a
                           (-> (stop-a) (p/finally (fn [] (done))))

                           stop-b
                           (-> (stop-b) (p/finally (fn [] (done))))

                           :else
                           (done)))))))))

(deftest db-worker-node-import-db-base64
  (async done
    (let [daemon-a (atom nil)
          daemon-b (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-import-sqlite")
          repo-a (str "logseq_db_import_sqlite_a_" (subs (str (random-uuid)) 0 8))
          repo-b (str "logseq_db_import_sqlite_b_" (subs (str (random-uuid)) 0 8))
          now (js/Date.now)
          page-uuid (random-uuid)]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo-a})
                  _ (reset! daemon-a {:stop! stop!})
                  _ (invoke host port "thread-api/create-or-open-db" [repo-a {}])
                  _ (invoke host port "thread-api/transact"
                            [repo-a
                             [{:block/uuid page-uuid
                               :block/title "SQLite Import Page"
                               :block/name "sqlite-import-page"
                               :block/tags #{:logseq.class/Page}
                               :block/created-at now
                               :block/updated-at now}]
                             {}
                             nil])
                  export-base64 (invoke host port "thread-api/export-db-base64" [repo-a])]
            (is (string? export-base64))
            (is (pos? (count export-base64)))
            (p/let [_ ((:stop! @daemon-a))
                    {:keys [host port stop!]}
                    (db-worker-node/start-daemon! {:data-dir data-dir
                                                   :repo repo-b})
                    _ (reset! daemon-b {:stop! stop!})
                    _ (invoke host port "thread-api/import-db-base64" [repo-b export-base64])
                    _ (invoke host port "thread-api/create-or-open-db" [repo-b {}])
                    result (invoke host port "thread-api/q"
                                   [repo-b
                                    ['[:find ?e
                                       :in $ ?title
                                       :where [?e :block/title ?title]]
                                     "SQLite Import Page"]])]
              (is (seq result))))
          (p/catch (fn [e]
                     (println "[db-worker-node-test] import-sqlite error:" e)
                     (is false (str e))))
          (p/finally (fn []
                       (let [stop-a (:stop! @daemon-a)
                             stop-b (:stop! @daemon-b)]
                         (cond
                           (and stop-a stop-b)
                           (-> (stop-a)
                               (p/finally (fn [] (-> (stop-b) (p/finally (fn [] (done)))))))

                           stop-a
                           (-> (stop-a) (p/finally (fn [] (done))))

                           stop-b
                           (-> (stop-b) (p/finally (fn [] (done))))

                           :else
                           (done)))))))))

(deftest db-worker-node-repo-mismatch-test
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-repo-mismatch")
          repo (str "logseq_db_mismatch_" (subs (str (random-uuid)) 0 8))
          other-repo (str repo "_other")]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo})
                  _ (reset! daemon {:host host :port port :stop! stop!})
                  {:keys [status body]} (invoke-raw host port "thread-api/create-or-open-db" [other-repo {}])
                  parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
            (is (= 409 status))
            (is (= false (:ok parsed)))
            (is (= "repo-mismatch" (get-in parsed [:error :code]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!) (p/finally (fn [] (done))))
                         (done))))))))

(deftest db-worker-node-lock-prevents-multiple-daemons
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-lock")
          repo (str "logseq_db_lock_" (subs (str (random-uuid)) 0 8))]
      (-> (p/let [{:keys [stop!]}
                  (db-worker-node/start-daemon! {:data-dir data-dir
                                                 :repo repo})
                  _ (reset! daemon {:stop! stop!})]
            (-> (db-worker-node/start-daemon! {:data-dir data-dir
                                               :repo repo})
                (p/then (fn [_]
                          (is false "expected lock error")))
                (p/catch (fn [e]
                           (is (= :repo-locked (-> (ex-data e) :code)))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!) (p/finally (fn [] (done))))
                         (done))))))))
