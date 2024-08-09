(ns logseq.graph-parser
  "Main ns used by logseq app to parse graph from source files and then save to
  the given database connection"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.graph-parser.extract :as extract]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]))

(defn- retract-blocks-tx
  [blocks retain-uuids]
  (mapcat (fn [{uuid :block/uuid eid :db/id}]
            (if (and uuid (contains? retain-uuids uuid))
              (map (fn [attr] [:db.fn/retractAttribute eid attr]) db-schema/retract-attributes)
              (when eid [[:db.fn/retractEntity eid]])))
          blocks))

(defn- get-file-page
  "Copy of db/get-file-page. Too basic to couple to main app"
  [db file-path]
  (ffirst
   (d/q
    '[:find ?page
      :in $ ?path
      :where
      [?file :file/path ?path]
      [?page :block/file ?file]]
    db
    file-path)))

(defn get-blocks-to-delete
  "Returns the transactional operations to retract blocks belonging to the
  given page name and file path. This function is required when a file is being
  parsed from disk; before saving the parsed, blocks from the previous version
  of that file need to be retracted.

  The 'Page' parsed from the new file version is passed separately from the
  file-path, as the page name can be set via properties in the file, and thus
  can change between versions. If it has changed, existing blocks for both the
  old and new page name will be retracted.

  Blocks are by default fully cleared via retractEntity. However, a collection
  of block UUIDs to retain can be passed, and any blocks with matching uuids
  will instead have their attributes cleared individually via
  'retractAttribute'. This will preserve block references to the retained
  UUIDs."
  [db file-page file-path retain-uuid-blocks]
  (let [existing-file-page (get-file-page db file-path)
        pages-to-clear (distinct (filter some? [existing-file-page (:db/id file-page)]))
        blocks (mapcat (fn [page-id]
                         (ldb/get-page-blocks db page-id {:pull-keys [:db/id :block/uuid]}))
                       pages-to-clear)
        retain-uuids (set (keep :block/uuid retain-uuid-blocks))]
    (retract-blocks-tx (distinct blocks) retain-uuids)))

(defn parse-file
  "Parse file and save parsed data to the given db. Main parse fn used by logseq app.
Options available:

  * :delete-blocks-fn - Optional fn which is called with the new page, file and existing block uuids
  which may be referenced elsewhere. Used to delete the existing blocks before saving the new ones.
   Implemented in file-common-handler/validate-and-get-blocks-to-delete for IoC
* :skip-db-transact? - Boolean which skips transacting in order to batch transactions. Default is false
* :extract-options - Options map to pass to extract/extract"
  ([conn file-path content] (parse-file conn file-path content {}))
  ([conn file-path content {:keys [delete-blocks-fn extract-options skip-db-transact? ctime mtime]
                            :or {delete-blocks-fn (constantly [])
                                 skip-db-transact? false}
                            :as options}]
   (let [format (common-util/get-format file-path)
         file-content [{:file/path file-path}]
         {:keys [tx ast]}
         (let [extract-options' (merge {:block-pattern (common-config/get-block-pattern format)
                                        :date-formatter "MMM do, yyyy"
                                        :uri-encoded? false
                                        :filename-format :legacy}
                                       extract-options
                                       {:db @conn})
               {:keys [pages blocks ast refs]
                :or   {pages []
                       blocks []
                       ast []}}
               (cond (contains? common-config/mldoc-support-formats format)
                     (extract/extract file-path content extract-options')

                     (common-config/whiteboard? file-path)
                     (extract/extract-whiteboard-edn file-path content extract-options')

                     :else nil)
               block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
               delete-blocks (delete-blocks-fn @conn (first pages) file-path block-ids)
               block-refs-ids (->> (mapcat :block/refs blocks)
                                   (filter (fn [ref] (and (vector? ref)
                                                          (= :block/uuid (first ref)))))
                                   (map (fn [ref] {:block/uuid (second ref)}))
                                   (seq))
               ;; To prevent "unique constraint" on datascript
               block-ids (set/union (set block-ids) (set block-refs-ids))
               pages (extract/with-ref-pages pages blocks)
               pages-index (map #(select-keys % [:block/name]) pages)]
           ;; does order matter?
           {:tx (concat file-content refs pages-index delete-blocks pages block-ids blocks)
            :ast ast})
         file-entity (d/entity @conn [:file/path file-path])
         tx (concat tx [(cond-> {:file/path file-path
                                 :file/content content}
                          (or ctime (nil? file-entity))
                          (assoc :file/created-at (or ctime (js/Date.)))
                          mtime
                          (assoc :file/last-modified-at mtime))])
         result (if skip-db-transact?
                  tx
                  (do
                    (ldb/transact! conn tx (select-keys options [:new-graph? :from-disk?]))
                    nil))]
     {:tx result
      :ast ast})))

(defn filter-files
  "Filters files in preparation for parsing. Only includes files that are
  supported by parser"
  [files]
  (let [support-files (filter
                       (fn [file]
                         (let [format (common-util/get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} common-config/mldoc-support-formats) format)))
                       files)
        support-files (sort-by :file/path support-files)
        {journals true non-journals false} (group-by (fn [file] (string/includes? (:file/path file) "journals/")) support-files)
        {built-in true others false} (group-by (fn [file]
                                                 (or (string/includes? (:file/path file) "contents.")
                                                     (string/includes? (:file/path file) ".edn")
                                                     (string/includes? (:file/path file) "custom.css"))) non-journals)]
    (concat (reverse journals) built-in others)))
