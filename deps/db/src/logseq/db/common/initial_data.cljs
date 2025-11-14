(ns logseq.db.common.initial-data
  "Provides db helper fns for graph initialization and lazy loading entities"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.rules :as rules]))

;; FIXME: For DB graph built-in pages, look up by name -> uuid like
;; get-built-in-page instead of this approach which is more error prone
(defn get-first-page-by-name
  "Return the oldest page's db id for :block/name"
  [db page-name]
  (when (and db (string? page-name))
    (first (sort (map :e (entity-util/get-pages-by-name db page-name))))))

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

(defn get-block-children-ids
  "Returns children UUIDs, notice the result doesn't include property value children ids."
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
  "Including nested children, notice the result doesn't include property values."
  {:arglists '([db block-uuid & {:keys [include-collapsed-children?]}])}
  [db block-uuid & {:as opts}]
  (let [ids (get-block-children-ids db block-uuid opts)]
    (when (seq ids)
      (map (fn [id] (d/entity db [:block/uuid id])) ids))))

(defn get-block-full-children-ids
  "Including nested, collapsed and property value children."
  {:arglists '([db block-uuid])}
  [db block-uuid]
  (d/q
   '[:find [?c ...]
     :in $ ?id %
     :where
     [?p :block/uuid ?id]
     (parent ?p ?c)]
   db
   block-uuid
   (:parent rules/rules)))

(defn- with-raw-title
  [m entity]
  (if-let [raw-title (:block/raw-title entity)]
    (assoc m :block/title raw-title)
    m))

(defn- entity->map
  [entity & {:keys [level properties]
             :or {level 0}}]
  (let [opts {:level (inc level)}
        f (if (> level 0)
            identity
            (fn [e]
              (keep (fn [[k v]]
                      (when (or (empty? properties) (properties k))
                        (let [v' (cond
                                   (= k :block/parent)
                                   (:db/id v)
                                   (= k :block/tags)
                                   (map #(select-keys % [:db/id]) v)
                                   (= k :logseq.property/created-by-ref)
                                   (:db/id v)
                                   (de/entity? v)
                                   (entity->map v opts)
                                   (and (coll? v) (every? de/entity? v))
                                   (map #(entity->map % opts) v)
                                   :else
                                   v)]
                          [k v'])))
                    e)))
        m (->> (f entity)
               (into {}))]
    (-> m
        (with-raw-title entity)
        (assoc :db/id (:db/id entity)))))

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

(defn get-block-refs
  [db id]
  (let [with-alias (->> (get-block-alias db id)
                        (cons id)
                        distinct)]
    (some->> with-alias
             (map #(d/entity db %))
             (mapcat :block/_refs)
             (remove (fn [ref-block] (hidden-ref? db ref-block id))))))

(defn get-block-refs-count
  [db id]
  (count (get-block-refs db id)))

(defn ^:large-vars/cleanup-todo get-block-and-children
  [db id-or-page-name {:keys [children? properties include-collapsed-children?]
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
        block-refs-count? (some #{:block.temp/refs-count} properties)]
    (when block
      ;; (prn :debug :get-block (:db/id block) (:block/title block) :children? children?
      ;;      :include-collapsed-children? include-collapsed-children?)
      (let [children (when children?
                       (let [children-blocks (get-block-children db (:block/uuid block) {:include-collapsed-children? include-collapsed-children?})
                             large-page? (>= (count children-blocks) 100)
                             children (let [children' (if large-page?
                                                        (:block/_parent block)
                                                        children-blocks)]
                                        (->> children'
                                             (remove (fn [e] (:block/closed-value-property e)))))
                             children-ids (set (map :db/id children))]
                         (map
                          (fn [block]
                            (let [collapsed? (:block/collapsed? block)]
                              (-> block
                                  (entity->map)
                                  (assoc :block.temp/has-children? (some? (:block/_parent block))
                                         :block.temp/load-status (if (and (not collapsed?)
                                                                          (or (and large-page?
                                                                                   (every? children-ids (map :db/id (:block/_parent block))))
                                                                              (not large-page?)))
                                                                   :full
                                                                   :self)))))
                          children)))
            block' (cond-> (entity->map block {:properties (set properties)})
                     block-refs-count?
                     (assoc :block.temp/refs-count (get-block-refs-count db (:db/id block)))
                     true
                     (assoc :block.temp/load-status (cond
                                                      (and children? include-collapsed-children? (empty? properties))
                                                      :full
                                                      (and children? (empty? properties))
                                                      :children
                                                      :else
                                                      :self)))]
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
                 (when (<= (:v d) today)
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
                           (when-let [desc (:logseq.property/default-value (d/entity db (:e d)))]
                             (d/datoms db :eavt (:db/id desc))))]
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

(defn get-recent-updated-pages
  [db]
  (when db
    (some->>
     (d/datoms db :avet :block/updated-at)
     rseq
     (keep (fn [datom]
             (let [page (first (d/datoms db :eavt (:e datom) :block/page))]
               (when-not (or page
                             (let [title (:v (first (d/datoms db :eavt (:e datom) :block/title)))]
                               (string/blank? title)))
                 (let [e (d/entity db (:e datom))]
                   (when (and
                          (common-entity-util/page? e)
                          (not (entity-util/hidden? e)))
                     e))))))
     (take 15))))

(defn- get-all-user-datoms
  [db]
  (when (d/entity db :logseq.property.user/email)
    (mapcat
     (fn [d]
       (d/datoms db :eavt (:e d)))
     (d/datoms db :avet :logseq.property.user/email))))

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
                        :logseq.kv/graph-text-embedding-model-name
                        :logseq.property/empty-placeholder])
        favorites (when db-graph? (get-favorites db))
        recent-updated-pages (let [pages (get-recent-updated-pages db)]
                               (mapcat (fn [p] (d/datoms db :eavt (:db/id p))) pages))
        all-files (get-all-files db)
        structured-datoms (when db-graph?
                            (get-structured-datoms db))
        user-datoms (get-all-user-datoms db)
        pages-datoms (if db-graph?
                       (let [contents-id (get-first-page-by-title db "Contents")
                             capture-page-id (:db/id (db-db/get-built-in-page db common-config/quick-add-page-name))
                             views-id (get-first-page-by-title db common-config/views-page-name)]
                         (mapcat #(d/datoms db :eavt %)
                                 (remove nil? [contents-id capture-page-id views-id])))
                       ;; load all pages for file graphs
                       (->> (d/datoms db :avet :block/name)
                            (mapcat (fn [d] (d/datoms db :eavt (:e d))))))
        data (->> (concat idents
                          structured-datoms
                          user-datoms
                          favorites
                          recent-updated-pages
                          all-files
                          pages-datoms)
                  distinct
                  (remove (fn [d]
                            (contains? #{:block/created-at :block/updated-at
                                         :block/tx-id :logseq.property/created-by-ref}
                                       (:a d)))))]
    {:schema schema
     :initial-data data}))
