(ns logseq.graph-parser.db-pipeline
  "This ns provides a datascript listener for DB graphs to add additional changes
   that the frontend also adds per transact.
   Known limitations:
   * Deleted blocks don't update effected :block/tx-id"
  (:require [datascript.core :as d]
            [clojure.set :as set]
            [logseq.db :as ldb]
            [logseq.graph-parser.datascript-report :as ds-report]))

(defn filter-deleted-blocks
  [datoms]
  (keep
   (fn [d]
     (when (and (= :block/uuid (:a d)) (false? (:added d)))
       (:v d)))
   datoms))

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
  (let [blocks (remove :block/name blocks*)
        *computed-ids (atom #{})]
    (mapcat (fn [block]
              (when (and (not (@*computed-ids (:block/uuid block))) ; not computed yet
                         (not (:block/name block)))
                (let [parents (ldb/get-block-parents db-after (:block/uuid block) {})
                      parents-refs (->> (mapcat :block/path-refs parents)
                                        (map :db/id))
                      old-refs (if db-before
                                 (set (map :db/id (:block/path-refs (d/entity db-before (:db/id block)))))
                                 #{})
                      new-refs (set (concat
                                     (some-> (:db/id (:block/page block)) vector)
                                     (map :db/id (:block/refs block))
                                     parents-refs))
                      refs-changed? (not= old-refs new-refs)
                      children (ldb/get-block-children-ids db-after (:block/uuid block))
                            ;; Builds map of children ids to their parent id and :block/refs ids
                      children-maps (into {}
                                          (map (fn [id]
                                                 (let [entity (d/entity db-after [:block/uuid id])]
                                                   [(:db/id entity)
                                                    {:parent-id (get-in entity [:block/parent :db/id])
                                                     :block-ref-ids (map :db/id (:block/refs entity))}]))
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
                  (swap! *computed-ids set/union (set (cons (:block/uuid block) children)))
                  (concat
                   (when (and (seq new-refs) refs-changed?)
                     [{:db/id (:db/id block)
                       :block/path-refs new-refs}])
                   children-refs))))
            blocks)))

(defn compute-block-path-refs-tx
  [tx-report blocks]
  (let [refs-tx (compute-block-path-refs tx-report blocks)
        truncate-refs-tx (map (fn [m] [:db/retract (:db/id m) :block/path-refs]) refs-tx)]
    (concat truncate-refs-tx refs-tx)))

(defn- invoke-hooks
  "Modified copy of frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :pipeline-replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          block-path-refs-tx (distinct (compute-block-path-refs-tx tx-report blocks))]
      (when (seq block-path-refs-tx)
        (d/transact! conn block-path-refs-tx {:pipeline-replace? true})))))

(defn add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))
