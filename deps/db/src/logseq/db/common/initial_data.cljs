(ns logseq.db.common.initial-data
  "Provides db helper fns for graph initialization and lazy loading entities"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
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
  [db block-uuid & {:keys [include-collapsed-children?]
                    :or {include-collapsed-children? true}}]
  (when-let [eid (:db/id (d/entity db [:block/uuid block-uuid]))]
    (let [seen (volatile! #{})]
      (loop [eids-to-expand [eid]]
        (when (seq eids-to-expand)
          (let [children
                (mapcat (fn [eid]
                          (let [e (d/entity db eid)]
                            (when (or include-collapsed-children?
                                      (not (:block/collapsed? e))
                                      (common-entity-util/page? e))

                              (:block/_parent e)))) eids-to-expand)
                uuids-to-add (keep :block/uuid children)]
            (vswap! seen (partial apply conj) uuids-to-add)
            (recur (keep :db/id children)))))
      @seen)))

(defn get-block-children
  "Including nested children."
  {:arglists '([db block-uuid & {:keys [include-collapsed-children?]}])}
  [db block-uuid & {:as opts}]
  (let [ids (get-block-children-ids db block-uuid opts)]
    (when (seq ids)
      (map (fn [id] (d/entity db [:block/uuid id])) ids))))

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
         (and (entity-util/class? entity)
              (let [children (db-class/get-structured-children db id)
                    class-ids (set (conj children id))]
                (some class-ids (map :db/id (:block/tags ref-block)))))
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

(defn- update-entity->map
  [m]
  (update-vals m (fn [v]
                   (cond
                     (de/entity? v)
                     (entity->map v)
                     (and (coll? v) (every? de/entity? v))
                     (map entity->map v)
                     :else
                     v))))

(defn ^:large-vars/cleanup-todo get-block-and-children
  [db id-or-page-name {:keys [children? children-props include-collapsed-children?
                              properties]
                       :or {include-collapsed-children? false}}]
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
      (let [children (when children?
                       (let [children (let [children (get-block-children db (:block/uuid block) {:include-collapsed-children? include-collapsed-children?})
                                            children' (if (>= (count children) 100)
                                                        (:block/_parent block)
                                                        children)]
                                        (->> children'
                                             (remove (fn [e] (:block/closed-value-property e)))))
                             children-props (if whiteboard?
                                              '[*]
                                              (or children-props
                                                  [:db/id :block/uuid :block/parent :block/order :block/collapsed? :block/title
                                                   ;; pre-loading feature-related properties to avoid UI refreshing
                                                   :logseq.property/status :logseq.property.node/display-type :block/tags :block/refs]))]
                         (map
                          (fn [block]
                            (-> (if (= children-props '[*])
                                  block
                                  (-> (select-keys block children-props)
                                      (with-raw-title block)
                                      (assoc :block.temp/has-children? (some? (:block/_parent block)))))
                                update-entity->map
                                (dissoc :block/path-refs)))
                          children)))
            block' (if (seq properties)
                     (-> (select-keys block properties)
                         (with-raw-title block)
                         (assoc :db/id (:db/id block)))
                     (entity->map block))
            block' (cond->
                    block'
                     true
                     update-entity->map
                     true
                     (dissoc :block/path-refs)
                     block-refs-count?
                     (assoc :block.temp/refs-count (get-block-refs-count db (:db/id block))))]
        (cond->
         {:block block'}
          children?
          (assoc :children children))))))

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
