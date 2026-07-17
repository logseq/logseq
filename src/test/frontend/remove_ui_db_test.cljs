(ns frontend.remove-ui-db-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(defn- source-for
  [relative-file]
  (.toString (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- source-file-exists?
  [relative-file]
  (fs/existsSync (node-path/join (.cwd js/process) relative-file)))

(deftest frontend-outliner-tree-reuses-shared-builder-test
  (let [source (source-for "src/main/frontend/modules/outliner/tree.cljs")]
    (is (string/includes? source "otree/blocks->vec-tree-data"))
    (is (not (string/includes? source "(group-by"))
        "The frontend adapter should not duplicate outliner tree construction.")))

(deftest outliner-transaction-has-no-dead-page-tree-path-test
  (let [source (source-for "src/main/frontend/db/transact.cljs")]
    (is (not (string/includes? source "outliner-ops-need-page-tree?")))
    (is (not (string/includes? source "page-tree-requested?")))
    (is (not (string/includes? source "(assoc :page-tree page-tree)")))))

(deftest unused-state-domain-scaffolding-is-absent-test
  (doseq [file ["assets.cljs" "config.cljs" "core.cljs" "db_worker.cljs"
                "editor.cljs" "graph.cljs" "init.cljs" "platform.cljs"
                "plugin.cljs" "search.cljs" "sidebar.cljs" "sync.cljs" "ui.cljs"]]
    (is (not (source-file-exists? (str "src/main/frontend/state/" file)))
        (str file " must have a production owner before adding a state domain namespace."))))

(defn- existing-source-files
  [relative-files]
  (filter source-file-exists? relative-files))

(defn- cljs-source-files-under
  [relative-dir]
  (let [root (node-path/join (.cwd js/process) relative-dir)]
    (letfn [(walk [dir]
              (->> (array-seq (fs/readdirSync dir))
                   (mapcat
                    (fn [entry]
                      (let [file (node-path/join dir entry)
                            stat (fs/statSync file)]
                        (cond
                          (.isDirectory stat)
                          (walk file)

                          (or (string/ends-with? file ".cljs")
                              (string/ends-with? file ".cljc"))
                          [file]

                          :else
                          []))))))]
      (walk root))))

(def ^:private direct-ui-db-call-pattern
  #"\b(?:d/(?:entity|pull)|db/(?:entity|pull|get-page|get-block|get-db|q|datoms|entity-db|get-block-parents|get-block-and-children))\b")

(defn- direct-ui-db-call-count-under
  [relative-dir]
  (->> (cljs-source-files-under relative-dir)
       (map #(.toString (fs/readFileSync % "utf8")))
       (mapcat #(re-seq direct-ui-db-call-pattern %))
       count))

(defn- direct-ui-db-call-count-under-with-pattern
  [relative-dir pattern]
  (->> (cljs-source-files-under relative-dir)
       (map #(.toString (fs/readFileSync % "utf8")))
       (mapcat #(re-seq pattern %))
       count))

(def ^:private pre-component-direct-ui-db-call-pattern
  #"\b(?:(?:db|conn)/(?:entity|pull|get-page|get-block|get-db|q|datoms|entity-db|get-block-parents|get-block-and-children|get-page-format)|d/(?:entity|pull|transact!))\b")

(def ^:private pre-component-direct-ui-db-files
  ["src/main/frontend/commands.cljs"
   "src/main/frontend/reaction.cljs"
   "src/main/frontend/template.cljs"
   "src/main/frontend/state.cljs"
   "src/main/frontend/util/page.cljs"
   "src/main/frontend/mobile/intent.cljs"
   "src/main/frontend/modules/outliner/pipeline.cljs"
   "src/main/frontend/modules/outliner/tree.cljs"
   "src/main/frontend/modules/outliner/ui.cljc"])

(defn- direct-ui-db-call-count-in-files
  [relative-files]
  (->> (existing-source-files relative-files)
       (map source-for)
       (mapcat #(re-seq pre-component-direct-ui-db-call-pattern %))
       count))

(defn- direct-ui-db-call-count-in-files-with-pattern
  [relative-files pattern]
  (->> (existing-source-files relative-files)
       (map source-for)
       (mapcat #(re-seq pattern %))
       count))

(def ^:private renderer-datascript-reference-pattern
  #"\b(?:d/(?:entity|pull|pull-many|q|datoms|transact!|db-with)|datascript\.core|\[datascript\.core)")

(def ^:private renderer-datascript-reference-roots
  ["src/main/frontend"
   "src/main/mobile"
   "src/main/electron"
   "src/main/logseq"])

(defn- approved-datascript-owner-file?
  [file]
  (or (string/includes? file "/src/main/frontend/worker/")
      (string/includes? file "/src/main/logseq/cli/")
      (string/ends-with? file "/src/main/logseq/common/export/file.cljs")
      (string/ends-with? file "/src/main/logseq/api/db_based/tools.cljs")))

(defn- renderer-datascript-reference-count
  []
  (->> renderer-datascript-reference-roots
       (mapcat cljs-source-files-under)
       (remove approved-datascript-owner-file?)
       (map #(.toString (fs/readFileSync % "utf8")))
       (mapcat #(re-seq renderer-datascript-reference-pattern %))
       count))

(def ^:private task-spent-time-renderer-nested-history-pattern
  #"\(:db/ident\s+\(:logseq\.property\.history/(?:property|ref-value)|\(:block/title\s+status")

(def ^:private task-spent-time-renderer-files
  ["src/main/frontend/db/async.cljs"
   "src/main/frontend/components/block.cljs"])

(def ^:private selected-component-page-entity-predicate-pattern
  #"\bldb/(?:page\?|class\?|property\?|journal\?|internal-page\?)(?=[\s\)\]\}])")

(def ^:private selected-component-page-entity-predicate-files
  ["src/main/frontend/components/page.cljs"])

(def ^:private selected-component-block-entity-predicate-pattern
  #"\bldb/(?:page\?|class\?|property\?|journal\?)(?=[\s\)\]\}])")

(def ^:private selected-component-block-entity-predicate-files
  ["src/main/frontend/components/block.cljs"])

(def ^:private selected-property-components-entity-predicate-pattern
  #"\b(?:ldb|entity-util)/(?:page\?|class\?|property\?|journal\?|internal-page\?)(?=[\s\)\]\}])")

(def ^:private selected-property-components-entity-predicate-files
  ["src/main/frontend/components/property.cljs"
   "src/main/frontend/components/property/value.cljs"])

(def ^:private selected-handler-entity-predicate-pattern
  #"\bldb/(?:page\?|class\?|property\?|journal\?)(?=[\s\)\]\}])")

(def ^:private selected-handler-entity-predicate-files
  ["src/main/frontend/handler/editor.cljs"
   "src/main/frontend/handler/page.cljs"
   "src/main/frontend/handler/comments.cljs"
   "src/main/frontend/handler/events/ui.cljs"])

(def ^:private remaining-component-entity-predicate-pattern
  #"\b(?:ldb|entity-util)/(?:page\?|class\?|property\?|journal\?|internal-page\?)(?=[\s\)\]\}])")

(def ^:private remaining-component-entity-predicate-files
  ["src/main/frontend/components/property/config.cljs"
   "src/main/frontend/components/page_menu.cljs"
   "src/main/frontend/components/editor.cljs"
   "src/main/frontend/components/recycle.cljs"
   "src/main/frontend/components/views.cljs"
   "src/main/frontend/components/icon.cljs"
   "src/main/frontend/components/header.cljs"
   "src/main/frontend/components/right_sidebar.cljs"
   "src/main/frontend/components/left_sidebar.cljs"
   "src/main/frontend/extensions/fsrs.cljs"])

(def ^:private final-frontend-entity-predicate-pattern
  #"\b(?:ldb|entity-util)/(?:page\?|class\?|property\?|journal\?|internal-page\?)(?=[\s\)\]\}])")

(def ^:private final-frontend-entity-predicate-files
  ["src/main/frontend/state.cljs"
   "src/main/frontend/modules/outliner/tree.cljs"
   "src/main/mobile/components/header.cljs"])

(def ^:private plugin-db-based-entity-predicate-pattern
  #"\b(?:ldb|entity-util)/(?:page\?|class\?|property\?)(?=[\s\)\]\}])")

(def ^:private plugin-db-based-entity-predicate-files
  ["src/main/logseq/api/db_based.cljs"])

(def ^:private cmdk-direct-ui-db-call-pattern
  #"\b(?:(?:db|conn)/(?:entity|pull|get-page|get-block|get-db|q|datoms|entity-db|get-block-parents|get-block-and-children|get-page-format)|d/(?:entity|pull|q|datoms))\b")

(def ^:private post-component-renderer-direct-ui-db-files
  ["src/main/frontend/core.cljs"
   "src/main/frontend/format/block.cljs"
   "src/main/frontend/handler/db_based/import.cljs"
   "src/main/frontend/extensions/fsrs.cljs"
   "src/main/frontend/extensions/pdf/assets.cljs"
   "src/main/frontend/search.cljs"])

(def ^:private indirect-renderer-db-model-call-pattern
  #"\b(?:(?:db|db-model)/(?:get-today-journal-title|page-exists\?|get-block-by-uuid|get-block-immediate-children|get-case-page|query-block-by-uuid|get-block-parent|get-journal-page|get-all-classes|has-children\?))(?=[\s\)\]\}])")

(def ^:private indirect-renderer-db-model-files
  ["src/main/frontend/quick_capture.cljs"
   "src/main/frontend/mobile/footer.cljs"
   "src/main/frontend/mobile/intent.cljs"
   "src/main/frontend/handler/block.cljs"
   "src/main/frontend/handler/events.cljs"
   "src/main/frontend/handler/db_based/page.cljs"
   "src/main/frontend/handler/journal.cljs"
   "src/main/frontend/handler/editor.cljs"
   "src/main/frontend/extensions/pdf/toolbar.cljs"])

(def ^:private remaining-handler-db-model-call-pattern
  #"\bdb-model/(?:hidden-page\?|get-all-properties)(?=[\s\)\]\}])")

(def ^:private remaining-handler-db-model-files
  ["src/main/frontend/handler/editor.cljs"
   "src/main/frontend/handler/property.cljs"])

(def ^:private component-facade-helper-call-pattern
  #"\b(?:db/(?:sub-block|page\?|get-case-page)|db-model/(?:untitled-page\?|get-all-readable-classes|get-all-classes|get-all-properties|today-journal-page\?))(?=[\s\)\]\}])")

(def ^:private component-facade-helper-files
  ["src/main/frontend/components/left_sidebar.cljs"
   "src/main/frontend/components/query/builder.cljs"
   "src/main/frontend/components/property/dialog.cljs"
   "src/main/frontend/components/editor.cljs"
   "src/main/frontend/components/property.cljs"
   "src/main/frontend/components/page_menu.cljs"
   "src/main/frontend/components/db_based/page.cljs"
   "src/main/frontend/components/objects.cljs"
   "src/main/frontend/components/reference.cljs"
   "src/main/frontend/components/reference_filters.cljs"
   "src/main/frontend/components/views.cljs"
   "src/main/frontend/components/block.cljs"])

(def ^:private final-component-facade-helper-call-pattern
  #"\b(?:db/(?:sub-block|page\?)|db-model/get-today-journal-title)(?=[\s\)\]\}])")

(def ^:private final-component-facade-helper-files
  ["src/main/frontend/extensions/fsrs.cljs"
   "src/main/frontend/components/property/value.cljs"
   "src/main/frontend/components/property/config.cljs"
   "src/main/frontend/components/page.cljs"])

(def ^:private remaining-frontend-helper-call-pattern
  #"\b(?:(?:db|model)/(?:get-journal-page-title|get-today-journal-title|get-block-by-uuid|get-structured-children|get-class-objects|get-all-classes|sub-block))(?=[\s\)\]\}])")

(def ^:private remaining-frontend-helper-files
  ["src/main/frontend/template.cljs"
   "src/main/frontend/commands.cljs"
   "src/main/frontend/handler/route.cljs"
   "src/main/frontend/components/right_sidebar.cljs"
   "src/main/frontend/components/page.cljs"
   "src/main/frontend/components/class.cljs"
   "src/main/frontend/components/property/value.cljs"])

(def ^:private api-editor-ui-db-call-pattern
  #"\b(?:(?:db|db-model)/(?:get-today-journal-title|get-page|get-block-by-uuid|query-block-by-uuid|get-page-blocks-no-cache|get-db|entity|pull)|db/entity)(?=[\s\)\]\}])")

(def ^:private api-db-based-ui-db-call-pattern
  #"\b(?:(?:db|db-model|db-conn)/(?:entity|pull|get-db|get-case-page|get-all-classes|get-all-properties)|db/entity)(?=[\s\)\]\}])")

(def ^:private remaining-plugin-api-ui-db-call-pattern
  #"\b(?:(?:db|db-model|db-conn)/(?:entity|get-db|query-block-by-uuid|get-block-immediate-children)|db/entity)(?=[\s\)\]\}])")

(def ^:private remaining-plugin-api-ui-db-files
  ["src/main/logseq/api/block.cljs"
   "src/main/logseq/api/db.cljs"
   "src/main/logseq/api/db_based.cljs"])

(def ^:private db-utils-renderer-read-call-pattern
  #"\bdb-utils/(?:entity|pull)(?=[\s\)\]\}])")

(def ^:private db-utils-renderer-read-files
  ["src/main/logseq/api/block.cljs"
   "src/main/frontend/modules/outliner/op.cljs"
   "src/main/frontend/handler/db_based/property/util.cljs"
   "src/main/frontend/components/property/config.cljs"])

(def ^:private remaining-model-helper-call-pattern
  #"\b(?:(?:model|db-model)/(?:get-file|get-all-readable-classes|get-block-by-page-name-and-block-route-name|today-journal-page\?|get-today-journal-page|untitled-page\?))(?=[\s\)\]\}])")

(def ^:private remaining-model-helper-files
  ["src/main/logseq/api/db.cljs"
   "src/main/frontend/components/property/config.cljs"
   "src/main/frontend/components/page.cljs"
   "src/main/frontend/components/block.cljs"
   "src/main/frontend/components/quick_add.cljs"])

(def ^:private sdk-renderer-db-read-call-pattern
  #"\bdb/entity(?=[\s\)\]\}])")

(def ^:private sdk-renderer-db-read-files
  ["src/main/logseq/sdk/utils.cljs"])

(def ^:private db-utils-group-by-page-call-pattern
  #"\bdb-utils/group-by-page(?=[\s\)\]\}])")

(def ^:private db-utils-group-by-page-files
  ["src/main/logseq/api/editor.cljs"
   "src/main/frontend/components/query/result.cljs"])

(def ^:private db-facade-id-order-call-pattern
  #"\bdb/(?:new-block-id|sort-by-order)(?=[\s\)\]\}])")

(def ^:private db-facade-id-order-files
  ["src/main/logseq/api/editor.cljs"
   "src/main/frontend/handler/editor.cljs"
   "src/main/frontend/components/property/value.cljs"])

(def ^:private remaining-db-facade-call-pattern
  #"\bdb/(?:transact!|get-alias-source-page|journal-page\?|sort-by-order)(?=[\s\)\]\}])")

(def ^:private remaining-db-facade-files
  ["src/main/logseq/api/db.cljs"
   "src/main/frontend/components/library.cljs"
   "src/main/frontend/components/block.cljs"
   "src/main/frontend/components/property/config.cljs"
   "src/main/frontend/components/page.cljs"])

(def ^:private repo-scheduled-db-facade-call-pattern
  #"\bdb/(?:today-journal-page\?|get-repo-name|get-short-repo-name|remove-conn!)(?=[\s\)\]\}])")

(def ^:private repo-scheduled-db-facade-files
  ["src/main/frontend/components/scheduled_deadlines.cljs"
   "src/main/frontend/components/repo.cljs"
   "src/main/frontend/handler/repo.cljs"])

(def ^:private container-latest-journals-call-pattern
  #"\bdb/get-latest-journals(?=[\s\)\]\}])")

(def ^:private container-latest-journals-files
  ["src/main/frontend/components/container.cljs"])

(def ^:private debug-ui-db-call-pattern
  #"\b(?:db/(?:get-db|get-page|pull-many)|db-utils/pull|d/datoms|\[frontend\.db :as db\]|\[frontend\.db\.utils :as db-utils\])")

(def ^:private debug-ui-db-files
  ["src/main/frontend/db/debug.cljs"
   "src/main/frontend/db/rtc/debug_ui.cljs"])

(def ^:private state-date-formatter-db-call-pattern
  #"\b(?:db-conn-state/get-conn|entity-plus/entity-memoized|frontend\.db\.conn-state|logseq\.db\.common\.entity-plus)")

(def ^:private state-date-formatter-files
  ["src/main/frontend/state.cljs"])

(def ^:private obsolete-sync-db-model-helper-pattern
  #"\b(?:get-file|get-custom-css|get-block-by-page-name-and-block-route-name|page-alias-set|get-pages-that-mentioned-page|get-latest-journals|get-all-classes|get-all-properties|get-all-readable-classes|get-structured-children|get-class-objects|get-page-blocks-count|get-page-blocks-no-cache|get-block-page|get-block-immediate-children|parents-collapsed\?|get-block-parents-v2|get-block-deep-last-open-child-id)\b")

(def ^:private obsolete-sync-db-model-files
  ["src/main/frontend/db/model.cljs"
   "src/main/frontend/db.cljs"])

(def ^:private mobile-ui-db-read-pattern
  #"\b(?:db/(?:entity|get-page|get-db)|db-model/query-block-by-uuid|ldb/get-built-in-page|ldb/get-graph-rtc-uuid)\b")

(def ^:private mobile-ui-db-read-files
  ["src/main/mobile/components/header.cljs"
   "src/main/mobile/components/recorder.cljs"
   "src/main/mobile/components/selection_toolbar.cljs"
   "src/main/mobile/search.cljs"])

(def ^:private electron-listener-ui-db-read-pattern
  #"\b(?:db/get-page|\[frontend\.db :as db\])")

(def ^:private electron-listener-ui-db-read-files
  ["src/main/electron/listener.cljs"])

(def ^:private query-react-renderer-db-read-pattern
  #"\b(?:conn/get-db|model/(?:get-block-by-uuid|get-today-journal-title|with-pages)|db-utils/seq-flatten|\[frontend\.db\.(?:conn|model|utils) :as)")

(def ^:private query-react-renderer-db-read-files
  ["src/main/frontend/db/query_react.cljs"])

(def ^:private selected-sync-db-model-helper-pattern
  #"\b(?:get-alias-source-page|get-block-by-uuid|query-block-by-uuid|with-pages|sub-block|has-children\?|get-block-parent|get-block-parents|page-exists\?|get-block-and-children|get-journal-page|get-journal-page-by-day|get-journal-page-title|get-today-journal-page|get-today-journal-title|journal-page\?|untitled-page\?)\b")

(def ^:private selected-sync-db-model-helper-files
  ["src/main/frontend/db/model.cljs"
   "src/main/frontend/db.cljs"])

(def ^:private query-dsl-renderer-db-read-pattern
  #"\b(?:db-conn/get-db|\[frontend\.db\.conn :as db-conn\])")

(def ^:private query-dsl-renderer-db-read-files
  ["src/main/frontend/db/query_dsl.cljs"])

(def ^:private db-facade-implicit-renderer-db-read-pattern
  #"\b(?:conn/get-db|\[frontend\.db\.conn :as conn\])")

(def ^:private db-facade-implicit-renderer-db-read-files
  ["src/main/frontend/db/utils.cljs"
   "src/main/frontend/db/model.cljs"])

(def ^:private export-common-handler-db-read-pattern
  #"\b(?:\*current-db\*|logseq\.db|ldb/(?:get-page|get-block-and-children)|common-file/(?:tree->file-content|block->content))\b")

(def ^:private export-common-handler-db-read-files
  ["src/main/frontend/handler/export/common_impl.cljs"])

(def ^:private repo-name-db-conn-usage-pattern
  #"\b(?:\[frontend\.db\.conn :as db-conn\]|db-conn/get-(?:repo-name|short-repo-name))\b")

(def ^:private repo-name-db-conn-usage-files
  ["src/main/frontend/util/url.cljs"
   "src/main/mobile/components/header.cljs"])

(def ^:private frontend-db-facade-ui-read-export-pattern
  #"\b(?:frontend\.db\.conn|frontend\.db\.utils|\bget-db\b|\bremove-conn!\b|\bentity\b|\bpull\b|\bpull-many\b|\bget-page\b|\bget-case-page\b)")

(def ^:private frontend-db-facade-ui-read-export-files
  ["src/main/frontend/db.cljs"])

(def ^:private first-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private first-test-db-facade-usage-files
  ["src/test/frontend/test/helper.cljs"
   "src/test/frontend/db/model_test.cljs"
   "src/test/frontend/db/property_values_test.cljs"
   "src/test/frontend/db/query_dsl_test.cljs"])

(def ^:private second-test-db-facade-usage-pattern
  #"\b(?:db/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)|frontend\.db/(?:entity|get-db|pull|get-page))(?=[\s\)\]\}])")

(def ^:private second-test-db-facade-usage-files
  ["src/test/frontend/components/repo_test.cljs"
   "src/test/frontend/components/views_test.cljs"
   "src/test/frontend/handler/block_test.cljs"
   "src/test/frontend/handler/common_test.cljs"
   "src/test/frontend/handler/common/developer_test.cljs"
   "src/test/frontend/handler/common/page_test.cljs"
   "src/test/frontend/handler/dnd_test.cljs"])

(def ^:private third-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private third-test-db-facade-usage-files
  ["src/test/frontend/handler/reaction_test.cljs"
   "src/test/frontend/handler/export_test.cljs"
   "src/test/frontend/handler/publish_test.cljs"])

(def ^:private fourth-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private fourth-test-db-facade-usage-files
  ["src/test/frontend/handler/db_based/recent_test.cljs"
   "src/test/frontend/handler/paste_test.cljs"])

(def ^:private fifth-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private fifth-test-db-facade-usage-files
  ["src/test/frontend/handler/db_based/page_test.cljs"
   "src/test/frontend/handler/db_based/editor_test.cljs"
   "src/test/frontend/handler/db_based/property_test.cljs"
   "src/test/frontend/handler/page_test.cljs"
   "src/test/frontend/handler/history_test.cljs"
   "src/test/frontend/handler/route_test.cljs"
   "src/test/frontend/handler/graph_test.cljs"
   "src/test/frontend/handler/editor_lifecycle_test.cljs"])

(def ^:private sixth-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private sixth-test-db-facade-usage-files
  ["src/test/frontend/handler/editor_test.cljs"])

(def ^:private seventh-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private seventh-test-db-facade-usage-files
  ["src/test/frontend/modules/outliner/core_test.cljs"])

(def ^:private eighth-test-db-facade-usage-pattern
  #"\bdb/(?:get-db|entity|pull|pull-many|get-page|get-case-page|page\?)(?=[\s\)\]\}])")

(def ^:private eighth-test-db-facade-usage-files
  ["src/test/frontend/handler/editor_async_test.cljs"
   "src/test/frontend/db/async_test.cljs"
   "src/test/frontend/components/imports_test.cljs"
   "src/test/electron/db_test.cljs"])

(def ^:private editor-handler-reverse-and-nested-read-pattern
  #":[A-Za-z0-9_.-]+/_[A-Za-z0-9_.!?*-]+|\(:[A-Za-z0-9_.-]+/[A-Za-z0-9_.!?*-]+\s+\(:[A-Za-z0-9_.-]+/[A-Za-z0-9_.!?*-]+\s+[^)]")

(def ^:private editor-handler-reverse-and-nested-read-files
  ["src/main/frontend/handler/editor.cljs"])

(def ^:private selected-ui-reverse-and-nested-read-files
  ["src/main/logseq/api/editor.cljs"
   "src/main/logseq/api/block.cljs"
   "src/main/frontend/handler/comments.cljs"
   "src/main/frontend/handler/page.cljs"
   "src/main/frontend/handler/db_based/page.cljs"
   "src/main/frontend/handler/db_based/property.cljs"
   "src/main/frontend/handler/paste.cljs"
   "src/main/frontend/handler/editor/lifecycle.cljs"
   "src/main/frontend/components/class.cljs"
   "src/main/frontend/components/page.cljs"])

(def ^:private selected-component-entity-shaped-read-files
  ["src/main/frontend/components/block/comments_model.cljs"
   "src/main/frontend/components/block/breadcrumb_model.cljs"
   "src/main/frontend/components/views.cljs"
   "src/main/frontend/components/recycle.cljs"
   "src/main/frontend/components/property/value.cljs"
   "src/main/frontend/components/objects.cljs"
   "src/main/frontend/components/property.cljs"
   "src/main/frontend/components/block.cljs"
   "src/main/frontend/components/query/view.cljs"])

(def ^:private final-frontend-entity-shaped-read-files
  ["src/main/frontend/components/editor.cljs"
   "src/main/frontend/extensions/fsrs.cljs"])

(def ^:private renderer-datascript-entity-check-files
  ["src/main/frontend/components/views.cljs"
   "src/main/frontend/components/block.cljs"
   "src/main/frontend/components/reference_filters.cljs"
   "src/main/frontend/modules/outliner/op.cljs"
   "src/main/frontend/handler/page.cljs"
   "src/main/frontend/handler/db_based/page.cljs"
   "src/main/frontend/handler/plugin.cljs"
   "src/main/frontend/extensions/pdf/core.cljs"
   "src/main/frontend/util.cljc"
   "src/main/logseq/sdk/utils.cljs"])

(def ^:private renderer-datascript-entity-check-pattern
  #"\[datascript(?:\.impl\.entity|\.core)|\b(?:de|e)/entity\?")

(defn- direct-ui-db-call-count-in-file
  [relative-file pattern]
  (if (source-file-exists? relative-file)
    (count (re-seq pattern (source-for relative-file)))
    0))

(deftest renderer-db-startup-owner-is-removed-test
  (testing "renderer DB connection startup is deleted"
    (when (source-file-exists? "src/main/frontend/db.cljs")
      (let [db-source (source-for "src/main/frontend/db.cljs")]
        (is (not (string/includes? db-source "start-db-conn!"))
            "frontend.db must not expose renderer DB startup.")))
    (is (not (source-file-exists? "src/main/frontend/db/conn.cljs"))
        "frontend.db.conn must not exist in production source.")))

(deftest renderer-db-conn-state-is-test-only-test
  (testing "production renderer code does not keep a conn-state DB owner"
    (let [repo-source (source-for "src/main/frontend/util/repo.cljs")]
      (is (not (string/includes? repo-source "frontend.db.conn-state"))
          "Repo name utilities must not depend on the renderer DB conn-state namespace.")
      (is (not (source-file-exists? "src/main/frontend/db/conn_state.cljs"))
          "frontend.db.conn-state must not exist in production source."))))

(deftest renderer-db-entity-helper-facades-are-test-only-test
  (testing "production source does not keep generic renderer DB entity facades"
    (is (not (source-file-exists? "src/main/frontend/db/utils.cljs"))
        "frontend.db.utils must not exist in production source.")
    (is (not (source-file-exists? "src/main/frontend/db/model.cljs"))
        "frontend.db.model must not exist in production source.")))

(deftest renderer-db-main-entry-is-test-only-test
  (testing "production source does not keep a renderer DB facade namespace"
    (is (not (source-file-exists? "src/main/frontend/db.cljs"))
        "frontend.db must exist only as a test fixture namespace.")))

(deftest renderer-query-dsl-has-no-datascript-execution-test
  (testing "renderer query DSL namespace only dispatches to worker APIs"
    (let [source (source-for "src/main/frontend/db/query_dsl.cljs")]
      (is (not (re-find #"\[datascript\.core|\bd/(?:entity|q|pull|datoms)|\*current-db\*" source))
          "frontend.db.query-dsl must not keep DataScript DB execution in renderer source."))))

(deftest renderer-has-no-unapproved-datascript-references-test
  (is (zero? (renderer-datascript-reference-count))
      "Renderer source must not keep DataScript references outside worker/CLI/export/API-tool owners."))

(deftest task-spent-time-uses-worker-explicit-history-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern task-spent-time-renderer-files
                                                            task-spent-time-renderer-nested-history-pattern))
      "Task spent-time rendering must use worker-computed explicit status history fields, not nested pull-map refs."))

(deftest selected-component-page-uses-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-component-page-entity-predicate-files
                                                            selected-component-page-entity-predicate-pattern))
      "The page component must use plain worker-payload predicates instead of ldb entity predicates."))

(deftest worker-response-owns-local-edit-block-callback-test
  (let [transact-source (source-for "src/main/frontend/db/transact.cljs")
        page-source (source-for "src/main/frontend/components/page.cljs")]
    (is (string/includes? transact-source ":editor/edit-block-fn")
        "Each worker response must run its local editor callback after publishing UI state.")
    (is (not (string/includes? page-source ":editor/edit-block-fn"))
        "A later render must not consume a callback owned by another response.")))

(deftest page-window-refresh-does-not-require-existing-window-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))
        refresh-index (string/index-of use-page-block-state-source ":page-window-refresh?")
        refresh-source (when refresh-index
                         (subs use-page-block-state-source
                               (max 0 (- refresh-index 120))
                               (min (count use-page-block-state-source)
                                    (+ refresh-index 500))))]
    (is (some? refresh-index)
        "Page rendering must observe structural page-window refresh markers.")
    (is (not (string/includes? refresh-source "(and page-window"))
        "Structural page-window refresh must not be dropped while the initial page window is still loading.")
    (is (string/includes? use-page-block-state-source "(hooks/use-effect!")
        "Page-window reconciliation should not block browser paint.")
    (is (and (string/includes? use-page-block-state-source "page-refresh?")
             (string/includes? use-page-block-state-source "common-page-window/refresh-opts"))
        "Structural refresh should preserve the current top or bottom window anchor.")))

(deftest page-window-load-ignores-stale-responses-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        row-refresh-source source
        loaded-refresh-source (subs source
                                    (string/index-of source "(defn- refresh-loaded-child-overrides!")
                                    (string/index-of source "(defn- refresh-loaded-children!"))
        window-refresh-source (subs source
                                    (string/index-of source "(defn- refresh-page-window-row-overrides!")
                                    (string/index-of source "(defn- page-window-loader"))
        page-window-loader-source (subs source
                                        (string/index-of source "(defn- page-window-loader")
                                        (string/index-of source "(defn- latest-page-tree-for"))
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))]
    (is (string/includes? use-page-block-state-source "*page-window-request-id")
        "Page window loading must track request order.")
    (is (string/includes? page-window-loader-source "swap! *request-id inc")
        "Each page window request should get a monotonically increasing id.")
    (is (string/includes? page-window-loader-source "(= request-id @*request-id)")
        "Only the latest page window response should update state.")
    (is (and (string/includes? row-refresh-source "request-id (swap! *request-id inc)")
             (string/includes? row-refresh-source "(= request-id @*request-id)"))
        "Only the latest row refresh response should update state.")
    (is (and (string/includes? loaded-refresh-source "refresh-row-overrides!")
             (string/includes? window-refresh-source "refresh-row-overrides!"))
        "Short and windowed pages should share one ordered row refresh path.")))

(deftest page-window-rows-update-from-latest-block-tx-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))]
    (is (string/includes? source "(defn- page-window-row-updated?")
        "Page window row matching should be explicit and tested by source guard.")
    (is (and (string/includes? source "db-async/<get-blocks")
             (string/includes? use-page-block-state-source "refresh-page-window-row-overrides!"))
        "Latest block tx refresh should fetch only affected window rows, not reload the whole page tree.")
    (is (string/includes? use-page-block-state-source "set-page-window-row-overrides!")
        "Latest block tx refresh should store updated row payloads separately from page window structure.")))

(deftest page-window-structural-refresh-does-not-run-row-overrides-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))
        refresh-index (string/index-of use-page-block-state-source "refresh-page-window-row-overrides!")
        refresh-source (when refresh-index
                         (subs use-page-block-state-source
                               (max 0 (- refresh-index 360))
                               (min (count use-page-block-state-source)
                                    (+ refresh-index 220))))]
    (is (some? refresh-index)
        "Page window rows should still support row-level refreshes for content-only txs.")
    (is (string/includes? refresh-source "when-not (:page-window-refresh? latest-transacted-entity-uuids)")
        "Structural page-window refreshes must not also issue row-level refresh requests.")))

(deftest page-window-flat-rows-keep-worker-order-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        page-blocks-source (subs source
                                 (string/index-of source "(hsx/defc page-blocks-cp")
                                 (string/index-of source "(hsx/defc today-queries"))]
    (is (re-find #"(?s)page-window\?\s+children" page-blocks-source)
        "Paginated page-window rows should be handled explicitly.")
    (is (not (re-find #"(?s)page-window\?\s+\(ldb/sort-by-order children\)" page-blocks-source))
        "Worker page-window rows are already flat DFS ordered and must not be sorted globally by :block/order.")))

(deftest page-route-loads-page-root-without-full-children-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        page-aux-source (subs source
                              (string/index-of source "(hsx/defc page-aux")
                              (string/index-of source "(hsx/defc page-cp"))]
    (is (string/includes? page-aux-source "db-async/<get-page-blocks-window")
        "Page route should load the initial top page-window together with page/root metadata.")
    (is (string/includes? page-aux-source ":initial-page-window initial-page-window")
        "Initial page-window rows should be passed into page rendering so the first rows are visible immediately.")
    (is (not (string/includes? page-aux-source ":children? true"))
        "Opening a page should not eagerly load the full block tree when page-window rendering owns rows.")
    (is (not (string/includes? page-aux-source ":include-collapsed-children? true"))
        "Opening a page should not eagerly load collapsed children before expansion.")))

(deftest page-block-state-uses-initial-page-window-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))]
    (is (string/includes? use-page-block-state-source "[block* initial-page-window]")
        "Page block state should accept the initial page-window from page route loading.")
    (is (string/includes? use-page-block-state-source "(hooks/use-state initial-page-window)")
        "The first render should use initial page-window rows instead of waiting for a second async request.")
    (is (string/includes? use-page-block-state-source "(or initial-page-window")
        "Resetting page block state should keep initial page-window rows for the current page.")))

(deftest loaded-children-rows-update-from-latest-block-tx-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        use-page-block-state-source (subs source
                                          (string/index-of source "(defn- use-page-block-state")
                                          (string/index-of source "(hsx/defc page-blocks-cp"))]
    (is (string/includes? source "(defn- refresh-loaded-child-overrides!")
        "Loaded children should refresh affected rows without reloading the page tree.")
    (is (string/includes? source "loaded-children-affected-row-ids")
        "Loaded children refresh should only fetch rows affected by the latest tx.")
    (is (string/includes? source "merge-updated-loaded-child")
        "Loaded children refresh should preserve child structure while merging updated row payloads.")
    (is (and (string/includes? use-page-block-state-source "refresh-loaded-children! block*")
             (string/includes? use-page-block-state-source "loaded-children"))
        "Latest block tx should update loaded children as well as page-window rows.")))

(deftest selected-component-block-uses-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-component-block-entity-predicate-files
                                                            selected-component-block-entity-predicate-pattern))
      "The block component must use plain worker-payload predicates instead of ldb entity predicates."))

(deftest selected-property-components-use-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-property-components-entity-predicate-files
                                                            selected-property-components-entity-predicate-pattern))
      "Property components must use plain worker-payload predicates instead of ldb/entity-util entity predicates."))

(deftest selected-handlers-use-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-handler-entity-predicate-files
                                                            selected-handler-entity-predicate-pattern))
      "Selected handlers must use plain worker-payload predicates instead of ldb entity predicates."))

(deftest remaining-components-use-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-component-entity-predicate-files
                                                            remaining-component-entity-predicate-pattern))
      "Remaining selected components must use plain worker-payload predicates instead of ldb/entity-util predicates."))

(deftest final-frontend-uses-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern final-frontend-entity-predicate-files
                                                            final-frontend-entity-predicate-pattern))
      "Final frontend leftovers must use plain worker-payload predicates instead of ldb/entity-util predicates."))

(deftest plugin-db-based-api-uses-plain-entity-predicates-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern plugin-db-based-entity-predicate-files
                                                            plugin-db-based-entity-predicate-pattern))
      "Plugin DB-based API paths must use plain worker-payload predicates instead of ldb/entity-util predicates."))

(deftest handlers-direct-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-under "src/main/frontend/handler"))
      "The fifth batch should remove the remaining direct renderer DB reads from handlers."))

(deftest pre-component-direct-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files pre-component-direct-ui-db-files))
      "The sixth batch should remove direct renderer DB reads from the pre-component UI modules."))

(deftest cmdk-direct-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-file "src/main/frontend/components/cmdk/core.cljs"
                                              cmdk-direct-ui-db-call-pattern))
      "The seventh batch should remove direct renderer DB reads from CMDK core."))

(deftest property-component-direct-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-file "src/main/frontend/components/property.cljs"
                                              cmdk-direct-ui-db-call-pattern))
      "The eighth batch should remove direct renderer DB reads from the property component."))

(deftest block-component-direct-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-in-file "src/main/frontend/components/block.cljs"
                                           cmdk-direct-ui-db-call-pattern)
          23)
      "The ninth batch should remove at least 20 direct renderer DB reads from the block component."))

(deftest property-value-component-direct-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-in-file "src/main/frontend/components/property/value.cljs"
                                           cmdk-direct-ui-db-call-pattern)
          19)
      "The tenth batch should remove at least 20 direct renderer DB reads from the property value component."))

(deftest views-component-direct-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-in-file "src/main/frontend/components/views.cljs"
                                           cmdk-direct-ui-db-call-pattern)
          14)
      "The eleventh batch should remove at least 20 direct renderer DB reads from the views component."))

(deftest components-direct-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-under-with-pattern "src/main/frontend/components"
                                                      cmdk-direct-ui-db-call-pattern)
          0)
      "The seventeenth batch should remove all remaining direct renderer DB reads from components."))

(deftest post-component-renderer-direct-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern post-component-renderer-direct-ui-db-files
                                                            cmdk-direct-ui-db-call-pattern))
      "The eighteenth batch should remove the remaining direct renderer DB reads outside components, handlers, and db/worker implementation namespaces."))

(deftest indirect-renderer-db-model-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern indirect-renderer-db-model-files
                                                            indirect-renderer-db-model-call-pattern))
      "The nineteenth batch should remove indirect renderer DB/model reads from the next handler/mobile/PDF file set."))

(deftest remaining-handler-db-model-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-handler-db-model-files
                                                            remaining-handler-db-model-call-pattern))
      "The twentieth batch should remove the remaining handler db-model reads in editor/property handlers."))

(deftest component-facade-helper-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern component-facade-helper-files
                                                            component-facade-helper-call-pattern))
      "The twenty-first batch should remove the selected component DB facade/helper reads."))

(deftest final-component-facade-helper-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern final-component-facade-helper-files
                                                            final-component-facade-helper-call-pattern))
      "The twenty-second batch should remove the final selected component/extension DB facade/helper reads."))

(deftest remaining-frontend-helper-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-frontend-helper-files
                                                            remaining-frontend-helper-call-pattern))
      "The twenty-third batch should remove the remaining selected frontend DB helper reads."))

(deftest api-editor-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-in-file "src/main/logseq/api/editor.cljs"
                                           api-editor-ui-db-call-pattern)
          4)
      "The twenty-fourth batch should remove at least 20 renderer DB reads from the plugin editor API."))

(deftest api-db-based-ui-db-call-count-batch-target-test
  (is (<= (direct-ui-db-call-count-in-file "src/main/logseq/api/db_based.cljs"
                                           api-db-based-ui-db-call-pattern)
          4)
      "The twenty-fifth batch should remove at least 20 renderer DB reads from the plugin db-based API."))

(deftest api-db-based-has-no-datascript-dependency-test
  (let [source (source-for "src/main/logseq/api/db_based.cljs")]
    (is (not (re-find #"\[datascript\.core|\bd/squuid\b" source))
        "logseq.api.db-based must not depend on DataScript in renderer API code.")))

(deftest sdk-utils-does-not-import-db-based-tools-test
  (let [source (source-for "src/main/logseq/sdk/utils.cljs")]
    (is (not (string/includes? source "logseq.api.db-based.tools"))
        "logseq.sdk.utils must not import DB-based tools that own DataScript db-value work.")))

(deftest api-db-based-cli-does-not-import-db-based-tools-test
  (let [source (source-for "src/main/logseq/api/db_based/cli.cljs")]
    (is (not (string/includes? source "logseq.api.db-based.tools"))
        "logseq.api.db-based.cli must not import DB-based tools into the renderer API bundle.")))

(deftest remaining-plugin-api-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-plugin-api-ui-db-files
                                                            remaining-plugin-api-ui-db-call-pattern))
      "The twenty-sixth batch should remove the remaining selected renderer DB reads from plugin API namespaces."))

(deftest db-utils-renderer-read-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern db-utils-renderer-read-files
                                                            db-utils-renderer-read-call-pattern))
      "The twenty-seventh batch should remove remaining selected renderer DB reads through frontend.db.utils wrappers."))

(deftest remaining-model-helper-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-model-helper-files
                                                            remaining-model-helper-call-pattern))
      "The twenty-eighth batch should remove remaining selected renderer DB reads through frontend.db.model helpers."))

(deftest sdk-renderer-db-read-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern sdk-renderer-db-read-files
                                                            sdk-renderer-db-read-call-pattern))
      "The twenty-ninth batch should remove the remaining selected SDK utility renderer DB read."))

(deftest db-utils-group-by-page-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern db-utils-group-by-page-files
                                                            db-utils-group-by-page-call-pattern))
      "The thirty-first batch should remove UI/API dependencies on frontend.db.utils group-by-page."))

(deftest db-facade-id-order-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern db-facade-id-order-files
                                                            db-facade-id-order-call-pattern))
      "The thirty-second batch should remove frontend.db facade calls that only alias logseq.db helpers."))

(deftest remaining-db-facade-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern remaining-db-facade-files
                                                            remaining-db-facade-call-pattern))
      "The thirty-fourth batch should remove remaining renderer-facing frontend.db facade calls."))

(deftest repo-scheduled-db-facade-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern repo-scheduled-db-facade-files
                                                            repo-scheduled-db-facade-call-pattern))
      "The thirty-fifth batch should remove repo and scheduled/deadline frontend.db facade calls."))

(deftest container-latest-journals-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern container-latest-journals-files
                                                            container-latest-journals-call-pattern))
      "The thirty-sixth batch should move container latest-journal lookup to the worker."))

(deftest debug-ui-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern debug-ui-db-files
                                                            debug-ui-db-call-pattern))
      "The thirty-seventh batch should remove renderer DB reads from debug helper namespaces."))

(deftest state-date-formatter-db-call-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern state-date-formatter-files
                                                            state-date-formatter-db-call-pattern))
      "The thirty-eighth batch should remove state date formatter reads from renderer DB conn state."))

(deftest obsolete-sync-db-model-helper-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern obsolete-sync-db-model-files
                                                            obsolete-sync-db-model-helper-pattern))
      "The thirty-ninth batch should remove obsolete synchronous db.model helpers that only preserve renderer DB reads."))

(deftest mobile-ui-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern mobile-ui-db-read-files
                                                            mobile-ui-db-read-pattern))
      "The fortieth batch should remove direct renderer DB reads from mobile UI namespaces."))

(deftest electron-listener-ui-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern electron-listener-ui-db-read-files
                                                            electron-listener-ui-db-read-pattern))
      "The forty-first batch should remove direct renderer DB reads from the Electron listener."))

(deftest query-react-renderer-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern query-react-renderer-db-read-files
                                                            query-react-renderer-db-read-pattern))
      "The forty-second batch should remove renderer DB reads from custom query react execution."))

(deftest selected-sync-db-model-helper-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-sync-db-model-helper-files
                                                            selected-sync-db-model-helper-pattern))
      "The forty-third batch should remove the selected obsolete synchronous db.model helpers."))

(deftest query-dsl-renderer-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern query-dsl-renderer-db-read-files
                                                            query-dsl-renderer-db-read-pattern))
      "The forty-fourth batch should move query DSL DB reads to the worker."))

(deftest db-facade-implicit-renderer-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern db-facade-implicit-renderer-db-read-files
                                                            db-facade-implicit-renderer-db-read-pattern))
      "The forty-fifth batch should remove implicit renderer DB reads from db facade helpers."))

(deftest export-common-handler-db-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern export-common-handler-db-read-files
                                                            export-common-handler-db-read-pattern))
      "The forty-sixth batch should move export DB resolution out of the handler common implementation."))

(deftest repo-name-db-conn-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern repo-name-db-conn-usage-files
                                                            repo-name-db-conn-usage-pattern))
      "The forty-seventh batch should remove pure repo-name callers from the DB connection namespace."))

(deftest frontend-db-facade-ui-read-export-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern frontend-db-facade-ui-read-export-files
                                                            frontend-db-facade-ui-read-export-pattern))
      "The forty-eighth batch should stop frontend.db from exposing UI DB connection/read helpers."))

(deftest first-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern first-test-db-facade-usage-files
                                                            first-test-db-facade-usage-pattern))
      "The forty-ninth batch should move the first test group off deleted frontend.db read facade helpers."))

(deftest second-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern second-test-db-facade-usage-files
                                                            second-test-db-facade-usage-pattern))
      "The fiftieth batch should move the second test group off deleted frontend.db read facade helpers."))

(deftest third-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern third-test-db-facade-usage-files
                                                            third-test-db-facade-usage-pattern))
      "The fifty-first batch should move the third test group off deleted frontend.db read facade helpers."))

(deftest fourth-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern fourth-test-db-facade-usage-files
                                                            fourth-test-db-facade-usage-pattern))
      "The fifty-second batch should move the fourth test group off deleted frontend.db read facade helpers."))

(deftest fifth-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern fifth-test-db-facade-usage-files
                                                            fifth-test-db-facade-usage-pattern))
      "The fifty-third batch should move the fifth test group off deleted frontend.db read facade helpers."))

(deftest sixth-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern sixth-test-db-facade-usage-files
                                                            sixth-test-db-facade-usage-pattern))
      "The fifty-fourth batch should move editor handler tests off deleted frontend.db read facade helpers."))

(deftest seventh-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern seventh-test-db-facade-usage-files
                                                            seventh-test-db-facade-usage-pattern))
      "The fifty-fifth batch should move outliner core tests off deleted frontend.db read facade helpers."))

(deftest eighth-test-db-facade-usage-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern eighth-test-db-facade-usage-files
                                                            eighth-test-db-facade-usage-pattern))
      "The fifty-sixth batch should move the remaining tests off deleted frontend.db read facade helpers."))

(deftest editor-handler-reverse-and-nested-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern editor-handler-reverse-and-nested-read-files
                                                            editor-handler-reverse-and-nested-read-pattern))
      "The fifty-seventh batch should remove reverse attr and nested pull-map reads from the editor handler UI path."))

(deftest graph-view-db-reads-are-worker-owned-test
  (let [common-graph-view-path (node-path/join (.cwd js/process) "src/main/frontend/common/graph_view.cljs")
        graph-handler-source (source-for "src/main/frontend/worker/handler/graph.cljs")]
    (is (not (fs/existsSync common-graph-view-path))
        "Graph-view DataScript reads should not live in frontend.common.")
    (is (string/includes? graph-handler-source "[frontend.worker.graph-view :as graph-view]")
        "The db worker should own graph-view DB computation through a worker namespace.")))

(deftest selected-ui-reverse-and-nested-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-ui-reverse-and-nested-read-files
                                                            editor-handler-reverse-and-nested-read-pattern))
      "The fifty-ninth batch should remove selected reverse attr and nested entity reads from UI/API paths."))

(deftest selected-component-entity-shaped-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern selected-component-entity-shaped-read-files
                                                            editor-handler-reverse-and-nested-read-pattern))
      "The sixtieth batch should remove selected reverse attr and nested entity reads from component render paths."))

(deftest final-frontend-entity-shaped-read-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern final-frontend-entity-shaped-read-files
                                                            editor-handler-reverse-and-nested-read-pattern))
      "The final frontend UI pass should remove remaining reverse attr and nested entity reads from render paths."))

(deftest renderer-datascript-entity-check-count-batch-target-test
  (is (zero? (direct-ui-db-call-count-in-files-with-pattern renderer-datascript-entity-check-files
                                                            renderer-datascript-entity-check-pattern))
      "Renderer UI paths should not import Datascript entity types or branch on Datascript entity instances."))

(deftest db-sync-handler-rtc-metadata-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/sync.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "db-sync handler must not require the renderer DB facade.")
    (is (not (string/includes? source "[logseq.db :as ldb]"))
        "db-sync handler must not read RTC metadata from renderer DB entities.")
    (is (not (string/includes? source "db/get-db"))
        "db-sync handler must not read graph metadata through db/get-db.")
    (is (string/includes? source ":thread-api/get-rtc-graph-e2ee?")
        "db-sync invite access checks should read graph E2EE metadata from the worker.")))

(deftest repo-component-rtc-metadata-uses-worker-test
  (let [source (source-for "src/main/frontend/components/repo.cljs")]
    (is (not (string/includes? source "[logseq.db :as ldb]"))
        "repo component must not require logseq.db for renderer RTC metadata reads.")
    (is (not (string/includes? source "ldb/get-graph-rtc-e2ee?"))
        "repo upload flow must not read graph E2EE metadata from renderer DB entities.")
    (is (not (string/includes? source "db/get-db"))
        "repo upload flow must not read graph metadata through db/get-db.")
    (is (string/includes? source ":thread-api/get-rtc-graph-e2ee?")
        "repo upload flow should read graph E2EE metadata from the worker.")))

(deftest rtc-background-tasks-metadata-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/rtc_background_tasks.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "RTC background tasks must not require the renderer DB facade.")
    (is (not (string/includes? source "[logseq.db :as ldb]"))
        "RTC background tasks must not read RTC metadata from renderer DB entities.")
    (is (not (string/includes? source "db/get-db"))
        "RTC background tasks must not read graph metadata through db/get-db.")
    (is (string/includes? source ":thread-api/get-rtc-graph-uuid")
        "RTC restart checks should read graph RTC UUID metadata from the worker.")))

(deftest graph-registry-upsert-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/graph.cljs")
        upsert-source (subs source
                            (string/index-of source "(defn- <ensure-local-graph-uuid!")
                            (string/index-of source "(defn settle-metadata-to-local!"))]
    (is (not (string/includes? upsert-source "db/get-db"))
        "graph registry upsert must not read graph ids through the renderer DB.")
    (is (not (string/includes? upsert-source "db/transact!"))
        "graph registry upsert must not create local graph UUIDs through renderer DB transact.")
    (is (string/includes? upsert-source ":thread-api/ensure-local-graph-uuid")
        "graph registry upsert should ensure the local graph UUID in the worker.")
    (is (string/includes? upsert-source ":thread-api/get-graph-uuid")
        "graph registry upsert should resolve the graph UUID in the worker.")))

(deftest graph-tab-memory-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/graph.cljs")
        remember-source (subs source
                              (string/index-of source "(defn remember-current-graph-id-in-tab!")
                              (string/index-of source "(defn <upsert-current-graph-registry!"))]
    (is (not (string/includes? remember-source "(current-graph-id)"))
        "tab graph memory must not read graph ids through the renderer DB helper.")
    (is (string/includes? remember-source ":thread-api/get-graph-uuid")
        "tab graph memory should resolve the current graph UUID in the worker.")))

(deftest graph-current-graph-id-uses-tab-memory-test
  (let [source (source-for "src/main/frontend/handler/graph.cljs")
        current-source (subs source
                             (string/index-of source "(defn current-graph-id")
                             (string/index-of source "(defn- <ensure-local-graph-uuid!"))]
    (is (not (string/includes? current-source "db/get-db"))
        "current graph id must not read graph ids through the renderer DB.")
    (is (string/includes? current-source "get-tab-graph")
        "current graph id should use the existing worker-populated tab graph memory.")))

(deftest capture-error-schema-version-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/events.cljs")]
    (is (not (string/includes? source "(when-let [db (db/get-db)]\n                                       (str (:kv/value (db/entity db :logseq.kv/schema-version))))"))
        "capture-error must not read graph schema version from the renderer DB.")
    (is (string/includes? source ":thread-api/get-graph-schema-version")
        "capture-error should read graph schema version from the worker.")))

(deftest publish-graph-uuid-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/publish.cljs")]
    (is (not (string/includes? source "ldb/get-graph-rtc-uuid (db/get-db)"))
        "publish posting must not resolve the graph UUID through the renderer DB.")
    (is (not (string/includes? source "ldb/get-graph-rtc-uuid db"))
        "publish and unpublish must not resolve the graph RTC UUID through the renderer DB.")
    (is (not (string/includes? source "ldb/get-graph-local-uuid db"))
        "publish and unpublish must not resolve the graph local UUID through the renderer DB.")
    (is (string/includes? source ":thread-api/get-graph-uuid")
        "publish graph UUID resolution should use the worker.")))

(deftest export-backup-folder-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/export.cljs")]
    (is (not (string/includes? source "ldb/get-key-value (db/get-db repo) :logseq.kv/graph-backup-folder"))
        "export backup paths must not read graph backup folder through the renderer DB.")
    (is (string/includes? source ":thread-api/get-key-value")
        "export backup paths should read graph backup folder through the worker.")))

(deftest export-backup-folder-write-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/export.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "export handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/transact! [(ldb/kv :logseq.kv/graph-backup-folder folder-name)]"))
        "backup-folder selection must not persist through renderer DB transact.")
    (is (string/includes? source ":thread-api/transact")
        "backup-folder selection should persist through worker transact.")))

(deftest export-component-backup-folder-uses-worker-test
  (let [source (source-for "src/main/frontend/components/export.cljs")]
    (is (not (string/includes? source "ldb/get-key-value (db/get-db) :logseq.kv/graph-backup-folder"))
        "export auto-backup UI must not read the graph backup folder through the renderer DB.")
    (is (not (string/includes? source "[logseq.db :as ldb]"))
        "export auto-backup UI must not require logseq.db for the renderer backup-folder read.")
    (is (string/includes? source ":thread-api/get-key-value")
        "export auto-backup UI should read the graph backup folder through the worker.")))

(deftest export-component-backup-folder-cancel-uses-worker-test
  (let [source (source-for "src/main/frontend/components/export.cljs")]
    (is (not (string/includes? source "db/transact! [[:db/retractEntity :logseq.kv/graph-backup-folder]]"))
        "export auto-backup cancel must not retract the backup folder through the renderer DB.")
    (is (string/includes? source ":thread-api/transact")
        "export auto-backup cancel should retract the backup folder through the worker.")))

(deftest export-component-selected-blocks-use-worker-test
  (let [source (source-for "src/main/frontend/components/export.cljs")]
    (is (not (string/includes? source "block-handler/get-top-level-blocks (map #(db/entity [:block/uuid %]) selection-ids)"))
        "selected-block export must not resolve selected blocks through renderer DB entities.")
    (is (string/includes? source "db-async/<get-blocks")
        "selected-block export should load selected blocks through the worker block loader.")))

(deftest export-component-png-page-check-uses-worker-test
  (let [source (source-for "src/main/frontend/components/export.cljs")]
    (is (not (string/includes? source "db/page? (db/entity [:block/uuid top-block-id])"))
        "PNG export must not classify pages by reading renderer DB entities.")
    (is (string/includes? source ":thread-api/pull")
        "PNG export should classify page UUIDs through a worker pull.")))

(deftest export-component-save-to-file-uses-no-renderer-db-test
  (let [source (source-for "src/main/frontend/components/export.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "export component must not require the renderer DB facade.")
    (is (not (string/includes? source "db/get-page"))
        "export save-to-file must not resolve page titles through the renderer DB.")))

(deftest graph-actions-preview-uses-worker-test
  (let [source (source-for "src/main/frontend/components/graph_actions.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "graph preview actions must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "graph preview actions must not resolve db-id nodes through renderer DB entities.")
    (is (string/includes? source ":thread-api/pull")
        "graph preview actions should resolve db-id nodes through the worker.")))

(deftest history-restore-cursor-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/history.cljs")]
    (is (not (string/includes? source "db/pull [:block/uuid block-uuid]"))
        "history cursor restore must not pull the block from the renderer DB.")
    (is (string/includes? source ":thread-api/pull")
        "history cursor restore should pull the block through the worker.")))

(deftest editor-lifecycle-page-lookup-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/editor/lifecycle.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "editor lifecycle must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity edit-block-db-id"))
        "editor lifecycle must not resolve the edit block page through renderer DB entities.")
    (is (string/includes? source "db-async/<get-block-page-info")
        "editor lifecycle should resolve the edit block page through the worker-backed page-info loader.")))

(deftest developer-show-entity-data-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/developer.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "developer entity debug commands must not require the renderer DB facade.")
    (is (not (string/includes? source "db/pull"))
        "developer entity debug commands must not pull entity data from the renderer DB.")
    (is (not (string/includes? source "db/entity"))
        "developer entity debug commands must not read debug entities from the renderer DB.")
    (is (string/includes? source ":thread-api/pull")
        "developer entity debug commands should pull entity data through the worker.")))

(deftest ui-scroll-anchor-parents-use-worker-test
  (let [source (source-for "src/main/frontend/handler/ui.cljs")]
    (is (not (string/includes? source "db/entity [:block/uuid anchor-id]"))
        "scroll-to-anchor-block must not resolve anchor blocks through renderer DB entities.")
    (is (not (string/includes? source "db/get-block-parents"))
        "scroll-to-anchor-block must not resolve anchor parents through renderer DB queries.")
    (is (string/includes? source ":thread-api/pull")
        "scroll-to-anchor-block should resolve missing anchor blocks through worker pull.")
    (is (string/includes? source "<get-block-parents")
        "scroll-to-anchor-block should resolve anchor parents through the worker parent API.")))

(deftest search-page-filter-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/search.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "search handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/get-page page-db-id"))
        "search page filtering must not resolve page names through renderer DB.")
    (is (string/includes? source ":thread-api/pull")
        "search page filtering should resolve page ids through worker pull.")))

(deftest dnd-move-blocks-uses-passed-blocks-test
  (let [source (source-for "src/main/frontend/handler/dnd.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "drag/drop handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "drag/drop move must not rehydrate passed blocks through renderer DB entities.")))

(deftest code-handler-save-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/code.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "code editor handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "code editor save paths must not resolve files or blocks through renderer DB entities.")
    (is (string/includes? source ":thread-api/pull")
        "code editor save paths should resolve graph entities through worker pulls.")))

(deftest common-handler-copy-uses-passed-blocks-test
  (let [source (source-for "src/main/frontend/handler/common.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "common handler clipboard helper must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "common handler clipboard helper must not rehydrate passed blocks through renderer DB entities.")))

(deftest common-page-favorite-mutations-use-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        apply-source (subs source
                           (string/index-of source "(defn- <apply-favorite-ops!")
                           (string/index-of source "(defn <db-favorite-page!"))
        mutation-source (subs source
                              (string/index-of source "(defn <db-favorite-page!")
                              (string/index-of source ";; favorites fns end"))]
    (is (not (string/includes? mutation-source "find-block-in-favorites-page"))
        "favorite mutation helpers must not resolve favorite blocks through renderer DB helper.")
    (is (not (string/includes? mutation-source "db/get-page"))
        "favorite mutation helpers must not resolve favorites page through renderer DB.")
    (is (not (string/includes? mutation-source "d/entity"))
        "favorite mutation helpers must not check target pages through renderer DB.")
    (is (string/includes? mutation-source ":thread-api/build-favorite-page-ops")
        "favorite mutation helper should ask worker to build favorite insert ops.")
    (is (string/includes? mutation-source ":thread-api/build-unfavorite-page-ops")
        "unfavorite mutation helper should ask worker to build favorite delete ops.")
    (is (string/includes? apply-source ":thread-api/apply-outliner-ops")
        "favorite mutation helpers should apply worker-built outliner ops in the worker.")))

(deftest common-page-edit-when-present-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        edit-source (subs source
                          (string/index-of source "(defn- <page-for-edit")
                          (string/index-of source "(defn <create!"))]
    (is (not (string/includes? edit-source "db/get-page"))
        "edit-page-when-present! must not poll for pages through the renderer DB.")
    (is (string/includes? edit-source ":thread-api/pull")
        "edit-page-when-present! should poll page existence through a worker pull.")))

(deftest common-page-create-existing-page-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        create-source (subs source
                            (string/index-of source "(def ^:private page-for-create-selector")
                            (string/index-of source ";; favorite fns"))]
    (is (not (string/includes? create-source "db/get-page"))
        "create! must not resolve existing or created pages through renderer DB.")
    (is (string/includes? create-source ":thread-api/pull")
        "create! should resolve existing pages through a worker pull.")))

(deftest common-page-after-delete-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        after-delete-source (subs source
                                  (string/index-of source "(defn after-page-deleted!")
                                  (string/index-of source "(defn after-page-renamed!"))]
    (is (not (string/includes? after-delete-source "db/get-page"))
        "after-page-deleted! must not resolve the deleted page through renderer DB.")
    (is (string/includes? after-delete-source ":thread-api/pull")
        "after-page-deleted! should resolve the deleted page through a worker pull.")
    (is (string/includes? after-delete-source "<db-unfavorite-page!")
        "after-page-deleted! should still reuse the worker-backed unfavorite helper.")))

(deftest common-page-delete-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        delete-source (subs source
                            (string/index-of source "(defn <delete!")
                            (string/index-of source ";; other fns"))]
    (is (not (string/includes? delete-source "db/get-page"))
        "page delete must not resolve the page through renderer DB.")
    (is (not (string/includes? delete-source "db/entity"))
        "page delete must not read the page entity through renderer DB.")
    (is (not (string/includes? delete-source "ui-outliner-tx/transact!"))
        "page delete must not apply delete-page through the renderer outliner transaction wrapper.")
    (is (string/includes? delete-source ":thread-api/pull")
        "page delete should resolve the page through worker pull.")
    (is (string/includes? delete-source ":thread-api/apply-outliner-ops")
        "page delete should apply delete-page through the worker.")))

(deftest common-page-after-rename-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/common/page.cljs")
        after-rename-source (subs source
                                  (string/index-of source "(defn after-page-renamed!"))]
    (is (not (string/includes? after-rename-source "db/entity"))
        "after-page-renamed! must not resolve the renamed page through renderer DB.")
    (is (string/includes? after-rename-source ":thread-api/pull")
        "after-page-renamed! should resolve the renamed page through a worker pull.")))

(deftest block-handler-edit-block-loads-through-worker-test
  (let [source (source-for "src/main/frontend/handler/block.cljs")
        edit-source (subs source
                          (string/index-of source "(defn edit-block!")
                          (string/index-of source "(defn- get-original-block-by-dom"))]
    (is (not (string/includes? edit-source "db/entity [:block/uuid block-id]"))
        "edit-block! must not rehydrate the target block through renderer DB entities.")
    (is (string/includes? edit-source "db-async/<get-block")
        "edit-block! should load the target block through the worker-backed block loader.")))

(deftest block-handler-edit-block-editor-config-avoids-renderer-db-test
  (let [source (source-for "src/main/frontend/handler/block.cljs")
        edit-aux-source (subs source
                              (string/index-of source "(defn- edit-block-aux")
                              (string/index-of source "(defn block-unique-title"))]
    (is (not (string/includes? edit-aux-source "db/get-db"))
        "edit-block editor config must not store the renderer DB.")))

(deftest block-handler-top-level-original-uses-original-block-test
  (let [source (source-for "src/main/frontend/handler/block.cljs")
        top-level-source (subs source
                               (string/index-of source "(defn get-top-level-blocks")
                               (string/index-of source "(defn get-current-editing-original-block"))]
    (is (not (string/includes? top-level-source "(and original (db/entity (:db/id original)))"))
        "get-top-level-blocks must not rehydrate original blocks through renderer DB entities.")
    (is (string/includes? top-level-source "(or original b)")
        "get-top-level-blocks should use the original block already returned by original-block lookup.")))

(deftest code-extension-save-editor-uses-worker-test
  (let [source (source-for "src/main/frontend/extensions/code.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "code extension must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "code extension save completion must not rehydrate edited blocks through renderer DB entities.")
    (is (string/includes? source "db-async/<get-block")
        "code extension save completion should reload edited blocks through the worker-backed block loader.")))

(deftest objects-post-insert-edit-uses-returned-block-test
  (let [source (source-for "src/main/frontend/components/objects.cljs")]
    (is (not (string/includes? source "(editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)])"))
        "object creation should edit the block returned by the worker-backed insert, not rehydrate it through the renderer DB.")))

(deftest objects-default-value-uses-worker-test
  (let [source (source-for "src/main/frontend/components/objects.cljs")]
    (is (not (string/includes? source "(:db/id (db/entity :logseq.property/empty-placeholder))"))
        "property object creation must not read the empty-placeholder default value through renderer DB entities.")
    (is (string/includes? source ":thread-api/pull")
        "property object creation should resolve the empty-placeholder id through the worker.")))

(deftest query-result-ui-uses-worker-rows-test
  (let [view-source (source-for "src/main/frontend/components/query/view.cljs")
        result-source (source-for "src/main/frontend/components/query/result.cljs")]
    (is (not (string/includes? view-source "[frontend.db :as db]"))
        "query table view must not require the renderer DB facade only to rehydrate query rows.")
    (is (not (string/includes? view-source "db/entity"))
        "query table view must use worker-backed query rows directly.")
    (is (not (string/includes? result-source "db/entity [:block/uuid (:block/uuid b)]"))
        "full-text query results must not rehydrate search rows through renderer DB entities.")))

(deftest edn-import-target-block-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/import.cljs")]
    (is (not (string/includes? source "db/entity [:block/uuid eid]"))
        "EDN block import must not resolve the current target block through renderer DB entities.")
    (is (string/includes? source ":thread-api/pull")
        "EDN block import should resolve the current target block through the worker.")))

(deftest db-import-markers-use-worker-transact-test
  (let [source (source-for "src/main/frontend/handler/db_based/import.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "DB import handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/transact! graph (sqlite-util/import-tx :sqlite-db)"))
        "sqlite DB import marker must not transact through the renderer DB.")
    (is (not (string/includes? source "db/transact! graph (sqlite-util/import-tx :debug-transit)"))
        "debug transit import marker must not transact through the renderer DB.")
    (is (string/includes? source ":thread-api/transact")
        "DB import markers should transact through the worker.")))

(deftest db-property-closed-value-lookup-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/property.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "DB property handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/get-db"))
        "closed-value batch set must not read closed values through the renderer DB.")
    (is (string/includes? source "db-async/<get-property-closed-values")
        "closed-value batch set should load closed values through the worker-backed property loader.")))

(deftest db-editor-save-file-uses-worker-transact-test
  (let [source (source-for "src/main/frontend/handler/db_based/editor.cljs")]
    (is (not (string/includes? source "db/transact! [{:file/path path"))
        "DB editor file saves must not transact through the renderer DB.")
    (is (string/includes? source ":thread-api/transact")
        "DB editor file saves should transact through the worker.")))

(deftest db-editor-batch-heading-uses-worker-blocks-test
  (let [source (source-for "src/main/frontend/handler/db_based/editor.cljs")]
    (is (not (string/includes? source "let [e (db/entity [:block/uuid id])"))
        "batch heading changes must not rehydrate blocks through renderer DB entities.")
    (is (string/includes? source "db-async/<get-blocks")
        "batch heading changes should load blocks through the worker-backed block loader.")))

(deftest db-editor-wrap-parse-block-uses-passed-current-block-test
  (let [source (source-for "src/main/frontend/handler/db_based/editor.cljs")
        wrap-source (subs source
                          (string/index-of source "(defn wrap-parse-block")
                          (string/index-of source "(defn save-file!"))]
    (is (not (string/includes? wrap-source "(and (:db/id block) (db/entity (:db/id block)))"))
        "wrap-parse-block must not rehydrate the current block through renderer DB entities.")
    (is (not (string/includes? wrap-source "(and (:block/uuid block) (db/entity [:block/uuid (:block/uuid block)]))"))
        "wrap-parse-block must not resolve the current block UUID through renderer DB entities.")))

(deftest db-editor-wrap-parse-block-uses-cached-refs-test
  (let [source (source-for "src/main/frontend/handler/db_based/editor.cljs")
        wrap-deps-source (subs source
                               (string/index-of source "(defn- remove-empty-refs")
                               (string/index-of source "(defn save-file!"))]
    (is (not (string/includes? wrap-deps-source "db/entity"))
        "wrap-parse-block ref handling must not validate refs through renderer DB entities.")
    (is (not (string/includes? wrap-deps-source "db/get-page"))
        "wrap-parse-block markdown hashtag refs must not resolve pages through renderer DB.")
    (is (string/includes? wrap-deps-source ":editor/block-refs")
        "wrap-parse-block should reuse refs already captured by editor autocomplete state.")))

(deftest editor-own-order-list-uses-passed-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        own-order-source (subs source
                               (string/index-of source "(defn own-order-number-list?")
                               (string/index-of source "(defn make-block-as-own-order-list!"))]
    (is (not (string/includes? own-order-source "db/entity"))
        "own-order-number-list? must not rehydrate the passed block through renderer DB entities.")
    (is (string/includes? own-order-source "get-block-own-order-list-type")
        "own-order-number-list? should read the order-list property from the passed block.")))

(deftest editor-get-state-uses-editor-args-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        get-state-source (subs source
                               (string/index-of source "(defn get-state")
                               (string/index-of source "(defn- get-node-container-id"))]
    (is (not (string/includes? get-state-source "(or (db/entity [:block/uuid (:block/uuid block)]) block)"))
        "editor get-state must not rehydrate the editor args block through renderer DB entities.")
    (is (string/includes? get-state-source ":block block")
        "editor get-state should return the block already stored in editor args.")))

(deftest editor-save-block-if-changed-uses-passed-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        save-source (subs source
                          (string/index-of source "(defn save-block-if-changed!")
                          (string/index-of source "(defn wrapped-by?"))]
    (is (not (string/includes? save-source "(:block/title (db/entity (:db/id block)))"))
        "save-block-if-changed! must not rehydrate the passed block through renderer DB entities.")
    (is (string/includes? save-source "(:block/title block)")
        "save-block-if-changed! should compare against the passed block content.")))

(deftest editor-open-block-in-sidebar-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        open-source (subs source
                          (string/index-of source "(defn open-block-in-sidebar!")
                          (string/index-of source "(defn reset-cursor-range!"))]
    (is (not (string/includes? open-source "db/entity"))
        "open-block-in-sidebar! must not resolve the target through renderer DB entities.")
    (is (string/includes? open-source ":thread-api/pull")
        "open-block-in-sidebar! should resolve the target through a worker pull.")))

(deftest editor-open-link-in-sidebar-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        open-source (subs source
                          (string/index-of source "(defn open-link-in-sidebar!")
                          (string/index-of source ";; FIXME: shortcut `mod+.`"))]
    (is (not (string/includes? open-source "db/get-page"))
        "open-link-in-sidebar! must not resolve page or block links through renderer DB.")
    (is (string/includes? open-source ":thread-api/pull")
        "open-link-in-sidebar! should resolve page or block links through a worker pull.")))

(deftest editor-zoom-in-uses-current-edit-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        zoom-source (subs source
                          (string/index-of source "(defn zoom-in!")
                          (string/index-of source "(defn zoom-out!"))]
    (is (not (string/includes? zoom-source "db/entity"))
        "zoom-in! must not resolve the current edit block through renderer DB entities.")
    (is (string/includes? zoom-source "state/get-edit-block")
        "zoom-in! should use the current edit block already held in state.")))

(deftest editor-zoom-out-loads-parent-through-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        zoom-source (subs source
                          (string/index-of source "(defn zoom-out!")
                          (string/index-of source "(defn cut-block!"))]
    (is (not (string/includes? zoom-source "db/get-block-parent"))
        "zoom-out! must not resolve parent blocks through renderer DB.")
    (is (not (string/includes? zoom-source "db/entity"))
        "zoom-out! must not resolve block or page entities through renderer DB.")
    (is (string/includes? zoom-source "db-async/<get-block")
        "zoom-out! should load the current block through the worker block loader.")
    (is (string/includes? zoom-source "db-async/<get-block-parents")
        "zoom-out! should load the parent through the worker parent API.")))

(deftest editor-post-insert-edit-uses-returned-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        helper-source (subs source
                            (string/index-of source "(defn- edit-last-block-after-inserted!")
                            (string/index-of source "(defn- nested-blocks"))]
    (is (not (string/includes? helper-source "db/entity"))
        "edit-last-block-after-inserted! must not rehydrate inserted blocks through renderer DB entities.")
    (is (string/includes? helper-source "(edit-block! last-block :max)")
        "edit-last-block-after-inserted! should edit the block returned by the worker-backed insert.")))

(deftest editor-follow-page-link-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        follow-source (subs source
                            (string/index-of source "(defn- <follow-page-link!")
                            (string/index-of source "(defn follow-link-under-cursor!"))]
    (is (not (string/includes? follow-source "db/get-page"))
        "follow-page-link must not resolve pages through renderer DB.")
    (is (string/includes? follow-source "db-async/<get-block")
        "follow-page-link should use the worker-backed block loader.")))

(deftest editor-cycle-todo-uses-edit-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        cycle-source (subs source
                           (string/index-of source "(defn cycle-todo!")
                           (string/index-of source "(defn delete-block-aux!"))]
    (is (not (string/includes? cycle-source "(db/entity (:db/id edit-block))"))
        "cycle-todo! must not rehydrate the current edit block through renderer DB entities.")
    (is (string/includes? cycle-source "(db-based-cycle-todo! edit-block)")
        "cycle-todo! should use the current edit block already held in editor state.")))

(deftest editor-delete-block-aux-uses-passed-block-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        delete-source (subs source
                            (string/index-of source "(defn delete-block-aux!")
                            (string/index-of source "(defn- move-to-prev-block"))]
    (is (not (string/includes? delete-source "db/entity"))
        "delete-block-aux! must not rehydrate the passed block through renderer DB entities.")
    (is (string/includes? delete-source "(block-handler/get-top-level-blocks [block])")
        "delete-block-aux! should delete using the block data passed by the caller.")))

(deftest editor-move-to-prev-block-uses-loaded-sibling-entity-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")]
    (is (not (string/includes? source "(db/entity (:db/id sibling-entity))"))
        "move-to-prev-block must not rehydrate the loaded sibling through renderer DB entities.")
    (is (string/includes? source "block (db-async/<get-block repo")
        "move-to-prev-block should load an unloaded sibling through the worker-backed block loader.")))

(deftest editor-move-selected-blocks-loads-through-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        move-source (subs source
                          (string/index-of source "(defn move-selected-blocks")
                          (string/index-of source "(defn delete-block!"))]
    (is (not (string/includes? move-source "db/entity"))
        "move-selected-blocks must not resolve selected blocks through renderer DB entities.")
    (is (string/includes? move-source "db-async/<get-blocks")
        "move-selected-blocks should load selected blocks through the worker block loader.")))

(deftest editor-cycle-todos-loads-selected-blocks-through-worker-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        cycle-source (subs source
                           (string/index-of source "(defn cycle-todos!")
                           (string/index-of source "(defn cycle-todo!"))]
    (is (not (string/includes? cycle-source "db/entity"))
        "cycle-todos! must not resolve selected blocks through renderer DB entities.")
    (is (string/includes? cycle-source "db-async/<get-blocks")
        "cycle-todos! should load selected blocks through the worker-backed block loader.")))

(deftest editor-db-based-cycle-todo-uses-block-status-test
  (let [source (source-for "src/main/frontend/handler/editor.cljs")
        cycle-source (subs source
                           (string/index-of source "(defn db-based-cycle-todo!")
                           (string/index-of source "(defn cycle-todos!"))]
    (is (not (string/includes? cycle-source "db/entity"))
        "db-based-cycle-todo! must not resolve status values through renderer DB entities.")
    (is (string/includes? cycle-source "(:logseq.property/status block)")
        "db-based-cycle-todo! should derive the next status from the passed block.")))

(deftest right-sidebar-dragstart-uses-resolved-item-test
  (let [source (source-for "src/main/frontend/components/right_sidebar.cljs")]
    (is (not (string/includes? source "block->data-transfer! (:block/name (db/entity db-id))"))
        "right sidebar dragstart must not synchronously resolve the dragged page through renderer DB entities.")))

(deftest events-upsert-type-block-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/events.cljs")]
    (is (not (string/includes? source "db/entity (:db/id block)"))
        "upsert-type-block must not resolve the target block through renderer DB entities.")
    (is (not (string/includes? source "db/entity :logseq.kv/latest-code-lang"))
        "upsert-type-block must not read latest-code-lang through a renderer DB entity.")
    (is (not (string/includes? source "db/entity [:block/uuid id]"))
        "upsert-type-block must not rehydrate inserted blocks through renderer DB entities.")
    (is (not (string/includes? source "db/entity [:block/uuid (:block/uuid db-block)]"))
        "upsert-type-block must not rehydrate updated blocks through renderer DB entities.")
    (is (string/includes? source ":thread-api/get-key-value")
        "upsert-type-block should read latest-code-lang through the worker.")
    (is (string/includes? source "<get-upsert-type-block")
        "upsert-type-block should resolve blocks through a worker-backed block loader.")))

(deftest page-open-recycle-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/page.cljs")]
    (is (not (string/includes? source "db/get-page common-config/recycle-page-name"))
        "open-recycle must not resolve the Recycle page through the renderer DB.")
    (is (string/includes? source ":thread-api/pull")
        "open-recycle should resolve the Recycle page through a worker pull.")))

(deftest page-today-journal-actions-use-worker-test
  (let [source (source-for "src/main/frontend/handler/page.cljs")
        helper-source (subs source
                            (string/index-of source "(defn- <today-journal-page")
                            (string/index-of source "(defn restore-recycled!"))
        create-source (subs source
                            (string/index-of source "(defn create-today-journal!")
                            (string/index-of source "(defn open-today-in-sidebar"))
        sidebar-source (subs source
                             (string/index-of source "(defn open-today-in-sidebar")
                             (string/index-of source "(defn copy-page-url"))]
    (is (not (string/includes? create-source "db/get-today-journal-page"))
        "today journal creation must not check existence through the renderer DB.")
    (is (not (string/includes? sidebar-source "db/get-today-journal-page"))
        "opening today's journal in the sidebar must not resolve the page through the renderer DB.")
    (is (string/includes? create-source "<today-journal-page")
        "today journal creation should check existing page through the shared worker helper.")
    (is (string/includes? sidebar-source "<today-journal-page")
        "opening today's journal in the sidebar should load the page through the shared worker helper.")
    (is (string/includes? helper-source "db-async/<get-journal-page-by-day")
        "today journal helper should load the page through the worker-backed journal lookup.")))

(deftest page-favorite-actions-use-worker-test
  (let [source (source-for "src/main/frontend/handler/page.cljs")
        favorite-source (subs source
                              (string/index-of source "(defn <unfavorite-page!")
                              (string/index-of source "(defn favorited?"))]
    (is (not (string/includes? favorite-source "db/get-page"))
        "favorite and unfavorite actions must not resolve pages through the renderer DB.")
    (is (string/includes? favorite-source "<page-block-uuid")
        "favorite and unfavorite actions should resolve pages through the worker helper.")))

(deftest page-reorder-favorites-use-worker-test
  (let [source (source-for "src/main/frontend/handler/page.cljs")
        reorder-source (subs source
                             (string/index-of source "(defn <reorder-favorites!")
                             (string/index-of source "(defn update-public-attribute!"))]
    (is (not (string/includes? reorder-source "conn/get-db"))
        "favorite reordering must not read current favorite blocks through the renderer DB.")
    (is (not (string/includes? reorder-source "db/get-page"))
        "favorite reordering must not resolve favorite pages through the renderer DB.")
    (is (string/includes? reorder-source ":thread-api/build-reorder-favorites-ops")
        "favorite reordering should ask the worker to build save-block ops.")
    (is (string/includes? reorder-source ":thread-api/apply-outliner-ops")
        "favorite reordering should apply worker-built outliner ops in the worker.")))

(deftest page-autocomplete-chosen-result-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/page.cljs")
        page-source (subs source
                          (string/index-of source "(defn- <chosen-result")
                          (string/index-of source "(defn on-chosen-handler"))]
    (is (not (string/includes? page-source "db/entity (:db/id chosen-result)"))
        "tag autocomplete convert checks must not rehydrate chosen results through renderer DB entities.")
    (is (not (string/includes? page-source "db/entity [:block/uuid (:block/uuid chosen-result)]"))
        "page and tag autocomplete chosen results must not be rehydrated through renderer DB entities.")
    (is (not (string/includes? page-source "db/get-page page"))
        "page autocomplete NLP date pages must not be resolved through renderer DB.")
    (is (string/includes? page-source "db-async/<get-block")
        "page and tag autocomplete chosen results should load UUID results through the worker-backed block loader.")))

(deftest db-page-convert-tag-to-page-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/page.cljs")]
    (is (not (string/includes? source "(let [tags (map #(db/entity (state/get-current-repo) (:db/id %)) (:block/tags obj))]"))
        "tag-to-page conversion must not rehydrate object tags through renderer DB entities.")
    (is (string/includes? source ":thread-api/build-convert-tag-to-page-tx")
        "tag-to-page conversion should build conversion tx-data inside the worker.")))

(deftest db-page-convert-page-to-tag-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/page.cljs")]
    (is (not (string/includes? source "(db-class/build-new-class (db/get-db)"))
        "page-to-tag conversion must not build class tx-data from the renderer DB.")
    (is (string/includes? source ":thread-api/build-convert-page-to-tag-tx")
        "page-to-tag conversion should build conversion tx-data inside the worker.")))

(deftest db-page-add-tag-validates-through-worker-test
  (let [source (source-for "src/main/frontend/handler/db_based/page.cljs")
        add-tag-source (subs source
                             (string/index-of source "(defn add-tag")
                             (string/index-of source "(defn convert-page-to-tag!"))
        validation-source (subs source
                                (string/index-of source "(defn- <valid-tag?")
                                (string/index-of source "(defn convert-page-to-tag!"))]
    (is (not (string/includes? add-tag-source "db/entity"))
        "add-tag must not load the target block through renderer DB entities.")
    (is (not (string/includes? add-tag-source "db/get-db"))
        "add-tag must not validate tag uniqueness through renderer DB.")
    (is (string/includes? validation-source ":thread-api/validate-block-tag")
        "add-tag should validate the target block/tag pair in the worker.")))

(deftest db-recent-add-page-uses-state-only-test
  (let [source (source-for "src/main/frontend/handler/db_based/recent.cljs")
        add-source (subs source
                         (string/index-of source "(defn add-page-to-recent!")
                         (string/index-of source "(defn get-recent-pages"))]
    (is (not (string/includes? add-source "db/entity"))
        "add-page-to-recent! must not resolve recent pages through renderer DB entities.")
    (is (string/includes? add-source "state/get-recent-pages")
        "add-page-to-recent! should update the persisted recent id list from UI state.")))

(deftest route-sidebar-journals-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/route.cljs")
        sidebar-source (subs source
                             (string/index-of source "(defn sidebar-journals!")
                             (string/index-of source "(defn go-to-journals!"))]
    (is (not (string/includes? sidebar-source "db/get-today-journal-page"))
        "sidebar journals must not read today's journal through renderer DB.")
    (is (string/includes? sidebar-source "db-async/<get-journal-page-by-day")
        "sidebar journals should load today's journal page through the worker-backed journal lookup.")))

(deftest route-redirect-to-page-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/route.cljs")
        redirect-source (subs source
                              (string/index-of source "(defn- <page-route-info")
                              (string/index-of source "(defn built-in-page-title"))]
    (is (not (string/includes? redirect-source "db/get-page"))
        "redirect-to-page! must not resolve pages through renderer DB.")
    (is (not (string/includes? redirect-source "db/get-alias-source-page"))
        "redirect-to-page! must not resolve alias source pages through renderer DB.")
    (is (string/includes? redirect-source ":thread-api/get-page-route-info")
        "redirect-to-page! should resolve page route metadata through the worker.")))

(deftest route-title-and-label-use-worker-test
  (let [source (source-for "src/main/frontend/handler/route.cljs")
        title-source (subs source
                           (string/index-of source "(defn built-in-page-title")
                           (string/index-of source "(defn update-page-title-and-label!"))]
    (is (not (string/includes? title-source "db/get-page"))
        "route title and label updates must not resolve pages through renderer DB.")
    (is (not (string/includes? title-source "db/entity"))
        "route title and label updates must not resolve block titles through renderer DB.")
    (is (string/includes? title-source ":thread-api/get-route-title")
        "route title and label updates should resolve page/block titles through the worker.")))

(deftest events-ui-publish-dialog-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/events/ui.cljs")]
    (is (not (string/includes? source "when-let [page (db/get-page page-name)]"))
        "publish/open-dialog must not resolve the current page through the renderer DB.")
    (is (not (string/includes? source "(when (db/page? page)"))
        "publish/open-dialog must not classify the current page through the renderer DB facade.")
    (is (string/includes? source ":thread-api/pull")
        "publish/open-dialog should resolve the current page through a worker pull.")))

(deftest events-ui-new-property-targets-use-worker-test
  (let [source (source-for "src/main/frontend/handler/events/ui.cljs")]
    (is (not (string/includes? source "(seq (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids)))"))
        "new-property must not resolve selected blocks through renderer DB entities.")
    (is (not (string/includes? source "(db/entity [:block/uuid (uuid s)])"))
        "new-property must not resolve the current page through renderer DB entities.")
    (is (not (string/includes? source "db/entity))\n        pos"))
        "new-property must not resolve the editing block through renderer DB entities.")
    (is (not (string/includes? source "(:block/title (db/entity (:db/id editing-block)))"))
        "new-property cleanup must not refresh edit content through renderer DB entities.")
    (is (string/includes? source "db-async/<get-block")
        "new-property should resolve block refs through worker-backed block loading.")))

(deftest comments-handler-thread-loading-uses-worker-blocks-test
  (let [source (source-for "src/main/frontend/handler/comments.cljs")]
    (is (not (string/includes? source "db/entity [:block/uuid (:block/uuid thread)]"))
        "comment thread loading must not rehydrate worker query rows through renderer DB entities.")
    (is (string/includes? source "db-async/<get-comment-threads-for-block repo")
        "comment thread loading should use the dedicated worker comment API.")))

(deftest comments-handler-area-actions-use-passed-area-test
  (let [source (source-for "src/main/frontend/handler/comments.cljs")]
    (is (not (string/includes? source "(defn- comments-area-entity"))
        "comments-area actions must not use a renderer DB rehydration helper.")
    (is (not (string/includes? source "(:block/uuid (comments-area-entity comments-area))"))
        "comments-area reveal and expand actions should use the passed comments-area map directly.")
    (is (not (string/includes? source "when-let [block (comments-area-entity comments-area)]"))
        "comments-area edit action should use the passed comments-area map directly.")))

(deftest comments-handler-target-lookup-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/comments.cljs")]
    (is (not (string/includes? source "(defn- block-ref->entity"))
        "comments target lookup must not use a synchronous renderer entity helper.")
    (is (not (string/includes? source "(db/entity [:block/uuid block-ref])"))
        "comments target lookup must not resolve UUID refs through renderer DB entities.")
    (is (not (string/includes? source "(db/entity [:block/uuid (uuid block-ref)])"))
        "comments target lookup must not resolve string UUID refs through renderer DB entities.")
    (is (not (string/includes? source "(db/entity block-ref)"))
        "comments target lookup must not resolve db ids through renderer DB entities.")
    (is (not (string/includes? source "(db/entity [:block/uuid block-id])"))
        "ensure-comments-area must not resolve the target block through renderer DB entities.")
    (is (not (string/includes? source "keep #(db/entity [:block/uuid %])"))
        "selected comment targets must not resolve selection UUIDs through renderer DB entities.")
    (is (string/includes? source "<block-ref")
        "comments target lookup should use worker-backed async block loading.")))

(deftest comments-handler-delete-targets-uses-passed-data-test
  (let [source (source-for "src/main/frontend/handler/comments.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "comments handler must not require the renderer DB facade.")
    (is (not (string/includes? source "(db/sort-by-order"))
        "comments handler should sort children with shared logseq.db helpers, not the renderer DB facade.")
    (is (not (string/includes? source "(some-> comments-area' :db/id db/entity)"))
        "comment deletion must not rehydrate the parent comments area through renderer DB entities.")
    (is (not (string/includes? source "db/entity"))
        "comments handler must not call renderer DB entity lookups.")))

(deftest jump-handler-uses-worker-block-loader-test
  (let [source (source-for "src/main/frontend/handler/jump.cljs")]
    (is (not (string/includes? source "[frontend.db :as db]"))
        "jump handler must not require the renderer DB facade.")
    (is (not (string/includes? source "db/entity"))
        "jump handler must not resolve jump targets through renderer DB entities.")
    (is (not (string/includes? source "db/get-page"))
        "jump handler must not resolve the current page through the renderer DB.")
    (is (string/includes? source "db-async/<get-block")
        "jump handler should resolve blocks through the worker-backed block loader.")))

(deftest paste-handler-does-not-read-page-format-from-renderer-db-test
  (let [source (source-for "src/main/frontend/handler/paste.cljs")]
    (is (not (string/includes? source "db/get-page-format"))
        "paste handler must not read page format through the renderer DB facade.")
    (is (string/includes? source "format :markdown")
        "paste handler should preserve the current markdown-only page format behavior directly.")))

(deftest paste-handler-embed-block-link-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/paste.cljs")]
    (is (not (string/includes? source ":block/link (:db/id (db/entity [:block/uuid block-id]))"))
        "embed-block paste must not resolve the linked block through a renderer DB entity.")
    (is (string/includes? source "db-async/<get-block repo block-id")
        "embed-block paste should load the linked block through the worker-backed block loader.")))

(deftest paste-handler-embed-parent-check-uses-worker-test
  (let [source (source-for "src/main/frontend/handler/paste.cljs")
        embed-source (subs source
                           (string/index-of source "(defn- paste-copied-blocks-or-text")
                           (string/index-of source "(defn paste-text-in-one-block-at-point"))]
    (is (not (string/includes? embed-source "db/get-block-parents"))
        "embed-block paste must not check parent blocks through the renderer DB.")
    (is (string/includes? embed-source "db-async/<get-block-parents")
        "embed-block paste should check parent blocks through the worker-backed parent loader.")))

(deftest paste-handler-display-type-uses-state-block-test
  (let [source (source-for "src/main/frontend/handler/paste.cljs")]
    (is (not (string/includes? source "(some-> (state/get-edit-block) :db/id db/entity)"))
        "paste display-type handling must not rehydrate the current edit block through a renderer DB entity.")
    (is (string/includes? source "(:logseq.property.node/display-type (state/get-edit-block))")
        "paste display-type handling should use the current edit block already stored in state.")))

(deftest paste-handler-parseable-page-name-uses-state-block-test
  (let [source (source-for "src/main/frontend/handler/paste.cljs")]
    (is (not (string/includes? source "(:block/name (db/entity page-id))"))
        "parseable paste must not resolve the editing page name through renderer DB entities.")
    (is (not (string/includes? source "current-db (db/get-db (state/get-current-repo))"))
        "parseable paste must not resolve page refs through the renderer DB.")
    (is (string/includes? source "db-async/<get-block-page-info")
        "parseable paste should resolve editing page info through the worker-backed page-info loader.")))

(deftest property-util-block-property-value-uses-block-map-test
  (let [source (source-for "src/main/frontend/handler/property/util.cljs")]
    (is (not (string/includes? source "[frontend.db.conn :as conn]"))
        "property util must not require the renderer DB connection.")
    (is (not (string/includes? source "conn/get-db"))
        "property util must not read block property values through the renderer DB.")
    (is (string/includes? source "db-property/lookup")
        "property util should read built-in values from the passed block map.")))

(deftest db-property-util-closed-values-use-built-in-metadata-test
  (let [source (source-for "src/main/frontend/handler/db_based/property/util.cljs")]
    (is (not (string/includes? source "[frontend.db.conn :as conn]"))
        "db property util must not require the renderer DB connection for closed values.")
    (is (not (string/includes? source "conn/get-db"))
        "db property util must not read built-in closed values through the renderer DB.")
    (is (string/includes? source "db-property/built-in-closed-values")
        "db property util should read built-in closed values from static metadata.")))
