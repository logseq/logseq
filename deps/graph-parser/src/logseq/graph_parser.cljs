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
    '[:find ?page-name
      :in $ ?path
      :where
      [?file :file/path ?path]
      [?page :block/file ?file]
      [?page :block/original-name ?page-name]]
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
        pages-to-clear (distinct (filter some? [existing-file-page (:block/name file-page)]))
        blocks (mapcat (fn [page]
                         (ldb/get-page-blocks db page {:pull-keys [:db/id :block/uuid]}))
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
   (let [format (common-util/get-format file)
         file-content [{:file/path file}]
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
                     (extract/extract file content extract-options')

                     (common-config/whiteboard? file)
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
           {:tx (concat file-content refs pages-index delete-blocks pages block-ids blocks)
            :ast ast})
         tx (concat tx [(cond-> {:file/path file
                                 :file/content content}
                          new?
                                ;; TODO: use file system timestamp?
                          (assoc :file/created-at (common-util/time-ms)))])
         result (if skip-db-transact?
                  tx
                  (ldb/transact! conn tx (select-keys options [:new-graph? :from-disk?])))]
     {:tx result
      :ast ast})))

(defn- get-pid
  "Get a property's id (name or uuid) given its name. For db graphs"
  [db property-name]
  (:block/uuid (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))])))

(defn add-missing-timestamps
  "Add updated-at or created-at timestamps if they doesn't exist"
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond-> block
                (nil? (:block/updated-at block))
                (assoc :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn- update-block-with-invalid-tags
  [block]
  (if (seq (:block/tags block))
    (update block :block/tags
            (fn [tags]
              (mapv #(-> %
                         add-missing-timestamps
                         (merge {:block/journal? false
                                 :block/format :markdown
                                 :block/uuid (d/squuid)}))
                    tags)))
    block))

(defn- update-imported-block
  [conn block]
  (prn ::block block)
  (let [remove-keys (fn [m pred] (into {} (remove (comp pred key) m)))]
    (-> block
        ((fn [block']
           (cond
             (seq (:block/macros block'))
             (update block' :block/macros
                     (fn [macros]
                       (mapv (fn [m]
                               (-> m
                                   (update :block/properties
                                           (fn [props]
                                             (update-keys props #(get-pid @conn %))))
                                   (assoc :block/uuid (d/squuid))))
                             macros)))

             (:block/pre-block? block')
             block'

             :else
             (update-in block' [:block/properties]
                        (fn [props]
                          (-> props
                              (update-keys (fn [k]
                                             (if-let [new-key (get-pid @conn k)]
                                               new-key
                                               k)))
                              (remove-keys keyword?)))))))
        update-block-with-invalid-tags
        ((fn [block']
           (if (seq (:block/refs block'))
             (update block' :block/refs
                     (fn [refs]
                       (mapv (fn [ref]
                               (if (and (vector? ref) (= :block/uuid (first ref)))
                                 ref
                                 (assoc ref :block/format :markdown)))
                             refs)))
             block')))
        add-missing-timestamps
        ;; FIXME: Remove when properties are supported
        (assoc :block/properties {})
        ;; TODO: org-mode content needs to be handled
        (assoc :block/format :markdown)
        ;; TODO: pre-block? can be removed once page properties are imported
        (dissoc :block/pre-block? :block/properties-text-values :block/properties-order
                :block/invalid-properties))))

(defn import-file-to-db-graph
  "Parse file and save parsed data to the given db graph."
  [conn file content {:keys [delete-blocks-fn extract-options skip-db-transact?]
                      :or {delete-blocks-fn (constantly [])
                           skip-db-transact? false}
                      :as options}]
  (let [format (common-util/get-format file)
        {:keys [tx ast]}
        (let [extract-options' (merge {:block-pattern (common-config/get-block-pattern format)
                                       :date-formatter "MMM do, yyyy"
                                       :uri-encoded? false
                                       :db-graph-mode? true
                                       :filename-format :legacy}
                                      extract-options
                                      {:db @conn})
              {:keys [pages blocks ast refs]
               :or   {pages []
                      blocks []
                      ast []}}
              (cond (contains? common-config/mldoc-support-formats format)
                    (extract/extract file content extract-options')

                    (common-config/whiteboard? file)
                    (extract/extract-whiteboard-edn file content extract-options')

                    :else nil)
              ;; remove file path relative
              pages (map #(dissoc % :block/file :block/properties) pages)
              block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
              delete-blocks (delete-blocks-fn @conn (first pages) file block-ids)
              block-refs-ids (->> (mapcat :block/refs blocks)
                                  (filter (fn [ref] (and (vector? ref)
                                                         (= :block/uuid (first ref)))))
                                  (map (fn [ref] {:block/uuid (second ref)}))
                                  (seq))
                 ;; To prevent "unique constraint" on datascript
              block-ids (set/union (set block-ids) (set block-refs-ids))
              pages (map #(-> (merge {:block/journal? false} %)
                              ;; Fix pages missing :block/original-name. Shouldn't happen
                              ((fn [m]
                                 (if-not (:block/original-name m)
                                   (assoc m :block/original-name (:block/name m))
                                   m)))
                              add-missing-timestamps
                              ;; TODO: org-mode content needs to be handled
                              (assoc :block/format :markdown)
                              (dissoc :block/properties-text-values :block/properties-order :block/invalid-properties
                                      :block/whiteboard?)
                              update-block-with-invalid-tags
                              ;; FIXME: Remove when properties are supported
                              (assoc :block/properties {}))
                         (extract/with-ref-pages pages blocks))

              ;; post-handling
              whiteboard-pages (->> pages
                                    (filter #(= "whiteboard" (:block/type %)))
                                    (map (fn [page-block]
                                           (-> page-block
                                               (assoc :block/journal? false
                                                      :block/format :markdown
                                                      ;; fixme: missing properties
                                                      :block/properties {(get-pid @conn :ls-type) :whiteboard-page})))))
              blocks (map #(update-imported-block conn %) blocks)
              pages-index (map #(select-keys % [:block/name]) pages)]

          {:tx (concat refs whiteboard-pages pages-index delete-blocks pages block-ids blocks)
           :ast ast})
        tx' (common-util/fast-remove-nils tx)
        result (if skip-db-transact?
                 tx'
                 (d/transact! conn tx' (select-keys options [:new-graph? :from-disk?])))]
    {:tx-report result
     :ast ast}))

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
