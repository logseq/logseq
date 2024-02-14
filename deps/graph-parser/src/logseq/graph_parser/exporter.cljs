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

(defn- update-block-refs [block page-names-to-uuids {:keys [whiteboard?]}]
  (let [ref-to-ignore? (if whiteboard?
                         #(and (map? %) (:block/uuid %))
                         #(and (vector? %) (= :block/uuid (first %))))]
    (if (seq (:block/refs block))
      (cond-> block
        true
        (update :block/refs
                (fn [refs]
                  (mapv (fn [ref]
                          (if (ref-to-ignore? ref)
                            ref
                            (let [prop-val (get (apply dissoc (:block/properties block) ignored-built-in-properties)
                                                (keyword (:block/name ref)))
                                  get-property-type (fn get-property-type [prop prop-val]
                                                      (when (get db-property/built-in-properties prop)
                                                        (throw (ex-info (str "Must not set :block/schema for built-in property: " prop) {}
                                                                        {:property prop})))
                                                      (db-property-type/infer-property-type-from-value prop-val))]
                              (cond-> (assoc ref :block/format :markdown)
                                prop-val
                                (merge {:block/type "property"
                                        :block/schema {:type (get-property-type (keyword (:block/name ref)) prop-val)}})))))
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

(defn- update-block-properties [props db page-names-to-uuids {:keys [whiteboard?]}]
  (let [prop-name->uuid (if whiteboard?
                          (fn prop-name->uuid [k]
                            (or (get-pid db k)
                                (throw (ex-info (str "No uuid found for page " (pr-str k))
                                                {:page k}))))
                          (fn prop-name->uuid [k]
                            (or (get page-names-to-uuids (name k))
                                (get-pid db k)
                                (throw (ex-info (str "No uuid found for page " (pr-str k))
                                                {:page k})))))
        dissoced-props (into ignored-built-in-properties
                             ;; TODO: Add support for these dissoced built-in properties
                             [:title :id :created-at :updated-at :template :template-including-parent
                              :card-last-interval :card-repeats :card-last-reviewed :card-next-schedule
                              :card-ease-factor :card-last-score])]
    (cond-> (apply dissoc props dissoced-props)
      (:query-properties props)
      (update :query-properties
              (fn [val]
                (try
                  (edn/read-string val)
                  (catch :default e
                    (js/console.error "Parsing query properties failed with:" e)
                    []))))
      true
      (update-keys prop-name->uuid))))

(defn- convert-to-db-block
  [db block tag-classes page-names-to-uuids options]
  (prn ::block block)
  (let [update-block-props (fn update-block-props [props]
                             (update-block-properties props db page-names-to-uuids options))]
    (-> block
        ((fn [block']
           (if (seq (:block/macros block'))
             (update block' :block/macros
                     (fn [macros]
                       (mapv (fn [m]
                               (-> m
                                   (update :block/properties update-block-props)
                                   (assoc :block/uuid (d/squuid))))
                             macros)))
             block')))
        ;; needs to come before properties are updated
        (update-block-refs page-names-to-uuids options)
        ((fn [block']
           (if (:block/pre-block? block')
              ;; FIXME: Remove when page properties are supported
             (assoc block' :block/properties {})
             (update-in block' [:block/properties] update-block-props))))
        (update-block-tags tag-classes page-names-to-uuids)
        add-missing-timestamps
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
* :page-tags-uuid - uuid of pageTags property"
  [conn file content {:keys [extract-options user-options page-tags-uuid]}]
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
        blocks (map #(convert-to-db-block @conn % tag-classes page-names-to-uuids {:whiteboard? (some? (seq whiteboard-pages))})
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
