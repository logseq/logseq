(ns logseq.db.common.initial-data
  "Provides db helper fns for graph initialization and lazy loading entities"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.rules :as rules]))

(defn- get-pages-by-name
  [db page-name]
  (d/datoms db :avet :block/name (common-util/page-name-sanity-lc page-name)))

(defn get-first-page-by-name
  "Return the oldest page's db id for :block/name"
  [db page-name]
  (when (and db (string? page-name))
    (first (sort (map :e (get-pages-by-name db page-name))))))

(defn get-first-page-by-title
  "Return the oldest page's db id for :block/title"
  [db page-name]
  {:pre [(string? page-name)]}
  (->> (d/datoms db :avet :block/title page-name)
       (filter (fn [d]
                 (let [e (d/entity db (:e d))]
                   (common-entity-util/page? e))))
       (map :e)
       sort
       first))

(defn get-block-alias
  [db eid]
  (->>
   (d/q
    '[:find [?e ...]
      :in $ ?eid %
      :where
      (alias ?eid ?e)]
    db
    eid
    (:alias rules/rules))
   distinct))

(comment
  (defn- get-built-in-files
    [db]
    (let [files ["logseq/config.edn"
                 "logseq/custom.css"
                 "logseq/custom.js"]]
      (map #(d/pull db '[*] [:file/path %]) files))))

(defn- get-all-files
  [db]
  (->> (d/datoms db :avet :file/path)
       (mapcat (fn [e] (d/datoms db :eavt (:e e))))))

(defn- with-block-refs
  [db block]
  (update block :block/refs (fn [refs] (map (fn [ref] (d/pull db '[*] (:db/id ref))) refs))))

(defn with-parent
  [db block]
  (cond
    (:block/page block)
    (let [parent (when-let [e (d/entity db (:db/id (:block/parent block)))]
                   (select-keys e [:db/id :block/uuid]))]
      (->>
       (assoc block :block/parent parent)
       (common-util/remove-nils-non-nested)
       (with-block-refs db)))

    :else
    block))

(comment
  (defn- with-block-link
    [db block]
    (if (:block/link block)
      (update block :block/link (fn [link] (d/pull db '[*] (:db/id link))))
      block)))

(defn- mark-block-fully-loaded
  [b]
  (assoc b :block.temp/fully-loaded? true))

(comment
  (defn- property-without-db-attrs
    [property]
    (dissoc property :db/index :db/valueType :db/cardinality))

  (defn- property-with-values
    [db block properties]
    (when (entity-plus/db-based-graph? db)
      (let [block (d/entity db (:db/id block))
            property-vals (if properties
                            (map block properties)
                            (vals (:block/properties block)))]
        (->> property-vals
             (mapcat
              (fn [property-values]
                (let [values (->>
                              (if (and (coll? property-values)
                                       (map? (first property-values)))
                                property-values
                                #{property-values}))
                      value-ids (when (every? map? values)
                                  (->> (map :db/id values)
                                       (filter (fn [id] (or (int? id) (keyword? id))))))
                      value-blocks (->>
                                    (when (seq value-ids)
                                      (map
                                       (fn [id] (d/pull db '[:db/id :block/uuid
                                                             :block/name :block/title
                                                             :logseq.property/value
                                                             :block/tags :block/page
                                                             :logseq.property/created-from-property] id))
                                       value-ids))
                                  ;; FIXME: why d/pull returns {:db/id db-ident} instead of {:db/id number-eid}?
                                    (keep (fn [block]
                                            (let [from-property-id (get-in block [:logseq.property/created-from-property :db/id])]
                                              (if (keyword? from-property-id)
                                                (assoc-in block [:logseq.property/created-from-property :db/id] (:db/id (d/entity db from-property-id)))
                                                block)))))]
                  value-blocks))))))))

(defn get-block-children-ids
  "Returns children UUIDs"
  [db block-uuid]
  (when-let [eid (:db/id (d/entity db [:block/uuid block-uuid]))]
    (let [seen   (volatile! [])]
      (loop [steps          100      ;check result every 100 steps
             eids-to-expand [eid]]
        (when (seq eids-to-expand)
          (let [eids-to-expand*
                (mapcat (fn [eid] (map first (d/datoms db :avet :block/parent eid))) eids-to-expand)
                uuids-to-add (remove nil? (map #(:block/uuid (d/entity db %)) eids-to-expand*))]
            (when (and (zero? steps)
                       (seq (set/intersection (set @seen) (set uuids-to-add))))
              (throw (ex-info "bad outliner data, need to re-index to fix"
                              {:seen @seen :eids-to-expand eids-to-expand})))
            (vswap! seen (partial apply conj) uuids-to-add)
            (recur (if (zero? steps) 100 (dec steps)) eids-to-expand*))))
      @seen)))

(defn get-block-children
  "Including nested children."
  [db block-uuid]
  (let [ids (get-block-children-ids db block-uuid)]
    (when (seq ids)
      (let [ids' (map (fn [id] [:block/uuid id]) ids)]
        (d/pull-many db '[*] ids')))))

(defn- with-raw-title
  [m entity]
  (if-let [raw-title (:block/raw-title entity)]
    (assoc m :block/title raw-title)
    m))

(defn- entity->map
  [entity]
  (-> (into {} entity)
      (with-raw-title entity)
      (assoc :db/id (:db/id entity))))

(defn hidden-ref?
  "Whether ref-block (for block with the `id`) should be hidden."
  [db ref-block id]
  (let [db-based? (entity-plus/db-based-graph? db)]
    (if db-based?
      (let [entity (d/entity db id)]
        (or
         (= (:db/id ref-block) id)
         (= id (:db/id (:block/page ref-block)))
         (= id (:db/id (:logseq.property/view-for ref-block)))
         (entity-util/hidden? (:block/page ref-block))
         (entity-util/hidden? ref-block)
         (contains? (set (map :db/id (:block/tags ref-block))) (:db/id entity))
         (some? (get ref-block (:db/ident entity)))))
      (or
       (= (:db/id ref-block) id)
       (= id (:db/id (:block/page ref-block)))))))

(defn get-block-refs-count
  [db id]
  (or
   (let [with-alias (->> (get-block-alias db id)
                         (cons id)
                         distinct)]
     (some->> with-alias
              (map #(d/entity db %))
              (mapcat :block/_refs)
              (remove (fn [ref-block] (hidden-ref? db ref-block id)))
              count))
   0))

(defn ^:large-vars/cleanup-todo get-block-and-children
  [db id-or-page-name {:keys [children? children-only? nested-children? properties children-props]}]
  (let [block (let [eid (cond (uuid? id-or-page-name)
                              [:block/uuid id-or-page-name]
                              (integer? id-or-page-name)
                              id-or-page-name
                              :else nil)]
                (cond
                  eid
                  (d/entity db eid)
                  (string? id-or-page-name)
                  (d/entity db (get-first-page-by-name db (name id-or-page-name)))
                  :else
                  nil))
        block-refs-count? (some #{:block.temp/refs-count} properties)
        whiteboard? (common-entity-util/whiteboard? block)]
    (when block
      (let [children (when (or children? children-only?)
                       (let [page? (common-entity-util/page? block)
                             children (->>
                                       (cond
                                         (and nested-children? (not page?))
                                         (get-block-children db (:block/uuid block))
                                         nested-children?
                                         (:block/_page block)
                                         :else
                                         (let [short-page? (when page?
                                                             (<= (count (:block/_page block)) 100))]
                                           (if short-page?
                                             (:block/_page block)
                                             (:block/_parent block))))
                                       (remove (fn [e] (or (:logseq.property/created-from-property e)
                                                           (:block/closed-value-property e)))))
                             children-props (if whiteboard?
                                              '[*]
                                              (or children-props
                                                  [:db/id :block/uuid :block/parent :block/order :block/collapsed? :block/title
                                                   ;; pre-loading feature-related properties to avoid UI refreshing
                                                   :logseq.property/status :logseq.property.node/display-type]))]
                         (map
                          (fn [block]
                            (if (= children-props '[*])
                              (entity->map block)
                              (-> (select-keys block children-props)
                                  (with-raw-title block)
                                  (assoc :block.temp/has-children? (some? (:block/_parent block))))))
                          children)))]
        (if children-only?
          {:children children}
          (let [block' (if (seq properties)
                         (-> (select-keys block properties)
                             (with-raw-title block)
                             (assoc :db/id (:db/id block)))
                         (entity->map block))
                block' (cond->
                        (mark-block-fully-loaded block')
                         true
                         (update-vals (fn [v]
                                        (cond
                                          (de/entity? v)
                                          (entity->map v)
                                          (and (coll? v) (every? de/entity? v))
                                          (map entity->map v)

                                          :else
                                          v)))
                         block-refs-count?
                         (assoc :block.temp/refs-count (get-block-refs-count db (:db/id block))))]
            (cond->
             {:block block'}
              children?
              (assoc :children children))))))))

(defn get-latest-journals
  [db]
  (let [today (date-time-util/date->int (js/Date.))]
    (->> (d/datoms db :avet :block/journal-day)
         vec
         rseq
         (keep (fn [d]
                 (and (<= (:v d) today)
                      (let [e (d/entity db (:e d))]
                        (when (and (common-entity-util/journal? e) (:db/id e))
                          e))))))))

(defn- get-structured-datoms
  [db]
  (let [class-property-id (:db/id (d/entity db :logseq.class/Property))]
    (->> (concat
          (d/datoms db :avet :block/tags :logseq.class/Tag)
          (d/datoms db :avet :block/tags :logseq.class/Property)
          (d/datoms db :avet :block/closed-value-property))
         (mapcat (fn [d]
                   (let [block-datoms (d/datoms db :eavt (:e d))
                         properties-of-property-datoms
                         (when (= (:v d) class-property-id)
                           (concat
                            (when-let [desc (:logseq.property/description (d/entity db (:e d)))]
                              (d/datoms db :eavt (:db/id desc)))
                            (when-let [desc (:logseq.property/default-value (d/entity db (:e d)))]
                              (d/datoms db :eavt (:db/id desc)))))]
                     (if (seq properties-of-property-datoms)
                       (concat block-datoms properties-of-property-datoms)
                       block-datoms)))))))

(defn- get-favorites
  "Favorites page and its blocks"
  [db]
  (let [page-id (get-first-page-by-name db common-config/favorites-page-name)
        block (d/entity db page-id)
        children (:block/_page block)]
    (when block
      (concat (d/datoms db :eavt (:db/id block))
              (->> (keep :block/link children)
                   (mapcat (fn [l]
                             (d/datoms db :eavt (:db/id l)))))
              (mapcat (fn [child]
                        (d/datoms db :eavt (:db/id child)))
                      children)))))

(defn- get-views-data
  [db]
  (let [page-id (get-first-page-by-name db common-config/views-page-name)
        children (when page-id (:block/_parent (d/entity db page-id)))]
    (when (seq children)
      (into
       (mapcat (fn [b] (d/datoms db :eavt (:db/id b)))
               children)
       (d/datoms db :eavt page-id)))))

(defn get-recent-updated-pages
  [db]
  (some->>
   (d/datoms db :avet :block/updated-at)
   rseq
   (keep (fn [datom]
           (let [e (d/entity db (:e datom))]
             (when (and (common-entity-util/page? e) (not (entity-util/hidden? e)))
               e))))
   (take 30)))

(defn get-initial-data
  "Returns current database schema and initial data.
   NOTE: This fn is called by DB and file graphs"
  [db]
  (let [db-graph? (entity-plus/db-based-graph? db)
        _ (when db-graph?
            (reset! db-order/*max-key (db-order/get-max-order db)))
        schema (:schema db)
        idents (mapcat (fn [id]
                         (when-let [e (d/entity db id)]
                           (d/datoms db :eavt (:db/id e))))
                       [:logseq.kv/db-type
                        :logseq.kv/schema-version
                        :logseq.kv/graph-uuid
                        :logseq.kv/latest-code-lang
                        :logseq.kv/graph-backup-folder
                        :logseq.property/empty-placeholder])
        favorites (when db-graph? (get-favorites db))
        views (when db-graph? (get-views-data db))
        all-files (get-all-files db)
        structured-datoms (when db-graph?
                            (get-structured-datoms db))
        recent-updated-pages (let [pages (get-recent-updated-pages db)]
                               (mapcat (fn [p] (d/datoms db :eavt (:db/id p))) pages))
        pages-datoms (if db-graph?
                       (let [contents-id (get-first-page-by-title db "Contents")
                             views-id (get-first-page-by-title db common-config/views-page-name)]
                         (mapcat #(d/datoms db :eavt %)
                                 (remove nil? [contents-id views-id])))
                       ;; load all pages for file graphs
                       (->> (d/datoms db :avet :block/name)
                            (mapcat (fn [d] (d/datoms db :eavt (:e d))))))
        data (distinct
              (concat idents
                      structured-datoms
                      favorites
                      recent-updated-pages
                      views
                      all-files
                      pages-datoms))]
    {:schema schema
     :initial-data data}))
