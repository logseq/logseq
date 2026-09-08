(ns logseq.outliner.pipeline
  "Core fns for use with frontend worker and node"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.datascript-report :as ds-report]
            [clojure.set :as set]))

(defn filter-deleted-blocks
  [datoms]
  (keep
   (fn [d]
     (when (and (= :block/uuid (:a d)) (false? (:added d)))
       {:db/id (:e d)
        :block/uuid (:v d)}))
   datoms))

(defn- ref->eid
  "ref: entity, map, int, eid"
  [ref]
  (cond
    (:db/id ref)
    (:db/id ref)

    (:block/uuid ref)
    [:block/uuid (:block/uuid ref)]

    (and (vector? ref)
         (= (count ref) 2)
         (= :block/uuid (first ref)))
    [:block/uuid (second ref)]

    (int? ref)
    ref

    :else (throw (js/Error. (str "invalid ref " ref)))))

(defn block-content-refs
  "Return ref block ids for given block"
  [db block]
  (let [content (or (:block/raw-title block)
                    (:block/title block))]
    (when (string? content)
      (->> (db-content/get-matched-ids content)
           (map (fn [id]
                  (when-let [e (d/entity db [:block/uuid id])]
                    (:db/id e))))))))

(defn ^:api get-journal-day-from-long
  [db v]
  (when v
    (let [day (date-time-util/ms->journal-day v)]
      (:e (first (d/datoms db :avet :block/journal-day day))))))

(def ^:private private-built-in-props (set (keep (fn [[k v]] (when-not (get-in v [:schema :public?]) k))
                                                 db-property/built-in-properties)))

(defn- build-journal-refs-for-datetime-properties
  "For a given property pair, builds a coll of journal refs for select built-in
  :datetime properties and all user :datetime properties. Otherwise returns nil"
  [db property-ent v]
  (let [allowed-datetime? (and (= :datetime (:logseq.property/type property-ent))
                               ;; Only allow a few built-in properties as some built-in properties
                               ;; can create undesirable refs
                               (if (db-property/internal-property? (:db/ident property-ent))
                                 (contains? #{:logseq.property/scheduled :logseq.property/deadline} (:db/ident property-ent))
                                 ;; All user properties are allowed to create refs but not plugin properties
                                 (not (db-property/plugin-property? (:db/ident property-ent)))))]
    (cond
      (and allowed-datetime? (coll? v))
      (keep #(get-journal-day-from-long db %) v)

      allowed-datetime?
      (when-let [journal-day (get-journal-day-from-long db v)]
        [journal-day])

      :else
      nil)))

(defn ^:api page-or-object?-helper
  [block]
  (and (de/entity? block)
       (or (ldb/page? block)
           (ldb/object? block))
       ;; Don't allow :default property value objects to reference their
       ;; parent block as they are dependent on their block for display
       ;; and look weirdly recursive - https://github.com/logseq/db-test/issues/36
       (not (:logseq.property/created-from-property block))))

(defonce ^:private non-ref-properties
  (set/union private-built-in-props
             #{:logseq.property/query :logseq.property.publish/published-url :logseq.property/exclude-from-graph-view}))

(defn- block-refs
  [db block properties page-or-object? property-entity]
  (let [block-db-id (:db/id block)
        alias-ids (into #{} (map :db/id) (:block/alias block))
        property-key-refs (->> (keys properties)
                               (keep (fn [ident]
                                       (:db/id (property-entity ident)))))
        property-value-refs (->> properties
                                 (mapcat (fn [[property v]]
                                           (cond
                                             (and (coll? v) (every? page-or-object? v))
                                             (map :db/id v)

                                             (page-or-object? v)
                                             [(:db/id v)]

                                             :else
                                             (build-journal-refs-for-datetime-properties db (property-entity property) v)))))
        property-refs (concat property-key-refs property-value-refs)
        content-refs (block-content-refs db block)]
    (->> (concat (map ref->eid (:block/tags block))
                 (when-let [id (:db/id (:block/link block))]
                   [id])
                 property-refs content-refs)
         distinct
         ;; Remove self-ref to avoid recursive bugs
         (remove #(or (nil? %)
                      (identical? block-db-id %)
                      (and (not (int? %))
                           (identical? block-db-id (:db/id (d/entity db %))))
                      ;; Remove alias refs to avoid recursive display bugs.
                      (contains? alias-ids %))))))

(defn db-rebuild-block-refs
  "Rebuild block refs for DB graphs, should returns ids"
  [db block & {:keys [page-or-object?-memoized]}]
  (let [properties (into {}
                         (remove (fn [[k _]] (non-ref-properties k)))
                         (entity-plus/lookup-kv-then-entity (d/entity db (:db/id block)) :block/properties))]
    (block-refs db block properties
                (or page-or-object?-memoized page-or-object?-helper)
                #(d/entity db %))))

(defn db-rebuild-block-refs-fn
  "Returns a ref builder for a bulk pass over the immutable `db`.
  Reads ref-producing properties once and shares entity lookups within the pass."
  [db]
  (let [entity (memoize #(d/entity db %))
        property-entities (into {}
                                (keep (fn [datom]
                                        (let [ident (:v datom)]
                                          (when (and (db-property/property? ident)
                                                     (not (non-ref-properties ident)))
                                            [ident (entity (:e datom))]))))
                                (d/datoms db :avet :db/ident))
        properties-by-id
        (reduce-kv
         (fn [result ident _]
           (let [schema (get (:schema db) ident)
                 many? (= :db.cardinality/many (:db/cardinality schema))
                 ref? (= :db.type/ref (:db/valueType schema))]
             (reduce (fn [result datom]
                       (let [v (if ref? (entity (:v datom)) (:v datom))]
                         (if many?
                           (update-in result [(:e datom) ident] (fnil conj #{}) v)
                           (assoc-in result [(:e datom) ident] v))))
                     result
                     (d/datoms db :aevt ident))))
         {}
         property-entities)
        page-or-object? (memoize page-or-object?-helper)]
    (fn [block]
      (block-refs db block (get properties-by-id (:db/id block))
                  page-or-object? property-entities))))

(defn- rebuild-block-refs-tx
  [{:keys [db-after]} blocks]
  (mapcat (fn [block]
            (when (d/entity db-after (:db/id block))
              (let [refs (db-rebuild-block-refs db-after block)]
                (when (seq refs)
                  [[:db/retract (:db/id block) :block/refs]
                   {:db/id (:db/id block)
                    :block/refs refs}]))))
          blocks))

(defn transact-new-db-graph-refs
  "Transacts :block/refs for a new or imported DB graph"
  [conn tx-report]
  (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
        refs-tx-report (when-let [refs-tx (and (seq blocks) (rebuild-block-refs-tx tx-report blocks))]
                         (ldb/transact! conn refs-tx (-> (:tx-meta tx-report)
                                                         (assoc :transact-new-graph-refs? true))))]
    refs-tx-report))
