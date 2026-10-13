(ns frontend.worker.db-core-mutation3-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.db.fix :as db-fix]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.handler.transaction :as transaction-handler]
            [frontend.worker.platform :as platform]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.ui-request :as ui-request]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(def ^:private repo "mut3-repo")

(defn- base-platform
  [overrides]
  (merge-with merge
              {:env {:publishing? false
                     :runtime :browser}
               :storage {:install-opfs-pool (fn [_sqlite _pool-name] (p/resolved #js {}))
                         :list-graphs (fn [] (p/resolved []))
                         :db-exists? (fn [_] (p/resolved false))
                         :resolve-db-path (fn [_repo _pool path] path)
                         :export-file (fn [_pool _path] (p/resolved (js/Uint8Array. 0)))
                         :import-db (fn [_pool _path _data] (p/resolved nil))
                         :remove-vfs! (fn [_] nil)
                         :transfer (fn [data _transferables] data)}
               :kv {:get (fn [_] nil)
                    :set! (fn [_ _] nil)}
               :broadcast {:post-message! (fn [& _] nil)}
               :websocket {:connect (fn [_] #js {})}
               :sqlite {:init! (fn [] nil)
                        :open-db (fn [_opts] #js {})
                        :close-db (fn [db] (.close db))
                        :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
                        :transaction (fn [db f] (.transaction db f))}
               :crypto {}
               :embedding {:model-id "test-model"
                           :dimension 7
                           :embed-texts (fn [texts] (p/resolved (mapv (fn [_] [0.0]) texts)))}
               :timers {:set-interval! (fn [_ _] nil)}}
              overrides))

(defn- restoring-state
  [f]
  (let [atoms [worker-state/*state worker-state/*sqlite worker-state/*sqlite-conns
               worker-state/*vector-indexes worker-state/*datascript-conns
               worker-state/*client-ops-conns worker-state/*opfs-pools
               worker-state/*main-thread worker-state/*deleted-block-uuid->db-id
               db-core/*publishing? db-core/*service
               @#'platform/*platform @#'db-core/*wal-checkpoint-timers
               @#'db-core/*client-ops-cleanup-timers @#'db-core/*node-pools]
        previous (mapv deref atoms)
        cleanup (fn []
                  (doseq [[a v] (map vector atoms previous)]
                    (reset! a v)))]
    (platform/set-platform! (base-platform {}))
    (reset! worker-state/*sqlite #js {})
    (reset! worker-state/*sqlite-conns {})
    (reset! worker-state/*vector-indexes {})
    (reset! worker-state/*datascript-conns {})
    (reset! worker-state/*client-ops-conns {})
    (reset! worker-state/*opfs-pools {})
    (reset! worker-state/*main-thread nil)
    (reset! db-core/*publishing? false)
    (reset! db-core/*service [])
    (let [result (try
                   (f)
                   (catch :default error
                     (cleanup)
                     (throw error)))]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

(defn- finish!
  [<result done]
  (-> <result
      (p/catch (fn [error] (is false (str "unexpected error: " error))))
      (p/finally done)))

(defn- get-thread-api
  [k]
  (let [f (get @thread-api/*thread-apis k)]
    (assert (fn? f) (str "thread api not registered: " k))
    f))

(defn- fake-db
  [{:keys [closed label filename]}]
  (let [db #js {:exec (fn [sql-or-opts]
                        (let [sql (if (string? sql-or-opts)
                                    sql-or-opts
                                    (gobj/get sql-or-opts "sql"))]
                          (if (= sql "PRAGMA user_version")
                            #js [#js [0]]
                            #js [])))
                :close (fn []
                         (when closed
                           (swap! closed conj label)))
                :filename filename}]
    (gobj/set db "transaction" (fn [f] (f db)))
    db))

(defn- capture-logs
  [f]
  (let [records (atom [])
        handler (fn [record] (swap! records conj record))]
    (log/add-handler handler)
    (try
      (f)
      (finally
        (log/remove-handler handler)))
    (mapv #(dissoc (:message %) :line) @records)))

(defn- <caught
  [<promise]
  (-> <promise
      (p/then (fn [value] [:resolved value]))
      (p/catch (fn [error] [:rejected error]))))

;; ---- import result / import file reading ----

(deftest compact-import-result-counts-and-logs-test
  (let [compact @#'db-core/compact-import-result
        out (atom nil)
        messages (capture-logs
                  #(reset! out (compact {:import-state {:ignored-files (atom [1 2])
                                                        :ignored-assets [1]
                                                        :ignored-properties (atom [1 2 3])}
                                         :files [{:path "a.org"} {:path "B.ORG"} {:path "c.md"}]}
                                        [{:msg "bad" :level :error :extra 1}
                                         {:msg "meh" :level :warning}]
                                        {:errors [:e1 :e2 :e3 :e4]})))]
    (is (= {:org-file-count 2
            :ignored-files-count 2
            :ignored-assets-count 1
            :ignored-properties-count 3
            :validation-error-count 4
            :notifications [{:msg "bad" :level :error}]}
           @out))
    (is (= [{:import-ignored-files {:count 2}}
            {:import-ignored-assets {:count 1}}
            {:import-ignored-properties {:count 3}}
            {:import-validation-errors {:count 4}}]
           messages))))

(deftest compact-import-result-logs-nothing-when-clean-test
  (let [compact @#'db-core/compact-import-result
        out (atom nil)
        messages (capture-logs
                  #(reset! out (compact {:import-state {} :files []} [] {})))]
    (is (= {:org-file-count 0
            :ignored-files-count 0
            :ignored-assets-count 0
            :ignored-properties-count 0
            :validation-error-count 0
            :notifications []}
           @out))
    (is (= [] messages))))

(deftest read-import-file-content-sources-test
  (async done
    (let [read-content @#'db-core/<read-import-file-content
          requests (atom [])
          tmp (node-path/join (os/tmpdir) (str "mut3-" (random-uuid) ".md"))]
      (fs/writeFileSync tmp "from disk")
      (finish!
       (restoring-state
        (fn []
          (platform/set-platform! (base-platform {:env {:runtime :node}}))
          (p/with-redefs [ui-request/<request (fn [& args]
                                                (swap! requests conj (vec args))
                                                (p/resolved (if (= "empty.md" (:path (second args)))
                                                              {}
                                                              {:file/content "from ui"})))]
            (p/let [disk (read-content {:fs-path tmp :path "a.md"})
                    inline (read-content {:path "b.md" :file/content "inline"})
                    from-ui (read-content {:path "c.md"})
                    missing-content (<caught (read-content {:path "empty.md"}))
                    missing-all (<caught (read-content {:path 5}))]
              (is (= "from disk" disk))
              (is (= "inline" inline))
              (is (= "from ui" from-ui))
              (is (= [[:read-import-file {:path "c.md"} {:timeout-ms 300000 :hint "import-file-graph"}]
                      [:read-import-file {:path "empty.md"} {:timeout-ms 300000 :hint "import-file-graph"}]]
                     @requests))
              (is (= :rejected (first missing-content)))
              (is (= {:path "empty.md"} (ex-data (second missing-content))))
              (is (= :rejected (first missing-all)))
              (is (= {:path 5} (ex-data (second missing-all))))))))
       done))))

(deftest import-file-payload-normalizes-binary-inputs-test
  (let [payload @#'db-core/import-file-payload
        data (js/Uint8Array. #js [1 2])]
    (is (identical? data (payload data)))
    (is (instance? js/Uint8Array (payload (.-buffer data))))
    (is (= [1 2] (vec (payload (.-buffer data)))))
    (is (instance? js/Uint8Array (payload #js [3 4])))
    (is (= [3 4] (vec (payload #js [3 4]))))
    (is (nil? (payload "text")))))

(deftest set-import-ui-state-ignores-main-thread-failure-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (p/let [result (#'db-core/set-import-ui-state! [:graph/importing-state :step] :x)]
          (is (nil? result)))))
     done)))

;; ---- sqlite storage ----

(deftest restore-data-from-addr-merges-addresses-only-into-map-data-test
  (let [restore db-core/restore-data-from-addr
        db-for (fn [row] #js {:exec (fn [_] #js [row])})
        merged (restore (db-for #js [(sqlite-util/write-transit-str {:a 1}) "[1,2]"]) 1)
        no-addresses (restore (db-for #js [(sqlite-util/write-transit-str {:a 1}) nil]) 1)
        non-map (restore (db-for #js [(sqlite-util/write-transit-str [1 2 3]) "[1]"]) 1)]
    (is (= {:a 1} (dissoc merged :addresses)))
    (is (= [1 2] (js->clj (:addresses merged))))
    (is (= {:a 1} no-addresses))
    (is (= [1 2 3] non-map))))

(deftest init-sqlite-module-initializes-once-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [inits (atom 0)
              sqlite-module #js {:module true}]
          (reset! worker-state/*sqlite nil)
          (platform/set-platform! (base-platform {:env {:publishing? true}
                                                  :sqlite {:init! (fn []
                                                                    (swap! inits inc)
                                                                    sqlite-module)}}))
          (p/let [_ (#'db-core/init-sqlite-module!)]
            (is (identical? sqlite-module @worker-state/*sqlite))
            (is (true? @db-core/*publishing?))
            (is (= 1 @inits))
            (p/let [_ (#'db-core/init-sqlite-module!)]
              (is (= 1 @inits))
              (reset! worker-state/*sqlite nil)
              (platform/set-platform! (base-platform {:sqlite {:init! (fn [] nil)}}))
              (p/let [_ (#'db-core/init-sqlite-module!)]
                (is (= :frontend.worker.db-core/sqlite-initialized @worker-state/*sqlite))
                (is (false? @db-core/*publishing?))))))))
     done)))

(deftest checkpoint-db-single-arity-runs-wal-checkpoint-test
  (let [calls (atom [])
        db #js {:exec (fn [sql] (swap! calls conj sql))}]
    (#'db-core/checkpoint-db! db)
    (is (= ["PRAGMA wal_checkpoint(TRUNCATE)"] @calls))))

(deftest disable-sqlite-auto-checkpoint-test
  (let [calls (atom [])
        db #js {:exec (fn [sql] (swap! calls conj sql))}]
    (#'db-core/disable-sqlite-auto-checkpoint! db)
    (is (= ["PRAGMA wal_autocheckpoint=0"] @calls))))

(deftest schedule-wal-checkpoint-cancels-previous-timer-test
  (async done
    (let [timers @#'db-core/*wal-checkpoint-timers
          fired (atom 0)]
      (swap! timers assoc repo (js/setTimeout #(swap! fired inc) 20))
      (#'db-core/schedule-wal-checkpoint! repo #js {})
      (-> (p/delay 80)
          (p/then (fn [_] (is (zero? @fired))))
          (p/finally (fn []
                       (js/clearTimeout (get @timers repo))
                       (swap! timers dissoc repo)
                       (done)))))))

(deftest run-client-ops-cleanup-passes-protected-tx-ids-test
  (let [calls (atom [])]
    (with-redefs [worker-undo-redo/referenced-history-tx-ids (fn [_repo] #{7})
                  client-op/cleanup-finished-history-ops! (fn [r ids] (swap! calls conj [r ids]))]
      (is (nil? (#'db-core/run-client-ops-cleanup! repo)))
      (is (= [[repo #{7}]] @calls)))))

;; ---- export / remove ----

(deftest export-db-file-with-paths-filters-and-dedupes-paths-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [paths (atom [])]
          (reset! worker-state/*opfs-pools {repo #js {}})
          (platform/set-platform! (base-platform {:storage {:export-file (fn [_pool path]
                                                                           (swap! paths conj path)
                                                                           (p/resolved nil))}}))
          (p/let [result (#'db-core/<export-db-file-with-paths repo [nil 42 "" "  " "a" "a" "b"])]
            (is (nil? result))
            (is (= ["a" "b"] @paths))))))
     done)))

(deftest export-client-ops-db-binary-tries-the-db-filename-first-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [paths (atom [])
              exported (js/Uint8Array. #js [1])]
          (reset! worker-state/*opfs-pools {repo #js {}})
          (reset! worker-state/*sqlite-conns {repo {:client-ops (fake-db {:filename "mut3-client-ops.sqlite"})}})
          (platform/set-platform! (base-platform {:storage {:export-file (fn [_pool path]
                                                                           (swap! paths conj path)
                                                                           (p/resolved exported))}}))
          (p/let [result ((get-thread-api :thread-api/export-client-ops-db-binary) repo)]
            (is (identical? exported result))
            (is (= ["mut3-client-ops.sqlite"] @paths))))))
     done)))

(deftest remove-vfs-passes-existing-pool-only-test
  (let [removed (atom [])]
    (restoring-state
     (fn []
       (platform/set-platform! (base-platform {:storage {:remove-vfs! (fn [pool] (swap! removed conj pool))}}))
       (#'db-core/remove-vfs! nil)
       (is (= [] @removed))
       (#'db-core/remove-vfs! :pool)
       (is (= [:pool] @removed))))))

(deftest backup-db-sqlite-errors-carry-code-and-repo-test
  (restoring-state
   (fn []
     (let [backup (get-thread-api :thread-api/backup-db-sqlite)
           not-opened (try (backup repo "/tmp/x") (catch :default e e))]
       (is (= {:code :graph-not-opened :repo repo} (ex-data not-opened)))
       (reset! worker-state/*sqlite-conns {repo {:db (fake-db {})}})
       (let [unsupported (try (backup repo "/tmp/x") (catch :default e e))]
         (is (= {:code :backup-not-supported :repo repo} (ex-data unsupported))))))))

(deftest remote-binary-function-transfers-uint8array-results-test
  (async done
    (let [f (get db-core/fns "remoteInvokeBinary")
          transfers (atom [])
          binary (js/Uint8Array. #js [1 2 3])]
      (vswap! thread-api/*thread-apis assoc
              :thread-api/mut3-bytes (fn [] binary)
              :thread-api/mut3-text (fn [] "text"))
      (finish!
       (restoring-state
        (fn []
          (platform/set-platform! (base-platform {:storage {:transfer (fn [data transferables]
                                                                        (swap! transfers conj [data transferables])
                                                                        :transferred)}}))
          (p/let [r-bytes (f "thread-api/mut3-bytes")
                  r-text (f "thread-api/mut3-text")
                  _ (platform/set-platform! (base-platform {:storage {:transfer nil}}))
                  r-untransferred (f "thread-api/mut3-bytes")
                  r-missing (try (f "thread-api/mut3-missing") (catch :default e [:rejected e]))]
            (is (= :transferred r-bytes))
            (is (= 1 (count @transfers)))
            (is (identical? binary (ffirst @transfers)))
            (is (= [(.-buffer binary)] (vec (second (first @transfers)))))
            (is (= "text" r-text))
            (is (identical? binary r-untransferred))
            (is (= :rejected (first r-missing)))
            (is (= "not found thread-api: thread-api/mut3-missing" (ex-message (second r-missing)))))))
       (fn []
         (vswap! thread-api/*thread-apis dissoc :thread-api/mut3-bytes :thread-api/mut3-text)
         (done))))))

;; ---- invalidate search db / get-dbs ----

(deftest invalidate-search-db-truncates-open-search-db-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [truncated (atom [])]
          (reset! worker-state/*sqlite-conns {repo {:search :search-db}})
          (reset! worker-state/*vector-indexes {repo :vector-index})
          (p/with-redefs [search/truncate-table! (fn [db] (swap! truncated conj [:table db]))
                          search/truncate-vector-index! (fn [index] (swap! truncated conj [:vector index]))]
            (p/let [result (#'db-core/<invalidate-search-db! repo)]
              (is (nil? result))
              (is (= [[:table :search-db] [:vector :vector-index]] @truncated)))))))
     done)))

(deftest invalidate-search-db-opens-and-closes-search-db-when-not-open-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [truncated (atom [])
              opens (atom [])
              closed (atom [])
              pool #js {}
              sqlite #js {}
              search-db (fake-db {:closed closed :label :search})]
          (reset! worker-state/*sqlite sqlite)
          (reset! worker-state/*opfs-pools {repo pool})
          (platform/set-platform! (base-platform {:sqlite {:open-db (fn [opts] (swap! opens conj opts) search-db)}}))
          (p/with-redefs [search/truncate-table! (fn [db] (swap! truncated conj db))]
            (p/let [result (#'db-core/<invalidate-search-db! repo)]
              (is (nil? result))
              (is (= 1 (count @opens)))
              (is (identical? sqlite (:sqlite (first @opens))))
              (is (identical? pool (:pool (first @opens))))
              (is (= {:path "search/db.sqlite" :mode "c"} (select-keys (first @opens) [:path :mode])))
              (is (= [search-db] @truncated))
              (is (= [:search] @closed))
              (reset! db-core/*publishing? true)
              (p/let [result' (#'db-core/<invalidate-search-db! repo)]
                (is (nil? result'))
                (is (= 1 (count @opens)))))))))
     done)))

(deftest get-dbs-opens-three-dbs-and-unpauses-empty-pool-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [sqlite #js {}
              unpaused (atom 0)
              opens (atom [])
              vector-opens (atom [])
              run-get-dbs (fn [pool with-vector?]
                            (reset! opens [])
                            (reset! vector-opens [])
                            (reset! worker-state/*sqlite-conns {})
                            (reset! worker-state/*vector-indexes {})
                            (reset! worker-state/*opfs-pools {repo pool})
                            (platform/set-platform!
                             (base-platform
                              (cond-> {:sqlite {:open-db (fn [opts]
                                                           (swap! opens conj opts)
                                                           #js {:n (count @opens)})}}
                                with-vector? (assoc :vector {:open-index (fn [opts]
                                                                      (swap! vector-opens conj opts)
                                                                      :vector-index)}))))
                            (#'db-core/get-dbs repo))]
          (reset! worker-state/*sqlite sqlite)
          (p/let [[db search-db client-ops-db vector-index]
                  (run-get-dbs #js {:getCapacity (fn [] 0)
                                    :unpauseVfs (fn [] (swap! unpaused inc))}
                               true)
                  pool-opens @opens
                  pool (get @worker-state/*opfs-pools repo)]
            (is (= [{:path "/db.sqlite"} {:path "search/db.sqlite"} {:path "client-ops-/db.sqlite"}]
                   (mapv #(select-keys % [:path]) pool-opens)))
            (is (every? #(identical? sqlite (:sqlite %)) pool-opens))
            (is (every? #(identical? pool (:pool %)) pool-opens))
            (is (= [[1] [2] [3]] (mapv (fn [x] [(.-n x)]) [db search-db client-ops-db])))
            (is (= :vector-index vector-index))
            (is (= [{:path "search/vector" :dimension 7}] @vector-opens))
            (is (= {repo {:db db :search search-db :client-ops client-ops-db}} @worker-state/*sqlite-conns))
            (is (= {repo :vector-index} @worker-state/*vector-indexes))
            (is (= 1 @unpaused))
            (p/let [_ (run-get-dbs #js {:getCapacity (fn [] 5)
                                        :unpauseVfs (fn [] (swap! unpaused inc))}
                                   false)]
              (is (= 1 @unpaused))
              (is (not (contains? @worker-state/*vector-indexes repo)))
              (p/let [_ (run-get-dbs #js {:unpauseVfs (fn [] (swap! unpaused inc))} false)]
                (is (= 1 @unpaused))))))))
     done)))

(deftest get-dbs-when-publishing-opens-two-in-memory-dbs-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [sqlite #js {}
              opens (atom [])]
          (reset! worker-state/*sqlite sqlite)
          (reset! db-core/*publishing? true)
          (platform/set-platform! (base-platform {:sqlite {:open-db (fn [opts]
                                                                      (swap! opens conj opts)
                                                                      #js {:n (count @opens)})}}))
          (p/let [[db search-db client-ops-db vector-index] (#'db-core/get-dbs repo)]
            (is (= 2 (count @opens)))
            (is (every? #(identical? sqlite (:sqlite %)) @opens))
            (is (= [{:path "/db.sqlite" :mode "c"} {:path "/search-db.sqlite" :mode "c"}]
                   (mapv #(select-keys % [:path :mode]) @opens)))
            (is (= [1 2] [(.-n db) (.-n search-db)]))
            (is (nil? client-ops-db))
            (is (nil? vector-index))))))
     done)))

;; ---- built-in sync repair ----

(deftest built-in-sync-repair-tx-data-orders-and-marks-built-in-items-test
  (let [tx-data (#'db-core/built-in-sync-repair-tx-data)
        items (filterv #(and (map? %) (:block/uuid %)) tx-data)
        others (remove #(and (map? %) (:block/uuid %)) tx-data)
        expected-orders (db-order/gen-n-keys (count items) nil nil :max-key-atom (atom nil))
        unordered #{:logseq.class/Comments :logseq.class/Comment}]
    (is (seq items))
    (is (every? :logseq.property/built-in? items))
    (is (every? #(= 0 (:block/created-at %)) items))
    (is (every? #(= 0 (:block/updated-at %)) items))
    (is (some #(= {:db/ident :logseq.class/Comments} %) tx-data))
    (is (some #(= {:db/ident :logseq.class/Comment} %) tx-data))
    (is (every? #(not-any? #{:block/created-at :block/updated-at :block/order} (keys %)) others))
    (doseq [[order item] (map vector expected-orders items)
            :when (not (contains? unordered (:db/ident item)))]
      (is (= order (:block/order item)) (pr-str (:db/ident item))))))

(deftest enqueue-built-in-sync-repair-upserts-pending-fix-entry-test
  (let [upserts (atom [])
        adjusts (atom [])]
    (with-redefs [client-op/get-local-tx-entry (fn [_repo _tx-id] nil)
                  client-op/upsert-local-tx-entry! (fn [r entry]
                                                     (swap! upserts conj [r entry])
                                                     {:should-inc-pending? true})
                  client-op/adjust-pending-local-tx-count! (fn [r n] (swap! adjusts conj [r n]))]
      (#'db-core/enqueue-built-in-sync-repair! repo)
      (is (= [[repo 1]] @adjusts))
      (is (= 1 (count @upserts)))
      (let [[r entry] (first @upserts)]
        (is (= repo r))
        (is (= {:tx-id #uuid "00000000-0000-4000-8000-652665286528"
                :created-at 0
                :pending? true
                :failed? false
                :outliner-op :fix
                :undo-redo :none
                :forward-outliner-ops []
                :inverse-outliner-ops []
                :inferred-outliner-ops? false
                :reversed-tx-data []}
               (dissoc entry :normalized-tx-data)))
        (is (= (count (#'db-core/built-in-sync-repair-tx-data))
               (count (:normalized-tx-data entry))))))))

;; ---- open / bootstrap ----

(defn- bootstrap-datoms
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/id "bootstrap-page"
                        :block/uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
                        :block/name "bootstrap"
                        :block/title "Bootstrap"
                        :block/tags :logseq.class/Page}
                       {:block/uuid #uuid "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
                        :block/page "bootstrap-page"
                        :block/parent "bootstrap-page"
                        :block/order "a0"
                        :block/title "bootstrapped block"}])
    (vec (d/datoms @conn :eavt))))

(defn- <open-graph!
  "Runs `invoke` (default: the create-or-open-db thread api) on fake sqlite dbs
  and returns what was observed, then closes the graph."
  [opts-repo {:keys [invoke seed! migrate get-local-tx pre-conns vector-index]
              :or {seed! (fn [_conn] nil)
                   migrate (fn [_conn] nil)
                   get-local-tx (fn [_repo] nil)}}]
  (let [db (fake-db {})
        search-db (fake-db {})
        client-ops-db (fake-db {})
        opened (atom [db search-db client-ops-db])
        txs (atom [])
        handled (atom [])
        local-tx-updates (atom [])
        kvs-dbs (atom [])
        schema-dbs (atom [])
        entry-lookups (atom 0)
        initial-data-opts (atom [])
        orig-get-storage-conn common-sqlite/get-storage-conn
        orig-build sqlite-create-graph/build-db-initial-data]
    (platform/set-platform!
     (base-platform (cond-> {:sqlite {:open-db (fn [_opts]
                                                 (let [opened-db (first @opened)]
                                                   (swap! opened subvec 1)
                                                   opened-db))}}
                      vector-index (assoc :vector {:open-index (fn [_opts] vector-index)}))))
    (when pre-conns
      (reset! worker-state/*sqlite-conns pre-conns))
    (p/with-redefs [shared-service/*master-client? (atom true)
                    db-sync/handle-local-tx! (fn [r report] (swap! handled conj [r report]))
                    db-sync/reconcile-local-checksum! (fn [& _] nil)
                    db-listener/listen-db-changes! (fn [& _] nil)
                    db-fix/check-and-fix-schema! (fn [_conn] nil)
                    transaction-handler/maybe-run-recycle-gc! (fn [_conn] nil)
                    common-sqlite/get-storage-conn (fn [& args]
                                                     (let [conn (apply orig-get-storage-conn args)]
                                                       (seed! conn)
                                                       (d/listen! conn ::txs (fn [report] (swap! txs conj report)))
                                                       conn))
                    common-sqlite/create-kvs-table! (fn [kvs-db] (swap! kvs-dbs conj kvs-db))
                    client-op/ensure-sqlite-schema! (fn [schema-db] (swap! schema-dbs conj schema-db))
                    client-op/get-local-tx get-local-tx
                    client-op/update-local-tx (fn [r t] (swap! local-tx-updates conj [r t]))
                    client-op/get-local-tx-entry (fn [_repo _tx-id] (swap! entry-lookups inc) true)
                    db-migrate/migrate migrate
                    sqlite-create-graph/build-db-initial-data (fn [config & build-opts]
                                                                (swap! initial-data-opts conj (first build-opts))
                                                                (apply orig-build config build-opts))]
      (p/let [_ (if invoke
                  (invoke)
                  ((get-thread-api :thread-api/create-or-open-db) opts-repo {}))
              observed {:conn (worker-state/get-datascript-conn opts-repo)
                        :txs @txs
                        :initial-txs (filterv #(:initial-db? (:tx-meta %)) @txs)
                        :handled @handled
                        :local-tx-updates @local-tx-updates
                        :kvs-dbs @kvs-dbs
                        :schema-dbs @schema-dbs
                        :entry-lookups @entry-lookups
                        :initial-data-opts @initial-data-opts
                        :vector-indexes @worker-state/*vector-indexes
                        :dbs [db search-db client-ops-db]}
              _ (db-core/close-db! opts-repo)]
        observed))))

(defn- <open-with
  [open-opts create-opts]
  (<open-graph! repo (assoc open-opts
                            :invoke (fn [] ((get-thread-api :thread-api/create-or-open-db) repo create-opts)))))

(deftest open-with-datoms-bootstraps-idents-before-other-datoms-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [datoms (bootstrap-datoms)
              ident-eids (into #{} (comp (filter #(= :db/ident (:a %))) (map :e)) datoms)]
          (p/let [{:keys [initial-txs conn handled]} (<open-with {} {:datoms datoms})
                  [ident-tx other-tx] initial-txs]
            (is (= 2 (count initial-txs)))
            (is (= ident-eids (set (map :e (:tx-data ident-tx)))))
            (is (seq (:tx-data other-tx)))
            (is (empty? (set/intersection ident-eids (set (map :e (:tx-data other-tx))))))
            (is (= "bootstrapped block"
                   (:block/title (d/entity @conn [:block/uuid #uuid "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]))))
            (is (empty? handled))))))
     done)))

(deftest open-with-debug-transit-raw-bootstraps-from-its-datoms-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [datoms (mapv (fn [x] {:e (:e x) :a (:a x) :v (:v x)}) (bootstrap-datoms))
              ident-eids (into #{} (comp (filter #(= :db/ident (:a %))) (map :e)) datoms)]
          (p/let [{:keys [initial-txs conn]} (<open-with {} {:debug-transit-raw (ldb/write-transit-str datoms)})]
            (is (= 2 (count initial-txs)))
            (is (= ident-eids (set (map :e (:tx-data (first initial-txs))))))
            (is (= "bootstrapped block"
                   (:block/title (d/entity @conn [:block/uuid #uuid "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]))))))))
     done)))

(deftest debug-transit-raw->datoms-reads-datoms-and-dbs-test
  (let [->datoms @#'db-core/debug-transit-raw->datoms
        conn (d/create-conn db-schema/schema)
        _ (d/transact! conn [{:db/id -1 :block/uuid #uuid "cccccccc-cccc-4ccc-8ccc-cccccccccccc" :block/title "t"}])
        db-datoms (mapv (juxt :e :a :v) (d/datoms @conn :eavt))
        from-vector (->datoms (ldb/write-transit-str [[1 :a 2]]))
        from-db (->datoms (ldb/write-transit-str @conn))]
    (is (= [[1 :a 2]] from-vector))
    (is (= db-datoms (mapv (juxt :e :a :v) from-db)))))

(deftest bootstrap-transact-marks-initial-db-and-skips-empty-test
  (let [conn (d/create-conn db-schema/schema)
        metas (atom [])]
    (d/listen! conn ::metas (fn [report] (swap! metas conj (:tx-meta report))))
    (#'db-core/bootstrap-transact! conn [])
    (#'db-core/bootstrap-transact! conn [{:block/uuid #uuid "dddddddd-dddd-4ddd-8ddd-dddddddddddd"}])
    (is (= [{:initial-db? true}] @metas))))

(deftest open-existing-graph-skips-initial-data-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [existing! (fn [conn]
                          (d/transact! conn [{:db/ident :logseq.class/Root}
                                             {:db/ident :logseq.kv/db-type :kv/value "db"}]))]
          (p/let [existing (<open-with {:seed! existing!} {})
                  root-only (<open-with {:seed! (fn [conn] (d/transact! conn [{:db/ident :logseq.class/Root}]))} {})
                  type-only (<open-with {:seed! (fn [conn] (d/transact! conn [{:db/ident :logseq.kv/db-type :kv/value "db"}]))} {})
                  wrong-type (<open-with {:seed! (fn [conn]
                                                   (d/transact! conn [{:db/ident :logseq.class/Root}
                                                                      {:db/ident :logseq.kv/db-type :kv/value "file"}]))}
                                         {})
                  fresh (<open-with {} {})]
            ;; counts, not the values: a failure would print the whole initial data
            (is (= 0 (count (:initial-txs existing))))
            (is (= 0 (count (:handled existing))))
            (is (= 0 (count (:initial-data-opts existing))))
            (doseq [[label result] [[:root-only root-only] [:type-only type-only]
                                    [:wrong-type wrong-type] [:fresh fresh]]]
              (is (= 1 (count (:initial-txs result))) (pr-str label))
              (is (= 1 (count (:handled result))) (pr-str label))
              (is (= repo (ffirst (:handled result))) (pr-str label))
              (is (seq (:tx-data (second (first (:handled result))))) (pr-str label)))))))
     done)))

(deftest open-fresh-graph-creates-kvs-tables-and-client-ops-schema-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (p/let [{:keys [dbs kvs-dbs schema-dbs vector-indexes]} (<open-with {} {})
                [db _search-db client-ops-db] dbs
                with-vector (<open-with {:vector-index :vector-index} {})]
          (is (some #(identical? db %) kvs-dbs))
          (is (some #(identical? client-ops-db %) kvs-dbs))
          (is (= [client-ops-db] schema-dbs))
          (is (not (contains? vector-indexes repo)))
          (is (= {repo :vector-index} (:vector-indexes with-vector))))))
     done)))

(deftest open-creating-remote-graph-initializes-local-tx-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [pre {repo {:client-ops :pre-existing}}]
          (p/let [pre-and-missing (<open-with {:pre-conns pre} {:creating-remote-graph? true})
                  missing-only (<open-with {} {:creating-remote-graph? true})
                  has-local-tx (<open-with {:pre-conns pre :get-local-tx (fn [_] 5)} {:creating-remote-graph? true})
                  not-remote (<open-with {:pre-conns pre} {})]
            (is (= [[repo 0] [repo 0]] (:local-tx-updates pre-and-missing)))
            (is (= [[repo 0]] (:local-tx-updates missing-only)))
            (is (= [] (:local-tx-updates has-local-tx)))
            (is (= [] (:local-tx-updates not-remote)))))))
     done)))

(deftest open-existing-remote-graph-repairs-only-without-migration-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [remote! (fn [conn]
                        (d/transact! conn [{:db/ident :logseq.class/Root}
                                           {:db/ident :logseq.kv/db-type :kv/value "db"}
                                           {:db/ident :logseq.kv/graph-remote? :kv/value true}]))]
          (p/let [no-migration (<open-with {:seed! remote!} {})
                  migrated (<open-with {:seed! remote!
                                        :migrate (fn [_conn] {:upgrade-result-coll [:report-1 :report-2]})}
                                       {})]
            (is (= 1 (:entry-lookups no-migration)))
            (is (= 0 (count (:handled no-migration))))
            (is (= 0 (:entry-lookups migrated)))
            (is (= [[repo :report-1] [repo :report-2]] (mapv (fn [[r x]] [r (if (keyword? x) x :initial-data)]) (:handled migrated))))))))
     done)))

(deftest import-db-binary-restarts-db-with-import-type-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (reset! worker-state/*opfs-pools {repo #js {}})
        (p/let [{:keys [initial-data-opts]}
                (<open-graph! repo {:invoke (fn []
                                              ((get-thread-api :thread-api/import-db-binary) repo (js/Uint8Array. 1)))})]
          (is (= [{:import-type :sqlite-db}] initial-data-opts)))))
     done)))

;; ---- start-db / thread apis ----

(deftest db-sync-dbs-open-needs-both-conns-test
  (let [open? @#'db-core/db-sync-dbs-open?]
    (restoring-state
     (fn []
       (is (false? (open? repo)))
       (reset! worker-state/*datascript-conns {repo :ds})
       (is (false? (open? repo)))
       (reset! worker-state/*client-ops-conns {repo :ops})
       (is (true? (open? repo)))
       (reset! worker-state/*datascript-conns {})
       (is (false? (open? repo)))))))

(defn- other-repo-state!
  [closed]
  (reset! worker-state/*sqlite-conns {"mut3-other" {:db (fake-db {:closed closed :label :other})}}))

(deftest db-sync-start-keeps-other-dbs-open-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [closed (atom [])
              started (atom [])]
          (other-repo-state! closed)
          (p/with-redefs [shared-service/*master-client? (atom false)
                          db-sync/start! (fn [r] (swap! started conj r) (p/resolved nil))]
            (p/let [_ ((get-thread-api :thread-api/db-sync-start) repo)]
              (is (= [repo] @started))
              (is (= [] @closed)))))))
     done)))

(deftest start-db-closes-other-dbs-unless-told-not-to-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [closed (atom [])]
          (other-repo-state! closed)
          (p/with-redefs [shared-service/*master-client? (atom false)]
            (p/let [_ (#'db-core/start-db! repo {:close-other-db? false})
                    kept @closed
                    _ (#'db-core/start-db! repo {})]
              (is (= [] kept))
              (is (= [:other] @closed)))))))
     done)))

(deftest on-become-master-skips-start-db-for-imports-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [closed (atom [])]
          (other-repo-state! closed)
          (p/with-redefs [shared-service/*master-client? (atom false)]
            (p/let [result (#'db-core/on-become-master repo {:import-type :sqlite-db})]
              (is (nil? result))
              (is (= [] @closed)))))))
     done)))

(deftest create-or-open-db-resets-deleted-uuids-only-when-graph-switches-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [conn (d/create-conn db-schema/schema)
              create-or-open (get-thread-api :thread-api/create-or-open-db)]
          (reset! worker-state/*datascript-conns {repo conn})
          (swap! worker-state/*state assoc :git/current-repo repo)
          (reset! worker-state/*deleted-block-uuid->db-id {:u 1})
          (p/with-redefs [shared-service/*master-client? (atom false)]
            (p/let [same (create-or-open repo {})
                    kept @worker-state/*deleted-block-uuid->db-id
                    _ (swap! worker-state/*state assoc :git/current-repo "mut3-previous")
                    _ (create-or-open repo {})]
              (is (= {:schema (:schema @conn)} same))
              (is (= {:u 1} kept))
              (is (= {} @worker-state/*deleted-block-uuid->db-id)))))))
     done)))

(deftest create-or-open-db-rejects-without-connection-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (p/with-redefs [shared-service/*master-client? (atom false)]
          (p/let [[status error] (<caught ((get-thread-api :thread-api/create-or-open-db) repo {}))]
            (is (= :rejected status))
            (is (= {:type :db/missing-connection :repo repo} (ex-data error)))))))
     done)))

(deftest close-apis-cancel-ui-requests-with-their-reason-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [contexts (atom [])
              removed (atom [])]
          (platform/set-platform! (base-platform {:storage {:remove-vfs! (fn [pool] (swap! removed conj pool))}}))
          (reset! worker-state/*opfs-pools {repo :pool-1})
          (p/with-redefs [sync-crypt/cancel-ui-requests! (fn [context] (swap! contexts conj context))]
            (p/let [unlink-result ((get-thread-api :thread-api/unsafe-unlink-db) repo)
                    close-result ((get-thread-api :thread-api/close-db) repo)
                    _ ((get-thread-api :thread-api/db-sync-close-db) repo)]
              (is (nil? unlink-result))
              (is (nil? close-result))
              (is (= [:pool-1] @removed))
              (is (= [{:reason :unsafe-unlink-db :repo repo}
                      {:reason :close-db :repo repo}
                      {:reason :db-sync-close-db :repo repo}]
                     @contexts)))))))
     done)))

;; ---- shared service ----

(defn- ready-service
  [& {:as extra}]
  (merge {:status {:ready (p/resolved true)}
          :proxy #js {}}
         extra))

(deftest init-service-closes-previous-graph-only-when-switching-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [closed (atom [])]
          (p/with-redefs [db-core/close-db! (fn [r] (swap! closed conj r))
                          shared-service/<create-service (fn [& _] (p/resolved (ready-service)))]
            (reset! db-core/*service [nil nil])
            (p/let [_ (#'db-core/<init-service! "mut3-new" {})
                    none-closed @closed
                    _ (do (reset! db-core/*service ["mut3-a" nil])
                          (#'db-core/<init-service! "mut3-a" {}))
                    same-closed @closed
                    _ (do (reset! db-core/*service ["mut3-a" (ready-service)])
                          (#'db-core/<init-service! "mut3-b" {}))]
              (is (= [] none-closed))
              (is (= [] same-closed))
              (is (= ["mut3-a"] @closed)))))))
     done)))

(deftest init-service-passes-import-flag-and-stores-ready-service-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [create-args (atom [])
              service (ready-service :client-id "c1")]
          (p/with-redefs [shared-service/<create-service (fn [& args]
                                                           (swap! create-args conj args)
                                                           (p/resolved service))]
            (reset! db-core/*service [])
            (p/let [result (#'db-core/<init-service! "mut3-new" {:import-type :sqlite-db})
                    stored @db-core/*service
                    _ (#'db-core/<init-service! "mut3-other" {})]
              (is (= service result))
              (is (= ["mut3-new" service] stored))
              (is (= [{:import? true} {:import? false}] (mapv last @create-args))))))))
     done)))

(deftest notify-invalid-data-broadcasts-and-captures-error-test
  (let [broadcasts (atom [])
        posts (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [type payload] (swap! broadcasts conj [type payload]))
                  platform/post-message! (fn [_platform type payload] (swap! posts conj [type payload]))]
      (restoring-state
       (fn []
         (#'db-core/notify-invalid-data {:tx-meta {:some "data"}} ["error1"])))
      (is (= [[:notification [nil :error nil nil nil {:i18n-key :storage/invalid-data-writing}]]]
             @broadcasts))
      (is (= 1 (count @posts)))
      (let [[type payload] (first @posts)]
        (is (= :capture-error type))
        (is (= "Invalid data writing to db" (ex-message (:error payload))))
        (is (= {:some "data"} (ex-data (:error payload))))
        (is (= {:payload {}
                :extra {:errors "[\"error1\"]"
                        :tx-meta {:some "data"}}}
               (dissoc payload :error)))))))

(deftest build-proxy-object-records-worker-client-id-test
  (async done
    (finish!
     (restoring-state
      (fn []
        (let [posts (atom [])
              proxy-calls (atom [])
              service (fn [extra]
                        (ready-service
                         :proxy #js {"remoteInvoke" (fn [args]
                                                      (swap! proxy-calls conj args)
                                                      (p/resolved :proxied))}
                         :client-id (:client-id extra)))]
          (reset! db-core/*service ["mut3-a" (service {})])
          (p/with-redefs [db-core/close-db! (fn [_] nil)
                          platform/post-message! (fn [_platform type payload] (swap! posts conj [type payload]))]
            (let [invoke (fn [client-id]
                           (p/with-redefs [shared-service/<create-service (fn [& _] (p/resolved (service {:client-id client-id})))]
                             (let [remote-invoke (gobj/get (#'db-core/build-proxy-object) "remoteInvoke")]
                               (remote-invoke "thread-api/create-or-open-db"
                                              (ldb/write-transit-str ["mut3-b" {}])))))]
              (p/let [_ (invoke "client-1")
                      with-id @posts
                      _ (do (reset! posts [])
                            (reset! db-core/*service ["mut3-a" (service {})])
                            (invoke nil))]
                (is (= [[:record-worker-client-id {:client-id "client-1"}]] with-id))
                (is (= [] @posts))))))))
     done)))

(deftest build-proxy-object-runs-sync-app-state-without-waiting-for-service-test
  (async done
    (let [direct-calls (atom [])
          proxy-calls (atom [])
          original (get @thread-api/*thread-apis :thread-api/sync-app-state)]
      (vswap! thread-api/*thread-apis assoc :thread-api/sync-app-state
              (fn [& args] (swap! direct-calls conj args) :direct))
      (finish!
       (restoring-state
        (fn []
          (reset! db-core/*service ["mut3-a" (ready-service
                                              :proxy #js {"remoteInvoke" (fn [args]
                                                                           (swap! proxy-calls conj args)
                                                                           (p/resolved :proxied))})])
          (let [remote-invoke (gobj/get (#'db-core/build-proxy-object) "remoteInvoke")]
            (p/let [_ (remote-invoke "thread-api/sync-app-state" (ldb/write-transit-str [{:a 1}]))]
              (is (= [[{:a 1}]] @direct-calls))
              (is (= [] @proxy-calls))))))
       (fn []
         (vswap! thread-api/*thread-apis assoc :thread-api/sync-app-state original)
         (done))))))
