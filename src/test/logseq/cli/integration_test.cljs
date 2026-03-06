(ns logseq.cli.integration-test
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.config :as cli-config]
            [logseq.cli.main :as cli-main]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]))

(defn- run-cli
  [args data-dir cfg-path]
  (let [args (vec args)
        output-idx (.indexOf args "--output")
        [args output-args] (if (and (>= output-idx 0)
                                    (< (inc output-idx) (count args)))
                             [(vec (concat (subvec args 0 output-idx)
                                           (subvec args (+ output-idx 2))))
                              ["--output" (nth args (inc output-idx))]]
                             [args []])
        output-args (if (seq output-args)
                      output-args
                      ["--output" "json"])
        global-opts ["--data-dir" data-dir "--config" cfg-path]
        final-args (vec (concat global-opts output-args args))]
    (-> (cli-main/run! final-args {:exit? false})
        (p/then (fn [result]
                  (let [res (if (map? result)
                              result
                              (js->clj result :keywordize-keys true))]
                    res))))))

(defn- parse-json-output
  [result]
  (try
    (js->clj (js/JSON.parse (:output result)) :keywordize-keys true)
    (catch :default e
      (throw (ex-info "json parse failed"
                      {:output (:output result)}
                      e)))))

(defn- parse-json-output-safe
  [result label]
  (try
    (parse-json-output result)
    (catch :default e
      (throw (ex-info (str "json parse failed: " label)
                      {:label label
                       :output (:output result)}
                      e)))))

(defn- parse-edn-output
  [result]
  (reader/read-string (:output result)))

(defn- shell-escape
  [value]
  (let [text (str value)]
    (str "'" (string/replace text #"'" "'\"'\"'") "'")))

(defn- run-shell
  [command]
  (try
    (child-process/execSync command #js {:encoding "utf8"
                                         :shell "/bin/bash"})
    (catch :default e
      (let [err ^js e
            stdout (some-> (.-stdout err) (.toString "utf8"))
            stderr (some-> (.-stderr err) (.toString "utf8"))]
        (throw (ex-info (str "shell command failed: " command
                             "\nstdout: " (or stdout "")
                             "\nstderr: " (or stderr ""))
                        {:command command
                         :stdout stdout
                         :stderr stderr}
                        e))))))

(defn- capture-stderr!
  []
  (let [stderr (.-stderr js/process)
        original-write (.-write stderr)
        buffer (atom "")]
    (set! (.-write stderr)
          (fn [chunk]
            (swap! buffer str chunk)
            true))
    {:buffer buffer
     :restore! (fn [] (set! (.-write stderr) original-write))}))

(defn- node-title
  [node]
  (or (:block/title node) (:block/content node) (:title node) (:content node)))

(defn- node-children
  [node]
  (or (:block/children node) (:children node)))

(defn- node-id
  [node]
  (or (:db/id node) (:id node)))

(defn- item-id
  [item]
  (or (:db/id item) (:id item)))

(defn- item-title
  [item]
  (or (:block/title item) (:block/name item) (:title item) (:name item)))

(defn- find-block-by-title
  [node title]
  (when node
    (if (= title (node-title node))
      node
      (some #(find-block-by-title % title) (node-children node)))))

(defn- setup-tags-graph
  [data-dir]
  (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
          _ (fs/writeFileSync cfg-path "{:output-format :json}")
          _ (run-cli ["graph" "create" "--graph" "tags-graph"] data-dir cfg-path)
          _ (run-cli ["--graph" "tags-graph" "upsert" "page" "--page" "Home"] data-dir cfg-path)]
    {:cfg-path cfg-path :repo "tags-graph"}))

(defn- stop-repo!
  [data-dir cfg-path repo]
  (p/let [result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)]
    (parse-json-output result)))

(defn- run-query
  [data-dir cfg-path repo query inputs]
  (p/let [result (run-cli ["--graph" repo "query" "--query" query "--inputs" inputs]
                          data-dir cfg-path)]
    (parse-json-output result)))

(defn- query-tags
  [data-dir cfg-path repo title]
  (let [name (common-util/page-name-sanity-lc title)]
    (p/let [payload (run-query data-dir cfg-path repo
                               "[:find ?tag :in $ ?title ?name :where (or [?b :block/title ?title] [?b :block/content ?title] [?b :block/name ?name]) [?b :block/tags ?t] (or [?t :block/title ?tag] [?t :block/name ?tag])]"
                               (pr-str [title name]))]
      (->> (get-in payload [:data :result])
           (map first)
           set))))

(defn- query-property
  [data-dir cfg-path repo title property]
  (let [name (common-util/page-name-sanity-lc title)]
    (p/let [payload (run-query data-dir cfg-path repo
                               (str "[:find ?value :in $ ?title ?name :where (or [?e :block/title ?title] [?e :block/content ?title] [?e :block/name ?name]) [?e "
                                    property
                                    " ?value]]")
                               (pr-str [title name]))]
      (first (first (get-in payload [:data :result]))))))

(defn- query-block-uuid-by-title
  [data-dir cfg-path repo title]
  (let [name (common-util/page-name-sanity-lc title)]
    (p/let [_ (p/delay 300)
            payload (run-query data-dir cfg-path repo
                               "[:find ?uuid . :in $ ?title ?name :where (or [?b :block/title ?title] [?b :block/content ?title] [?b :block/name ?name]) [?b :block/uuid ?uuid]]"
                               (pr-str [title name]))]
      (get-in payload [:data :result]))))

(defn- list-items
  [data-dir cfg-path repo list-type]
  (p/let [result (run-cli ["--graph" repo "list" list-type] data-dir cfg-path)]
    (parse-json-output result)))

(defn- find-item-id
  [items title]
  (->> items
       (some (fn [item]
               (when (= title (item-title item)) item)))
       item-id))

(defn- first-result-id
  [payload]
  (first (get-in payload [:data :result])))

(deftest test-cli-sync-download-and-start-readiness-with-mocked-sync
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-sync-cli")
               download-repo "sync-download-graph"
               start-repo "sync-start-graph"
               orig-ensure-server! cli-server/ensure-server!
               orig-invoke transport/invoke
               invoke-calls (atom [])
               status-calls (atom 0)]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" start-repo] data-dir cfg-path)
                       create-payload (parse-json-output-safe create-result "graph create")
                       _ (is (= 0 (:exit-code create-result)))
                       _ (is (= "ok" (:status create-payload)))
                       _ (set! cli-server/ensure-server!
                               (fn [config _repo]
                                 (p/resolved (assoc config :base-url "http://example"))))
                       _ (set! transport/invoke
                               (fn [_ method _direct-pass? args]
                                 (swap! invoke-calls conj [method args])
                                 (case method
                                   :thread-api/set-db-sync-config
                                   (p/resolved nil)

                                   :thread-api/db-sync-list-remote-graphs
                                   (p/resolved [{:graph-id "remote-graph-id"
                                                 :graph-name download-repo
                                                 :graph-e2ee? true}])

                                   :thread-api/db-sync-download-graph-by-id
                                   (p/resolved {:repo "logseq_db_sync_integration_graph"
                                                :graph-id "remote-graph-id"
                                                :remote-tx 22
                                                :graph-e2ee? true
                                                :row-count 3})

                                   :thread-api/db-sync-start
                                   (p/resolved nil)

                                   :thread-api/db-sync-status
                                   (let [idx (swap! status-calls inc)]
                                     (p/resolved {:repo "logseq_db_sync_integration_graph"
                                                  :ws-state (if (= idx 1) :connecting :open)
                                                  :pending-local 0
                                                  :pending-asset 0
                                                  :pending-server 0}))

                                   :thread-api/q
                                   (p/resolved 0)

                                   (p/resolved nil))))
                       download-result (run-cli ["--graph" download-repo "sync" "download"] data-dir cfg-path)
                       download-payload (parse-json-output-safe download-result "sync download")
                       start-result (run-cli ["--graph" start-repo "sync" "start"] data-dir cfg-path)
                       start-payload (parse-json-output-safe start-result "sync start")]
                 (is (some #(= :thread-api/db-sync-download-graph-by-id (first %)) @invoke-calls))
                 (is (some #(= :thread-api/q (first %)) @invoke-calls))
                 (is (some #(= :thread-api/db-sync-status (first %)) @invoke-calls))
                 (is (= 0 (:exit-code download-result)))
                 (is (= "ok" (:status download-payload)))
                 (is (= "remote-graph-id" (get-in download-payload [:data :graph-id])))
                 (is (= 22 (get-in download-payload [:data :remote-tx])))
                 (is (= 0 (:exit-code start-result)))
                 (is (= "ok" (:status start-payload))
                     (pr-str start-payload))
                 (is (contains? #{"open" :open}
                                (get-in start-payload [:data :ws-state])))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))
               (p/finally (fn []
                            (set! cli-server/ensure-server! orig-ensure-server!)
                            (set! transport/invoke orig-invoke)))))))

(deftest ^:long test-cli-graph-list
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       result (run-cli ["graph" "list"] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 0 (:exit-code result)))
                 (is (= "ok" (:status payload)))
                 (is (contains? payload :data))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-data-dir-permission-error
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-readonly")]
           (fs/chmodSync data-dir 365)
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       result (run-cli ["graph" "list"] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 1 (:exit-code result)))
                 (is (= "error" (:status payload)))
                 (is (= "data-dir-permission" (get-in payload [:error :code])))
                 (is (string/includes? (get-in payload [:error :message]) data-dir))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-graph-create-readonly-graph-dir
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-graph-readonly")
               repo "readonly-graph"
               repo-id (command-core/resolve-repo repo)
               repo-dir (db-lock/repo-dir data-dir repo-id)]
           (fs/mkdirSync repo-dir #js {:recursive true})
           (fs/chmodSync repo-dir 365)
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       result (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 1 (:exit-code result)))
                 (is (= "error" (:status payload)))
                 (is (= "data-dir-permission" (get-in payload [:error :code])))
                 (is (string/includes? (get-in payload [:error :message]) repo-dir))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-graph-create-and-info
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" "demo-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       info-result (run-cli ["graph" "info"] data-dir cfg-path)
                       info-payload (parse-json-output info-result)
                       stop-result (run-cli ["server" "stop" "--graph" "demo-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-result)))
                 (is (= "ok" (:status create-payload)))
                 (is (= 0 (:exit-code info-result)))
                 (is (= "ok" (:status info-payload)))
                 (is (= "demo-graph" (get-in info-payload [:data :graph])))
                 (let [kv (get-in info-payload [:data :kv])
                       kv-keys (set (map str (keys (or kv {}))))]
                   (is (map? kv))
                   (is (>= (count kv) 2))
                   (is (or (contains? kv-keys "logseq.kv/graph-created-at")
                           (contains? kv-keys ":logseq.kv/graph-created-at")))
                   (is (or (contains? kv-keys "logseq.kv/schema-version")
                           (contains? kv-keys ":logseq.kv/schema-version"))))
                 (is (= 0 (:exit-code stop-result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-list-add-show-remove
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "content-graph"] data-dir cfg-path)
                       add-page-result (run-cli ["--graph" "content-graph" "upsert" "page" "--page" "TestPage"] data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       list-page-result (run-cli ["--graph" "content-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       list-tag-result (run-cli ["--graph" "content-graph" "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["--graph" "content-graph" "list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       add-block-result (run-cli ["--graph" "content-graph" "upsert" "block" "--target-page" "TestPage" "--content" "Test block"] data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       show-result (run-cli ["--graph" "content-graph" "show" "--page" "TestPage"] data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       remove-page-result (run-cli ["--graph" "content-graph" "remove" "page" "--name" "TestPage"] data-dir cfg-path)
                       remove-page-payload (parse-json-output remove-page-result)
                       stop-result (run-cli ["server" "stop" "--graph" "content-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (= "ok" (:status add-block-payload))
                     (pr-str (:error add-block-payload)))
                 (is (= "ok" (:status list-page-payload)))
                 (is (vector? (get-in list-page-payload [:data :items])))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (vector? (get-in list-tag-payload [:data :items])))
                 (is (= "ok" (:status list-property-payload)))
                 (is (vector? (get-in list-property-payload [:data :items])))
                 (is (= "ok" (:status show-payload)))
                 (is (some? (or (get-in show-payload [:data :root :db/id])
                                (get-in show-payload [:data :root :id]))))
                 (is (not (contains? (get-in show-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status remove-page-payload)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-page-json-output-returns-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-page-json-id")
               repo "add-page-json-id-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       add-page-result (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       page-ids (get-in add-page-payload [:data :result])
                       page-id (first page-ids)
                       query-payload (run-query data-dir cfg-path repo
                                                "[:find ?id . :in $ ?page-name :where [?id :block/name ?page-name]]"
                                                (pr-str [(common-util/page-name-sanity-lc "Home")]))
                       queried-page-id (get-in query-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (vector? page-ids))
                 (is (= 1 (count page-ids)))
                 (is (number? page-id))
                 (is (= page-id queried-page-id))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-block-create-json-output-returns-ids
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-block-json-ids")
               repo "add-block-json-ids-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       blocks-edn (pr-str [{:block/title "Parent"
                                            :block/children [{:block/title "Child"}]}
                                           {:block/title "Sibling"}])
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       _ (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       add-block-result (run-cli ["--graph" repo
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--blocks" blocks-edn]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       block-ids (get-in add-block-payload [:data :result])
                       title-query-payload (run-query data-dir cfg-path repo
                                                      "[:find ?title :in $ [?id ...] :where [?id :block/title ?title]]"
                                                      (pr-str [block-ids]))
                       block-titles (->> (get-in title-query-payload [:data :result])
                                         (map first)
                                         set)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-block-result))
                     (pr-str (:error add-block-payload)))
                 (is (= "ok" (:status add-block-payload))
                     (pr-str (:error add-block-payload)))
                 (is (vector? block-ids))
                 (is (= 3 (count block-ids)))
                 (is (= 3 (count (distinct block-ids))))
                 (is (every? number? block-ids))
                 (is (= #{"Parent" "Child" "Sibling"} block-titles))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-page-block-edn-output-returns-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-edn-id")
               repo "add-edn-id-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       add-page-result (run-cli ["--graph" repo
                                                 "--output" "edn"
                                                 "upsert" "page"
                                                 "--page" "Home"]
                                                data-dir cfg-path)
                       add-page-payload (parse-edn-output add-page-result)
                       page-ids (get-in add-page-payload [:data :result])
                       add-block-result (run-cli ["--graph" repo
                                                  "--output" "edn"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "EDN block"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-edn-output add-block-result)
                       block-ids (get-in add-block-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= :ok (:status add-page-payload)))
                 (is (vector? page-ids))
                 (is (= 1 (count page-ids)))
                 (is (number? (first page-ids)))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= :ok (:status add-block-payload)))
                 (is (vector? block-ids))
                 (is (= 1 (count block-ids)))
                 (is (number? (first block-ids)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-identifiers-chain-update-remove
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-id-chain")
               repo "add-id-chain-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       add-page-result (run-cli ["--graph" repo "upsert" "page" "--page" "ChainPage"] data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       page-id (first-result-id add-page-payload)
                       add-block-result (run-cli ["--graph" repo
                                                  "upsert" "block"
                                                  "--target-id" (str page-id)
                                                  "--content" "Chain block"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       block-id (first-result-id add-block-payload)
                       update-result (run-cli ["--graph" repo
                                               "upsert" "block"
                                               "--id" (str block-id)
                                               "--update-properties" "{:logseq.property/publishing-public? true}"]
                                              data-dir cfg-path)
                       update-payload (parse-json-output update-result)
                       remove-result (run-cli ["--graph" repo "remove" "block" "--id" (str block-id)] data-dir cfg-path)
                       remove-payload (parse-json-output remove-result)
                       query-after-remove (run-query data-dir cfg-path repo
                                                     "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                                                     (pr-str ["Chain block"]))
                       removed-id (get-in query-after-remove [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (number? page-id))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (number? block-id))
                 (is (= 0 (:exit-code update-result)))
                 (is (= "ok" (:status update-payload)))
                 (is (= 0 (:exit-code remove-result)))
                 (is (= "ok" (:status remove-payload)))
                 (is (nil? removed-id))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-page-create-and-update-existing
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-page-existing")
               repo "upsert-page-existing-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       create-result (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       page-id (first-result-id create-payload)
                       update-result (run-cli ["--graph" repo
                                               "upsert" "page"
                                               "--page" "Home"
                                               "--update-properties" "{:logseq.property/publishing-public? true}"]
                                              data-dir cfg-path)
                       update-payload (parse-json-output update-result)
                       update-id (first-result-id update-payload)
                       property-after-update (query-property data-dir cfg-path repo "Home"
                                                             ":logseq.property/publishing-public?")
                       remove-result (run-cli ["--graph" repo
                                               "upsert" "page"
                                               "--page" "Home"
                                               "--remove-properties" "[:logseq.property/publishing-public?]"]
                                              data-dir cfg-path)
                       remove-payload (parse-json-output remove-result)
                       remove-id (first-result-id remove-payload)
                       property-after-remove (query-property data-dir cfg-path repo "Home"
                                                             ":logseq.property/publishing-public?")
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-result)))
                 (is (= "ok" (:status create-payload)))
                 (is (number? page-id))
                 (is (= 0 (:exit-code update-result)))
                 (is (= "ok" (:status update-payload)))
                 (is (= page-id update-id))
                 (is (= true property-after-update))
                 (is (= 0 (:exit-code remove-result)))
                 (is (= "ok" (:status remove-payload)))
                 (is (= page-id remove-id))
                 (is (nil? property-after-remove))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-page-errors-on-missing-tags-properties
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-page-missing")
               repo "upsert-page-missing-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       missing-tag-result (run-cli ["--graph" repo
                                                    "upsert" "page"
                                                    "--page" "Home"
                                                    "--update-tags" "[\"MissingTag\"]"]
                                                   data-dir cfg-path)
                       missing-tag-payload (parse-json-output missing-tag-result)
                       missing-property-result (run-cli ["--graph" repo
                                                         "upsert" "page"
                                                         "--page" "Home"
                                                         "--update-properties" "{:not/a 1}"]
                                                        data-dir cfg-path)
                       missing-property-payload (parse-json-output missing-property-result)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "error" (:status missing-tag-payload)))
                 (is (= :tag-not-found (keyword (get-in missing-tag-payload [:error :code]))))
                 (is (= "error" (:status missing-property-payload)))
                 (is (= :invalid-options (keyword (get-in missing-property-payload [:error :code]))))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-id-mode-for-page-tag-property
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-id-mode")
               repo "upsert-id-mode-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       create-page-result (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       create-page-payload (parse-json-output create-page-result)
                       page-id (first-result-id create-page-payload)
                       update-page-result (run-cli ["--graph" repo
                                                    "upsert" "page"
                                                    "--id" (str page-id)
                                                    "--update-properties" "{:logseq.property/publishing-public? true}"]
                                                   data-dir cfg-path)
                       update-page-payload (parse-json-output update-page-result)
                       page-value (query-property data-dir cfg-path repo "Home" ":logseq.property/publishing-public?")
                       create-tag-result (run-cli ["--graph" repo "upsert" "tag" "--name" "StableTag"] data-dir cfg-path)
                       create-tag-payload (parse-json-output create-tag-result)
                       tag-id (first-result-id create-tag-payload)
                       noop-tag-result (run-cli ["--graph" repo "upsert" "tag" "--id" (str tag-id)] data-dir cfg-path)
                       noop-tag-payload (parse-json-output noop-tag-result)
                       create-property-result (run-cli ["--graph" repo
                                                        "upsert" "property"
                                                        "--name" "OwnerProp"
                                                        "--type" "default"]
                                                       data-dir cfg-path)
                       create-property-payload (parse-json-output create-property-result)
                       property-id (first-result-id create-property-payload)
                       property-name (common-util/page-name-sanity-lc "OwnerProp")
                       update-property-result (run-cli ["--graph" repo
                                                        "upsert" "property"
                                                        "--id" (str property-id)
                                                        "--type" "node"
                                                        "--cardinality" "many"]
                                                       data-dir cfg-path)
                       update-property-payload (parse-json-output update-property-result)
                       property-schema (run-query data-dir cfg-path repo
                                                  "[:find ?type . :in $ ?name :where [?p :block/name ?name] [?p :logseq.property/type ?type]]"
                                                  (pr-str [property-name]))
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-page-result)))
                 (is (= "ok" (:status create-page-payload)))
                 (is (number? page-id))
                 (is (= 0 (:exit-code update-page-result)))
                 (is (= "ok" (:status update-page-payload)))
                 (is (= page-id (first-result-id update-page-payload)))
                 (is (true? page-value))
                 (is (= 0 (:exit-code create-tag-result)))
                 (is (= "ok" (:status create-tag-payload)))
                 (is (number? tag-id))
                 (is (= 0 (:exit-code noop-tag-result)))
                 (is (= "ok" (:status noop-tag-payload)))
                 (is (= tag-id (first-result-id noop-tag-payload)))
                 (is (= 0 (:exit-code create-property-result)))
                 (is (= "ok" (:status create-property-payload)))
                 (is (number? property-id))
                 (is (= 0 (:exit-code update-property-result)))
                 (is (= "ok" (:status update-property-payload)))
                 (is (= property-id (first-result-id update-property-payload)))
                 (is (= "node" (get-in property-schema [:data :result])))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-rejects-legacy-flags-and-selector-conflict
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-legacy-options")
               repo "upsert-legacy-options-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       create-page-result (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       create-page-payload (parse-json-output create-page-result)
                       page-id (first-result-id create-page-payload)
                       legacy-block-result (run-cli ["--graph" repo
                                                     "upsert" "block"
                                                     "--target-page" "Home"
                                                     "--content" "Legacy block"
                                                     "--tags" "[\"Quote\"]"]
                                                    data-dir cfg-path)
                       legacy-page-result (run-cli ["--graph" repo
                                                    "upsert" "page"
                                                    "--page" "Home"
                                                    "--properties" "{:logseq.property/publishing-public? true}"]
                                                   data-dir cfg-path)
                       conflict-result (run-cli ["--graph" repo
                                                 "upsert" "page"
                                                 "--id" (str page-id)
                                                 "--page" "Home"]
                                                data-dir cfg-path)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-page-result)))
                 (is (= "ok" (:status create-page-payload)))
                 (is (= 1 (:exit-code legacy-block-result)))
                 (is (string/includes? (:output legacy-block-result) "invalid-options"))
                 (is (string/includes? (:output legacy-block-result) "--update-tags"))
                 (is (= 1 (:exit-code legacy-page-result)))
                 (is (string/includes? (:output legacy-page-result) "invalid-options"))
                 (is (string/includes? (:output legacy-page-result) "--update-properties"))
                 (is (= 1 (:exit-code conflict-result)))
                 (is (string/includes? (:output conflict-result) "invalid-options"))
                 (is (string/includes? (style/strip-ansi (:output conflict-result)) "only one of --id or --page"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-block-rewrites-page-ref
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-ref-rewrite")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "ref-rewrite-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "ref-rewrite-graph" "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       add-block-result (run-cli ["--graph" "ref-rewrite-graph"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "See [[New Page]]"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output-safe add-block-result "add-block")
                       _ (p/delay 100)
                       list-page-result (run-cli ["--graph" "ref-rewrite-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output-safe list-page-result "list-page")
                       page-titles (->> (get-in list-page-payload [:data :items])
                                        (map #(or (:block/title %) (:title %)))
                                        set)
                       query-payload (run-query data-dir cfg-path "ref-rewrite-graph"
                                                "[:find ?title :in $ ?page-name :where [?p :block/name ?page-name] [?b :block/page ?p] [?b :block/title ?title]]"
                                                (pr-str [(common-util/page-name-sanity-lc "Home")]))
                       titles (map first (get-in query-payload [:data :result]))
                       ref-title (some #(when (and (string? %)
                                                   (string/includes? % "See [[")
                                                   (string/includes? % "]]"))
                                          %)
                                       titles)
                       ref-value (when ref-title
                                   (second (first (re-seq #"\[\[(.*?)\]\]" ref-title))))
                       stop-result (run-cli ["server" "stop" "--graph" "ref-rewrite-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output-safe stop-result "server-stop")]
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (contains? page-titles "New Page"))
                 (is (string? ref-value))
                 (is (common-util/uuid-string? ref-value))
                 (is (string? ref-title))
                 (is (not (string/includes? ref-title "[[New Page]]")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-block-keeps-uuid-ref
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-uuid-ref")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "uuid-ref-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "uuid-ref-graph" "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       _ (run-cli ["--graph" "uuid-ref-graph"
                                   "upsert" "block"
                                   "--target-page" "Home"
                                   "--content" "Target block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       target-query-payload (run-query data-dir cfg-path "uuid-ref-graph"
                                                       "[:find ?uuid :in $ ?title :where [?b :block/title ?title] [?b :block/uuid ?uuid]]"
                                                       (pr-str ["Target block"]))
                       target-uuid (first (first (get-in target-query-payload [:data :result])))
                       add-block-result (run-cli ["--graph" "uuid-ref-graph"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" (str "See [[" target-uuid "]]")]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       list-page-result (run-cli ["--graph" "uuid-ref-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-titles (->> (get-in list-page-payload [:data :items])
                                        (map #(or (:block/title %) (:title %)))
                                        set)
                       ref-query-payload (run-query data-dir cfg-path "uuid-ref-graph"
                                                    "[:find ?title :in $ ?page-name :where [?p :block/name ?page-name] [?b :block/page ?p] [?b :block/title ?title]]"
                                                    (pr-str [(common-util/page-name-sanity-lc "Home")]))
                       titles (map first (get-in ref-query-payload [:data :result]))
                       ref-title (some #(when (and (string? %)
                                                   (string/includes? % (str "[[" target-uuid "]]")))
                                          %)
                                       titles)
                       stop-result (run-cli ["server" "stop" "--graph" "uuid-ref-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (string? target-uuid))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (not (contains? page-titles target-uuid)))
                 (is (string? ref-title))
                 (is (string/includes? ref-title (str "[[" target-uuid "]]")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-block-missing-uuid-ref-errors
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-missing-uuid-ref")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "missing-uuid-ref-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "missing-uuid-ref-graph" "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       missing-uuid (str (random-uuid))
                       add-block-result (run-cli ["--graph" "missing-uuid-ref-graph"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" (str "See [[" missing-uuid "]]")]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       stop-result (run-cli ["server" "stop" "--graph" "missing-uuid-ref-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 1 (:exit-code add-block-result)))
                 (is (= "error" (:status add-block-payload)))
                 (is (string/includes? (get-in add-block-payload [:error :message]) missing-uuid))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-tags-and-properties-by-name
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       add-page-result (run-cli ["--graph" "tags-graph"
                                                 "upsert" "page"
                                                 "--page" "TaggedPage"
                                                 "--update-tags" "[\"Quote\"]"
                                                 "--update-properties" "{:logseq.property/publishing-public? true}"]
                                                data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       add-block-result (run-cli ["--graph" "tags-graph"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "Tagged block"
                                                  "--update-tags" "[\"Quote\"]"
                                                  "--update-properties" "{:logseq.property/deadline \"2026-01-25T12:00:00Z\"}"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       add-block-ident-result (run-cli ["--graph" "tags-graph"
                                                        "upsert" "block"
                                                        "--target-page" "Home"
                                                        "--content" "Tagged block ident"
                                                        "--update-tags" "[:logseq.class/Quote-block]"]
                                                       data-dir cfg-path)
                       add-block-ident-payload (parse-json-output add-block-ident-result)
                       deadline-prop-title (get-in db-property/built-in-properties [:logseq.property/deadline :title])
                       publishing-prop-title (get-in db-property/built-in-properties [:logseq.property/publishing-public? :title])
                       add-page-title-result (run-cli ["--graph" "tags-graph"
                                                       "upsert" "page"
                                                       "--page" "TaggedPageTitle"
                                                       "--update-properties" (str "{\"" publishing-prop-title "\" true}")]
                                                      data-dir cfg-path)
                       add-page-title-payload (parse-json-output add-page-title-result)
                       add-block-title-result (run-cli ["--graph" "tags-graph"
                                                        "upsert" "block"
                                                        "--target-page" "Home"
                                                        "--content" "Tagged block title"
                                                        "--update-properties" (str "{\"" deadline-prop-title "\" \"2026-01-25T12:00:00Z\"}")]
                                                       data-dir cfg-path)
                       add-block-title-payload (parse-json-output add-block-title-result)
                       _ (p/delay 100)
                       block-tag-names (query-tags data-dir cfg-path repo "Tagged block")
                       block-ident-tag-names (query-tags data-dir cfg-path repo "Tagged block ident")
                       page-tag-names (query-tags data-dir cfg-path repo "TaggedPage")
                       page-value (query-property data-dir cfg-path repo "TaggedPage" ":logseq.property/publishing-public?")
                       page-title-value (query-property data-dir cfg-path repo "TaggedPageTitle" ":logseq.property/publishing-public?")
                       block-deadline (query-property data-dir cfg-path repo "Tagged block" ":logseq.property/deadline")
                       block-deadline-title (query-property data-dir cfg-path repo "Tagged block title" ":logseq.property/deadline")
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (= 0 (:exit-code add-block-ident-result)))
                 (is (= "ok" (:status add-block-ident-payload)))
                 (is (string? deadline-prop-title))
                 (is (string? publishing-prop-title))
                 (is (= 0 (:exit-code add-page-title-result)))
                 (is (= "ok" (:status add-page-title-payload)))
                 (is (= 0 (:exit-code add-block-title-result)))
                 (is (= "ok" (:status add-block-title-payload)))
                 (is (contains? block-tag-names "Quote"))
                 (is (contains? block-ident-tag-names "Quote"))
                 (is (contains? page-tag-names "Quote"))
                 (is (true? page-value))
                 (is (true? page-title-value))
                 (is (number? block-deadline))
                 (is (number? block-deadline-title))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-tags-and-properties-by-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags-id")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       list-tag-payload (list-items data-dir cfg-path repo "tag")
                       quote-tag-id (find-item-id (get-in list-tag-payload [:data :items]) "Quote")
                       list-property-payload (list-items data-dir cfg-path repo "property")
                       deadline-title (get-in db-property/built-in-properties [:logseq.property/deadline :title])
                       publishing-title (get-in db-property/built-in-properties [:logseq.property/publishing-public? :title])
                       deadline-id (find-item-id (get-in list-property-payload [:data :items]) deadline-title)
                       publishing-id (find-item-id (get-in list-property-payload [:data :items]) publishing-title)
                       add-page-id-result (run-cli ["--graph" repo
                                                    "upsert" "page"
                                                    "--page" "TaggedPageId"
                                                    "--update-tags" (pr-str [quote-tag-id])
                                                    "--update-properties" (pr-str {publishing-id true})]
                                                   data-dir cfg-path)
                       add-page-id-payload (parse-json-output add-page-id-result)
                       add-block-id-result (run-cli ["--graph" repo
                                                     "upsert" "block"
                                                     "--target-page" "Home"
                                                     "--content" "Tagged block id"
                                                     "--update-tags" (pr-str [quote-tag-id])
                                                     "--update-properties" (pr-str {deadline-id "2026-01-25T12:00:00Z"})]
                                                    data-dir cfg-path)
                       add-block-id-payload (parse-json-output add-block-id-result)
                       _ (p/delay 100)
                       page-id-value (query-property data-dir cfg-path repo "TaggedPageId" ":logseq.property/publishing-public?")
                       block-deadline-id (query-property data-dir cfg-path repo "Tagged block id" ":logseq.property/deadline")
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= "ok" (:status list-tag-payload)))
                 (is (number? quote-tag-id))
                 (is (= "ok" (:status list-property-payload)))
                 (is (number? deadline-id))
                 (is (number? publishing-id))
                 (is (= 0 (:exit-code add-page-id-result))
                     (pr-str (:error add-page-id-payload)))
                 (is (= "ok" (:status add-page-id-payload)))
                 (is (= 0 (:exit-code add-block-id-result))
                     (pr-str (:error add-block-id-payload)))
                 (is (= "ok" (:status add-block-id-payload)))
                 (is (true? page-id-value))
                 (is (number? block-deadline-id))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-properties-human-output
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-show-properties")
               repo "show-properties-graph"
               repo-id (command-core/resolve-repo repo)]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       cfg (cli-config/resolve-config {:data-dir data-dir
                                                       :config-path cfg-path
                                                       :output-format :json})
                       server (cli-server/ensure-server! cfg repo)
                       property-ident :user.property/acceptance-criteria
                       import-data {:properties {property-ident {:logseq.property/type :default
                                                                 :block/title "Acceptance Criteria"}}
                                    :pages-and-blocks [{:page {:block/title "PropsPage"}
                                                        :blocks [{:block/title "Property block"
                                                                  :build/properties {property-ident "First requirement"}}
                                                                 {:block/title "Sibling block"}]}]}
                       wait-for-property (fn wait-for-property [attempt]
                                           (p/let [value (transport/invoke server :thread-api/q false
                                                                           [repo-id
                                                                            ['[:find ?v .
                                                                               :in $ ?title ?prop
                                                                               :where
                                                                               [?b :block/title ?title]
                                                                               [?b ?prop ?v]]
                                                                             "Property block"
                                                                             property-ident]])]
                                             (if (or value (>= attempt 20))
                                               value
                                               (p/let [_ (p/delay 100)]
                                                 (wait-for-property (inc attempt))))))
                       _ (transport/invoke server :thread-api/apply-outliner-ops false
                                           [repo-id [[:batch-import-edn [import-data {}]]] {}])
                       _ (p/delay 100)
                       _ (wait-for-property 0)
                       page-name (common-util/page-name-sanity-lc "PropsPage")
                       page-entity (transport/invoke server :thread-api/pull false
                                                     [repo-id [:db/id :block/name :block/title] [:block/name page-name]])
                       _ (when-not (:db/id page-entity)
                           (throw (ex-info "page not found in server" {:page page-name})))
                       show-config (assoc cfg :output-format :human)
                       show-result (show-command/execute-show {:type :show
                                                               :repo repo-id
                                                               :page page-name}
                                                              show-config)
                       output (get-in show-result [:data :message])
                       output* (style/strip-ansi output)
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= :ok (:status show-result)))
                 (is (string/includes? output* "│   Acceptance Criteria: First requirement"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-verbose-logs-to-stderr
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-verbose")
               repo "verbose-graph"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       {:keys [buffer restore!]} (capture-stderr!)
                       result (-> (run-cli ["--verbose" "--graph" repo "graph" "info"] data-dir cfg-path)
                                  (p/finally (fn [] (restore!))))
                       payload (parse-json-output-safe result "verbose graph info")
                       stderr-text @buffer
                       _ (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)]
                 (is (= 0 (:exit-code result)))
                 (is (= "ok" (:status payload)))
                 (is (string/includes? stderr-text ":cli.transport/invoke"))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-update-tags-and-properties
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-update-tags")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       tag-a-name "Quote"
                       tag-b-name "Math"
                       add-block-result (run-cli ["--graph" repo
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "Update block"
                                                  "--update-tags" "[:logseq.class/Quote-block]"
                                                  "--update-properties" "{:logseq.property/publishing-public? true}"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       show-home (run-cli ["--graph" repo "show" "--page" "Home"] data-dir cfg-path)
                       show-home-payload (parse-json-output show-home)
                       block-node (find-block-by-title (get-in show-home-payload [:data :root]) "Update block")
                       block-id (node-id block-node)
                       update-result (run-cli ["--graph" repo
                                               "upsert" "block"
                                               "--id" (str block-id)
                                               "--update-tags" "[:logseq.class/Math-block]"
                                               "--remove-tags" "[:logseq.class/Quote-block]"
                                               "--update-properties" "{:logseq.property/deadline \"2026-01-25T12:00:00Z\"}"
                                               "--remove-properties" "[:logseq.property/publishing-public?]"]
                                              data-dir cfg-path)
                       update-payload (parse-json-output update-result)
                       _ (p/delay 300)
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (string? tag-a-name))
                 (is (string? tag-b-name))
                 (is (some? block-id))
                 (is (= "ok" (:status update-payload)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-block-update-custom-property
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-block-custom-property")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       upsert-property-result (run-cli ["--graph" repo
                                                       "upsert" "property"
                                                       "--name" "owner"
                                                       "--type" "default"]
                                                      data-dir cfg-path)
                       upsert-property-payload (parse-json-output upsert-property-result)
                       add-block-result (run-cli ["--graph" repo
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "Block with custom property"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       show-home (run-cli ["--graph" repo "show" "--page" "Home"] data-dir cfg-path)
                       show-home-payload (parse-json-output show-home)
                       block-node (find-block-by-title (get-in show-home-payload [:data :root]) "Block with custom property")
                       block-id (node-id block-node)
                       update-result (run-cli ["--graph" repo
                                               "upsert" "block"
                                               "--id" (str block-id)
                                               "--update-properties" "{:user.property/owner \"alice\"}"]
                                              data-dir cfg-path)
                       update-payload (parse-json-output update-result)
                       _ (p/delay 100)
                       property-after-update (query-property data-dir cfg-path repo "Block with custom property"
                                                             ":user.property/owner")
                       remove-result (run-cli ["--graph" repo
                                               "upsert" "block"
                                               "--id" (str block-id)
                                               "--remove-properties" "[:user.property/owner]"]
                                              data-dir cfg-path)
                       remove-payload (parse-json-output remove-result)
                       _ (p/delay 100)
                       property-after-remove (query-property data-dir cfg-path repo "Block with custom property"
                                                             ":user.property/owner")
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= 0 (:exit-code upsert-property-result)))
                 (is (= "ok" (:status upsert-property-payload)))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (some? block-id))
                 (is (= 0 (:exit-code update-result)))
                 (is (= "ok" (:status update-payload)))
                 (is (some? property-after-update))
                 (is (= 0 (:exit-code remove-result)))
                 (is (= "ok" (:status remove-payload)))
                 (is (nil? property-after-remove))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-tags-rejects-missing-tag
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags-missing")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "tags-missing-graph"] data-dir cfg-path)
                       add-block-result (run-cli ["--graph" "tags-missing-graph"
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "Block with missing tag"
                                                  "--update-tags" "[\"MissingTag\"]"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       list-tag-result (run-cli ["--graph" "tags-missing-graph" "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:block/name %)))
                                      set)
                       stop-result (run-cli ["server" "stop" "--graph" "tags-missing-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "error" (:status add-block-payload)))
                 (is (= :tag-not-found (keyword (get-in add-block-payload [:error :code]))))
                 (is (not (contains? tag-names "MissingTag")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-tag-create-and-use
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-tag-create")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-tag-create-graph"
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       _ (run-cli ["--graph" repo "upsert" "page" "--page" "Home"] data-dir cfg-path)
                       upsert-tag-result (run-cli ["--graph" repo
                                                   "upsert" "tag"
                                                   "--name" "CliQuote"]
                                                  data-dir cfg-path)
                       upsert-tag-payload (parse-json-output upsert-tag-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:title %) (:name %)))
                                      set)
                       add-block-result (run-cli ["--graph" repo
                                                  "upsert" "block"
                                                  "--target-page" "Home"
                                                  "--content" "Tagged by upsert tag"
                                                  "--update-tags" "[\"CliQuote\"]"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       block-tag-names (query-tags data-dir cfg-path repo "Tagged by upsert tag")
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code upsert-tag-result))
                     (pr-str (:error upsert-tag-payload)))
                 (is (= "ok" (:status upsert-tag-payload)))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (contains? tag-names "CliQuote"))
                 (is (= 0 (:exit-code add-block-result))
                     (pr-str (:error add-block-payload)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (contains? block-tag-names "CliQuote"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-tag-rejects-existing-non-tag-page
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-tag-conflict")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-tag-conflict-graph"
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       _ (run-cli ["--graph" repo "upsert" "page" "--page" "ConflictPage"] data-dir cfg-path)
                       upsert-tag-result (run-cli ["--graph" repo
                                                   "upsert" "tag"
                                                   "--name" "ConflictPage"]
                                                  data-dir cfg-path)
                       upsert-tag-payload (parse-json-output upsert-tag-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:title %) (:name %)))
                                      set)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 1 (:exit-code upsert-tag-result)))
                 (is (= "error" (:status upsert-tag-payload)))
                 (is (string/includes? (get-in upsert-tag-payload [:error :message])
                                       "already exists as a page and is not a tag"))
                 (is (not (contains? tag-names "ConflictPage")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-tag-idempotent-existing-tag
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-tag-idempotent")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-tag-idempotent-graph"
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       first-upsert-result (run-cli ["--graph" repo "upsert" "tag" "--name" "StableTag"]
                                                    data-dir cfg-path)
                       first-upsert-payload (parse-json-output first-upsert-result)
                       second-upsert-result (run-cli ["--graph" repo "upsert" "tag" "--name" "StableTag"]
                                                     data-dir cfg-path)
                       second-upsert-payload (parse-json-output second-upsert-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       stable-tags (->> (get-in list-tag-payload [:data :items])
                                        (filter #(= "StableTag" (or (:block/title %) (:title %) (:name %)))))
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code first-upsert-result)))
                 (is (= "ok" (:status first-upsert-payload)))
                 (is (= 0 (:exit-code second-upsert-result)))
                 (is (= "ok" (:status second-upsert-payload)))
                 (is (= 1 (count stable-tags)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-tag-id-rename
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-tag-id-rename")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-tag-id-rename-graph"
                       source-name "CliRenameSource"
                       target-name "CliRenameTarget"
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       create-result (run-cli ["--graph" repo "upsert" "tag" "--name" source-name]
                                              data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       source-id (first-result-id create-payload)
                       rename-result (run-cli ["--graph" repo
                                               "upsert" "tag"
                                               "--id" (str source-id)
                                               "--name" target-name]
                                              data-dir cfg-path)
                       rename-payload (parse-json-output rename-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tags (get-in list-tag-payload [:data :items])
                       tag-names (->> tags
                                      (map #(or (:block/title %) (:title %) (:name %)))
                                      set)
                       target-id (find-item-id tags target-name)
                       source-id-after (find-item-id tags source-name)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-result)))
                 (is (= "ok" (:status create-payload)))
                 (is (number? source-id))
                 (is (= 0 (:exit-code rename-result))
                     (pr-str rename-payload))
                 (is (= "ok" (:status rename-payload))
                     (pr-str rename-payload))
                 (is (= [source-id] (get-in rename-payload [:data :result])))
                 (is (contains? tag-names target-name))
                 (is (not (contains? tag-names source-name)))
                 (is (= source-id target-id))
                 (is (nil? source-id-after))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-tag-id-rename-conflict
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-tag-id-rename-conflict")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-tag-id-rename-conflict-graph"
                       source-name "CliRenameConflictSource"
                       existing-name "CliRenameConflictExisting"
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       source-upsert-result (run-cli ["--graph" repo "upsert" "tag" "--name" source-name]
                                                     data-dir cfg-path)
                       source-upsert-payload (parse-json-output source-upsert-result)
                       source-id (first-result-id source-upsert-payload)
                       existing-upsert-result (run-cli ["--graph" repo "upsert" "tag" "--name" existing-name]
                                                       data-dir cfg-path)
                       existing-upsert-payload (parse-json-output existing-upsert-result)
                       rename-result (run-cli ["--graph" repo
                                               "upsert" "tag"
                                               "--id" (str source-id)
                                               "--name" existing-name]
                                              data-dir cfg-path)
                       rename-payload (parse-json-output rename-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:title %) (:name %)))
                                      set)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code source-upsert-result)))
                 (is (= "ok" (:status source-upsert-payload)))
                 (is (number? source-id))
                 (is (= 0 (:exit-code existing-upsert-result)))
                 (is (= "ok" (:status existing-upsert-payload)))
                 (is (= 1 (:exit-code rename-result)))
                 (is (= "error" (:status rename-payload)))
                 (is (= :tag-rename-conflict (keyword (get-in rename-payload [:error :code]))))
                 (is (contains? tag-names source-name))
                 (is (contains? tag-names existing-name))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-and-remove-tag-property
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-upsert-remove-tag-property")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       repo "upsert-remove-tag-property-graph"
                       tag-name "CliQuoteTagX"
                       property-name "CliOwnerPropX"
                       property-name-lc (common-util/page-name-sanity-lc property-name)
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" repo] data-dir cfg-path)
                       upsert-tag-result (run-cli ["--graph" repo "upsert" "tag" "--name" tag-name] data-dir cfg-path)
                       upsert-tag-payload (parse-json-output upsert-tag-result)
                       upsert-property-result (run-cli ["--graph" repo
                                                        "upsert" "property"
                                                        "--name" property-name
                                                        "--type" "node"
                                                        "--cardinality" "many"]
                                                       data-dir cfg-path)
                       upsert-property-payload (parse-json-output upsert-property-result)
                       update-property-result (run-cli ["--graph" repo
                                                        "upsert" "property"
                                                        "--name" property-name
                                                        "--type" "node"
                                                        "--cardinality" "one"]
                                                       data-dir cfg-path)
                       update-property-payload (parse-json-output update-property-result)
                       property-schema-before-remove (run-query data-dir cfg-path repo
                                                                "[:find ?type ?cardinality :in $ ?name :where [?p :block/name ?name] [?p :logseq.property/type ?type] [?p :db/cardinality ?cardinality]]"
                                                                (pr-str [property-name-lc]))
                       remove-tag-result (run-cli ["--graph" repo "remove" "tag" "--name" tag-name] data-dir cfg-path)
                       remove-tag-payload (parse-json-output remove-tag-result)
                       remove-property-result (run-cli ["--graph" repo "remove" "property" "--name" property-name] data-dir cfg-path)
                       remove-property-payload (parse-json-output remove-property-result)
                       list-tag-result (run-cli ["--graph" repo "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["--graph" repo "list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:title %) (:name %)))
                                      set)
                       property-names (->> (get-in list-property-payload [:data :items])
                                           (map #(or (:block/title %) (:title %) (:name %)))
                                           set)
                       stop-result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code upsert-tag-result)))
                 (is (= "ok" (:status upsert-tag-payload)))
                 (is (= 0 (:exit-code upsert-property-result)))
                 (is (= "ok" (:status upsert-property-payload)))
                 (is (= 0 (:exit-code update-property-result)))
                 (is (= "ok" (:status update-property-payload)))
                 (is (= [["node" "one"]]
                        (get-in property-schema-before-remove [:data :result])))
                 (is (= 0 (:exit-code remove-tag-result)))
                 (is (= "ok" (:status remove-tag-payload))
                     (pr-str remove-tag-payload))
                 (is (= 0 (:exit-code remove-property-result)))
                 (is (= "ok" (:status remove-property-payload))
                     (pr-str remove-property-payload))
                 (is (not (contains? tag-names tag-name)))
                 (is (not (contains? property-names property-name)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query")
               query-text "[:find ?e :in $ ?title :where [?e :block/title ?title]]"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" "query-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       _ (run-cli ["--graph" "query-graph" "upsert" "page" "--page" "QueryPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "query-graph" "upsert" "block"
                                   "--target-page" "QueryPage"
                                   "--content" "Query block"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "query-graph" "upsert" "block"
                                   "--target-page" "QueryPage"
                                   "--content" "Query block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-result (run-cli ["--graph" "query-graph"
                                              "query"
                                              "--query" query-text
                                              "--inputs" "[\"Query block\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       result (get-in query-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" "query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query-task-search
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-task-query")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" "task-query-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       _ (run-cli ["--graph" "task-query-graph" "upsert" "page" "--page" "Tasks"] data-dir cfg-path)
                       _ (run-cli ["--graph" "task-query-graph"
                                   "upsert" "block"
                                   "--target-page" "Tasks"
                                   "--content" "Task one"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "task-query-graph"
                                   "upsert" "block"
                                   "--target-page" "Tasks"
                                   "--content" "Task two"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "task-query-graph"
                                   "upsert" "block"
                                   "--target-page" "Tasks"
                                   "--content" "Task three"
                                   "--status" "todo"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       task-entry (some (fn [entry]
                                          (when (= "task-search" (:name entry)) entry))
                                        (get-in list-payload [:data :queries]))
                       query-result (run-cli ["--graph" "task-query-graph"
                                              "query"
                                              "--name" "task-search"
                                              "--inputs" "[\"doing\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       query-nil-result (run-cli ["--graph" "task-query-graph"
                                                  "query"
                                                  "--name" "task-search"
                                                  "--inputs" "[\"doing\" nil 1]"]
                                                 data-dir cfg-path)
                       query-nil-payload (parse-json-output query-nil-result)
                       result (get-in query-payload [:data :result])
                       nil-result (get-in query-nil-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" "task-query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= "ok" (:status list-payload)))
                 (is (= [{:name "search-status"}
                         {:name "?search-title" :default ""}
                         {:name "?recent-days" :default 0}]
                        (:inputs task-entry)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= 0 (:exit-code query-nil-result)))
                 (is (= "ok" (:status query-nil-payload)))
                 (is (vector? nil-result))
                 (is (= 2 (count nil-result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query-list-status-priority
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-status-query")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" "status-query-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       _ (p/delay 100)
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       names (set (map :name (get-in list-payload [:data :queries])))
                       status-result (run-cli ["--graph" "status-query-graph"
                                               "query"
                                               "--name" "list-status"]
                                              data-dir cfg-path)
                       status-payload (parse-json-output status-result)
                       status-values (get-in status-payload [:data :result])
                       priority-result (run-cli ["--graph" "status-query-graph"
                                                 "query"
                                                 "--name" "list-priority"]
                                                data-dir cfg-path)
                       priority-payload (parse-json-output priority-result)
                       priority-values (get-in priority-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--graph" "status-query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= "ok" (:status list-payload)))
                 (is (contains? names "list-status"))
                 (is (contains? names "list-priority"))
                 (is (= 0 (:exit-code status-result)))
                 (is (= "ok" (:status status-payload)))
                 (is (vector? status-values))
                 (when (seq status-values)
                   (let [row (first status-values)
                         value (if (vector? row) (first row) row)]
                     (is (map? value))
                     (is (contains? value :ident))
                     (is (contains? value :id))))
                 (is (= 0 (:exit-code priority-result)))
                 (is (= "ok" (:status priority-payload)))
                 (is (vector? priority-values))
                 (when (seq priority-values)
                   (let [row (first priority-values)
                         value (if (vector? row) (first row) row)]
                     (is (map? value))
                     (is (contains? value :ident))
                     (is (contains? value :id))))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query-recent-updated
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-recent-updated")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "recent-updated-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "recent-updated-graph" "upsert" "page" "--page" "RecentPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "recent-updated-graph" "upsert" "block"
                                   "--target-page" "RecentPage"
                                   "--content" "Recent block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       list-page-result (run-cli ["--graph" "recent-updated-graph" "list" "page" "--expand"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "RecentPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       show-result (run-cli ["--graph" "recent-updated-graph"
                                             "show"
                                             "--page" "RecentPage"]
                                            data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       show-root (get-in show-payload [:data :root])
                       block-node (find-block-by-title show-root "Recent block")
                       block-id (or (:db/id block-node) (:id block-node))
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       recent-entry (some (fn [entry]
                                            (when (= "recent-updated" (:name entry)) entry))
                                          (get-in list-payload [:data :queries]))
                       now-ms (js/Date.now)
                       query-result (run-cli ["--graph" "recent-updated-graph"
                                              "query"
                                              "--name" "recent-updated"
                                              "--inputs" (pr-str [1 now-ms])]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       result (get-in query-payload [:data :result])
                       future-now-ms (+ now-ms (* 10 86400000))
                       future-query-result (run-cli ["--graph" "recent-updated-graph"
                                                     "query"
                                                     "--name" "recent-updated"
                                                     "--inputs" (pr-str [1 future-now-ms])]
                                                    data-dir cfg-path)
                       future-query-payload (parse-json-output future-query-result)
                       future-result (get-in future-query-payload [:data :result])
                       zero-result (run-cli ["--graph" "recent-updated-graph"
                                             "query"
                                             "--name" "recent-updated"
                                             "--inputs" "[0]"]
                                            data-dir cfg-path)
                       zero-payload (parse-json-output zero-result)
                       nil-result (run-cli ["--graph" "recent-updated-graph"
                                            "query"
                                            "--name" "recent-updated"
                                            "--inputs" "[nil]"]
                                           data-dir cfg-path)
                       nil-payload (parse-json-output nil-result)
                       neg-result (run-cli ["--graph" "recent-updated-graph"
                                            "query"
                                            "--name" "recent-updated"
                                            "--inputs" "[-1]"]
                                           data-dir cfg-path)
                       neg-payload (parse-json-output neg-result)
                       stop-result (run-cli ["server" "stop" "--graph" "recent-updated-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (some? page-id))
                 (is (some? block-id))
                 (is (= "ok" (:status list-payload)))
                 (is (= [{:name "recent-days"}] (:inputs recent-entry)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (contains? (set result) page-id))
                 (is (contains? (set result) block-id))
                 (is (= 0 (:exit-code future-query-result)))
                 (is (= "ok" (:status future-query-payload)))
                 (is (vector? future-result))
                 (is (empty? future-result))
                 (is (= 1 (:exit-code zero-result)))
                 (is (= "error" (:status zero-payload)))
                 (is (= "invalid-options" (get-in zero-payload [:error :code])))
                 (is (= 1 (:exit-code nil-result)))
                 (is (= "error" (:status nil-payload)))
                 (is (= "invalid-options" (get-in nil-payload [:error :code])))
                 (is (= 1 (:exit-code neg-result)))
                 (is (= "error" (:status neg-payload)))
                 (is (= "invalid-options" (get-in neg-payload [:error :code])))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-resolve-nested-uuid-refs
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-nested-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "nested-refs"] data-dir cfg-path)
                       _ (run-cli ["--graph" "nested-refs" "upsert" "page" "--page" "NestedPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "nested-refs" "upsert" "block" "--target-page" "NestedPage" "--content" "Inner"] data-dir cfg-path)
                       show-nested (run-cli ["--graph" "nested-refs" "show" "--page" "NestedPage"] data-dir cfg-path)
                       show-nested-payload (parse-json-output show-nested)
                       _inner-node (find-block-by-title (get-in show-nested-payload [:data :root]) "Inner")
                       inner-uuid (query-block-uuid-by-title data-dir cfg-path "nested-refs" "Inner")
                       middle-content (str "See [[" inner-uuid "]]")
                       _ (run-cli ["--graph" "nested-refs" "upsert" "block" "--target-page" "NestedPage"
                                   "--content" middle-content] data-dir cfg-path)
                       show-middle (run-cli ["--graph" "nested-refs" "show" "--page" "NestedPage"] data-dir cfg-path)
                       show-middle-payload (parse-json-output show-middle)
                       _middle-node (find-block-by-title (get-in show-middle-payload [:data :root]) middle-content)
                       middle-uuid (query-block-uuid-by-title data-dir cfg-path "nested-refs" middle-content)
                       _ (run-cli ["--graph" "nested-refs" "upsert" "block" "--target-page" "NestedPage"
                                   "--content" (str "Outer [[" middle-uuid "]]")] data-dir cfg-path)
                       show-outer (run-cli ["--graph" "nested-refs" "show" "--page" "NestedPage"] data-dir cfg-path)
                       show-outer-payload (parse-json-output show-outer)
                       outer-node (find-block-by-title (get-in show-outer-payload [:data :root]) "Outer [[See [[Inner]]]]")
                       stop-result (run-cli ["server" "stop" "--graph" "nested-refs"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? inner-uuid))
                 (is (some? middle-uuid))
                 (is (some? outer-node))
                 (is (= "Outer [[See [[Inner]]]]" (node-title outer-node)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-linked-references-json
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "page" "--page" "SourcePage"] data-dir cfg-path)
                       target-show (run-cli ["--graph" "linked-refs-graph" "show" "--page" "TargetPage"] data-dir cfg-path)
                       _target-show-payload (parse-json-output target-show)
                       target-uuid (query-block-uuid-by-title data-dir cfg-path "linked-refs-graph" "TargetPage")
                       target-title "TargetPage"
                       ref-content (str "See [[" target-uuid "]]")
                       ref-title (str "See [[" target-title "]]")
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "block" "--target-page" "SourcePage" "--content" ref-content] data-dir cfg-path)
                       _ (p/delay 100)
                       source-show (run-cli ["--graph" "linked-refs-graph" "show" "--page" "SourcePage"] data-dir cfg-path)
                       source-payload (parse-json-output source-show)
                       ref-node (find-block-by-title (get-in source-payload [:data :root]) ref-title)
                       ref-id (or (:db/id ref-node) (:id ref-node))
                       target-show (run-cli ["--graph" "linked-refs-graph" "show" "--page" "TargetPage"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       linked-refs (get-in target-payload [:data :linked-references])
                       linked-blocks (:blocks linked-refs)
                       linked-ids (set (map #(or (:db/id %) (:id %)) linked-blocks))
                       linked-page-titles (set (keep (fn [block]
                                                       (or (get-in block [:block/page :block/title])
                                                           (get-in block [:block/page :block/name])
                                                           (get-in block [:page :title])
                                                           (get-in block [:page :name])))
                                                     linked-blocks))
                       stop-result (run-cli ["server" "stop" "--graph" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? target-uuid))
                 (is (= "ok" (:status target-payload)))
                 (is (some? ref-id))
                 (is (contains? linked-ids ref-id))
                 (is (contains? linked-page-titles "SourcePage"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-upsert-block-update-move
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-move")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "move-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "move-graph" "upsert" "page" "--page" "SourcePage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "move-graph" "upsert" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "move-graph" "upsert" "block" "--target-page" "SourcePage" "--content" "Parent Block"] data-dir cfg-path)
                       _ (p/delay 100)
                       source-show (run-cli ["--graph" "move-graph" "show" "--page" "SourcePage"] data-dir cfg-path)
                       source-payload (parse-json-output source-show)
                       parent-node (find-block-by-title (get-in source-payload [:data :root]) "Parent Block")
                       parent-id (node-id parent-node)
                       _ (run-cli ["--graph" "move-graph" "upsert" "block" "--target-id" (str parent-id) "--content" "Child Block"] data-dir cfg-path)
                       update-result (run-cli ["--graph" "move-graph" "upsert" "block" "--id" (str parent-id) "--target-page" "TargetPage"] data-dir cfg-path)
                       update-payload (parse-json-output update-result)
                       target-show (run-cli ["--graph" "move-graph" "show" "--page" "TargetPage"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       moved-node (find-block-by-title (get-in target-payload [:data :root]) "Parent Block")
                       child-node (find-block-by-title moved-node "Child Block")
                       stop-result (run-cli ["server" "stop" "--graph" "move-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status update-payload)))
                 (is (some? parent-id))
                 (is (some? moved-node))
                 (is (some? child-node))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-add-block-pos-ordering
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-pos")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "add-pos-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "add-pos-graph" "upsert" "page" "--page" "PosPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "add-pos-graph" "upsert" "block" "--target-page" "PosPage" "--content" "Parent"] data-dir cfg-path)
                       _ (p/delay 100)
                       parent-show (run-cli ["--graph" "add-pos-graph" "show" "--page" "PosPage"] data-dir cfg-path)
                       parent-payload (parse-json-output parent-show)
                       parent-node (find-block-by-title (get-in parent-payload [:data :root]) "Parent")
                       parent-id (node-id parent-node)
                       _ (run-cli ["--graph" "add-pos-graph" "upsert" "block" "--target-id" (str parent-id) "--pos" "first-child" "--content" "First"] data-dir cfg-path)
                       _ (run-cli ["--graph" "add-pos-graph" "upsert" "block" "--target-id" (str parent-id) "--pos" "last-child" "--content" "Last"] data-dir cfg-path)
                       final-show (run-cli ["--graph" "add-pos-graph" "show" "--page" "PosPage"] data-dir cfg-path)
                       final-payload (parse-json-output final-show)
                       final-parent (find-block-by-title (get-in final-payload [:data :root]) "Parent")
                       child-titles (map node-title (node-children final-parent))
                       stop-result (run-cli ["server" "stop" "--graph" "add-pos-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? parent-id))
                 (is (= ["First" "Last"] (vec child-titles)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-output-formats-graph-list
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       json-result (run-cli ["graph" "list" "--output" "json"] data-dir cfg-path)
                       json-payload (parse-json-output json-result)
                       edn-result (run-cli ["graph" "list" "--output" "edn"] data-dir cfg-path)
                       edn-payload (parse-edn-output edn-result)
                       human-result (run-cli ["graph" "list" "--output" "human"] data-dir cfg-path)]
                 (is (= 0 (:exit-code json-result)))
                 (is (= "ok" (:status json-payload)))
                 (is (= 0 (:exit-code edn-result)))
                 (is (= :ok (:status edn-payload)))
                 (is (not (string/starts-with? (:output human-result) "{:status")))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-list-outputs-include-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "list-id-graph"] data-dir cfg-path)
                       _ (run-cli ["upsert" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       list-tag-result (run-cli ["list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       stop-result (run-cli ["server" "stop" "--graph" "list-id-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (every? #(contains? % :id) (get-in list-page-payload [:data :items])))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (every? #(contains? % :id) (get-in list-tag-payload [:data :items])))
                 (is (= "ok" (:status list-property-payload)))
                 (is (every? #(contains? % :id) (get-in list-property-payload [:data :items])))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-list-page-human-output
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "human-list-graph"] data-dir cfg-path)
                       _ (run-cli ["upsert" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page" "--output" "human"] data-dir cfg-path)
                       output (:output list-page-result)]
                 (is (= 0 (:exit-code list-page-result)))
                 (is (string/includes? output "TITLE"))
                 (is (string/includes? output "TestPage"))
                 (is (string/includes? output "Count:"))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-page-block-by-id-and-uuid
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "show-page-block-graph"] data-dir cfg-path)
                       _ (run-cli ["upsert" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page" "--expand"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "TestPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       page-uuid (or (:block/uuid page-item) (:uuid page-item))
                       show-by-id-result (run-cli ["show" "--id" (str page-id)] data-dir cfg-path)
                       show-by-id-payload (parse-json-output show-by-id-result)
                       show-by-uuid-result (run-cli ["show" "--uuid" (str page-uuid)] data-dir cfg-path)
                       show-by-uuid-payload (parse-json-output show-by-uuid-result)
                       stop-result (run-cli ["server" "stop" "--graph" "show-page-block-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (some? page-item))
                 (is (some? page-id))
                 (is (some? page-uuid))
                 (is (= "ok" (:status show-by-id-payload)))
                 (is (= page-id (or (get-in show-by-id-payload [:data :root :db/id])
                                    (get-in show-by-id-payload [:data :root :id]))))
                 (is (not (contains? (get-in show-by-id-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status show-by-uuid-payload)))
                 (is (= page-id (or (get-in show-by-uuid-payload [:data :root :db/id])
                                    (get-in show-by-uuid-payload [:data :root :id]))))
                 (is (not (contains? (get-in show-by-uuid-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-multi-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-multi-id")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "show-multi-id-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "show-multi-id-graph" "upsert" "page" "--page" "MultiPage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "show-multi-id-graph" "upsert" "block"
                                   "--target-page" "MultiPage"
                                   "--content" "Multi show one"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "show-multi-id-graph" "upsert" "block"
                                   "--target-page" "MultiPage"
                                   "--content" "Multi show two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                       query-one-result (run-cli ["--graph" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show one"])]
                                                 data-dir cfg-path)
                       query-one-payload (parse-json-output query-one-result)
                       block-one-id (get-in query-one-payload [:data :result])
                       query-two-result (run-cli ["--graph" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show two"])]
                                                 data-dir cfg-path)
                       query-two-payload (parse-json-output query-two-result)
                       block-two-id (get-in query-two-payload [:data :result])
                       ids-edn (str "[" block-one-id " " block-two-id "]")
                       show-text-result (run-cli ["--graph" "show-multi-id-graph" "show"
                                                  "--id" ids-edn

                                                  "--output" "human"]
                                                 data-dir cfg-path)
                       output (:output show-text-result)
                       idx-one (string/index-of output "Multi show one")
                       idx-two (string/index-of output "Multi show two")
                       idx-delim (string/index-of output "================================================================")
                       show-json-result (run-cli ["--graph" "show-multi-id-graph" "show"
                                                  "--id" ids-edn]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--graph" "show-multi-id-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code query-one-result)))
                 (is (= "ok" (:status query-one-payload)))
                 (is (= 0 (:exit-code query-two-result)))
                 (is (= "ok" (:status query-two-payload)))
                 (is (some? block-one-id))
                 (is (some? block-two-id))
                 (is (= 0 (:exit-code show-text-result)))
                 (is (string/includes? output "Multi show one"))
                 (is (string/includes? output "Multi show two"))
                 (is (some? idx-delim))
                 (is (< idx-one idx-delim idx-two))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (= 2 (count show-data)))
                 (is (contains? root-titles "Multi show one"))
                 (is (contains? root-titles "Multi show two"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-multi-id-filters-contained
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-multi-id-contained")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "show-multi-id-contained-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "show-multi-id-contained-graph" "upsert" "page" "--page" "ParentPage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "show-multi-id-contained-graph" "upsert" "block"
                                   "--target-page" "ParentPage"
                                   "--content" "Parent Block"]
                                  data-dir cfg-path)
                       parent-query (run-cli ["--graph" "show-multi-id-contained-graph" "query"
                                              "--query" "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                                              "--inputs" (pr-str ["Parent Block"])]
                                             data-dir cfg-path)
                       parent-payload (parse-json-output parent-query)
                       parent-id (get-in parent-payload [:data :result])
                       _ (run-cli ["--graph" "show-multi-id-contained-graph" "upsert" "block"
                                   "--target-id" (str parent-id)
                                   "--content" "Child Block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       show-children (run-cli ["--graph" "show-multi-id-contained-graph"
                                               "show"
                                               "--page" "ParentPage"]
                                              data-dir cfg-path)
                       show-children-payload (parse-json-output show-children)
                       child-node (find-block-by-title (get-in show-children-payload [:data :root]) "Child Block")
                       child-id (or (:db/id child-node) (:id child-node))
                       ids-edn (str "[" parent-id " " child-id "]")
                       show-json-result (run-cli ["--graph" "show-multi-id-contained-graph" "show"
                                                  "--id" ids-edn]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--graph" "show-multi-id-contained-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code parent-query)))
                 (is (some? parent-id))
                 (is (some? child-id))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (= 1 (count show-data)))
                 (is (contains? root-titles "Parent Block"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query-human-output-pipes-to-show
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query-pipe")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "query-pipe-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "query-pipe-graph" "upsert" "page" "--page" "PipePage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "query-pipe-graph" "upsert" "block"
                                   "--target-page" "PipePage"
                                   "--content" "Pipe One"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "query-pipe-graph" "upsert" "block"
                                   "--target-page" "PipePage"
                                   "--content" "Pipe Two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text (str "[:find [?e ...]"
                                       " :in $ ?q"
                                       " :where"
                                       " [?e :block/title ?title]"
                                       " [(clojure.string/includes? ?title ?q)]]")
                       query-json-result (run-cli ["--graph" "query-pipe-graph"
                                                   "query"
                                                   "--query" query-text
                                                   "--inputs" (pr-str ["Pipe"])]
                                                  data-dir cfg-path)
                       query-json-payload (parse-json-output query-json-result)
                       query-ids (get-in query-json-payload [:data :result])
                       query-human-result (run-cli ["--graph" "query-pipe-graph"
                                                    "--output" "human"
                                                    "query"
                                                    "--query" query-text
                                                    "--inputs" (pr-str ["Pipe"])]
                                                   data-dir cfg-path)
                       query-human-output (string/trim (:output query-human-result))
                       node-bin (shell-escape (.-execPath js/process))
                       cli-bin (shell-escape (node-path/resolve "static/logseq-cli.js"))
                       data-arg (shell-escape data-dir)
                       cfg-arg (shell-escape cfg-path)
                       repo-arg (shell-escape "query-pipe-graph")
                       query-arg (shell-escape query-text)
                       inputs-arg (shell-escape (pr-str ["Pipe"]))
                       query-cmd (string/join " "
                                              [node-bin cli-bin
                                               "--data-dir" data-arg
                                               "--config" cfg-arg
                                               "--graph" repo-arg
                                               "--output" "human"
                                               "query"
                                               "--query" query-arg
                                               "--inputs" inputs-arg])
                       show-cmd (string/join " "
                                             [node-bin cli-bin
                                              "--data-dir" data-arg
                                              "--config" cfg-arg
                                              "--graph" repo-arg
                                              "--output" "human"
                                              "show"
                                              "--id"])
                       pipeline (str query-cmd " | xargs -I{} " show-cmd " {}")
                       output (run-shell pipeline)
                       stop-result (run-cli ["server" "stop" "--graph" "query-pipe-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= (pr-str query-ids) query-human-output))
                 (is (string/includes? output "Pipe One"))
                 (is (string/includes? output "Pipe Two"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-query-human-output-pipes-to-show-stdin
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query-stdin")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "query-stdin-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "query-stdin-graph" "upsert" "page" "--page" "PipePage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "query-stdin-graph" "upsert" "block"
                                   "--target-page" "PipePage"
                                   "--content" "Pipe One"]
                                  data-dir cfg-path)
                       _ (run-cli ["--graph" "query-stdin-graph" "upsert" "block"
                                   "--target-page" "PipePage"
                                   "--content" "Pipe Two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text (str "[:find [?e ...]"
                                       " :in $ ?q"
                                       " :where"
                                       " [?e :block/title ?title]"
                                       " [(clojure.string/includes? ?title ?q)]]")
                       query-json-result (run-cli ["--graph" "query-stdin-graph"
                                                   "query"
                                                   "--query" query-text
                                                   "--inputs" (pr-str ["Pipe"])]
                                                  data-dir cfg-path)
                       query-json-payload (parse-json-output query-json-result)
                       query-ids (get-in query-json-payload [:data :result])
                       query-result (run-cli ["--graph" "query-stdin-graph"
                                              "--output" "human"
                                              "query"
                                              "--query" query-text
                                              "--inputs" (pr-str ["Pipe"])]
                                             data-dir cfg-path)
                       ids-text (string/trim (:output query-result))
                       show-result (with-redefs [show-command/read-stdin (fn [] ids-text)]
                                     (run-cli ["--graph" "query-stdin-graph"
                                               "--output" "json"
                                               "show"
                                               "--id"]
                                              data-dir cfg-path))
                       show-payload (parse-json-output show-result)
                       show-data (:data show-payload)
                       root (some-> show-data first :root)
                       root-titles (set (map (comp node-title :root) show-data))
                       pipe-one (find-block-by-title root "Pipe One")
                       pipe-two (find-block-by-title root "Pipe Two")
                       stop-result (run-cli ["server" "stop" "--graph" "query-stdin-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= (pr-str query-ids) ids-text))
                 (is (= "ok" (:status show-payload)))
                 (is (contains? root-titles "PipePage"))
                 (is (some? pipe-one))
                 (is (some? pipe-two))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-show-linked-references
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--graph" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "page" "--page" "SourcePage"] data-dir cfg-path)
                       list-page-result (run-cli ["--graph" "linked-refs-graph" "list" "page" "--expand"]
                                                 data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "TargetPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       blocks-edn (str "[{:block/title \"Ref to TargetPage\" :block/refs [{:db/id " page-id "}]}]")
                       _ (run-cli ["--graph" "linked-refs-graph" "upsert" "block" "--target-page" "SourcePage"
                                   "--blocks" blocks-edn] data-dir cfg-path)
                       show-result (run-cli ["--graph" "linked-refs-graph" "show" "--page" "TargetPage"]
                                            data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       linked (get-in show-payload [:data :linked-references])
                       ref-block (first (:blocks linked))
                       stop-result (run-cli ["server" "stop" "--graph" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status show-payload)))
                 (is (some? page-id))
                 (is (map? linked))
                 (is (pos? (:count linked)))
                 (is (seq (:blocks linked)))
                 (is (some? ref-block))
                 (is (some? (or (:db/id ref-block) (:id ref-block))))
                 (is (some? (or (get-in ref-block [:page :title])
                                (get-in ref-block [:page :name]))))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-graph-export-import-edn
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-edn")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-edn-graph"
                       import-graph "import-edn-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.edn")
                       _ (run-cli ["graph" "create" "--graph" export-graph] data-dir cfg-path)
                       _ (run-cli ["--graph" export-graph "upsert" "page" "--page" "ExportPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" export-graph "upsert" "block" "--target-page" "ExportPage" "--content" "Export content"] data-dir cfg-path)
                       export-result (run-cli ["--graph" export-graph
                                               "graph" "export"
                                               "--type" "edn"
                                               "--file" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--graph" import-graph
                                   "graph" "import"
                                   "--type" "edn"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--graph" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--graph" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--graph" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "ExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-graph-export-import-sqlite
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-sqlite")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-sqlite-graph"
                       import-graph "import-sqlite-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.sqlite")
                       _ (run-cli ["graph" "create" "--graph" export-graph] data-dir cfg-path)
                       _ (run-cli ["--graph" export-graph "upsert" "page" "--page" "SQLiteExportPage"] data-dir cfg-path)
                       _ (run-cli ["--graph" export-graph "upsert" "block" "--target-page" "SQLiteExportPage" "--content" "SQLite export content"] data-dir cfg-path)
                       export-result (run-cli ["--graph" export-graph
                                               "graph" "export"
                                               "--type" "sqlite"
                                               "--file" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--graph" import-graph
                                   "graph" "import"
                                   "--type" "sqlite"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--graph" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--graph" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--graph" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "SQLiteExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))
