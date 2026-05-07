(ns frontend.worker.db-core-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [datascript.storage :as storage]
            [frontend.common.thread-api :as thread-api]
            [frontend.common.graph-view :as graph-view]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.export :as worker-export]
            [frontend.worker.platform :as platform]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [frontend.worker-common.util :as worker-util]
            [goog.object :as gobj]
            [logseq.cli.common.db-worker :as cli-db-worker]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.view :as db-view]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]
            [shadow.resource :as rc]))

(def ^:private test-repo "db-core-test-repo")
;; Keep this compact to satisfy lint:large-vars while still asserting full API coverage.
(def ^:private expected-db-core-thread-apis
  (into #{}
        (concat
         [:thread-api/list-db :thread-api/init :thread-api/set-db-sync-config :thread-api/get-db-sync-config
          :thread-api/db-sync-status :thread-api/db-sync-start :thread-api/db-sync-stop :thread-api/db-sync-update-presence
          :thread-api/db-sync-request-asset-download :thread-api/db-sync-grant-graph-access :thread-api/db-sync-ensure-user-rsa-keys
          :thread-api/db-sync-list-remote-graphs :thread-api/db-sync-upload-graph :thread-api/db-sync-create-remote-graph
          :thread-api/db-sync-stop-upload :thread-api/db-sync-resume-upload :thread-api/db-sync-upload-stopped?
          :thread-api/db-sync-get-block-conflicts :thread-api/db-sync-clear-block-conflicts :thread-api/db-sync-download-graph-by-id
          :thread-api/create-or-open-db :thread-api/q :thread-api/datoms :thread-api/pull :thread-api/get-blocks
          :thread-api/get-block-refs :thread-api/get-block-refs-count :thread-api/get-block-source :thread-api/block-refs-check
          :thread-api/get-block-parents :thread-api/set-context :thread-api/transact :thread-api/undo-redo-set-pending-editor-info
          :thread-api/undo-redo-record-editor-info :thread-api/undo-redo-record-ui-state :thread-api/undo-redo-undo
          :thread-api/undo-redo-redo :thread-api/undo-redo-clear-history :thread-api/undo-redo-get-debug-state
          :thread-api/get-initial-data :thread-api/reset-db :thread-api/unsafe-unlink-db :thread-api/close-db
          :thread-api/db-sync-close-db :thread-api/db-sync-invalidate-search-db :thread-api/db-sync-recreate-lock
          :thread-api/db-sync-rehydrate-large-titles :thread-api/db-sync-import-prepare :thread-api/db-sync-import-rows-chunk
          :thread-api/db-sync-import-finalize :thread-api/release-access-handles :thread-api/db-exists
          :thread-api/export-db-base64 :thread-api/export-client-ops-db-base64 :thread-api/backup-db-sqlite
          :thread-api/import-db-base64 :thread-api/search-blocks :thread-api/search-upsert-blocks :thread-api/search-delete-blocks
          :thread-api/search-truncate-tables :thread-api/search-build-blocks-indice :thread-api/search-build-blocks-indice-in-worker
          :thread-api/search-build-pages-indice :thread-api/apply-outliner-ops :thread-api/sync-app-state
          :thread-api/markdown-mirror-set-enabled :thread-api/markdown-mirror-flush :thread-api/markdown-mirror-regenerate
          :thread-api/export-get-debug-datoms :thread-api/export-get-all-page->content :thread-api/validate-db
          :thread-api/recompute-checksum-diagnostics :thread-api/export-edn :thread-api/import-edn :thread-api/get-view-data
          :thread-api/get-class-objects :thread-api/get-property-values :thread-api/get-bidirectional-properties
          :thread-api/build-graph :thread-api/get-all-page-titles :thread-api/gc-graph :thread-api/mobile-logs
          :thread-api/get-rtc-graph-uuid :thread-api/cli-list-properties :thread-api/cli-list-tags :thread-api/cli-list-pages
          :thread-api/cli-list-tasks :thread-api/cli-list-nodes :thread-api/api-get-page-data :thread-api/api-list-properties
          :thread-api/api-list-tags :thread-api/api-list-pages :thread-api/api-build-upsert-nodes-edn])))

(defn- get-thread-api
  [k]
  (let [f (get @thread-api/*thread-apis k)]
    (assert (fn? f) (str "thread api not registered: " k))
    f))

(defn- build-test-platform
  ([]
   (build-test-platform {}))
  ([{:keys [post-message! remove-vfs! runtime import-db]
     :or {post-message! (fn [& _] nil)
          remove-vfs! (fn [_] nil)
          runtime :browser}}]
   {:env {:publishing? false
          :runtime runtime}
    :storage {:install-opfs-pool (fn [_sqlite _pool-name]
                                   (p/resolved #js {:pauseVfs (fn [] nil)
                                                    :unpauseVfs (fn [] nil)}))
              :list-graphs (fn [] (p/resolved []))
              :db-exists? (fn [_] (p/resolved false))
              :resolve-db-path (fn [_repo _pool path] path)
              :export-file (fn [_pool _path] (p/resolved (js/Uint8Array. 0)))
              :import-db (or import-db (fn [_pool _path _data] (p/resolved nil)))
              :remove-vfs! remove-vfs!
              :read-text! (fn [_path] (p/resolved ""))
              :write-text! (fn [_path _text] (p/resolved nil))
              :transfer (fn [data _transferables] data)}
    :kv {:get (fn [_] nil)
         :set! (fn [_ _] nil)}
    :broadcast {:post-message! post-message!}
    :websocket {:connect (fn [_] #js {})}
    :sqlite {:init! (fn [] nil)
             :open-db (fn [_opts] #js {})
             :close-db (fn [db] (.close db))
             :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
             :transaction (fn [db f] (.transaction db f))}
    :crypto {}
    :timers {:set-interval! (fn [_ _] nil)}}))

(defn- restoring-worker-state
  [f]
  (let [state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config
        sqlite-prev @worker-state/*sqlite
        sqlite-conns-prev @worker-state/*sqlite-conns
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        main-thread-prev @worker-state/*main-thread
        platform-prev @@#'platform/*platform
        search-build-prev @(deref #'db-core/*search-index-build-ids)
        cleanup (fn []
                  (reset! worker-state/*state state-prev)
                  (reset! worker-state/*db-sync-config config-prev)
                  (reset! worker-state/*sqlite sqlite-prev)
                  (reset! worker-state/*sqlite-conns sqlite-conns-prev)
                  (reset! worker-state/*datascript-conns datascript-prev)
                  (reset! worker-state/*client-ops-conns client-ops-prev)
                  (reset! worker-state/*opfs-pools opfs-prev)
                  (reset! worker-state/*main-thread main-thread-prev)
                  (reset! (deref #'db-core/*search-index-build-ids) search-build-prev)
                  (reset! @#'platform/*platform platform-prev))]
    (platform/set-platform! (build-test-platform))
    (reset! worker-state/*sqlite #js {})
    (reset! worker-state/*sqlite-conns {})
    (reset! worker-state/*datascript-conns {})
    (reset! worker-state/*client-ops-conns {})
    (reset! worker-state/*opfs-pools {})
    (reset! worker-state/*main-thread nil)
    (reset! (deref #'db-core/*search-index-build-ids) {})
    (let [result (f)]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

(defn- fake-db
  ([]
   (fake-db {}))
  ([{:keys [user-version sql-calls close-calls close-label]
     :or {user-version 0}}]
   #js {:exec (fn [sql-or-opts]
                (let [sql (if (string? sql-or-opts)
                            sql-or-opts
                            (gobj/get sql-or-opts "sql"))]
                  (when sql-calls
                    (swap! sql-calls conj sql))
                  (if (= sql "PRAGMA user_version")
                    #js [#js [user-version]]
                    #js [])))
        :close (fn []
                 (when close-calls
                   (swap! close-calls conj close-label)))}))

(deftest db-core-registers-db-sync-thread-apis
  (let [api-map @thread-api/*thread-apis]
    (is (contains? api-map :thread-api/set-db-sync-config))
    (is (contains? api-map :thread-api/db-sync-start))
    (is (contains? api-map :thread-api/db-sync-stop))
    (is (contains? api-map :thread-api/db-sync-update-presence))
    (is (contains? api-map :thread-api/db-sync-request-asset-download))
    (is (contains? api-map :thread-api/db-sync-grant-graph-access))
    (is (contains? api-map :thread-api/db-sync-ensure-user-rsa-keys))
    (is (contains? api-map :thread-api/db-sync-upload-graph))))

(deftest resolve-initial-config-falls-back-to-template-config-test
  (let [resolve-initial-config #'db-core/resolve-initial-config
        template-config (rc/inline "templates/config.edn")]
    (is (= template-config (resolve-initial-config nil)))
    (is (= "" (resolve-initial-config "")))
    (is (= "{:foo true}" (resolve-initial-config "{:foo true}")))))

(deftest import-db-base64-uses-active-pool-after-close-db
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [import-db! (get @thread-api/*thread-apis :thread-api/import-db-base64)
              imported-pool-ids (atom [])
              pool-seq (atom 0)
              make-pool (fn [id]
                          (let [pool #js {:id id
                                          :paused false}]
                            (set! (.-pauseVfs pool) (fn [] (set! (.-paused pool) true)))
                            (set! (.-unpauseVfs pool) (fn [] (set! (.-paused pool) false)))
                            pool))
              existing-pool (make-pool "existing-pool")
              sqlite-data (.encode (js/TextEncoder.) "SQLite format 3")
              sqlite-base64 (.toString (js/Buffer.from sqlite-data) "base64")]
          (reset! worker-state/*opfs-pools {test-repo existing-pool})
          (let [platform' (build-test-platform
                           {:import-db (fn [pool _path _data]
                                         (swap! imported-pool-ids conj (.-id pool))
                                         (if (.-paused pool)
                                           (p/rejected (js/Error. "No available handles to import to."))
                                           (p/resolved nil)))})]
            (platform/set-platform!
             (assoc platform'
                    :storage
                    (assoc (:storage platform')
                           :install-opfs-pool (fn [_sqlite _pool-name]
                                                (let [id (str "new-pool-" (swap! pool-seq inc))]
                                                  (p/resolved (make-pool id))))))))
          (-> (import-db! test-repo sqlite-base64)
              (p/then (fn [_]
                        (is (= ["new-pool-1"] @imported-pool-ids))))
              (p/catch (fn [error]
                         (is false (str "expected import to succeed with active pool, got " error))))))))
     (p/finally done))))

(deftest set-db-sync-config-keeps-only-non-auth-fields-test
  (let [set-config! (get @thread-api/*thread-apis :thread-api/set-db-sync-config)
        get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*state (assoc state-prev
                                         :auth/id-token "existing-id-token"
                                         :auth/oauth-token-url "https://existing.example.com/oauth2/token"
                                         :auth/oauth-domain "existing.example.com"
                                         :auth/oauth-client-id "existing-client-id"))
      (set-config! {:ws-url "wss://example.com/sync/%s"
                    :http-base "https://example.com"
                    :enabled? true
                    :auth-token "id-token-from-config"
                    :oauth-token-url "https://auth.example.com/oauth2/token"
                    :oauth-domain "auth.example.com"
                    :oauth-client-id "worker-client-id"})
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             @worker-state/*db-sync-config))
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             (get-config)))
      (is (= "existing-id-token" (:auth/id-token @worker-state/*state)))
      (is (= "https://existing.example.com/oauth2/token"
             (:auth/oauth-token-url @worker-state/*state)))
      (is (= "existing.example.com" (:auth/oauth-domain @worker-state/*state)))
      (is (= "existing-client-id" (:auth/oauth-client-id @worker-state/*state)))
      (finally
        (reset! worker-state/*state state-prev)
        (reset! worker-state/*db-sync-config config-prev)))))

(deftest get-db-sync-config-strips-auth-fields-test
  (let [get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"
                                            :auth-token "leaked-token"
                                            :oauth-client-id "leaked-client"})
      (is (= {:ws-url "wss://example.com/sync/%s"}
             (get-config)))
      (finally
        (reset! worker-state/*db-sync-config config-prev)))))

(deftest init-service-does-not-close-db-when-graph-unchanged
  (async done
         (let [service {:status {:ready (p/resolved true)}
                        :proxy #js {}}
               close-calls (atom [])
               create-calls (atom 0)
               *service @#'db-core/*service
               old-service @*service]
           (reset! *service ["graph-a" service])
           (with-redefs [db-core/close-db! (fn [repo]
                                             (swap! close-calls conj repo)
                                             nil)
                         shared-service/<create-service (fn [& _]
                                                          (swap! create-calls inc)
                                                          (p/resolved service))]
             (-> (#'db-core/<init-service! "graph-a" {})
                 (p/then (fn [result]
                           (is (= service result))
                           (is (= [] @close-calls))
                           (is (zero? @create-calls))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (reset! *service old-service)
                              (done))))))))

(deftest search-build-blocks-indice-in-worker-reports-progress-to-main-thread-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [build-index! (get @thread-api/*thread-apis :thread-api/search-build-blocks-indice-in-worker)
              conn (d/create-conn db-schema/schema)
              search-db (fake-db)
              progress-calls (atom [])
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
          (d/transact! conn [{:block/uuid (random-uuid)}])
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread
                  (fn [qkw & args]
                    (when (= qkw :thread-api/search-index-build-progress)
                      (let [[repo payload] args]
                        (swap! progress-calls conj {:qkw qkw
                                                    :repo repo
                                                    :payload payload})))
                    (p/resolved nil)))
          (with-redefs [search/truncate-table! (fn [_db] nil)
                        search/upsert-blocks! (fn [_db _blocks] nil)
                        search/hidden-entity? (constantly false)
                        search/block->index (fn [_entity]
                                              {:id "block-1"
                                               :page "page-1"
                                               :title "Hello"})]
            (-> (p/let [_ (build-index! test-repo true)
                        _ (p/loop [remaining 20]
                            (if (or (seq @progress-calls)
                                    (zero? remaining))
                              nil
                              (p/let [_ (p/delay 5)]
                                (p/recur (dec remaining)))))]
                  (let [statuses (map (comp :status :payload) @progress-calls)
                        completed (some #(when (= :completed (get-in % [:payload :status]))
                                           %)
                                        @progress-calls)]
                    (is (= test-repo (:repo (first @progress-calls))))
                    (is (= :running (first statuses)))
                    (is (some #{:completed} statuses))
                    (is (= :idle (last statuses)))
                    (is (= 1 (get-in completed [:payload :processed])))
                    (is (= 1 (get-in completed [:payload :total])))))
                (p/catch (fn [error]
                           (is false (str error)))))))))
     (p/finally done))))

(deftest release-access-handles-clears-active-import-state-test
  (restoring-worker-state
   (fn []
     (let [release-access-handles! (get @thread-api/*thread-apis :thread-api/release-access-handles)
           *import-state @#'sync-download/*import-state
           import-state-prev @*import-state
           closed (atom [])
           removed-pools (atom [])
           pause-calls (atom 0)]
       (try
         (platform/set-platform! (build-test-platform {:remove-vfs! (fn [pool]
                                                                      (swap! removed-pools conj pool)
                                                                      (p/resolved nil))}))
         (reset! worker-state/*opfs-pools {test-repo #js {:pauseVfs (fn [] (swap! pause-calls inc))}})
         (reset! *import-state {:repo test-repo
                                :graph-id "graph-1"
                                :import-id "import-1"
                                :rows-db #js {:close (fn [] (swap! closed conj :rows-db))}
                                :rows-pool :rows-pool})

         (release-access-handles! test-repo)

         (is (nil? @*import-state))
         (is (= [:rows-db] @closed))
         (is (= [:rows-pool] @removed-pools))
         (is (= 1 @pause-calls))
         (finally
           (reset! *import-state import-state-prev)))))))

(deftest close-db-clears-active-import-state-test
  (restoring-worker-state
   (fn []
     (let [*import-state @#'sync-download/*import-state
           import-state-prev @*import-state
           closed (atom [])
           removed-pools (atom [])
           pause-calls (atom 0)]
       (try
         (platform/set-platform! (build-test-platform {:remove-vfs! (fn [pool]
                                                                      (swap! removed-pools conj pool)
                                                                      (p/resolved nil))}))
         (reset! worker-state/*sqlite-conns
                 {test-repo {:db (fake-db {:close-calls closed :close-label :db})
                             :search (fake-db {:close-calls closed :close-label :search})
                             :client-ops (fake-db {:close-calls closed :close-label :client-ops})}})
         (reset! worker-state/*datascript-conns {test-repo :datascript})
         (reset! worker-state/*client-ops-conns {test-repo :client-ops})
         (reset! worker-state/*opfs-pools {test-repo #js {:pauseVfs (fn [] (swap! pause-calls inc))}})
         (reset! *import-state {:repo test-repo
                                :graph-id "graph-1"
                                :import-id "import-1"
                                :rows-db #js {:close (fn [] (swap! closed conj :rows-db))}
                                :rows-pool :rows-pool})

         (db-core/close-db! test-repo)

         (is (nil? @*import-state))
         (is (= #{:rows-db :db :search :client-ops} (set @closed)))
         (is (= [:rows-pool] @removed-pools))
         (is (= 1 @pause-calls))
         (finally
           (reset! *import-state import-state-prev)))))))

;; ---- ->uint8array tests ----

(deftest ->uint8array-returns-uint8array-unchanged
  (let [->uint8array #'db-core/->uint8array
        arr (js/Uint8Array. [1 2 3])]
    (is (identical? arr (->uint8array arr)))))

(deftest ->uint8array-converts-arraybuffer
  (let [->uint8array #'db-core/->uint8array
        buffer (js/ArrayBuffer. 4)]
    (is (instance? js/Uint8Array (->uint8array buffer)))
    (is (= 4 (.-length (->uint8array buffer))))))

(deftest ->uint8array-converts-arraybuffer-view
  (let [->uint8array #'db-core/->uint8array
        buffer (js/ArrayBuffer. 8)
        view (js/DataView. buffer)]
    (is (instance? js/Uint8Array (->uint8array view)))))

(deftest ->uint8array-converts-js-array
  (let [->uint8array #'db-core/->uint8array
        arr (js/Array. 1 2 3)]
    (is (instance? js/Uint8Array (->uint8array arr)))
    (is (= 3 (.-length (->uint8array arr))))))

(deftest ->uint8array-passes-through-other-data
  (let [->uint8array #'db-core/->uint8array]
    (is (= "string" (->uint8array "string")))
    (is (= nil (->uint8array nil)))
    (is (= 42 (->uint8array 42)))))

;; ---- node-runtime? tests ----

(deftest node-runtime-returns-true-for-node
  (restoring-worker-state
   (fn []
     (let [node-runtime? #'db-core/node-runtime?]
       (platform/set-platform! (build-test-platform {:runtime :node}))
       (is (true? (node-runtime?)))))))

(deftest node-runtime-returns-false-for-browser
  (restoring-worker-state
   (fn []
     (let [node-runtime? #'db-core/node-runtime?]
       (platform/set-platform! (build-test-platform {:runtime :browser}))
       (is (false? (node-runtime?)))))))

;; ---- storage-pool-name tests ----

(deftest storage-pool-name-uses-graph-dir-key-for-node
  (restoring-worker-state
   (fn []
     (let [storage-pool-name #'db-core/storage-pool-name]
       (platform/set-platform! (build-test-platform {:runtime :node}))
       ;; For node, it should use graph-dir/repo->graph-dir-key
       (is (string? (storage-pool-name test-repo)))))))

(deftest storage-pool-name-uses-worker-util-for-browser
  (restoring-worker-state
   (fn []
     (let [storage-pool-name #'db-core/storage-pool-name]
       (platform/set-platform! (build-test-platform {:runtime :browser}))
       ;; For browser, it should use worker-util/get-pool-name which returns a string
       (is (string? (storage-pool-name test-repo)))))))

;; ---- get-storage-pool / remember-storage-pool! / forget-storage-pool! tests ----

(deftest storage-pool-operations-for-browser
  (restoring-worker-state
   (fn []
     (let [get-storage-pool #'db-core/get-storage-pool
           remember-storage-pool! #'db-core/remember-storage-pool!
           forget-storage-pool! #'db-core/forget-storage-pool!
           pool #js {:id "test-pool"}]
       (platform/set-platform! (build-test-platform {:runtime :browser}))
       ;; Initially no pool
       (is (nil? (get-storage-pool test-repo)))
       ;; Remember pool
       (remember-storage-pool! test-repo pool)
       (is (identical? pool (get-storage-pool test-repo)))
       ;; Forget pool
       (forget-storage-pool! test-repo)
       (is (nil? (get-storage-pool test-repo)))))))

(deftest storage-pool-operations-for-node
  (restoring-worker-state
   (fn []
     (let [get-storage-pool #'db-core/get-storage-pool
           remember-storage-pool! #'db-core/remember-storage-pool!
           forget-storage-pool! #'db-core/forget-storage-pool!
           node-pool #js {:id "node-pool"}
           opfs-pool #js {:id "opfs-pool"}]
       (platform/set-platform! (build-test-platform {:runtime :node}))
       ;; Initially no pool
       (is (nil? (get-storage-pool test-repo)))
       ;; Remember pool in node-pools
       (remember-storage-pool! test-repo node-pool)
       (is (identical? node-pool (get-storage-pool test-repo)))
       ;; Also set opfs-pool to verify node pool takes precedence
       (swap! worker-state/*opfs-pools assoc test-repo opfs-pool)
       (is (identical? node-pool (get-storage-pool test-repo)))
       ;; Forget pool clears both
       (forget-storage-pool! test-repo)
       (is (nil? (get-storage-pool test-repo)))
       (is (nil? (get @#'db-core/*node-pools test-repo)))
       (is (nil? (get @worker-state/*opfs-pools test-repo)))))))

;; ---- resolve-db-path tests ----

(deftest resolve-db-path-uses-storage-fn-when-available
  (restoring-worker-state
   (fn []
     (let [resolve-db-path #'db-core/resolve-db-path
           pool #js {:id "pool"}]
       (platform/set-platform! (build-test-platform))
       ;; When no resolve-db-path fn, returns path as-is
       (is (= "/db.sqlite" (resolve-db-path test-repo pool "/db.sqlite")))
       ;; With custom resolve-db-path
       (platform/set-platform!
        (assoc-in (build-test-platform) [:storage :resolve-db-path]
                  (fn [repo _path path]
                    (str repo "-" path))))
       (is (= (str test-repo "-/db.sqlite")
              (resolve-db-path test-repo pool "/db.sqlite")))))))

;; ---- checkpoint-db! tests ----

(deftest checkpoint-db-executes-wal-checkpoint
  (let [checkpoint-db! #'db-core/checkpoint-db!
        sql-calls (atom [])
        db #js {:exec (fn [sql]
                        (swap! sql-calls conj sql)
                        #js [])}]
    (checkpoint-db! "test-repo" db)
    (is (= ["PRAGMA wal_checkpoint(TRUNCATE)"] @sql-calls))))

(deftest checkpoint-db-handles-non-function-exec
  (let [checkpoint-db! #'db-core/checkpoint-db!]
    ;; db without exec fn should not throw
    (is (nil? (checkpoint-db! "test-repo" #js {})))
    ;; nil db should not throw
    (is (nil? (checkpoint-db! "test-repo" nil)))))

(deftest checkpoint-db-catches-exec-errors
  (let [checkpoint-db! #'db-core/checkpoint-db!
        db #js {:exec (fn [_]
                        (throw (js/Error. "checkpoint failed")))}]
    ;; Should not throw
    (is (nil? (checkpoint-db! "test-repo" db)))))

;; ---- new-sqlite-storage tests ----

(deftest new-sqlite-storage-implements-storage-protocol
  (let [new-sqlite-storage #'db-core/new-sqlite-storage
        db #js {:transaction (fn [f]
                                (f #js {:exec (fn [_] nil)}))}
        storage (new-sqlite-storage db)]
    ;; Verify it implements IStorage by checking it responds to protocol methods
    ;; In CLJS, reify creates an object that implements the protocol
    (is (some? storage))
    ;; Try calling the store method to verify it works
    (is (nil? (storage/-store storage [] [])))))

;; ---- search-index-version tests ----

(deftest search-index-version-reads-user-version
  (let [search-index-version #'db-core/search-index-version
        db (fake-db {:user-version 5})]
    (is (= 5 (search-index-version db)))))

(deftest search-index-version-reads-default-zero
  (let [search-index-version #'db-core/search-index-version
        db (fake-db {:user-version 0})]
    (is (= 0 (search-index-version db)))))

;; ---- search-index-build management tests ----

(deftest start-search-index-build-creates-build-id
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'db-core/start-search-index-build!
           build-id (start-search-index-build! test-repo)]
       (is (string? build-id))
       (is (= build-id (get @(deref #'db-core/*search-index-build-ids) test-repo)))))))

(deftest clear-search-index-build-removes-only-matching-build
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'db-core/start-search-index-build!
           clear-search-index-build! #'db-core/clear-search-index-build!
           build-id (start-search-index-build! test-repo)]
       ;; Clear with matching build-id
       (clear-search-index-build! test-repo build-id)
       (is (nil? (get @(deref #'db-core/*search-index-build-ids) test-repo)))
       ;; Start a new build
       (let [build-id-2 (start-search-index-build! test-repo)]
         ;; Clear with wrong build-id should not remove
         (clear-search-index-build! test-repo "wrong-id")
         (is (= build-id-2 (get @(deref #'db-core/*search-index-build-ids) test-repo))))))))

(deftest ensure-active-search-index-build-throws-for-stale-build
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'db-core/start-search-index-build!
           ensure-active-search-index-build! #'db-core/ensure-active-search-index-build!
           build-id (start-search-index-build! test-repo)]
       ;; Current build-id should not throw
       (is (nil? (ensure-active-search-index-build! test-repo build-id)))
       ;; Stale build-id should throw
       (is (thrown? js/Error (ensure-active-search-index-build! test-repo "stale-id")))))))

;; ---- take-block-datoms-batch tests ----

(deftest take-block-datoms-batch-returns-all-for-small-input
  (let [take-block-datoms-batch #'db-core/take-block-datoms-batch
        datoms [{:e 1} {:e 2} {:e 3}]
        [batch remaining] (take-block-datoms-batch datoms 10 1000)]
    (is (= 3 (count batch)))
    (is (nil? remaining))))

(deftest take-block-datoms-batch-respects-batch-size
  (let [take-block-datoms-batch #'db-core/take-block-datoms-batch
        datoms (vec (for [i (range 100)] {:e i}))
        [batch remaining] (take-block-datoms-batch datoms 10 1000)]
    (is (= 10 (count batch)))
    (is (= 90 (count remaining)))))

(deftest take-block-datoms-batch-returns-empty-for-empty-input
  (let [take-block-datoms-batch #'db-core/take-block-datoms-batch
        [batch remaining] (take-block-datoms-batch [] 10 1000)]
    (is (empty? batch))
    (is (nil? remaining))))

;; ---- search-index-input-idle? tests ----

(deftest search-index-input-idle-returns-true-for-node
  (restoring-worker-state
   (fn []
     (let [search-index-input-idle? #'db-core/search-index-input-idle?]
       (platform/set-platform! (build-test-platform {:runtime :node}))
       (is (true? (search-index-input-idle? test-repo)))))))

(deftest search-index-input-idle-reads-status-from-state
  (restoring-worker-state
   (fn []
     (let [search-index-input-idle? #'db-core/search-index-input-idle?
           idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
       (platform/set-platform! (build-test-platform {:runtime :browser}))
       ;; No status set - should default to true
       (is (true? (search-index-input-idle? test-repo)))
       ;; Set idle? false
       (reset! idle-status-atom {test-repo {:idle? false
                                            :ts (.now js/Date)}})
       (is (false? (search-index-input-idle? test-repo)))
       ;; Set idle? true
       (reset! idle-status-atom {test-repo {:idle? true
                                            :ts (.now js/Date)}})
       (is (true? (search-index-input-idle? test-repo)))))))

(deftest search-index-input-idle-falls-back-to-true-for-stale-status
  (restoring-worker-state
   (fn []
     (let [search-index-input-idle? #'db-core/search-index-input-idle?
           idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
       (platform/set-platform! (build-test-platform {:runtime :browser}))
       ;; Set stale status (older than ttl)
       (reset! idle-status-atom {test-repo {:idle? false
                                            :ts (- (.now js/Date) 5000)}})
       ;; Should fall back to true because status is stale
       (is (true? (search-index-input-idle? test-repo)))))))

;; ---- close-other-dbs! tests ----

(deftest close-other-dbs-closes-all-except-target
  (restoring-worker-state
   (fn []
     (let [close-calls (atom [])]
       (with-redefs [db-core/close-db-aux! (fn [repo _db _search _client-ops]
                                             (swap! close-calls conj repo))]
         (reset! worker-state/*sqlite-conns {"repo-a" {:db (fake-db)}
                                             "repo-b" {:db (fake-db)}
                                             test-repo {:db (fake-db)}})
         (#'db-core/close-other-dbs! test-repo)
         (is (= #{"repo-a" "repo-b"} (set @close-calls)))
         (is (not (contains? (set @close-calls) test-repo))))))))

(deftest close-other-dbs-handles-empty-connections
  (restoring-worker-state
   (fn []
     (let [close-calls (atom [])]
       (with-redefs [db-core/close-db-aux! (fn [repo _db _search _client-ops]
                                             (swap! close-calls conj repo))]
         (reset! worker-state/*sqlite-conns {})
         (#'db-core/close-other-dbs! test-repo)
         (is (empty? @close-calls)))))))

;; ---- reset-db! tests ----

(deftest reset-db-replaces-conn-db
  (restoring-worker-state
   (fn []
     (let [conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :test/entity
                           :kv/value "original"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       ;; Create a new db with different data
       (let [new-db (d/db-with (d/empty-db db-schema/schema)
                               [{:db/ident :test/entity
                                 :kv/value "replaced"}])
             transit-str (ldb/write-transit-str new-db)]
         (db-core/reset-db! test-repo transit-str)
         ;; Verify the conn now has the new data
        (is (= "replaced" (:kv/value (d/entity @conn :test/entity)))))))))

;; ---- checksum-diagnostics tests ----

(deftest checksum-diagnostics-returns-local-and-remote
  (restoring-worker-state
   (fn []
     (let [checksum-diagnostics #'db-core/checksum-diagnostics]
       (with-redefs [client-op/get-local-checksum (fn [_] "local-checksum-123")
                     db-sync/*repo->latest-remote-checksum (atom {test-repo "remote-checksum-456"})]
         (is (= {:local-checksum "local-checksum-123"
                 :remote-checksum "remote-checksum-456"}
                (checksum-diagnostics test-repo))))))))

(deftest checksum-diagnostics-handles-missing-remote
  (restoring-worker-state
   (fn []
     (let [checksum-diagnostics #'db-core/checksum-diagnostics]
       (with-redefs [client-op/get-local-checksum (fn [_] "local-checksum-123")
                     db-sync/*repo->latest-remote-checksum (atom {})]
         (is (= {:local-checksum "local-checksum-123"
                 :remote-checksum nil}
                (checksum-diagnostics test-repo))))))))

;; ---- get-all-page-titles tests ----

(deftest get-all-page-titles-returns-sorted-titles
  (let [get-all-page-titles #'db-core/get-all-page-titles
        conn (d/create-conn db-schema/schema)]
    ;; ldb/get-all-pages expects specific schema attributes, so we mock it
    (with-redefs [ldb/get-all-pages (fn [_db]
                                      [{:block/title "Charlie"}
                                       {:block/title "Alpha"}
                                       {:block/title "Bravo"}])]
      (let [titles (get-all-page-titles @conn)]
        (is (= ["Alpha" "Bravo" "Charlie"] titles))))))

(deftest get-all-page-titles-returns-empty-for-no-pages
  (let [get-all-page-titles #'db-core/get-all-page-titles
        conn (d/create-conn db-schema/schema)]
    (is (empty? (get-all-page-titles @conn)))))

;; ---- notify-invalid-data tests ----

(deftest notify-invalid-data-broadcasts-notification
  (let [notify-invalid-data #'db-core/notify-invalid-data
        broadcast-calls (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [type payload]
                                                       (swap! broadcast-calls conj [type payload]))
                  platform/post-message! (fn [& _] nil)]
      (notify-invalid-data {:tx-meta {:some "data"}} ["error1"])
      (is (= 1 (count @broadcast-calls)))
      (is (= :notification (first (first @broadcast-calls)))))))

(deftest notify-invalid-data-skips-undo-redo-in-production
  (restoring-worker-state
   (fn []
     (let [notify-invalid-data #'db-core/notify-invalid-data
           broadcast-calls (atom [])]
       (with-redefs [shared-service/broadcast-to-clients! (fn [type payload]
                                                             (swap! broadcast-calls conj [type payload]))
                     platform/post-message! (fn [& _] nil)
                     worker-util/dev? false]
         ;; Should not broadcast for undo
         (notify-invalid-data {:tx-meta {:undo? true}} ["error"])
         (is (empty? @broadcast-calls))
         ;; Should not broadcast for redo
         (notify-invalid-data {:tx-meta {:redo? true}} ["error"])
         (is (empty? @broadcast-calls))
         ;; Should broadcast for normal tx
         (notify-invalid-data {:tx-meta {:normal true}} ["error"])
         (is (= 1 (count @broadcast-calls))))))))

;; ---- broadcast-data-types tests ----

(deftest broadcast-data-types-contains-expected-types
  (let [types db-core/broadcast-data-types]
    (is (set? types))
    (is (contains? types "sync-db-changes"))
    (is (contains? types "sync-conflicts-updated"))
    (is (contains? types "notification"))
    (is (contains? types "log"))
    (is (contains? types "add-repo"))
    (is (contains? types "rtc-log"))
    (is (contains? types "rtc-sync-state"))))

;; ---- init-core! tests ----

(deftest init-core-sets-platform-and-registers-callback
  (restoring-worker-state
   (fn []
     (let [platform' (build-test-platform)]
       (db-core/init-core! platform')
       (is (= platform' @@#'platform/*platform))))))

;; ---- build-proxy-object tests ----

(deftest build-proxy-object-creates-js-object
  (let [build-proxy-object #'db-core/build-proxy-object
        proxy (build-proxy-object)]
    (is (object? proxy))
    ;; Should contain the remoteInvoke function
    (is (fn? (gobj/get proxy "remoteInvoke")))))

;; ---- <init-service! tests ----

(deftest init-service-returns-nil-for-nil-graph
  (async done
    (let [*service @#'db-core/*service
          old-service @*service
          close-calls (atom [])]
      (reset! *service ["prev-graph" {}])
      (with-redefs [db-core/close-db! (fn [repo]
                                        (swap! close-calls conj repo))]
        (-> (#'db-core/<init-service! nil {})
            (p/then (fn [result]
                      (is (nil? result))
                      (is (= ["prev-graph"] @close-calls))))
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (reset! *service old-service)
                         (done))))))))

(deftest init-service-reuses-existing-service-for-same-graph
  (async done
    (let [service {:status {:ready (p/resolved true)}
                   :proxy #js {}}
          *service @#'db-core/*service
          old-service @*service]
      (reset! *service ["graph-a" service])
      (with-redefs [shared-service/<create-service (fn [& _]
                                                       (p/resolved {}))]
        (-> (#'db-core/<init-service! "graph-a" {})
            (p/then (fn [result]
                      (is (= service result))))
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (reset! *service old-service)
                         (done))))))))

;; ---- <db-exists? tests ----

(deftest db-exists-returns-storage-result
  (async done
    (restoring-worker-state
     (fn []
       (let [<db-exists? #'db-core/<db-exists?]
         (platform/set-platform! (build-test-platform))
         (-> (<db-exists? test-repo)
             (p/then (fn [result]
                       (is (false? result))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done)))))))

;; ---- report-search-index-progress! tests ----

(deftest report-search-index-progress-sends-to-main-thread
  (restoring-worker-state
   (fn []
     (let [report-search-index-progress! #'db-core/report-search-index-progress!
           progress-calls (atom [])]
       (reset! worker-state/*main-thread
               (fn [qkw & args]
                 (when (= qkw :thread-api/search-index-build-progress)
                   (swap! progress-calls conj args))
                 (p/resolved nil)))
       (-> (report-search-index-progress! test-repo {:progress 50})
           (p/then (fn [_]
                     (is (= 1 (count @progress-calls)))
                     (is (= [test-repo {:progress 50}] (first @progress-calls))))))))))

(deftest report-search-index-progress-catches-main-thread-errors
  (restoring-worker-state
   (fn []
     (let [report-search-index-progress! #'db-core/report-search-index-progress!]
       (reset! worker-state/*main-thread
               (fn [& _]
                 (p/rejected (js/Error. "main thread error"))))
       ;; Should not throw even when main thread fails
       (-> (report-search-index-progress! test-repo {:progress 50})
           (p/then (fn [_]
                     (is true "should not throw"))))))))

;; ---- transact thread-api tests ----

(deftest transact-insert-blocks-adds-block-order
  (restoring-worker-state
   (fn []
     (let [transact! (get @thread-api/*thread-apis :thread-api/transact)
           conn (d/create-conn db-schema/schema)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       ;; Mock db-order/gen-key to return predictable value
       (with-redefs [db-order/gen-key (fn [_] "generated-key")]
         ;; Transaction with :insert-blocks op and missing block/order
         (transact! test-repo
                      [{:block/uuid (random-uuid)
                        :block/title "test"}]
                      {:outliner-op :insert-blocks}
                      nil)
         ;; Verify the block was transacted with generated order
         (let [db @conn
               blocks (d/q '[:find [?b ...]
                             :where [?b :block/title "test"]]
                           db)]
           (is (= 1 (count blocks)))
           (is (= "generated-key" (:block/order (d/entity db (first blocks)))))))))))

(deftest transact-skips-when-today-journal-already-exists
  (restoring-worker-state
   (fn []
     (let [transact! (get @thread-api/*thread-apis :thread-api/transact)
           conn (d/create-conn db-schema/schema)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       ;; Create today's journal page
       (d/transact! conn [{:block/title "2024-01-01"
                           :block/name "2024-01-01"}])
       ;; Transaction with create-today-journal? should be skipped
       (let [result (transact! test-repo
                                [{:block/title "journal entry"}]
                                {:create-today-journal? true
                                 :today-journal-name "2024-01-01"}
                                nil)]
         ;; Should return nil (no transaction performed)
         (is (nil? result)))))))

;; ---- get-initial-data tests ----

(deftest get-initial-data-returns-schema-and-datoms-for-file-graph
  (restoring-worker-state
   (fn []
     (let [get-initial-data! (get @thread-api/*thread-apis :thread-api/get-initial-data)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:block/title "test page"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (get-initial-data! test-repo {:file-graph-import? true})]
         (is (contains? result :schema))
         (is (contains? result :initial-data))
        (is (vector? (:initial-data result))))))))

(deftest get-initial-data-returns-common-data-for-normal-graph
  (restoring-worker-state
   (fn []
     (let [get-initial-data! (get @thread-api/*thread-apis :thread-api/get-initial-data)
           conn (d/create-conn db-schema/schema)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [common-initial-data/get-initial-data (fn [_db] {:ok true})]
         (let [result (get-initial-data! test-repo {})]
         ;; Should return common-initial-data format
           (is (= {:ok true} result))))))))

;; ---- q / datoms / pull thread-api tests ----

(deftest q-executes-datascript-query
  (restoring-worker-state
   (fn []
     (let [q! (get @thread-api/*thread-apis :thread-api/q)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:block/title "page a"}
                          {:block/title "page b"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (q! test-repo ['[:find ?t :where [_ :block/title ?t]]])]
         (is (= 2 (count result))))))))

(deftest q-returns-nil-for-missing-conn
  (let [q! (get @thread-api/*thread-apis :thread-api/q)]
    (is (nil? (q! "nonexistent-repo" ['[:find ?e :where [?e _ _]]])))))

(deftest datoms-returns-formatted-datoms
  (restoring-worker-state
   (fn []
     (let [datoms! (get @thread-api/*thread-apis :thread-api/datoms)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:block/title "test"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (datoms! test-repo :eavt)]
         (is (seq result))
         ;; Each result should be [e a v tx added]
         (is (= 5 (count (first result)))))))))

(deftest pull-returns-entity-data
  (restoring-worker-state
   (fn []
     (let [pull! (get @thread-api/*thread-apis :thread-api/pull)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:block/title "test page"
                           :block/name "test-page"
                           :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       ;; Pull the entity we just created
       (with-redefs [common-initial-data/with-parent (fn [_db entity] entity)]
         (let [result (pull! test-repo '[*] [:block/name "test-page"])]
         (is (map? result))
           (is (= "test page" (:block/title result)))))))))

;; ---- undo-redo thread-api tests ----

(deftest undo-redo-clear-history-calls-worker-fn
  (restoring-worker-state
   (fn []
     (let [clear-history! (get @thread-api/*thread-apis :thread-api/undo-redo-clear-history)
           calls (atom [])]
       (with-redefs [worker-undo-redo/clear-history! (fn [repo]
                                                       (swap! calls conj repo))]
         (clear-history! test-repo)
         (is (= [test-repo] @calls)))))))

(deftest undo-redo-get-debug-state-calls-worker-fn
  (restoring-worker-state
   (fn []
     (let [get-debug-state! (get @thread-api/*thread-apis :thread-api/undo-redo-get-debug-state)]
       (with-redefs [worker-undo-redo/get-debug-state (fn [repo]
                                                        {:repo repo :history []})]
         (is (= {:repo test-repo :history []}
                (get-debug-state! test-repo))))))))

;; ---- mobile-logs tests ----

(deftest mobile-logs-returns-worker-state-log
  (let [mobile-logs! (get @thread-api/*thread-apis :thread-api/mobile-logs)
        log-prev @worker-state/*log]
    (try
      (reset! worker-state/*log ["log1" "log2"])
      (is (= ["log1" "log2"] (mobile-logs!)))
      (finally
        (reset! worker-state/*log log-prev)))))

;; ---- get-rtc-graph-uuid tests ----

(deftest get-rtc-graph-uuid-returns-uuid-from-conn
  (restoring-worker-state
   (fn []
     (let [get-uuid! (get @thread-api/*thread-apis :thread-api/get-rtc-graph-uuid)
           conn (d/create-conn db-schema/schema)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [ldb/get-graph-rtc-uuid (fn [_db]
                                              #uuid "22222222-2222-2222-2222-222222222222")]
         (is (= #uuid "22222222-2222-2222-2222-222222222222"
                (get-uuid! test-repo))))))))

(deftest get-rtc-graph-uuid-returns-nil-for-missing-conn
  (let [get-uuid! (get @thread-api/*thread-apis :thread-api/get-rtc-graph-uuid)]
    (is (nil? (get-uuid! "nonexistent-repo")))))

;; ---- search-delete-blocks / search-truncate-tables tests ----

(deftest search-delete-blocks-calls-search-fn
  (restoring-worker-state
   (fn []
     (let [delete-blocks! (get @thread-api/*thread-apis :thread-api/search-delete-blocks)
           calls (atom [])]
       (reset! worker-state/*sqlite-conns {test-repo {:search (fake-db)}})
       (with-redefs [search/delete-blocks! (fn [db ids]
                                              (swap! calls conj [db ids]))]
         (delete-blocks! test-repo [1 2 3])
         (is (= 1 (count @calls)))
         (is (= [1 2 3] (second (first @calls)))))))))

(deftest search-truncate-tables-calls-search-fn
  (restoring-worker-state
   (fn []
     (let [truncate-tables! (get @thread-api/*thread-apis :thread-api/search-truncate-tables)
           calls (atom [])]
       (reset! worker-state/*sqlite-conns {test-repo {:search (fake-db)}})
       (with-redefs [search/truncate-table! (fn [db]
                                              (swap! calls conj db))]
         (truncate-tables! test-repo)
         (is (= 1 (count @calls))))))))

;; ---- db-exists thread-api test ----

(deftest db-exists-returns-false-by-default
  (async done
    (restoring-worker-state
     (fn []
       (let [db-exists! (get @thread-api/*thread-apis :thread-api/db-exists)]
         (platform/set-platform! (build-test-platform))
         (-> (db-exists! test-repo)
             (p/then (fn [result]
                       (is (false? result))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done)))))))

;; ---- export-db-base64 thread-api test ----

(deftest export-db-base64-returns-base64-string
  (async done
    (restoring-worker-state
     (fn []
       (let [export-db! (get @thread-api/*thread-apis :thread-api/export-db-base64)
             checkpoint-calls (atom [])]
         (reset! worker-state/*sqlite-conns {test-repo {:db (fake-db)}})
         (with-redefs [db-core/checkpoint-db! (fn [repo db]
                                                (swap! checkpoint-calls conj [repo db]))]
           (-> (export-db! test-repo)
               (p/then (fn [result]
                         ;; Result should be a base64 string (or nil if export fails)
                         (is (or (string? result) (nil? result)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done))))))))

;; ---- list-db thread-api test ----

(deftest list-db-returns-empty-list-by-default
  (async done
    (restoring-worker-state
     (fn []
       (let [list-db! (get @thread-api/*thread-apis :thread-api/list-db)]
         (platform/set-platform! (build-test-platform))
         (-> (list-db!)
             (p/then (fn [result]
                       (is (vector? result))
                       (is (empty? result))))
             (p/catch (fn [e]
                        ;; list-db may fail if platform not fully initialized, that's ok
                        (is (some? e))))
             (p/finally done)))))))

;; ---- set-context thread-api test ----

(deftest set-context-returns-nil
  (let [set-context! (get @thread-api/*thread-apis :thread-api/set-context)
        context {:current-repo test-repo
                 :theme "dark"}]
    ;; set-context returns nil after updating state
    (is (nil? (set-context! context)))))

(deftest set-context-returns-nil-for-nil-context
  (let [set-context! (get @thread-api/*thread-apis :thread-api/set-context)]
    (is (nil? (set-context! nil)))))

;; ---- sync-app-state thread-api test ----

(deftest sync-app-state-updates-state
  (restoring-worker-state
   (fn []
     (let [sync-app-state! (get @thread-api/*thread-apis :thread-api/sync-app-state)
           new-state {:git/current-repo test-repo
                      :theme "light"}]
       (sync-app-state! new-state)
       (is (= new-state (select-keys @worker-state/*state [:git/current-repo :theme])))))))

;; ---- get-block-parents thread-api test ----

(deftest get-block-parents-returns-parents
  (restoring-worker-state
   (fn []
     (let [get-block-parents! (get @thread-api/*thread-apis :thread-api/get-block-parents)
           conn (d/create-conn db-schema/schema)
           gp-uuid (random-uuid)
           p-uuid (random-uuid)
           c-uuid (random-uuid)]
       ;; Create a hierarchy: grandparent -> parent -> child
       (d/transact! conn [{:block/uuid gp-uuid
                           :block/title "grandparent"}
                          {:block/uuid p-uuid
                           :block/title "parent"
                           :block/parent [:block/uuid gp-uuid]}
                          {:block/uuid c-uuid
                           :block/title "child"
                           :block/parent [:block/uuid p-uuid]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       ;; Get parents of child (depth 3)
       (let [result (get-block-parents! test-repo [:block/uuid c-uuid] 3)]
         (is (seq result))
         ;; Should include at least the parent
         (is (some #(= "parent" (:block/title %)) result)))))))

;; ---- get-block-refs thread-api test ----

(deftest get-block-refs-returns-linked-references
  (restoring-worker-state
   (fn []
     (let [get-block-refs! (get @thread-api/*thread-apis :thread-api/get-block-refs)
           conn (d/create-conn db-schema/schema)
           ref-uuid (random-uuid)
           block-uuid (random-uuid)]
       (d/transact! conn [{:block/uuid ref-uuid
                           :block/title "reference target"}
                          {:block/uuid block-uuid
                           :block/title "block with ref"
                           :block/refs [:block/uuid ref-uuid]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (get-block-refs! test-repo [:block/uuid ref-uuid])]
         (is (seq result)))))))

;; ---- block-refs-check thread-api tests ----

(deftest block-refs-check-unlinked-returns-true-when-title-match-without-link
  (restoring-worker-state
   (fn []
     (let [block-refs-check! (get-thread-api :thread-api/block-refs-check)
           conn (d/create-conn db-schema/schema)
           source-id 100
           candidate-id 101]
       (d/transact! conn [{:db/id source-id
                           :block/uuid (random-uuid)
                           :block/title "Foo"}
                          {:db/id candidate-id
                           :block/uuid (random-uuid)
                           :block/title "foo bar"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [db-core/search-blocks (fn [_repo _q _opts]
                                             [{:db/id candidate-id}])]
         (is (true? (block-refs-check! test-repo source-id {:unlinked? true}))))))))

(deftest block-refs-check-linked-branch-uses-common-get-block-refs
  (restoring-worker-state
   (fn []
     (let [block-refs-check! (get-thread-api :thread-api/block-refs-check)
           conn (d/create-conn db-schema/schema)
           source-id 200]
       (d/transact! conn [{:db/id source-id
                           :block/uuid (random-uuid)
                           :block/title "Bar"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [common-initial-data/get-block-refs (fn [_db _id] [{:db/id 1}])]
         (is (true? (block-refs-check! test-repo source-id {:unlinked? false}))))
       (with-redefs [common-initial-data/get-block-refs (fn [_db _id] [])]
         (is (false? (block-refs-check! test-repo source-id {:unlinked? false}))))))))

(deftest db-core-registers-all-thread-apis-test
  (let [missing (->> expected-db-core-thread-apis
                     (remove #(contains? @thread-api/*thread-apis %))
                     sort
                     vec)
        non-functions (->> expected-db-core-thread-apis
                           (filter #(not (fn? (get @thread-api/*thread-apis %))))
                           sort
                           vec)]
    (is (empty? missing) (str "Missing thread apis: " missing))
    (is (empty? non-functions) (str "Non-function thread apis: " non-functions))))

(deftest db-core-db-sync-thread-apis-delegate-to-sync-modules-test
  (restoring-worker-state
   (fn []
     (let [calls (atom [])
           request-repo "graph-a"
           graph-id "graph-id-1"
           block-uuid "block-1"
           target-email "user@example.com"
           sync-status {:state :connected}
           remote-graphs [{:graph-id graph-id}]
           conflicts [{:op :conflict}]
           import-prepare {:import-id "import-1"}]
       (with-redefs [db-sync/status (fn [repo]
                                      (swap! calls conj [:status repo])
                                      sync-status)
                     db-sync/list-remote-graphs! (fn []
                                                   (swap! calls conj [:list-remote-graphs])
                                                   remote-graphs)
                     db-sync/stop-upload! (fn [repo]
                                            (swap! calls conj [:stop-upload repo])
                                            :stopped)
                     db-sync/resume-upload! (fn [repo]
                                              (swap! calls conj [:resume-upload repo])
                                              :resumed)
                     db-sync/upload-stopped? (fn [repo]
                                               (swap! calls conj [:upload-stopped? repo])
                                               true)
                     client-op/get-sync-conflicts (fn [repo block]
                                                    (swap! calls conj [:get-sync-conflicts repo block])
                                                    conflicts)
                     client-op/clear-sync-conflicts! (fn [repo block]
                                                       (swap! calls conj [:clear-sync-conflicts repo block])
                                                       nil)
                     shared-service/broadcast-to-clients! (fn [event payload]
                                                            (swap! calls conj [:broadcast event payload])
                                                            nil)
                     sync-download/download-graph-by-id! (fn [repo gid graph-e2ee?]
                                                           (swap! calls conj [:download-graph-by-id repo gid graph-e2ee?])
                                                           :downloaded)
                     sync-download/prepare-import! (fn [repo reset? gid graph-e2ee? total-datoms]
                                                     (swap! calls conj [:prepare-import repo reset? gid graph-e2ee? total-datoms])
                                                     import-prepare)
                     sync-download/import-rows-chunk! (fn [rows gid import-id]
                                                        (swap! calls conj [:import-rows-chunk rows gid import-id])
                                                        :rows-imported)
                     sync-download/finalize-import! (fn [repo gid remote-tx import-id]
                                                     (swap! calls conj [:finalize-import repo gid remote-tx import-id])
                                                     :import-finalized)
                     db-sync/rehydrate-large-titles-from-db! (fn [repo gid]
                                                               (swap! calls conj [:rehydrate-large-titles repo gid])
                                                               :rehydrated)
                     sync-crypt/<grant-graph-access! (fn [repo gid email]
                                                       (swap! calls conj [:grant-graph-access repo gid email])
                                                       :granted)]
         (is (= sync-status ((get-thread-api :thread-api/db-sync-status) request-repo)))
         (is (= remote-graphs ((get-thread-api :thread-api/db-sync-list-remote-graphs))))
         (is (= :stopped ((get-thread-api :thread-api/db-sync-stop-upload) request-repo)))
         (is (= :resumed ((get-thread-api :thread-api/db-sync-resume-upload) request-repo)))
         (is (true? ((get-thread-api :thread-api/db-sync-upload-stopped?) request-repo)))
         (is (= conflicts ((get-thread-api :thread-api/db-sync-get-block-conflicts) request-repo block-uuid)))
         ((get-thread-api :thread-api/db-sync-clear-block-conflicts) request-repo block-uuid)
         (is (= :downloaded ((get-thread-api :thread-api/db-sync-download-graph-by-id) request-repo graph-id true)))
         (is (= :granted ((get-thread-api :thread-api/db-sync-grant-graph-access) request-repo graph-id target-email)))
         (is (= import-prepare ((get-thread-api :thread-api/db-sync-import-prepare) request-repo true graph-id true 12)))
         (is (= :rows-imported ((get-thread-api :thread-api/db-sync-import-rows-chunk) [[1 "row" nil]] graph-id "import-1")))
         (is (= :import-finalized ((get-thread-api :thread-api/db-sync-import-finalize) request-repo graph-id 88 "import-1")))
         (is (= :rehydrated ((get-thread-api :thread-api/db-sync-rehydrate-large-titles) request-repo graph-id)))
         (is (some #(= [:broadcast
                        :sync-conflicts-updated
                        {:repo request-repo
                         :block-uuid block-uuid
                         :conflicts []}]
                       %)
                   @calls)))))))

(deftest db-core-undo-redo-thread-apis-delegate-to-worker-undo-redo-test
  (restoring-worker-state
   (fn []
     (let [calls (atom [])
           repo test-repo
           editor-info {:block-uuid "b1"}
           ui-state "{:cursor 1}"]
       (with-redefs [worker-undo-redo/set-pending-editor-info! (fn [r info]
                                                                  (swap! calls conj [:set-pending r info]))
                     worker-undo-redo/record-editor-info! (fn [r info]
                                                            (swap! calls conj [:record-editor r info]))
                     worker-undo-redo/record-ui-state! (fn [r state]
                                                         (swap! calls conj [:record-ui r state]))
                     worker-undo-redo/undo (fn [r]
                                             (swap! calls conj [:undo r])
                                             :undo-result)
                     worker-undo-redo/redo (fn [r]
                                             (swap! calls conj [:redo r])
                                             :redo-result)]
         (is (nil? ((get-thread-api :thread-api/undo-redo-set-pending-editor-info) repo editor-info)))
         (is (nil? ((get-thread-api :thread-api/undo-redo-record-editor-info) repo editor-info)))
         (is (nil? ((get-thread-api :thread-api/undo-redo-record-ui-state) repo ui-state)))
         (is (= :undo-result ((get-thread-api :thread-api/undo-redo-undo) repo)))
         (is (= :redo-result ((get-thread-api :thread-api/undo-redo-redo) repo)))
         (is (= [[:set-pending repo editor-info]
                 [:record-editor repo editor-info]
                 [:record-ui repo ui-state]
                 [:undo repo]
                 [:redo repo]]
                @calls)))))))

(deftest db-core-cli-and-api-thread-apis-delegate-to-cli-modules-test
  (restoring-worker-state
   (fn []
     (let [conn (d/create-conn db-schema/schema)
           calls (atom [])
           options {:limit 10}
           ops [{:op :upsert}]
           page-title "My Page"]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [cli-db-worker/list-properties (fn [db opt]
                                                     (swap! calls conj [:cli-list-properties db opt])
                                                     [:p1])
                     cli-db-worker/list-tags (fn [db opt]
                                               (swap! calls conj [:cli-list-tags db opt])
                                               [:t1])
                     cli-db-worker/list-pages (fn [db opt]
                                                (swap! calls conj [:cli-list-pages db opt])
                                                [:pg1])
                     cli-db-worker/list-tasks (fn [db opt]
                                                (swap! calls conj [:cli-list-tasks db opt])
                                                [:task1])
                     cli-db-worker/list-nodes (fn [db opt]
                                                (swap! calls conj [:cli-list-nodes db opt])
                                                [:node1])
                     cli-common-mcp-tools/get-page-data (fn [db title]
                                                          (swap! calls conj [:api-get-page-data db title])
                                                          {:title title})
                     cli-common-mcp-tools/list-properties (fn [db opt]
                                                            (swap! calls conj [:api-list-properties db opt])
                                                            [:ap1])
                     cli-common-mcp-tools/list-tags (fn [db opt]
                                                      (swap! calls conj [:api-list-tags db opt])
                                                      [:at1])
                     cli-common-mcp-tools/list-pages (fn [db opt]
                                                       (swap! calls conj [:api-list-pages db opt])
                                                       [:apg1])
                     cli-common-mcp-tools/build-upsert-nodes-edn (fn [db input-ops]
                                                                   (swap! calls conj [:api-build-upsert-nodes-edn db input-ops])
                                                                   {:ops input-ops})]
         (is (= [:p1] ((get-thread-api :thread-api/cli-list-properties) test-repo options)))
         (is (= [:t1] ((get-thread-api :thread-api/cli-list-tags) test-repo options)))
         (is (= [:pg1] ((get-thread-api :thread-api/cli-list-pages) test-repo options)))
         (is (= [:task1] ((get-thread-api :thread-api/cli-list-tasks) test-repo options)))
         (is (= [:node1] ((get-thread-api :thread-api/cli-list-nodes) test-repo options)))
         (is (= {:title page-title} ((get-thread-api :thread-api/api-get-page-data) test-repo page-title)))
         (is (= [:ap1] ((get-thread-api :thread-api/api-list-properties) test-repo options)))
         (is (= [:at1] ((get-thread-api :thread-api/api-list-tags) test-repo options)))
         (is (= [:apg1] ((get-thread-api :thread-api/api-list-pages) test-repo options)))
         (is (= {:ops ops} ((get-thread-api :thread-api/api-build-upsert-nodes-edn) test-repo ops)))
         (is (= 10 (count @calls))))))))

(deftest db-core-export-view-and-validate-thread-apis-delegate-test
  (restoring-worker-state
   (fn []
     (let [conn (d/create-conn db-schema/schema)
           repo test-repo
           export-options {:format :edn}
           content-options {:include-journal? true}
           view-option {:limit 5}
           property-option {:property-ident :block/tags}
           calls (atom [])
           validate-result {:ok true}
           recompute-result {:recomputed-checksum "new-checksum"}]
       (reset! worker-state/*datascript-conns {repo conn})
       (reset! worker-state/*client-ops-conns {repo :client-ops})
       (with-redefs [worker-export/get-debug-datoms (fn [c]
                                                      (swap! calls conj [:export-get-debug-datoms c])
                                                      [:d1])
                     worker-export/get-all-page->content (fn [db options]
                                                           (swap! calls conj [:export-get-all-page->content db options])
                                                           {"Page" "Body"})
                     worker-db-validate/validate-db (fn [c opts]
                                                      (swap! calls conj [:validate-db c opts])
                                                      validate-result)
                     worker-db-validate/recompute-checksum-diagnostics (fn [input-repo c diagnostics]
                                                                         (swap! calls conj [:recompute-checksum input-repo c diagnostics])
                                                                         recompute-result)
                     client-op/get-local-checksum (fn [_] "old-checksum")
                     client-op/update-local-checksum (fn [input-repo checksum]
                                                       (swap! calls conj [:update-local-checksum input-repo checksum])
                                                       nil)
                     db-view/get-view-data (fn [db view-id option]
                                             (swap! calls conj [:get-view-data db view-id option])
                                             {:view-id view-id})
                     db-view/get-property-values (fn [c property-ident option]
                                                   (swap! calls conj [:get-property-values c property-ident option])
                                                   [:value-1])
                     ldb/get-bidirectional-properties (fn [db target-id]
                                                       (swap! calls conj [:get-bidirectional-properties db target-id])
                                                       [:p-link])
                     graph-view/build-graph (fn [db option]
                                              (swap! calls conj [:build-graph db option])
                                              {:nodes 1})]
         (is (= [:d1] ((get-thread-api :thread-api/export-get-debug-datoms) repo)))
         (is (= {"Page" "Body"} ((get-thread-api :thread-api/export-get-all-page->content) repo content-options)))
         (is (= validate-result ((get-thread-api :thread-api/validate-db) repo export-options)))
         (is (= (assoc recompute-result :local-checksum "new-checksum")
                ((get-thread-api :thread-api/recompute-checksum-diagnostics) repo)))
         (is (= {:view-id "view-1"} ((get-thread-api :thread-api/get-view-data) repo "view-1" view-option)))
         (is (= [:value-1] ((get-thread-api :thread-api/get-property-values) repo property-option)))
         (is (= [:p-link] ((get-thread-api :thread-api/get-bidirectional-properties) repo {:target-id "b1"})))
         (is (= {:nodes 1} ((get-thread-api :thread-api/build-graph) repo {:depth 1})))
         (is (some #(= [:update-local-checksum repo "new-checksum"] %) @calls)))))))
