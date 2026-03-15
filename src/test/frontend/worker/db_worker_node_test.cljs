(ns frontend.worker.db-worker-node-test
  (:require ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [frontend.worker.db-worker-node :as db-worker-node]
            [frontend.worker.platform.node :as platform-node]
            [goog.object :as gobj]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.test-helper :as test-helper]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [promesa.core :as p]))

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

(defn- escape-regex
  [value]
  (let [pattern (js/RegExp. "[.*+?^${}()|[\\]\\\\]" "g")]
    (string/replace value pattern "\\\\$&")))

(defn- contains-bold?
  [value token]
  (let [token (escape-regex token)
        pattern (re-pattern (str "\\u001b\\[[0-9;]*m" token "\\u001b\\[[0-9;]*m"))]
    (boolean (re-find pattern value))))

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
  (db-lock/lock-path data-dir repo))

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
  (let [repo-dir (db-lock/repo-dir data-dir repo)
        date-str (yyyymmdd (js/Date.))]
    (node-path/join repo-dir (str "db-worker-node-" date-str ".log"))))

(defn- start-daemon!
  "Start daemon with quiet logging by default"
  [opts]
  (db-worker-node/start-daemon! (update opts :log-level #(or % "error"))))

(defn- noisy-debug-line?
  [line]
  (or (string/includes? line ":listen-db-changes!")
      (string/includes? line ":debug :db-gc")))

(defonce ^:private *orig-print-fn (atom nil))

(defn- quiet-debug-output-before
  []
  (when-not @*orig-print-fn
    (reset! *orig-print-fn *print-fn*))
  (set-print-fn!
   (fn [line]
     (when-not (and (string? line) (noisy-debug-line? line))
       (when-let [orig @*orig-print-fn]
         (orig line))))))

(defn- quiet-debug-output-after
  []
  (when-let [orig @*orig-print-fn]
    (set-print-fn! orig)))

(defn- reset-daemon-state!
  []
  (reset! @#'db-worker-node/*ready? false)
  (reset! @#'db-worker-node/*sse-clients #{})
  (reset! @#'db-worker-node/*lock-info nil)
  (reset! @#'db-worker-node/*file-handler nil))

(defn- normalize-db-worker-state-before
  []
  (quiet-debug-output-before)
  (reset-daemon-state!))

(defn- normalize-db-worker-state-after
  []
  (reset-daemon-state!)
  (quiet-debug-output-after))

(use-fixtures :each {:before normalize-db-worker-state-before
                     :after normalize-db-worker-state-after})

(deftest db-worker-node-data-dir-permission-error
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-readonly")
               repo (str "logseq_db_perm_" (subs (str (random-uuid)) 0 8))]
           (fs/chmodSync data-dir 365)
           (-> (start-daemon! {:data-dir data-dir
                               :repo repo})
               (p/then (fn [_]
                         (is false "expected data-dir permission error")))
               (p/catch (fn [e]
                          (let [data (ex-data e)]
                            (is (= :data-dir-permission (:code data)))
                            (is (= (node-path/resolve data-dir) (:path data))))))
               (p/finally (fn [] (done)))))))

(deftest db-worker-node-creates-log-file
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-log")
               repo (str "logseq_db_log_" (subs (str (random-uuid)) 0 8))
               log-file (log-path data-dir repo)]
           (-> (p/let [{:keys [stop!]}
                       (start-daemon! {:data-dir data-dir
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
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       _ (invoke-raw host port "thread-api/q" [repo nil])
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
        repo-dir (db-lock/repo-dir data-dir repo)
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
        result (parse-args #js ["node" "dist/db-worker-node.js"
                                "--host" "0.0.0.0"
                                "--port" "1234"
                                "--repo" "logseq_db_parse_args"
                                "--data-dir" "/tmp/db-worker"])]
    (is (nil? (:host result)))
    (is (nil? (:port result)))
    (is (= "logseq_db_parse_args" (:repo result)))
    (is (= "/tmp/db-worker" (:data-dir result)))))

(deftest db-worker-node-parse-args-ignores-auth-token
  (let [parse-args #'db-worker-node/parse-args
        result (parse-args #js ["node" "dist/db-worker-node.js"
                                "--auth-token" "secret"
                                "--data-dir" "/tmp/db-worker"])]
    (is (nil? (:auth-token result)))
    (is (= "/tmp/db-worker" (:data-dir result)))))

(deftest db-worker-node-parse-args-ignores-rtc-ws-url
  (let [parse-args #'db-worker-node/parse-args
        result (parse-args #js ["node" "dist/db-worker-node.js"
                                "--rtc-ws-url" "ws://example.com"
                                "--repo" "logseq_db_parse_args"])]
    (is (nil? (:rtc-ws-url result)))
    (is (= "logseq_db_parse_args" (:repo result)))))

(deftest db-worker-node-parse-args-recognizes-create-empty-db
  (let [parse-args #'db-worker-node/parse-args
        result (parse-args #js ["node" "dist/db-worker-node.js"
                                "--repo" "logseq_db_parse_args"
                                "--create-empty-db"])]
    (is (= "logseq_db_parse_args" (:repo result)))
    (is (= true (:create-empty-db? result)))))

(deftest db-worker-node-parse-args-recognizes-version
  (let [parse-args #'db-worker-node/parse-args
        result (parse-args #js ["node" "dist/db-worker-node.js"
                                "--version"])]
    (is (= true (:version? result)))
    (is (nil? (:repo result)))))

(deftest db-worker-node-main-version-exits-early-without-repo
  (async done
    (let [exit-code* (atom nil)
          start-called? (atom false)]
      (-> (test-helper/with-js-property-override
           js/process
           "argv"
           #js ["node" "dist/db-worker-node.js" "--version"]
           (fn []
             (test-helper/with-js-property-override
              js/process
              "exit"
              (fn [code]
                (reset! exit-code* code)
                (throw (ex-info "process-exit" {:code code})))
              (fn []
                (p/with-redefs [db-worker-node/start-daemon! (fn [_]
                                                               (reset! start-called? true)
                                                               (p/rejected (ex-info "should-not-start-daemon" {})))]
                  (p/resolved
                   (let [output (with-out-str
                                  (try
                                    (db-worker-node/main)
                                    (catch :default e
                                      (when-not (= "process-exit" (.-message e))
                                        (throw e)))))]
                     (is (= 0 @exit-code*))
                     (is (= false @start-called?))
                     (is (string/includes? output "Revision:")))))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest db-worker-node-owner-source-cli-is-written-into-lock
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-owner-source-cli")
               repo (str "logseq_db_owner_cli_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)]
           (-> (p/let [{:keys [stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo
                                       :owner-source :cli})
                       _ (reset! daemon {:stop! stop!})
                       lock-json (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))]
                 (is (= "cli" (gobj/get lock-json "owner-source"))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-owner-source-electron-is-written-into-lock
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-owner-source-electron")
               repo (str "logseq_db_owner_electron_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)]
           (-> (p/let [{:keys [stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo
                                       :owner-source :electron})
                       _ (reset! daemon {:stop! stop!})
                       lock-json (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))]
                 (is (= "electron" (gobj/get lock-json "owner-source"))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-handle-event-encodes-sse-json-payload
  (let [handle-event! #'db-worker-node/handle-event!
        *sse-clients @#'db-worker-node/*sse-clients
        writes (atom [])
        fake-res #js {:write (fn [message]
                               (swap! writes conj message))}]
    (reset! *sse-clients #{fake-res})
    (handle-event! "sync-db-changes" {:repo "graph-a"})
    (is (= 1 (count @writes)))
    (let [raw-message (first @writes)
          event-json (-> raw-message
                         (string/replace-first #"^data: " "")
                         (string/replace #"\n\n$" ""))
          parsed (js->clj (js/JSON.parse event-json) :keywordize-keys true)]
      (is (= "sync-db-changes" (:type parsed)))
      (is (= {:repo "graph-a"}
             (ldb/read-transit-str (:payload parsed)))))))

(deftest db-worker-node-help-omits-auth-token
  (let [show-help! #'db-worker-node/show-help!
        output (binding [style/*color-enabled?* true]
                 (with-out-str (show-help!)))
        plain-output (style/strip-ansi output)]
    (is (not (string/includes? (style/strip-ansi output) "--auth-token")))
    (is (not (string/includes? plain-output "--rtc-ws-url")))
    (is (string/includes? plain-output "(default ~/logseq/graphs)"))
    (is (re-find #"\u001b\[[0-9;]*moptions\u001b\[[0-9;]*m:" output))
    (is (contains-bold? output "db-worker-node"))
    (is (contains-bold? output "--data-dir"))
    (is (contains-bold? output "--repo"))
    (is (string/includes? plain-output "--create-empty-db"))
    (is (contains-bold? output "--create-empty-db"))
    (is (not (contains-bold? output "--rtc-ws-url")))
    (is (contains-bold? output "--log-level"))))

(deftest db-worker-node-start-daemon-uses-empty-datoms-when-create-empty-enabled
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-create-empty-start")
               repo (str "logseq_db_create_empty_start_" (subs (str (random-uuid)) 0 8))
               lock-file-path (lock-path data-dir repo)
               invoke-calls (atom [])]
           (-> (p/with-redefs [platform-node/node-platform (fn [_opts] #js {})
                               db-core/init-core! (fn [_platform]
                                                    #js {:remoteInvoke (fn [method direct-pass? args]
                                                                         (swap! invoke-calls conj
                                                                                [method
                                                                                 direct-pass?
                                                                                 (if direct-pass?
                                                                                   (vec (js->clj args))
                                                                                   (ldb/read-transit-str args))])
                                                                         (p/resolved nil))})
                               db-lock/ensure-lock! (fn [_]
                                                      (p/resolved {:path lock-file-path
                                                                   :lock {:repo repo
                                                                          :pid (.-pid js/process)
                                                                          :host "127.0.0.1"
                                                                          :port 0
                                                                          :lock-id "create-empty-lock"}}))
                               db-lock/update-lock! (fn [_path lock] lock)]
                 (p/let [{:keys [stop!]} (db-worker-node/start-daemon! {:data-dir data-dir
                                                                        :repo repo
                                                                        :create-empty-db? true
                                                                        :log-level "error"})
                         _ (is (= ["thread-api/init" true []]
                                  (first @invoke-calls)))
                         _ (is (= ["thread-api/create-or-open-db" false [repo {:datoms []}]]
                                  (second @invoke-calls)))
                         _ (stop!)]
                   true))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest db-worker-node-start-daemon-uses-default-startup-opts-without-create-empty
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-default-start")
               repo (str "logseq_db_default_start_" (subs (str (random-uuid)) 0 8))
               lock-file-path (lock-path data-dir repo)
               invoke-calls (atom [])]
           (-> (p/with-redefs [platform-node/node-platform (fn [_opts] #js {})
                               db-core/init-core! (fn [_platform]
                                                    #js {:remoteInvoke (fn [method direct-pass? args]
                                                                         (swap! invoke-calls conj
                                                                                [method
                                                                                 direct-pass?
                                                                                 (if direct-pass?
                                                                                   (vec (js->clj args))
                                                                                   (ldb/read-transit-str args))])
                                                                         (p/resolved nil))})
                               db-lock/ensure-lock! (fn [_]
                                                      (p/resolved {:path lock-file-path
                                                                   :lock {:repo repo
                                                                          :pid (.-pid js/process)
                                                                          :host "127.0.0.1"
                                                                          :port 0
                                                                          :lock-id "default-lock"}}))
                               db-lock/update-lock! (fn [_path lock] lock)]
                 (p/let [{:keys [stop!]} (db-worker-node/start-daemon! {:data-dir data-dir
                                                                        :repo repo
                                                                        :log-level "error"})
                         _ (is (= ["thread-api/init" true []]
                                  (first @invoke-calls)))
                         _ (is (= ["thread-api/create-or-open-db" false [repo {}]]
                                  (second @invoke-calls)))
                         _ (stop!)]
                   true))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest db-worker-node-repo-error-handles-keyword-methods
  (let [repo-error #'db-worker-node/repo-error
        bound-repo "logseq_db_bound"]
    (is (nil? (repo-error :thread-api/list-db [] bound-repo)))
    (is (nil? (repo-error :thread-api/get-db-sync-config [] bound-repo)))
    (is (nil? (repo-error :thread-api/db-sync-list-remote-graphs [] bound-repo)))
    (is (nil? (repo-error "thread-api/list-db" [] bound-repo)))
    (is (nil? (repo-error :thread-api/rtc-get-graphs ["token"] bound-repo)))
    (is (nil? (repo-error :thread-api/set-context [{:repo "not-a-repo-arg"}] bound-repo)))
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

(deftest db-worker-node-set-context-does-not-trigger-repo-mismatch
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-set-context")
               repo (str "logseq_db_set_context_" (subs (str (random-uuid)) 0 8))]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:host host :port port :stop! stop!})
                       _ (invoke host port "thread-api/set-db-sync-config"
                                 [{:ws-url "wss://example.com/sync/%s"
                                   :auth-token "token-value"}])
                       config (invoke host port "thread-api/get-db-sync-config" [])
                       _ (is (= "wss://example.com/sync/%s" (:ws-url config)))
                       _ (is (= "token-value" (:auth-token config)))
                       result (invoke host port "thread-api/set-context" [{:app "desktop"}])]
                 (is (nil? result)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-create-empty-startup-skips-built-in-initial-data
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-empty-initial-data")
               repo (str "logseq_db_empty_initial_" (subs (str (random-uuid)) 0 8))]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo
                                       :create-empty-db? true})
                       _ (reset! daemon {:stop! stop!})
                       library-result (invoke host port "thread-api/q"
                                              [repo
                                               ['[:find ?e
                                                  :in $ ?title
                                                  :where [?e :block/title ?title]]
                                                common-config/library-page-name]])]
                 (is (empty? library-result)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-sync-status-requires-repo-and-returns-structured-status
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-sync-status")
               repo (str "logseq_db_sync_status_" (subs (str (random-uuid)) 0 8))]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:host host :port port :stop! stop!})
                       {:keys [status body]} (invoke-raw host port "thread-api/db-sync-status" [])
                       parsed (js->clj (js/JSON.parse body) :keywordize-keys true)
                       _ (is (= 400 status))
                       _ (is (= false (:ok parsed)))
                       _ (is (= "missing-repo" (get-in parsed [:error :code])))
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       status-result (invoke host port "thread-api/db-sync-status" [repo])]
                 (is (= repo (:repo status-result)))
                 (is (contains? status-result :ws-state))
                 (is (contains? status-result :pending-local))
                 (is (contains? status-result :pending-asset))
                 (is (contains? status-result :pending-server))
                 (is (contains? status-result :local-tx))
                 (is (contains? status-result :remote-tx))
                 (is (contains? status-result :graph-id)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-sync-start-and-status-invoke-path
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-sync-start")
               repo (str "logseq_db_sync_start_" (subs (str (random-uuid)) 0 8))]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:host host :port port :stop! stop!})
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       _ (invoke host port "thread-api/set-db-sync-config"
                                 [{:ws-url nil
                                   :http-base "https://example.com"
                                   :auth-token "token-value"}])
                       start-result (invoke host port "thread-api/db-sync-start" [repo])
                       status-result (invoke host port "thread-api/db-sync-status" [repo])]
                 (is (nil? start-result))
                 (is (= repo (:repo status-result)))
                 (is (= :inactive (:ws-state status-result)))
                 (is (contains? status-result :pending-local))
                 (is (contains? status-result :pending-server)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-daemon-smoke-test
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-daemon")
               repo (str "logseq_db_smoke_" (subs (str (random-uuid)) 0 8))
               now (js/Date.now)
               page-uuid (random-uuid)
               block-uuid (random-uuid)]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon!  {:data-dir data-dir
                                        :repo repo})
                       health (http-get host port "/healthz")
                       ready (http-get host port "/readyz")
                       _ (do
                           (reset! daemon {:host host :port port :stop! stop!})
                           (is (= 200 (:status health)))
                           (is (= 200 (:status ready))))
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       dbs (invoke host port "thread-api/list-db" [])
                       _ (is (some #(= repo (:name %)) dbs))
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
                       (start-daemon! {:data-dir data-dir
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
                         (start-daemon! {:data-dir data-dir
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
                       (start-daemon! {:data-dir data-dir
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
                         (start-daemon! {:data-dir data-dir
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
                       (start-daemon! {:data-dir data-dir
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
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})]
                 (-> (start-daemon! {:data-dir data-dir
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

(deftest db-worker-node-write-mutation-fails-for-non-owner-pid
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-write-lease-pid")
               repo (str "logseq_db_write_lease_pid_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       export-base64 (invoke host port "thread-api/export-db-base64" [repo])
                       lock-contents (js->clj (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))
                                              :keywordize-keys true)
                       tampered-lock (assoc lock-contents
                                            :pid (inc (:pid lock-contents))
                                            :lock-id "non-owner-lock")
                       _ (fs/writeFileSync lock-file (js/JSON.stringify (clj->js tampered-lock)))
                       {:keys [status body]} (invoke-raw host port "thread-api/import-db-base64" [repo export-base64])
                       parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
                 (is (= 409 status))
                 (is (= false (:ok parsed)))
                 (is (= "repo-locked" (get-in parsed [:error :code]))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-write-mutation-succeeds-for-active-owner
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-write-lease-owner")
               repo (str "logseq_db_write_lease_owner_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       lock-contents (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))
                       lock-id (gobj/get lock-contents "lock-id")
                       _ (is (string? lock-id))
                       export-base64 (invoke host port "thread-api/export-db-base64" [repo])
                       {:keys [status body]} (invoke-raw host port "thread-api/import-db-base64" [repo export-base64])
                       parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
                 (is (= 200 status))
                 (is (= true (:ok parsed))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-write-mutation-rejects-stale-lock-after-replacement
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-write-lease-replaced")
               repo (str "logseq_db_write_lease_replaced_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       export-base64 (invoke host port "thread-api/export-db-base64" [repo])
                       lock-contents (js->clj (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))
                                              :keywordize-keys true)
                       replaced-lock (assoc lock-contents :lock-id "replaced-lock-id")
                       _ (fs/writeFileSync lock-file (js/JSON.stringify (clj->js replaced-lock)))
                       {:keys [status body]} (invoke-raw host port "thread-api/import-db-base64" [repo export-base64])
                       parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
                 (is (= 409 status))
                 (is (= false (:ok parsed)))
                 (is (= "repo-locked" (get-in parsed [:error :code]))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!) (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-start-recovers-stale-lock-before-acquire
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-stale-lock-recover")
               repo (str "logseq_db_stale_lock_" (subs (str (random-uuid)) 0 8))
               lock-file (lock-path data-dir repo)
               stale-lock {:repo repo
                           :pid 999999
                           :host "127.0.0.1"
                           :port 6553
                           :lock-id "stale-lock-id"}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js stale-lock)))
           (-> (p/let [{:keys [stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       lock' (js->clj (js/JSON.parse (.toString (fs/readFileSync lock-file) "utf8"))
                                      :keywordize-keys true)]
                 (is (not= 999999 (:pid lock')))
                 (is (not= "stale-lock-id" (:lock-id lock'))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!)
                                  (p/finally (fn [] (done))))
                              (done))))))))

(deftest db-worker-node-desktop-and-cli-share-same-graph-daemon
  (async done
         (let [daemon (atom nil)
               data-dir (node-helper/create-tmp-dir "db-worker-desktop-cli")
               repo (str "logseq_db_desktop_cli_" (subs (str (random-uuid)) 0 8))
               now (js/Date.now)
               page-uuid (random-uuid)]
           (-> (p/let [{:keys [host port stop!]}
                       (start-daemon! {:data-dir data-dir
                                       :repo repo})
                       _ (reset! daemon {:stop! stop!})
                       _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                       _ (invoke host port "thread-api/transact"
                                 [repo
                                  [{:block/uuid page-uuid
                                    :block/title "Desktop+CLI Shared"
                                    :block/name "desktop-cli-shared"
                                    :block/tags #{:logseq.class/Page}
                                    :block/created-at now
                                    :block/updated-at now}]
                                  {}
                                  nil])
                       ensured (cli-server/ensure-server! {:data-dir data-dir} repo)
                       url (js/URL. (:base-url ensured))
                       cli-host (.-hostname url)
                       cli-port (js/parseInt (.-port url) 10)
                       result (invoke cli-host cli-port "thread-api/q"
                                      [repo
                                       ['[:find ?e
                                          :in $ ?title
                                          :where [?e :block/title ?title]]
                                        "Desktop+CLI Shared"]])]
                 (is (seq result)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (if-let [stop! (:stop! @daemon)]
                              (-> (stop!)
                                  (p/finally (fn [] (done))))
                              (done))))))))
