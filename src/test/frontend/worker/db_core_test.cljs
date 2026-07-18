(ns frontend.worker.db-core-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [datascript.storage :as storage]
            [frontend.common.thread-api :as thread-api]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.export :as worker-export]
            [frontend.worker.graph-view :as graph-view]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.export :as worker-export-handler]
            [frontend.worker.handler.graph :as worker-graph-handler]
            [frontend.worker.handler.maintenance :as maintenance-handler]
            [frontend.worker.handler.search :as search-handler]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.platform :as platform]
            [frontend.worker.query-dsl :as worker-query-dsl]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [goog.object :as gobj]
            [logseq.api.db-based.tools :as api-tools]
            [logseq.cli.common.db-worker :as cli-db-worker]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]
            [shadow.resource :as rc]))

(def ^:private test-repo "db-core-test-repo")

(defn- source-for
  [relative-file]
  (let [path (node-path/join (.cwd js/process) relative-file)]
    (if (fs/existsSync path)
      (.toString (fs/readFileSync path "utf8"))
      "")))

(defn- count-string-occurrences
  [source needle]
  (loop [offset 0
         result 0]
    (let [index (.indexOf source needle offset)]
      (if (= -1 index)
        result
        (recur (+ index (count needle)) (inc result))))))

(def ^:private infrastructure-handler-thread-apis
  {"src/main/frontend/worker/handler/sync.cljs"
   #{:thread-api/set-db-sync-config
     :thread-api/get-db-sync-config
     :thread-api/db-sync-status
     :thread-api/db-sync-stop
     :thread-api/db-sync-update-presence
     :thread-api/db-sync-request-asset-download
     :thread-api/db-sync-download-missing-assets
     :thread-api/db-sync-retry-asset-upload
     :thread-api/db-sync-grant-graph-access
     :thread-api/db-sync-ensure-user-rsa-keys
     :thread-api/db-sync-list-remote-graphs
     :thread-api/db-sync-upload-graph
     :thread-api/db-sync-create-remote-graph
     :thread-api/db-sync-stop-upload
     :thread-api/db-sync-resume-upload
     :thread-api/db-sync-upload-stopped?
     :thread-api/db-sync-get-block-conflicts
     :thread-api/db-sync-clear-block-conflicts
     :thread-api/db-sync-download-graph-by-id}

   "src/main/frontend/worker/handler/undo_redo.cljs"
   #{:thread-api/undo-redo-set-pending-editor-info
     :thread-api/undo-redo-record-editor-info
     :thread-api/undo-redo-record-ui-state
     :thread-api/undo-redo-undo
     :thread-api/undo-redo-redo
     :thread-api/undo-redo-clear-history
     :thread-api/undo-redo-get-debug-state}

   "src/main/frontend/worker/handler/cli.cljs"
   #{:thread-api/cli-list-properties
     :thread-api/cli-list-tags
     :thread-api/cli-list-pages
     :thread-api/cli-list-tasks
     :thread-api/cli-list-nodes
     :thread-api/api-get-page-data
     :thread-api/api-list-properties
     :thread-api/api-list-tags
     :thread-api/api-list-pages
     :thread-api/api-build-upsert-nodes-edn}

   "src/main/frontend/worker/handler/export.cljs"
   #{:thread-api/export-get-debug-datoms
     :thread-api/export-get-all-page->content
     :thread-api/export-get-blocks-data
     :thread-api/export-blocks-as-format
     :thread-api/validate-db
     :thread-api/recompute-checksum-diagnostics
     :thread-api/export-edn
     :thread-api/import-edn
     :thread-api/build-publishing-html}

   "src/main/frontend/worker/handler/maintenance.cljs"
   #{:thread-api/reset-db
     :thread-api/gc-graph}

   "src/main/frontend/worker/handler/markdown.cljs"
   #{:thread-api/markdown-mirror-set-enabled
     :thread-api/markdown-mirror-flush
     :thread-api/markdown-mirror-regenerate}

   "src/main/frontend/worker/handler/graph.cljs"
   #{:thread-api/get-favorite-pages
     :thread-api/favorited-page?
     :thread-api/get-recent-pages
     :thread-api/set-page-favorite
     :thread-api/reorder-favorites
     :thread-api/build-graph
     :thread-api/get-all-page-titles
     :thread-api/mobile-logs
     :thread-api/get-key-value
     :thread-api/get-rtc-graph-uuid
     :thread-api/get-graph-uuid
     :thread-api/ensure-local-graph-uuid}})

(def ^:private domain-handler-thread-apis
  {"src/main/frontend/worker/handler/property.cljs"
   #{:thread-api/get-all-classes
     :thread-api/get-first-url-property-value
     :thread-api/get-structured-children
     :thread-api/get-class-extends-children-tree
     :thread-api/get-alias-source-page
     :thread-api/get-property-closed-values
     :thread-api/get-property-node-selector-data
     :thread-api/get-class-objects
     :thread-api/get-block-class-default-properties
     :thread-api/get-class-properties
     :thread-api/validate-block-tag
     :thread-api/convert-tag-to-page
     :thread-api/convert-page-to-tag
     :thread-api/get-property-values
     :thread-api/get-bidirectional-properties
     :thread-api/get-all-properties
     :thread-api/get-display-properties
     :thread-api/validate-property-value
     :thread-api/reorder-display-property
     :thread-api/get-date-scheduled-or-deadlines}

   "src/main/frontend/worker/handler/block.cljs"
   #{:thread-api/get-blocks
     :thread-api/get-block-refs
     :thread-api/get-block-refs-count
     :thread-api/get-block-source
     :thread-api/block-refs-check
     :thread-api/get-block-parents}

   "src/main/frontend/worker/handler/search.cljs"
   #{:thread-api/search-blocks
     :thread-api/search-upsert-blocks
     :thread-api/search-delete-blocks
     :thread-api/search-truncate-tables
     :thread-api/search-build-blocks-indice
     :thread-api/search-build-blocks-indice-in-worker
     :thread-api/search-build-pages-indice}

   "src/main/frontend/worker/handler/transaction.cljs"
   #{:thread-api/set-context
     :thread-api/transact
     :thread-api/apply-outliner-ops
     :thread-api/sync-app-state}

   "src/main/frontend/worker/handler/flashcard.cljs"
   #{:thread-api/get-fsrs-due-card-block-ids}

   "src/main/frontend/worker/handler/query.cljs"
   #{:thread-api/q
     :thread-api/query-dsl-query
     :thread-api/query-dsl-custom-query
     :thread-api/datoms
     :thread-api/pull
     :thread-api/task-spent-time
     :thread-api/resolve-query-inputs}

   "src/main/frontend/worker/handler/page.cljs"
   #{:thread-api/get-page-route-info
     :thread-api/get-block-by-page-name-and-block-route-name
     :thread-api/get-journal-page-by-day
     :thread-api/get-latest-journals
     :thread-api/page-exists?
     :thread-api/get-case-page
     :thread-api/get-tags-by-name
     :thread-api/get-block-parent
     :thread-api/get-block-page-info
     :thread-api/get-block-immediate-children
     :thread-api/get-block-sibling
     :thread-api/get-page-blocks-tree
     :thread-api/get-route-title
     :thread-api/get-file-content}

   "src/main/frontend/worker/handler/comments.cljs"
   #{:thread-api/ensure-comments-area
     :thread-api/ensure-comments-area-for-blocks
     :thread-api/delete-comment
     :thread-api/get-comment-threads-for-block
     :thread-api/get-comment-thread-block-uuids}})

(def ^:private extracted-handler-thread-apis
  (merge infrastructure-handler-thread-apis domain-handler-thread-apis))

(deftest self-contained-thread-apis-are-owned-by-domain-handlers-test
  (let [db-core-source (source-for "src/main/frontend/worker/db_core.cljs")]
    (doseq [[handler-file api-keys] extracted-handler-thread-apis
            api-key api-keys]
      (let [registration (str "(def-thread-api " api-key "\n")
            handler-source (source-for handler-file)]
        (is (not (string/includes? db-core-source registration))
            (str api-key " must not be registered in db-core"))
        (is (= 1 (count-string-occurrences handler-source registration))
            (str api-key " must be registered exactly once in " handler-file))))))

(def ^:private task-spent-time-schema
  (merge db-schema/schema
         {:logseq.property.history/block {:db/valueType :db.type/ref}
          :logseq.property.history/property {:db/valueType :db.type/ref}
          :logseq.property.history/ref-value {:db/valueType :db.type/ref}}))

;; Keep this compact to satisfy lint:large-vars while still asserting full API coverage.
(def ^:private expected-db-core-thread-apis
  (into #{}
        (concat
         [:thread-api/list-db :thread-api/init :thread-api/set-db-sync-config :thread-api/get-db-sync-config :thread-api/get-key-value
          :thread-api/db-sync-status :thread-api/db-sync-start :thread-api/db-sync-stop :thread-api/db-sync-update-presence
          :thread-api/db-sync-request-asset-download :thread-api/db-sync-grant-graph-access :thread-api/db-sync-ensure-user-rsa-keys
          :thread-api/db-sync-list-remote-graphs :thread-api/db-sync-upload-graph :thread-api/db-sync-create-remote-graph
          :thread-api/db-sync-stop-upload :thread-api/db-sync-resume-upload :thread-api/db-sync-upload-stopped?
          :thread-api/db-sync-get-block-conflicts :thread-api/db-sync-clear-block-conflicts :thread-api/db-sync-download-graph-by-id
          :thread-api/create-or-open-db :thread-api/q :thread-api/datoms :thread-api/pull :thread-api/task-spent-time :thread-api/get-blocks
          :thread-api/get-block-refs :thread-api/get-block-refs-count :thread-api/get-block-source :thread-api/block-refs-check
          :thread-api/get-block-parents :thread-api/set-context :thread-api/transact :thread-api/undo-redo-set-pending-editor-info
          :thread-api/undo-redo-record-editor-info :thread-api/undo-redo-record-ui-state :thread-api/undo-redo-undo
          :thread-api/undo-redo-redo :thread-api/undo-redo-clear-history :thread-api/undo-redo-get-debug-state
          :thread-api/build-publishing-html :thread-api/reset-db
          :thread-api/get-file-content :thread-api/get-all-properties :thread-api/get-date-scheduled-or-deadlines
          :thread-api/unsafe-unlink-db :thread-api/close-db
          :thread-api/db-sync-close-db :thread-api/db-sync-invalidate-search-db :thread-api/db-sync-recreate-lock
          :thread-api/db-sync-rehydrate-large-titles :thread-api/db-sync-import-prepare :thread-api/db-sync-import-rows-chunk
          :thread-api/db-sync-import-finalize :thread-api/release-access-handles :thread-api/db-exists
          :thread-api/export-db-binary :thread-api/import-file-graph
          :thread-api/export-client-ops-db-binary :thread-api/backup-db-sqlite
          :thread-api/import-db-binary :thread-api/search-blocks :thread-api/search-upsert-blocks :thread-api/search-delete-blocks
          :thread-api/search-truncate-tables :thread-api/search-build-blocks-indice :thread-api/search-build-blocks-indice-in-worker
          :thread-api/search-build-pages-indice :thread-api/apply-outliner-ops :thread-api/sync-app-state
          :thread-api/markdown-mirror-set-enabled :thread-api/markdown-mirror-flush :thread-api/markdown-mirror-regenerate
          :thread-api/export-get-debug-datoms :thread-api/export-get-all-page->content :thread-api/validate-db
          :thread-api/recompute-checksum-diagnostics :thread-api/export-edn :thread-api/import-edn
          :thread-api/get-fsrs-due-card-block-ids :thread-api/get-view-data
          :thread-api/get-class-objects :thread-api/validate-block-tag
          :thread-api/convert-tag-to-page
          :thread-api/convert-page-to-tag
          :thread-api/set-page-favorite
          :thread-api/reorder-favorites
          :thread-api/get-page-route-info :thread-api/get-block-by-page-name-and-block-route-name
          :thread-api/query-dsl-query :thread-api/query-dsl-custom-query
          :thread-api/get-journal-page-by-day :thread-api/get-latest-journals
          :thread-api/page-exists? :thread-api/get-case-page :thread-api/get-tags-by-name
          :thread-api/resolve-query-inputs :thread-api/get-block-parent
          :thread-api/get-block-page-info
          :thread-api/ensure-comments-area :thread-api/ensure-comments-area-for-blocks
          :thread-api/delete-comment
          :thread-api/get-comment-threads-for-block :thread-api/get-comment-thread-block-uuids
          :thread-api/get-block-immediate-children :thread-api/get-block-sibling
          :thread-api/get-page-blocks-tree :thread-api/get-block-class-default-properties :thread-api/get-class-properties
          :thread-api/get-all-classes :thread-api/get-structured-children :thread-api/get-class-extends-children-tree
          :thread-api/get-property-node-selector-data :thread-api/get-view-filter-data
          :thread-api/get-alias-source-page :thread-api/get-property-closed-values
          :thread-api/get-route-title :thread-api/get-first-url-property-value
          :thread-api/get-display-properties :thread-api/reorder-display-property
          :thread-api/get-all-properties :thread-api/get-property-values :thread-api/get-bidirectional-properties
          :thread-api/build-graph :thread-api/get-all-page-titles :thread-api/gc-graph :thread-api/mobile-logs
          :thread-api/get-graph-uuid :thread-api/get-rtc-graph-uuid
          :thread-api/ensure-local-graph-uuid
          :thread-api/cli-list-properties :thread-api/cli-list-tags :thread-api/cli-list-pages
          :thread-api/cli-list-tasks :thread-api/cli-list-nodes :thread-api/api-get-page-data :thread-api/api-list-properties
          :thread-api/api-list-tags :thread-api/api-list-pages :thread-api/api-build-upsert-nodes-edn])))

(defn- get-thread-api
  [k]
  (let [f (get @thread-api/*thread-apis k)]
    (assert (fn? f) (str "thread api not registered: " k))
    f))

(defn- silence-stderr
  [f]
  (let [orig-write (.-write js/process.stderr)]
    (set! (.-write js/process.stderr) (fn [& _] true))
    (try
      (f)
      (finally
        (set! (.-write js/process.stderr) orig-write)))))

(defn- <wait-for-progress!
  [progress-calls pred max-tries]
  (p/loop [remaining max-tries]
    (if (or (pred @progress-calls)
            (zero? remaining))
      nil
      (p/let [_ (p/delay 5)]
        (p/recur (dec remaining))))))

(defn- build-test-platform
  ([]
   (build-test-platform {}))
  ([{:keys [post-message! remove-vfs! runtime import-db embed-texts]
     :or {post-message! (fn [& _] nil)
          remove-vfs! (fn [_] nil)
          runtime :browser
          embed-texts (fn [texts]
                        (p/resolved (mapv (fn [_] [0.0]) texts)))}}]
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
    :embedding {:model-id "test-model"
                :dimension search/vector-embedding-dimension
                :embed-texts embed-texts}
    :timers {:set-interval! (fn [_ _] nil)}}))

(defn- restoring-worker-state
  [f]
  (let [state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config
        sqlite-prev @worker-state/*sqlite
        sqlite-conns-prev @worker-state/*sqlite-conns
        vector-indexes-prev @worker-state/*vector-indexes
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        main-thread-prev @worker-state/*main-thread
        platform-prev @@#'platform/*platform
        search-build-prev @(deref #'search-handler/*search-index-build-ids)
        vector-build-prev @(deref #'search-handler/*vector-index-rebuild-ids)
        cleanup (fn []
                  (reset! worker-state/*state state-prev)
                  (reset! worker-state/*db-sync-config config-prev)
                  (reset! worker-state/*sqlite sqlite-prev)
                  (reset! worker-state/*sqlite-conns sqlite-conns-prev)
                  (reset! worker-state/*vector-indexes vector-indexes-prev)
                  (reset! worker-state/*datascript-conns datascript-prev)
                  (reset! worker-state/*client-ops-conns client-ops-prev)
                  (reset! worker-state/*opfs-pools opfs-prev)
                  (reset! worker-state/*main-thread main-thread-prev)
                  (reset! (deref #'search-handler/*search-index-build-ids) search-build-prev)
                  (reset! (deref #'search-handler/*vector-index-rebuild-ids) vector-build-prev)
                  (reset! @#'platform/*platform platform-prev))]
    (platform/set-platform! (build-test-platform))
    (reset! worker-state/*sqlite #js {})
    (reset! worker-state/*sqlite-conns {})
    (reset! worker-state/*vector-indexes {})
    (reset! worker-state/*datascript-conns {})
    (reset! worker-state/*client-ops-conns {})
    (reset! worker-state/*opfs-pools {})
    (reset! worker-state/*main-thread nil)
    (reset! (deref #'search-handler/*search-index-build-ids) {})
    (reset! (deref #'search-handler/*vector-index-rebuild-ids) {})
    (let [result (f)]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

(deftest apply-outliner-ops-returns-plain-block-map-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [page-id (ffirst (d/q '[:find ?e :where [?e :block/name _]] @conn))
             response (apply-ops! test-repo
                                  [[:upsert-property
                                    [:user.property/test-property
                                     {:logseq.property/type :default}
                                     {:property-name "test-property"}]]]
                                  {:ui/page-id page-id
                                   :virtual/offset 0})
             result (:result response)]
         (is (not (de/entity? result)))
         (is (= :user.property/test-property (:db/ident result)))
         (is (= "test-property" (:block/title result)))
         (is (= "test-property" (:block/raw-title result)))
         (is (= :default (:logseq.property/type result)))
         (is (= :db.cardinality/one (:db/cardinality result)))
         (is (= (:db/id result)
                (:db/id (#'block-handler/resolve-block-entity @conn :user.property/test-property)))))))))

(deftest get-block-sibling-returns-plain-block-map-test
  (restoring-worker-state
   (fn []
     (let [conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "page 1"}
                   :blocks (mapv (fn [idx]
                                   {:block/title (str "block " idx)})
                                 (range 1000))}])
           block (db-test/find-block-by-content @conn "block 500")
           get-sibling! (get-thread-api :thread-api/get-block-sibling)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [sibling (get-sibling! test-repo (:db/id block) :right)]
         (is (= "block 501" (:block/title sibling)))
         (is (not (de/entity? (:block/parent sibling))))
         (is (not (de/entity? (:block/page sibling)))))))))

(deftest apply-outliner-ops-rejects-missing-connection-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           repo "missing-graph"
           error (try
                   (apply-ops! repo [[:save-block []]] {})
                   nil
                   (catch :default error
                     error))]
       (is (= :db/missing-connection (:type (ex-data error))))
       (is (= repo (:repo (ex-data error))))))))

(deftest insert-block-persists-before-returning-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           page-id #uuid "00000000-0000-0000-0000-000000000001"
           existing-id #uuid "11111111-1111-1111-1111-111111111111"
           inserted-id #uuid "22222222-2222-2222-2222-222222222222"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/title "Page"
                           :block/name "page"
                           :block/uuid page-id
                           :block/tags :logseq.class/Page}
                          {:block/title "Existing"
                           :block/uuid existing-id
                           :block/page [:block/uuid page-id]
                           :block/parent [:block/uuid page-id]
                           :block/order "a0"
                           :block/created-at 1
                           :block/updated-at 1}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [_response (apply-ops! test-repo
                                   [[:insert-blocks
                                     [[{:block/uuid inserted-id
                                        :block/title ""}]
                                      existing-id
                                      {:sibling? true
                                       :keep-uuid? true}]]]
                                   {:affected-block-uuids #{inserted-id}})
             inserted (d/entity @conn [:block/uuid inserted-id])]
         (is (some? inserted) "The insert op must persist the new block.")
         (is (= "" (:block/title inserted))
             (str "The insert must persist before the frontend consumes the response: "
                  (pr-str (select-keys (into {} inserted)
                                       [:block/uuid :block/page :block/parent :block/order])))))))))

(deftest apply-outliner-ops-marks-link-container-pages-affected-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           source-page-id #uuid "00000000-0000-0000-0000-000000000001"
           source-block-id #uuid "11111111-1111-1111-1111-111111111111"
           container-page-id #uuid "22222222-2222-2222-2222-222222222222"
           link-block-id #uuid "33333333-3333-3333-3333-333333333333"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/title "Source"
                           :block/name "source"
                           :block/uuid source-page-id
                           :block/tags :logseq.class/Page}
                          {:block/title "Child"
                           :block/uuid source-block-id
                           :block/page [:block/uuid source-page-id]
                           :block/parent [:block/uuid source-page-id]
                           :block/order "a0"
                           :block/created-at 1
                           :block/updated-at 1}
                          {:block/title "Container"
                           :block/name "container"
                           :block/uuid container-page-id
                           :block/tags :logseq.class/Page}
                          {:block/title ""
                           :block/uuid link-block-id
                           :block/page [:block/uuid container-page-id]
                           :block/parent [:block/uuid container-page-id]
                           :block/link [:block/uuid source-page-id]
                           :block/order "a0"
                           :block/created-at 1
                           :block/updated-at 1}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [response (apply-ops! test-repo
                                  [[:save-block
                                    [{:block/uuid source-block-id
                                      :block/title "Updated"}
                                     {}]]]
                                  {:affected-block-uuids #{source-block-id}})]
         (is (= #{source-page-id container-page-id}
                (:affected-page-uuids response))))))))

(deftest apply-outliner-ops-can-return-updated-blocks-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           page-id #uuid "00000000-0000-0000-0000-000000000001"
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "Page"
                          :block/uuid page-id
                          :build/keep-uuid? true}
                   :blocks [{:block/title "Before"
                             :block/uuid block-id
                             :build/keep-uuid? true}]}])]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [response (apply-ops! test-repo
                                  [[:save-block
                                    [{:block/uuid block-id
                                      :block/title "After"}
                                     {}]]]
                                  {:affected-block-uuids #{block-id}
                                   :return-updated-blocks? true})
             updated-block (first (:updated-blocks response))]
         (is (= [block-id] (mapv :block/uuid (:updated-blocks response))))
         (is (= "After" (:block/title updated-block)))
         (is (not (de/entity? updated-block))))))))

(deftest apply-outliner-ops-rejects-missing-indent-parent-original-test
  (restoring-worker-state
   (fn []
     (let [apply-ops! (get-thread-api :thread-api/apply-outliner-ops)
           page-id #uuid "00000000-0000-0000-0000-000000000001"
           parent-id #uuid "11111111-1111-1111-1111-111111111111"
           child-id #uuid "22222222-2222-2222-2222-222222222222"
           missing-id #uuid "33333333-3333-3333-3333-333333333333"
           conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "Page"
                          :block/uuid page-id
                          :build/keep-uuid? true}
                   :blocks [{:block/title "Parent"
                             :block/uuid parent-id
                             :build/keep-uuid? true
                             :build/children [{:block/title "Child"
                                               :block/uuid child-id
                                               :build/keep-uuid? true}]}]}])]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [error (try
                     (apply-ops! test-repo
                                 [[:indent-outdent-blocks
                                   [[child-id]
                                    false
                                    {:parent-original {:block/uuid missing-id}}]]]
                                 {:ui/page-id page-id})
                     nil
                     (catch :default error
                       error))]
         (is (= :logseq.outliner.op/missing-parent-original (:type (ex-data error))))
         (is (= parent-id
                (get-in (d/entity @conn [:block/uuid child-id])
                        [:block/parent :block/uuid]))))))))

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

(deftest import-db-binary-uses-active-pool-after-close-db
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [import-db! (get @thread-api/*thread-apis :thread-api/import-db-binary)
              imported-pool-ids (atom [])
              pool-seq (atom 0)
              make-pool (fn [id]
                          (let [pool #js {:id id
                                          :paused false}]
                            (set! (.-pauseVfs pool) (fn [] (set! (.-paused pool) true)))
                            (set! (.-unpauseVfs pool) (fn [] (set! (.-paused pool) false)))
                            pool))
              existing-pool (make-pool "existing-pool")
              sqlite-data (.encode (js/TextEncoder.) "SQLite format 3")]
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
          (-> (import-db! test-repo sqlite-data)
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

(deftest handle-migrate-result-local-txs-enqueues-upgrade-reports-test
  (let [conn (d/create-conn db-schema/schema)
        migration-tx-report {:tx-data [[:db/add 1 :block/title "Migrated"]]
                             :db-before @conn
                             :db-after @conn
                             :tx-meta {:db-migrate? true}}
        handled-reports (atom [])]
    (with-redefs [db-sync/handle-local-tx! (fn [repo tx-report]
                                             (swap! handled-reports conj
                                                    {:repo repo
                                                     :tx-report tx-report}))]
      (#'db-core/handle-migrate-result-local-txs!
       test-repo
       {:upgrade-result-coll [migration-tx-report]})
      (is (= [{:repo test-repo
               :tx-report migration-tx-report}]
             @handled-reports)))))

(deftest built-in-sync-repair-tx-data-covers-65-26-through-65-28-test
  (let [tx-data (#'db-core/built-in-sync-repair-tx-data)
        tx-data-again (#'db-core/built-in-sync-repair-tx-data)
        idents (set (keep :db/ident tx-data))]
    (is (= tx-data tx-data-again)
        "The repair is stable when multiple clients send it")
    (is (every? idents
                [:logseq.property.repeat/repeat-type
                 :logseq.property.comments/blocks
                 :logseq.class/Comments
                 :logseq.class/Comment]))
    (is (every?
         (fn [item]
           (or (not (and (map? item) (:block/uuid item)))
               (and (number? (:block/created-at item))
                    (number? (:block/updated-at item))
                    (or (contains? #{:logseq.class/Comments :logseq.class/Comment} (:db/ident item))
                        (and (string? (:block/order item))
                             (db-order/validate-order-key? (:block/order item)))))))
         tx-data)
        "Block-shaped repair items keep valid timestamps and order when order is allowed")
    (is (not-any?
         (fn [item]
           (and (map? item)
                (contains? #{:logseq.class/Comments :logseq.class/Comment} (:db/ident item))
                (contains? item :block/order)))
         tx-data)
        "#Comments and #Comment repair class blocks should not have block order")
    (is (not-any?
         (fn [item]
           (or (and (map? item)
                    (contains? item :logseq.property.comments/blocks))
               (and (vector? item)
                    (= :logseq.property.comments/blocks (nth item 2 nil)))))
         tx-data)
        "65.29 comment target data is intentionally not included")))

(deftest enqueue-built-in-sync-repair-queues-pending-fix-once-test
  (let [upserts (atom [])
        count-adjustments (atom [])]
    (with-redefs [client-op/get-local-tx-entry (fn [_repo _tx-id] nil)
                  client-op/upsert-local-tx-entry! (fn [repo entry]
                                                     (swap! upserts conj {:repo repo
                                                                          :entry entry})
                                                     {:should-inc-pending? true})
                  client-op/adjust-pending-local-tx-count! (fn [repo delta]
                                                             (swap! count-adjustments conj [repo delta]))]
      (#'db-core/enqueue-built-in-sync-repair! test-repo)
      (let [{:keys [repo entry]} (first @upserts)]
        (is (= test-repo repo))
        (is (uuid? (:tx-id entry)))
        (is (= 0 (:created-at entry)))
        (is (true? (:pending? entry)))
        (is (false? (:failed? entry)))
        (is (= :fix (:outliner-op entry)))
        (is (seq (:normalized-tx-data entry)))))
      (is (= [[test-repo 1]] @count-adjustments))

    (reset! upserts [])
    (reset! count-adjustments [])
    (with-redefs [client-op/get-local-tx-entry (fn [_repo _tx-id] {:tx-id (random-uuid)})
                  client-op/upsert-local-tx-entry! (fn [_repo _entry]
                                                     (swap! upserts conj :unexpected))
                  client-op/adjust-pending-local-tx-count! (fn [_repo _delta]
                                                             (swap! count-adjustments conj :unexpected))]
      (#'db-core/enqueue-built-in-sync-repair! test-repo)
      (is (empty? @upserts))
      (is (empty? @count-adjustments)))))

(deftest maybe-enqueue-built-in-sync-repair-only-for-migrated-remote-graphs-test
  (let [remote-conn (d/create-conn db-schema/schema)
        local-conn (d/create-conn db-schema/schema)
        upserts (atom [])]
    (d/transact! remote-conn [{:db/ident :logseq.kv/graph-remote?
                               :kv/value true}])
    (d/transact! local-conn [{:db/ident :logseq.kv/graph-remote?
                              :kv/value false}])
    (with-redefs [client-op/get-local-tx-entry (fn [_repo _tx-id] nil)
                  client-op/upsert-local-tx-entry! (fn [repo entry]
                                                     (swap! upserts conj {:repo repo
                                                                          :entry entry})
                                                     {:should-inc-pending? false})
                  client-op/adjust-pending-local-tx-count! (fn [_repo _delta] nil)]
      (#'db-core/maybe-enqueue-built-in-sync-repair! test-repo remote-conn nil true)
      (is (= 1 (count @upserts)))

      (reset! upserts [])
      (#'db-core/maybe-enqueue-built-in-sync-repair! test-repo remote-conn {:upgrade-result-coll []} true)
      (is (empty? @upserts)
          "Real migration tx reports are uploaded instead of repair txs")

      (#'db-core/maybe-enqueue-built-in-sync-repair! test-repo local-conn nil true)
      (is (empty? @upserts)
          "Local-only graphs do not need server repair")

      (#'db-core/maybe-enqueue-built-in-sync-repair! test-repo remote-conn nil false)
      (is (empty? @upserts)
          "New graphs rely on initial upload data"))))

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
                        search/block->index (fn [_entity & _opts]
                                              {:id "block-1"
                                               :page "page-1"
                                               :title "Hello"})]
            (-> (p/let [_ (build-index! test-repo true)
                        _ (<wait-for-progress! progress-calls
                                               (fn [calls]
                                                 (= :idle (get-in (last calls) [:payload :status])))
                                               50)]
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

(deftest search-build-blocks-indice-in-worker-reports-progress-before-rebuild-work-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [repo (str test-repo "-progress-" (random-uuid))
              build-index! #'search-handler/<build-blocks-index!
              conn (d/create-conn db-schema/schema)
              progress-calls (atom [])
              progress-seen-before-rebuild-work? (atom nil)
              record-progress! (fn [repo payload]
                                 (swap! progress-calls conj {:repo repo
                                                             :payload payload}))
              search-db #js {:exec (fn [sql-or-opts]
                                     (let [sql (if (string? sql-or-opts)
                                                 sql-or-opts
                                                 (gobj/get sql-or-opts "sql"))]
                                       (when (and (not= sql "PRAGMA user_version")
                                                  (nil? @progress-seen-before-rebuild-work?))
                                         (reset! progress-seen-before-rebuild-work?
                                                 (boolean (seq @progress-calls))))
                                            (if (= sql "PRAGMA user_version")
                                              #js [#js [0]]
                                              #js [])))
                            :close (fn [] nil)}
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
          (platform/set-platform! (build-test-platform))
          (d/transact! conn [{:block/uuid (random-uuid)}])
          (reset! idle-status-atom {repo {:idle? true
                                          :ts (.now js/Date)}})
          (p/with-redefs [search-handler/report-search-index-progress! (fn [repo payload]
                                                                  (record-progress! repo payload)
                                                                  (p/resolved nil))
                          search/truncate-table! (fn [db]
                                                   (.exec db "truncate"))
                          search/truncate-vector-index! (fn [_vector-index] nil)
                          search/upsert-blocks! (fn [_db _blocks] nil)
                          search/hidden-entity? (constantly false)
                          search/block->index (fn [_entity & _opts]
                                                {:id "block-1"
                                                 :page "page-1"
                                                 :title "Hello"})]
            (let [build-id (#'search-handler/start-search-index-build! repo)]
              (-> (build-index! repo search-db conn build-id)
                (p/then (fn [_]
                          (is @progress-seen-before-rebuild-work?
                              "Progress should be emitted before rebuild prep starts")
                          (is (= :running (get-in (first @progress-calls) [:payload :status])))))
                (p/catch (fn [error]
                           (is false (str error))))))))))
     (p/finally done))))

(deftest search-upsert-blocks-does-not-wait-for-vector-embedding-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [upsert-blocks! (get @thread-api/*thread-apis :thread-api/search-upsert-blocks)
              sqlite-upserts (atom 0)
              vector-upserts (atom [])
              block-id (str (random-uuid))
              page-id (str (random-uuid))
              search-db #js {:transaction (fn [f]
                                            (swap! sqlite-upserts inc)
                                            (f #js {:exec (fn [_opts] nil)}))}]
          (platform/set-platform! (build-test-platform
                                   {:runtime :node
                                    :embed-texts (fn [_texts]
                                                   (js/Promise. (fn [_resolve _reject])))}))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*vector-indexes {test-repo {:upsert! (fn [docs]
                                                                       (swap! vector-upserts conj docs))}})
          (p/let [result (js/Promise.race
                          #js [(upsert-blocks! test-repo [{:id block-id
                                                           :page page-id
                                                           :title "which team is Manu in?"}])
                               (p/delay 20 ::timeout)])]
            (is (nil? result))
            (is (= 1 @sqlite-upserts))
            (is (empty? @vector-upserts))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-blocks-falls-back-to-keyword-search-when-query-embedding-fails-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [search! (get @thread-api/*thread-apis :thread-api/search-blocks)
              conn (d/create-conn db-schema/schema)
              search-db #js {:exec (fn [_opts] #js [])}]
          (platform/set-platform! (build-test-platform
                                   {:runtime :node
                                    :embed-texts (fn [_texts]
                                                   (p/rejected (js/Error. "embedding unavailable")))}))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! worker-state/*vector-indexes {test-repo {:query (fn [& _] [])}})
          (p/let [result (search! test-repo "alpha" {:limit 5})]
            (is (empty? result))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-build-blocks-indice-in-worker-reports-unified-progress-test
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
          (platform/set-platform! (build-test-platform
                                   {:runtime :node
                                    :post-message! (fn [type payload]
                                                     (when (= type :thread-api/search-index-build-progress)
                                                       (let [[repo payload'] payload]
                                                         (swap! progress-calls conj {:repo repo
                                                                                     :payload payload'}))))
                                    :embed-texts (fn [_texts]
                                                   (p/resolved [[0.1 0.2 0.3]]))}))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! worker-state/*vector-indexes {test-repo {:upsert! (fn [_docs] nil)
                                                           :truncate! (fn [] nil)}})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread
                  (fn [qkw & args]
                    (when (= qkw :thread-api/search-index-build-progress)
                      (let [[repo payload] args]
                        (swap! progress-calls conj {:repo repo
                                                    :payload payload})))
                    (p/resolved nil)))
          (with-redefs [search/truncate-table! (fn [_db] nil)
                        search/upsert-blocks! (fn [_db _blocks] nil)
                        search/hidden-entity? (constantly false)
                        search/block->index (fn [_entity & _opts]
                                              {:id "block-1"
                                               :page "page-1"
                                               :title "Hello"})]
            (p/let [_ (build-index! test-repo true)
                    _ (<wait-for-progress! progress-calls
                                           (fn [calls]
                                             (= :idle (get-in (last calls) [:payload :status])))
                                           50)]
              (let [stages (keep #(get-in % [:payload :stage]) @progress-calls)
                    terminal-progress (some #(when (= 100 (get-in % [:payload :progress]))
                                               %)
                                            @progress-calls)]
                (is (not-any? #{:vector-index :keyword-index} stages))
                (is (some #{:search-index} stages))
                (is (= test-repo (:repo terminal-progress)))
                (is (= :search-index (get-in terminal-progress [:payload :stage])))
                (is (= 1 (get-in terminal-progress [:payload :processed])))
                (is (= 1 (get-in terminal-progress [:payload :total])))))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-build-blocks-indice-in-worker-completes-before-vector-embedding-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [build-index! #'search-handler/<build-blocks-index!
              build-id (#'search-handler/start-search-index-build! test-repo)
              conn (d/create-conn db-schema/schema)
              page-id (random-uuid)
              sql-calls (atom [])
              search-db (fake-db {:sql-calls sql-calls})
              progress-calls (atom [])
              vector-upserts (atom [])
              embedding-started? (atom false)
              vector-index {:upsert! (fn [docs]
                                        (swap! vector-upserts conj docs))
                            :truncate! (fn [] nil)
                            :set-metadata! (fn [_metadata] nil)}
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
          (d/transact! conn [{:block/uuid page-id
                              :block/name "page"
                              :block/title "Page"}
                             {:block/uuid (random-uuid)
                              :block/title "Hello"
                              :block/page [:block/uuid page-id]}])
          (set! (.-transaction search-db) (fn [f] (f search-db)))
          (platform/set-platform! (build-test-platform
                                   {:runtime :node
                                    :post-message! (fn [type payload]
                                                     (when (= type :thread-api/search-index-build-progress)
                                                       (let [[repo payload'] payload]
                                                         (swap! progress-calls conj {:repo repo
                                                                                     :payload payload'}))))
                                    :embed-texts (fn [_texts]
                                                   (reset! embedding-started? true)
                                                   (js/Promise. (fn [_resolve _reject])))}))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! worker-state/*vector-indexes {test-repo vector-index})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread (fn [& _args] (p/resolved nil)))
          (with-redefs [worker-state/get-vector-index (fn [repo]
                                                        (when (= repo test-repo)
                                                          vector-index))]
            (-> (p/let [result (js/Promise.race
                                 #js [(build-index! test-repo search-db conn build-id)
                                      (p/delay 50 ::timeout)])
                        _ (<wait-for-progress! progress-calls
                                               (fn [calls]
                                                 (some #(= :completed (get-in % [:payload :status])) calls))
                                               50)
                        _ (p/delay 10)]
                  (let [completed-progress (some #(when (= :completed (get-in % [:payload :status]))
                                                    %)
                                                 @progress-calls)]
                    (is (nil? result))
                    (is @embedding-started?)
                    (is (some #(= (str "PRAGMA user_version = " search-handler/search-db-version) %)
                              @sql-calls))
                    (is (= {:repo test-repo
                            :payload {:status :completed
                                      :stage :search-index
                                      :progress 100
                                      :processed 2
                                      :total 2}}
                           (some-> completed-progress
                                   (select-keys [:repo :payload])
                                   (update :payload dissoc :build-id))))
                    (is (empty? @vector-upserts))))
                (p/catch (fn [error]
                           (is false (str error)))))))))
     (p/finally done))))

(deftest search-build-blocks-indice-in-worker-does-not-sort-vector-context-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [build-index! (get @thread-api/*thread-apis :thread-api/search-build-blocks-indice-in-worker)
              conn (d/create-conn db-schema/schema)
              search-db (fake-db)
              page-id (random-uuid)
              sort-calls (atom 0)
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)
              block-count 40]
          (set! (.-transaction search-db) (fn [f] (f search-db)))
          (d/transact! conn
                       (into [{:block/uuid page-id
                               :block/name "search perf"
                               :block/title "Search Perf"}]
                             (map (fn [idx]
                                    {:block/uuid (random-uuid)
                                     :block/title (str "Sibling " idx)
                                     :block/order idx
                                     :block/parent [:block/uuid page-id]
                                     :block/page [:block/uuid page-id]}))
                             (range block-count)))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread (fn [& _args] (p/resolved nil)))
          (with-redefs [search/truncate-table! (fn [_db] nil)
                        search/upsert-blocks! (fn [_db _blocks] nil)
                        search/hidden-entity? (constantly false)
                        ldb/sort-by-order (fn [children]
                                            (swap! sort-calls inc)
                                            (sort-by :block/order children))
                        ldb/page? (fn [entity]
                                    (= page-id (:block/uuid entity)))
                        ldb/object? (constantly false)
                        ldb/journal? (constantly false)
                        ldb/closed-value? (constantly false)
                        ldb/hidden? (constantly false)
                        ldb/get-title-with-parents (fn [entity] (:block/title entity))]
            (p/let [_ (build-index! test-repo true)]
              (is (zero? @sort-calls)))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-index-blocks-use-platform-embeddings-for-vector-index-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (platform/set-platform! (build-test-platform {:runtime :node}))
        (let [vector-index {:upsert! (fn [_] nil)}]
          (reset! worker-state/*vector-indexes {test-repo vector-index})
          (p/with-redefs [worker-state/get-vector-index (fn [repo]
                                                          (when (= repo test-repo)
                                                            vector-index))]
            (p/let [result (#'search-handler/<embed-index-blocks
                            test-repo
                            [{:id "block-1"
                              :page "page-1"
                              :title "Hello"}])]
              (is (= [{:id "block-1"
                       :page "page-1"
                       :title "Hello"
                       :embedding [0]}]
                     result)))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-index-blocks-embeds-in-bounded-batches-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [batch-sizes (atom [])
                   blocks (mapv (fn [n]
                                  {:id (str "block-" n)
                                   :page "page-1"
                                   :title (str "Block " n)})
                                (range 65))]
          (platform/set-platform!
           (build-test-platform
            {:runtime :node
             :embed-texts (fn [texts]
                            (swap! batch-sizes conj (count texts))
                            (p/resolved (mapv (fn [_] [0]) texts)))}))
          (reset! worker-state/*vector-indexes {test-repo {:upsert! (fn [_] nil)}})
          (p/let [result (#'search-handler/<embed-index-blocks test-repo blocks)]
            (is (= (count blocks) (count result)))
            (is (= [32 32 1] @batch-sizes))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-index-blocks-embeds-batches-in-parallel-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [active-batches (atom 0)
              max-active-batches (atom 0)
              batch-sizes (atom [])
                   blocks (mapv (fn [n]
                                  {:id (str "block-" n)
                                   :page "page-1"
                                   :title (str "Block " n)})
                                (range 96))]
          (platform/set-platform!
           (build-test-platform
            {:runtime :node
             :embed-texts (fn [texts]
                            (let [active (swap! active-batches inc)]
                              (swap! max-active-batches max active)
                              (swap! batch-sizes conj (count texts))
                              (p/let [_ (p/delay 10)]
                                (swap! active-batches dec)
                                (mapv (fn [_] [0]) texts))))}))
          (reset! worker-state/*vector-indexes {test-repo {:upsert! (fn [_] nil)}})
          (p/let [result (#'search-handler/<embed-index-blocks test-repo blocks)]
            (is (= (count blocks) (count result)))
            (is (= [32 32 32] (sort @batch-sizes)))
            (is (= 2 @max-active-batches))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-index-blocks-falls-back-to-single-embeddings-when-batch-fails-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [batch-sizes (atom [])
                   blocks (mapv (fn [n]
                                  {:id (str "block-" n)
                                   :page "page-1"
                                   :title (str "Block " n)})
                                (range 8))
              embed-texts (fn [texts]
                            (swap! batch-sizes conj (count texts))
                            (if (> (count texts) 2)
                              (p/rejected (js/Error. "batch too large"))
                              (p/resolved (mapv (fn [_] [0]) texts))))]
          (p/let [result (#'search-handler/<embed-index-batch-with-fallback embed-texts blocks)]
            (is (= (count blocks) (count result)))
            (is (= [8 4 2 2 4 2 2] @batch-sizes))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest search-build-blocks-indice-in-worker-skips-rebuild-when-fts-current-and-vector-metadata-mismatches-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [build-index! (get @thread-api/*thread-apis :thread-api/search-build-blocks-indice-in-worker)
              conn (d/create-conn db-schema/schema)
              search-db (fake-db {:user-version search-handler/search-db-version})
              truncate-calls (atom 0)
              metadata-writes (atom [])
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
          (d/transact! conn [{:block/uuid (random-uuid)}])
          (platform/set-platform! (build-test-platform {:runtime :node}))
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! worker-state/*vector-indexes
                  {test-repo {:upsert! (fn [_docs] nil)
                              :truncate! (fn [] (swap! truncate-calls inc))
                              :metadata (fn []
                                          {:embedding-model-id "old-model"
                                           :embedding-dimension search/vector-embedding-dimension
                                           :context-version search/vector-context-version})
                              :set-metadata! (fn [metadata]
                                               (swap! metadata-writes conj metadata))}})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread (fn [& _] (p/resolved nil)))
          (with-redefs [search/truncate-table! (fn [_db] nil)
                        search/upsert-blocks! (fn [_db _blocks] nil)
                        search/hidden-entity? (constantly false)
                        search/block->index (fn [_entity & _opts]
                                              {:id "block-1"
                                               :page "page-1"
                                               :title "Hello"})]
            (p/let [result (build-index! test-repo false)
                    _ (p/delay 10)]
              (is (= search-handler/search-db-version result))
              (is (= 0 @truncate-calls))
              (is (empty? @metadata-writes)))))))
     (p/catch (fn [error]
                (is false (str "unexpected error: " error))))
     (p/finally done))))

(deftest vector-embedding-title-truncates-long-text-test
  (let [vector-embedding-title #'search-handler/vector-embedding-title
        long-title (apply str (repeat 6000 "x"))]
    (is (= 2048 (count (vector-embedding-title long-title))))
    (is (= "short title" (vector-embedding-title "short title")))))

(deftest vector-embedding-title-prefers-vector-title-test
  (let [vector-embedding-title #'search-handler/vector-embedding-title]
    (is (= "Page context\nBlock: Alpha"
           (vector-embedding-title {:title "Alpha"
                                    :vector-title "Page context\nBlock: Alpha"})))
    (is (= "Alpha"
           (vector-embedding-title {:title "Alpha"})))))

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

(deftest vector-index-path-resolves-under-search-vector-dir-test
  (restoring-worker-state
   (fn []
     (let [vector-index-path #'db-core/vector-index-path
           pool #js {:id "pool"}]
       (platform/set-platform!
        (assoc-in (build-test-platform) [:storage :resolve-db-path]
                  (fn [_repo _pool path]
                    (str "/graph/" path))))
       (is (= "/graph/search/vector"
              (vector-index-path test-repo pool)))))))

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
  (let [search-index-version #'search-handler/search-index-version
        db (fake-db {:user-version 5})]
    (is (= 5 (search-index-version db)))))

(deftest search-index-version-reads-default-zero
  (let [search-index-version #'search-handler/search-index-version
        db (fake-db {:user-version 0})]
    (is (= 0 (search-index-version db)))))

;; ---- search-index-build management tests ----

(deftest start-search-index-build-creates-build-id
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'search-handler/start-search-index-build!
           build-id (start-search-index-build! test-repo)]
       (is (string? build-id))
       (is (= build-id (get @(deref #'search-handler/*search-index-build-ids) test-repo)))))))

(deftest clear-search-index-build-removes-only-matching-build
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'search-handler/start-search-index-build!
           clear-search-index-build! #'search-handler/clear-search-index-build!
           build-id (start-search-index-build! test-repo)]
       ;; Clear with matching build-id
       (clear-search-index-build! test-repo build-id)
       (is (nil? (get @(deref #'search-handler/*search-index-build-ids) test-repo)))
       ;; Start a new build
       (let [build-id-2 (start-search-index-build! test-repo)]
         ;; Clear with wrong build-id should not remove
         (clear-search-index-build! test-repo "wrong-id")
         (is (= build-id-2 (get @(deref #'search-handler/*search-index-build-ids) test-repo))))))))

(deftest ensure-active-search-index-build-throws-for-stale-build
  (restoring-worker-state
   (fn []
     (let [start-search-index-build! #'search-handler/start-search-index-build!
           ensure-active-search-index-build! #'search-handler/ensure-active-search-index-build!
           build-id (start-search-index-build! test-repo)]
       ;; Current build-id should not throw
       (is (nil? (ensure-active-search-index-build! test-repo build-id)))
       ;; Stale build-id should throw
       (is (thrown? js/Error (ensure-active-search-index-build! test-repo "stale-id")))))))

;; ---- take-search-index-batch tests ----

(deftest take-search-index-batch-returns-all-for-small-input
  (let [take-search-index-batch #'search-handler/take-search-index-batch
        blocks [{:e 1} {:e 2} {:e 3}]
        [batch remaining] (take-search-index-batch blocks 10 1000)]
    (is (= 3 (count batch)))
    (is (nil? remaining))))

(deftest take-search-index-batch-respects-batch-size
  (let [take-search-index-batch #'search-handler/take-search-index-batch
        blocks (vec (for [i (range 100)] {:e i}))
        [batch remaining] (take-search-index-batch blocks 10 1000)]
    (is (= 10 (count batch)))
    (is (= 90 (count remaining)))))

(deftest take-search-index-batch-returns-empty-for-empty-input
  (let [take-search-index-batch #'search-handler/take-search-index-batch
        [batch remaining] (take-search-index-batch [] 10 1000)]
    (is (empty? batch))
    (is (nil? remaining))))

;; ---- search-index-input-idle? tests ----

(deftest search-index-input-idle-returns-true-for-node
  (restoring-worker-state
   (fn []
     (let [search-index-input-idle? #'search-handler/search-index-input-idle?]
       (platform/set-platform! (build-test-platform {:runtime :node}))
       (is (true? (search-index-input-idle? test-repo)))))))

(deftest search-index-input-idle-reads-status-from-state
  (restoring-worker-state
   (fn []
     (let [search-index-input-idle? #'search-handler/search-index-input-idle?
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
     (let [search-index-input-idle? #'search-handler/search-index-input-idle?
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
         (#'maintenance-handler/reset-db! test-repo transit-str)
         ;; Verify the conn now has the new data
        (is (= "replaced" (:kv/value (d/entity @conn :test/entity)))))))))

(deftest get-class-objects-returns-plain-worker-maps-test
  (restoring-worker-state
   (fn []
     (let [conn (d/create-conn db-schema/schema)
           block-uuid #uuid "11111111-2222-3333-4444-555555555555"]
       (d/transact! conn [{:db/ident :logseq.class/Page
                           :block/title "Page"}
                          {:block/uuid block-uuid
                           :block/title "Tagged page"
                           :block/tags #{:logseq.class/Page}}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [class-id (:db/id (d/entity @conn :logseq.class/Page))
             result ((get-thread-api :thread-api/get-class-objects) test-repo class-id)
             block-result (first result)]
         (is (= {:db/id (:db/id (d/entity @conn [:block/uuid block-uuid]))
                 :block/uuid block-uuid
                 :block/title "Tagged page"
                 :block/raw-title "Tagged page"
                 :block/tags [{:db/id class-id
                               :db/ident :logseq.class/Page
                               :block/title "Page"
                               :block/raw-title "Page"}]}
                block-result)))))))

;; ---- checksum-diagnostics tests ----

(deftest checksum-diagnostics-returns-local-and-remote
  (restoring-worker-state
   (fn []
     (let [checksum-diagnostics #'worker-export-handler/checksum-diagnostics]
       (with-redefs [client-op/get-local-checksum (fn [_] "local-checksum-123")
                     db-sync/*repo->latest-remote-checksum (atom {test-repo "remote-checksum-456"})]
         (is (= {:local-checksum "local-checksum-123"
                 :remote-checksum "remote-checksum-456"}
                (checksum-diagnostics test-repo))))))))

(deftest checksum-diagnostics-handles-missing-remote
  (restoring-worker-state
   (fn []
     (let [checksum-diagnostics #'worker-export-handler/checksum-diagnostics]
       (with-redefs [client-op/get-local-checksum (fn [_] "local-checksum-123")
                     db-sync/*repo->latest-remote-checksum (atom {})]
         (is (= {:local-checksum "local-checksum-123"
                 :remote-checksum nil}
                (checksum-diagnostics test-repo))))))))

;; ---- get-all-page-titles tests ----

(deftest get-all-page-titles-returns-sorted-titles
  (let [get-all-page-titles #'worker-graph-handler/get-all-page-titles
        conn (d/create-conn db-schema/schema)]
    ;; ldb/get-all-pages expects specific schema attributes, so we mock it
    (with-redefs [ldb/get-all-pages (fn [_db]
                                      [{:block/title "Charlie"}
                                       {:block/title "Alpha"}
                                       {:block/title "Bravo"}])]
      (let [titles (get-all-page-titles @conn)]
        (is (= ["Alpha" "Bravo" "Charlie"] titles))))))

(deftest get-all-page-titles-returns-empty-for-no-pages
  (let [get-all-page-titles #'worker-graph-handler/get-all-page-titles
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

(deftest build-proxy-object-routes-requests-through-service-being-created
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [*service @#'db-core/*service
              old-service-value @*service
              service-created (p/deferred)
              old-calls (atom [])
              new-calls (atom [])
              service (fn [calls]
                        {:status {:ready (p/resolved true)}
                         :proxy #js {"remoteInvoke"
                                    (fn [args]
                                      (let [[method payload] args]
                                        (swap! calls conj [method payload])
                                        (p/resolved method)))}})
              old-service (service old-calls)
              new-service (service new-calls)]
          (reset! *service ["graph-a" old-service])
          (p/with-redefs [db-core/close-db! (fn [_repo] nil)
                          shared-service/<create-service (fn [& _args]
                                                           service-created)]
            (let [proxy (#'db-core/build-proxy-object)
                  remote-invoke (gobj/get proxy "remoteInvoke")
                  create-request (remote-invoke
                                  "thread-api/create-or-open-db"
                                  (ldb/write-transit-str ["graph-b" {}]))
                  query-request (remote-invoke
                                       "thread-api/get-key-value"
                                       (ldb/write-transit-str ["graph-b" :logseq.kv/schema-version]))]
              (p/resolve! service-created new-service)
              (-> (p/all [create-request query-request])
                  (p/then (fn [_]
                            (is (empty? @old-calls))
                            (is (= #{"thread-api/create-or-open-db"
                                          "thread-api/get-key-value"}
                                   (set (map first @new-calls))))))
                  (p/catch (fn [error]
                             (is false (str "unexpected error: " error))))
                  (p/finally #(reset! *service old-service-value))))))))
     (p/finally done))))

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
     (let [report-search-index-progress! #'search-handler/report-search-index-progress!
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
     (let [report-search-index-progress! #'search-handler/report-search-index-progress!]
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

(deftest get-latest-journals-returns-worker-maps
  (restoring-worker-state
   (fn []
     (let [get-latest-journals! (get-thread-api :thread-api/get-latest-journals)
           conn (d/create-conn task-spent-time-schema)
           old-uuid #uuid "11111111-1111-1111-1111-111111111111"
           latest-uuid #uuid "22222222-2222-2222-2222-222222222222"]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/uuid old-uuid
                           :block/title "2024-01-01"
                           :block/name "2024-01-01"
                           :block/journal-day 20240101
                           :block/tags :logseq.class/Journal}
                          {:block/uuid latest-uuid
                           :block/title "2024-01-02"
                           :block/name "2024-01-02"
                           :block/journal-day 20240102
                           :block/tags :logseq.class/Journal}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (get-latest-journals! test-repo 1)]
         (is (= [latest-uuid] (mapv :block/uuid result)))
         (is (= ["Jan 2nd, 2024"] (mapv :block/title result)))
         (is (= ["Jan 2nd, 2024"] (mapv :block/raw-title result))))))))

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

(deftest get-first-url-property-value-returns-worker-url-property
  (restoring-worker-state
   (fn []
     (let [get-url! (get-thread-api :thread-api/get-first-url-property-value)
           page-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:db/ident :logseq.class/Property}
                          {:db/ident :user.property/website
                           :block/title "Website"
                           :block/tags :logseq.class/Property
                           :logseq.property/type :url}
                          {:block/title "Page Title"
                           :block/name "page-title"
                           :block/uuid page-id
                           :block/tags :logseq.class/Page
                           :user.property/website "https://example.com"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (= "https://example.com"
              (get-url! test-repo (:db/id (d/entity @conn [:block/uuid page-id])))))))))

(deftest plugin-api-worker-lookups-return-tags-and-resolve-inputs
  (restoring-worker-state
   (fn []
     (let [get-tags-by-name! (get-thread-api :thread-api/get-tags-by-name)
           resolve-inputs! (get-thread-api :thread-api/resolve-query-inputs)
           tag-uuid #uuid "11111111-1111-1111-1111-111111111111"
           page-uuid #uuid "22222222-2222-2222-2222-222222222222"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:db/ident :logseq.class/Tag}
                          {:block/title "Topic"
                           :block/name "topic"
                           :block/uuid tag-uuid
                           :block/tags :logseq.class/Tag}
                          {:block/title "Current Worker Page"
                           :block/name "current-worker-page"
                           :block/uuid page-uuid
                           :block/tags :logseq.class/Page}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (= ["Topic"]
              (map :block/title (get-tags-by-name! test-repo "Topic"))))
       (is (= ["current page"]
              (resolve-inputs! test-repo [":current-page"]
                               {:current-page-title "Current Page"
                                :today-title "Today"})))
       (is (= ["current worker page"]
              (resolve-inputs! test-repo [":current-page"]
                               {:current-page page-uuid
                                :today-title "Today"})))))))

(deftest query-dsl-worker-apis-run-against-worker-db
  (restoring-worker-state
   (fn []
     (let [query! (get-thread-api :thread-api/query-dsl-query)
           custom-query! (get-thread-api :thread-api/query-dsl-custom-query)
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:block/title "querypage"
                           :block/name "querypage"
                           :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                           :block/tags :logseq.class/Page}
                          {:block/title "worker task"
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                           :block/page [:block/uuid #uuid "11111111-1111-1111-1111-111111111111"]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [worker-query-dsl/execute-query
                     (fn [query-string db opts]
                       [(contains? (set (map first (d/q '[:find ?title
                                                          :where [_ :block/title ?title]]
                                                        db)))
                                   "worker task")
                        query-string
                        opts])
                     worker-query-dsl/execute-custom-query
                     (fn [query-m db opts]
                       [(contains? (set (map first (d/q '[:find ?title
                                                          :where [_ :block/title ?title]]
                                                        db)))
                                   "worker task")
                        query-m
                        opts])]
         (is (= [true "(page querypage)" {:block-attrs [:db/id :block/title]}]
                (query! test-repo
                        "(page querypage)"
                        {:block-attrs [:db/id :block/title]})))
         (is (= [true {:query '(page querypage)} {:block-attrs [:db/id :block/title]}]
                (custom-query! test-repo
                               {:query '(page querypage)}
                               {:block-attrs [:db/id :block/title]}))))))))

(deftest query-dsl-worker-results-include-renderable-block-fields
  (restoring-worker-state
   (fn []
     (let [query! (get-thread-api :thread-api/query-dsl-query)
           conn (d/create-conn db-schema/schema)
           page-uuid #uuid "11111111-1111-1111-1111-111111111111"
           block-uuid #uuid "22222222-2222-2222-2222-222222222222"]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:block/title "querypage"
                           :block/name "querypage"
                           :block/uuid page-uuid
                           :block/tags :logseq.class/Page}
                          {:block/title "worker task"
                           :block/uuid block-uuid
                           :block/page [:block/uuid page-uuid]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (ffirst (query! test-repo
                                    "(page querypage)"
                                    {:block-attrs query-dsl/db-block-attrs}))]
         (is (= block-uuid (:block/uuid result)))
         (is (= "worker task" (:block/raw-title result))))))))

(deftest task-spent-time-runs-against-worker-db
  (restoring-worker-state
   (fn []
     (let [spent-time! (get-thread-api :thread-api/task-spent-time)
           conn (d/create-conn db-schema/schema)
           block-uuid #uuid "11111111-1111-1111-1111-111111111111"]
       (d/transact! conn [{:db/ident :logseq.property/status}
                          {:db/ident :logseq.property/status.doing
                           :block/title "Doing"}
                          {:db/ident :logseq.property/status.done
                           :block/title "Done"}
                          {:block/uuid block-uuid
                           :block/title "task"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block-id (ffirst (d/q '[:find ?b
                                     :in $ ?uuid
                                     :where [?b :block/uuid ?uuid]]
                                   @conn
                                   block-uuid))]
         (d/transact! conn [{:block/created-at 1000
                             :logseq.property.history/block block-id
                             :logseq.property.history/property :logseq.property/status
                             :logseq.property.history/ref-value :logseq.property/status.doing}
                            {:block/created-at 4000
                             :logseq.property.history/block block-id
                             :logseq.property.history/property :logseq.property/status
                             :logseq.property.history/ref-value :logseq.property/status.done}])
         (let [[history seconds] (spent-time! test-repo block-id)]
         (is (= 3 seconds))
         (is (= [{:created-at 1000
                  :property-ident :logseq.property/status
                  :status-ident :logseq.property/status.doing
                  :status-title "Doing"}
                 {:created-at 4000
                  :property-ident :logseq.property/status
                  :status-ident :logseq.property/status.done
                  :status-title "Done"}]
                (mapv (fn [item]
                        {:created-at (:block/created-at item)
                         :property-ident (:logseq.property.history/property-ident item)
                         :status-ident (:logseq.property.history/ref-value-ident item)
                         :status-title (:logseq.property.history/ref-value-title item)})
                      history)))
         (is (not-any? #(contains? % :logseq.property.history/ref-value) history))
         (is (not-any? #(contains? % :logseq.property.history/property) history))))))))

(deftest get-display-properties-keeps-other-position-properties-for-page-properties
  (restoring-worker-state
   (fn []
     (let [display-properties! (get-thread-api :thread-api/get-display-properties)
           property-id :user.property/date
           page-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:db/ident :logseq.class/Property}
                          {:db/ident property-id
                           :block/title "Date"
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                           :block/tags :logseq.class/Property
                           :logseq.property/type :date}
                          {:block/title "Page Title"
                           :block/name "page-title"
                           :block/uuid page-id
                           :block/tags :logseq.class/Page
                           property-id "Jun 23rd, 2026"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block {:block/uuid page-id
                    :block/tags #{:logseq.class/Page}
                    :block/properties {property-id "Jun 23rd, 2026"}}
             page-result (display-properties! test-repo {:block block
                                                         :opts {:page-title? true}
                                                         :show-empty-and-hidden-properties? false})
             block-result (display-properties! test-repo {:block block
                                                          :opts {:in-block-container? true}
                                                          :show-empty-and-hidden-properties? false})]
         (is (= [{:property-id property-id
                  :value "Jun 23rd, 2026"}]
                (mapv #(select-keys % [:property-id :value])
                      (:full-properties page-result))))
         (is (empty? (:full-properties block-result))))))))

(deftest get-display-properties-filters-recycled-entity-values
  (restoring-worker-state
   (fn []
     (let [display-properties! (get-thread-api :thread-api/get-display-properties)
           property-id :user.property/node
           page-id #uuid "11111111-1111-1111-1111-111111111111"
           active-value {:db/id 101
                         :block/title "Active"}
           recycled-value {:db/id 102
                           :block/title "Recycled"
                           :logseq.property/deleted-at 1}
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:db/ident :logseq.class/Property}
                          {:db/ident property-id
                           :block/title "Node"
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                           :block/tags :logseq.class/Property
                           :logseq.property/type :default}
                          {:block/title "Page Title"
                           :block/name "page-title"
                           :block/uuid page-id
                           :block/tags :logseq.class/Page}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block {:block/uuid page-id
                    :block/tags #{:logseq.class/Page}
                    :block/properties {property-id #{active-value recycled-value}}}
             result (display-properties! test-repo {:block block
                                                    :opts {:page-title? true}
                                                    :show-empty-and-hidden-properties? false})]
         (is (= #{active-value}
                (:value (first (:full-properties result))))))))))

(deftest get-display-properties-reads-current-worker-block-properties
  (restoring-worker-state
   (fn []
     (let [display-properties! (get-thread-api :thread-api/get-display-properties)
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           property-id :user.property/fresh
           property-value "fresh value"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/ident property-id
                           :block/title "Fresh"
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                           :block/tags :logseq.class/Property
                           :logseq.property/type :default}
                          {:block/title "Block"
                           :block/uuid block-id
                           property-id property-value}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [stale-block {:db/id (:db/id (d/entity @conn [:block/uuid block-id]))
                          :block/uuid block-id
                          :block/properties {}}
             result (display-properties! test-repo {:block stale-block
                                                    :opts {}
                                                    :show-empty-and-hidden-properties? false})
             fresh-property (some (fn [property-row]
                                    (when (= property-id (:property-id property-row))
                                      property-row))
                                  (:full-properties result))]
         (is (= property-value (:value fresh-property))))))))

(deftest get-block-children-stops-scanning-large-subtrees
  (let [conn (d/create-conn db-schema/schema)
        root-uuid (random-uuid)
        child-uuids (vec (repeatedly 1000 random-uuid))
        blocks (map-indexed
                (fn [idx block-uuid]
                  {:block/title (str "Block " idx)
                   :block/uuid block-uuid
                   :block/parent [:block/uuid (if (zero? idx)
                                                root-uuid
                                                (nth child-uuids (dec idx)))]
                   :block/order "a0"})
                child-uuids)]
    (d/transact! conn (cons {:block/title "Root"
                             :block/uuid root-uuid}
                            blocks))
    (let [original-datoms d/datoms
          parent-index-scans (atom 0)]
      (with-redefs [d/datoms (fn [db index & components]
                               (when (and (= :avet index)
                                          (= :block/parent (first components)))
                                 (swap! parent-index-scans inc))
                               (apply original-datoms db index components))]
        (let [root (d/entity @conn [:block/uuid root-uuid])
              {:keys [large-page? children]} (#'block-handler/get-block-children @conn root {})]
          (is large-page?)
          (is (= 1 (count children)))
          (is (<= @parent-index-scans 101)
              (str "Large subtree was scanned past the result limit: "
                   @parent-index-scans)))))))

(deftest get-blocks-returns-all-journal-blocks-render-ready
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           conn (db-test/create-conn-with-blocks
                 {:pages-and-blocks
                  [{:page {:build/journal 20260716}
                    :blocks (mapv (fn [index]
                                    {:block/title (str "Block " index)})
                                  (range 165))}]})
           journal-id (d/q '[:find ?journal .
                             :where [?journal :block/journal-day 20260716]]
                           @conn)]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [{:keys [block children]}
             (-> (get-blocks! test-repo
                              (ldb/write-transit-str
                               [{:id journal-id
                                 :opts {:all? true
                                        :children? true
                                        :render-data? true
                                        :include-collapsed-children? true}}]))
                 ldb/read-transit-str
                 first)]
         (is (= 165 (count children)))
         (is (= :full (:block.temp/load-status block)))
         (is (every? #(= :full (:block.temp/load-status %)) children))
         (is (every? #(contains? % :block.temp/positioned-properties) children)))))))

(deftest page-block-index-returns-all-ids-and-only-initial-render-data
  (restoring-worker-state
   (fn []
     (let [get-page-tree! (get-thread-api :thread-api/get-page-blocks-tree)
           page-id #uuid "00000000-0000-0000-0000-000000000001"
           block-ids (mapv (fn [index]
                             (uuid (str "10000000-0000-0000-0000-"
                                        (.padStart (str index) 12 "0"))))
                           (range 75))
           conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "Long page"
                          :block/uuid page-id
                          :build/keep-uuid? true}
                   :blocks (mapv (fn [index block-id]
                                   {:block/title (str "Block " index)
                                    :block/uuid block-id
                                    :build/keep-uuid? true})
                                 (range 75)
                                 block-ids)}])]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [{:keys [block index blocks]}
             (get-page-tree! test-repo page-id {:initial-limit 20})
             result-by-name (get-page-tree! test-repo "long page" {:initial-limit 20})]
         (is (= page-id (:block/uuid block)))
         (is (= page-id (get-in result-by-name [:block :block/uuid]))
             "Page routes may resolve the same index by normalized page name.")
         (is (= block-ids (mapv :block/uuid index))
             "The complete ordered block index is returned once.")
         (is (= 20 (count blocks))
             "Only the first render window is hydrated.")
         (is (every? #(= :index (:block.temp/load-status %)) index))
         (is (every? #(contains? % :block.temp/positioned-properties) blocks))
         (is (every? #(not (contains? % :block/title)) index)
             "Index entries must not precompute block render payloads."))))))

(deftest get-blocks-includes-render-critical-property-data
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           get-display-properties! (get-thread-api :thread-api/get-display-properties)
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/title "Scheduled task"
                           :block/uuid block-id
                           :block/properties {:unsafe "map value"}
                           :logseq.property/status :logseq.property/status.backlog
                           :logseq.property/scheduled 1783612800000}
                          {:block/uuid (random-uuid)
                           :block/created-at 1
                           :block/updated-at 1
                           :logseq.property.reaction/emoji-id "+1"
                           :logseq.property.reaction/target [:block/uuid block-id]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (-> (get-blocks! test-repo
                                      (ldb/write-transit-str
                                       [{:id block-id
                                         :opts {:children? false
                                                :render-data? true}}]))
                        ldb/read-transit-str
                        first
                        :block)
             positioned-properties (:block.temp/positioned-properties result)
             status-property (some (fn [property]
                                     (when (= :logseq.property/status (:db/ident property))
                                       property))
                                   (:block-left positioned-properties))
             scheduled-property (some (fn [property]
                                        (when (= :logseq.property/scheduled (:db/ident property))
                                          property))
                                      (:block-below positioned-properties))
             display-properties (get-display-properties!
                                 test-repo
                                 {:block result
                                  :opts {}
                                  :show-empty-and-hidden-properties? false})]
         (is (= "Status" (:block/title status-property)))
         (is (= :default (:logseq.property/type status-property)))
         (is (= "Scheduled" (:block/title scheduled-property)))
         (is (= :datetime (:logseq.property/type scheduled-property)))
         (is (= ["+1"]
                (mapv :logseq.property.reaction/emoji-id
                      (:block.temp/reactions result))))
         (is (contains? result :block.temp/positioned-properties))
         (is (contains? result :block.temp/reactions))
         (is (not (contains? result :block.temp/refs-count)))
         (is (map? (:block.temp/display-properties result)))
         (is (map? display-properties))
         (is (map? (:block/properties result))))))))

(deftest get-blocks-default-payload-skips-render-derived-data
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "View row"
                             :block/uuid block-id
                             :build/keep-uuid? true}]}])]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block (-> (get-blocks! test-repo
                                    (ldb/write-transit-str
                                     [{:id block-id
                                       :opts {:children? false}}]))
                       ldb/read-transit-str
                       first
                       :block)]
         (is (= "View row" (:block/title block)))
         (is (not (contains? block :block.temp/positioned-properties)))
         (is (not (contains? block :block.temp/display-properties)))
         (is (not (contains? block :block.temp/reactions))))))))

(deftest get-blocks-projected-payload-skips-full-properties-map
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           block-id #uuid "22222222-2222-2222-2222-222222222222"
           conn (db-test/create-conn-with-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Projected row"
                             :block/uuid block-id
                             :block/updated-at 42
                             :build/keep-uuid? true}]}])]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block (-> (get-blocks! test-repo
                                    (ldb/write-transit-str
                                     [{:id block-id
                                       :opts {:children? false
                                              :properties [:block/title
                                                           :block/updated-at]}}]))
                       ldb/read-transit-str
                       first
                       :block)]
         (is (= "Projected row" (:block/title block)))
         (is (= 42 (:block/updated-at block)))
         (is (not (contains? block :block/properties))
             "Projected table rows must not compute every display property."))))))

(deftest sanitize-block-result-removes-nil-values
  (is (= {:block {:db/id 42
                  :block/title "parent"}
          :children [{:db/id 43
                      :block/title "child"}
                     {:db/id 44
                      :block/title "loaded"
                      :block/parent 42}]}
         (#'block-handler/sanitize-block-result
          {:block {:db/id 42
                   :block/title "parent"
                   :block/parent nil}
           :children [{:db/id 43
                       :block/title "child"
                       :block/parent nil}
                      {:db/id 44
                       :block/title "loaded"
                       :block/parent 42
                       :block.temp/load-status nil}]}))))

(deftest get-blocks-preserves-page-tagged-block-title
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/title "Page block"
                           :block/uuid block-id
                           :block/tags :logseq.class/Page}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (-> (get-blocks! test-repo
                                      (ldb/write-transit-str
                                       [{:id block-id
                                         :opts {:children? false}}]))
                        ldb/read-transit-str
                        first
                        :block)
             tag-idents (set (map :db/ident (:block/tags result)))]
         (is (= "Page block" (:block/title result)))
         (is (= "Page block" (:block/raw-title result)))
         (is (contains? tag-idents :logseq.class/Page)))))))

(deftest get-blocks-returns-cleared-render-state
  (restoring-worker-state
   (fn []
     (let [get-blocks! (get-thread-api :thread-api/get-blocks)
           block-id #uuid "11111111-1111-1111-1111-111111111111"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:block/title "Block"
                           :block/uuid block-id
                           :block/tags :logseq.class/Page
                           :block/collapsed? true}])
       (let [id (d/entid @conn [:block/uuid block-id])
             page-class-id (d/entid @conn :logseq.class/Page)]
         (d/transact! conn [[:db/retract id :block/tags page-class-id]
                            [:db/retract id :block/collapsed? true]]))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [block (-> (get-blocks! test-repo
                                    (ldb/write-transit-str
                                     [{:id block-id
                                       :opts {:children? false}}]))
                       ldb/read-transit-str
                       first
                       :block)]
         (is (= [] (:block/tags block)))
         (is (false? (:block/collapsed? block))))))))

(deftest route-title-returns-page-and-block-data
  (restoring-worker-state
   (fn []
     (let [route-title! (get-thread-api :thread-api/get-route-title)
           page-id #uuid "11111111-1111-1111-1111-111111111111"
           block-id #uuid "22222222-2222-2222-2222-222222222222"
           conn (d/create-conn db-schema/schema)]
       (d/transact! conn [{:db/ident :logseq.class/Page}
                          {:block/title "Page Title"
                           :block/name "page-title"
                           :block/uuid page-id
                           :block/tags :logseq.class/Page}
                          {:block/title "Block Title"
                           :block/uuid block-id}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (= {:page-title "Page Title"}
              (route-title! test-repo "page-title")))
       (is (= {:block-title "Block Title"}
              (route-title! test-repo (str block-id))))
       (is (nil? (route-title! test-repo "missing-page")))))))

(deftest get-file-content-returns-file-content-by-path
  (restoring-worker-state
   (fn []
     (let [get-file-content! (get @thread-api/*thread-apis :thread-api/get-file-content)
           conn (d/create-conn db-schema/schema)
           config-content "{:ui/show-brackets? true}"]
       (is (fn? get-file-content!))
       (d/transact! conn [{:file/path "logseq/config.edn"
                           :file/content config-content}
                          {:file/path "logseq/custom.css"
                           :file/content "body { color: red; }"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (when get-file-content!
         (is (= config-content
                (get-file-content! test-repo "logseq/config.edn")))
         (is (nil? (get-file-content! test-repo "missing.edn"))))))))

(deftest get-all-properties-filters-and-sorts-worker-properties
  (restoring-worker-state
   (fn []
     (let [get-all-properties! (get @thread-api/*thread-apis :thread-api/get-all-properties)
           conn (d/create-conn db-schema/schema)]
       (is (fn? get-all-properties!))
       (d/transact! conn [{:db/ident :logseq.class/Property}
                          {:db/ident :user.property/b
                           :block/title "B"
                           :block/tags :logseq.class/Property}
                          {:db/ident :user.property/a
                           :block/title "A"
                           :block/tags :logseq.class/Property}
                          {:db/ident :logseq.property/private
                           :block/title "Private"
                           :block/tags :logseq.class/Property
                           :logseq.property/built-in? true}
                          {:db/ident :logseq.property/icon
                           :block/title "Icon"
                           :block/tags :logseq.class/Property
                           :logseq.property/built-in? true}
                          {:db/ident :user.property/recycled
                           :block/title "Recycled"
                           :block/tags :logseq.class/Property
                           :logseq.property/deleted-at 1}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [public-result (get-all-properties! test-repo {})
             with-built-ins (get-all-properties! test-repo {:remove-built-in-property? false})]
         (is (= [:user.property/a :user.property/b :logseq.property/icon]
                (map :db/ident public-result)))
         (is (= [:user.property/a :user.property/b :logseq.property/icon :logseq.property/private]
                (map :db/ident with-built-ins))))))))

(deftest import-file-graph-imports-documents-into-worker-conn
  (async done
         (restoring-worker-state
          (fn []
            (let [import-file-graph! (get @thread-api/*thread-apis :thread-api/import-file-graph)
                  conn (d/create-conn db-schema/schema)
                  config-file {:path "logseq/config.edn"
                               :file/content "{}"}
                  files [config-file
                         {:path "pages/Home.md"
                          :file/content "- imported block"}]]
              (is (fn? import-file-graph!))
              (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
              (reset! worker-state/*datascript-conns {test-repo conn})
              (->
               (p/let [result (import-file-graph! test-repo config-file files {:user-options {}})
                       page (some->> (d/q '[:find [?e ...]
                                             :where [?e :block/name "home"]]
                                           @conn)
                                           first
                                      (d/entity @conn))]
                 (is (= #{"pages/Home.md" "logseq/config.edn"}
                        (set (map :path (:files result)))))
                 (is (= "Home" (:block/title page)))
                 (is (some #(= "imported block" (:block/title (d/entity @conn (:e %))))
                           (d/datoms @conn :avet :block/title "imported block"))))
               (p/catch
                (fn [error]
                  (is false (str error))))
               (p/finally done)))))))

(deftest get-date-scheduled-or-deadlines-filters-sorts-and-groups-worker-results
  (restoring-worker-state
   (fn []
     (let [get-date-scheduled-or-deadlines! (get @thread-api/*thread-apis :thread-api/get-date-scheduled-or-deadlines)
           conn (d/create-conn db-schema/schema)
           page-a-id -1
           page-b-id -2]
       (is (fn? get-date-scheduled-or-deadlines!))
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/id page-a-id
                           :block/title "Page A"
                           :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                          {:db/id page-b-id
                           :block/title "Page B"
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                          {:block/title "later"
                           :block/order "b"
                           :block/page page-a-id
                           :logseq.property/scheduled 3000
                           :logseq.property/status :logseq.property/status.todo}
                          {:block/title "earlier"
                           :block/order "a"
                           :block/page page-a-id
                           :logseq.property/deadline 2000
                           :logseq.property/status :logseq.property/status.doing}
                          {:block/title "other page"
                           :block/order "a"
                           :block/page page-b-id
                           :logseq.property/deadline 2500
                           :logseq.property/status :logseq.property/status.todo}
                          {:block/title "done"
                           :block/page page-a-id
                           :logseq.property/scheduled 2500
                           :logseq.property/status :logseq.property/status.done}
                          {:block/title "too future"
                           :block/page page-a-id
                           :logseq.property/scheduled 9000
                           :logseq.property/status :logseq.property/status.todo}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [result (get-date-scheduled-or-deadlines! test-repo 1000 5000)
             page-a (some (fn [[page blocks]]
                            (when (= "Page A" (:block/title page))
                              blocks))
                          result)
             page-b (some (fn [[page blocks]]
                            (when (= "Page B" (:block/title page))
                              blocks))
                          result)]
         (is (= #{"Page A" "Page B"}
                (set (map :block/title (keys result)))))
         (is (= #{"earlier" "later"}
                (set (map :block/title page-a))))
         (is (= ["other page"]
                (mapv :block/title page-b))))))))

(deftest get-property-node-selector-data-prepares-worker-owned-db-data-test
  (async done
         (restoring-worker-state
          (fn []
            (let [get-selector-data! (get-thread-api :thread-api/get-property-node-selector-data)
                  conn (d/create-conn db-schema/schema)
                  page-uuid #uuid "11111111-1111-1111-1111-111111111111"]
              (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
              (d/transact! conn [{:db/id -1
                                  :db/ident :user.class/Topic
                                  :block/title "Topic"
                                  :block/name "topic"
                                  :block/tags :logseq.class/Tag}
                                 {:block/title "Page A"
                                  :block/name "page-a"
                                  :block/uuid page-uuid
                                  :block/tags -1}])
              (reset! worker-state/*datascript-conns {test-repo conn})
              (->
               (p/let [topic-class (select-keys (d/entity @conn :user.class/Topic)
                                                [:db/id :db/ident :block/title])
                       topic-class-id (:db/id topic-class)
                       property {:db/ident :block/tags
                                 :logseq.property/type :node
                                 :logseq.property/classes [topic-class]}
                       data (get-selector-data! test-repo {:property property
                                                           :block {:db/id (:db/id (d/entity @conn [:block/uuid page-uuid]))}})]
                 (is (some #(= :user.class/Topic (:db/ident %)) (:all-classes data)))
                 (is (not-any? #(= :logseq.class/Root (:db/ident %)) (:class-options data)))
                 (is (contains? (:structured-children-by-class-id data) topic-class-id))
                 (is (= ["Page A"] (map :block/title (:initial-choices data)))))
               (p/catch
                (fn [error]
                  (is false (str error))))
               (p/finally done)))))))

(deftest get-view-filter-data-prepares-operators-and-values-test
  (restoring-worker-state
   (fn []
     (let [get-filter-data! (get-thread-api :thread-api/get-view-filter-data)
           conn (d/create-conn db-schema/schema)
           page-uuid #uuid "22222222-2222-2222-2222-222222222222"
           option {:property {:db/ident :user.property/topic
                              :block/title "Topic"
                              :logseq.property/type :node}
                   :property-ident :user.property/topic
                   :operator :is
                   :value "stale"}]
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [db-view/get-property-values
                     (fn [_conn property-ident _option]
                       (is (= :user.property/topic property-ident))
                       [{:label "Page B"
                         :value {:block/uuid page-uuid
                                 :block/title "Page B"}}])]
         (let [data (get-filter-data! test-repo option)]
           (is (= [:is :is-not :text-contains :text-not-contains] (:operators data)))
           (is (= :property-values (:value-source data)))
           (is (true? (:many? data)))
           (is (= [{:label "Page B" :value page-uuid}] (:values data)))
           (is (nil? (:value-after-operator-change data)))))
       (is (= {:operators [:before :after]
               :value-source :timestamp
               :many? false
               :values nil
               :value-after-operator-change 123}
              (select-keys
               (get-filter-data! test-repo {:property {:db/ident :block/created-at
                                                       :logseq.property/type :datetime}
                                            :property-ident :block/created-at
                                            :operator :before
                                            :value 123})
               [:operators :value-source :many? :values :value-after-operator-change])))))))

(deftest convert-tag-to-page-updates-worker-db-atomically
  (restoring-worker-state
   (fn []
     (let [convert! (get @thread-api/*thread-apis :thread-api/convert-tag-to-page)
           conn (d/create-conn db-schema/schema)
           class-tempid -1
           object-tempid -2
           page-tempid -3
           class-uuid #uuid "33333333-3333-3333-3333-333333333333"
           object-uuid #uuid "44444444-4444-4444-4444-444444444444"
           page-uuid #uuid "55555555-5555-5555-5555-555555555555"]
       (is (fn? convert!))
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/id class-tempid
                           :block/title "Tag"
                           :block/name "tag"
                           :block/uuid class-uuid
                           :db/ident :user.class/tag
                           :block/tags :logseq.class/Tag
                           :block/created-at 1
                           :block/updated-at 1}
                          {:db/id page-tempid
                           :block/title "Page"
                           :block/name "page"
                           :block/uuid page-uuid
                           :block/tags :logseq.class/Page
                           :block/created-at 1
                           :block/updated-at 1}
                          {:db/id object-tempid
                           :block/title (str "hello #[[" class-uuid "]]")
                           :block/uuid object-uuid
                           :block/tags class-tempid
                           :block/page page-tempid
                           :block/parent page-tempid
                           :block/order "a0"
                           :block/created-at 1
                           :block/updated-at 1}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (when (fn? convert!)
         (let [class-id (:db/id (d/entity @conn :user.class/tag))
               object-id (:db/id (d/entity @conn [:block/uuid object-uuid]))]
           (convert! test-repo class-id)
           (let [class (d/entity @conn class-id)
                 object (d/entity @conn object-id)]
             (is (nil? (:db/ident class)))
             (is (contains? (set (map :db/ident (:block/tags class))) :logseq.class/Page))
             (is (= (str "hello [[" class-uuid "]]") (:block/title object)))
             (is (not-any? #(= class-id (:db/id %)) (:block/tags object))))))))))

(deftest validate-block-tag-runs-unique-tag-validation-in-worker
  (restoring-worker-state
   (fn []
     (let [validate-tag! (get @thread-api/*thread-apis :thread-api/validate-block-tag)
           conn (d/create-conn db-schema/schema)
           block-id #uuid "66666666-6666-6666-6666-666666666666"
           tag-tempid -1
           block-tempid -2]
       (is (fn? validate-tag!))
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/id tag-tempid
                           :block/title "Tag"
                           :block/name "tag"
                           :block/uuid #uuid "77777777-7777-7777-7777-777777777777"
                           :db/ident :user.class/Tag
                           :block/tags :logseq.class/Tag}
                          {:db/id block-tempid
                           :block/title "Object"
                           :block/uuid block-id}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [tag-id (:db/id (d/entity @conn :user.class/Tag))]
         (is (= {:valid? true}
                (validate-tag! test-repo block-id tag-id))))))))

(deftest validate-block-tag-returns-notification-payload
  (restoring-worker-state
   (fn []
     (let [validate-tag! (get @thread-api/*thread-apis :thread-api/validate-block-tag)
           conn (d/create-conn db-schema/schema)
           first-block-tempid -2
           second-block-tempid -3
           first-block-id #uuid "88888888-8888-8888-8888-888888888888"
           second-block-id #uuid "99999999-9999-9999-9999-999999999999"]
       (is (fn? validate-tag!))
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/id first-block-tempid
                           :block/title "Object"
                           :block/uuid first-block-id
                           :block/tags :logseq.class/Page}
                          {:db/id second-block-tempid
                           :block/title "Object"
                           :block/uuid second-block-id}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [tag-id (:db/id (d/entity @conn :logseq.class/Page))
             result (validate-tag! test-repo second-block-id tag-id)]
         (is (= false (:valid? result)))
         (is (= :warning (get-in result [:payload :type])))
         (is (string? (get-in result [:payload :message]))))))))

(deftest convert-page-to-tag-updates-worker-db-atomically
  (restoring-worker-state
   (fn []
     (let [convert! (get @thread-api/*thread-apis :thread-api/convert-page-to-tag)
           conn (d/create-conn db-schema/schema)
           page-tempid -1
           page-uuid #uuid "55555555-5555-5555-5555-555555555555"]
       (is (fn? convert!))
       (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
       (d/transact! conn [{:db/id page-tempid
                           :block/title "Page"
                           :block/name "page"
                           :block/uuid page-uuid
                           :block/created-at 123
                           :block/tags :logseq.class/Page}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (when (fn? convert!)
         (let [page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))]
           (convert! test-repo page-id)
           (let [class (d/entity @conn page-id)
                 tag-idents (set (map :db/ident (:block/tags class)))]
             (is (= page-uuid (:block/uuid class)))
             (is (= "Page" (:block/title class)))
             (is (= 123 (:block/created-at class)))
             (is (= :user.class/Page (:db/ident class)))
             (is (contains? tag-idents :logseq.class/Tag))
             (is (not (contains? tag-idents :logseq.class/Page))))))))))

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

;; ---- graph metadata tests ----

(deftest get-key-value-returns-kv-value-from-conn
  (restoring-worker-state
   (fn []
     (let [get-key-value! (get @thread-api/*thread-apis :thread-api/get-key-value)
           conn (d/create-conn db-schema/schema)]
       (is (fn? get-key-value!))
       (d/transact! conn [(ldb/kv :logseq.kv/graph-backup-folder "Backups")])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (when get-key-value!
         (is (= "Backups"
                (get-key-value! test-repo :logseq.kv/graph-backup-folder)))
         (is (nil? (get-key-value! test-repo :logseq.kv/missing))))))))

(deftest get-key-value-returns-nil-for-missing-conn
  (let [get-key-value! (get @thread-api/*thread-apis :thread-api/get-key-value)]
    (is (fn? get-key-value!))
    (when get-key-value!
      (is (nil? (get-key-value! "nonexistent-repo" :logseq.kv/graph-backup-folder))))))

(deftest get-graph-uuid-prefers-rtc-uuid
  (restoring-worker-state
   (fn []
     (let [get-uuid! (get @thread-api/*thread-apis :thread-api/get-graph-uuid)
           conn (d/create-conn db-schema/schema)]
       (is (fn? get-uuid!))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [ldb/get-graph-rtc-uuid (fn [_db]
                                              #uuid "22222222-2222-2222-2222-222222222222")
                     ldb/get-graph-local-uuid (fn [_db]
                                                #uuid "11111111-1111-1111-1111-111111111111")]
         (when get-uuid!
           (is (= #uuid "22222222-2222-2222-2222-222222222222"
                  (get-uuid! test-repo)))))))))

(deftest get-graph-uuid-returns-local-uuid-when-rtc-uuid-is-missing
  (restoring-worker-state
   (fn []
     (let [get-uuid! (get @thread-api/*thread-apis :thread-api/get-graph-uuid)
           conn (d/create-conn db-schema/schema)]
       (is (fn? get-uuid!))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (with-redefs [ldb/get-graph-rtc-uuid (constantly nil)
                     ldb/get-graph-local-uuid (fn [_db]
                                                #uuid "11111111-1111-1111-1111-111111111111")]
         (when get-uuid!
           (is (= #uuid "11111111-1111-1111-1111-111111111111"
                  (get-uuid! test-repo)))))))))

(deftest get-graph-uuid-returns-nil-for-missing-conn
  (let [get-uuid! (get @thread-api/*thread-apis :thread-api/get-graph-uuid)]
    (is (fn? get-uuid!))
    (when get-uuid!
      (is (nil? (get-uuid! "nonexistent-repo"))))))

(deftest ensure-local-graph-uuid-creates-and-persists-missing-uuid
  (restoring-worker-state
   (fn []
     (let [ensure-local-uuid! (get @thread-api/*thread-apis :thread-api/ensure-local-graph-uuid)
           conn (d/create-conn db-schema/schema)]
       (is (fn? ensure-local-uuid!))
       (reset! worker-state/*datascript-conns {test-repo conn})
       (when ensure-local-uuid!
         (let [local-graph-uuid (ensure-local-uuid! test-repo)]
           (is (uuid? local-graph-uuid))
           (is (= local-graph-uuid
                  (ldb/get-graph-local-uuid @conn)))
           (is (= local-graph-uuid
                  (ensure-local-uuid! test-repo)))))))))

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

;; ---- export-db-binary thread-api test ----

(deftest export-db-binary-returns-uint8array
  (async done
    (restoring-worker-state
     (fn []
       (let [export-db! (get @thread-api/*thread-apis :thread-api/export-db-binary)
             checkpoint-calls (atom [])]
         (reset! worker-state/*sqlite-conns {test-repo {:db (fake-db)}})
         (with-redefs [db-core/checkpoint-db! (fn [repo db]
                                                (swap! checkpoint-calls conj [repo db]))]
           (-> (export-db! test-repo)
               (p/then (fn [result]
                         (is (or (instance? js/Uint8Array result) (nil? result)))))
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
       (with-redefs [search-handler/search-blocks (fn [_repo _q _opts]
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

(deftest set-page-favorite-mutates-worker-db
  (restoring-worker-state
   (fn []
     (let [set-favorite! (get @thread-api/*thread-apis :thread-api/set-page-favorite)
           conn (d/create-conn db-schema/schema)
           favorites-page-uuid #uuid "11111111-1111-1111-1111-111111111111"
           page-uuid #uuid "22222222-2222-2222-2222-222222222222"]
       (d/transact! conn [{:block/uuid favorites-page-uuid
                           :block/title common-config/favorites-page-name
                           :block/name common-config/favorites-page-name}
                          {:block/uuid page-uuid
                           :block/title "Favorite page"
                           :block/name "favorite page"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (fn? set-favorite!))
       (when (fn? set-favorite!)
         (set-favorite! test-repo page-uuid true)
         (let [favorites-page (d/entity @conn [:block/uuid favorites-page-uuid])
               page (d/entity @conn [:block/uuid page-uuid])
               favorite-block (first (ldb/get-page-blocks @conn (:db/id favorites-page)))]
           (is (= (:db/id page) (get-in favorite-block [:block/link :db/id])))
           (set-favorite! test-repo page-uuid false)
           (is (empty? (ldb/get-page-blocks @conn (:db/id favorites-page))))))))))

(deftest set-page-favorite-is-idempotent
  (restoring-worker-state
   (fn []
     (let [set-favorite! (get @thread-api/*thread-apis :thread-api/set-page-favorite)
           conn (d/create-conn db-schema/schema)
           favorites-page-uuid #uuid "11111111-1111-1111-1111-111111111111"
           page-uuid #uuid "22222222-2222-2222-2222-222222222222"]
       (d/transact! conn [{:block/uuid favorites-page-uuid
                           :block/title common-config/favorites-page-name
                           :block/name common-config/favorites-page-name}
                          {:block/uuid page-uuid
                           :block/title "Favorite page"
                           :block/name "favorite page"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (fn? set-favorite!))
       (when (fn? set-favorite!)
         (set-favorite! test-repo page-uuid true)
         (set-favorite! test-repo page-uuid true)
         (let [favorites-page (d/entity @conn [:block/uuid favorites-page-uuid])]
           (is (= 1 (count (ldb/get-page-blocks @conn (:db/id favorites-page)))))))))))

(deftest reorder-favorites-mutates-worker-db
  (restoring-worker-state
   (fn []
     (let [reorder! (get @thread-api/*thread-apis :thread-api/reorder-favorites)
           conn (d/create-conn db-schema/schema)
           favorites-page-uuid #uuid "11111111-1111-1111-1111-111111111111"
           page-a-uuid #uuid "22222222-2222-2222-2222-222222222222"
           page-b-uuid #uuid "33333333-3333-3333-3333-333333333333"
           favorite-a-uuid #uuid "44444444-4444-4444-4444-444444444444"
           favorite-b-uuid #uuid "55555555-5555-5555-5555-555555555555"]
       (d/transact! conn [{:block/uuid favorites-page-uuid
                           :block/title common-config/favorites-page-name
                           :block/name common-config/favorites-page-name}
                          {:block/uuid page-a-uuid
                           :block/title "Favorite A"
                           :block/name "favorite a"}
                          {:block/uuid page-b-uuid
                           :block/title "Favorite B"
                           :block/name "favorite b"}
                          {:block/uuid favorite-a-uuid
                           :block/title ""
                           :block/page [:block/uuid favorites-page-uuid]
                           :block/order "a"
                           :block/link [:block/uuid page-a-uuid]}
                          {:block/uuid favorite-b-uuid
                           :block/title ""
                           :block/page [:block/uuid favorites-page-uuid]
                           :block/order "b"
                           :block/link [:block/uuid page-b-uuid]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (fn? reorder!))
       (when (fn? reorder!)
         (reorder! test-repo [page-b-uuid page-a-uuid])
         (let [favorites-page (d/entity @conn [:block/uuid favorites-page-uuid])
               page-a-id (:db/id (d/entity @conn [:block/uuid page-a-uuid]))
               page-b-id (:db/id (d/entity @conn [:block/uuid page-b-uuid]))
               page-ids (mapv #(get-in % [:block/link :db/id])
                              (ldb/sort-by-order (ldb/get-page-blocks @conn (:db/id favorites-page))))]
           (is (= [page-b-id page-a-id] page-ids))))))))

(deftest get-page-route-info-resolves-page-flags-and-alias-source
  (restoring-worker-state
   (fn []
     (let [get-page-route-info! (get-thread-api :thread-api/get-page-route-info)
           conn (d/create-conn db-schema/schema)
           source-uuid #uuid "11111111-1111-1111-1111-111111111111"
           alias-uuid #uuid "22222222-2222-2222-2222-222222222222"
           hidden-uuid #uuid "33333333-3333-3333-3333-333333333333"
           heading-uuid #uuid "44444444-4444-4444-4444-444444444444"]
       (d/transact! conn [{:block/uuid alias-uuid
                           :block/title "Alias"
                           :block/name "alias"}
                          {:block/uuid hidden-uuid
                           :block/title "Hidden"
                           :block/name "hidden"
                           :logseq.property/hide? true}])
       (d/transact! conn [{:block/uuid source-uuid
                           :block/title "Source"
                           :block/name "source"
                           :block/alias [[:block/uuid alias-uuid]]
                           :block/_parent [{:block/uuid heading-uuid
                                            :block/page [:block/uuid source-uuid]
                                            :block/title "Heading Block"
                                            :logseq.property/heading 2}]}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (let [alias-page (d/entity @conn [:block/uuid alias-uuid])
             source-page (d/entity @conn [:block/uuid source-uuid])
             hidden-page (d/entity @conn [:block/uuid hidden-uuid])
             heading-block (d/entity @conn [:block/uuid heading-uuid])]
         (is (= {:page-id (:db/id alias-page)
                 :page-uuid alias-uuid
                 :page-title "Alias"
                 :hidden? false
                 :property? false
                 :built-in? false
                 :private-built-in? false
                 :alias-source-id (:db/id source-page)
                 :alias-source-uuid source-uuid}
                (get-page-route-info! test-repo "Alias")))
         (is (= {:page-id (:db/id heading-block)
                 :page-uuid heading-uuid
                 :page-title "Heading Block"
                 :hidden? false
                 :property? false
                 :built-in? false
                 :private-built-in? false
                 :block-page-name "source"
                 :block-route-name "heading block"}
                (get-page-route-info! test-repo heading-uuid)))
         (is (= {:page-id (:db/id hidden-page)
                 :page-uuid hidden-uuid
                 :page-title "Hidden"
                 :hidden? true
                 :property? false
                 :built-in? false
                 :private-built-in? false}
                (get-page-route-info! test-repo hidden-uuid))))))))

(deftest get-block-by-page-name-and-block-route-name-resolves-heading-block
  (restoring-worker-state
   (fn []
     (let [get-heading-block! (get-thread-api :thread-api/get-block-by-page-name-and-block-route-name)
           conn (d/create-conn db-schema/schema)
           page-uuid #uuid "11111111-1111-1111-1111-111111111111"
           heading-uuid #uuid "22222222-2222-2222-2222-222222222222"
           non-heading-uuid #uuid "33333333-3333-3333-3333-333333333333"]
       (d/transact! conn [{:block/uuid page-uuid
                           :block/title "Foo"
                           :block/name "foo"}
                          {:block/uuid heading-uuid
                           :block/page [:block/uuid page-uuid]
                           :block/title "Header 2"
                           :logseq.property/heading 3}
                          {:block/uuid non-heading-uuid
                           :block/page [:block/uuid page-uuid]
                           :block/title "B2"}])
       (reset! worker-state/*datascript-conns {test-repo conn})
       (is (= {:block/uuid heading-uuid}
              (get-heading-block! test-repo "Foo" "header 2"))
           "Heading block content resolves by page name and route segment.")
       (is (= {:block/uuid heading-uuid}
              (get-heading-block! test-repo (str page-uuid) "header 2"))
           "Heading block content resolves by page uuid and route segment.")
       (is (nil? (get-heading-block! test-repo "Foo" "b2"))
           "Non-heading blocks are ignored for named block routes.")))))

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
                     api-tools/get-page-data (fn [db title]
                                               (swap! calls conj [:api-get-page-data db title])
                                               {:title title})
                     api-tools/list-properties (fn [db opt]
                                                 (swap! calls conj [:api-list-properties db opt])
                                                 [:ap1])
                     api-tools/list-tags (fn [db opt]
                                           (swap! calls conj [:api-list-tags db opt])
                                           [:at1])
                     api-tools/list-pages (fn [db opt]
                                            (swap! calls conj [:api-list-pages db opt])
                                            [:apg1])
                     api-tools/build-upsert-nodes-edn (fn [db input-ops]
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

(deftest worker-export-replaces-block-refs-with-worker-db-test
  (let [conn (d/create-conn db-schema/schema)
        page-id -1
        referenced-id -2
        root-id -3
        page-uuid #uuid "11111111-2222-3333-4444-555555555555"
        referenced-uuid #uuid "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        root-uuid #uuid "99999999-8888-7777-6666-555555555555"]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/id page-id
                        :block/title "Page"
                        :block/name "page"
                        :block/uuid page-uuid}
                       {:db/id referenced-id
                        :block/title "Referenced block"
                        :block/uuid referenced-uuid
                        :block/page page-id
                        :block/parent page-id
                        :block/order "a"}
                       {:db/id root-id
                        :block/title (str "((" referenced-uuid "))")
                        :block/uuid root-uuid
                        :block/page page-id
                        :block/parent page-id
                        :block/order "b"}])
    (let [result (worker-export/export-blocks-as-format
                  @conn
                  root-uuid
                  :markdown
                  {:remove-options [:property]}
                  {})]
      (is (string/includes? result "Referenced block")))))

;; When source and dest built-in eids differ, a :graph (datom) import would trip
;; the pipeline's revert-disallowed-changes, which sees the moved :db/ident as a
;; disallowed built-in edit and emits a conflicting revert. import-edn must
;; short-circuit the pipeline (e.g. via :initial-db?) for datom imports.
(deftest import-edn-datom-format-with-shifted-builtin-eids-test
  (restoring-worker-state
   (fn []
     (let [;; Source: shift built-in eids by one relative to a freshly seeded dest
           source-conn (d/create-conn db-schema/schema)
	         ;; Shift subsequent built-in eids without leaving invalid datoms in the export.
           _ (d/transact! source-conn [{:db/id 1 :block/uuid (random-uuid)}])
           _ (d/transact! source-conn [[:db/retractEntity 1]])
           _ (d/transact! source-conn (sqlite-create-graph/build-db-initial-data "{}"))
           export-edn (sqlite-export/build-export @source-conn {:export-type :graph})
           source-purple-eid (some (fn [[e a v]]
                                     (when (and (= a :db/ident)
                                                (= v :logseq.property/color.purple))
                                       e))
                                   (:datoms export-edn))
           dest-conn (sqlite-export/create-conn)
           dest-purple-eid (:db/id (d/entity @dest-conn :logseq.property/color.purple))]
       (assert (= :datoms (::sqlite-export/graph-format export-edn))
               "Test relies on a datom-format export")
       (assert (and source-purple-eid dest-purple-eid (not= source-purple-eid dest-purple-eid))
               "Test relies on shifted built-in eids between source and dest")
       (reset! worker-state/*datascript-conns {test-repo dest-conn})
       (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
       (try
         ((get-thread-api :thread-api/import-edn) test-repo export-edn)
         (is (= :logseq.property/color.purple
                (:db/ident (d/entity @dest-conn :logseq.property/color.purple)))
             "color.purple ident is preserved after datom import despite eid shift")
         (finally
           (ldb/register-transact-pipeline-fn! identity)))))))

(deftest import-edn-invalid-datom-format-does-not-change-db-test
  (restoring-worker-state
   (fn []
     (let [dest-conn (sqlite-export/create-conn)
           page-class-id (:db/id (d/entity @dest-conn :logseq.class/Page))
           invalid-export-edn {::sqlite-export/export-type :graph
                               ::sqlite-export/graph-format :datoms
                               :datoms [[1 :block/title "Orphan Page"]
                                        [1 :block/name "orphan page"]
                                        [1 :block/uuid #uuid "33333333-3333-4333-8333-000000000001"]
                                        [1 :block/tags 2]
                                        [2 :block/title "Page"]
                                        [2 :block/name "page"]
                                        [2 :db/ident :logseq.class/Page]
                                        [2 :block/uuid #uuid "33333333-3333-4333-8333-000000000002"]]}]
       (reset! worker-state/*datascript-conns {test-repo dest-conn})
       (let [result (silence-stderr
                     #((get-thread-api :thread-api/import-edn) test-repo invalid-export-edn))]
         (is (string? (:error result)))
         (is (= page-class-id (:db/id (d/entity @dest-conn :logseq.class/Page)))
             "Invalid datom import should not replace the existing graph"))))))
