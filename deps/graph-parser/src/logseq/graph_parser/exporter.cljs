(ns logseq.graph-parser.exporter
  "Exports a file graph to DB graph. Used by the File to DB graph importer"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn- get-pid
  "Get a property's id (name or uuid) given its name. For db graphs"
  [db property-name]
  (:block/uuid (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))])))

(defn- add-missing-timestamps
  "Add updated-at or created-at timestamps if they doesn't exist"
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond-> block
                (nil? (:block/updated-at block))
                (assoc :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn- update-page-tags
  [block tag-classes names-uuids page-tags-uuid]
  (if (seq (:block/tags block))
    (let [page-tags (->> (:block/tags block)
                         (remove #(contains? tag-classes (:block/name %)))
                         (map #(or (get names-uuids (:block/name %))
                                   (throw (ex-info (str "No uuid found for tag " (pr-str (:block/name %)))
                                                   {:tag %}))))
                         set)]
      (cond-> block
        true
        (update :block/tags
                (fn [tags]
                  (keep #(when (contains? tag-classes (:block/name %))
                           (-> %
                               add-missing-timestamps
                               ;; don't use build-new-class b/c of timestamps
                               (merge {:block/journal? false
                                       :block/format :markdown
                                       :block/type "class"
                                       :block/uuid (d/squuid)})))
                        tags)))
        (seq page-tags)
        (assoc :block/properties {page-tags-uuid page-tags})))
    block))

(defn- add-uuid-to-page-map [m page-names-to-uuids]
  (assoc m
         :block/uuid
         (or (get page-names-to-uuids (:block/name m))
             (throw (ex-info (str "No uuid found for page " (pr-str (:block/name m)))
                             {:page m})))))

(defn- update-block-tags
  [block tag-classes page-names-to-uuids]
  (if (seq (:block/tags block))
    (-> block
        (update :block/content
                db-content/content-without-tags
                (->> (:block/tags block)
                     (filter #(tag-classes (:block/name %)))
                     (map :block/original-name)))
        (update :block/content
                db-content/replace-tags-with-page-refs
                (->> (:block/tags block)
                     (remove #(tag-classes (:block/name %)))
                     (map #(add-uuid-to-page-map % page-names-to-uuids))))
        (update :block/tags
                (fn [tags]
                  (keep #(when (contains? tag-classes (:block/name %))
                           (-> %
                               add-missing-timestamps
                               ;; don't use build-new-class b/c of timestamps
                               (merge {:block/journal? false
                                       :block/format :markdown
                                       :block/type "class"
                                       :block/uuid (d/squuid)})))
                        tags))))
    block))

(def ignored-built-in-properties
  "Marker timestamp properties are not imported because they have not been
  supported for a long time and cause invalid built-in pages"
  [:now :later :doing :done :canceled :cancelled :in-progress :todo :wait :waiting])

(defn- infer-property-schema
  "Return inferred :block/schema map. nil means don't set schema"
  [prop-val prop refs {:keys [property-schemas property-changes]}]
  ;; Explicitly fail an unexpected case rather cause silent downstream failures
  (when (and (coll? prop-val) (not (every? string? prop-val)))
    (throw (ex-info "Import cannot infer schema of unknown property value"
                    {:value prop-val :property prop})))
  (let [prop-type (if (and (coll? prop-val)
                           (seq prop-val)
                           (set/subset? prop-val
                                        (set (keep #(when (:block/journal? %) (:block/original-name %)) refs))))
                    :date
                    (db-property-type/infer-property-type-from-value prop-val))
        schema (cond-> {:type prop-type}
                 (#{:page :date} prop-type)
                 ;; Assume :many for now as detecting that detecting property values across files are consistent
                 ;; isn't possible yet
                 (assoc :cardinality :many))]
    (if-let [prev-type (get-in @property-schemas [prop :type])]
      (do (when-not (= prev-type prop-type)
            (prn :PROP-TYPE-CHANGE prev-type :-> prop-type prop)
            (swap! property-changes assoc prop {:type {:from prev-type :to prop-type}})
            (when (not= prev-type :default)
              ;; TODO: Throw error or notification when all are fixed that can be
              (prn "Import detected property value change it can't fix" {:old prev-type :new prop-type :property prop})))
          nil)
      (do (swap! property-schemas assoc prop schema)
          schema))))

(defn- update-block-refs
  "Updates the attributes of a block ref as this is where a new page is defined. Also
   updates block content effected by refs"
  [block page-names-to-uuids {:keys [whiteboard?] :as options}]
  (let [ref-to-ignore? (if whiteboard?
                         #(and (map? %) (:block/uuid %))
                         #(and (vector? %) (= :block/uuid (first %))))]
    (if (seq (:block/refs block))
      (cond-> block
        true
        (update
         :block/refs
         (fn [refs]
           (mapv (fn [ref]
                   (if (ref-to-ignore? ref)
                     ref
                     (let [prop-val (get (apply dissoc (:block/properties block) ignored-built-in-properties)
                                         (keyword (:block/name ref)))]
                       (cond-> (assoc ref :block/format :markdown)
                         (and prop-val
                              (not (get db-property/built-in-properties (keyword (:block/name ref))))
                              ;; Ignore templates as they don't directly map to properties and don't
                              ;; have representative property values
                              (not (contains? (:block/properties block) :template)))
                         (merge (when-let [schema (infer-property-schema prop-val (keyword (:block/name ref)) refs options)]
                                  {:block/type "property"
                                   :block/schema schema}))))))
                 refs)))
        ;; check for now until :block/pre-block? is removed
        (:block/content block)
        (update :block/content
                db-content/page-ref->special-id-ref
               ;; TODO: Handle refs for whiteboard block which has none
                (->> (:block/refs block)
                     (remove ref-to-ignore?)
                     (map #(add-uuid-to-page-map % page-names-to-uuids)))))
      block)))

(defn- update-built-in-property-values
  [props db]
  (->> props
       (map (fn [[prop val]]
              [prop
               (case prop
                 :query-properties
                 (try
                   (mapv #(if (#{:page :block :created-at :updated-at} %) % (get-pid db %))
                         (edn/read-string val))
                   (catch :default e
                     (js/console.error "Translating query properties failed with:" e)
                     []))
                 :query-sort-by
                 (if (#{:page :block :created-at :updated-at} val) val (get-pid db val))
                 (:logseq.color :logseq.table.headers :logseq.table.hover)
                 (:block/uuid (db-property/get-closed-value-entity-by-name db prop val))
                 :logseq.table.version
                 (parse-long val)
                 val)]))
       (into {})))

(defn- update-user-property-values [props user-page-properties prop-name->uuid property-changes]
  (->> props
       (map (fn [[prop val]]
              [prop
               (cond
                 (= :default (get-in @property-changes [prop :type :from]))
                 (str val)
                 (contains? user-page-properties prop)
                 ;; assume for now a ref's :block/name can always be translated by lc helper
                 (set (map (comp prop-name->uuid common-util/page-name-sanity-lc) val))
                 :else
                 val)]))
       (into {})))

(defn- cached-prop-name->uuid [db page-names-to-uuids k]
  (or (get page-names-to-uuids (name k))
      (get-pid db k)
      (throw (ex-info (str "No uuid found for page " (pr-str k))
                      {:page k}))))

(defn- update-block-properties*
  "Updates block property names and values and removes old built-in properties"
  [*props db page-names-to-uuids {:keys [whiteboard? property-changes]}]
  (let [prop-name->uuid (if whiteboard?
                          (fn prop-name->uuid [k]
                            (or (get-pid db k)
                                (throw (ex-info (str "No uuid found for page " (pr-str k))
                                                {:page k}))))
                          (fn prop-name->uuid [k]
                            (cached-prop-name->uuid db page-names-to-uuids k)))
        dissoced-props (into ignored-built-in-properties
                             ;; TODO: Add import support for these dissoced built-in properties
                             [:title :id :created-at :updated-at
                              :card-last-interval :card-repeats :card-last-reviewed :card-next-schedule
                              :card-ease-factor :card-last-score])
        props (apply dissoc *props dissoced-props)
        user-page-properties (set (keep (fn [[k v]] (when (set? v) k)) (apply dissoc props db-property/built-in-properties-keys)))]
    ;; TODO: Add import support for :template. Ignore for now as they cause invalid property types
    (if (contains? *props :template)
      {}
      (cond-> props
        (seq (select-keys props db-property/built-in-properties-keys))
        (update-built-in-property-values db)
        (or (seq user-page-properties) (seq @property-changes))
        (update-user-property-values user-page-properties prop-name->uuid property-changes)
        true
        (update-keys prop-name->uuid)))))

(defn- update-block-macros
  [block db page-names-to-uuids]
  (if (seq (:block/macros block))
    (update block :block/macros
            (fn [macros]
              (mapv (fn [m]
                      (-> m
                          (update :block/properties
                                  (fn [props]
                                    (update-keys props #(cached-prop-name->uuid db page-names-to-uuids %))))
                          (assoc :block/uuid (d/squuid))))
                    macros)))
    block))

(defn- update-block-properties [block db page-names-to-uuids options]
  (if (:block/pre-block? block)
  ;; FIXME: Remove when page properties are supported
    (assoc block :block/properties {})
    (update-in block [:block/properties] #(update-block-properties* % db page-names-to-uuids options))))

(defn- convert-to-db-block
  [db block tag-classes page-names-to-uuids options]
  (prn ::block block)
  (let [options' (assoc options
                        ;; map of detected property-changes
                        :property-changes (atom {}))]
    (-> block
        (update-block-macros db page-names-to-uuids)
        ;; needs to come before update-block-properties
        (update-block-refs page-names-to-uuids options')
        (update-block-properties db page-names-to-uuids options')
        (update-block-tags tag-classes page-names-to-uuids)
        add-missing-timestamps
        ;; ((fn [x] (prn :BLOCKZ x) x))
        ;; TODO: org-mode content needs to be handled
        (assoc :block/format :markdown)
        ;; TODO: pre-block? can be removed once page properties are imported
        (dissoc :block/pre-block? :block/properties-text-values :block/properties-order
                :block/invalid-properties))))

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return all non-whiteboard pages to be transacted"
  [conn *pages blocks tag-classes page-tags-uuid]
  (let [;; remove file path relative
        pages (map #(dissoc % :block/file :block/properties) *pages)
        all-pages (extract/with-ref-pages pages blocks)
        existing-pages (keep #(d/entity @conn [:block/name (:block/name %)]) all-pages)
        existing-page-names (set (map :block/name existing-pages))
        new-pages (remove #(contains? existing-page-names (:block/name %)) all-pages)
        page-names-to-uuids (into {} (map (juxt :block/name :block/uuid)
                                          (concat new-pages existing-pages)))
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
                        ;; FIXME: Remove when properties are supported
                        (assoc :block/properties {})
                        (update-page-tags tag-classes page-names-to-uuids page-tags-uuid))
                   new-pages)]
    {:pages pages
     :page-names-to-uuids page-names-to-uuids}))

(defn add-file-to-db-graph
  "Parse file and save parsed data to the given db graph. Options available:
  
* :extract-options - Options map to pass to extract/extract
* :user-options - User provided options that alter how a file is converted to db graph
* :page-tags-uuid - uuid of pageTags property
* :property-schemas - atom of property schemas inferred. Useful for tracking property schema changes
   across files"
  [conn file content {:keys [extract-options user-options page-tags-uuid property-schemas]
                      :or {property-schemas (atom {})}}]
  (let [format (common-util/get-format file)
        tag-classes (set (map string/lower-case (:tag-classes user-options)))
        extract-options' (merge {:block-pattern (common-config/get-block-pattern format)
                                 :date-formatter "MMM do, yyyy"
                                 :uri-encoded? false
                                 :db-graph-mode? true
                                 :filename-format :legacy}
                                extract-options
                                {:db @conn})
        extracted
        (cond (contains? common-config/mldoc-support-formats format)
              (extract/extract file content extract-options')

              (common-config/whiteboard? file)
              (extract/extract-whiteboard-edn file content extract-options')

              :else
              (println "Skipped file since its format is not supported:" file))
        ;; Build page and block txs
        {:keys [pages page-names-to-uuids]}
        (build-pages-tx conn (:pages extracted) (:blocks extracted) tag-classes page-tags-uuid)
        whiteboard-pages (->> pages
                              ;; support old and new whiteboards
                              (filter #(#{"whiteboard" ["whiteboard"]} (:block/type %)))
                              (map (fn [page-block]
                                     (-> page-block
                                         (assoc :block/journal? false
                                                :block/format :markdown
                                                 ;; fixme: missing properties
                                                :block/properties {(get-pid @conn :ls-type) :whiteboard-page})))))
        blocks (map #(convert-to-db-block @conn % tag-classes page-names-to-uuids
                                          {:whiteboard? (some? (seq whiteboard-pages))
                                           :property-schemas property-schemas})
                    (:blocks extracted))
        ;; Build indices
        pages-index (map #(select-keys % [:block/name]) pages)
        block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
        block-refs-ids (->> (mapcat :block/refs blocks)
                            (filter (fn [ref] (and (vector? ref)
                                                   (= :block/uuid (first ref)))))
                            (map (fn [ref] {:block/uuid (second ref)}))
                            (seq))
        ;; To prevent "unique constraint" on datascript
        block-ids (set/union (set block-ids) (set block-refs-ids))
        tx (concat whiteboard-pages pages-index pages block-ids blocks)
        tx' (common-util/fast-remove-nils tx)
        result (d/transact! conn tx')]
    result))
