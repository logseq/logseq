(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.file-based.repo :as file-repo-handler]
            [frontend.state :as state]
            [frontend.db.conn :as conn]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [frontend.config :as config]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.sqlite.build :as sqlite-build]
            [frontend.handler.file-based.status :as status]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [frontend.worker.handler.page :as worker-page]))

(def node? (exists? js/process))

(def test-db-name "test-db")
(def test-db-name-db-version "logseq_db_test-db")
(def test-db
  (if (and node? (some? js/process.env.DB_GRAPH)) test-db-name-db-version test-db-name))

(defn start-test-db!
  [& {:as opts}]
  (let [db-graph? (or (:db-graph? opts) (and node? (some? js/process.env.DB_GRAPH)))
        test-db (if db-graph? test-db-name-db-version test-db-name)]
    (state/set-current-repo! test-db)
    (conn/start! test-db opts)
    (let [conn (conn/get-db test-db false)]
      (when db-graph?
        (db-pipeline/add-listener conn)
        (d/transact! conn (sqlite-create-graph/build-db-initial-data "")))
      (d/listen! conn ::listen-db-changes!
                 (fn [tx-report]
                   (worker-pipeline/invoke-hooks test-db conn tx-report {}))))))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn- parse-property-value [value]
  (if-let [refs (seq (map #(or (second %) (get % 2))
                          (re-seq #"#(\S+)|\[\[(.*?)\]\]" value)))]
    (set refs)
    (if-some [new-val (text/parse-non-string-property-value value)]
      new-val
      value)))

(defn- property-lines->properties
  [property-lines]
  (->> property-lines
       (keep (fn [line]
               (let [[k v] (string/split line #"::\s*" 2)]
                 (when (string/includes? line "::")
                   [(keyword k)
                    (if (= "tags" k)
                      (parse-property-value v)
                      (let [val (parse-property-value v)]
                        (if (coll? val)
                          (set (map #(vector :page %) val))
                          val)))]))))
       (into {})))

(defn- property-lines->attributes
  "Converts markdown property lines e.g. `foo:: bar\nfoo:: baz` to properties
  and attributes. All are treated as properties except for tags -> :block/tags
  and created-at -> :block/created-at"
  [lines]
  (let [props (property-lines->properties lines)]
    (cond-> {:build/properties (dissoc props :created-at :tags)}
      (:tags props)
      (assoc :build/tags (mapv keyword (:tags props)))
      (:created-at props)
      (assoc :block/created-at (:created-at props)))))

(def file-to-db-statuses
  {"TODO" :logseq.task/status.todo
   "LATER" :logseq.task/status.todo
   "IN-PROGRESS" :logseq.task/status.doing
   "NOW" :logseq.task/status.doing
   "DOING" :logseq.task/status.doing
   "DONE" :logseq.task/status.done
   "WAIT" :logseq.task/status.backlog
   "WAITING" :logseq.task/status.backlog
   "CANCELED" :logseq.task/status.canceled
   "CANCELLED" :logseq.task/status.canceled})

(defn- parse-content
  "Given a file's content as markdown, returns blocks and page attributes for the file
   to be used with sqlite-build/build-blocks-tx"
  [content*]
  (let [blocks** (if (string/includes? content* "\n-")
                   (->> (string/split content* #"\n-\s*")
                        (mapv (fn [s]
                                (let [[content & props] (string/split-lines s)]
                                  (cond-> {:block/title content}
                                    ;; If no property chars may accidentally parse child blocks
                                    ;; so don't do property parsing
                                    (and (string/includes? s ":: ") props)
                                    (merge (property-lines->attributes props)))))))
                   ;; only has a page pre-block
                   [{:block/title content*}])
        [page-attrs blocks*]
        (if (string/includes? (:block/title (first blocks**)) "::")
          [(property-lines->attributes (string/split-lines (:block/title (first blocks**))))
           (rest blocks**)]
          [nil blocks**])
        blocks
        (mapv #(if-let [status (some-> (second (re-find status/bare-marker-pattern (:block/title %)))
                                       file-to-db-statuses)]
                 (-> %
                     (assoc :block/tags [{:db/ident :logseq.class/Task}])
                     (update :build/properties merge {:logseq.task/status status}))
                 %)
              blocks*)]
    {:blocks (mapv (fn [b] (update b :block/title #(string/replace-first % #"^-\s*" "")))
                   blocks)
     :page-attributes page-attrs}))

(defn- build-blocks-tx-options
  "Given arguments to load-test-files, parses and converts them to options for
  sqlite-build/build-blocks-tx. Supports a limited set of markdown including
  task keywords, page properties and block properties. See query-dsl-test for examples"
  [options*]
  (let [pages-and-blocks
        (mapv (fn [{:file/keys [path content]}]
                (let [{:keys [blocks page-attributes]} (parse-content content)
                      unique-page-attrs
                      (if (string/starts-with? path "journals")
                        {:build/journal
                         (or (some-> (second (re-find #"/([^/]+)\." path))
                                     (string/replace "_" "")
                                     parse-double)
                             (throw (ex-info (str "Can't detect page name of file: " (pr-str path)) {})))}
                        {:block/title
                         (or (second (re-find #"/([^/]+)\." path))
                             (throw (ex-info (str "Can't detect page name of file: " (pr-str path)) {})))})]
                  {:page (cond-> unique-page-attrs
                           (seq page-attributes)
                           (merge page-attributes))
                   :blocks blocks}))
              options*)
        options {:pages-and-blocks pages-and-blocks
                 :auto-create-ontology? true}]
    options))

(defn load-test-files-for-db-graph
  [options*]
  (let [;; Builds options from markdown :file/content unless given explicit build-blocks config
        options (if (:page (first options*))
                  {:pages-and-blocks options* :auto-create-ontology? true}
                  (build-blocks-tx-options options*))
        {:keys [init-tx block-props-tx]} (sqlite-build/build-blocks-tx options)]
    (db/transact! test-db init-tx)
    (when (seq block-props-tx)
      (db/transact! test-db block-props-tx))))

(defn load-test-files
  "Given a collection of file maps, loads them into the current test-db.
This can be called in synchronous contexts as no async fns should be invoked"
  [files]
  (if (and node? js/process.env.DB_GRAPH)
    (load-test-files-for-db-graph files)
    (file-repo-handler/parse-files-and-load-to-db!
     test-db
     files
   ;; Set :refresh? to avoid creating default files in after-parse
     {:re-render? false :verbose false :refresh? true})))

(defn initial-test-page-and-blocks
  [& {:keys [page-uuid]}]
  (let [page-uuid (or page-uuid (random-uuid))
        first-block-uuid (random-uuid)
        second-block-uuid (random-uuid)
        page-id [:block/uuid page-uuid]]
    (->>
     [;; page
      {:block/uuid page-uuid
       :block/name "test"
       :block/title "Test"}
      ;; first block
      {:block/uuid first-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil)
       :block/title "block 1"
       :block/format :markdown}
      ;; second block
      {:block/uuid second-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil)
       :block/title "block 2"
       :block/format :markdown}]
     (map sqlite-util/block-with-timestamps))))

(defn start-and-destroy-db
  "Sets up a db connection and current repo like fixtures/reset-datascript. It
  also seeds the db with the same default data that the app does and destroys a db
  connection when done with it."
  [f & {:as start-opts}]
  ;; Set current-repo explicitly since it's not the default
  (let [db-graph? (or (:db-graph? start-opts) (and node? (some? js/process.env.DB_GRAPH)))
        repo (if db-graph? test-db-name-db-version test-db-name)]
    (state/set-current-repo! repo)
    (start-test-db! start-opts)
    (when db-graph?
      (let [built-in-data (sqlite-create-graph/build-db-initial-data
                           config/config-default-content)]
        (db/transact! repo built-in-data)))
    (when-let [init-f (:init-data start-opts)]
      (assert (fn? f) "init-data should be a fn")
      (init-f (db/get-db repo false)))
    (f)
    (state/set-current-repo! nil)
    (destroy-test-db!)))

(defn db-based-start-and-destroy-db
  [f & {:as start-opts}]
  (start-and-destroy-db f (assoc start-opts :db-graph? true)))

(def db-based-start-and-destroy-db-map-fixture
  "To avoid 'Fixtures may not be of mixed types' error
  when use together with other map-type fixtures"
  {:before #(start-test-db! {:db-graph? true})
   :after #(destroy-test-db!)})

(defn save-block!
  "Wrapper around editor-handler/save-block! that also adds tags"
  [repo block-uuid content {:keys [tags]}]
  (editor-handler/save-block! repo block-uuid content)
  (doseq [tag tags]
    (page-handler/add-tag repo block-uuid (db/get-page tag))))

(defn create-page!
  [title & {:as opts}]
  (let [repo (state/get-current-repo)
        conn (db/get-db repo false)
        config (state/get-config repo)
        [page-name _page-uuid] (worker-page/create! repo conn config title opts)]
    page-name))
