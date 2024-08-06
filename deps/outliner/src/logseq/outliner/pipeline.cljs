(ns logseq.outliner.pipeline
  "Core fns for use with frontend worker and node"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [clojure.set :as set]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.entity-plus :as entity-plus]))

(defn filter-deleted-blocks
  [datoms]
  (keep
   (fn [d]
     (when (and (= :block/uuid (:a d)) (false? (:added d)))
       (:v d)))
   datoms))

(defn- calculate-children-refs
  [db-after children new-refs]
  (let [;; Builds map of children ids to their parent id and :block/refs ids
        children-maps (into {}
                            (keep (fn [id]
                                    (when-let [entity (d/entity db-after [:block/uuid id])]
                                      (let [from-property (:logseq.property/created-from-property entity)
                                            default? (= :default (get-in from-property [:block/schema :type]))
                                            page? (ldb/page? entity)]
                                        (when-not (or page? (and from-property (not default?)))
                                          [(:db/id entity)
                                           {:parent-id (get-in entity [:block/parent :db/id])
                                            :block-ref-ids (map :db/id (:block/refs entity))}]))))
                                  children))
        children-refs (map (fn [[id {:keys [block-ref-ids] :as child-map}]]
                             {:db/id id
                              ;; Recalculate :block/path-refs as db contains stale data for this attribute
                              :block/path-refs
                              (set/union
                               ;; Refs from top-level parent
                               new-refs
                               ;; Refs from current block
                               block-ref-ids
                               ;; Refs from parents in between top-level
                               ;; parent and current block
                               (loop [parent-refs #{}
                                      parent-id (:parent-id child-map)]
                                 (if-let [parent (children-maps parent-id)]
                                   (recur (into parent-refs (:block-ref-ids parent))
                                          (:parent-id parent))
                                   ;; exits when top-level parent is reached
                                   parent-refs)))})
                           children-maps)]
    children-refs))

;; TODO: it'll be great if we can calculate the :block/path-refs before any
;; outliner transaction, this way we can group together the real outliner tx
;; and the new path-refs changes, which makes both undo/redo and
;; react-query/refresh! easier.

;; TODO: also need to consider whiteboard transactions

;; Steps:
;; 1. For each changed block, new-refs = its page + :block/refs + parents :block/refs
;; 2. Its children' block/path-refs might need to be updated too.
(defn- compute-block-path-refs
  [{:keys [db-before db-after]} blocks*]
  (let [*computed-ids (atom #{})
        blocks (remove (fn [block]
                         (let [from-property (:logseq.property/created-from-property block)
                               default? (= :default (get-in from-property [:block/schema :type]))]
                           (and from-property (not default?))))
                       blocks*)]
    (->>
     (mapcat (fn [block]
               (when-not (@*computed-ids (:block/uuid block))
                 (let [page? (ldb/page? block)
                       from-property (:logseq.property/created-from-property block)
                       parents (when-not page?
                                 (ldb/get-block-parents db-after (:block/uuid block) {}))
                       parents-refs (->> (cond->>
                                          (mapcat :block/path-refs parents)
                                           from-property
                                           (remove (fn [parent] (and (ldb/property? parent) (not= (:db/id parent) (:db/id from-property))))))
                                         (map :db/id))
                       old-refs (if db-before
                                  (set (map :db/id (:block/path-refs (d/entity db-before (:db/id block)))))
                                  #{})
                       new-refs (set (concat
                                      (some-> (:db/id (:block/page block)) vector)
                                      (map :db/id (:block/refs block))
                                      parents-refs))
                       refs-changed? (not= old-refs new-refs)
                       children (when refs-changed?
                                  (when-not page?
                                    (ldb/get-block-children-ids db-after (:block/uuid block))))
                       children-refs (when children
                                       (calculate-children-refs db-after children new-refs))]
                   (swap! *computed-ids set/union (set (cons (:block/uuid block) children)))
                   (concat
                    (when (and (seq new-refs) refs-changed? (d/entity db-after (:db/id block)))
                      [{:db/id (:db/id block)
                        :block/path-refs new-refs}])
                    children-refs))))
             blocks)
     distinct)))

(defn compute-block-path-refs-tx
  "Main fn for computing path-refs"
  [tx-report blocks]
  (let [refs-tx (compute-block-path-refs tx-report blocks)
        truncate-refs-tx (map (fn [m] [:db/retract (:db/id m) :block/path-refs]) refs-tx)]
    (concat truncate-refs-tx refs-tx)))

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
      (->> (db-content/get-matched-special-ids content)
           (map (fn [id]
                  (when-let [e (d/entity db [:block/uuid id])]
                    (:db/id e))))))))

(defn db-rebuild-block-refs
  "Rebuild block refs for DB graphs"
  [db block]
  (let [private-built-in-props (set (keep (fn [[k v]] (when-not (get-in v [:schema :public?]) k))
                                          db-property/built-in-properties))
        ;; explicit lookup in order to be nbb compatible
        properties (->> (entity-plus/lookup-kv-then-entity (d/entity db (:db/id block)) :block/properties)
                        (into {}))
        property-key-refs (->> (keys properties)
                               (remove private-built-in-props))
        page-or-object? (fn [block] (and (de/entity? block)
                                         (or (ldb/page? block)
                                             (seq (:block/tags block)))))
        property-value-refs (->> (vals properties)
                                 (mapcat (fn [v]
                                           (cond
                                             (page-or-object? v)
                                             [(:db/id v)]

                                             (and (coll? v) (every? page-or-object? v))
                                             (map :db/id v)

                                             :else
                                             nil))))
        property-refs (concat property-key-refs property-value-refs)
        content-refs (block-content-refs db block)]
    (->> (concat (map ref->eid (:block/tags block))
                 (when-let [id (:db/id (:block/link block))]
                   [id])
                 property-refs content-refs)
         ;; Remove self-ref to avoid recursive bugs
         (remove #(or (= (:db/id block) %) (= (:db/id block) (:db/id (d/entity db %)))))
         ;; Remove alias ref to avoid recursive display bugs
         (remove #(contains? (set (map :db/id (:block/alias block))) %))
         (remove nil?))))
