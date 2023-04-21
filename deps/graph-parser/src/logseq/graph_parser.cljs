(ns logseq.graph-parser
  "Main ns used by logseq app to parse graph from source files and then save to
  the given database connection"
  (:require [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [logseq.graph-parser.config :as gp-config]
            [logseq.db.schema :as db-schema]
            [clojure.string :as string]
            [clojure.set :as set]))

(defn- retract-blocks-tx
  [blocks retain-uuids]
  (mapcat (fn [{uuid :block/uuid eid :db/id}]
            (if (and uuid (contains? retain-uuids uuid))
              (map (fn [attr] [:db.fn/retractAttribute eid attr]) db-schema/retract-attributes)
              [[:db.fn/retractEntity eid]]))
          blocks))

(defn- get-file-page
  "Copy of db/get-file-page. Too basic to couple to main app"
  [db file-path]
  (ffirst
   (d/q
    '[:find ?page-name
      :in $ ?path
      :where
      [?file :file/path ?path]
      [?page :block/file ?file]
      [?page :block/original-name ?page-name]]
    db
    file-path)))

(defn- get-page-blocks-no-cache
  "Copy of db/get-page-blocks-no-cache. Too basic to couple to main app"
  [db page {:keys [pull-keys]
            :or {pull-keys '[*]}}]
  (let [sanitized-page (gp-util/page-name-sanity-lc page)
        page-id (:db/id (d/entity db [:block/name sanitized-page]))]
    (when page-id
      (let [datoms (d/datoms db :avet :block/page page-id)
            block-eids (mapv :e datoms)]
        (d/pull-many db pull-keys block-eids)))))

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
        pages-to-clear (distinct (filter some? [existing-file-page (:block/name file-page)]))
        blocks (mapcat (fn [page]
                         (get-page-blocks-no-cache db page {:pull-keys [:db/id :block/uuid]}))
                       pages-to-clear)
        retain-uuids (set (keep :block/uuid retain-uuid-blocks))]
    (retract-blocks-tx (distinct blocks) retain-uuids)))

(defn parse-file
  "Parse file and save parsed data to the given db. Main parse fn used by logseq app.
Options available:

* :new? - Boolean which indicates if this file already exists. Default is true.
* :delete-blocks-fn - Optional fn which is called with the new page, file and existing block uuids
  which may be referenced elsewhere. Used to delete the existing blocks before saving the new ones.
   Implemented in file-common-handler/validate-and-get-blocks-to-delete for IoC
* :skip-db-transact? - Boolean which skips transacting in order to batch transactions. Default is false
* :extract-options - Options map to pass to extract/extract"
  ([conn file content] (parse-file conn file content {}))
  ([conn file content {:keys [new? delete-blocks-fn extract-options skip-db-transact?]
                       :or {new? true
                            delete-blocks-fn (constantly [])
                            skip-db-transact? false}
                       :as options}]
   (let [format (gp-util/get-format file)
         file-content [{:file/path file}]
         {:keys [tx ast]}
         (let [extract-options' (merge {:block-pattern (gp-config/get-block-pattern format)
                                        :date-formatter "MMM do, yyyy"
                                        :supported-formats (gp-config/supported-formats)
                                        :uri-encoded? false
                                        :filename-format :legacy}
                                       extract-options
                                       {:db @conn})
               {:keys [pages blocks ast]
                :or   {pages []
                       blocks []
                       ast []}}
               (cond (contains? gp-config/mldoc-support-formats format)
                 (extract/extract file content extract-options')

                 (gp-config/whiteboard? file)
                 (extract/extract-whiteboard-edn file content extract-options')

                 :else nil)
               block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
               delete-blocks (delete-blocks-fn @conn (first pages) file block-ids)
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
           {:tx (concat file-content pages-index delete-blocks pages block-ids blocks)
            :ast ast})
         tx (concat tx [(cond-> {:file/path file
                                 :file/content content}
                                new?
                                ;; TODO: use file system timestamp?
                                (assoc :file/created-at (date-time-util/time-ms)))])
         tx' (gp-util/fast-remove-nils tx)
         result (if skip-db-transact?
                  tx'
                  (d/transact! conn tx' (select-keys options [:new-graph? :from-disk?])))]
     {:tx result
      :ast ast})))

(defn filter-files
  "Filters files in preparation for parsing. Only includes files that are
  supported by parser"
  [files]
  (let [support-files (filter
                       (fn [file]
                         (let [format (gp-util/get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} gp-config/mldoc-support-formats) format)))
                       files)
        support-files (sort-by :file/path support-files)
        {journals true non-journals false} (group-by (fn [file] (string/includes? (:file/path file) "journals/")) support-files)
        {built-in true others false} (group-by (fn [file]
                                                 (or (string/includes? (:file/path file) "contents.")
                                                     (string/includes? (:file/path file) ".edn")
                                                     (string/includes? (:file/path file) "custom.css"))) non-journals)]
    (concat (reverse journals) built-in others)))
