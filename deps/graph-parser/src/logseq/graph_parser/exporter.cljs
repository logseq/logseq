(ns logseq.graph-parser.exporter
  "Exports a file graph to DB graph. Used by the File to DB graph importer"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]))

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

(defn- update-block-tags
  [block tag-classes]
  (if (seq (:block/tags block))
    (-> block
        (update :block/content
                db-content/content-without-tags
                (->> (:block/tags block)
                     (filter #(tag-classes (:block/name %)))
                     (map :block/original-name)))
        (update :block/content
                db-content/replace-tags-with-page-refs
                (remove #(tag-classes (:block/name %))
                        (:block/tags block)))
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

(defn- update-imported-block
  [conn block tag-classes]
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
        (update-block-tags tag-classes)
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

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return all non-whiteboard pages to be transacted"
  [conn *pages blocks tag-classes page-tags-uuid]
  (let [;; remove file path relative
        pages (map #(dissoc % :block/file :block/properties) *pages)
        all-pages (extract/with-ref-pages pages blocks)
        existing-pages (keep #(d/entity @conn [:block/name (:block/name %)]) all-pages)
        existing-page-names (set (map :block/name existing-pages))
        new-pages (remove #(contains? existing-page-names (:block/name %)) all-pages)
        names-uuids (into {} (map (juxt :block/name :block/uuid)
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
                        (update-page-tags tag-classes names-uuids page-tags-uuid))
                   new-pages)]
                   pages))

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
        {:keys [refs] :as extracted}
        (cond (contains? common-config/mldoc-support-formats format)
              (extract/extract file content extract-options')

              (common-config/whiteboard? file)
              (extract/extract-whiteboard-edn file content extract-options')

              :else
              (println "Skipped file since its format is not supported:" file))
        ;; Build page and block txs
        pages (build-pages-tx conn (:pages extracted) (:blocks extracted) tag-classes page-tags-uuid)
        whiteboard-pages (->> pages
                              (filter #(= "whiteboard" (:block/type %)))
                              (map (fn [page-block]
                                     (-> page-block
                                         (assoc :block/journal? false
                                                :block/format :markdown
                                                      ;; fixme: missing properties
                                                :block/properties {(get-pid @conn :ls-type) :whiteboard-page})))))
        blocks (map #(update-imported-block conn % tag-classes) (:blocks extracted))
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
        tx (concat refs whiteboard-pages pages-index pages block-ids blocks)
        tx' (common-util/fast-remove-nils tx)
        result (d/transact! conn tx')]
    result))
