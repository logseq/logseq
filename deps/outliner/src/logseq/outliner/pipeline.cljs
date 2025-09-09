(ns logseq.outliner.pipeline
  "Core fns for use with frontend worker and node"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.datascript-report :as ds-report]))

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
  [db property v]
  (let [property-ent (d/entity db property)
        allowed-datetime? (and (= :datetime (:logseq.property/type property-ent))
                               ;; Only allow a few built-in properties as some built-in properties
                               ;; like :logseq.property.embedding/hnsw-label-updated-at create undesirable refs
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

(defn db-rebuild-block-refs
  "Rebuild block refs for DB graphs"
  [db block & {:keys [page-or-object?-memoized]}]
  (let [block-db-id (:db/id block)
        ;; explicit lookup in order to be nbb compatible
        properties (->
                    (->> (entity-plus/lookup-kv-then-entity (d/entity db block-db-id) :block/properties)
                         (into {}))
                    ;; both page and parent shouldn't be counted as refs
                    (dissoc :block/parent :block/page :logseq.property/created-by-ref
                            :logseq.property.history/block :logseq.property.history/property :logseq.property.history/ref-value))
        property-key-refs (->> (keys properties)
                               (remove private-built-in-props))
        page-or-object? (or page-or-object?-memoized page-or-object?-helper)
        property-value-refs (->> properties
                                 (mapcat (fn [[property v]]
                                           (cond
                                             (and (coll? v) (every? page-or-object? v))
                                             (map :db/id v)

                                             (page-or-object? v)
                                             [(:db/id v)]

                                             :else
                                             (build-journal-refs-for-datetime-properties db property v)))))
        property-refs (concat property-key-refs property-value-refs)
        content-refs (block-content-refs db block)]
    (->> (concat (map ref->eid (:block/tags block))
                 (when-let [id (:db/id (:block/link block))]
                   [id])
                 property-refs content-refs)
         distinct
         ;; Remove self-ref to avoid recursive bugs
         (remove #(or (identical? block-db-id %)
                      (identical? block-db-id (:db/id (d/entity db %)))))
         ;; Remove alias ref to avoid recursive display bugs
         (remove #(some (fn [alias-id] (identical? alias-id %)) (map :db/id (:block/alias block))))
         (remove nil?))))

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
                         (ldb/transact! conn refs-tx {:pipeline-replace? true
                                                      ::original-tx-meta (:tx-meta tx-report)}))]
    refs-tx-report))
